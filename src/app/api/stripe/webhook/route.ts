import { defaultDeps } from "@/lib/payments/stripe";
import { processStripeWebhook } from "@/lib/payments/webhook";
import { boundedText } from "@/lib/http/boundedText";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe webhook. Signature is verified over the raw body; this is the only code path that marks money paid. */
export async function POST(request: Request) {
  if (!request.headers.get("stripe-signature")) return new Response("Missing signature", { status: 400 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return new Response("Webhook is not configured", { status: 503 });

  let deps;
  try {
    deps = defaultDeps();
  } catch {
    return new Response("Payments are not configured", { status: 503 });
  }

  let rawBody: string;
  try { rawBody = await boundedText(request.body, 1_048_576); }
  catch (error) { return new Response("Invalid webhook body", { status: error instanceof RangeError ? 413 : 400 }); }
  const result = await processStripeWebhook(deps, { rawBody, signature: request.headers.get("stripe-signature"), secret });
  return new Response(result.body, { status: result.status });
}
