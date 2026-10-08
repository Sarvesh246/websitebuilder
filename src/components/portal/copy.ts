import { dueSummary } from "@/lib/payments/plan";
import { packageName } from "./parts";
import type { PaymentStatus, ProjectDetail, ProjectStage, ProjectSummary } from "@/lib/portal/types";
import { formatUsd } from "@/lib/money";

/** What the client owes and when, from the stored snapshot (no Stripe, no client input). */
export const dueFor = (p: ProjectSummary) =>
  dueSummary({ deposit_amount: p.money.deposit, remaining_amount: p.money.remaining, initial_payment_status: p.initialPayment, final_payment_status: p.finalPayment });

export const stageSentence: Record<ProjectStage, string> = {
  requested: "Your request is in. The studio will review it and confirm the details.",
  accepted: "Your project is accepted. Work begins shortly.",
  building: "The studio is building your site.",
  client_review: "A preview is ready for you to review. Send any changes you would like.",
  revisions: "Revisions are in progress based on your feedback.",
  awaiting_final_payment: "Your site is finished. The remaining balance is the last step before launch.",
  ready_for_launch: "Paid and approved. Your site is ready to launch.",
  completed: "Your project is complete.",
  cancelled: "This project was cancelled.",
};

export const projectTitle = (p: Pick<ProjectSummary, "organization" | "websiteType" | "package">) =>
  p.organization || p.websiteType || `${packageName(p.package)} website`;

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  succeeded: "Paid",
  failed: "Failed",
  requires_action: "Action needed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partly refunded",
};

export const paymentTypeLabel = { full: "Full payment", deposit: "Deposit", final_balance: "Final balance", refund: "Refund" } as const;

/** Month key ("2026-05" or already a label) to a short month name. */
export const monthLabel = (m: string): string => {
  const hit = /^(\d{4})-(\d{2})/.exec(m);
  if (!hit) return m;
  return new Date(Number(hit[1]), Number(hit[2]) - 1, 1).toLocaleDateString("en-US", { month: "short" });
};

/**
 * The balance a client's approval will charge to their saved card, formatted, or null when approving
 * charges nothing (paid in full, nothing saved yet, or already paid). Mirrors collectFinalBalance's rules.
 */
export const approvalChargeLabel = (p: Pick<ProjectDetail, "initialPayment" | "finalPayment" | "money">): string | null => {
  const remaining = p.money.remaining ?? 0;
  if (p.initialPayment !== "paid" || remaining <= 0) return null;
  if (!["pending", "failed", "requires_action"].includes(p.finalPayment)) return null;
  return formatUsd(remaining);
};

export const approvalNote = (charge: string | null, base: string): string =>
  charge ? `${base} Your remaining balance of ${charge} is then charged to the card you saved at checkout.` : `${base} It doesn't charge anything.`;
