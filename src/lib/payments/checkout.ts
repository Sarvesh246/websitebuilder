import "server-only";
import type Stripe from "stripe";
import { paymentTerms } from "@/config/payment";
import { packageTiers } from "@/config/pricing";
import { siteConfig } from "@/config/site";
import {
  adminDb, type Db, ensureCustomer, ensureSnapshot, loadProject, PaymentError, type ProjectPayRow, requireStripe,
} from "./project";
import { checkoutStage } from "./rules";

export type PaymentKind = "full" | "deposit" | "final_balance";

export type PaymentRow = {
  id: string;
  project_id: string;
  kind: PaymentKind;
  status: string;
  amount_cents: number;
  checkout_seq: number;
  stripe_checkout_session_id: string | null;
};

/** Creates the single payment-obligation row for a stage (no-op if it exists) and returns it. */
export const ensureObligation = async (db: Db, projectId: string, kind: PaymentKind, amount: number): Promise<PaymentRow> => {
  const cols = "id, project_id, kind, status, amount_cents, checkout_seq, stripe_checkout_session_id";
  await db.from("payments").upsert({ project_id: projectId, kind, amount_cents: amount }, { onConflict: "project_id,kind", ignoreDuplicates: true });
  const { data, error } = await db.from("payments").select(cols).eq("project_id", projectId).eq("kind", kind).single<PaymentRow>();
  if (error || !data) throw new PaymentError("database");
  return data;
};

const tierName = (row: ProjectPayRow) => packageTiers.find((t) => t.id === row.package)?.name ?? "Custom";

const productName = (row: ProjectPayRow, kind: PaymentKind) =>
  `${siteConfig.name} ${tierName(row)} website ${kind === "full" ? "" : kind === "deposit" ? "(initial payment)" : "(remaining balance)"}`.replace(/\s+/g, " ").trim();

/**
 * Starts Stripe Checkout for whatever this project owes next. The browser sends only the project id (and
 * consent): the stage, amount, currency and customer all come from the database.
 *
 * Duplicate protection: one obligation row per stage; the Checkout idempotency key includes `checkout_seq`,
 * which only advances when the previous session expired. A double click therefore gets the same session.
 */
export const startCheckout = async (projectId: string, opts: { accept?: boolean }): Promise<{ url: string }> => {
  const db = adminDb();
  let row = await loadProject(db, projectId);
  const stage = checkoutStage(row);
  if (stage === "blocked") throw new PaymentError("blocked");
  if (stage === "already_paid") throw new PaymentError("already_paid");
  if (stage === "processing") throw new PaymentError("processing");
  if (stage === "not_due") throw new PaymentError("not_due");

  row = await ensureSnapshot(db, row);
  const remaining = row.remaining_cents ?? 0;
  const initial = stage === "initial";
  const kind: PaymentKind = initial ? (remaining === 0 ? "full" : "deposit") : "final_balance";
  const amount = initial ? row.deposit_cents : remaining;
  if (!amount || amount <= 0) throw new PaymentError("amount_invalid");

  if (initial) {
    const accepted = row.payment_terms_accepted && row.terms_version === paymentTerms.version;
    if (!accepted) {
      if (!opts.accept) throw new PaymentError("consent_required");
      await db
        .from("project_requests")
        .update({
          terms_version: paymentTerms.version,
          terms_accepted_at: new Date().toISOString(),
          payment_terms_accepted: true,
          future_charge_authorized: remaining > 0,
          status: row.status === "new" || row.status === "contacted" ? "awaiting_payment" : row.status,
        })
        .eq("id", row.id);
    }
  }

  const stripe = requireStripe();
  const customer = await ensureCustomer(db, row);
  const obligation = await ensureObligation(db, row.id, kind, amount);
  if (obligation.status === "succeeded") throw new PaymentError("already_paid");

  const base = siteConfig.url.replace(/\/$/, "");
  const metadata = { project_id: row.id, package_id: row.package, payment_stage: kind };
  const saveCard = kind === "deposit";
  const create = (seq: number) =>
    stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer,
        client_reference_id: row.id,
        line_items: [
          { quantity: 1, price_data: { currency: row.currency, unit_amount: amount, product_data: { name: productName(row, kind) } } },
        ],
        payment_intent_data: { metadata, ...(saveCard ? { setup_future_usage: "off_session" as const } : {}) },
        metadata,
        custom_text: { submit: { message: saveCard ? paymentTerms.checkoutSplit : paymentTerms.checkoutFull } },
        success_url: `${base}/pay/${row.id}?checkout=success`,
        cancel_url: `${base}/pay/${row.id}?checkout=cancelled`,
      },
      { idempotencyKey: `project:${row.id}:${kind}:checkout:${seq}` },
    );

  try {
    let seq = obligation.checkout_seq;
    if (obligation.stripe_checkout_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(obligation.stripe_checkout_session_id);
      if (existing.status === "complete") throw new PaymentError("processing"); // paid; webhook is catching up
      if (existing.status === "open" && existing.url && existing.amount_total === amount) return { url: existing.url };
      // Expired (or amount changed): move to the next idempotency key, guarded so concurrent callers agree.
      seq += 1;
      const { data: bumped } = await db
        .from("payments")
        .update({ checkout_seq: seq, stripe_checkout_session_id: null })
        .eq("id", obligation.id)
        .eq("checkout_seq", obligation.checkout_seq)
        .select("id");
      if (!bumped?.length) throw new PaymentError("conflict");
    }
    const session = await create(seq);
    if (!session.url) throw new PaymentError("stripe_unavailable");
    await db.from("payments").update({ stripe_checkout_session_id: session.id, status: "pending" }).eq("id", obligation.id).eq("checkout_seq", seq);
    if (initial) await db.from("project_requests").update({ payment_status: "pending" }).eq("id", row.id).eq("payment_status", "unpaid");
    return { url: session.url };
  } catch (error) {
    if (error instanceof PaymentError) throw error;
    console.error("[payments] checkout failed:", (error as Stripe.errors.StripeError)?.type ?? "unknown");
    throw new PaymentError("stripe_unavailable");
  }
};
