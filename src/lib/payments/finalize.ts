import "server-only";
import { serverLog } from "@/lib/observability/serverLog";
import type { LedgerRow, ProjectPayRow } from "@/lib/payments/repo";
import { refundDuplicatePayment } from "@/lib/payments/autoRefund";
import { flagForReview, remindBalanceDue } from "@/lib/payments/notify";
import type { PaymentsDeps } from "@/lib/payments/stripe";

/**
 * The only functions that change money state. Webhooks call them (source of truth); the synchronous
 * off-session charge calls the SAME functions when Stripe already reports success. Each one is guarded by
 * a compare-and-set on the current state, so replays and races change state once.
 */
export type FinalizeResult = "applied" | "noop" | "mismatch" | "duplicate";

const depositKey = (projectId: string) => `project:${projectId}:deposit`;
export const finalKey = (projectId: string) => `project:${projectId}:final`;
const refundKey = (paymentIntentId: string, cumulative: number) => `refund:${paymentIntentId}:${cumulative}`;

/** Log class + ids only, never amounts, card data, secrets or Stripe messages. */
const note = (kind: string, projectId: string) => serverLog("error", `payments.${kind}`, { project: projectId });

const CLOSED = ["cancelled", "completed"];

type Obligation = "deposit" | "final_balance";
const recordedIntent = (p: ProjectPayRow, stage: Obligation) => (stage === "deposit" ? p.stripe_deposit_pi : p.stripe_final_pi);
const isPaid = (p: ProjectPayRow, stage: Obligation) => (stage === "deposit" ? p.initial_payment_status : p.final_payment_status) === "paid";

/** A second payment for an obligation already paid by a different intent: refunded automatically after live checks, or flagged. */
const handleDuplicate = async (deps: PaymentsDeps, project: ProjectPayRow, stage: Obligation, paymentIntentId: string): Promise<FinalizeResult> => {
  const recordedId = recordedIntent(project, stage);
  if (recordedId === paymentIntentId) return "noop"; // replay of the payment we recorded
  note(stage === "deposit" ? "duplicate_deposit_payment" : "duplicate_final_payment", project.id);
  await refundDuplicatePayment(deps, { projectId: project.id, stage, duplicateId: paymentIntentId, recordedId });
  return "duplicate";
};

/**
 * Two different payments can arrive at the same moment: both see "unpaid", one wins the compare-and-set.
 * The loser re-reads the row; if the obligation is now paid by the other intent, its payment is the duplicate.
 */
const afterLostRace = async (deps: PaymentsDeps, projectId: string, stage: Obligation, paymentIntentId: string): Promise<FinalizeResult> => {
  const now = await deps.repo.getProject(projectId);
  return now && isPaid(now, stage) ? handleDuplicate(deps, now, stage, paymentIntentId) : "noop";
};

/** A received amount that does not match the stored price is never recorded or refunded automatically. */
const flagMismatch = async (deps: PaymentsDeps, projectId: string, kind: string, paymentIntentId: string): Promise<FinalizeResult> => {
  note(kind, projectId);
  await flagForReview(deps, {
    key: `mismatch:${paymentIntentId}`,
    projectId,
    timeline: "A payment did not match the expected amount. The studio is reviewing it.",
    subject: "payment amount mismatch",
    detail: "Stripe reported a payment whose amount does not match the price stored for this project. It was not recorded and not refunded. Check it in Stripe.",
    paymentIntentId,
  });
  return "mismatch";
};

/**
 * The saved payment method and Stripe's hosted receipt for a PaymentIntent. Best effort: a failed lookup
 * never blocks recording the payment (the receipt link is a convenience, the ledger is the record).
 */
export const intentDetails = async (
  stripe: PaymentsDeps["stripe"],
  paymentIntentId: string,
): Promise<{ paymentMethodId: string | null; receiptUrl: string | null } | null> => {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
    const pm = intent.payment_method;
    const charge = intent.latest_charge;
    const receipt = typeof charge === "object" && charge ? charge.receipt_url : null;
    return {
      paymentMethodId: typeof pm === "string" ? pm : (pm?.id ?? null),
      receiptUrl: typeof receipt === "string" && receipt.startsWith("https://") && receipt.length <= 500 ? receipt : null,
    };
  } catch {
    return null;
  }
};

export const finalizeDeposit = async (
  deps: PaymentsDeps,
  input: { projectId: string; paymentIntentId: string; amountReceived: number; sessionId?: string | null; paymentMethodId?: string | null },
): Promise<FinalizeResult> => {
  const { repo, stripe, now } = deps;
  const project = await repo.getProject(input.projectId);
  if (!project) return "noop";
  if (isPaid(project, "deposit")) return handleDuplicate(deps, project, "deposit", input.paymentIntentId);
  if (project.deposit_amount == null || input.amountReceived !== project.deposit_amount) return flagMismatch(deps, input.projectId, "deposit_amount_mismatch", input.paymentIntentId);

  const remaining = project.remaining_amount ?? 0;
  const split = remaining > 0;
  // One lookup serves both the saved card (split packages) and the Stripe receipt link.
  const details = await intentDetails(stripe, input.paymentIntentId);
  if (!details) note("payment_intent_lookup_failed", input.projectId);
  const paymentMethodId = input.paymentMethodId ?? details?.paymentMethodId ?? null;

  const paidAt = now().toISOString();
  const patch: Partial<ProjectPayRow> = {
    initial_payment_status: "paid",
    initial_paid_at: paidAt,
    amount_paid: input.amountReceived,
    payment_status: split ? "deposit_paid" : "paid",
    stripe_deposit_pi: input.paymentIntentId,
    status: ["requested", "new", "awaiting_payment"].includes(project.status) ? "accepted" : project.status,
  };
  if (paymentMethodId) patch.stripe_payment_method_id = paymentMethodId;
  if (!split && project.total_amount != null && project.final_payment_status === "pending") patch.final_payment_status = "not_required";

  const applied = await repo.updateProjectIf(input.projectId, patch, { initial_payment_status: ["pending", "processing", "failed"] });
  if (!applied) return afterLostRace(deps, input.projectId, "deposit", input.paymentIntentId);

  const row = await repo.upsertLedger({
    project_id: input.projectId,
    type: split ? "deposit" : "full",
    status: "succeeded",
    amount: input.amountReceived,
    currency: project.currency,
    idempotency_key: depositKey(input.projectId),
  });
  await repo.updateLedger(row.id, {
    status: "succeeded",
    amount: input.amountReceived, // a pending row created before a price change can carry an old amount
    stripe_payment_intent_id: input.paymentIntentId,
    stripe_session_id: input.sessionId ?? row.stripe_session_id,
    failure_reason: null,
    paid_at: paidAt,
    receipt_url: details?.receiptUrl ?? null,
  });
  await repo.addEvent(input.projectId, "payment_received", split ? "Initial payment received" : "Payment received in full", "system");
  // Closing a project expires its checkout links, so this should not happen; if it does, a person decides.
  if (project.status === "cancelled") {
    note("payment_on_cancelled_project", input.projectId);
    await flagForReview(deps, {
      key: `cancelled:${input.paymentIntentId}`,
      projectId: input.projectId,
      timeline: "A payment arrived after the project was cancelled. The studio is reviewing it.",
      subject: "payment on a cancelled project",
      detail: "A payment was received after this project was cancelled. It was recorded, not refunded. Decide in the portal whether to refund it.",
      paymentIntentId: input.paymentIntentId,
    });
  }
  return "applied";
};

export const finalizeFinal = async (
  deps: PaymentsDeps,
  input: { projectId: string; paymentIntentId: string; amountReceived: number; sessionId?: string | null },
): Promise<FinalizeResult> => {
  const { repo, stripe, now } = deps;
  const project = await repo.getProject(input.projectId);
  if (!project) return "noop";
  if (isPaid(project, "final_balance")) return handleDuplicate(deps, project, "final_balance", input.paymentIntentId);
  if (project.initial_payment_status !== "paid") {
    note("final_before_initial", input.projectId);
    return "noop";
  }
  if (!project.remaining_amount || input.amountReceived !== project.remaining_amount) return flagMismatch(deps, input.projectId, "final_amount_mismatch", input.paymentIntentId);

  const paidAt = now().toISOString();
  const applied = await repo.updateProjectIf(
    input.projectId,
    {
      final_payment_status: "paid",
      remaining_amount: 0, // allowed by the amounts check (upper bound); ledger keeps the paid amount
      final_paid_at: paidAt,
      amount_paid: (project.amount_paid ?? 0) + input.amountReceived,
      payment_status: "paid",
      stripe_final_pi: input.paymentIntentId,
      // The only path to ready_for_launch: the balance has just been verified as received in full.
      status: CLOSED.includes(project.status) ? project.status : "ready_for_launch",
    },
    { final_payment_status: ["pending", "processing", "failed", "requires_action"] },
  );
  if (!applied) return afterLostRace(deps, input.projectId, "final_balance", input.paymentIntentId);

  const row = await repo.upsertLedger({
    project_id: input.projectId,
    type: "final_balance",
    status: "succeeded",
    amount: input.amountReceived,
    currency: project.currency,
    idempotency_key: finalKey(input.projectId),
  });
  await repo.updateLedger(row.id, {
    status: "succeeded",
    amount: input.amountReceived, // a pending row created before a price change can carry an old amount
    stripe_payment_intent_id: input.paymentIntentId,
    stripe_session_id: input.sessionId ?? row.stripe_session_id,
    failure_reason: null,
    paid_at: paidAt,
    receipt_url: (await intentDetails(stripe, input.paymentIntentId))?.receiptUrl ?? null,
  });
  await repo.addEvent(input.projectId, "final_payment_received", "Final payment received. Ready for launch", "system");
  return "applied";
};

const shortReason = (reason: string | null | undefined) => (reason ? reason.slice(0, 200) : null);

/** A failed off-session final charge. Only the attempt that holds the claim ("processing") can record it. */
export const recordFinalFailure = async (
  deps: PaymentsDeps,
  input: { projectId: string; paymentIntentId: string | null; reason: string | null; requiresAction: boolean },
): Promise<FinalizeResult> => {
  const { repo } = deps;
  const project = await repo.getProject(input.projectId);
  if (!project) return "noop";

  const applied = await repo.updateProjectIf(
    input.projectId,
    {
      final_payment_status: input.requiresAction ? "requires_action" : "failed",
      payment_status: "payment_failed",
      status: CLOSED.includes(project.status) || project.status === "ready_for_launch" ? project.status : "awaiting_final_payment",
    },
    { final_payment_status: ["processing"] },
  );
  if (!applied) return "noop";

  const reason = shortReason(input.reason);
  const obligation = await repo.getLedgerByKey(finalKey(input.projectId));
  if (obligation) {
    // Release the PI id first so the attempt-history row below can carry it (unique per PI + type).
    await repo.updateLedger(obligation.id, {
      status: input.requiresAction ? "requires_action" : "failed",
      failure_reason: reason,
      stripe_payment_intent_id: null,
    });
  }
  const attempt = (await repo.countFinalAttempts(input.projectId)) + 1;
  await repo.upsertLedger({
    project_id: input.projectId,
    type: "final_balance",
    status: "failed",
    amount: project.remaining_amount ?? 0,
    currency: project.currency,
    idempotency_key: `${finalKey(input.projectId)}:attempt:${attempt}`,
    stripe_payment_intent_id: input.paymentIntentId,
    failure_reason: reason,
  });
  await repo.addEvent(
    input.projectId,
    "final_payment_failed",
    input.requiresAction ? "Final payment needs card confirmation" : "Final payment was declined",
    "system",
  );
  // Tell the client straight away (paced and capped; best effort, never blocks recording the failure).
  const updated = await repo.getProject(input.projectId).catch(() => null);
  if (updated) await remindBalanceDue(deps, updated).catch(() => false);
  return "applied";
};

/** A failed initial payment. The customer can retry, so the deposit stays retryable. */
export const recordDepositFailure = async (
  deps: PaymentsDeps,
  input: { projectId: string; reason: string | null },
): Promise<FinalizeResult> => {
  const { repo } = deps;
  const applied = await repo.updateProjectIf(
    input.projectId,
    { initial_payment_status: "failed", payment_status: "payment_failed" },
    { initial_payment_status: ["pending", "processing", "failed"] },
  );
  if (!applied) return "noop";
  const row = await repo.getLedgerByKey(depositKey(input.projectId));
  if (row && row.status !== "succeeded") await repo.updateLedger(row.id, { status: "failed", failure_reason: shortReason(input.reason) });
  await repo.addEvent(input.projectId, "payment_failed", "Initial payment failed", "system");
  return "applied";
};

const refundedForIntent = (rows: LedgerRow[], paymentIntentId: string) =>
  rows.filter((r) => r.type === "refund" && r.idempotency_key.startsWith(`refund:${paymentIntentId}:`)).reduce((sum, r) => sum + r.amount, 0);

/** Refunded amount already recorded for one PaymentIntent. */
export const recordedRefunds = (rows: LedgerRow[], paymentIntentId: string) => refundedForIntent(rows, paymentIntentId);

/**
 * Records a refund as a ledger row keyed by the CUMULATIVE refunded total for that PaymentIntent, so the
 * refund action and the charge.refunded webhook (which both know the same cumulative) never double count.
 */
export const applyRefundedTotal = async (
  deps: PaymentsDeps,
  input: { projectId: string; paymentIntentId: string; refundedTotal: number; stripeRefundId?: string | null },
): Promise<FinalizeResult> => {
  const { repo, now } = deps;
  const project = await repo.getProject(input.projectId);
  if (!project) return "noop";

  const before = await repo.listLedger(input.projectId);
  const diff = input.refundedTotal - refundedForIntent(before, input.paymentIntentId);
  if (diff <= 0) return "noop";

  await repo.upsertLedger({
    project_id: input.projectId,
    type: "refund",
    status: "succeeded",
    amount: diff,
    currency: project.currency,
    idempotency_key: refundKey(input.paymentIntentId, input.refundedTotal),
    stripe_refund_id: input.stripeRefundId ?? null,
    paid_at: now().toISOString(),
  });

  const rows = await repo.listLedger(input.projectId);
  const totalRefunded = rows.filter((r) => r.type === "refund").reduce((sum, r) => sum + r.amount, 0);
  const paid = project.amount_paid ?? 0;
  const full = paid > 0 && totalRefunded >= paid;
  await repo.updateProject(input.projectId, {
    refunded_amount: totalRefunded,
    refund_status: full ? "full" : "partial",
    payment_status: full ? "refunded" : "partially_refunded",
  });

  const source = await repo.findLedgerByPaymentIntent(input.paymentIntentId);
  if (source) {
    await repo.updateLedger(source.id, { status: input.refundedTotal >= source.amount ? "refunded" : "partially_refunded" });
  }
  await repo.addEvent(input.projectId, "refund", full ? "Payment refunded" : "Payment partially refunded", "system");
  return "applied";
};

export const recordDispute = async (deps: PaymentsDeps, input: { projectId: string }): Promise<FinalizeResult> => {
  const applied = await deps.repo.updateProjectIf(
    input.projectId,
    { dispute_status: "open", payment_status: "disputed" },
    { dispute_status: [null, "won", "lost"] },
  );
  if (!applied) return "noop";
  await deps.repo.addEvent(input.projectId, "dispute", "Payment dispute opened", "system");
  return "applied";
};
