import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Staff authorization for privileged payment actions (collect final balance, refund, quote).
 * There is no admin login yet, so these routes require the bearer secret ADMIN_API_TOKEN (>= 32 chars,
 * server-only env). Not configured = the routes refuse everything. The future dashboard should replace
 * this check with a real admin session and keep calling the same service functions.
 */
export const adminAuth = (request: Request): "ok" | "denied" | "not_configured" => {
  const secret = process.env.ADMIN_API_TOKEN?.trim();
  if (!secret || secret.length < 32) return "not_configured";
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(given), digest(secret)) ? "ok" : "denied";
};
