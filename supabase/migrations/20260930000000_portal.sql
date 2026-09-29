-- Portal: accounts, project workflow, payments ledger, messages, files.
-- Apply in the Supabase SQL editor after 20260928000000_project_requests.sql.
-- Model: a project IS a project_requests row. Deposit and final payment are two obligations on that one
-- row (never two orders). All writes happen server-side with the service role after an explicit
-- ownership/admin check. Browser roles get SELECT on their own rows only, and never on secrets.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'client' check (role in ('client', 'admin')),
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- project_requests: portal columns
alter table public.project_requests
  add column user_id uuid references auth.users (id) on delete set null,
  add column deadline date,
  add column preview_url text check (char_length(preview_url) <= 500),
  add column revisions_included integer not null default 1 check (revisions_included >= 0),
  add column revisions_used integer not null default 0 check (revisions_used >= 0),
  add column approved_at timestamptz,
  -- Price snapshot (cents). Set once at project creation; later price changes never alter it.
  add column currency text not null default 'usd' check (currency = lower(currency) and char_length(currency) = 3),
  add column total_amount integer check (total_amount >= 0),
  add column deposit_amount integer check (deposit_amount >= 0),
  add column remaining_amount integer check (remaining_amount >= 0),
  add column initial_payment_status text not null default 'pending'
    check (initial_payment_status in ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  add column final_payment_status text not null default 'pending'
    check (final_payment_status in ('pending', 'processing', 'paid', 'failed', 'requires_action', 'not_required')),
  add column stripe_deposit_pi text unique,
  add column stripe_final_pi text unique,
  add column stripe_payment_method_id text, -- server only, hidden from browser roles
  add column initial_paid_at timestamptz,
  add column final_paid_at timestamptz,
  add column terms_accepted_at timestamptz,
  add column terms_version text,
  add column future_charge_authorized boolean not null default false,
  add column cancellation_requested_at timestamptz,
  add column cancelled_at timestamptz,
  add column refund_status text not null default 'none' check (refund_status in ('none', 'partial', 'full')),
  add column refunded_amount integer not null default 0 check (refunded_amount >= 0),
  add column dispute_status text check (dispute_status in ('open', 'won', 'lost')),
  -- remaining_amount falls to 0 once the final payment lands, so the invariant is an upper bound.
  add constraint project_requests_amounts_check
    check (total_amount is null or (deposit_amount is not null and remaining_amount is not null
      and deposit_amount <= total_amount and remaining_amount <= total_amount));

alter table public.project_requests drop constraint project_requests_status_check;
alter table public.project_requests add constraint project_requests_status_check check (status in (
  'new', 'contacted', 'awaiting_payment', 'paid', 'in_progress', 'awaiting_client', 'review', 'completed', 'cancelled',
  'requested', 'accepted', 'building', 'client_review', 'revisions', 'awaiting_final_payment', 'ready_for_launch'));
alter table public.project_requests drop constraint project_requests_payment_status_check;
alter table public.project_requests add constraint project_requests_payment_status_check check (payment_status in (
  'unpaid', 'pending', 'paid', 'partially_paid', 'refunded', 'failed',
  'deposit_paid', 'processing', 'payment_failed', 'partially_refunded', 'disputed'));

create index project_requests_user_id_idx on public.project_requests (user_id);
create index project_requests_deadline_idx on public.project_requests (deadline) where deadline is not null;

-- ---------------------------------------------------------------- payments (immutable ledger)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete cascade,
  type text not null check (type in ('full', 'deposit', 'final_balance', 'refund')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'requires_action', 'cancelled', 'refunded', 'partially_refunded')),
  amount integer not null check (amount >= 0), -- cents
  currency text not null default 'usd',
  stripe_session_id text,
  stripe_payment_intent_id text,
  stripe_refund_id text,
  failure_reason text check (char_length(failure_reason) <= 200),
  idempotency_key text not null unique, -- e.g. project:{id}:deposit, project:{id}:final
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index payments_project_idx on public.payments (project_id, created_at desc);
create unique index payments_pi_type_idx on public.payments (stripe_payment_intent_id, type) where stripe_payment_intent_id is not null;

create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- workflow tables
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  detail text check (char_length(detail) <= 400),
  position integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'active', 'done')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index milestones_project_idx on public.milestones (project_id, position);

create table public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete cascade,
  kind text not null check (char_length(kind) <= 40),
  title text not null check (char_length(title) <= 200),
  actor_role text check (actor_role in ('client', 'admin', 'system')),
  created_at timestamptz not null default now()
);
create index project_events_project_idx on public.project_events (project_id, created_at desc);

create table public.project_notes ( -- admin only, never exposed to browser roles
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index project_notes_project_idx on public.project_notes (project_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete cascade,
  sender_id uuid references auth.users (id) on delete set null,
  sender_role text not null check (sender_role in ('client', 'admin')),
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_project_idx on public.messages (project_id, created_at);
create index messages_unread_idx on public.messages (project_id) where read_at is null;

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete cascade,
  uploader_id uuid references auth.users (id) on delete set null,
  uploader_role text not null check (uploader_role in ('client', 'admin')),
  path text not null unique, -- key inside the private bucket "project-files"
  name text not null check (char_length(name) <= 200),
  size_bytes integer not null check (size_bytes between 0 and 26214400),
  mime_type text check (char_length(mime_type) <= 120),
  created_at timestamptz not null default now()
);
create index project_files_project_idx on public.project_files (project_id, created_at desc);

-- ---------------------------------------------------------------- final payment claim (atomic)
-- Exactly one caller wins the right to attempt the final charge; concurrent or repeated calls get null.
create or replace function public.claim_final_payment(p_project_id uuid)
returns table (id uuid, remaining_amount integer, currency text, stripe_customer_id text, stripe_payment_method_id text)
language sql security invoker set search_path = public as $$
  update public.project_requests p
     set final_payment_status = 'processing'
   where p.id = p_project_id
     and p.remaining_amount > 0
     and p.initial_payment_status = 'paid'
     and p.final_payment_status in ('pending', 'failed', 'requires_action')
     and p.status not in ('cancelled', 'completed')
  returning p.id, p.remaining_amount, p.currency, p.stripe_customer_id, p.stripe_payment_method_id;
$$;
revoke all on function public.claim_final_payment(uuid) from public, anon, authenticated;
grant execute on function public.claim_final_payment(uuid) to service_role;

-- ---------------------------------------------------------------- security
-- Every new table: RLS forced, no browser grants except explicit column-limited SELECT below.
alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.milestones enable row level security;
alter table public.project_events enable row level security;
alter table public.project_notes enable row level security;
alter table public.messages enable row level security;
alter table public.project_files enable row level security;
alter table public.profiles force row level security;
alter table public.payments force row level security;
alter table public.stripe_webhook_events force row level security;
alter table public.milestones force row level security;
alter table public.project_events force row level security;
alter table public.project_notes force row level security;
alter table public.messages force row level security;
alter table public.project_files force row level security;

revoke all on table public.profiles, public.payments, public.stripe_webhook_events, public.milestones,
  public.project_events, public.project_notes, public.messages, public.project_files from anon, authenticated;
grant all on table public.profiles, public.payments, public.stripe_webhook_events, public.milestones,
  public.project_events, public.project_notes, public.messages, public.project_files to service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Owner read-only access (defense in depth: the app reads through the server, but a forged REST call
-- can still never see or change anyone else's data, or any secret/financial column).
grant select (id, email, full_name, role, created_at) on public.profiles to authenticated;
create policy "own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));

grant select (id, created_at, updated_at, package, status, payment_status, deadline, preview_url, revisions_included,
  revisions_used, approved_at, currency, total_amount, deposit_amount, remaining_amount, initial_payment_status,
  final_payment_status, initial_paid_at, final_paid_at, cancellation_requested_at, cancelled_at, refund_status,
  refunded_amount, client_name, email, organization, website_type, project_description, user_id)
  on public.project_requests to authenticated;
create policy "own projects" on public.project_requests for select to authenticated using (user_id = (select auth.uid()));

create policy "own payments" on public.payments for select to authenticated
  using (project_id in (select id from public.project_requests where user_id = (select auth.uid())));
grant select (id, project_id, type, status, amount, currency, created_at, paid_at) on public.payments to authenticated;

create policy "own milestones" on public.milestones for select to authenticated
  using (project_id in (select id from public.project_requests where user_id = (select auth.uid())));
grant select on public.milestones to authenticated;

create policy "own events" on public.project_events for select to authenticated
  using (project_id in (select id from public.project_requests where user_id = (select auth.uid())));
grant select on public.project_events to authenticated;

create policy "own messages" on public.messages for select to authenticated
  using (project_id in (select id from public.project_requests where user_id = (select auth.uid())));
grant select on public.messages to authenticated;

create policy "own files" on public.project_files for select to authenticated
  using (project_id in (select id from public.project_requests where user_id = (select auth.uid())));
grant select (id, project_id, uploader_role, name, size_bytes, mime_type, created_at) on public.project_files to authenticated;

-- ---------------------------------------------------------------- storage
-- Private bucket for project files; no storage policies = only the service role can touch objects,
-- and the app hands out short-lived signed URLs after checking ownership.
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 26214400)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- make yourself admin (run once, your email)
-- update public.profiles set role = 'admin' where email = 'you@example.com';
