import "server-only";
import type Stripe from "stripe";
import { adminDb, type Db, PaymentError, requireStripe } from "./project";
import type { PaymentKind } from "./checkout";
import { classifyChargeFailure } from "./rules";
import { applyRefund, recordDispute, recordFinalFailure, recordPaid } from "./settle";

/** The only events the endpoint needs. Subscribe the Stripe webhook to exactly these. */
export const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
  "refund.updated",
  "charge.dispute.created",
] as const;

export const verifyEvent = (rawBody: string, signature: string | null): Stripe.Event => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new PaymentError("not_configured");
  if (!signature) throw new PaymentError("invalid");
  try {
    return requireStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    throw new PaymentError("invalid");
  }
};

const stages = new Set<string>(["full", "deposit", "final_balance"]);
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id ?? null);

const paidFromIntent = async (db: Db, intent: Stripe.PaymentIntent, sessionId?: string | null) => {
  const projectId = intent.metadata?.project_id;
  const kind = intent.metadata?.payment_stage;
  if (!projectId || !kind || !stages.has(kind)) return; // not a Northframe payment
  await recordPaid(db, {
    projectId,
    kind: kind as PaymentKind,
    amount: intent.amount_received || intent.amount,
    currency: intent.currency,
    paymentIntentId: intent.id,
    chargeId: idOf(intent.latest_charge),
    paymentMethodId: idOf(intent.payment_method),
    sessionId,
  });
};

const dispatch = async (db: Db, event: Stripe.Event) => {
  const stripe = requireStripe();
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Only a fully paid session counts; the redirect back to the site never does.
      if (session.payment_status !== "paid" || !session.payment_intent) return;
      const intent = await stripe.paymentIntents.retrieve(idOf(session.payment_intent) as string);
      await paidFromIntent(db, intent, session.id);
      return;
    }
    case "payment_intent.succeeded":
      await paidFromIntent(db, event.data.object);
      return;
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      // Only the automatic off-session charge changes state; a declined card inside Checkout just lets the customer retry.
      if (intent.metadata?.payment_stage !== "final_balance" || !intent.metadata.project_id) return;
      const failure = classifyChargeFailure(intent.last_payment_error?.code);
      await recordFinalFailure(db, intent.metadata.project_id, failure.status, failure.code, intent.id);
      return;
    }
    case "charge.refunded": {
      const refunds = await stripe.refunds.list({ charge: event.data.object.id, limit: 100 });
      for (const refund of refunds.data) await applyRefund(db, refund);
      return;
    }
    case "refund.updated":
      await applyRefund(db, event.data.object);
      return;
    case "charge.dispute.created": {
      const dispute = event.data.object;
      const pi = idOf(dispute.payment_intent);
      if (pi) await recordDispute(db, pi, dispute.id);
      return;
    }
    default:
      return; // not subscribed; ignore
  }
};

/**
 * Processes one verified event exactly once in effect. The event id is claimed first (unique), and
 * processed_at is stamped only after the handlers finish, so a crash mid-way lets Stripe's retry finish the
 * job while a completed event is a no-op. Handlers are idempotent on their own as a second line of defence.
 */
export const processEvent = async (event: Stripe.Event): Promise<"processed" | "duplicate"> => {
  const db = adminDb();
  const { error } = await db.from("stripe_webhook_events").insert({ event_id: event.id, event_type: event.type });
  if (error) {
    if (error.code !== "23505") throw new PaymentError("database");
    const { data } = await db.from("stripe_webhook_events").select("processed_at").eq("event_id", event.id).maybeSingle<{ processed_at: string | null }>();
    if (data?.processed_at) return "duplicate";
  }
  await dispatch(db, event);
  await db.from("stripe_webhook_events").update({ processed_at: new Date().toISOString() }).eq("event_id", event.id);
  return "processed";
};
