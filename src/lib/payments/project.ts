import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PackageId } from "@/config/pricing";
import { planForPackage } from "./plan";
import type { RuleProject } from "./rules";
import { getStripe } from "./stripe";
import { createAdminClient } from "@/utils/supabase/server";

export type PaymentErrorCode =
  | "not_configured" | "not_found" | "invalid" | "consent_required" | "no_quote" | "blocked" | "already_paid"
  | "processing" | "not_due" | "not_ready" | "no_balance" | "already_attempted" | "conflict"
  | "stripe_unavailable" | "database" | "amount_invalid";

/** Errors carry a code only; the message shown to people is `paymentMessage`. Details go to server logs. */
export class PaymentError extends Error {
  constructor(public code: PaymentErrorCode) {
    super(code);
  }
}

const messages: Record<PaymentErrorCode, [number, string]> = {
  not_configured: [503, "Online payment isn't available right now. Please try again later."],
  not_found: [404, "We couldn't find that project."],
  invalid: [400, "That request wasn't valid."],
  consent_required: [400, "Please accept the payment terms to continue."],
  no_quote: [409, "This project doesn't have a confirmed price yet. I'll follow up with a quote."],
  blocked: [409, "Payment isn't available for this project."],
  already_paid: [409, "This project is already paid in full."],
  processing: [409, "A payment is being confirmed. Give it a minute, then refresh."],
  not_due: [409, "There's nothing to pay right now. The remaining balance becomes due after your revisions."],
  not_ready: [409, "This project isn't at the stage where that action applies."],
  no_balance: [409, "There is no remaining balance on this project."],
  already_attempted: [409, "The final payment was already attempted. Use the payment link to pay the remaining balance."],
  conflict: [409, "Another update is in progress. Please try again in a moment."],
  stripe_unavailable: [502, "The payment provider is unavailable. Nothing was charged. Please try again shortly."],
  database: [502, "Something went wrong on our side. Nothing was charged. Please try again."],
  amount_invalid: [400, "That amount isn't valid for this project."],
};
export const paymentMessage = (code: PaymentErrorCode) => messages[code][1];
export const paymentStatusCode = (code: PaymentErrorCode) => messages[code][0];

/** Every column the payment code reads. Server-only: never returned as-is to the browser. */
export const PROJECT_COLUMNS =
  "id, client_name, email, package, status, payment_status, currency, total_cents, deposit_cents, remaining_cents, amount_paid, " +
  "initial_payment_status, final_payment_status, stripe_customer_id, stripe_payment_intent_id, final_payment_intent_id, " +
  "stripe_payment_method_id, initial_paid_at, final_paid_at, revisions_completed_at, final_attempted_at, final_attempts, " +
  "terms_version, terms_accepted_at, payment_terms_accepted, future_charge_authorized, cancellation_requested_at, cancelled_at, " +
  "refund_status, refunded_cents, refunded_at, dispute_id";

export type ProjectPayRow = RuleProject & {
  id: string;
  client_name: string;
  email: string;
  package: PackageId;
  currency: string;
  deposit_cents: number | null;
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  final_payment_intent_id: string | null;
  stripe_payment_method_id: string | null;
  final_paid_at: string | null;
  revisions_completed_at: string | null;
  final_attempts: number;
  terms_version: string | null;
  terms_accepted_at: string | null;
  payment_terms_accepted: boolean;
  future_charge_authorized: boolean;
  cancellation_requested_at: string | null;
  cancelled_at: string | null;
  refund_status: string;
  refunded_at: string | null;
  dispute_id: string | null;
};

export type Db = SupabaseClient;

export const adminDb = (): Db => {
  const db = createAdminClient();
  if (!db) throw new PaymentError("not_configured");
  return db;
};

export const requireStripe = () => {
  const stripe = getStripe();
  if (!stripe) throw new PaymentError("not_configured");
  return stripe;
};

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const loadProject = async (db: Db, id: string): Promise<ProjectPayRow> => {
  if (!UUID.test(id)) throw new PaymentError("not_found");
  const { data, error } = await db.from("project_requests").select(PROJECT_COLUMNS).eq("id", id).maybeSingle<ProjectPayRow>();
  if (error) throw new PaymentError("database");
  if (!data) throw new PaymentError("not_found");
  return data;
};

/**
 * Freezes the agreed price on the row the first time it is needed (new requests get it at insert; rows
 * created before payments existed get it here). Conditional on total_cents IS NULL, so an agreed price is
 * never rewritten. Custom has no catalogue price and stays unpriced until staff set a quote.
 */
export const ensureSnapshot = async (db: Db, row: ProjectPayRow): Promise<ProjectPayRow> => {
  if (row.total_cents != null) return row;
  const plan = planForPackage(row.package);
  if (!plan) throw new PaymentError("no_quote");
  const { error } = await db
    .from("project_requests")
    .update(snapshotColumns(plan))
    .eq("id", row.id)
    .is("total_cents", null);
  if (error) throw new PaymentError("database");
  return loadProject(db, row.id);
};

export const snapshotColumns = (plan: { total: number; deposit: number; remaining: number }) => ({
  total_cents: plan.total,
  deposit_cents: plan.deposit,
  remaining_cents: plan.remaining,
  initial_payment_status: "pending",
  final_payment_status: plan.remaining > 0 ? "pending" : "not_required",
});

/** One Stripe Customer per project. The idempotency key makes concurrent creates converge; the DB write is conditional. */
export const ensureCustomer = async (db: Db, row: ProjectPayRow): Promise<string> => {
  if (row.stripe_customer_id) return row.stripe_customer_id;
  const stripe = requireStripe();
  let customerId: string;
  try {
    const customer = await stripe.customers.create(
      { email: row.email, name: row.client_name, metadata: { project_id: row.id } },
      { idempotencyKey: `project:${row.id}:customer` },
    );
    customerId = customer.id;
  } catch {
    throw new PaymentError("stripe_unavailable");
  }
  await db.from("project_requests").update({ stripe_customer_id: customerId }).eq("id", row.id).is("stripe_customer_id", null);
  return (await loadProject(db, row.id)).stripe_customer_id ?? customerId;
};
