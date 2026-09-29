import { paymentTerms } from "@/config/payment";

/** Fields the payment rules need; a subset of the project row. */
export type RuleProject = {
  status: string;
  payment_status: string;
  initial_payment_status: string;
  final_payment_status: string;
  remaining_cents: number | null;
  total_cents: number | null;
  final_attempted_at: string | null;
  refunded_cents: number;
  amount_paid: number | null;
  initial_paid_at: string | null;
};

/** A claim left in "processing" this long (server died mid-charge) may be retried; the Stripe idempotency key makes that safe. */
export const STALE_PROCESSING_MS = 2 * 60_000;

/** Workflow states from which the studio may declare revisions complete. */
export const REVISION_DONE_FROM = ["review", "revisions"] as const;

export type Eligibility = { ok: true } | { ok: false; reason: "not_ready" | "no_balance" | "already_paid" | "in_progress" | "already_attempted" | "blocked" };

/** Final balance may be collected only after the revision stage, once, and never for cancelled/disputed/refunded projects. */
export const finalEligibility = (p: RuleProject, now = Date.now()): Eligibility => {
  if (p.status === "cancelled" || p.payment_status === "disputed" || p.refunded_cents > 0) return { ok: false, reason: "blocked" };
  if (p.final_payment_status === "succeeded") return { ok: false, reason: "already_paid" };
  if (p.initial_payment_status !== "succeeded" || !p.remaining_cents || p.remaining_cents <= 0) return { ok: false, reason: "no_balance" };
  if (!(REVISION_DONE_FROM as readonly string[]).includes(p.status) && p.final_payment_status !== "processing") {
    return { ok: false, reason: p.status === "awaiting_final_payment" ? "already_attempted" : "not_ready" };
  }
  if (p.final_payment_status === "processing") {
    const started = p.final_attempted_at ? Date.parse(p.final_attempted_at) : 0;
    return now - started >= STALE_PROCESSING_MS ? { ok: true } : { ok: false, reason: "in_progress" };
  }
  // failed / requires_action: no automatic retry against a declined card. The customer pays via Checkout.
  return p.final_payment_status === "pending" ? { ok: true } : { ok: false, reason: "already_attempted" };
};

/** Which Checkout (if any) a customer can start right now. Chosen server-side, never by the browser. */
export const checkoutStage = (p: RuleProject): "initial" | "final" | "already_paid" | "processing" | "not_due" | "blocked" => {
  if (p.status === "cancelled" || p.payment_status === "disputed" || p.refunded_cents > 0) return "blocked";
  if (p.initial_payment_status !== "succeeded") return p.initial_payment_status === "processing" ? "processing" : "initial";
  if (p.final_payment_status === "failed" || p.final_payment_status === "requires_action") return "final";
  if (p.final_payment_status === "processing") return "processing";
  return p.final_payment_status === "pending" ? "not_due" : "already_paid";
};

/** Stripe decline codes that mean "customer must act", vs a plain failure. Either way the project is NOT paid. */
export const classifyChargeFailure = (code: string | undefined): { status: "failed" | "requires_action"; code: string } =>
  code === "authentication_required" || code === "requires_action"
    ? { status: "requires_action", code: "authentication_required" }
    : { status: "failed", code: code ?? "card_declined" };

/** Inside the published 3-day window? Informational only: refunds are never issued automatically. */
export const withinCancellationWindow = (initialPaidAt: string | null, now = Date.now()) =>
  !!initialPaidAt && now - Date.parse(initialPaidAt) <= paymentTerms.cancellation.windowDays * 86_400_000;

/** Largest refund still allowed against a payment. */
export const refundableCents = (paid: number, refunded: number) => Math.max(0, paid - refunded);
