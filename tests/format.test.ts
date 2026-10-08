import { afterEach, describe, expect, it, vi } from "vitest";
import { clockTime, dayKey, isOverdue, relativeDay, shortDate } from "@/lib/portal/format";

// 2026-10-08 02:30 UTC is still the evening of Oct 7 in the studio's zone (America/Chicago, UTC-5).
const LATE_EVENING = new Date("2026-10-08T02:30:00.000Z");

describe("portal dates use one display timezone", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps date-only values on their calendar day", () => {
    expect(shortDate("2026-10-07")).toMatch(/^Oct 7/);
  });

  it("formats timestamps in the studio zone, not the host zone", () => {
    expect(shortDate("2026-10-08T02:30:00.000Z")).toMatch(/^Oct 7/);
    expect(clockTime("2026-10-08T02:30:00.000Z")).toBe("9:30 PM");
  });

  it("does not flip a same-day deadline to overdue in the evening", () => {
    vi.useFakeTimers();
    vi.setSystemTime(LATE_EVENING);
    expect(dayKey()).toBe("2026-10-07");
    expect(relativeDay("2026-10-07")).toBe("Today");
    expect(isOverdue("2026-10-07", "building")).toBe(false);
    expect(isOverdue("2026-10-06", "building")).toBe(true);
    expect(relativeDay("2026-10-08")).toBe("Tomorrow");
  });

  it("handles missing and invalid input", () => {
    expect(shortDate(null)).toBe("");
    expect(shortDate("not a date")).toBe("");
    expect(relativeDay(undefined)).toBe("No date");
  });
});
