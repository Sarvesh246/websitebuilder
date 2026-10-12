import { CANCELLATION_WINDOW_DAYS } from "@/config/payments";

/** Preserve the published calendar-day policy and use the same window in the UI and server. */
export const inCancellationWindow = (paidAt: string | null, now: Date = new Date()): boolean => {
  if (!paidAt) return false;
  const paid = new Date(paidAt);
  const elapsed = now.getTime() - paid.getTime();
  const utcDay = (date: Date) =>
    Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  return Number.isFinite(elapsed) && elapsed >= 0 && utcDay(now) - utcDay(paid) <= CANCELLATION_WINDOW_DAYS;
};
