-- Approval and feedback submission share the project lock so they cannot race a final charge.
create or replace function public.approve_project_review(p_project_id uuid)
returns boolean
language plpgsql security invoker set search_path = public as $$
declare p public.project_requests;
begin
  select * into p from public.project_requests where id = p_project_id for update;
  if not found or p.approved_at is not null or p.initial_payment_status <> 'paid'
     or p.preview_url is null or p.preview_url = ''
     or p.status not in ('client_review', 'review', 'awaiting_client', 'revisions') then return false; end if;
  if exists (select 1 from public.feedback_rounds where project_id = p_project_id and status = 'submitted') then return false; end if;
  update public.project_requests set approved_at = now(), updated_at = now() where id = p_project_id;
  return true;
end $$;
revoke all on function public.approve_project_review(uuid) from public, anon, authenticated;
grant execute on function public.approve_project_review(uuid) to service_role;

create or replace function public.submit_feedback_round(p_project_id uuid)
returns table (round_number integer, is_extra boolean)
language plpgsql security invoker set search_path = public as $$
declare
  r public.feedback_rounds;
  p public.project_requests;
begin
  select * into p from public.project_requests where id = p_project_id for update;
  if not found or p.approved_at is not null or p.initial_payment_status <> 'paid'
     or p.preview_url is null or p.preview_url = ''
     or p.status not in ('client_review', 'review', 'awaiting_client', 'revisions') then return; end if;
  if exists (select 1 from public.feedback_rounds where project_id = p_project_id and status = 'submitted') then return; end if;
  select * into r from public.feedback_rounds where project_id = p_project_id and status = 'draft' for update;
  if not found or not exists (select 1 from public.feedback_items where round_id = r.id) then return; end if;
  update public.feedback_rounds set status = 'submitted', submitted_at = now(), extra = p.revisions_used >= p.revisions_included where id = r.id;
  update public.project_requests set revisions_used = revisions_used + 1,
    status = case when status in ('client_review', 'review', 'awaiting_client') then 'revisions' else status end,
    updated_at = now() where id = p_project_id;
  return query select r.number, p.revisions_used >= p.revisions_included;
end $$;
revoke all on function public.submit_feedback_round(uuid) from public, anon, authenticated;
grant execute on function public.submit_feedback_round(uuid) to service_role;
