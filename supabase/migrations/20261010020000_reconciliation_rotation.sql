-- Keep cron rotation separate from project updated_at (messages and final-charge claim age use it).
create table public.payment_reconciliation (
  project_id uuid primary key references public.project_requests(id) on delete cascade,
  checked_at timestamptz not null default now()
);
alter table public.payment_reconciliation enable row level security;
alter table public.payment_reconciliation force row level security;
revoke all on table public.payment_reconciliation from public, anon, authenticated;
grant all on table public.payment_reconciliation to service_role;
create index payment_reconciliation_checked_idx on public.payment_reconciliation (checked_at);

create or replace function public.payment_reconciliation_queue(p_since timestamptz, p_limit integer)
returns setof public.project_requests
language sql stable security invoker set search_path = public as $$
  select p.* from public.project_requests p
  left join public.payment_reconciliation r on r.project_id = p.id
  where p.created_at >= p_since
    or (p.status not in ('completed', 'cancelled') and (
      p.stripe_deposit_pi is not null or p.stripe_final_pi is not null
      or exists (select 1 from public.payments where project_id = p.id)
    ))
  order by r.checked_at asc nulls first, p.created_at asc, p.id asc
  limit greatest(0, least(p_limit, 500));
$$;
revoke all on function public.payment_reconciliation_queue(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.payment_reconciliation_queue(timestamptz, integer) to service_role;
