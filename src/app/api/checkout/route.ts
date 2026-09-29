import { startCheckout } from "@/lib/payments/checkout";
import { clientIp, fail, json, readJson, sameOrigin } from "@/lib/payments/http";
import { PaymentError } from "@/lib/payments/project";
import { rateLimit } from "@/lib/inquiry/rateLimit";

/**
 * Starts Stripe Checkout for the project's next payment. Body: { projectId, accept? }. The browser never
 * sends an amount, stage or price: those come from the database (see lib/payments/checkout.ts).
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const body = await readJson(request);
  if (!body || typeof body.projectId !== "string" || (body.accept !== undefined && typeof body.accept !== "boolean")) {
    return fail(new PaymentError("invalid"));
  }
  if (!rateLimit(`checkout:${clientIp(request)}`, 20)) return json({ error: "rate_limited", message: "Too many attempts. Please wait a few minutes." }, 429);
  try {
    return json(await startCheckout(body.projectId, { accept: body.accept === true }));
  } catch (error) {
    return fail(error);
  }
}
