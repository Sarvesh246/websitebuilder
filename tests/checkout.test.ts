import { describe, expect, it } from "vitest";
import { createDepositCheckout, createFinalCheckout } from "@/lib/payments/checkout";
import { startCheckout } from "@/lib/payments/actions";
import { PaymentError } from "@/lib/payments/stripe";
import { type Params, ADMIN, FakeRepo, OWNER, PROJECT_ID, STRANGER, makeDeps, makePaidDepositProject, makeProject } from "./helpers/fakes";

describe("deposit checkout", () => {
  it("charges the database deposit and saves the card for split packages", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps, mocks } = makeDeps(repo);
    const { url } = await createDepositCheckout(PROJECT_ID, OWNER, true, deps);
    expect(url).toContain("checkout.stripe.test");
    const [params, options] = mocks.sessionsCreate.mock.calls[0] as unknown as [Params, { idempotencyKey: string }];
    expect(params.line_items[0].price_data.unit_amount).toBe(10000);
    expect(params.payment_intent_data.setup_future_usage).toBe("off_session");
    expect(params.client_reference_id).toBe(PROJECT_ID);
    expect(params.metadata).toMatchObject({ project_id: PROJECT_ID, package_id: "presence", payment_stage: "deposit" });
    expect(options.idempotencyKey).toContain(`project:${PROJECT_ID}:deposit`);
    const project = repo.projects.get(PROJECT_ID)!;
    expect(project.terms_version).toBe("2026-09-30");
    expect(project.future_charge_authorized).toBe(true);
    expect(project.stripe_customer_id).toBe("cus_new");
    expect(repo.ledger).toHaveLength(1);
    expect(repo.ledger[0]).toMatchObject({ type: "deposit", status: "pending", amount: 10000 });
  });

  it("expires the previous open session when a new one replaces it (no double payment from two tabs)", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps, mocks } = makeDeps(repo);
    await createDepositCheckout(PROJECT_ID, OWNER, true, deps);
    expect(mocks.sessionsExpire).not.toHaveBeenCalled();
    mocks.sessionsCreate.mockResolvedValueOnce({ id: "cs_2", url: "https://checkout.stripe.test/cs_2" });
    await createDepositCheckout(PROJECT_ID, OWNER, true, deps);
    expect(mocks.sessionsExpire).toHaveBeenCalledWith("cs_1");
    expect(repo.ledger[0].stripe_session_id).toBe("cs_2");
  });

  it("still returns the new session when expiring the old one fails", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps, mocks } = makeDeps(repo);
    await createDepositCheckout(PROJECT_ID, OWNER, true, deps);
    mocks.sessionsCreate.mockResolvedValueOnce({ id: "cs_2", url: "https://checkout.stripe.test/cs_2" });
    mocks.sessionsExpire.mockRejectedValueOnce(new Error("session already complete"));
    await expect(createDepositCheckout(PROJECT_ID, OWNER, true, deps)).resolves.toEqual({ url: "https://checkout.stripe.test/cs_2" });
  });

  it("Launch pays in full and does not save a card", async () => {
    const repo = new FakeRepo(makeProject({ package: "launch", total_amount: 5000, deposit_amount: 5000, remaining_amount: 0, final_payment_status: "not_required" }));
    const { deps, mocks } = makeDeps(repo);
    await createDepositCheckout(PROJECT_ID, OWNER, true, deps);
    const [params] = mocks.sessionsCreate.mock.calls[0] as unknown as [Params];
    expect(params.line_items[0].price_data.unit_amount).toBe(5000);
    expect(params.payment_intent_data.setup_future_usage).toBeUndefined();
    expect(params.metadata.payment_stage).toBe("full");
    expect(repo.projects.get(PROJECT_ID)!.future_charge_authorized).toBe(false);
  });

  it("requires consent, ownership, and an unpaid project", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps, mocks } = makeDeps(repo);
    await expect(createDepositCheckout(PROJECT_ID, OWNER, false, deps)).rejects.toBeInstanceOf(PaymentError);
    await expect(createDepositCheckout(PROJECT_ID, STRANGER, true, deps)).rejects.toThrow("Project not found.");
    await expect(createDepositCheckout(PROJECT_ID, ADMIN, true, deps)).rejects.toThrow("Project not found.");
    repo.projects.get(PROJECT_ID)!.initial_payment_status = "paid";
    await expect(createDepositCheckout(PROJECT_ID, OWNER, true, deps)).rejects.toThrow("already been made");
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("refuses a Custom project that has no quote yet", async () => {
    const repo = new FakeRepo(makeProject({ package: "custom", total_amount: null, deposit_amount: null, remaining_amount: null }));
    const { deps } = makeDeps(repo);
    await expect(createDepositCheckout(PROJECT_ID, OWNER, true, deps)).rejects.toThrow("not been set");
  });

  it("uses the Custom amounts stored on the row, not a 50/50 assumption", async () => {
    const repo = new FakeRepo(makeProject({ package: "custom", total_amount: 100000, deposit_amount: 30000, remaining_amount: 70000 }));
    const { deps, mocks } = makeDeps(repo);
    await createDepositCheckout(PROJECT_ID, OWNER, true, deps);
    const [params] = mocks.sessionsCreate.mock.calls[0] as unknown as [Params];
    expect(params.line_items[0].price_data.unit_amount).toBe(30000);
  });

  it("ignores any client-supplied amount: the action accepts only a project id and the consent flag", () => {
    expect(startCheckout.length).toBe(2);
  });
});

describe("final balance checkout (fallback)", () => {
  it("bills the exact remaining balance from the database, for the owner or admin", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    const { deps, mocks } = makeDeps(repo);
    await createFinalCheckout(PROJECT_ID, OWNER, deps);
    await createFinalCheckout(PROJECT_ID, ADMIN, deps);
    const [params] = mocks.sessionsCreate.mock.calls[0] as unknown as [Params];
    expect(params.line_items[0].price_data.unit_amount).toBe(10000);
    expect(params.metadata.payment_stage).toBe("final_balance");
    expect(repo.ledger.filter((r) => r.type === "final_balance")).toHaveLength(1);
    await expect(createFinalCheckout(PROJECT_ID, STRANGER, deps)).rejects.toThrow("Project not found.");
  });

  it("is refused before the deposit is paid and after the balance is paid", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps } = makeDeps(repo);
    await expect(createFinalCheckout(PROJECT_ID, OWNER, deps)).rejects.toThrow("initial payment has not");
    Object.assign(repo.projects.get(PROJECT_ID)!, { initial_payment_status: "paid", final_payment_status: "paid" });
    await expect(createFinalCheckout(PROJECT_ID, OWNER, deps)).rejects.toThrow("no remaining balance");
  });
});
