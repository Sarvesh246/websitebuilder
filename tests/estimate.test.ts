import { describe, expect, it } from "vitest";
import { estimate } from "@/lib/estimate";

const fixedId = (r: ReturnType<typeof estimate>) => (r.kind === "fixed" ? r.tier.id : "custom");

describe("website cost calculator", () => {
  it("sizes by pages", () => {
    expect(fixedId(estimate("1", []))).toBe("launch");
    expect(fixedId(estimate("2-3", []))).toBe("presence");
    expect(fixedId(estimate("4-5", []))).toBe("business");
    expect(fixedId(estimate("6+", []))).toBe("custom");
  });

  it("features only move the estimate up", () => {
    expect(fixedId(estimate("1", ["contact-form"]))).toBe("presence");
    expect(fixedId(estimate("1", ["team-events"]))).toBe("business");
    expect(fixedId(estimate("4-5", ["contact-form"]))).toBe("business");
    expect(fixedId(estimate("1", ["payments"]))).toBe("custom");
  });

  it("splits payment like the checkout does", () => {
    const launch = estimate("1", []);
    const business = estimate("4-5", []);
    if (launch.kind !== "fixed" || business.kind !== "fixed") throw new Error("expected fixed");
    expect(launch.laterCents).toBe(0);
    expect(launch.upfrontCents).toBe(launch.tier.price * 100);
    expect(business.upfrontCents + business.laterCents).toBe(business.tier.price * 100);
  });
});
