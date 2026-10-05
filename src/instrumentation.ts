/**
 * Next.js loads this once at server start (stable in Next 16, no config flag needed).
 * Server logs go to PostHog only when POSTHOG_LOGS_KEY is set; see lib/observability.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const key = process.env.POSTHOG_LOGS_KEY?.trim();
  if (!key) return;
  const { initServerLogs } = await import("./lib/observability/otel");
  initServerLogs(key, process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com");
}
