import "server-only";
import type Stripe from "stripe";
import { serverLog } from "@/lib/observability/serverLog";
import {
  applyRefundedTotal,
  finalizeDeposit,
  finalizeFinal,
  recordDepositFailure,
  recordDispute,
  recordFinalFailure,
} from "@/lib/payments/finalize";
import type { PaymentsDeps } from "@/lib/payments/stripe";

export type WebhookResult = { status: number; body: string };

/** The only Stripe events this app acts on. Anything else is acknowledged and ignored. */
export const HANDLED_EVENTS = [
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
] as const;

const asId = (value: string | { id: string } | null | undefined): string | null => (typeof value === "string" ? value : (value?.id ?? null));

const handleEvent = async (deps: PaymentsDeps, event: Stripe.Event): Promise<void> => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const projectId = session.metadata?.project_id;
      const paymentIntentId = asId(session.payment_intent);
      // Async payment methods complete the session unpaid; their success arrives as payment_intent.succeeded.
      if (!projectId || !paymentIntentId || session.payment_status !== "paid") return;
      const amountReceived = session.amount_total ?? 0;
      if (session.metadata?.payment_stage === "final_balance") {
        await finalizeFinal(deps, { projectId, paymentIntentId, amountReceived, sessionId: session.id });
      } else {
        await finalizeDeposit(deps, { projectId, paymentIntentId, amountReceived, sessionId: session.id });
      }
      return;
    }
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      const projectId = intent.metadata?.project_id;
      if (!projectId) return;
      if (intent.metadata?.payment_stage === "final_balance") {
        await finalizeFinal(deps, { projectId, paymentIntentId: intent.id, amountReceived: intent.amount_received });
      } else {
        await finalizeDeposit(deps, {
          projectId,
          paymentIntentId: intent.id,
          amountReceived: intent.amount_received,
          paymentMethodId: asId(intent.payment_method),
        });
      }
      return;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      const projectId = intent.metadata?.project_id;
      if (!projectId) return;
      const code = intent.last_payment_error?.code ?? intent.last_payment_error?.decline_code ?? null;
      if (intent.metadata?.payment_stage === "final_balance") {
        // Hosted-Checkout retries are the customer's to repeat; only our own off-session attempt records a failure.
        if (intent.metadata?.collect !== "off_session") return;
        await recordFinalFailure(deps, { projectId, paymentIntentId: intent.id, reason: code, requiresAction: code === "authentication_required" });
      } else {
        await recordDepositFailure(deps, { projectId, reason: code });
      }
      return;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntentId = asId(charge.payment_intent);
      if (!paymentIntentId) return;
      const source = await deps.repo.findLedgerByPaymentIntent(paymentIntentId);
      if (!source) return;
      await applyRefundedTotal(deps, { projectId: source.project_id, paymentIntentId, refundedTotal: charge.amount_refunded });
      return;
    }
    case "charge.dispute.created": {
      const dispute = event.data.object;
      let paymentIntentId = asId(dispute.payment_intent);
      if (!paymentIntentId) {
        const charge = await deps.stripe.charges.retrieve(asId(dispute.charge) ?? "");
        paymentIntentId = asId(charge.payment_intent);
      }
      if (!paymentIntentId) return;
      const source = await deps.repo.findLedgerByPaymentIntent(paymentIntentId);
      if (!source) return;
      await recordDispute(deps, { projectId: source.project_id });
      return;
    }
    default:
      return;
  }
};

/**
 * Verifies the Stripe signature over the raw body, de-duplicates by event id (recorded BEFORE handling),
 * then applies the event. If handling throws, the event id is forgotten so Stripe's retry can succeed.
 */
export const processStripeWebhook = async (
  deps: PaymentsDeps,
  input: { rawBody: string; signature: string | null; secret: string | undefined },
): Promise<WebhookResult> => {
  if (!input.signature || !input.secret) return { status: 400, body: "Bad request" };

  let event: Stripe.Event;
  try {
    event = deps.stripe.webhooks.constructEvent(input.rawBody, input.signature, input.secret);
  } catch {
    return { status: 400, body: "Invalid signature" };
  }

  if (!(HANDLED_EVENTS as readonly string[]).includes(event.type)) return { status: 200, body: "ignored" };

  const isNew = await deps.repo.recordWebhookEvent(event.id, event.type);
  if (!isNew) return { status: 200, body: "duplicate" };

  try {
    await handleEvent(deps, event);
    return { status: 200, body: "ok" };
  } catch {
    serverLog("error", "payments.webhook_failed", { type: event.type, event: event.id });
    await deps.repo.forgetWebhookEvent(event.id).catch(() => undefined);
    return { status: 500, body: "retry" };
  }
};
