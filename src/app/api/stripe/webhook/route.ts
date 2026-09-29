import { json } from "@/lib/payments/http";
import { PaymentError } from "@/lib/payments/project";
import { processEvent, verifyEvent } from "@/lib/payments/webhook";

/**
 * Stripe webhook: the source of truth for payment state. Needs the RAW body for signature verification
 * (request.text(), never request.json()). Invalid signature = 400 and nothing is processed. A handler
 * failure returns 500 so Stripe retries; a replayed event is a 200 no-op.
 * Subscribe it to exactly the events in WEBHOOK_EVENTS (lib/payments/webhook.ts).
 */
export async function POST(request: Request) {
  const raw = await request.text();
  let event;
  try {
    event = verifyEvent(raw, request.headers.get("stripe-signature"));
  } catch (error) {
    const code = error instanceof PaymentError ? error.code : "invalid";
    if (code === "not_configured") console.error("[stripe] webhook secret or API key missing");
    return json({ error: code }, code === "not_configured" ? 503 : 400);
  }
  try {
    const outcome = await processEvent(event);
    return json({ received: true, outcome });
  } catch (error) {
    console.error("[stripe] event failed:", event.type, event.id, error instanceof PaymentError ? error.code : "unknown");
    return json({ error: "processing_failed" }, 500);
  }
}
