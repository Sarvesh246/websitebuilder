import { describe, expect, it } from "vitest";
import { dueSummary, pricingSnapshot, splitTotal } from "@/lib/payments/plan";

describe("pricingSnapshot", () => {
  it("launch is paid in full upfront with nothing remaining", () => {
    expect(pricingSnapshot("launch")).toEqual({ total: 5000, deposit: 5000, remaining: 0, currency: "usd", finalRequired: false });
  });
  it("presence splits 10000 / 10000", () => {
    expect(pricingSnapshot("presence")).toMatchObject({ total: 20000, deposit: 10000, remaining: 10000, finalRequired: true });
  });
  it("business splits 17500 / 17500", () => {
    expect(pricingSnapshot("business")).toMatchObject({ total: 35000, deposit: 17500, remaining: 17500, finalRequired: true });
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
