import "server-only";
import type Stripe from "stripe";
import { serverLog } from "@/lib/observability/serverLog";
import { alertStudio, firstTime, flagForReview } from "@/lib/payments/notify";
import type { PaymentsDeps } from "@/lib/payments/stripe";

/**
 * Automatic refund of a DUPLICATE payment: a second PaymentIntent that succeeded for an obligation
 * (deposit/full, or final balance) that the database already records as paid by a different intent.
 *
 * This is the only refund the system ever issues on its own, and only on positive evidence. Every check
 * below runs against live Stripe data, not the webhook payload; if any check fails or anything is
 * unclear, nothing is refunded and the project gets a "needs review" event instead. Never refunded
 * automatically: wrong amounts, payments on cancelled or unknown projects, cancellations, disputes.
 *
 * Kill switch: STRIPE_AUTO_REFUND_DUPLICATES=off turns refunds into review events.
 */
export type DuplicateStage = "deposit" | "final_balance";
export type DuplicateOutcome = "refunded" | "already_refunded" | "review" | "retry";

const STAGES: Record<DuplicateStage, readonly string[]> = { deposit: ["deposit", "full"], final_balance: ["final_balance"] };

export const autoRefundEnabled = () => process.env.STRIPE_AUTO_REFUND_DUPLICATES?.trim().toLowerCase() !== "off";

type Checked = { intent: Stripe.PaymentIntent; charge: Stripe.Charge | null };

const load = async (stripe: PaymentsDeps["stripe"], id: string): Promise<Checked> => {
  const intent = await stripe.paymentIntents.retrieve(id, { expand: ["latest_charge"] });
  const charge = typeof intent.latest_charge === "object" ? intent.latest_charge : null;
  return { intent, charge };
};

/** Why a refund must not happen, or null when every check passes. Pure: unit tested. */
export const duplicateRefusal = (
  input: { projectId: string; stage: DuplicateStage; duplicateId: string; recordedId: string | null },
  duplicate: Checked,
  recorded: Checked | null,
): string | null => {
  if (!input.recordedId) return "no_recorded_payment";
  if (input.recordedId === input.duplicateId) return "same_payment"; // a replay of the payment we recorded
  if (!recorded) return "recorded_payment_unreadable";
  const { intent, charge } = duplicate;
  if (intent.id !== input.duplicateId) return "id_mismatch";
  if (intent.status !== "succeeded") return "duplicate_not_succeeded";
  if (intent.metadata?.project_id !== input.projectId) return "other_project";
  if (!STAGES[input.stage].includes(intent.metadata?.payment_stage ?? "")) return "other_stage";
  if (!charge || charge.status !== "succeeded" || !charge.paid) return "duplicate_charge_missing";
  if (charge.disputed) return "duplicate_disputed";
  if (charge.refunded) return "duplicate_already_refunded"; // fully refunded (by us earlier, or by hand)
  if (charge.amount_refunded > 0) return "duplicate_partly_refunded"; // someone acted by hand: leave it to them
  if (!Number.isSafeInteger(intent.amount_received) || intent.amount_received <= 0) return "nothing_received";
  // The payment we keep must be real and intact, or refunding the "duplicate" could leave the client
  // with no payment at all.
  const kept = recorded.intent;
  if (kept.status !== "succeeded" || kept.metadata?.project_id !== input.projectId) return "recorded_payment_not_valid";
  if (!STAGES[input.stage].includes(kept.metadata?.payment_stage ?? "")) return "recorded_other_stage";
  if (!recorded.charge || recorded.charge.disputed || recorded.charge.amount_refunded > 0) return "recorded_payment_refunded_or_disputed";
  if (kept.currency !== intent.currency) return "currency_mismatch";
  return null;
};

const permanent = (err: unknown) => {
  const type = (err as { type?: string } | null)?.type;
  return type === "StripeInvalidRequestError" || type === "StripeCardError" || type === "StripePermissionError";
};

/**
 * Refunds a duplicate payment in full (exactly what that intent received, never more), or flags it for
 * review. Safe to call any number of times and concurrently: the fresh amount_refunded check plus a
 * stable Stripe idempotency key mean one refund at most. Transient Stripe errors throw so the webhook
 * is retried; permanent ones become a review event.
 */
export const refundDuplicatePayment = async (
  deps: PaymentsDeps,
  input: { projectId: string; stage: DuplicateStage; duplicateId: string; recordedId: string | null },
): Promise<DuplicateOutcome> => {
  const { stripe, repo } = deps;
  const review = async (reason: string): Promise<DuplicateOutcome> => {
    serverLog("error", "payments.duplicate_needs_review", { project: input.projectId, reason });
    await flagForReview(deps, {
      key: `duplicate:${input.duplicateId}`,
      projectId: input.projectId,
      timeline: "An extra payment was received. The studio is reviewing it.",
      subject: "extra payment needs review",
      detail: `A second payment arrived for something that was already paid, but it was NOT refunded automatically (reason: ${reason}). Check it in Stripe and refund it by hand if it should not have happened.`,
      paymentIntentId: input.duplicateId,
    });
    return "review";
  };
  if (input.recordedId === input.duplicateId) return "already_refunded"; // not a duplicate at all: nothing to do

  let duplicate: Checked;
  let recorded: Checked | null = null;
  try {
    duplicate = await load(stripe, input.duplicateId);
    if (input.recordedId) recorded = await load(stripe, input.recordedId).catch(() => null);
  } catch (err) {
    if (permanent(err)) return review("duplicate_unreadable");
    throw err; // network: let Stripe retry the webhook
  }

  const refusal = duplicateRefusal(input, duplicate, recorded);
  if (refusal === "duplicate_already_refunded") return "already_refunded";
  if (refusal) return review(refusal);
  if (!autoRefundEnabled()) return review("auto_refund_off");

  const amount = duplicate.intent.amount_received;
  let replayed = false;
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: duplicate.intent.id,
        amount,
        reason: "duplicate",
        metadata: { project_id: input.projectId, auto_refund: "duplicate", kept_payment_intent: input.recordedId ?? "" },
      },
      { idempotencyKey: `auto-refund:duplicate:${duplicate.intent.id}` },
    );
    // A parallel delivery of the same event already issued this exact refund: don't report it twice.
    replayed = refund.lastResponse?.headers?.["idempotent-replayed"] === "true";
  } catch (err) {
    // A concurrent identical request (idempotency conflict) or a network error throws: the webhook is
    // retried and the next run sees the refund already done.
    if (permanent(err)) return review("refund_refused");
    throw err;
  }
  if (replayed || !(await firstTime(deps, `refunded:${duplicate.intent.id}`))) return "already_refunded";
  serverLog("info", "payments.duplicate_refunded", { project: input.projectId });
  await repo.addEvent(input.projectId, "refund", "A duplicate payment was refunded automatically", "system");
  await alertStudio(input.projectId, "duplicate payment refunded", `A duplicate payment of ${(amount / 100).toFixed(2)} ${duplicate.intent.currency.toUpperCase()} was refunded in full automatically. The original payment (${input.recordedId}) is kept. No action needed.`, input.duplicateId);
  return "refunded";
};
