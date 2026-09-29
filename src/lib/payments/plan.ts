import { packageTiers, type PackageId } from "@/config/pricing";

/**
 * The single place package prices become money. Everything is integer cents.
 * launch = 100% upfront. presence and business = floor(total / 2) upfront, the remainder after revisions.
 * custom has no fixed price: amounts are set on the project row by the studio and read from there.
 */
export type PricingSnapshot = {
  total: number | null;
  deposit: number | null;
  remaining: number | null;
  currency: "usd";
  /** False when the whole price is taken upfront (nothing remains to be charged later). */
  finalRequired: boolean;
};

const SPLIT_PACKAGES: readonly PackageId[] = ["presence", "business"];

export const dollarsToCents = (dollars: number): number => Math.round(dollars * 100);

/** Split: the studio-friendly half is floored for the deposit; any odd cent goes to the final payment. */
export const splitTotal = (total: number) => {
  const deposit = Math.floor(total / 2);
  return { deposit, remaining: total - deposit };
};

export const pricingSnapshot = (packageId: PackageId): PricingSnapshot => {
  if (packageId === "custom") return { total: null, deposit: null, remaining: null, currency: "usd", finalRequired: true };
  const tier = packageTiers.find((item) => item.id === packageId);
  if (!tier) throw new Error(`Unknown package: ${packageId}`);
  const total = dollarsToCents(tier.price);
  if (!SPLIT_PACKAGES.includes(packageId)) return { total, deposit: total, remaining: 0, currency: "usd", finalRequired: false };
  return { total, ...splitTotal(total), currency: "usd", finalRequired: true };
};

export type DueInput = {
  deposit_amount: number | null;
  remaining_amount: number | null;
  initial_payment_status: string;
  final_payment_status: string;
};

export type DueSummary = {
  /** Cents payable right now. */
  dueNow: number;
  /** Cents that will fall due later (after revisions). */
  dueLater: number;
  label: "Awaiting quote" | "Due today" | "Due after revisions" | "Final payment due" | "Paid in full";
};

/** What a client owes and when, derived only from the stored snapshot and payment states. */
export const dueSummary = (row: DueInput): DueSummary => {
  if (row.deposit_amount == null) return { dueNow: 0, dueLater: 0, label: "Awaiting quote" };
  const remaining = row.remaining_amount ?? 0;
  const finalSettled = remaining === 0 || row.final_payment_status === "paid" || row.final_payment_status === "not_required";
  if (row.initial_payment_status !== "paid") {
    return { dueNow: row.deposit_amount, dueLater: finalSettled ? 0 : remaining, label: "Due today" };
  }
  if (finalSettled) return { dueNow: 0, dueLater: 0, label: "Paid in full" };
  if (row.final_payment_status === "failed" || row.final_payment_status === "requires_action") {
    return { dueNow: remaining, dueLater: 0, label: "Final payment due" };
  }
  return { dueNow: 0, dueLater: remaining, label: "Due after revisions" };
};
