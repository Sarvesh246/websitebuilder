-- Stripe payments for project requests. Additive: existing rows stay valid.
-- Money is integer cents. Every column here is written ONLY by server code (service role); RLS on
-- project_requests already denies anon/authenticated, and the new tables get the same treatment.
-- Apply after 20260928000000_project_requests.sql (Supabase SQL editor or `supabase db push`).

-- ---------------------------------------------------------------------------------------------
-- 1. project_requests: agreed price snapshot, payment state, consent, cancellation/refund state
-- ---------------------------------------------------------------------------------------------
alter table public.project_requests
  add column if not exists currency text not null default 'usd' check (currency = 'usd'),
  -- Price snapshot taken when the request is stored (Custom: set later by staff). Never recomputed
  -- from the website's current prices once set.
  add column if not exists total_cents integer check (total_cents >= 0),
  add column if not exists deposit_cents integer check (deposit_cents >= 0),
  add column if not exists remaining_cents integer check (remaining_cents >= 0),
  add column if not exists initial_payment_status text not null default 'not_required'
    check (initial_payment_status in ('not_required','pending','processing','succeeded','failed','requires_action','cancelled')),
  add column if not exists final_payment_status text not null default 'not_required'
    check (final_payment_status in ('not_required','pending','processing','succeeded','failed','requires_action','cancelled')),
  add column if not exists stripe_payment_intent_id text,        -- initial payment
  add column if not exists final_payment_intent_id text,         -- final balance
  add column if not exists stripe_payment_method_id text,        -- reusable card saved by the initial checkout
  add column if not exists initial_paid_at timestamptz,
  add column if not exists final_paid_at timestamptz,
  add column if not exists revisions_completed_at timestamptz,
  add column if not exists final_attempted_at timestamptz,
  add column if not exists final_attempts integer not null default 0,
  -- Consent evidence
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists payment_terms_accepted boolean not null default false,
  add column if not exists future_charge_authorized boolean not null default false,
  -- Cancellation / refund / dispute
  add column if not exists cancellation_requested_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists refund_status text not null default 'none'
    check (refund_status in ('none','partial','refunded','failed')),
  add column if not exists stripe_refund_id text,
  add column if not exists refunded_cents integer not null default 0 check (refunded_cents >= 0),
  add column if not exists refunded_at timestamptz,
  add column if not exists dispute_id text,
  add column if not exists disputed_at timestamptz;

-- Workflow (status) is separate from money (payment_status). New workflow values for the final stage;
-- existing meanings: in_progress = building, review = client review.
alter table public.project_requests drop constraint if exists project_requests_status_check;
alter table public.project_requests add constraint project_requests_status_check check (status in (
  'new','contacted','awaiting_payment','paid','in_progress','awaiting_client','review',
  'revisions','awaiting_final_payment','ready_for_launch','completed','cancelled'
));
alter table public.project_requests drop constraint if exists project_requests_payment_status_check;
alter table public.project_requests add constraint project_requests_payment_status_check check (payment_status in (
  'unpaid','pending','paid','partially_paid','failed','partially_refunded','refunded','disputed'
));

alter table public.project_requests drop constraint if exists project_requests_amounts_check;
alter table public.project_requests add constraint project_requests_amounts_check check (
  (total_cents is null and deposit_cents is null and remaining_cents is null)
  or (total_cents is not null and deposit_cents is not null and remaining_cents is not null
      and deposit_cents <= total_cents and remaining_cents <= total_cents)
);

create unique index if not exists project_requests_pi_idx on public.project_requests (stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create unique index if not exists project_requests_final_pi_idx on public.project_requests (final_payment_intent_id) where final_payment_intent_id is not null;
create index if not exists project_requests_customer_idx on public.project_requests (stripe_customer_id) where stripe_customer_id is not null;

-- ---------------------------------------------------------------------------------------------
-- 2. payments: one row per payment obligation (full | deposit | final_balance) plus refund rows.
--    The obligation row is updated in place across attempts (auto charge, then fallback checkout),
--    so a project never gets two unrelated final orders.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_requests (id) on delete restrict,
  kind text not null check (kind in ('full','deposit','final_balance','refund')),
  status text not null default 'pending' check (status in (
    'pending','processing','succeeded','failed','requires_action','cancelled','refunded','partially_refunded'
  )),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd' check (currency = 'usd'),
  refunded_cents integer not null default 0 check (refunded_cents >= 0),
  checkout_seq integer not null default 0,                  -- bumps only when a Checkout Session expired
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_refund_id text unique,                             -- refund rows only
  failure_code text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- At most one obligation of each kind per project (refund rows are many).
create unique index if not exists payments_one_obligation_idx on public.payments (project_id, kind) where kind <> 'refund';
create index if not exists payments_project_idx on public.payments (project_id);
create index if not exists payments_pi_idx on public.payments (stripe_payment_intent_id) where stripe_payment_intent_id is not null;

-- ---------------------------------------------------------------------------------------------
-- 3. stripe_webhook_events: replay protection. processed_at is set only after the handler finished.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create or replace function public.payments_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at before update on public.payments
  for each row execute function public.payments_touch_updated_at();

-- Security: deny-all for browser roles, service role only.
alter table public.payments enable row level security;
alter table public.payments force row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.stripe_webhook_events force row level security;
revoke all on table public.payments, public.stripe_webhook_events from anon, authenticated;
revoke all on function public.payments_touch_updated_at() from anon, authenticated, public;
grant select, insert, update, delete on table public.payments, public.stripe_webhook_events to service_role;
