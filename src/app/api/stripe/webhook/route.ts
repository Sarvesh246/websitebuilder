import { defaultDeps } from "@/lib/payments/stripe";
import { processStripeWebhook } from "@/lib/payments/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe webhook. Signature is verified over the raw body; this is the only code path that marks money paid. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return new Response("Webhook is not configured", { status: 503 });

  let deps;
  try {
    deps = defaultDeps();
  } catch {
    return new Response("Payments are not configured", { status: 503 });
  }

  const rawBody = await request.text();
  const result = await processStripeWebhook(deps, { rawBody, signature: request.headers.get("stripe-signature"), secret });
  return new Response(result.body, { status: result.status });
}
