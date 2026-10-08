import "server-only";
import { serverLog } from "@/lib/observability/serverLog";
import { expireStaleSession } from "@/lib/payments/checkout";
import { finalizeFinal, finalKey, recordFinalFailure } from "@/lib/payments/finalize";
import { defaultDeps, PaymentError, type PaymentsDeps } from "@/lib/payments/stripe";
import type { Viewer } from "@/lib/portal/types";

export type CollectOutcome = "paid" | "processing" | "failed" | "requires_action" | "already_paid" | "not_eligible";
export type CollectResult = { outcome: CollectOutcome; message: string };

type StripeFailure = { type?: string; code?: string; decline_code?: string; payment_intent?: { id?: string }; raw?: { payment_intent?: { id?: string } } };

const isCardError = (err: unknown): err is StripeFailure => (err as StripeFailure | null)?.type === "StripeCardError";

/**
 * Charges the remaining balance off-session on the card saved at checkout. Admin only.
 * Exactly one caller wins the atomic claim (SQL claim_final_payment), so concurrent or repeated calls
 * can never create a second PaymentIntent. Stripe's idempotency key is derived from the count of
 * recorded failures, so a retry after a lost response reuses the same intent while a retry after a real
 * decline starts a fresh one. There is no retry loop: one attempt per call.
 */
export const collectFinalBalance = async (
  projectId: string,
  viewer: Viewer,
  deps: PaymentsDeps = defaultDeps(),
): Promise<CollectResult> => {
  if (viewer.role !== "admin") throw new PaymentError("Only the studio can collect the final payment.");
  const { repo, stripe } = deps;

  const before = await repo.getProject(projectId);
  if (!before) return { outcome: "not_eligible", message: "Project not found." };
  if (before.final_payment_status === "paid") return { outcome: "already_paid", message: "The final payment has already been received." };

  const claim = await repo.claimFinalPayment(projectId);
  if (!claim) {
    const current = await repo.getProject(projectId);
    if (current?.final_payment_status === "processing") return { outcome: "processing", message: "A final payment attempt is already in progress." };
    if (current?.final_payment_status === "paid") return { outcome: "already_paid", message: "The final payment has already been received." };
    return { outcome: "not_eligible", message: "There is no final balance to collect on this project right now." };
  }

  await repo.updateProject(projectId, { payment_status: "processing" });
  const obligation = await repo.upsertLedger({
    project_id: projectId,
    type: "final_balance",
    status: "processing",
    amount: claim.remaining_amount,
    currency: claim.currency,
    idempotency_key: finalKey(projectId),
  });
  if (obligation.status !== "processing") await repo.updateLedger(obligation.id, { status: "processing", failure_reason: null });
  // A hosted "pay remaining balance" link may still be open: close it so the client can't pay it too.
  await expireStaleSession(stripe, obligation.stripe_session_id, "");

  if (!claim.stripe_customer_id || !claim.stripe_payment_method_id) {
    await recordFinalFailure(deps, { projectId, paymentIntentId: null, reason: "no_saved_payment_method", requiresAction: true });
    return { outcome: "requires_action", message: "No saved card is on file. Send the client a payment link for the remaining balance." };
  }

  const failures = await repo.countFinalAttempts(projectId);
  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: claim.remaining_amount,
        currency: claim.currency,
        customer: claim.stripe_customer_id,
        payment_method: claim.stripe_payment_method_id,
        payment_method_types: ["card"],
        off_session: true,
        confirm: true,
        description: "Northframe website: remaining balance",
        metadata: { project_id: projectId, package_id: before.package, payment_stage: "final_balance", collect: "off_session", user_id: before.user_id ?? "" },
      },
      { idempotencyKey: `project:${projectId}:final:${failures}` },
    );

    if (intent.status === "succeeded") {
      await finalizeFinal(deps, { projectId, paymentIntentId: intent.id, amountReceived: intent.amount_received });
      return { outcome: "paid", message: "The final payment was collected. The project is ready for launch." };
    }
    if (intent.status === "processing") {
      await repo.updateLedger(obligation.id, { status: "processing", stripe_payment_intent_id: intent.id });
      return { outcome: "processing", message: "The payment is processing. The project updates when it clears." };
    }
    const needsAction = intent.status === "requires_action" || intent.status === "requires_confirmation";
    await recordFinalFailure(deps, { projectId, paymentIntentId: intent.id, reason: intent.status, requiresAction: needsAction });
    return needsAction
      ? { outcome: "requires_action", message: "The bank needs the client to confirm the payment. Send them a payment link." }
      : { outcome: "failed", message: "The saved card could not be charged. Send the client a payment link." };
  } catch (err) {
    if (isCardError(err)) {
      const needsAction = err.code === "authentication_required";
      const intentId = err.payment_intent?.id ?? err.raw?.payment_intent?.id ?? null;
      await recordFinalFailure(deps, { projectId, paymentIntentId: intentId, reason: err.decline_code ?? err.code ?? "card_error", requiresAction: needsAction });
      return needsAction
        ? { outcome: "requires_action", message: "The bank needs the client to confirm the payment. Send them a payment link." }
        : { outcome: "failed", message: "The saved card was declined. Send the client a payment link." };
    }
    // Network or Stripe outage: release the claim. Retrying reuses the same idempotency key, so a
    // charge that did go through is returned by Stripe, never repeated. The webhook also reconciles it.
    serverLog("error", "payments.final_charge_error", { project: projectId });
    await repo.updateProjectIf(
      projectId,
      { final_payment_status: failures > 0 ? "failed" : "pending", payment_status: "deposit_paid" },
      { final_payment_status: ["processing"] },
    );
    await repo.updateLedger(obligation.id, { status: failures > 0 ? "failed" : "pending" });
    throw new PaymentError("Could not reach Stripe. Nothing was recorded as paid. Please try again.");
  }
};
