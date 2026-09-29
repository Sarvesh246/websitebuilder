import { after } from "next/server";
import { limits } from "@/config/inquiry";
import { deliverInquiry, emailConfig, sendAutoReply } from "@/lib/inquiry/email";
import { rateLimit } from "@/lib/inquiry/rateLimit";
import { validateInquiry } from "@/lib/inquiry/schema";

/** Below this many ms between the first visit to the form and submit, treat it as a bot (a human can't
 *  finish five steps that fast; the start time survives refreshes via the client draft). */
const MIN_FILL_MS = 3000;

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  // Same-origin only: blocks other sites posting here from a visitor's browser.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) return json({ error: "forbidden" }, 403);
    } catch {
      return json({ error: "forbidden" }, 403);
    }
  }
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "bad_request" }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > limits.body) return json({ error: "too_large" }, 413);

  const text = await request.text();
  if (text.length > limits.body) return json({ error: "too_large" }, 413);
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  // Honeypot (hidden field a person never fills) and fill-time check. Bots get a quiet "success".
  const elapsed = typeof body.elapsed === "number" ? body.elapsed : 0;
  if (typeof body.hp === "string" && body.hp !== "") return json({ ok: true });
  if (elapsed < MIN_FILL_MS) return json({ ok: true });

  const result = validateInquiry(body);
  if (!result.ok) return json({ error: "invalid", fields: result.errors }, 422);

  // Only valid submissions count toward the limit, so a visitor fixing typos is never locked out.
  // Prefer the platform-set client IP; without one, share a looser bucket instead of blocking everyone.
  const ip = request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!(ip ? rateLimit(ip) : rateLimit("unknown", 30))) return json({ error: "rate_limited" }, 429);

  if (!emailConfig()) {
    console.error("[inquiry] delivery is not configured (RESEND_API_KEY, CONTACT_EMAIL, FROM_EMAIL)");
    return json({ error: "unavailable" }, 503);
  }
  try {
    await deliverInquiry(result.data);
  } catch (error) {
    // Log the failure class only, never the submitted content.
    console.error("[inquiry] delivery failed:", error instanceof Error ? error.message : "unknown");
    return json({ error: "delivery_failed" }, 502);
  }
  after(() => sendAutoReply(result.data));
  return json({ ok: true });
}
