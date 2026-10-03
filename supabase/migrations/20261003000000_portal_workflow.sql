-- Portal workflow: preview feedback rounds, content intake checklist, payment receipts, live messages.
-- Apply in the Supabase SQL editor after 20260930000000_portal.sql.
-- Same model as before: every write is a server action using the service role after an ownership/admin
-- check. Browser roles only get owner-scoped SELECT (plus admin SELECT on messages for realtime).

-- ---------------------------------------------------------------- helpers
-- True when the signed-in user is a studio admin. Security definer so policies can call it without
-- needing SELECT on other people's profile rows.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------- receipts
alter table public.payments
  add column receipt_url text check (receipt_url is null or (char_length(receipt_url) <= 500 and receipt_url like 'https://%'));
grant select (receipt_url) on public.payments to authenticated;

-- ---------------------------------------------------------------- feedback rounds
-- A round is one batch of preview feedback. The client drafts comments, then submits the round, which
-- uses one revision. Only the service role writes; submit is atomic via submit_feedback_round().
create table public.feedback_rounds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete cascade,
  number integer not null check (number >= 1),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'resolved')),
  extra boolean not null default false, -- submitted beyond the included revisions
  submitted_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, number)
);
-- At most one draft per project, so concurrent "add comment" calls share it.
create unique index feedback_rounds_one_draft on public.feedback_rounds (project_id) where status = 'draft';

create table public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete cascade,
  round_id uuid not null references public.feedback_rounds (id) on delete cascade,
  page text check (char_length(page) <= 120),
  body text not null check (char_length(body) between 1 and 2000),
  file_id uuid references public.project_files (id) on delete set null, -- optional screenshot
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now()
);
create index feedback_items_round_idx on public.feedback_items (round_id, created_at);

-- Submits the project's draft round, uses one revision and moves a project in review into revisions,
-- all in one transaction. Returns the round number, or nothing when there is no draft with comments
-- (double clicks and races submit once).
create or replace function public.submit_feedback_round(p_project_id uuid)
returns table (round_number integer, is_extra boolean)
language plpgsql security invoker set search_path = public as $$
declare
  r public.feedback_rounds;
  p public.project_requests;
begin
  select * into p from public.project_requests where id = p_project_id for update;
  if not found then return; end if;
  select * into r from public.feedback_rounds
   where project_id = p_project_id and status = 'draft' for update;
  if not found or not exists (select 1 from public.feedback_items where round_id = r.id) then return; end if;
  update public.feedback_rounds
     set status = 'submitted', submitted_at = now(), extra = p.revisions_used >= p.revisions_included
   where id = r.id;
  update public.project_requests
     set revisions_used = revisions_used + 1,
         status = case when status in ('client_review', 'review', 'awaiting_client') then 'revisions' else status end,
         updated_at = now()
   where id = p_project_id;
  return query select r.number, p.revisions_used >= p.revisions_included;
end $$;
revoke all on function public.submit_feedback_round(uuid) from public, anon, authenticated;
grant execute on function public.submit_feedback_round(uuid) to service_role;

-- Marks a sent round addressed (and its comments done) and sends a project in revisions back to review,
-- so the client is asked to look again. Returns false when the round was not in progress.
create or replace function public.resolve_feedback_round(p_round_id uuid)
returns boolean
language plpgsql security invoker set search_path = public as $$
declare
  r public.feedback_rounds;
begin
  update public.feedback_rounds set status = 'resolved', resolved_at = now()
   where id = p_round_id and status = 'submitted'
  returning * into r;
  if not found then return false; end if;
  update public.feedback_items set status = 'done' where round_id = r.id;
  update public.project_requests
     set status = case when status = 'revisions' then 'client_review' else status end, updated_at = now()
   where id = r.project_id;
  return true;
end $$;
revoke all on function public.resolve_feedback_round(uuid) from public, anon, authenticated;
grant execute on function public.resolve_feedback_round(uuid) to service_role;

-- ---------------------------------------------------------------- content intake checklist
-- The list of items comes from config (per package); rows only store what the client has done.
-- Custom items the studio adds get a key starting with "custom:" and carry their own label.
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 60),
  label text check (char_length(label) <= 120),
  status text not null default 'needed' check (status in ('needed', 'provided', 'skipped')),
  answer text check (char_length(answer) <= 300),
  file_id uuid references public.project_files (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);

-- ---------------------------------------------------------------- security
alter table public.feedback_rounds enable row level security;
alter table public.feedback_items enable row level security;
alter table public.checklist_items enable row level security;
alter table public.feedback_rounds force row level security;
alter table public.feedback_items force row level security;
alter table public.checklist_items force row level security;

revoke all on table public.feedback_rounds, public.feedback_items, public.checklist_items from anon, authenticated;
grant all on table public.feedback_rounds, public.feedback_items, public.checklist_items to service_role;

create policy "own feedback rounds" on public.feedback_rounds for select to authenticated
  using (project_id in (select id from public.project_requests where user_id = (select auth.uid())));
create policy "own feedback items" on public.feedback_items for select to authenticated
  using (project_id in (select id from public.project_requests where user_id = (select auth.uid())));
create policy "own checklist" on public.checklist_items for select to authenticated
  using (project_id in (select id from public.project_requests where user_id = (select auth.uid())));
grant select on public.feedback_rounds, public.feedback_items, public.checklist_items to authenticated;

-- ---------------------------------------------------------------- uploads
-- Browsers upload straight to storage with one-time signed URLs, so the bucket itself enforces the size
-- and type rules too (mirrors src/config/uploads.ts).
update storage.buckets
   set file_size_limit = 26214400,
       allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'application/zip',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
 where id = 'project-files';

-- ---------------------------------------------------------------- live messages
-- Realtime delivers a change only to users whose RLS lets them SELECT the row. Owners already can;
-- admins get read access here so their inbox updates live too.
create policy "admin messages" on public.messages for select to authenticated using ((select public.is_admin()));
alter publication supabase_realtime add table public.messages;
