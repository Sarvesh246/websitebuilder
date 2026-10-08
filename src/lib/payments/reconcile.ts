import "server-only";
import type Stripe from "stripe";
import { serverLog } from "@/lib/observability/serverLog";
import { applyRefundedTotal, finalizeDeposit, finalizeFinal, finalKey, recordFinalFailure, recordedRefunds } from "@/lib/payments/finalize";
import { remindBalanceDue } from "@/lib/payments/notify";
import type { LedgerRow, ProjectPayRow } from "@/lib/payments/repo";
import type { PaymentsDeps } from "@/lib/payments/stripe";

/**
 * Daily safety net. Webhooks are the primary path; this catches anything they missed (endpoint down,
 * misconfigured secret, a crash mid-charge) by comparing each recent project with Stripe's own record and
 * feeding differences through the SAME idempotent functions the webhook uses. It never invents money
 * state: every change is something Stripe reports as having happened. Safe to run any number of times,
 * concurrently, or after a partial run.
 */
export const RECONCILE_WINDOW_DAYS = 180;
/** A final-charge claim untouched this long, with no matching charge at Stripe, was abandoned mid-attempt. */
export const STUCK_CLAIM_MS = 30 * 60 * 1000;
const MAX_PROJECTS = 300;

export type ReconcileSummary = {
  checked: number;
  recorded: number; // payments the webhook missed, now recorded (or handled as duplicate / flagged mismatch)
  refundsSynced: number;
  claimsResolved: number;
  reminders: number;
  errors: number;
  incomplete: boolean; // ran out of time; the next run continues
};

const DEPOSIT_STAGES = ["deposit", "full"];
const asId = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));
const chargeOf = (i: Stripe.PaymentIntent) => (typeof i.latest_charge === "object" ? i.latest_charge : null);

/** Every PaymentIntent Stripe holds for this project (our checkout and off-session charges all carry project_id). */
const intentsFor = async (deps: PaymentsDeps, projectId: string): Promise<Stripe.PaymentIntent[]> => {
  const found: Stripe.PaymentIntent[] = [];
  let page: string | undefined;
  for (let i = 0; i < 5; i += 1) {
    const res = await deps.stripe.paymentIntents.search({
      query: `metadata['project_id']:'${projectId}'`,
      limit: 100,
      expand: ["data.latest_charge"],
      ...(page ? { page } : {}),
    });
    found.push(...res.data.filter((pi) => pi.metadata?.project_id === projectId)); // defensive: exact match only
    if (!res.has_more || !res.next_page) break;
    page = res.next_page;
  }
  return found;
};

const knownIntents = (project: ProjectPayRow, ledger: LedgerRow[]) =>
  new Set([project.stripe_deposit_pi, project.stripe_final_pi, ...ledger.map((r) => r.stripe_payment_intent_id)].filter((v): v is string => Boolean(v)));

/** 1. Succeeded payments the database has never seen. */
const recordMissed = async (deps: PaymentsDeps, project: ProjectPayRow, ledger: LedgerRow[], intents: Stripe.PaymentIntent[]) => {
  const known = knownIntents(project, ledger);
  let n = 0;
  // Oldest first, so when two exist the one the customer paid first is the one kept.
  const missed = intents.filter((i) => i.status === "succeeded" && !known.has(i.id) && !chargeOf(i)?.refunded).sort((a, b) => a.created - b.created);
  for (const intent of missed) {
    const stage = intent.metadata?.payment_stage ?? "";
    const base = { projectId: project.id, paymentIntentId: intent.id, amountReceived: intent.amount_received };
    const result = DEPOSIT_STAGES.includes(stage)
      ? await finalizeDeposit(deps, { ...base, paymentMethodId: asId(intent.payment_method) })
      : stage === "final_balance"
        ? await finalizeFinal(deps, base)
        : "noop";
    if (result !== "noop") n += 1;
  }
  return n;
};

/** 2. Refunds made outside the app (Stripe dashboard) or whose webhook was missed. */
const syncRefunds = async (deps: PaymentsDeps, project: ProjectPayRow, ledger: LedgerRow[], intents: Stripe.PaymentIntent[]) => {
  let n = 0;
  for (const intent of intents) {
    const source = ledger.find((r) => r.type !== "refund" && r.stripe_payment_intent_id === intent.id && ["succeeded", "partially_refunded", "refunded"].includes(r.status));
    const refundedAtStripe = chargeOf(intent)?.amount_refunded ?? 0;
    if (!source || refundedAtStripe <= recordedRefunds(ledger, intent.id)) continue;
    const result = await applyRefundedTotal(deps, { projectId: project.id, paymentIntentId: intent.id, refundedTotal: refundedAtStripe });
    if (result === "applied") n += 1;
  }
  return n;
};

/** 3. A final-charge claim left "processing" by a crash or timeout. */
const resolveStuckClaim = async (deps: PaymentsDeps, projectId: string, intents: Stripe.PaymentIntent[]) => {
  const project = await deps.repo.getProject(projectId);
  if (!project || project.final_payment_status !== "processing") return 0;
  const touched = project.updated_at ? new Date(project.updated_at).getTime() : 0;
  if (deps.now().getTime() - touched < STUCK_CLAIM_MS) return 0; // may be in flight right now

  const offSession = intents
    .filter((i) => i.metadata?.payment_stage === "final_balance" && i.metadata?.collect === "off_session")
    .sort((a, b) => b.created - a.created)[0];
  if (offSession?.status === "processing") return 0; // the bank is still working on it; the webhook will settle it
  if (offSession?.status === "succeeded") return 0; // recorded by recordMissed (or it is a duplicate)
  if (offSession && ["requires_action", "requires_payment_method", "requires_confirmation", "canceled"].includes(offSession.status)) {
    await recordFinalFailure(deps, {
      projectId,
      paymentIntentId: offSession.id,
      reason: offSession.last_payment_error?.decline_code ?? offSession.last_payment_error?.code ?? offSession.status,
      requiresAction: offSession.status === "requires_action",
    });
    return 1;
  }
  // No charge ever reached Stripe: the attempt died before creating it. Release the claim so it can run again.
  const failures = await deps.repo.countFinalAttempts(projectId);
  const released = await deps.repo.updateProjectIf(
    projectId,
    { final_payment_status: failures > 0 ? "failed" : "pending", payment_status: "deposit_paid" },
    { final_payment_status: ["processing"] },
  );
  if (!released) return 0;
  const obligation = await deps.repo.getLedgerByKey(finalKey(projectId));
  if (obligation && obligation.status === "processing") await deps.repo.updateLedger(obligation.id, { status: failures > 0 ? "failed" : "pending" });
  serverLog("warn", "payments.stuck_claim_released", { project: projectId });
  return 1;
};

export const reconcileProject = async (deps: PaymentsDeps, project: ProjectPayRow) => {
  const ledger = await deps.repo.listLedger(project.id);
  // A project that never opened a checkout cannot have been paid through this app.
  if (ledger.length === 0 && !project.stripe_deposit_pi && project.final_payment_status !== "processing") {
    return { recorded: 0, refundsSynced: 0, claimsResolved: 0, reminders: 0 };
  }
  const intents = await intentsFor(deps, project.id);
  const recorded = await recordMissed(deps, project, ledger, intents);
  const refundsSynced = await syncRefunds(deps, project, recorded ? await deps.repo.listLedger(project.id) : ledger, intents);
  const claimsResolved = await resolveStuckClaim(deps, project.id, intents);
  const latest = await deps.repo.getProject(project.id);
  const reminders = latest && (await remindBalanceDue(deps, latest)) ? 1 : 0;
  return { recorded, refundsSynced, claimsResolved, reminders };
};

/** Runs over recent projects within a time budget. One project's failure never stops the rest. */
export const reconcilePayments = async (deps: PaymentsDeps, opts: { budgetMs?: number } = {}): Promise<ReconcileSummary> => {
  const started = Date.now();
  const budget = opts.budgetMs ?? 45_000;
  const since = new Date(deps.now().getTime() - RECONCILE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const projects = await deps.repo.listRecentProjects(since, MAX_PROJECTS);
  const summary: ReconcileSummary = { checked: 0, recorded: 0, refundsSynced: 0, claimsResolved: 0, reminders: 0, errors: 0, incomplete: false };
  for (const project of projects) {
    if (Date.now() - started > budget) {
      summary.incomplete = true;
      break;
    }
    try {
      const r = await reconcileProject(deps, project);
      summary.recorded += r.recorded;
      summary.refundsSynced += r.refundsSynced;
      summary.claimsResolved += r.claimsResolved;
      summary.reminders += r.reminders;
    } catch {
      summary.errors += 1;
      serverLog("error", "payments.reconcile_project_failed", { project: project.id });
    }
    summary.checked += 1;
  }
  return summary;
};
