import { createFinalCheckout } from "@/lib/payments/checkout";
import { describe, expect, it } from "vitest";
import { collectFinalBalance } from "@/lib/payments/finalBalance";
import { finalizeDeposit, finalizeFinal } from "@/lib/payments/finalize";
import { type Params, ADMIN, FakeRepo, OWNER, PROJECT_ID, makeDeps, makePaidDepositProject } from "./helpers/fakes";

const succeeded = { id: "pi_final", status: "succeeded", amount_received: 10000 };

describe("collectFinalBalance", () => {
  it("only the studio can collect", async () => {
    const { deps } = makeDeps(new FakeRepo(makePaidDepositProject()));
    await expect(collectFinalBalance(PROJECT_ID, OWNER, deps)).rejects.toThrow("Only the studio");
  });

  it("creates exactly one PaymentIntent under 5 concurrent calls", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    const { deps, mocks } = makeDeps(repo);
    mocks.paymentIntentsCreate.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return succeeded;
    });
    const results = await Promise.all(Array.from({ length: 5 }, () => collectFinalBalance(PROJECT_ID, ADMIN, deps)));
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledTimes(1);
    expect(results.filter((r) => r.outcome === "paid")).toHaveLength(1);
    expect(results.filter((r) => r.outcome !== "paid").every((r) => ["processing", "already_paid"].includes(r.outcome))).toBe(true);
    const [params, options] = mocks.paymentIntentsCreate.mock.calls[0] as unknown as [Params, { idempotencyKey: string }];
    expect(params).toMatchObject({ amount: 10000, off_session: true, confirm: true, customer: "cus_1", payment_method: "pm_1" });
    expect(options.idempotencyKey).toBe(`project:${PROJECT_ID}:final:0`);
    const project = repo.projects.get(PROJECT_ID)!;
    expect(project).toMatchObject({ final_payment_status: "paid", payment_status: "paid", status: "ready_for_launch", amount_paid: 20000 });
  });

  it("expires an open hosted balance link before charging the saved card", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    const { deps, mocks } = makeDeps(repo);
    await createFinalCheckout(PROJECT_ID, OWNER, deps);
    mocks.paymentIntentsCreate.mockResolvedValue(succeeded);
    await collectFinalBalance(PROJECT_ID, ADMIN, deps);
    expect(mocks.sessionsExpire).toHaveBeenCalledWith("cs_1");
  });

  it("does not charge again once paid", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    const { deps, mocks } = makeDeps(repo);
    mocks.paymentIntentsCreate.mockResolvedValue(succeeded);
    await collectFinalBalance(PROJECT_ID, ADMIN, deps);
    const again = await collectFinalBalance(PROJECT_ID, ADMIN, deps);
    expect(again.outcome).toBe("already_paid");
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledTimes(1);
  });

  it("a decline records a failure, keeps awaiting_final_payment and never reaches ready_for_launch", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    const { deps, mocks } = makeDeps(repo);
    mocks.paymentIntentsCreate.mockRejectedValue({ type: "StripeCardError", code: "card_declined", decline_code: "insufficient_funds", payment_intent: { id: "pi_declined" } });
    const result = await collectFinalBalance(PROJECT_ID, ADMIN, deps);
    expect(result.outcome).toBe("failed");
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ final_payment_status: "failed", payment_status: "payment_failed", status: "awaiting_final_payment" });
    expect(repo.ledger.find((r) => r.idempotency_key === `project:${PROJECT_ID}:final`)).toMatchObject({ status: "failed", failure_reason: "insufficient_funds" });
    expect(repo.ledger.find((r) => r.idempotency_key === `project:${PROJECT_ID}:final:attempt:1`)?.stripe_payment_intent_id).toBe("pi_declined");
    // No retry loop: a single attempt was made.
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledTimes(1);

    // An explicit second attempt uses a fresh Stripe idempotency key.
    mocks.paymentIntentsCreate.mockResolvedValue({ ...succeeded, id: "pi_second" });
    const retry = await collectFinalBalance(PROJECT_ID, ADMIN, deps);
    expect(retry.outcome).toBe("paid");
    const options = mocks.paymentIntentsCreate.mock.calls[1][1] as { idempotencyKey: string };
    expect(options.idempotencyKey).toBe(`project:${PROJECT_ID}:final:1`);
    expect(repo.projects.get(PROJECT_ID)!.status).toBe("ready_for_launch");
  });

  it("maps authentication_required to requires_action", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    const { deps, mocks } = makeDeps(repo);
    mocks.paymentIntentsCreate.mockRejectedValue({ type: "StripeCardError", code: "authentication_required" });
    const result = await collectFinalBalance(PROJECT_ID, ADMIN, deps);
    expect(result.outcome).toBe("requires_action");
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ final_payment_status: "requires_action", status: "awaiting_final_payment" });
  });

  it("without a saved card it asks for a payment link instead of charging", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ stripe_payment_method_id: null }));
    const { deps, mocks } = makeDeps(repo);
    const result = await collectFinalBalance(PROJECT_ID, ADMIN, deps);
    expect(result.outcome).toBe("requires_action");
    expect(mocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("releases the claim on an infrastructure error so a retry can reuse the same intent", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    const { deps, mocks } = makeDeps(repo);
    mocks.paymentIntentsCreate.mockRejectedValueOnce(new Error("socket hang up"));
    await expect(collectFinalBalance(PROJECT_ID, ADMIN, deps)).rejects.toThrow("Nothing was recorded as paid");
    expect(repo.projects.get(PROJECT_ID)!.final_payment_status).toBe("pending");
    mocks.paymentIntentsCreate.mockResolvedValue(succeeded);
    await expect(collectFinalBalance(PROJECT_ID, ADMIN, deps)).resolves.toMatchObject({ outcome: "paid" });
    const keys = mocks.paymentIntentsCreate.mock.calls.map((c) => (c[1] as { idempotencyKey: string }).idempotencyKey);
    expect(new Set(keys).size).toBe(1);
  });

  it("is not eligible before the deposit is paid", async () => {
    const { deps, mocks } = makeDeps(new FakeRepo(makePaidDepositProject({ initial_payment_status: "pending" })));
    const result = await collectFinalBalance(PROJECT_ID, ADMIN, deps);
    expect(result.outcome).toBe("not_eligible");
    expect(mocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });
});

describe("finalize replays change state once", () => {
  it("finalizeFinal is idempotent and only reaches ready_for_launch with the exact balance", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ final_payment_status: "processing" }));
    const { deps } = makeDeps(repo);
    expect(await finalizeFinal(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_f", amountReceived: 9999 })).toBe("mismatch");
    expect(repo.projects.get(PROJECT_ID)!.status).toBe("client_review");
    expect(await finalizeFinal(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_f", amountReceived: 10000 })).toBe("applied");
    const eventsAfterFirst = repo.events.length;
    expect(await finalizeFinal(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_f", amountReceived: 10000 })).toBe("noop");
    expect(repo.events).toHaveLength(eventsAfterFirst);
    expect(repo.projects.get(PROJECT_ID)!.amount_paid).toBe(20000);
    expect(repo.ledger.filter((r) => r.type === "final_balance" && r.status === "succeeded")).toHaveLength(1);
  });

  it("finalizeDeposit is idempotent, stores the saved payment method and accepts the project", async () => {
    const repo = new FakeRepo(makeProjectRequested());
    const { deps, mocks } = makeDeps(repo);
    expect(await finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_d", amountReceived: 10000 })).toBe("applied");
    expect(await finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_d", amountReceived: 10000 })).toBe("noop");
    expect(mocks.paymentIntentsRetrieve).toHaveBeenCalledTimes(1);
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({
      initial_payment_status: "paid",
      payment_status: "deposit_paid",
      status: "accepted",
      stripe_payment_method_id: "pm_saved",
      amount_paid: 10000,
    });
    expect(repo.ledger.filter((r) => r.status === "succeeded")).toHaveLength(1);
  });

  it("rejects a deposit whose amount differs from the stored deposit", async () => {
    const repo = new FakeRepo(makeProjectRequested());
    const { deps } = makeDeps(repo);
    expect(await finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_d", amountReceived: 1 })).toBe("mismatch");
    expect(repo.projects.get(PROJECT_ID)!.initial_payment_status).toBe("pending");
  });
});

function makeProjectRequested() {
  return makePaidDepositProject({
    status: "requested",
    payment_status: "unpaid",
    amount_paid: null,
    initial_payment_status: "pending",
    initial_paid_at: null,
    stripe_payment_method_id: null,
    stripe_deposit_pi: null,
  });
}
