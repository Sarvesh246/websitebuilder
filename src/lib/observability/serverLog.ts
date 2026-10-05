import "server-only";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

type Level = "info" | "warn" | "error";
export type LogAttrs = Record<string, string | number | boolean>;

const severity: Record<Level, SeverityNumber> = {
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};

const clean = (attrs: LogAttrs): LogAttrs =>
  Object.fromEntries(
    Object.entries(attrs)
      .slice(0, 10)
      .map(([k, v]) => [k.slice(0, 40), typeof v === "string" ? v.slice(0, 120) : v]),
  );

/**
 * One place for server-side logging.
 * - `event` is a fixed name and `attrs` are ids / error classes ONLY. Never put names, emails, message
 *   text, amounts, card data, tokens or provider error messages in either: they are sent to PostHog.
 * - `localDetail` is printed to the console (Vercel logs) but is never sent to PostHog.
 * With no log provider registered (no POSTHOG_LOGS_KEY) the OTel call is a no-op.
 */
export const serverLog = (level: Level, event: string, attrs: LogAttrs = {}, localDetail?: string) => {
  const pairs = Object.entries(attrs).map(([k, v]) => `${k}=${v}`);
  console[level](`[${event}]`, ...pairs, ...(localDetail ? [localDetail] : []));
  try {
    logs.getLogger("northframe").emit({
      severityNumber: severity[level],
      severityText: level.toUpperCase(),
      body: event,
      attributes: clean(attrs),
    });
  } catch {
    // Logging must never break a request.
  }
};
