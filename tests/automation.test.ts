import { afterEach, describe, expect, it, vi } from "vitest";
import { collectFinalBalance } from "@/lib/payments/finalBalance";
import { finalizeDeposit } from "@/lib/payments/finalize";
import { MAX_REMINDERS, REMINDER_GAP_MS, flagForReview, remindBalanceDue } from "@/lib/payments/notify";
import { STUCK_CLAIM_MS, reconcilePayments, reconcileProject } from "@/lib/payments/reconcile";
import { ADMIN, FakeRepo, PROJECT_ID, makeDeps, makePaidDepositProject, makeProject } from "./helpers/fakes";

const NOW = "2026-10-07T12:00:00.000Z";

/** A PaymentIntent as Stripe search returns it (with latest_charge expanded). */
const pi = (id: string, o: { stage?: string; status?: string; amount?: number; refunded?: number; collect?: string; created?: number; project?: string } = {}) => ({
  id,
  status: o.status ?? "succeeded",
  amount_received: o.status && o.status !== "succeeded" ? 0 : (o.amount ?? 10000),
  currency: "usd",
  created: o.created ?? 1,
  payment_method: "pm_saved",
  metadata: { project_id: o.project ?? PROJECT_ID, payment_stage: o.stage ?? "deposit", ...(o.collect ? { collect: o.collect } : {}) },
  latest_charge: { status: "succeeded", paid: true, disputed: false, amount_refunded: o.refunded ?? 0, refunded: (o.refunded ?? 0) >= (o.amount ?? 10000), receipt_url: "https://pay.stripe.test/r" },
  last_payment_error: null,
});

const seedLedger = (repo: FakeRepo, row: Partial<Parameters<FakeRepo["upsertLedger"]>[0]> & { idempotency_key: string }) =>
  repo.upsertLedger({ project_id: PROJECT_ID, type: "deposit", status: "pending", amount: 10000, currency: "usd", ...row });

describe("charging the balance when the client approves", () => {
  it("runs as the system actor with the stored authorization", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    const { deps, mocks } = makeDeps(repo, NOW);
    mocks.paymentIntentsCreate.mockResolvedValue({ id: "pi_fin", status: "succeeded", amount_received: 10000 });
    const result = await collectFinalBalance(PROJECT_ID, "client_approval", deps);
    expect(result.outcome).toBe("paid");
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: 10000, off_session: true, receipt_email: "client@example.com" }), expect.anything());
  });

  it("never charges a saved card without the checkout authorization, even for the studio", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ future_charge_authorized: false }));
    const { deps, mocks } = makeDeps(repo, NOW);
    expect((await collectFinalBalance(PROJECT_ID, "client_approval", deps)).outcome).toBe("not_eligible");
    expect((await collectFinalBalance(PROJECT_ID, ADMIN, deps)).outcome).toBe("not_eligible");
    expect(mocks.paymentIntentsCreate).not.toHaveBeenCalled();
    expect(repo.projects.get(PROJECT_ID)!.final_payment_status).toBe("pending"); // no claim taken
  });

  it("a decline emails the client once and the claim cannot be retaken twice in parallel", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    const { deps, mocks } = makeDeps(repo, NOW);
    mocks.paymentIntentsCreate.mockImplementation(async () => {
      throw Object.assign(new Error("declined"), { type: "StripeCardError", code: "card_declined" });
    });
    const results = await Promise.all([collectFinalBalance(PROJECT_ID, "client_approval", deps), collectFinalBalance(PROJECT_ID, "client_approval", deps)]);
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledTimes(1);
    expect(results.map((r) => r.outcome).sort()).toEqual(["failed", "processing"]);
  });
});

describe("balance reminders", () => {
  afterEach(() => vi.unstubAllEnvs());
  const emailEnv = () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_EMAIL", "studio@example.test");
    vi.stubEnv("FROM_EMAIL", "hello@example.test");
  };

  it("are paced and capped", async () => {
    emailEnv();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const repo = new FakeRepo(makePaidDepositProject({ final_payment_status: "failed", status: "awaiting_final_payment" }));
    let now = new Date(NOW).getTime();
    repo.clock = () => new Date(now).toISOString();
    const { deps } = makeDeps(repo, NOW);
    deps.now = () => new Date(now);
    const project = () => repo.projects.get(PROJECT_ID)!;

    expect(await remindBalanceDue(deps, project())).toBe(true);
    expect(await remindBalanceDue(deps, project())).toBe(false); // too soon
    for (let i = 1; i < MAX_REMINDERS + 2; i += 1) {
      now += REMINDER_GAP_MS + 1000;
      await remindBalanceDue(deps, project());
    }
    expect(repo.events.filter((e) => e.kind === "balance_reminder")).toHaveLength(MAX_REMINDERS);
    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body.to).toEqual(["client@example.com"]);
    expect(body.text).toContain("$100");
    expect(body.text).toContain(`/portal/projects/${PROJECT_ID}/payments`);
    fetchMock.mockRestore();
  });

  it("are never sent for paid, cancelled, or not-yet-failed balances", async () => {
    emailEnv();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    for (const p of [
      makePaidDepositProject({ final_payment_status: "paid" }),
      makePaidDepositProject({ final_payment_status: "failed", status: "cancelled" }),
      makePaidDepositProject({ final_payment_status: "pending" }),
      makePaidDepositProject({ final_payment_status: "processing" }),
    ]) {
      const repo = new FakeRepo(p);
      const { deps } = makeDeps(repo, NOW);
      expect(await remindBalanceDue(deps, p)).toBe(false);
    }
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("without email configured nothing is recorded as sent", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ final_payment_status: "failed" }));
    const { deps } = makeDeps(repo, NOW);
    expect(await remindBalanceDue(deps, repo.projects.get(PROJECT_ID)!)).toBe(false);
    expect(repo.events).toHaveLength(0);
  });
});

describe("review flags", () => {
  it("are raised once per payment, however many times Stripe reports it", async () => {
    const repo = new FakeRepo(makeProject({ status: "requested" }));
    const { deps } = makeDeps(repo, NOW);
    await finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_X", amountReceived: 9900 }); // checkout.session.completed
    await finalizeDeposit(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_X", amountReceived: 9900 }); // payment_intent.succeeded
    expect(repo.events.filter((e) => e.kind === "payment_review")).toHaveLength(1);
    expect(await flagForReview(deps, { key: "mismatch:pi_X", projectId: PROJECT_ID, timeline: "t", subject: "s", detail: "d" })).toBe(false);
  });
});

describe("daily reconciliation", () => {
  it("records a deposit whose webhook never arrived", async () => {
    const repo = new FakeRepo(makeProject({ status: "requested" }));
    await seedLedger(repo, { idempotency_key: `project:${PROJECT_ID}:deposit`, stripe_session_id: "cs_1" });
    const { deps, mocks } = makeDeps(repo, NOW);
    mocks.paymentIntentsSearch.mockResolvedValue({ data: [pi("pi_A")], has_more: false, next_page: null });
    const r = await reconcileProject(deps, repo.projects.get(PROJECT_ID)!);
    expect(r.recorded).toBe(1);
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ initial_payment_status: "paid", stripe_deposit_pi: "pi_A", status: "accepted" });
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
    // Running again changes nothing.
    const again = await reconcileProject(deps, repo.projects.get(PROJECT_ID)!);
    expect(again.recorded).toBe(0);
  });

  it("with two missed payments keeps the earlier one and refunds the later", async () => {
    const repo = new FakeRepo(makeProject({ status: "requested" }));
    await seedLedger(repo, { idempotency_key: `project:${PROJECT_ID}:deposit` });
    const { deps, mocks } = makeDeps(repo, NOW);
    const first = pi("pi_first", { created: 100 });
    const second = pi("pi_second", { created: 200 });
    mocks.paymentIntentsSearch.mockResolvedValue({ data: [second, first], has_more: false, next_page: null });
    mocks.paymentIntentsRetrieve.mockImplementation((async (id: string) => (id === "pi_first" ? first : second)) as never);
    await reconcileProject(deps, repo.projects.get(PROJECT_ID)!);
    expect(repo.projects.get(PROJECT_ID)!.stripe_deposit_pi).toBe("pi_first");
    expect(mocks.refundsCreate).toHaveBeenCalledTimes(1);
    expect(mocks.refundsCreate).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: "pi_second", amount: 10000 }), expect.anything());
  });

  it("syncs a refund made in the Stripe dashboard", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ stripe_deposit_pi: "pi_A" }));
    const row = await seedLedger(repo, { idempotency_key: `project:${PROJECT_ID}:deposit`, status: "succeeded" });
    await repo.updateLedger(row.id, { stripe_payment_intent_id: "pi_A" });
    const { deps, mocks } = makeDeps(repo, NOW);
    mocks.paymentIntentsSearch.mockResolvedValue({ data: [pi("pi_A", { refunded: 2500 })], has_more: false, next_page: null });
    expect((await reconcileProject(deps, repo.projects.get(PROJECT_ID)!)).refundsSynced).toBe(1);
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ refunded_amount: 2500, refund_status: "partial" });
    expect((await reconcileProject(deps, repo.projects.get(PROJECT_ID)!)).refundsSynced).toBe(0); // counted once
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });

  it("releases a final-charge claim abandoned before any charge reached Stripe", async () => {
    const old = new Date(new Date(NOW).getTime() - STUCK_CLAIM_MS - 60_000).toISOString();
    const repo = new FakeRepo(makePaidDepositProject({ final_payment_status: "processing", payment_status: "processing", updated_at: old }));
    await seedLedger(repo, { idempotency_key: `project:${PROJECT_ID}:final`, type: "final_balance", status: "processing" });
    const { deps } = makeDeps(repo, NOW);
    expect((await reconcileProject(deps, repo.projects.get(PROJECT_ID)!)).claimsResolved).toBe(1);
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ final_payment_status: "pending", payment_status: "deposit_paid" });
  });

  it("leaves a fresh claim alone (it may be charging right now)", async () => {
    const repo = new FakeRepo(makePaidDepositProject({ final_payment_status: "processing", updated_at: new Date(NOW).toISOString() }));
    await seedLedger(repo, { idempotency_key: `project:${PROJECT_ID}:final`, type: "final_balance", status: "processing" });
    const { deps } = makeDeps(repo, NOW);
    expect((await reconcileProject(deps, repo.projects.get(PROJECT_ID)!)).claimsResolved).toBe(0);
    expect(repo.projects.get(PROJECT_ID)!.final_payment_status).toBe("processing");
  });

  it("settles a stuck claim whose off-session charge did succeed", async () => {
    const old = new Date(new Date(NOW).getTime() - STUCK_CLAIM_MS - 60_000).toISOString();
    const repo = new FakeRepo(makePaidDepositProject({ final_payment_status: "processing", updated_at: old }));
    await seedLedger(repo, { idempotency_key: `project:${PROJECT_ID}:final`, type: "final_balance", status: "processing" });
    const { deps, mocks } = makeDeps(repo, NOW);
    mocks.paymentIntentsSearch.mockResolvedValue({ data: [pi("pi_fin", { stage: "final_balance", collect: "off_session" })], has_more: false, next_page: null });
    await reconcileProject(deps, repo.projects.get(PROJECT_ID)!);
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ final_payment_status: "paid", status: "ready_for_launch", stripe_final_pi: "pi_fin" });
  });

  it("ignores intents that belong to another project", async () => {
    const repo = new FakeRepo(makeProject({ status: "requested" }));
    await seedLedger(repo, { idempotency_key: `project:${PROJECT_ID}:deposit` });
    const { deps, mocks } = makeDeps(repo, NOW);
    mocks.paymentIntentsSearch.mockResolvedValue({ data: [pi("pi_other", { project: "someone-else" })], has_more: false, next_page: null });
    await reconcileProject(deps, repo.projects.get(PROJECT_ID)!);
    expect(repo.projects.get(PROJECT_ID)!.initial_payment_status).toBe("pending");
  });

  it("one failing project does not stop the run", async () => {
    const repo = new FakeRepo(makeProject({ status: "requested" }));
    await seedLedger(repo, { idempotency_key: `project:${PROJECT_ID}:deposit` });
    const { deps, mocks } = makeDeps(repo, NOW);
    mocks.paymentIntentsSearch.mockRejectedValue(new Error("search unavailable"));
    const summary = await reconcilePayments(deps);
    expect(summary).toMatchObject({ checked: 1, errors: 1, incomplete: false });
  });
});

describe("cron endpoint", () => {
  afterEach(() => vi.unstubAllEnvs());
  const call = async (auth?: string) => {
    const { GET } = await import("@/app/api/cron/payments/route");
    return GET(new Request("https://example.test/api/cron/payments", auth ? { headers: { authorization: auth } } : {}));
  };

  it("refuses to run without CRON_SECRET, and rejects a wrong or missing bearer token", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer anything")).status).toBe(503);
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong-value")).status).toBe(401);
    expect((await call("s3cret-value")).status).toBe(401);
  });

  it("with the right token proceeds (and reports payments unconfigured here)", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect((await call("Bearer s3cret-value")).status).toBe(503);
  });
});
