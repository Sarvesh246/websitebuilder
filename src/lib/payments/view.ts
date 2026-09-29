import "server-only";
import { packageTiers } from "@/config/pricing";
import { adminDb, loadProject, type ProjectPayRow } from "./project";
import { withinCancellationWindow } from "./rules";

export type PayPhase =
  | "quote" | "pay_initial" | "deposit_paid" | "paid_full" | "final_due" | "final_processing" | "complete" | "cancelled" | "refunded";

/** Browser-safe view of a project's money. Contains no Stripe ids, no email, no internal fields. */
export type PayView = {
  id: string;
  packageName: string;
  phase: PayPhase;
  totalCents: number | null;
  dueTodayCents: number | null;
  dueLaterCents: number | null;
  paidCents: number;
  remainingCents: number | null;
  hasBalanceLater: boolean;
  readyForLaunch: boolean;
  canRequestCancellation: boolean;
  cancellationRequested: boolean;
};

const phaseOf = (r: ProjectPayRow): PayPhase => {
  if (r.refund_status === "refunded") return "refunded";
  if (r.status === "cancelled") return "cancelled";
  if (r.initial_payment_status !== "succeeded") return r.total_cents === null ? "quote" : "pay_initial";
  if (r.final_payment_status === "succeeded") return "complete";
  if (r.final_payment_status === "failed" || r.final_payment_status === "requires_action") return "final_due";
  if (r.final_payment_status === "processing") return "final_processing";
  return (r.remaining_cents ?? 0) === 0 ? "paid_full" : "deposit_paid";
};

export const getPayView = async (id: string): Promise<PayView> => {
  const r = await loadProject(adminDb(), id);
  const phase = phaseOf(r);
  const initialPaid = r.initial_payment_status === "succeeded";
  return {
    id: r.id,
    packageName: packageTiers.find((t) => t.id === r.package)?.name ?? "Custom",
    phase,
    totalCents: r.total_cents,
    dueTodayCents: r.deposit_cents,
    dueLaterCents: r.total_cents === null || r.deposit_cents === null ? null : r.total_cents - r.deposit_cents,
    paidCents: r.amount_paid ?? 0,
    remainingCents: r.remaining_cents,
    hasBalanceLater: r.total_cents !== null && r.deposit_cents !== null && r.total_cents > r.deposit_cents,
    readyForLaunch: r.status === "ready_for_launch" || r.status === "completed",
    canRequestCancellation:
      initialPaid && phase !== "cancelled" && phase !== "refunded" && !r.cancellation_requested_at && withinCancellationWindow(r.initial_paid_at),
    cancellationRequested: !!r.cancellation_requested_at,
  };
};
