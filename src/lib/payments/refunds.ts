import "server-only";
import { CANCELLATION_WINDOW_DAYS } from "@/config/payments";
import { applyRefundedTotal, recordedRefunds } from "@/lib/payments/finalize";
import { defaultDeps, PaymentError, type PaymentsDeps } from "@/lib/payments/stripe";
import type { Viewer } from "@/lib/portal/types";

/**
 * Admin-only refund of a specific succeeded payment, validated against the ledger (never more than was
 * paid minus what is already refunded) and then executed through Stripe. The refund is recorded through
 * the same cumulative-total function as the charge.refunded webhook, so it is counted once.
 */
export const refundPayment = async (
  projectId: string,
  paymentId: string,
  amountCents: number | undefined,
  viewer: Viewer,
  deps: PaymentsDeps = defaultDeps(),
): Promise<{ refunded: number }> => {
  if (viewer.role !== "admin") throw new PaymentError("Only the studio can issue refunds.");
  const { repo, stripe } = deps;

  const payment = await repo.getLedgerById(paymentId);
  if (!payment || payment.project_id !== projectId) throw new PaymentError("Payment not found on this project.");
  if (payment.status === "refunded") throw new PaymentError("This payment has already been fully refunded.");
  const refundable =["full", "deposit", "final_balance"].includes(payment.type);
  const paidStatus = ["succeeded", "partially_refunded"].includes(payment.status);
  if (!refundable || !paidStatus || !payment.stripe_payment_intent_id) throw new PaymentError("This payment cannot be refunded.");

  const intentId = payment.stripe_payment_intent_id;
  const already = recordedRefunds(await repo.listLedger(projectId), intentId);
  const available = payment.amount - already;
  if (available <= 0) throw new PaymentError("This payment has already been fully refunded.");

  const amount = amountCents ?? available;
  if (!Number.isInteger(amount) || amount <= 0) throw new PaymentError("Enter a valid refund amount.");
  if (amount > available) throw new PaymentError("That is more than the amount still refundable on this payment.");

  const refund = await stripe.refunds.create(
    { payment_intent: intentId, amount, metadata: { project_id: projectId, payment_id: paymentId } },
    { idempotencyKey: `refund:${paymentId}:${already}:${amount}` },
  );
  await applyRefundedTotal(deps, { projectId, paymentIntentId: intentId, refundedTotal: already + amount, stripeRefundId: refund.id });
  return { refunded: amount };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const utcDay = (date: Date) => Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);

/**
 * Client request to cancel within the 3-Day Project Cancellation Policy. Only stamps
 * cancellation_requested_at for the studio to review. It never refunds or cancels anything by itself.
 */
export const requestCancellation = async (
  projectId: string,
  viewer: Viewer,
  deps: PaymentsDeps = defaultDeps(),
): Promise<{ requestedAt: string }> => {
  const { repo, now } = deps;
  const project = await repo.getProject(projectId);
  if (!project || project.user_id !== viewer.userId) throw new PaymentError("Project not found.");
  if (project.cancellation_requested_at) return { requestedAt: project.cancellation_requested_at };
  if (project.status === "cancelled") throw new PaymentError("This project is already cancelled.");
  if (!project.initial_paid_at) throw new PaymentError("Nothing has been paid on this project yet.");

  const elapsedDays = utcDay(now()) - utcDay(new Date(project.initial_paid_at));
  if (elapsedDays > CANCELLATION_WINDOW_DAYS) {
    throw new PaymentError("The 3-day cancellation window has passed. Please message the studio if something has changed.");
  }

  const requestedAt = now().toISOString();
  await repo.updateProject(projectId, { cancellation_requested_at: requestedAt });
  await repo.addEvent(projectId, "cancellation_requested", "Cancellation requested by the client", "client");
  return { requestedAt };
};
