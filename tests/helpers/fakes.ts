import Stripe from "stripe";
import { vi } from "vitest";
import type { ClaimedFinal, Guard, LedgerInsert, LedgerRow, PaymentsRepo, ProjectPayRow } from "@/lib/payments/repo";
import type { PaymentsDeps } from "@/lib/payments/stripe";
import type { Viewer } from "@/lib/portal/types";

export const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
export const OWNER: Viewer = { userId: "22222222-2222-4222-8222-222222222222", email: "client@example.com", fullName: "Client", role: "client" };
export const ADMIN: Viewer = { userId: "33333333-3333-4333-8333-333333333333", email: "owner@example.com", fullName: "Owner", role: "admin" };
export const STRANGER: Viewer = { userId: "44444444-4444-4444-8444-444444444444", email: "other@example.com", fullName: null, role: "client" };

export const makeProject = (overrides: Partial<ProjectPayRow> = {}): ProjectPayRow => ({
  id: PROJECT_ID,
  user_id: OWNER.userId,
  package: "presence",
  email: OWNER.email,
  client_name: "Client",
  status: "requested",
  payment_status: "unpaid",
  currency: "usd",
  total_amount: 20000,
  deposit_amount: 10000,
  remaining_amount: 10000,
  amount_paid: null,
  initial_payment_status: "pending",
  final_payment_status: "pending",
  stripe_customer_id: null,
  stripe_payment_method_id: null,
  stripe_deposit_pi: null,
  stripe_final_pi: null,
  initial_paid_at: null,
  final_paid_at: null,
  cancellation_requested_at: null,
  refund_status: "none",
  refunded_amount: 0,
  dispute_status: null,
  ...overrides,
});

/** A project whose initial payment is done and a card is saved: ready for the final charge. */
export const makePaidDepositProject = (overrides: Partial<ProjectPayRow> = {}) =>
  makeProject({
    status: "client_review",
    payment_status: "deposit_paid",
    amount_paid: 10000,
    initial_payment_status: "paid",
    initial_paid_at: "2026-09-30T10:00:00.000Z",
    stripe_customer_id: "cus_1",
    stripe_payment_method_id: "pm_1",
    stripe_deposit_pi: "pi_dep",
    ...overrides,
  });

/** In-memory PaymentsRepo mirroring the SQL semantics (unique keys, compare-and-set, atomic claim). */
export class FakeRepo implements PaymentsRepo {
  projects = new Map<string, ProjectPayRow>();
  ledger: LedgerRow[] = [];
  events: { projectId: string; kind: string }[] = [];
  webhookEvents = new Set<string>();
  profileCustomers = new Map<string, string>();
  private seq = 0;

  constructor(...projects: ProjectPayRow[]) {
    for (const p of projects) this.projects.set(p.id, p);
  }

  async getProject(id: string) {
    const p = this.projects.get(id);
    return p ? { ...p } : null;
  }
  async updateProject(id: string, patch: Partial<ProjectPayRow>) {
    const p = this.projects.get(id);
    if (p) Object.assign(p, patch);
  }
  async updateProjectIf(id: string, patch: Partial<ProjectPayRow>, guard: Guard) {
    const p = this.projects.get(id);
    if (!p) return false;
    for (const [col, allowed] of Object.entries(guard)) {
      if (allowed && !allowed.includes((p as Record<string, unknown>)[col] as string | number | null)) return false;
    }
    Object.assign(p, patch);
    return true;
  }
  async claimFinalPayment(id: string): Promise<ClaimedFinal | null> {
    const p = this.projects.get(id);
    if (!p || !(p.remaining_amount && p.remaining_amount > 0) || p.initial_payment_status !== "paid") return null;
    if (!["pending", "failed", "requires_action"].includes(p.final_payment_status)) return null;
    if (["cancelled", "completed"].includes(p.status)) return null;
    p.final_payment_status = "processing";
    return { id: p.id, remaining_amount: p.remaining_amount, currency: p.currency, stripe_customer_id: p.stripe_customer_id, stripe_payment_method_id: p.stripe_payment_method_id };
  }
  async getProfileCustomerId(userId: string) {
    return this.profileCustomers.get(userId) ?? null;
  }
  async setProfileCustomerId(userId: string, customerId: string) {
    this.profileCustomers.set(userId, customerId);
  }
  async getLedgerByKey(key: string) {
    return this.ledger.find((r) => r.idempotency_key === key) ?? null;
  }
  async getLedgerById(id: string) {
    return this.ledger.find((r) => r.id === id) ?? null;
  }
  async upsertLedger(row: LedgerInsert) {
    const existing = this.ledger.find((r) => r.idempotency_key === row.idempotency_key);
    if (existing) return existing;
    const full: LedgerRow = {
      stripe_session_id: null,
      stripe_payment_intent_id: null,
      stripe_refund_id: null,
      failure_reason: null,
      paid_at: null,
      ...row,
      id: `led-${++this.seq}`,
      created_at: new Date(1_700_000_000_000 + this.seq).toISOString(),
    };
    if (full.stripe_payment_intent_id && this.ledger.some((r) => r.stripe_payment_intent_id === full.stripe_payment_intent_id && r.type === full.type)) {
      throw new Error("unique violation payments_pi_type_idx");
    }
    this.ledger.push(full);
    return full;
  }
  async updateLedger(id: string, patch: Partial<LedgerRow>) {
    const row = this.ledger.find((r) => r.id === id);
    if (!row) return;
    const next = { ...row, ...patch };
    if (next.stripe_payment_intent_id && this.ledger.some((r) => r !== row && r.stripe_payment_intent_id === next.stripe_payment_intent_id && r.type === next.type)) {
      throw new Error("unique violation payments_pi_type_idx");
    }
    Object.assign(row, patch);
  }
  async listLedger(projectId: string) {
    return this.ledger.filter((r) => r.project_id === projectId);
  }
  async findLedgerByPaymentIntent(pi: string) {
    return this.ledger.find((r) => r.stripe_payment_intent_id === pi && r.type !== "refund") ?? null;
  }
  async countFinalAttempts(projectId: string) {
    return this.ledger.filter((r) => r.idempotency_key.startsWith(`project:${projectId}:final:attempt:`)).length;
  }
  async recordWebhookEvent(eventId: string) {
    if (this.webhookEvents.has(eventId)) return false;
    this.webhookEvents.add(eventId);
    return true;
  }
  async forgetWebhookEvent(eventId: string) {
    this.webhookEvents.delete(eventId);
  }
  async addEvent(projectId: string, kind: string) {
    this.events.push({ projectId, kind });
  }
}

/** Real Stripe client (offline: only signature helpers are used) plus vi.fn stubs for network resources. */
export const makeStripe = () => {
  const stripe = new Stripe("sk_test_unit_tests_only");
  const mocks = {
    paymentIntentsCreate: vi.fn(),
    paymentIntentsRetrieve: vi.fn(async () => ({ payment_method: "pm_saved" })),
    customersCreate: vi.fn(async () => ({ id: "cus_new" })),
    sessionsCreate: vi.fn(async () => ({ id: "cs_1", url: "https://checkout.stripe.test/cs_1" })),
    refundsCreate: vi.fn(async () => ({ id: "re_1" })),
    chargesRetrieve: vi.fn(async () => ({ payment_intent: "pi_x" })),
  };
  Object.assign(stripe, {
    paymentIntents: { create: mocks.paymentIntentsCreate, retrieve: mocks.paymentIntentsRetrieve },
    customers: { create: mocks.customersCreate },
    checkout: { sessions: { create: mocks.sessionsCreate } },
    refunds: { create: mocks.refundsCreate },
    charges: { retrieve: mocks.chargesRetrieve },
  });
  return { stripe, mocks };
};

export const makeDeps = (repo: FakeRepo, now = "2026-09-30T12:00:00.000Z") => {
  const { stripe, mocks } = makeStripe();
  const deps: PaymentsDeps = { repo, stripe, now: () => new Date(now), origin: "https://example.test" };
  return { deps, mocks };
};

// Loosely-typed view of the params passed to mocked Stripe calls (assertions read nested fields).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Params = Record<string, any>;
