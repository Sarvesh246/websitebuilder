import { describe, expect, it } from "vitest";
import { discountLabel, packageTiers, studentFootnote } from "@/config/pricing";
import { dueSummary, pricingSnapshot, splitTotal } from "@/lib/payments/plan";

describe("pricingSnapshot", () => {
  it("launch is paid in full upfront with nothing remaining", () => {
    expect(pricingSnapshot("launch")).toEqual({ total: 4900, deposit: 4900, remaining: 0, currency: "usd", finalRequired: false });
  });
  it("presence splits 9950 / 9950", () => {
    expect(pricingSnapshot("presence")).toMatchObject({ total: 19900, deposit: 9950, remaining: 9950, finalRequired: true });
  });
  it("business splits 17450 / 17450", () => {
    expect(pricingSnapshot("business")).toMatchObject({ total: 34900, deposit: 17450, remaining: 17450, finalRequired: true });
  });
  it("displays Launch as student pricing and the others as Founding Client Pricing, each with its regular price", () => {
    const by = Object.fromEntries(packageTiers.map((t) => [t.id, t]));
    expect([by.launch.price, by.launch.regularPrice, discountLabel(by.launch)]).toEqual([49, 99, "Student pricing"]);
    expect([by.presence.price, by.presence.regularPrice, discountLabel(by.presence)]).toEqual([199, 349, "Founding Client Pricing"]);
    expect([by.business.price, by.business.regularPrice, discountLabel(by.business)]).toEqual([349, 499, "Founding Client Pricing"]);
    expect(studentFootnote()).toBe("*Student pricing: Launch is $49 for students, regularly $99.");
  });
  it("gives the odd cent to the final payment", () => {
    expect(splitTotal(20001)).toEqual({ deposit: 10000, remaining: 10001 });
    expect(splitTotal(1)).toEqual({ deposit: 0, remaining: 1 });
  });
  it("custom has no assumed amounts", () => {
    expect(pricingSnapshot("custom")).toEqual({ total: null, deposit: null, remaining: null, currency: "usd", finalRequired: true });
  });
});

describe("dueSummary", () => {
  const base = { deposit_amount: 10000, remaining_amount: 10000, initial_payment_status: "pending", final_payment_status: "pending" };
  it("awaits a quote when there is no price", () => {
    expect(dueSummary({ ...base, deposit_amount: null, remaining_amount: null }).label).toBe("Awaiting quote");
  });
  it("shows the deposit due today and the rest later", () => {
    expect(dueSummary(base)).toEqual({ dueNow: 10000, dueLater: 10000, label: "Due today" });
  });
  it("shows the balance due after revisions once the deposit is paid", () => {
    expect(dueSummary({ ...base, initial_payment_status: "paid" })).toEqual({ dueNow: 0, dueLater: 10000, label: "Due after revisions" });
  });
  it("shows the balance due now after a failed final charge", () => {
    expect(dueSummary({ ...base, initial_payment_status: "paid", final_payment_status: "failed" })).toEqual({ dueNow: 10000, dueLater: 0, label: "Final payment due" });
  });
  it("is settled for Launch and after the final payment", () => {
    expect(dueSummary({ deposit_amount: 5000, remaining_amount: 0, initial_payment_status: "paid", final_payment_status: "not_required" }).label).toBe("Paid in full");
    expect(dueSummary({ ...base, initial_payment_status: "paid", final_payment_status: "paid" }).label).toBe("Paid in full");
  });
});
