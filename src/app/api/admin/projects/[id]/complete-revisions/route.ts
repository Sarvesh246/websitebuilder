import { adminAuth } from "@/lib/payments/admin";
import { collectFinalPayment } from "@/lib/payments/final";
import { fail, json } from "@/lib/payments/http";

/** Staff-only: revisions are done, collect the final balance. Bearer ADMIN_API_TOKEN. No body; the amount is server-side. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminAuth(request);
  if (auth !== "ok") return json({ error: auth }, auth === "denied" ? 401 : 503);
  try {
    return json({ ...(await collectFinalPayment((await params).id)) });
  } catch (error) {
    return fail(error);
  }
}
