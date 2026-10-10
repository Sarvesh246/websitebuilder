-- Apply before deploying the matching application changes. Serializes cumulative refund notifications,
-- ledger insertion and project/source-payment state in one transaction. Service role only.
create or replace function public.record_refund_total(
  p_project_id uuid, p_payment_intent_id text, p_refunded_total integer, p_refund_id text default null
) returns boolean language plpgsql security invoker set search_path = public as $$
declare
  project public.project_requests%rowtype;
  source public.payments%rowtype;
  previous integer;
  refunded integer;
  fully_refunded boolean;
  changed boolean := false;
begin
  select * into project from public.project_requests where id = p_project_id for update;
  if not found then return false; end if;
  select * into source from public.payments
    where project_id = p_project_id and stripe_payment_intent_id = p_payment_intent_id and type <> 'refund' limit 1;
  if not found then raise exception 'refund_source_missing'; end if;
  if source.status not in ('succeeded', 'partially_refunded', 'refunded') then raise exception 'refund_source_unpaid'; end if;
  if source.currency <> project.currency then raise exception 'refund_currency_mismatch'; end if;
  if p_refunded_total is null or p_refunded_total < 0 or p_refunded_total > source.amount then
    raise exception 'invalid_refund_total';
  end if;
  -- Zero is a read-only readiness check used before making an irreversible Stripe call.
  if p_refunded_total = 0 then return false; end if;
  select coalesce(sum(amount), 0)::integer into previous from public.payments
    where project_id = p_project_id and type = 'refund' and status = 'succeeded'
      and starts_with(idempotency_key, 'refund:' || p_payment_intent_id || ':');
  if p_refunded_total > previous then
    insert into public.payments(project_id, type, status, amount, currency, idempotency_key, stripe_refund_id, paid_at)
    values(p_project_id, 'refund', 'succeeded', p_refunded_total - previous, project.currency,
      'refund:' || p_payment_intent_id || ':' || p_refunded_total, p_refund_id, now());
    changed := true;
  end if;
  select coalesce(sum(amount), 0)::integer into refunded from public.payments where project_id = p_project_id and type = 'refund' and status = 'succeeded';
  fully_refunded := coalesce(project.amount_paid, 0) > 0 and refunded >= project.amount_paid;
  update public.project_requests set refunded_amount = refunded,
    refund_status = case when fully_refunded then 'full' else 'partial' end,
    payment_status = case when dispute_status = 'open' then 'disputed' when fully_refunded then 'refunded' else 'partially_refunded' end
    where id = p_project_id;
  update public.payments set status = case when greatest(previous, p_refunded_total) >= source.amount then 'refunded' else 'partially_refunded' end
    where id = source.id;
  if changed then
    insert into public.project_events(project_id, kind, title, actor_role)
      values(p_project_id, 'refund', case when fully_refunded then 'Payment refunded' else 'Payment partially refunded' end, 'system');
  end if;
  return changed;
end $$;
revoke all on function public.record_refund_total(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.record_refund_total(uuid, text, integer, text) to service_role;
