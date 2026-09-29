import { adminAuth } from "@/lib/payments/admin";
import { fail, json, readJson } from "@/lib/payments/http";
import { PaymentError } from "@/lib/payments/project";
import { setQuote } from "@/lib/payments/refund";

/** Staff-only: set a Custom project's total (cents). Upfront defaults to 50%; pass depositCents to override. Refused once payment has started. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminAuth(request);
  if (auth !== "ok") return json({ error: auth }, auth === "denied" ? 401 : 503);
  const body = await readJson(request);
  if (!body || !Number.isInteger(body.totalCents) || (body.depositCents !== undefined && !Number.isInteger(body.depositCents))) return fail(new PaymentError("invalid"));
  try {
    await setQuote((await params).id, body.totalCents as number, (body.depositCents as number | undefined) ?? Math.floor((body.totalCents as number) / 2));
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
