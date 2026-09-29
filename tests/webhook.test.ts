import { describe, expect, it } from "vitest";
import { processStripeWebhook } from "@/lib/payments/webhook";
import { FakeRepo, PROJECT_ID, makeDeps, makePaidDepositProject, makeProject } from "./helpers/fakes";

const SECRET = "whsec_unit_test";

const signedEvent = (deps: ReturnType<typeof makeDeps>["deps"], id: string, type: string, object: Record<string, unknown>) => {
  const rawBody = JSON.stringify({ id, object: "event", type, data: { object } });
  const signature = deps.stripe.webhooks.generateTestHeaderString({ payload: rawBody, secret: SECRET });
  return { rawBody, signature, secret: SECRET };
};

const paidSession = { id: "cs_1", payment_status: "paid", payment_intent: "pi_dep", amount_total: 10000, metadata: { project_id: PROJECT_ID, payment_stage: "deposit" } };

describe("stripe webhook", () => {
  it("rejects a bad signature and a missing header, and changes nothing", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps } = makeDeps(repo);
    const event = signedEvent(deps, "evt_1", "checkout.session.completed", paidSession);
    expect((await processStripeWebhook(deps, { ...event, signature: "t=1,v1=deadbeef" })).status).toBe(400);
    expect((await processStripeWebhook(deps, { ...event, signature: null })).status).toBe(400);
    expect((await processStripeWebhook(deps, { ...event, secret: "whsec_other" })).status).toBe(400);
    expect(repo.projects.get(PROJECT_ID)!.initial_payment_status).toBe("pending");
    expect(repo.webhookEvents.size).toBe(0);
  });

  it("marks the deposit paid once; a duplicate event id is a no-op", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps } = makeDeps(repo);
    const event = signedEvent(deps, "evt_2", "checkout.session.completed", paidSession);
    expect((await processStripeWebhook(deps, event)).body).toBe("ok");
    const snapshot = JSON.stringify(repo.projects.get(PROJECT_ID));
    const events = repo.events.length;
    const replay = await processStripeWebhook(deps, event);
    expect(replay).toEqual({ status: 200, body: "duplicate" });
    expect(JSON.stringify(repo.projects.get(PROJECT_ID))).toBe(snapshot);
    expect(repo.events).toHaveLength(events);
  });

  it("a different event for the same payment (payment_intent.succeeded) does not double apply", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps } = makeDeps(repo);
    await processStripeWebhook(deps, signedEvent(deps, "evt_a", "checkout.session.completed", paidSession));
    const events = repo.events.length;
    await processStripeWebhook(
      deps,
      signedEvent(deps, "evt_b", "payment_intent.succeeded", { id: "pi_dep", amount_received: 10000, payment_method: "pm_1", metadata: { project_id: PROJECT_ID, payment_stage: "deposit" } }),
    );
    expect(repo.events).toHaveLength(events);
    expect(repo.ledger.filter((r) => r.status === "succeeded")).toHaveLength(1);
  });

  it("finalizes the final balance and reaches ready_for_launch", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ final_payment_status: "processing" }));
    const { deps } = makeDeps(repo);
    await processStripeWebhook(
      deps,
      signedEvent(deps, "evt_f", "payment_intent.succeeded", { id: "pi_fin", amount_received: 10000, metadata: { project_id: PROJECT_ID, payment_stage: "final_balance" } }),
    );
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ final_payment_status: "paid", status: "ready_for_launch" });
  });

  it("ignores unpaid sessions and unhandled event types without recording them", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps } = makeDeps(repo);
    await processStripeWebhook(deps, signedEvent(deps, "evt_u", "checkout.session.completed", { ...paidSession, payment_status: "unpaid" }));
    expect(repo.projects.get(PROJECT_ID)!.initial_payment_status).toBe("pending");
    const other = await processStripeWebhook(deps, signedEvent(deps, "evt_o", "customer.created", { id: "cus_1" }));
    expect(other.body).toBe("ignored");
    expect(repo.webhookEvents.has("evt_o")).toBe(false);
  });

  it("returns 500 and forgets the event id when handling fails, so Stripe's retry can succeed", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps } = makeDeps(repo);
    const original = repo.updateProjectIf.bind(repo);
    let calls = 0;
    repo.updateProjectIf = async (...args) => {
      if (calls++ === 0) throw new Error("db down");
      return original(...args);
    };
    const event = signedEvent(deps, "evt_r", "checkout.session.completed", paidSession);
    expect((await processStripeWebhook(deps, event)).status).toBe(500);
    expect(repo.webhookEvents.has("evt_r")).toBe(false);
    expect((await processStripeWebhook(deps, event)).body).toBe("ok");
    expect(repo.projects.get(PROJECT_ID)!.initial_payment_status).toBe("paid");
  });

  it("records a dispute without deleting anything, and a refund keeps the ledger", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    repo.ledger.push({
      id: "led-x", project_id: PROJECT_ID, type: "deposit", status: "succeeded", amount: 10000, currency: "usd", stripe_session_id: null,
      stripe_payment_intent_id: "pi_dep", stripe_refund_id: null, failure_reason: null, idempotency_key: `project:${PROJECT_ID}:deposit`, created_at: "", paid_at: "",
    });
    const { deps } = makeDeps(repo);
    await processStripeWebhook(deps, signedEvent(deps, "evt_d", "charge.dispute.created", { id: "dp_1", payment_intent: "pi_dep" }));
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ dispute_status: "open", payment_status: "disputed" });
    await processStripeWebhook(deps, signedEvent(deps, "evt_rf", "charge.refunded", { id: "ch_1", payment_intent: "pi_dep", amount_refunded: 4000 }));
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ refunded_amount: 4000, refund_status: "partial" });
    expect(repo.ledger.find((r) => r.id === "led-x")!.status).toBe("partially_refunded");
  });
});
