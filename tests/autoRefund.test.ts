import { afterEach, describe, expect, it, vi } from "vitest";
import { duplicateRefusal, refundDuplicatePayment } from "@/lib/payments/autoRefund";
import { expireProjectSessions } from "@/lib/payments/checkout";
import { finalizeDeposit, finalizeFinal } from "@/lib/payments/finalize";
import { FakeRepo, PROJECT_ID, makeDeps, makePaidDepositProject, makeProject } from "./helpers/fakes";

/** A live-looking PaymentIntent with its latest charge, as Stripe returns it with expand: ["latest_charge"]. */
const intent = (id: string, o: { stage?: string; project?: string; amount?: number; status?: string; refunded?: number; fullyRefunded?: boolean; disputed?: boolean; currency?: string } = {}) => ({
  id,
  status: o.status ?? "succeeded",
  amount_received: o.amount ?? 10000,
  currency: o.currency ?? "usd",
  payment_method: "pm_saved",
  metadata: { project_id: o.project ?? PROJECT_ID, payment_stage: o.stage ?? "deposit" },
  latest_charge: {
    status: "succeeded",
    paid: true,
    disputed: o.disputed ?? false,
    amount_refunded: o.refunded ?? 0,
    refunded: o.fullyRefunded ?? false,
    receipt_url: "https://pay.stripe.test/r",
  },
});

/** Stripe stub: retrieve() answers from this table of intents. */
const withIntents = (mocks: ReturnType<typeof makeDeps>["mocks"], table: Record<string, ReturnType<typeof intent>>) => {
  mocks.paymentIntentsRetrieve.mockImplementation((async (id: string) => {
    const found = table[id];
    if (!found) throw Object.assign(new Error("No such payment_intent"), { type: "StripeInvalidRequestError" });
    return found;
  }) as never);
};

const DUP = { projectId: PROJECT_ID, stage: "deposit" as const, duplicateId: "pi_B", recordedId: "pi_A" };
const asChecked = (i: ReturnType<typeof intent>) => ({ intent: i, charge: i.latest_charge }) as never;

describe("duplicateRefusal (every check must pass before money moves)", () => {
  const ok = asChecked(intent("pi_B"));
  const kept = asChecked(intent("pi_A"));

  it("allows a clean duplicate of an intact recorded payment", () => {
    expect(duplicateRefusal(DUP, ok, kept)).toBeNull();
  });

  it.each([
    ["no recorded payment to keep", { ...DUP, recordedId: null }, ok, kept, "no_recorded_payment"],
    ["the same payment replayed", { ...DUP, recordedId: "pi_B" }, ok, kept, "same_payment"],
    ["the recorded payment can't be read", DUP, ok, null, "recorded_payment_unreadable"],
    ["another project's payment", DUP, asChecked(intent("pi_B", { project: "other" })), kept, "other_project"],
    ["another stage's payment", DUP, asChecked(intent("pi_B", { stage: "final_balance" })), kept, "other_stage"],
    ["a duplicate that has not succeeded", DUP, asChecked(intent("pi_B", { status: "processing" })), kept, "duplicate_not_succeeded"],
    ["a duplicate already partly refunded by hand", DUP, asChecked(intent("pi_B", { refunded: 500 })), kept, "duplicate_partly_refunded"],
    ["a disputed duplicate", DUP, asChecked(intent("pi_B", { disputed: true })), kept, "duplicate_disputed"],
    ["a kept payment that was refunded", DUP, ok, asChecked(intent("pi_A", { refunded: 10000, fullyRefunded: true })), "recorded_payment_refunded_or_disputed"],
    ["a kept payment that is disputed", DUP, ok, asChecked(intent("pi_A", { disputed: true })), "recorded_payment_refunded_or_disputed"],
    ["a kept payment from another project", DUP, ok, asChecked(intent("pi_A", { project: "other" })), "recorded_payment_not_valid"],
    ["different currencies", DUP, ok, asChecked(intent("pi_A", { currency: "eur" })), "currency_mismatch"],
  ])("refuses %s", (_label, input, dup, rec, reason) => {
    expect(duplicateRefusal(input as typeof DUP, dup as never, rec as never)).toBe(reason);
  });
});

describe("automatic duplicate refunds", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("refunds exactly the duplicate's received amount, once, with a stable idempotency key", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ stripe_deposit_pi: "pi_A" }));
    const { deps, mocks } = makeDeps(repo);
    withIntents(mocks, { pi_A: intent("pi_A"), pi_B: intent("pi_B", { amount: 10000 }) });
    expect(await finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_B", amountReceived: 10000 })).toBe("duplicate");
    expect(mocks.refundsCreate).toHaveBeenCalledTimes(1);
    const [params, options] = mocks.refundsCreate.mock.calls[0] as unknown as [Record<string, unknown>, { idempotencyKey: string }];
    expect(params).toMatchObject({ payment_intent: "pi_B", amount: 10000, reason: "duplicate" });
    expect(options.idempotencyKey).toBe("auto-refund:duplicate:pi_B");
    // The kept payment and the project's money state are untouched.
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ initial_payment_status: "paid", amount_paid: 10000, stripe_deposit_pi: "pi_A", refunded_amount: 0 });
    expect(repo.ledger.some((r) => r.type === "refund")).toBe(false);
    expect(repo.events.map((e) => e.kind)).toContain("refund");
  });

  it("never refunds a replay of the payment it recorded", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ stripe_deposit_pi: "pi_A" }));
    const { deps, mocks } = makeDeps(repo);
    expect(await finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_A", amountReceived: 10000 })).toBe("noop");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });

  it("does nothing when the duplicate was already fully refunded (a later webhook retry)", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ stripe_deposit_pi: "pi_A" }));
    const { deps, mocks } = makeDeps(repo);
    withIntents(mocks, { pi_A: intent("pi_A"), pi_B: intent("pi_B", { refunded: 10000, fullyRefunded: true }) });
    expect(await refundDuplicatePayment(deps, DUP)).toBe("already_refunded");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
    expect(repo.events).toHaveLength(0);
  });

  it("two different payments racing: one is recorded, the other is refunded", async () => {
    const repo = new FakeRepo(makeProject({ status: "requested" }));
    const { deps, mocks } = makeDeps(repo);
    withIntents(mocks, { pi_A: intent("pi_A"), pi_B: intent("pi_B") });
    const results = await Promise.all([
      finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_A", amountReceived: 10000 }),
      finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_B", amountReceived: 10000 }),
    ]);
    expect(results.sort()).toEqual(["applied", "duplicate"]);
    const kept = repo.projects.get(PROJECT_ID)!.stripe_deposit_pi;
    expect(mocks.refundsCreate).toHaveBeenCalledTimes(1);
    const [params] = mocks.refundsCreate.mock.calls[0] as unknown as [{ payment_intent: string }];
    expect(params.payment_intent).not.toBe(kept);
    expect(repo.projects.get(PROJECT_ID)!.amount_paid).toBe(10000);
  });

  it("also covers the final balance (hosted link paid after the saved card was charged)", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ final_payment_status: "paid", remaining_amount: 0, stripe_final_pi: "pi_F1", amount_paid: 20000 }));
    const { deps, mocks } = makeDeps(repo);
    withIntents(mocks, { pi_F1: intent("pi_F1", { stage: "final_balance" }), pi_F2: intent("pi_F2", { stage: "final_balance" }) });
    expect(await finalizeFinal(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_F2", amountReceived: 10000 })).toBe("duplicate");
    expect(mocks.refundsCreate).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: "pi_F2", amount: 10000 }), expect.anything());
  });

  it("with the kill switch off it only flags the payment for review", async () => {
    vi.stubEnv("STRIPE_AUTO_REFUND_DUPLICATES", "off");
    const repo = new FakeRepo(makePaidDepositProject({ stripe_deposit_pi: "pi_A" }));
    const { deps, mocks } = makeDeps(repo);
    withIntents(mocks, { pi_A: intent("pi_A"), pi_B: intent("pi_B") });
    expect(await refundDuplicatePayment(deps, DUP)).toBe("review");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
    expect(repo.events.map((e) => e.kind)).toEqual(["payment_review"]);
  });

  it("flags instead of refunding when it cannot prove the case (unreadable kept payment)", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ stripe_deposit_pi: "pi_A" }));
    const { deps, mocks } = makeDeps(repo);
    withIntents(mocks, { pi_B: intent("pi_B") });
    expect(await refundDuplicatePayment(deps, DUP)).toBe("review");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });

  it("a network error throws so the webhook is retried; a refusal from Stripe becomes a review", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ stripe_deposit_pi: "pi_A" }));
    const { deps, mocks } = makeDeps(repo);
    withIntents(mocks, { pi_A: intent("pi_A"), pi_B: intent("pi_B") });
    mocks.refundsCreate.mockRejectedValueOnce(Object.assign(new Error("socket hang up"), { type: "StripeConnectionError" }));
    await expect(refundDuplicatePayment(deps, DUP)).rejects.toThrow("socket hang up");
    mocks.refundsCreate.mockRejectedValueOnce(Object.assign(new Error("charge disputed"), { type: "StripeInvalidRequestError" }));
    expect(await refundDuplicatePayment(deps, DUP)).toBe("review");
  });

  it("an idempotent replay of the same refund is not reported twice", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ stripe_deposit_pi: "pi_A" }));
    const { deps, mocks } = makeDeps(repo);
    withIntents(mocks, { pi_A: intent("pi_A"), pi_B: intent("pi_B") });
    mocks.refundsCreate.mockResolvedValueOnce({ id: "re_1", lastResponse: { headers: { "idempotent-replayed": "true" } } } as never);
    expect(await refundDuplicatePayment(deps, DUP)).toBe("already_refunded");
    expect(repo.events).toHaveLength(0);
  });
});

describe("never refunded automatically", () => {
  it("a payment that does not match the price is flagged, not recorded and not refunded", async () => {
    const repo = new FakeRepo(makeProject({ status: "requested" }));
    const { deps, mocks } = makeDeps(repo);
    expect(await finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_X", amountReceived: 9900 })).toBe("mismatch");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
    expect(repo.projects.get(PROJECT_ID)!.initial_payment_status).toBe("pending");
    expect(repo.events.map((e) => e.kind)).toEqual(["payment_review"]);
  });

  it("a payment for an unknown project changes nothing", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps, mocks } = makeDeps(repo);
    expect(await finalizeDeposit(deps, { projectId: "99999999-9999-4999-8999-999999999999", paymentIntentId: "pi_Z", amountReceived: 10000 })).toBe("noop");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });
});

describe("expireProjectSessions", () => {
  it("closes every open checkout on the project and never throws", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps, mocks } = makeDeps(repo);
    await repo.upsertLedger({ project_id: PROJECT_ID, type: "deposit", status: "pending", amount: 10000, currency: "usd", idempotency_key: "k1", stripe_session_id: "cs_open" });
    await repo.upsertLedger({ project_id: PROJECT_ID, type: "deposit", status: "succeeded", amount: 10000, currency: "usd", idempotency_key: "k2", stripe_session_id: "cs_paid" });
    mocks.sessionsExpire.mockRejectedValueOnce(new Error("already expired"));
    expect(await expireProjectSessions(PROJECT_ID, deps)).toBe(1);
    expect(mocks.sessionsExpire).toHaveBeenCalledWith("cs_open");
    expect(mocks.sessionsExpire).not.toHaveBeenCalledWith("cs_paid");
  });
});

describe("payment on a cancelled project", () => {
  it("is recorded and flagged for review, never refunded automatically", async () => {
    const repo = new FakeRepo(makeProject({ status: "cancelled" }));
    const { deps, mocks } = makeDeps(repo);
    expect(await finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_C", amountReceived: 10000 })).toBe("applied");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
    expect(repo.projects.get(PROJECT_ID)!.status).toBe("cancelled");
    expect(repo.events.map((e) => e.kind)).toContain("payment_review");
  });
});
