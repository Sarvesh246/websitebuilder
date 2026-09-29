import { beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { FakeDb } from "./fakeDb";

const h = vi.hoisted(() => ({ db: null as unknown, stripe: null as unknown, mail: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createAdminClient: () => h.db }));
vi.mock("@/lib/payments/stripe", () => ({ getStripe: () => h.stripe, stripeConfigured: () => true }));
vi.mock("@/lib/inquiry/email", () => ({ sendBalanceDueEmail: h.mail }));

import { startCheckout } from "../checkout";
import { collectFinalPayment } from "../final";
import { PaymentError } from "../project";
import { refundProject, requestCancellation } from "../refund";
import { getPayView } from "../view";
import { planForPackage } from "../plan";
import { processEvent, verifyEvent } from "../webhook";
import { adminAuth } from "../admin";

/* ---------- fake Stripe ---------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const makeStripe = () => {
  const sessions = new Map<string, Any>();
  const byKey = new Map<string, Any>();
  const intents = new Map<string, Any>();
  const s: Any = {
    calls: { sessionCreate: [] as Any[], piCreate: [] as Any[], refundCreate: [] as Any[] },
    failNextCharge: null as Any | null,
    customers: { create: vi.fn(async () => ({ id: "cus_1" })) },
    checkout: {
      sessions: {
        create: vi.fn(async (params: Any, opts: Any) => {
          const hit = byKey.get(opts.idempotencyKey);
          if (hit) return hit;
          s.calls.sessionCreate.push({ params, opts });
          const id = `cs_${sessions.size + 1}`;
          const amount = params.line_items[0].price_data.unit_amount;
          const session = { id, url: `https://checkout.test/${id}`, status: "open", amount_total: amount, payment_status: "unpaid", payment_intent: `pi_${id}`, metadata: params.metadata };
          sessions.set(id, session);
          byKey.set(opts.idempotencyKey, session);
          intents.set(`pi_${id}`, { id: `pi_${id}`, amount, amount_received: amount, currency: "usd", metadata: params.payment_intent_data.metadata, latest_charge: `ch_${id}`, payment_method: "pm_saved", status: "succeeded" });
          return session;
        }),
        retrieve: vi.fn(async (id: string) => sessions.get(id)),
      },
    },
    paymentIntents: {
      retrieve: vi.fn(async (id: string) => intents.get(id)),
      create: vi.fn(async (params: Any, opts: Any) => {
        s.calls.piCreate.push({ params, opts });
        if (s.failNextCharge) throw s.failNextCharge;
        return { id: "pi_final", amount: params.amount, amount_received: params.amount, currency: "usd", status: "succeeded", latest_charge: "ch_final", metadata: params.metadata };
      }),
    },
    refunds: {
      create: vi.fn(async (params: Any, opts: Any) => {
        s.calls.refundCreate.push({ params, opts });
        const r = { id: `re_${s.calls.refundCreate.length}`, amount: params.amount, currency: "usd", payment_intent: params.payment_intent, charge: "ch_x", status: "succeeded", failure_reason: null };
        s.lastRefunds.push(r);
        return r;
      }),
      list: vi.fn(async () => ({ data: s.lastRefunds })),
    },
    lastRefunds: [] as Any[],
    webhooks: new Stripe("sk_test_x").webhooks,
    complete: (sessionId: string) => (sessions.get(sessionId)!.status = "complete", (sessions.get(sessionId)!.payment_status = "paid")),
    session: (id: string) => sessions.get(id)!,
  };
  return s;
};

let db: FakeDb;
let stripe: Any;
let evN = 0;
const event = (type: string, object: Any, id = `evt_${++evN}`) => ({ id, type, data: { object } }) as unknown as Stripe.Event;

const newProject = (pkg: string, over: Any = {}) => {
  const plan = planForPackage(pkg as never);
  const row = { id: db.id(), client_name: "Sam Lee", email: "sam@example.com", package: pkg, ...(plan ? { total_cents: plan.total, deposit_cents: plan.deposit, remaining_cents: plan.remaining, initial_payment_status: "pending", final_payment_status: plan.remaining > 0 ? "pending" : "not_required" } : {}), ...over };
  db.rows("project_requests").push({ status: "new", payment_status: "unpaid", currency: "usd", final_attempts: 0, refunded_cents: 0, refund_status: "none", payment_terms_accepted: false, future_charge_authorized: false, initial_payment_status: "not_required", final_payment_status: "not_required", ...row });
  return row.id as string;
};
const project = (id: string) => db.rows("project_requests").find((r) => r.id === id)!;
const pay = async (id: string) => {
  const { url } = await startCheckout(id, { accept: true });
  const sid = url.split("/").pop()!;
  stripe.complete(sid);
  await processEvent(event("checkout.session.completed", stripe.session(sid)));
  return sid;
};
const cardError = (code: string) => Object.assign(new Error("declined"), { type: "StripeCardError", code, decline_code: code, payment_intent: { id: "pi_failed" } });

beforeEach(() => {
  db = new FakeDb();
  stripe = makeStripe();
  h.db = db;
  h.stripe = stripe;
  h.mail.mockClear();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

describe("pricing plan", () => {
  it("splits packages in integer cents", () => {
    expect(planForPackage("launch")).toEqual({ total: 5000, deposit: 5000, remaining: 0 });
    expect(planForPackage("presence")).toEqual({ total: 20000, deposit: 10000, remaining: 10000 });
    expect(planForPackage("business")).toEqual({ total: 35000, deposit: 17500, remaining: 17500 });
    expect(planForPackage("custom")).toBeNull();
  });
});

describe("A. Launch $50 paid in full", () => {
  it("charges $50, marks paid via webhook, no second payment", async () => {
    const id = await newProject("launch");
    await pay(id);
    const p = stripe.calls.sessionCreate[0].params;
    expect(p.line_items[0].price_data.unit_amount).toBe(5000);
    expect(p.payment_intent_data.setup_future_usage).toBeUndefined();
    expect(project(id)).toMatchObject({ payment_status: "paid", initial_payment_status: "succeeded", final_payment_status: "not_required", remaining_cents: 0, amount_paid: 5000, status: "in_progress" });
    await expect(collectFinalPayment(id)).rejects.toMatchObject({ code: "no_balance" });
  });
});

describe("B/C. split packages", () => {
  it.each([["presence", 10000, 10000], ["business", 17500, 17500]])("%s: deposit, saved card, final once", async (pkg, deposit, rest) => {
    const id = newProject(pkg);
    await pay(id);
    const p = stripe.calls.sessionCreate[0].params;
    expect(p.line_items[0].price_data.unit_amount).toBe(deposit);
    expect(p.payment_intent_data.setup_future_usage).toBe("off_session");
    expect(p.customer).toBe("cus_1");
    expect(p.client_reference_id).toBe(id);
    expect(project(id)).toMatchObject({ payment_status: "partially_paid", remaining_cents: rest, stripe_payment_method_id: "pm_saved", status: "in_progress", future_charge_authorized: true });

    await expect(collectFinalPayment(id)).rejects.toMatchObject({ code: "not_ready" }); // revisions not complete
    project(id).status = "revisions";
    expect(await collectFinalPayment(id)).toEqual({ result: "paid" });
    expect(stripe.calls.piCreate).toHaveLength(1);
    expect(stripe.calls.piCreate[0].params).toMatchObject({ amount: rest, off_session: true, confirm: true, customer: "cus_1", payment_method: "pm_saved" });
    expect(stripe.calls.piCreate[0].opts.idempotencyKey).toBe(`project:${id}:final`);
    expect(project(id)).toMatchObject({ remaining_cents: 0, payment_status: "paid", final_payment_status: "succeeded", status: "ready_for_launch", amount_paid: deposit + rest });
    await expect(collectFinalPayment(id)).rejects.toMatchObject({ code: "already_paid" });
    expect(stripe.calls.piCreate).toHaveLength(1);
  });
});

describe("D. declined final card + fallback checkout", () => {
  it("never hands off; fallback pays the exact DB balance on the same obligation", async () => {
    const id = newProject("presence");
    await pay(id);
    project(id).status = "review";
    stripe.failNextCharge = cardError("card_declined");
    expect(await collectFinalPayment(id)).toMatchObject({ result: "fallback_required" });
    expect(project(id)).toMatchObject({ final_payment_status: "failed", status: "awaiting_final_payment", payment_status: "partially_paid", remaining_cents: 10000 });
    expect(h.mail).toHaveBeenCalledTimes(1);
    await expect(collectFinalPayment(id)).rejects.toMatchObject({ code: "already_attempted" }); // no hammering the card
    expect(stripe.calls.piCreate).toHaveLength(1);
    expect((await getPayView(id)).phase).toBe("final_due");

    await pay(id); // fallback Checkout for the remaining balance
    expect(stripe.calls.sessionCreate[1].params.line_items[0].price_data.unit_amount).toBe(10000);
    expect(stripe.calls.sessionCreate[1].params.metadata.payment_stage).toBe("final_balance");
    expect(project(id)).toMatchObject({ final_payment_status: "succeeded", remaining_cents: 0, status: "ready_for_launch", payment_status: "paid" });
    expect(db.rows("payments").filter((p) => p.kind === "final_balance")).toHaveLength(1);
  });

  it("authentication_required maps to requires_action", async () => {
    const id = newProject("business");
    await pay(id);
    project(id).status = "revisions";
    stripe.failNextCharge = cardError("authentication_required");
    await collectFinalPayment(id);
    expect(project(id).final_payment_status).toBe("requires_action");
  });

  it("missing saved card falls back without calling Stripe", async () => {
    const id = newProject("presence");
    await pay(id);
    project(id).status = "revisions";
    project(id).stripe_payment_method_id = null;
    expect(await collectFinalPayment(id)).toMatchObject({ reason: "missing_payment_method" });
    expect(stripe.calls.piCreate).toHaveLength(0);
  });
});

describe("E. duplicate final requests", () => {
  it("simultaneous calls create one charge", async () => {
    const id = newProject("presence");
    await pay(id);
    project(id).status = "revisions";
    const results = await Promise.allSettled([collectFinalPayment(id), collectFinalPayment(id), collectFinalPayment(id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(stripe.calls.piCreate).toHaveLength(1);
  });
});

describe("F. webhook replay + verification", () => {
  it("same event twice changes state once; a second event for the same payment is a no-op", async () => {
    const id = newProject("presence");
    const { url } = await startCheckout(id, { accept: true });
    const sid = url.split("/").pop()!;
    stripe.complete(sid);
    const ev = event("checkout.session.completed", stripe.session(sid), "evt_same");
    expect(await processEvent(ev)).toBe("processed");
    const paidAt = project(id).initial_paid_at;
    expect(await processEvent(ev)).toBe("duplicate");
    const pi = await stripe.paymentIntents.retrieve(`pi_${sid}`);
    await processEvent(event("payment_intent.succeeded", pi));
    expect(project(id).initial_paid_at).toBe(paidAt);
    expect(project(id).amount_paid).toBe(10000);
    expect(db.rows("payments").filter((p) => p.kind === "deposit")).toHaveLength(1);
  });

  it("rejects a bad or missing signature and accepts a valid one", () => {
    const body = JSON.stringify({ id: "evt_x", type: "payment_intent.succeeded", data: { object: {} } });
    expect(() => verifyEvent(body, "t=1,v1=bad")).toThrow(PaymentError);
    expect(() => verifyEvent(body, null)).toThrow(PaymentError);
    const header = new Stripe("sk_test_x").webhooks.generateTestHeaderString({ payload: body, secret: "whsec_test" });
    expect(verifyEvent(body, header).id).toBe("evt_x");
  });

  it("ignores an amount that does not match the database", async () => {
    const id = newProject("presence");
    const { url } = await startCheckout(id, { accept: true });
    const sid = url.split("/").pop()!;
    const pi = await stripe.paymentIntents.retrieve(`pi_${sid}`);
    await processEvent(event("payment_intent.succeeded", { ...pi, amount: 100, amount_received: 100 }));
    expect(project(id).initial_payment_status).toBe("pending");
  });
});

describe("G/H. browser cannot mark paid or set prices", () => {
  it("visiting /pay after checkout without a webhook changes nothing", async () => {
    const id = newProject("presence");
    await startCheckout(id, { accept: true });
    expect((await getPayView(id)).phase).toBe("pay_initial");
    expect(project(id).initial_payment_status).toBe("pending");
  });

  it("uses the stored snapshot, ignores forged input and current catalogue prices", async () => {
    const id = newProject("presence", { total_cents: 30000, deposit_cents: 15000, remaining_cents: 15000 });
    await startCheckout(id, { accept: true, amount: 1, price: 1 } as never);
    expect(stripe.calls.sessionCreate[0].params.line_items[0].price_data.unit_amount).toBe(15000);
  });

  it("requires consent before Checkout and never calls Stripe without it", async () => {
    const id = newProject("presence");
    await expect(startCheckout(id, {})).rejects.toMatchObject({ code: "consent_required" });
    expect(stripe.calls.sessionCreate).toHaveLength(0);
  });

  it("double click returns the same session", async () => {
    const id = newProject("presence");
    const [a, b] = await Promise.all([startCheckout(id, { accept: true }), startCheckout(id, { accept: true })]);
    expect(a.url).toBe(b.url);
    expect(stripe.calls.sessionCreate).toHaveLength(1);
  });

  it("Custom stays unpriced until staff quote it", async () => {
    const id = newProject("custom");
    await expect(startCheckout(id, { accept: true })).rejects.toMatchObject({ code: "no_quote" });
  });
});

describe("I/J. refunds and cancellation", () => {
  it("admin refund syncs local state; webhook replay is harmless; over-refund refused", async () => {
    const id = newProject("presence");
    await pay(id);
    const out = await refundProject(id, { cancel: true });
    expect(out.amountCents).toBe(10000);
    expect(project(id)).toMatchObject({ refunded_cents: 10000, refund_status: "refunded", payment_status: "refunded", status: "cancelled", final_payment_status: "cancelled" });
    await processEvent(event("charge.refunded", { id: "ch_x" }));
    expect(project(id).refunded_cents).toBe(10000);
    await expect(refundProject(id, { amountCents: 1 })).rejects.toMatchObject({ code: "amount_invalid" });
    await expect(collectFinalPayment(id)).rejects.toMatchObject({ code: "blocked" });
  });

  it("partial refund is tracked", async () => {
    const id = newProject("presence");
    await pay(id);
    await refundProject(id, { amountCents: 2500 });
    expect(project(id)).toMatchObject({ refunded_cents: 2500, refund_status: "partial", payment_status: "partially_refunded" });
  });

  it("a cancellation request never refunds automatically", async () => {
    const id = newProject("presence");
    await pay(id);
    await requestCancellation(id);
    expect(project(id).cancellation_requested_at).toBeTruthy();
    expect(stripe.calls.refundCreate).toHaveLength(0);
    expect(project(id).refunded_cents).toBe(0);
    expect((await getPayView(id)).cancellationRequested).toBe(true);
  });

  it("a dispute is recorded and blocks the final charge", async () => {
    const id = newProject("presence");
    await pay(id);
    project(id).status = "revisions";
    await processEvent(event("charge.dispute.created", { id: "dp_1", payment_intent: `pi_cs_1` }));
    expect(project(id)).toMatchObject({ payment_status: "disputed", dispute_id: "dp_1" });
    await expect(collectFinalPayment(id)).rejects.toMatchObject({ code: "blocked" });
  });
});

describe("admin authorization", () => {
  const req = (auth?: string) => new Request("http://x", { headers: auth ? { authorization: auth } : {} });
  it("refuses without a configured, matching bearer token", () => {
    delete process.env.ADMIN_API_TOKEN;
    expect(adminAuth(req("Bearer anything"))).toBe("not_configured");
    process.env.ADMIN_API_TOKEN = "x".repeat(40);
    expect(adminAuth(req())).toBe("denied");
    expect(adminAuth(req("Bearer nope"))).toBe("denied");
    expect(adminAuth(req(`Bearer ${"x".repeat(40)}`))).toBe("ok");
  });
});
