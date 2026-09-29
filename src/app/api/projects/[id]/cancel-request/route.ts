import { clientIp, fail, json, sameOrigin } from "@/lib/payments/http";
import { rateLimit } from "@/lib/inquiry/rateLimit";
import { requestCancellation } from "@/lib/payments/refund";

/** Customer asks to cancel under the 3-Day Project Cancellation Policy. Records the request only: no automatic refund. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!rateLimit(`cancel:${clientIp(request)}`, 10)) return json({ error: "rate_limited" }, 429);
  try {
    await requestCancellation((await params).id);
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
