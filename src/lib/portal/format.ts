/** Client-safe display helpers for portal dates and names. No server imports. */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Date-only strings ("2026-10-03") are calendar days, so they parse as local dates and never shift. */
const parse = (iso: string): Date => {
  const m = DATE_ONLY.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
};

const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const dayDiff = (iso: string): number => {
  const d = parse(iso);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target.getTime() - startOfToday().getTime()) / 86_400_000);
};

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
  const d = parse(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
};

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
