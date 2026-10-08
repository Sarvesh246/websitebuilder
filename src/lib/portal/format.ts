/** Client-safe display helpers for portal dates and names. No server imports. */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * One display timezone for the studio's portal. Server components render on UTC hosts and client
 * components in the visitor's zone; pinning both to the studio's zone keeps server and browser output
 * identical (no hydration mismatch) and stops "Today" flipping at 7pm local.
 */
export const DISPLAY_TZ = "America/Chicago";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: DISPLAY_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Calendar day as a UTC-midnight timestamp. Date-only strings are days already; timestamps use DISPLAY_TZ. */
const calendarDay = (value: string | Date): number => {
  const m = typeof value === "string" ? DATE_ONLY.exec(value) : null;
  if (m) return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return NaN;
  const [y, mo, da] = dayKeyFormat.format(d).split("-").map(Number);
  return Date.UTC(y, mo - 1, da);
};

/** Today's calendar day ("2026-10-07") in DISPLAY_TZ, the same basis as relativeDay and isOverdue. */
export const dayKey = (at: Date = new Date()): string => dayKeyFormat.format(at);

const dayDiff = (iso: string): number => Math.round((calendarDay(iso) - calendarDay(new Date())) / 86_400_000);

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/** "Today", "Tomorrow", "in 3 days", "1 day overdue", "2 days overdue". */
export const relativeDay = (iso: string | null | undefined): string => {
  if (!iso) return "No date";
  const diff = dayDiff(iso);
  if (Number.isNaN(diff)) return "No date";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `in ${plural(diff, "day")}`;
  return `${plural(-diff, "day")} overdue`;
};

export const shortDate = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const day = calendarDay(iso);
  if (Number.isNaN(day)) return "";
  const d = new Date(day);
  const sameYear = d.getUTCFullYear() === new Date(calendarDay(new Date())).getUTCFullYear();
  return d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
};

/** "3:05 PM". */
export const clockTime = (iso: string): string => new Date(iso).toLocaleTimeString("en-US", { timeZone: DISPLAY_TZ, hour: "numeric", minute: "2-digit" });

export const timeAgo = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return shortDate(iso);
};

export const initials = (name: string | null | undefined): string => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
};

/** True when an open project (not completed or cancelled) is past its deadline. */
export const isOverdue = (deadline: string | null | undefined, stage: string): boolean => {
  if (!deadline || stage === "completed" || stage === "cancelled") return false;
  const diff = dayDiff(deadline);
  return !Number.isNaN(diff) && diff < 0;
};
