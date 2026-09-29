import { packageTiers, type PackageId } from "@/config/pricing";

/** All money is integer cents. Never use floating-point dollars for authoritative amounts. */
export type PaymentPlan = { total: number; deposit: number; remaining: number };

export const toCents = (dollars: number) => Math.round(dollars * 100);
export const formatCents = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** Validates a total/deposit pair (used for both catalogue packages and staff-entered Custom quotes). */
export const makePlan = (total: number, deposit: number): PaymentPlan | null => {
  if (![total, deposit].every(Number.isInteger) || total <= 0 || deposit <= 0 || deposit > total) return null;
  return { total, deposit, remaining: total - deposit };
};

/**
 * The plan for a catalogue package, derived from config/pricing.ts (the single price source).
 * Custom has no catalogue price: staff set its total and deposit independently.
 * The result is snapshotted onto the project row, so later price changes never touch an existing order.
 */
export const planForPackage = (id: PackageId): PaymentPlan | null => {
  const tier = packageTiers.find((t) => t.id === id);
  if (!tier) return null;
  const total = toCents(tier.price);
  return makePlan(total, Math.floor((total * tier.upfrontPercent) / 100));
};
