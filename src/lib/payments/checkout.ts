import "server-only";
import { createHash } from "node:crypto";
import { PAYMENT_TERMS_VERSION } from "@/config/payments";
import { finalKey } from "@/lib/payments/finalize";
import type { ProjectPayRow } from "@/lib/payments/repo";
import { defaultDeps, PaymentError, resolveOrigin, type PaymentsDeps } from "@/lib/payments/stripe";
import type { Viewer } from "@/lib/portal/types";

/**
 * Hosted Stripe Checkout for the two payment obligations on one project. Every amount comes from the
 * database row; the caller only ever supplies a project id. Nothing here marks money as paid: only the
 * webhook (see finalize.ts) does that.
 */
const depositKey = (projectId: string) => `project:${projectId}:deposit`;
const HALF_HOUR = 30 * 60 * 1000;
/** Stripe rejects a reused idempotency key whose request body changed (new host, amount or customer), so the key carries a fingerprint of those inputs. */
const fingerprint = (...parts: Array<string | number>) => createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 12);
/**
 * A new Checkout session replaces the previous one for the same obligation. Expire the old one so a
 * customer holding two tabs cannot pay twice (the webhook would record only the first payment). Best
 * effort: an already-completed or already-expired session simply refuses.
 */
export const expireStaleSession = async (stripe: PaymentsDeps["stripe"], previousId: string | null | undefined, currentId: string) => {
  if (!previousId || previousId === currentId) return;
  try {
    await stripe.checkout.sessions.expire(previousId);
  } catch {
    // Completed, expired or unknown on this key: nothing to cancel.
  }
};
/**
 * Closes every open Checkout link on a project (call when it is cancelled or its account is deleted), so
 * nobody can pay for work that will not happen. Best effort and safe to repeat: never throws, and paid or
 * expired sessions simply refuse. Returns how many sessions were checked.
 */
export const expireProjectSessions = async (projectId: string, deps?: PaymentsDeps): Promise<number> => {
  try {
    const d = deps ?? defaultDeps();
    const open = (await d.repo.listLedger(projectId)).filter((r) => r.stripe_session_id && r.type !== "refund" && r.status !== "succeeded");
    await Promise.all(open.map((r) => expireStaleSession(d.stripe, r.stripe_session_id, "")));
    return open.length;
  } catch {
    return 0; // payments not configured, or storage unavailable: nothing could have been opened through us
  }
};
const packageName: Record<ProjectPayRow["package"], string> = { launch: "Launch", presence: "Presence", business: "Business", custom: "Custom" };

const loadProject = async (deps: PaymentsDeps, projectId: string): Promise<ProjectPayRow> => {
  const project = await deps.repo.getProject(projectId);
  // Same message for missing and foreign projects so ids cannot be probed.
  if (!project) throw new PaymentError("Project not found.");
  return project;
};

const ensureCustomer = async (deps: PaymentsDeps, project: ProjectPayRow, userId: string, email: string, name: string | null) => {
  const { repo, stripe } = deps;
  const existing = project.stripe_customer_id ?? (await repo.getProfileCustomerId(userId));
  // A stored id can be unusable on this Stripe key (test-mode id under a live key, another account, or a
  // deleted customer). Confirm it, and fall through to a fresh customer instead of failing checkout.
  const usable = existing ? await stripe.customers.retrieve(existing).then((c) => !("deleted" in c && c.deleted), () => false) : false;
  if (existing && usable) {
    if (!project.stripe_customer_id) await repo.updateProject(project.id, { stripe_customer_id: existing });
    return existing;
  }
  const customer = await stripe.customers.create(
    { email, name: name ?? undefined, metadata: { user_id: userId } },
    { idempotencyKey: `customer:${userId}:${existing ?? "new"}` },
  );
  await repo.setProfileCustomerId(userId, customer.id);
  await repo.updateProject(project.id, { stripe_customer_id: customer.id });
  return customer.id;
};

/** Initial payment: the full price for Launch, the deposit for split packages and quoted Custom projects. */
export const createDepositCheckout = async (
  projectId: string,
  viewer: Viewer,
  consent: boolean,
  deps: PaymentsDeps = defaultDeps(),
): Promise<{ url: string }> => {
  if (!consent) throw new PaymentError("Please confirm the payment authorization to continue.");
  const project = await loadProject(deps, projectId);
  if (project.user_id !== viewer.userId) throw new PaymentError("Project not found.");
  if (project.initial_payment_status === "paid") throw new PaymentError("The initial payment has already been made.");
  if (project.status === "cancelled") throw new PaymentError("This project was cancelled.");
  const deposit = project.deposit_amount;
  if (!deposit || deposit <= 0) throw new PaymentError("The price for this project has not been set yet.");

  const remaining = project.remaining_amount ?? 0;
  const split = remaining > 0;
  const { repo, stripe, now } = deps;
  const origin = await resolveOrigin(deps);

  await repo.updateProject(project.id, {
    terms_accepted_at: now().toISOString(),
    terms_version: PAYMENT_TERMS_VERSION,
    future_charge_authorized: split,
  });

  const customerId = await ensureCustomer(deps, project, viewer.userId, project.email || viewer.email, viewer.fullName ?? project.client_name);
  const ledger = await repo.upsertLedger({
    project_id: project.id,
    type: split ? "deposit" : "full",
    status: "pending",
    amount: deposit,
    currency: project.currency,
    idempotency_key: depositKey(project.id),
  });
  if (ledger.status === "succeeded") throw new PaymentError("The initial payment has already been made.");

  const metadata = { project_id: project.id, package_id: project.package, payment_stage: split ? "deposit" : "full", user_id: viewer.userId };
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer: customerId,
      client_reference_id: project.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: project.currency,
            unit_amount: deposit,
            product_data: { name: `Northframe ${packageName[project.package]} website${split ? ": initial payment" : ""}` },
          },
        },
      ],
      metadata,
      // Stripe emails its receipt to the client (live mode) for every payment.
      payment_intent_data: { metadata, receipt_email: project.email || viewer.email, ...(split ? { setup_future_usage: "off_session" as const } : {}) },
      success_url: `${origin}/portal/projects/${project.id}/paid?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/portal/projects/${project.id}/checkout`,
    },
    { idempotencyKey: `checkout:${depositKey(project.id)}:${Math.floor(now().getTime() / HALF_HOUR)}:${fingerprint(origin, deposit, customerId, split ? "s" : "f")}` },
  );
  if (!session.url) throw new PaymentError("Could not start checkout. Please try again.");

  await expireStaleSession(stripe, ledger.stripe_session_id ?? project.stripe_session_id, session.id);
  await repo.updateLedger(ledger.id, { stripe_session_id: session.id });
  await repo.updateProject(project.id, { stripe_session_id: session.id });
  return { url: session.url };
};

/** Fallback for the remaining balance: hosted Checkout for the exact DB amount, same obligation as the off-session charge. */
export const createFinalCheckout = async (
  projectId: string,
  viewer: Viewer,
  deps: PaymentsDeps = defaultDeps(),
): Promise<{ url: string }> => {
  const project = await loadProject(deps, projectId);
  if (viewer.role !== "admin" && project.user_id !== viewer.userId) throw new PaymentError("Project not found.");
  if (project.initial_payment_status !== "paid") throw new PaymentError("The initial payment has not been made yet.");
  if (project.final_payment_status === "paid" || project.final_payment_status === "not_required") throw new PaymentError("There is no remaining balance.");
  if (project.final_payment_status === "processing") throw new PaymentError("A payment is already being processed. Please check back shortly.");
  if (project.status === "cancelled") throw new PaymentError("This project was cancelled.");
  const remaining = project.remaining_amount;
  if (!remaining || remaining <= 0) throw new PaymentError("There is no remaining balance.");

  const { repo, stripe, now } = deps;
  const origin = await resolveOrigin(deps);
  const ledger = await repo.upsertLedger({
    project_id: project.id,
    type: "final_balance",
    status: "pending",
    amount: remaining,
    currency: project.currency,
    idempotency_key: finalKey(project.id),
  });
  if (ledger.status === "succeeded") throw new PaymentError("The remaining balance has already been paid.");

  const metadata = { project_id: project.id, package_id: project.package, payment_stage: "final_balance", user_id: project.user_id ?? "" };
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      ...(project.stripe_customer_id ? { customer: project.stripe_customer_id } : { customer_email: project.email }),
      client_reference_id: project.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: project.currency,
            unit_amount: remaining,
            product_data: { name: `Northframe ${packageName[project.package]} website: remaining balance` },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata, ...(project.email ? { receipt_email: project.email } : {}) },
      success_url: `${origin}/portal/projects/${project.id}/paid?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/portal/projects/${project.id}/payments`,
    },
    { idempotencyKey: `checkout:${finalKey(project.id)}:${Math.floor(now().getTime() / HALF_HOUR)}:${fingerprint(origin, remaining, project.stripe_customer_id ?? project.email)}` },
  );
  if (!session.url) throw new PaymentError("Could not start checkout. Please try again.");

  await expireStaleSession(stripe, ledger.stripe_session_id, session.id);
  await repo.updateLedger(ledger.id, { stripe_session_id: session.id });
  return { url: session.url };
};
