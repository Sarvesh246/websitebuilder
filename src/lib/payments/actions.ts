"use server";

import { createDepositCheckout, createFinalCheckout } from "@/lib/payments/checkout";
import { collectFinalBalance, type CollectOutcome } from "@/lib/payments/finalBalance";
import { refundPayment as refundPaymentLib, requestCancellation as requestCancellationLib } from "@/lib/payments/refunds";
import { PaymentError } from "@/lib/payments/stripe";
import { demoMode, getPerspective, getViewer } from "@/lib/auth/session";
import type { Viewer } from "@/lib/portal/types";

/**
 * Server actions for the payment UI. The browser only ever sends ids (and the consent tick): every
 * amount is read from the database, and every actor is resolved on the server via lib/auth/session.
 */
type Failure = { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEMO: Failure = { ok: false, error: "Payments are disabled in demo mode" };
const INVALID: Failure = { ok: false, error: "That request was not valid." };

/** Resolves the signed-in actor without redirect() (which throws and would be swallowed by the catch below). */
const actor = async (role?: "admin"): Promise<Viewer> => {
  const viewer = await getViewer();
  if (!viewer) throw new PaymentError("Please sign in to continue.");
  if (role === "admin" && viewer.role !== "admin") throw new PaymentError("Not allowed.");
  // Like every other studio action, money actions are refused while the admin previews the client view.
  if (role === "admin" && (await getPerspective(viewer)) !== "admin") throw new PaymentError("Preview mode: switch back to your admin view to do this.");
  return viewer;
};

const toFailure = (err: unknown): Failure => {
  if (err instanceof PaymentError) return { ok: false, error: err.message };
  // Class, Stripe code and message only (Stripe/PostgREST messages carry no secrets or customer content).
  const e = err as { type?: string; code?: string; message?: string };
  console.error("[payments] action_failed", e?.type ?? (err as Error)?.name, e?.code ?? "", e?.message ?? "");
  return { ok: false, error: "Something went wrong with the payment. Nothing was charged. Please try again." };
};

export async function startCheckout(projectId: string, consent: boolean): Promise<{ ok: true; url: string } | Failure> {
  if (demoMode()) return DEMO;
  if (typeof projectId !== "string" || !UUID.test(projectId)) return INVALID;
  try {
    const viewer = await actor();
    const { url } = await createDepositCheckout(projectId, viewer, consent === true);
    return { ok: true, url };
  } catch (err) {
    return toFailure(err);
  }
}

/** Client or studio opens hosted Checkout for the remaining balance (fallback when the saved card is unavailable). */
export async function payRemainingBalance(projectId: string): Promise<{ ok: true; url: string } | Failure> {
  if (demoMode()) return DEMO;
  if (typeof projectId !== "string" || !UUID.test(projectId)) return INVALID;
  try {
    const viewer = await actor();
    const { url } = await createFinalCheckout(projectId, viewer);
    return { ok: true, url };
  } catch (err) {
    return toFailure(err);
  }
}

/** Studio only: "Complete revisions and collect final payment". */
export async function collectFinalPayment(
  projectId: string,
): Promise<{ ok: true; outcome: CollectOutcome; message: string } | Failure> {
  if (demoMode()) return DEMO;
  if (typeof projectId !== "string" || !UUID.test(projectId)) return INVALID;
  try {
    const viewer = await actor("admin");
    const result = await collectFinalBalance(projectId, viewer);
    return { ok: true, ...result };
  } catch (err) {
    return toFailure(err);
  }
}

export async function refundPayment(
  projectId: string,
  paymentId: string,
  amountCents?: number,
): Promise<{ ok: true; refunded: number } | Failure> {
  if (demoMode()) return DEMO;
  if (typeof projectId !== "string" || !UUID.test(projectId) || typeof paymentId !== "string" || !UUID.test(paymentId)) return INVALID;
  if (amountCents !== undefined && (!Number.isSafeInteger(amountCents) || amountCents <= 0)) return INVALID;
  try {
    const viewer = await actor("admin");
    const { refunded } = await refundPaymentLib(projectId, paymentId, amountCents, viewer);
    return { ok: true, refunded };
  } catch (err) {
    return toFailure(err);
  }
}

/** Client asks to cancel within the 3-day window. Records the request only; never refunds. */
export async function requestCancellation(projectId: string): Promise<{ ok: true } | Failure> {
  if (demoMode()) return DEMO;
  if (typeof projectId !== "string" || !UUID.test(projectId)) return INVALID;
  try {
    const viewer = await actor();
    await requestCancellationLib(projectId, viewer);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}
