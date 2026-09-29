import { adminAuth } from "@/lib/payments/admin";
import { fail, json, readJson } from "@/lib/payments/http";
import { PaymentError } from "@/lib/payments/project";
import { refundProject } from "@/lib/payments/refund";

/** Staff-only refund. Body (optional): { amountCents?: integer, cancel?: boolean }. Default = the initial payment. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminAuth(request);
  if (auth !== "ok") return json({ error: auth }, auth === "denied" ? 401 : 503);
  const body = await readJson(request);
  if (!body || (body.amountCents !== undefined && !Number.isInteger(body.amountCents)) || (body.cancel !== undefined && typeof body.cancel !== "boolean")) {
    return fail(new PaymentError("invalid"));
  }
  try {
    return json({ ...(await refundProject((await params).id, { amountCents: body.amountCents as number | undefined, cancel: body.cancel === true })) });
  } catch (error) {
    return fail(error);
  }
}
