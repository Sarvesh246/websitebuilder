import "server-only";
import { PaymentError, paymentMessage, paymentStatusCode } from "./project";

export const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Same-origin guard for browser-called routes (blocks other sites posting from a visitor's browser). */
export const sameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
};

export const clientIp = (request: Request) =>
  request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

/** Maps thrown PaymentErrors to safe JSON. Anything else is logged by class only and reported generically. */
export const fail = (error: unknown) => {
  if (error instanceof PaymentError) return json({ error: error.code, message: paymentMessage(error.code) }, paymentStatusCode(error.code));
  console.error("[payments] unexpected:", error instanceof Error ? error.name : "unknown");
  return json({ error: "database", message: paymentMessage("database") }, 500);
};

/** Small JSON body reader with a size cap. Returns null when malformed. */
export const readJson = async (request: Request, max = 2048): Promise<Record<string, unknown> | null> => {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;
  const text = await request.text();
  if (text.length > max) return null;
  try {
    const parsed: unknown = text ? JSON.parse(text) : {};
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};
