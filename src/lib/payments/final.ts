import "server-only";
import type Stripe from "stripe";
import { ensureObligation } from "./checkout";
import { adminDb, loadProject, PaymentError, requireStripe } from "./project";
import { finalEligibility, classifyChargeFailure, REVISION_DONE_FROM } from "./rules";
import { recordFinalFailure, recordPaid } from "./settle";

export type FinalResult =
  | { result: "paid" }
  | { result: "processing" }
  | { result: "fallback_required"; reason: string };

/**
 * "Revisions complete: collect the final balance." The ONE place the final charge is attempted. Callable
 * only from server code that has already authorized the caller (the admin route today, a dashboard later).
 *
 * Safety:
 *  - the amount is the database's remaining_cents; no caller input reaches Stripe;
 *  - eligibility (revision stage reached, deposit paid, not cancelled/disputed/refunded) is re-checked here;
 *  - the claim is an optimistic-concurrency UPDATE, so two simultaneous calls cannot both proceed;
 *  - the PaymentIntent uses the idempotency key project:{id}:final, so a retry can never charge twice;
 *  - a declined/locked/cancelled card is NOT retried: the project moves to awaiting_final_payment and the
 *    customer pays through Checkout (see startCheckout).
 */
export const collectFinalPayment = async (projectId: string): Promise<FinalResult> => {
  const db = adminDb();
  const row = await loadProject(db, projectId);
  const eligible = finalEligibility(row);
  if (!eligible.ok) throw new PaymentError(eligible.reason === "in_progress" ? "processing" : eligible.reason);

  const remaining = row.remaining_cents as number;
  const { data: claimed, error } = await db
    .from("project_requests")
    .update({
      status: "awaiting_final_payment",
      final_payment_status: "processing",
      final_attempts: row.final_attempts + 1,
      final_attempted_at: new Date().toISOString(),
      revisions_completed_at: row.revisions_completed_at ?? new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("final_payment_status", row.final_payment_status)
    .eq("final_attempts", row.final_attempts)
    .in("status", [...REVISION_DONE_FROM, "awaiting_final_payment"])
    .select("id");
  if (error) throw new PaymentError("database");
  if (!claimed?.length) throw new PaymentError("conflict");

  await ensureObligation(db, row.id, "final_balance", remaining);
  await db.from("payments").update({ status: "processing" }).eq("project_id", row.id).eq("kind", "final_balance").neq("status", "succeeded");

  if (!row.stripe_customer_id || !row.stripe_payment_method_id) {
    await recordFinalFailure(db, row.id, "failed", "missing_payment_method");
    return { result: "fallback_required", reason: "missing_payment_method" };
  }

  const stripe = requireStripe();
  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: remaining,
        currency: row.currency,
        customer: row.stripe_customer_id,
        payment_method: row.stripe_payment_method_id,
        off_session: true,
        confirm: true,
        description: "Northframe website, remaining balance",
        metadata: { project_id: row.id, package_id: row.package, payment_stage: "final_balance" },
      },
      { idempotencyKey: `project:${row.id}:final` },
    );
    return await settleIntent(row.id, intent);
  } catch (error) {
    if (error instanceof PaymentError) throw error;
    const stripeError = error as Stripe.errors.StripeError;
    if (stripeError?.type === "StripeCardError") {
      const failure = classifyChargeFailure(stripeError.code);
      await recordFinalFailure(db, row.id, failure.status, stripeError.decline_code ?? failure.code, stripeError.payment_intent?.id);
      return { result: "fallback_required", reason: failure.code };
    }
    // Network/API trouble: the outcome is unknown. Leave "processing"; a retry after the stale window reuses
    // the same idempotency key (no double charge) and the webhook will also settle it if the charge went through.
    console.error("[payments] final charge unknown:", stripeError?.type ?? "unknown");
    throw new PaymentError("stripe_unavailable");
  }
};

const settleIntent = async (projectId: string, intent: Stripe.PaymentIntent): Promise<FinalResult> => {
  const db = adminDb();
  if (intent.status === "succeeded") {
    await recordPaid(db, {
      projectId,
      kind: "final_balance",
      amount: intent.amount_received || intent.amount,
      currency: intent.currency,
      paymentIntentId: intent.id,
      chargeId: typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id ?? null,
      paymentMethodId: null,
    });
    return { result: "paid" };
  }
  if (intent.status === "processing") return { result: "processing" };
  const failure = classifyChargeFailure(intent.status === "requires_action" ? "requires_action" : intent.last_payment_error?.code);
  await recordFinalFailure(db, projectId, failure.status, failure.code, intent.id);
  return { result: "fallback_required", reason: failure.code };
};
