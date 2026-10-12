import { describe, expect, it, vi } from "vitest";
import { safeNext } from "@/lib/auth/next";
import { parseInquiryDraft } from "@/lib/inquiry/draft";
import { finalizeDeposit, finalizeFinal, applyRefundedTotal } from "@/lib/payments/finalize";
import { dueSummary } from "@/lib/payments/plan";
import { refundPayment } from "@/lib/payments/refunds";
import { inCancellationWindow } from "@/lib/payments/cancellation";
import { reconcileProject } from "@/lib/payments/reconcile";
import { expireProjectSessions } from "@/lib/payments/checkout";
import { buildOverview } from "@/lib/portal/mappers";
import { ADMIN, PROJECT_ID, FakeRepo, makeDeps, makeProject, makePaidDepositProject } from "./helpers/fakes";

describe("audit regressions", () => {
  it("groups revenue by the same Chicago calendar as the dashboard dates", () => {
    const input = {
      projects: [],
      unread: 0,
      activity: [],
      payments: [
        {
          type: "deposit",
          status: "succeeded",
          amount: 4900,
          createdAt: "2026-10-01T02:00:00Z",
          paidAt: "2026-10-01T02:00:00Z",
        },
        {
          type: "deposit",
          status: "succeeded",
          amount: 9950,
          createdAt: "2026-10-01T06:00:00Z",
          paidAt: "2026-10-01T06:00:00Z",
        },
      ],
    };
    const overview = buildOverview(input, new Date("2026-10-01T07:00:00Z"));
    expect(overview.revenueByMonth.slice(-2)).toEqual([
      { month: "Sep", collected: 4900 },
      { month: "Oct", collected: 9950 },
    ]);
    expect(buildOverview(input, new Date("2026-10-01T02:00:00Z")).revenueByMonth.at(-1)?.month).toBe("Sep");
  });
  it("blocks account deletion when a checkout completed but has not reached the ledger", async () => {
    const repo = new FakeRepo(makeProject());
    repo.ledger.push({
      id: "payment",
      project_id: PROJECT_ID,
      type: "deposit",
      status: "pending",
      amount: 10000,
      currency: "usd",
      stripe_payment_intent_id: null,
      stripe_session_id: "cs_unconfirmed",
      stripe_refund_id: null,
      failure_reason: null,
      idempotency_key: "test",
      created_at: "",
      paid_at: null,
    });
    const { deps, mocks } = makeDeps(repo);
    mocks.sessionsRetrieve.mockResolvedValueOnce({ id: "cs_unconfirmed", status: "complete" });
    await expect(expireProjectSessions(PROJECT_ID, deps, true)).rejects.toThrow("still being confirmed");
    expect(mocks.sessionsExpire).not.toHaveBeenCalled();
    mocks.sessionsRetrieve.mockRejectedValueOnce(new Error("network unavailable"));
    await expect(expireProjectSessions(PROJECT_ID, deps, true)).rejects.toThrow("network unavailable");
  });
  it("uses the published calendar-day cancellation window and rejects invalid or future timestamps", () => {
    const now = new Date("2026-10-10T23:00:00Z");
    expect(inCancellationWindow("2026-10-07T00:01:00Z", now)).toBe(true);
    expect(inCancellationWindow("2026-10-06T23:59:00Z", now)).toBe(false);
    expect(inCancellationWindow("invalid", now)).toBe(false);
    expect(inCancellationWindow("2026-10-11T00:00:00Z", now)).toBe(false);
  });
  it("never releases an uncertain charge after a truncated Stripe search", async () => {
    const repo = new FakeRepo(
      makePaidDepositProject({ final_payment_status: "processing", updated_at: "2026-01-01T00:00:00Z" }),
    );
    const { deps, mocks } = makeDeps(repo);
    mocks.paymentIntentsSearch.mockResolvedValue({ data: [], has_more: true, next_page: "more" });
    await expect(reconcileProject(deps, repo.projects.get(PROJECT_ID)!)).rejects.toThrow("page limit");
    expect(repo.projects.get(PROJECT_ID)?.final_payment_status).toBe("processing");
  });
  it("refuses redirects that browsers normalize into another host", () => {
    for (const target of [
      "//evil.test",
      "/\\evil.test",
      "/\n/evil.test",
      "/\t/evil.test",
      " https://evil.test",
      "https://evil.test",
    ])
      expect(safeNext(target)).toBe("/portal");
    expect(safeNext("/start?package=presence")).toBe("/start?package=presence");
  });
  it("restores malformed drafts without unsafe field types or a broken submission key", () => {
    const draft = parseInquiryDraft(
      JSON.stringify({
        step: 2,
        values: { description: 5, links: "oops", features: [7, "gallery"], name: "Client" },
        submissionId: "invalid",
      }),
    );
    expect(draft?.values).toMatchObject({ description: "", links: [""], features: ["gallery"], name: "Client" });
    expect(draft?.reached).toBe(2);
    expect(draft?.submissionId).toBeUndefined();
    expect(parseInquiryDraft("{")).toBeNull();
    expect(parseInquiryDraft('{"step":1.5,"values":{}}')).toBeNull();
  });
  it("does not invite another payment during bank processing", () => {
    expect(
      dueSummary({
        deposit_amount: 100,
        remaining_amount: 100,
        initial_payment_status: "processing",
        final_payment_status: "pending",
      }),
    ).toMatchObject({ dueNow: 0, label: "Payment processing" });
    expect(
      dueSummary({
        deposit_amount: 100,
        remaining_amount: 100,
        initial_payment_status: "paid",
        final_payment_status: "processing",
      }),
    ).toMatchObject({ dueNow: 0, label: "Payment processing" });
  });
  it.each(["deposit", "final"])(
    "repairs a %s ledger after the project committed but ledger storage failed",
    async (stage) => {
      const repo = new FakeRepo(stage === "deposit" ? makeProject() : makePaidDepositProject());
      const { deps } = makeDeps(repo);
      const update = repo.updateLedger.bind(repo);
      vi.spyOn(repo, "updateLedger").mockRejectedValueOnce(new Error("storage offline")).mockImplementation(update);
      const finalize = stage === "deposit" ? finalizeDeposit : finalizeFinal;
      const input = { projectId: PROJECT_ID, paymentIntentId: "pi_repair", amountReceived: 10000 };
      await expect(finalize(deps, input)).rejects.toThrow("storage offline");
      expect(await finalize(deps, input)).toBe("applied");
      expect(await finalize(deps, input)).toBe("noop");
      expect(repo.ledger).toHaveLength(1);
      expect(repo.ledger[0]).toMatchObject({
        status: "succeeded",
        amount: 10000,
        stripe_payment_intent_id: "pi_repair",
      });
      expect(repo.projects.get(PROJECT_ID)?.amount_paid).toBe(stage === "deposit" ? 10000 : 20000);
    },
  );
  it("rejects an exact numeric amount in a different currency", async () => {
    const repo = new FakeRepo(makeProject());
    const { deps, mocks } = makeDeps(repo);
    expect(
      await finalizeDeposit(deps, {
        projectId: PROJECT_ID,
        paymentIntentId: "pi_foreign",
        amountReceived: 10000,
        currency: "eur",
      }),
    ).toBe("mismatch");
    expect(repo.projects.get(PROJECT_ID)?.initial_payment_status).toBe("pending");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });
  it("refuses a refund before contacting Stripe when transactional storage is unavailable", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    repo.ledger.push({
      id: "payment",
      project_id: PROJECT_ID,
      type: "deposit",
      status: "succeeded",
      amount: 10000,
      currency: "usd",
      stripe_payment_intent_id: "pi_dep",
      stripe_session_id: null,
      stripe_refund_id: null,
      failure_reason: null,
      idempotency_key: `project:${PROJECT_ID}:deposit`,
      created_at: "",
      paid_at: "",
    });
    const { deps, mocks } = makeDeps(repo);
    vi.spyOn(repo, "recordRefundTotal").mockRejectedValue(new Error("migration missing"));
    await expect(refundPayment(PROJECT_ID, "payment", 500, ADMIN, deps)).rejects.toThrow("migration missing");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });
  it("delegates concurrent cumulative totals to atomic storage and keeps the final total exact", async () => {
    const repo = new FakeRepo(makePaidDepositProject());
    repo.ledger.push({
      id: "payment",
      project_id: PROJECT_ID,
      type: "deposit",
      status: "succeeded",
      amount: 10000,
      currency: "usd",
      stripe_payment_intent_id: "pi_dep",
      stripe_session_id: null,
      stripe_refund_id: null,
      failure_reason: null,
      idempotency_key: `project:${PROJECT_ID}:deposit`,
      created_at: "",
      paid_at: "",
    });
    const { deps } = makeDeps(repo);
    await Promise.all(
      [6000, 10000, 6000].map((refundedTotal) =>
        applyRefundedTotal(deps, { projectId: PROJECT_ID, paymentIntentId: "pi_dep", refundedTotal }),
      ),
    );
    expect(repo.projects.get(PROJECT_ID)?.refunded_amount).toBe(10000);
    expect(repo.ledger.filter((row) => row.type === "refund").reduce((sum, row) => sum + row.amount, 0)).toBe(10000);
    expect(repo.ledger[0].status).toBe("refunded");
  });
});
