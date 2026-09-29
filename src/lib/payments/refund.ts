import "server-only";
import type Stripe from "stripe";
import { makePlan } from "./plan";
import { adminDb, loadProject, PaymentError, requireStripe, snapshotColumns } from "./project";
import { refundableCents } from "./rules";
import { applyRefund } from "./settle";

type PaidPayment = { stripe_payment_intent_id: string; amount_cents: number; refunded_cents: number; kind: string };

/**
 * Privileged refund (admin route only). Refunds go back through Stripe; the local state is then synced from
 * the returned refund and again by the charge.refunded webhook (both replay-safe). Nothing here runs
 * automatically from elapsed time. `cancel: true` also cancels the project and stops the final payment.
 * Default amount = what remains refundable on the initial payment (the 3-day policy case).
 */
export const refundProject = async (projectId: string, opts: { amountCents?: number; cancel?: boolean }) => {
  const db = adminDb();
  const stripe = requireStripe();
  const project = await loadProject(db, projectId);

  const { data } = await db
    .from("payments")
    .select("stripe_payment_intent_id, amount_cents, refunded_cents, kind")
    .eq("project_id", projectId)
    .eq("status", "succeeded")
    .not("stripe_payment_intent_id", "is", null)
    .neq("kind", "refund")
    .order("created_at", { ascending: true });
  // Also include partially refunded payments that still have room.
  const { data: partial } = await db
    .from("payments")
    .select("stripe_payment_intent_id, amount_cents, refunded_cents, kind")
    .eq("project_id", projectId)
    .eq("status", "partially_refunded")
    .neq("kind", "refund");
  const payments = [...(data ?? []), ...(partial ?? [])] as PaidPayment[];
  const target = payments.find((p) => refundableCents(p.amount_cents, p.refunded_cents) > 0);
  if (!target) throw new PaymentError("amount_invalid");

  const room = refundableCents(target.amount_cents, target.refunded_cents);
  const amount = opts.amountCents ?? room;
  if (!Number.isInteger(amount) || amount <= 0 || amount > room) throw new PaymentError("amount_invalid");

  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.create(
      { payment_intent: target.stripe_payment_intent_id, amount, metadata: { project_id: projectId } },
      // Same payment + same already-refunded total + same amount = same refund, so a retry can't refund twice.
      { idempotencyKey: `project:${projectId}:refund:${target.stripe_payment_intent_id}:${target.refunded_cents}:${amount}` },
    );
  } catch {
    throw new PaymentError("stripe_unavailable");
  }
  await applyRefund(db, refund);

  if (opts.cancel) {
    const stamp = new Date().toISOString();
    await db
      .from("project_requests")
      .update({ status: "cancelled", cancelled_at: stamp, cancellation_requested_at: project.cancellation_requested_at ?? stamp })
      .eq("id", projectId)
      .neq("status", "cancelled");
    await db.from("project_requests").update({ final_payment_status: "cancelled" }).eq("id", projectId).neq("final_payment_status", "succeeded");
  }
  return { refundId: refund.id, status: refund.status, amountCents: amount };
};

/** Customer asks to cancel. Only records the request; a person decides and refunds via refundProject. */
export const requestCancellation = async (projectId: string) => {
  const db = adminDb();
  const project = await loadProject(db, projectId);
  if (project.status === "cancelled") return;
  await db.from("project_requests").update({ cancellation_requested_at: new Date().toISOString() }).eq("id", projectId).is("cancellation_requested_at", null);
};

/** Staff sets the price of a Custom project (or corrects an unpaid one). Refused once any payment exists. */
export const setQuote = async (projectId: string, totalCents: number, depositCents: number) => {
  const db = adminDb();
  const project = await loadProject(db, projectId);
  const plan = makePlan(totalCents, depositCents);
  if (!plan) throw new PaymentError("amount_invalid");
  if (project.initial_payment_status === "succeeded") throw new PaymentError("blocked");
  const { data: obligations } = await db.from("payments").select("id, status, stripe_checkout_session_id").eq("project_id", projectId);
  if ((obligations ?? []).some((o: { status: string; stripe_checkout_session_id: string | null }) => o.status === "succeeded" || o.stripe_checkout_session_id)) throw new PaymentError("blocked");
  await db.from("payments").delete().eq("project_id", projectId).eq("status", "pending");
  const { error } = await db.from("project_requests").update(snapshotColumns(plan)).eq("id", projectId);
  if (error) throw new PaymentError("database");
};
