import "server-only";
import type Stripe from "stripe";
import { siteConfig } from "@/config/site";
import { sendBalanceDueEmail } from "@/lib/inquiry/email";
import type { PaymentKind, PaymentRow } from "./checkout";
import { type Db, loadProject, PaymentError } from "./project";

/**
 * State changes that follow a confirmed Stripe outcome. Every function here is safe to run repeatedly
 * (Stripe retries webhooks, and the same payment can be reported by more than one event): each write is an
 * absolute assignment guarded by "not already applied", never an increment.
 */

const now = () => new Date().toISOString();
const id = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id ?? null);

export type PaidInput = {
  projectId: string;
  kind: PaymentKind;
  amount: number;
  currency: string;
  paymentIntentId: string;
  chargeId: string | null;
  paymentMethodId: string | null;
  sessionId?: string | null;
};

/** Marks one payment obligation paid. Returns false if it was already applied or the amounts don't match what we asked for. */
export const recordPaid = async (db: Db, p: PaidInput): Promise<boolean> => {
  const project = await loadProject(db, p.projectId);
  // Only obligations this server created can be settled, and the amount Stripe collected must equal the
  // amount the database says is owed. Event metadata is never trusted for money.
  const { data: obligation } = await db
    .from("payments")
    .select("id, project_id, kind, status, amount_cents, checkout_seq, stripe_checkout_session_id")
    .eq("project_id", p.projectId)
    .eq("kind", p.kind)
    .maybeSingle<PaymentRow>();
  if (!obligation || obligation.amount_cents !== p.amount || p.currency !== project.currency) {
    console.error("[payments] amount mismatch, not applied:", p.projectId, p.kind);
    return false;
  }

  let applied = false;
  if (p.kind === "final_balance") {
    const { data, error } = await db
      .from("project_requests")
      .update({
        final_payment_status: "succeeded",
        final_paid_at: now(),
        final_payment_intent_id: p.paymentIntentId,
        remaining_cents: 0,
        amount_paid: project.total_cents,
        payment_status: "paid",
      })
      .eq("id", p.projectId)
      .neq("final_payment_status", "succeeded")
      .select("id");
    if (error) throw new PaymentError("database");
    applied = !!data?.length;
    // Payment is now complete, so handoff is unlocked. Only a project waiting on this payment moves forward.
    await db.from("project_requests").update({ status: "ready_for_launch" }).eq("id", p.projectId).in("status", ["awaiting_final_payment", "revisions", "review"]);
  } else {
    const remaining = project.remaining_cents ?? 0;
    const { data, error } = await db
      .from("project_requests")
      .update({
        initial_payment_status: "succeeded",
        initial_paid_at: now(),
        stripe_payment_intent_id: p.paymentIntentId,
        stripe_payment_method_id: p.paymentMethodId,
        amount_paid: p.amount,
        payment_status: remaining > 0 ? "partially_paid" : "paid",
        final_payment_status: remaining > 0 ? "pending" : "not_required",
      })
      .eq("id", p.projectId)
      .neq("initial_payment_status", "succeeded")
      .select("id");
    if (error) throw new PaymentError("database");
    applied = !!data?.length;
    if (applied && remaining > 0 && !p.paymentMethodId) console.error("[payments] no reusable payment method saved:", p.projectId);
    await db.from("project_requests").update({ status: "in_progress" }).eq("id", p.projectId).in("status", ["new", "contacted", "awaiting_payment"]);
  }

  // Ledger row: absolute values, so re-running after a partial failure repairs it.
  await db
    .from("payments")
    .update({
      status: "succeeded",
      paid_at: now(),
      stripe_payment_intent_id: p.paymentIntentId,
      stripe_charge_id: p.chargeId,
      ...(p.sessionId ? { stripe_checkout_session_id: p.sessionId } : {}),
      failure_code: null,
    })
    .eq("id", obligation.id);
  return applied;
};

/** Off-session final charge did not complete: nothing is handed off; the customer gets the Checkout fallback. */
export const recordFinalFailure = async (db: Db, projectId: string, status: "failed" | "requires_action", code: string, paymentIntentId?: string | null) => {
  const { data } = await db
    .from("project_requests")
    .update({ final_payment_status: status, status: "awaiting_final_payment" })
    .eq("id", projectId)
    .eq("final_payment_status", "processing")
    .select("email, client_name");
  await db
    .from("payments")
    .update({ status, failure_code: code, ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}) })
    .eq("project_id", projectId)
    .eq("kind", "final_balance")
    .neq("status", "succeeded");
  const who = data?.[0] as { email: string; client_name: string } | undefined;
  // Only the call that actually made the transition emails, so webhook replays don't spam the customer.
  if (who) await sendBalanceDueEmail(who.email, who.client_name, `${siteConfig.url.replace(/\/$/, "")}/pay/${projectId}`);
};

const refundStatus = (s: string | null): string =>
  s === "succeeded" ? "succeeded" : s === "failed" ? "failed" : s === "canceled" ? "cancelled" : s === "requires_action" ? "requires_action" : "processing";

/** Upserts a Stripe refund into the ledger and recomputes the project's refund totals from it (replay-safe). */
export const applyRefund = async (db: Db, refund: Stripe.Refund): Promise<void> => {
  const pi = id(refund.payment_intent);
  if (!pi) return;
  const { data: payment } = await db.from("payments").select("id, project_id, kind").eq("stripe_payment_intent_id", pi).neq("kind", "refund").maybeSingle<{ id: string; project_id: string }>();
  if (!payment) return; // not one of ours
  await db.from("payments").upsert(
    {
      project_id: payment.project_id,
      kind: "refund",
      status: refundStatus(refund.status),
      amount_cents: refund.amount,
      currency: refund.currency,
      stripe_payment_intent_id: pi,
      stripe_charge_id: id(refund.charge),
      stripe_refund_id: refund.id,
      failure_code: refund.failure_reason ?? null,
      paid_at: refund.status === "succeeded" ? now() : null,
    },
    { onConflict: "stripe_refund_id" },
  );
  await recomputeRefunds(db, payment.project_id, refund.id);
};

export const recomputeRefunds = async (db: Db, projectId: string, latestRefundId?: string) => {
  const { data: rows } = await db.from("payments").select("kind, status, amount_cents, stripe_payment_intent_id").eq("project_id", projectId);
  const all = (rows ?? []) as { kind: string; status: string; amount_cents: number; stripe_payment_intent_id: string | null }[];
  const live = all.filter((r) => r.kind === "refund" && (r.status === "succeeded" || r.status === "processing"));
  const refunded = live.reduce((sum, r) => sum + r.amount_cents, 0);
  const paid = all.filter((r) => r.kind !== "refund" && r.status === "succeeded").reduce((sum, r) => sum + r.amount_cents, 0);

  // Per-payment refunded amount.
  for (const r of all.filter((x) => x.kind !== "refund" && x.stripe_payment_intent_id)) {
    const forPi = live.filter((x) => x.stripe_payment_intent_id === r.stripe_payment_intent_id).reduce((s, x) => s + x.amount_cents, 0);
    await db.from("payments").update({ refunded_cents: forPi, ...(forPi > 0 ? { status: forPi >= r.amount_cents ? "refunded" : "partially_refunded" } : {}) }).eq("project_id", projectId).eq("stripe_payment_intent_id", r.stripe_payment_intent_id).neq("kind", "refund");
  }

  const failedOnly = refunded === 0 && all.some((r) => r.kind === "refund" && r.status === "failed");
  const full = paid > 0 && refunded >= paid;
  await db
    .from("project_requests")
    .update({
      refunded_cents: refunded,
      refund_status: full ? "refunded" : refunded > 0 ? "partial" : failedOnly ? "failed" : "none",
      ...(refunded > 0 ? { refunded_at: now(), ...(latestRefundId ? { stripe_refund_id: latestRefundId } : {}) } : {}),
      ...(full ? { payment_status: "refunded" } : refunded > 0 ? { payment_status: "partially_refunded" } : {}),
    })
    .eq("id", projectId);
};

/** A dispute is recorded, never acted on: no deletion, no automatic response. It blocks further charges. */
export const recordDispute = async (db: Db, paymentIntentId: string, disputeId: string) => {
  const { data } = await db.from("payments").select("project_id").eq("stripe_payment_intent_id", paymentIntentId).neq("kind", "refund").maybeSingle<{ project_id: string }>();
  if (!data) return;
  await db.from("project_requests").update({ payment_status: "disputed", dispute_id: disputeId, disputed_at: now() }).eq("id", data.project_id).is("dispute_id", null);
};
