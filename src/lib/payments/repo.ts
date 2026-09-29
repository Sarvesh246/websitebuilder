import "server-only";
import { createAdminClient } from "@/utils/supabase/server";

/**
 * Database access for payments, behind a small interface so the money logic is unit-testable with an
 * in-memory fake. The Supabase implementation uses the service role: callers must have authorized first.
 */
export type ProjectPayRow = {
  id: string;
  user_id: string | null;
  package: "launch" | "presence" | "business" | "custom";
  email: string;
  client_name: string;
  status: string;
  payment_status: string;
  currency: string;
  total_amount: number | null;
  deposit_amount: number | null;
  remaining_amount: number | null;
  amount_paid: number | null;
  initial_payment_status: string;
  final_payment_status: string;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  stripe_deposit_pi: string | null;
  stripe_final_pi: string | null;
  initial_paid_at: string | null;
  final_paid_at: string | null;
  cancellation_requested_at: string | null;
  refund_status: string;
  refunded_amount: number;
  dispute_status: string | null;
  /** Write-only from this module (not selected back). */
  terms_accepted_at?: string;
  terms_version?: string;
  future_charge_authorized?: boolean;
  stripe_session_id?: string;
  cancelled_at?: string | null;
};

export type LedgerType = "full" | "deposit" | "final_balance" | "refund";
export type LedgerStatus = "pending" | "processing" | "succeeded" | "failed" | "requires_action" | "cancelled" | "refunded" | "partially_refunded";

export type LedgerRow = {
  id: string;
  project_id: string;
  type: LedgerType;
  status: LedgerStatus;
  amount: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  failure_reason: string | null;
  idempotency_key: string;
  created_at: string;
  paid_at: string | null;
};

export type LedgerInsert = Omit<LedgerRow, "id" | "created_at" | "paid_at" | "stripe_session_id" | "stripe_payment_intent_id" | "stripe_refund_id" | "failure_reason"> &
  Partial<Pick<LedgerRow, "stripe_session_id" | "stripe_payment_intent_id" | "stripe_refund_id" | "failure_reason" | "paid_at">>;

export type ClaimedFinal = { id: string; remaining_amount: number; currency: string; stripe_customer_id: string | null; stripe_payment_method_id: string | null };

/** Allowed current values per column: a patch applies only if every listed column matches (compare-and-set). */
export type Guard = Partial<Record<keyof ProjectPayRow, readonly (string | number | null)[]>>;

export type PaymentsRepo = {
  getProject(id: string): Promise<ProjectPayRow | null>;
  updateProject(id: string, patch: Partial<ProjectPayRow>): Promise<void>;
  /** Applies the patch only when the guard holds; returns whether it applied. The basis of idempotent state changes. */
  updateProjectIf(id: string, patch: Partial<ProjectPayRow>, guard: Guard): Promise<boolean>;
  /** Atomic claim of the right to attempt the final charge (SQL function claim_final_payment). */
  claimFinalPayment(id: string): Promise<ClaimedFinal | null>;

  getProfileCustomerId(userId: string): Promise<string | null>;
  setProfileCustomerId(userId: string, customerId: string): Promise<void>;

  getLedgerByKey(key: string): Promise<LedgerRow | null>;
  getLedgerById(id: string): Promise<LedgerRow | null>;
  /** Inserts, or returns the existing row when the idempotency key is already taken. */
  upsertLedger(row: LedgerInsert): Promise<LedgerRow>;
  updateLedger(id: string, patch: Partial<LedgerRow>): Promise<void>;
  listLedger(projectId: string): Promise<LedgerRow[]>;
  findLedgerByPaymentIntent(paymentIntentId: string): Promise<LedgerRow | null>;
  countFinalAttempts(projectId: string): Promise<number>;

  /** True when the event was new; false when it was already recorded. */
  recordWebhookEvent(eventId: string, type: string): Promise<boolean>;
  forgetWebhookEvent(eventId: string): Promise<void>;

  addEvent(projectId: string, kind: string, title: string, actorRole: "client" | "admin" | "system"): Promise<void>;
};

const PROJECT_COLUMNS =
  "id, user_id, package, email, client_name, status, payment_status, currency, total_amount, deposit_amount, remaining_amount, amount_paid, initial_payment_status, final_payment_status, stripe_customer_id, stripe_payment_method_id, stripe_deposit_pi, stripe_final_pi, initial_paid_at, final_paid_at, cancellation_requested_at, refund_status, refunded_amount, dispute_status";
const LEDGER_COLUMNS =
  "id, project_id, type, status, amount, currency, stripe_session_id, stripe_payment_intent_id, stripe_refund_id, failure_reason, idempotency_key, created_at, paid_at";

export class PaymentsStorageError extends Error {}

const fail = (code: string): never => {
  throw new PaymentsStorageError(code);
};

export const supabasePaymentsRepo = (): PaymentsRepo => {
  const db = createAdminClient();
  if (!db) throw new PaymentsStorageError("not_configured");

  const one = async <T>(query: PromiseLike<{ data: T | null; error: { code?: string } | null }>): Promise<T | null> => {
    const { data, error } = await query;
    if (error) fail(`db_${error.code ?? "error"}`);
    return data;
  };
  const check = async (query: PromiseLike<{ error: { code?: string } | null }>) => {
    const { error } = await query;
    if (error) fail(`db_${error.code ?? "error"}`);
  };

  return {
    getProject: (id) => one(db.from("project_requests").select(PROJECT_COLUMNS).eq("id", id).maybeSingle<ProjectPayRow>()),

    updateProject: (id, patch) => check(db.from("project_requests").update(patch).eq("id", id)),

    updateProjectIf: async (id, patch, guard) => {
      let query = db.from("project_requests").update(patch).eq("id", id);
      for (const [column, allowed] of Object.entries(guard)) {
        if (!allowed) continue;
        const values = allowed.filter((v): v is string | number => v !== null);
        query = allowed.includes(null) ? query.or(`${column}.is.null,${column}.in.(${values.join(",")})`) : query.in(column, values);
      }
      const { data, error } = await query.select("id");
      if (error) fail(`db_${error.code ?? "error"}`);
      return (data?.length ?? 0) > 0;
    },

    claimFinalPayment: async (id) => {
      const { data, error } = await db.rpc("claim_final_payment", { p_project_id: id });
      if (error) return fail(`db_${error.code ?? "error"}`);
      const rows = (data ?? []) as ClaimedFinal[];
      return rows[0] ?? null;
    },

    getProfileCustomerId: async (userId) => {
      const row = await one(db.from("profiles").select("stripe_customer_id").eq("id", userId).maybeSingle<{ stripe_customer_id: string | null }>());
      return row?.stripe_customer_id ?? null;
    },
    setProfileCustomerId: (userId, customerId) => check(db.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId)),

    getLedgerByKey: (key) => one(db.from("payments").select(LEDGER_COLUMNS).eq("idempotency_key", key).maybeSingle<LedgerRow>()),
    getLedgerById: (id) => one(db.from("payments").select(LEDGER_COLUMNS).eq("id", id).maybeSingle<LedgerRow>()),

    upsertLedger: async (row) => {
      const { data, error } = await db.from("payments").insert(row).select(LEDGER_COLUMNS).single<LedgerRow>();
      if (data) return data;
      if (error?.code === "23505") {
        const existing = await one(db.from("payments").select(LEDGER_COLUMNS).eq("idempotency_key", row.idempotency_key).maybeSingle<LedgerRow>());
        if (existing) return existing;
      }
      return fail(`db_${error?.code ?? "error"}`);
    },

    updateLedger: (id, patch) => check(db.from("payments").update(patch).eq("id", id)),

    listLedger: async (projectId) => {
      const { data, error } = await db.from("payments").select(LEDGER_COLUMNS).eq("project_id", projectId).order("created_at", { ascending: true });
      if (error) fail(`db_${error.code ?? "error"}`);
      return (data ?? []) as LedgerRow[];
    },

    findLedgerByPaymentIntent: (pi) =>
      one(db.from("payments").select(LEDGER_COLUMNS).eq("stripe_payment_intent_id", pi).neq("type", "refund").limit(1).maybeSingle<LedgerRow>()),

    countFinalAttempts: async (projectId) => {
      const { count, error } = await db
        .from("payments")
        .select("id", { count: "exact", head: true })
        .like("idempotency_key", `project:${projectId}:final:attempt:%`);
      if (error) fail(`db_${error.code ?? "error"}`);
      return count ?? 0;
    },

    recordWebhookEvent: async (eventId, type) => {
      const { error } = await db.from("stripe_webhook_events").insert({ event_id: eventId, event_type: type });
      if (!error) return true;
      if (error.code === "23505") return false;
      return fail(`db_${error.code ?? "error"}`);
    },
    forgetWebhookEvent: (eventId) => check(db.from("stripe_webhook_events").delete().eq("event_id", eventId)),

    addEvent: (projectId, kind, title, actorRole) =>
      check(db.from("project_events").insert({ project_id: projectId, kind, title, actor_role: actorRole })),
  };
};
