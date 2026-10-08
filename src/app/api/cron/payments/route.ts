import { timingSafeEqual } from "node:crypto";
import { reconcilePayments } from "@/lib/payments/reconcile";
import { defaultDeps } from "@/lib/payments/stripe";
import { serverLog } from "@/lib/observability/serverLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Constant-time check of Vercel Cron's `Authorization: Bearer <CRON_SECRET>`. */
const authorized = (header: string | null, secret: string) => {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

/**
 * Daily payment reconciliation (vercel.json "crons"). Refuses to run without CRON_SECRET, so the endpoint
 * is never public. The response carries counts only.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return new Response("Cron is not configured", { status: 503 });
  if (!authorized(request.headers.get("authorization"), secret)) return new Response("Unauthorized", { status: 401 });

  let deps;
  try {
    deps = defaultDeps();
  } catch {
    return new Response("Payments are not configured", { status: 503 });
  }
  try {
    const summary = await reconcilePayments(deps, { budgetMs: 45_000 });
    serverLog(summary.errors ? "warn" : "info", "payments.reconcile_done", { ...summary });
    return Response.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch {
    serverLog("error", "payments.reconcile_failed");
    return new Response("Reconciliation failed", { status: 500 });
  }
}
