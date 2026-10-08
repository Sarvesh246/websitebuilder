import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { processStripeWebhook } from "@/lib/payments/webhook";
import { refundPayment, requestCancellation } from "@/lib/payments/refunds";
import { ADMIN, FakeRepo, OWNER, PROJECT_ID, STRANGER, makeDeps, makePaidDepositProject } from "./helpers/fakes";

const seed = () => {
  const repo = new FakeRepo(makePaidDepositProject());
  repo.ledger.push({
    id: "led-dep", project_id: PROJECT_ID, type: "deposit", status: "succeeded", amount: 10000, currency: "usd", stripe_session_id: null,
    stripe_payment_intent_id: "pi_dep", stripe_refund_id: null, failure_reason: null, idempotency_key: `project:${PROJECT_ID}:deposit`, created_at: "", paid_at: "",
  });
  return repo;
};

describe("refundPayment", () => {
  it("is admin only", async () => {
    const { deps, mocks } = makeDeps(seed());
    await expect(refundPayment(PROJECT_ID, "led-dep", undefined, OWNER, deps)).rejects.toThrow("Only the studio");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });

  it("rejects a refund larger than the refundable amount, including across partial refunds", async () => {
    const repo = seed();
    const { deps, mocks } = makeDeps(repo);
    await expect(refundPayment(PROJECT_ID, "led-dep", 10001, ADMIN, deps)).rejects.toThrow("more than");
    await refundPayment(PROJECT_ID, "led-dep", 6000, ADMIN, deps);
    await expect(refundPayment(PROJECT_ID, "led-dep", 5000, ADMIN, deps)).rejects.toThrow("more than");
    expect(mocks.refundsCreate).toHaveBeenCalledTimes(1);
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ refunded_amount: 6000, refund_status: "partial", payment_status: "partially_refunded" });
    await refundPayment(PROJECT_ID, "led-dep", undefined, ADMIN, deps); // remaining 4000
    expect(repo.projects.get(PROJECT_ID)).toMatchObject({ refunded_amount: 10000, refund_status: "full", payment_status: "refunded" });
    await expect(refundPayment(PROJECT_ID, "led-dep", undefined, ADMIN, deps)).rejects.toThrow("fully refunded");
  });

  it("rejects payments from another project, unpaid rows and bad amounts", async () => {
    const repo = seed();
    const { deps } = makeDeps(repo);
    await expect(refundPayment("55555555-5555-4555-8555-555555555555", "led-dep", 100, ADMIN, deps)).rejects.toThrow("not found");
    repo.ledger[0].status = "pending";
    await expect(refundPayment(PROJECT_ID, "led-dep", 100, ADMIN, deps)).rejects.toThrow("cannot be refunded");
    repo.ledger[0].status = "succeeded";
    await expect(refundPayment(PROJECT_ID, "led-dep", -5, ADMIN, deps)).rejects.toThrow("valid refund amount");
    await expect(refundPayment(PROJECT_ID, "led-dep", 1.5, ADMIN, deps)).rejects.toThrow("valid refund amount");
  });

  it("counts a refund once when the charge.refunded webhook arrives after the action", async () => {
    const repo = seed();
    const { deps } = makeDeps(repo);
    await refundPayment(PROJECT_ID, "led-dep", 6000, ADMIN, deps);
    const rawBody = JSON.stringify({ id: "evt_rf", object: "event", type: "charge.refunded", data: { object: { id: "ch_1", payment_intent: "pi_dep", amount_refunded: 6000 } } });
    const signature = deps.stripe.webhooks.generateTestHeaderString({ payload: rawBody, secret: "whsec_x" });
    await processStripeWebhook(deps, { rawBody, signature, secret: "whsec_x" });
    expect(repo.ledger.filter((r) => r.type === "refund")).toHaveLength(1);
    expect(repo.projects.get(PROJECT_ID)!.refunded_amount).toBe(6000);
  });
});

describe("requestCancellation", () => {
  it("stamps the request inside the 3-day window and never refunds", async () => {
    const repo = seed();
    const { deps, mocks } = makeDeps(repo, "2026-10-03T08:00:00.000Z"); // paid 09-30, third day after
    const result = await requestCancellation(PROJECT_ID, OWNER, deps);
    expect(result.requestedAt).toBe("2026-10-03T08:00:00.000Z");
    expect(repo.projects.get(PROJECT_ID)!.cancellation_requested_at).toBe(result.requestedAt);
    expect(repo.projects.get(PROJECT_ID)!.status).toBe("client_review");
    expect(mocks.refundsCreate).not.toHaveBeenCalled();
  });

  it("rejects a request outside the window, from a non-owner, or before any payment", async () => {
    const late = makeDeps(seed(), "2026-10-04T08:00:00.000Z");
    await expect(requestCancellation(PROJECT_ID, OWNER, late.deps)).rejects.toThrow("window has passed");
    await expect(late.deps.repo.getProject(PROJECT_ID)).resolves.toMatchObject({ cancellation_requested_at: null });
    const early = makeDeps(seed(), "2026-10-01T08:00:00.000Z");
    await expect(requestCancellation(PROJECT_ID, STRANGER, early.deps)).rejects.toThrow("not found");
    const unpaid = makeDeps(new FakeRepo(makePaidDepositProject({ initial_paid_at: null, initial_payment_status: "pending" })));
    await expect(requestCancellation(PROJECT_ID, OWNER, unpaid.deps)).rejects.toThrow("Nothing has been paid");
  });
});

describe("payment success page", () => {
  it("never marks anything paid: it imports no payment logic and writes nothing", () => {
    const candidates = [
      "src/app/(portal)/portal/projects/[id]/paid/page.tsx",
      "src/app/(portal)/portal/projects/[id]/paid/PaidStatus.tsx",
    ].map((p) => path.resolve(__dirname, "..", p));
    const files = candidates.filter((p) => fs.existsSync(p));
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(/@\/lib\/payments\/(finalize|finalBalance|checkout|refunds|repo|webhook)/);
      expect(source).not.toMatch(/createAdminClient|\.update\(|\.insert\(|\.upsert\(|\.rpc\(/);
    }
  });

  it("no page or route imports the finalize functions (only the payments library does)", () => {
    const finalizeUsers: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name) && /payments\/finalize"/.test(fs.readFileSync(full, "utf8"))) finalizeUsers.push(path.relative(path.resolve(__dirname, "../src"), full).replaceAll("\\", "/"));
      }
    };
    walk(path.resolve(__dirname, "../src"));
    expect(finalizeUsers.sort()).toEqual(["lib/payments/checkout.ts", "lib/payments/finalBalance.ts", "lib/payments/reconcile.ts", "lib/payments/refunds.ts", "lib/payments/webhook.ts"]);
  });
});
