import { describe, expect, it } from "vitest";
import type { FeedbackRound, ProjectDetail } from "@/lib/portal/types";
import { balanceDue, canGiveFeedback, invoiceNumber, isInvoiceable, mergeChecklist, waitingOn, type ChecklistRow } from "@/lib/portal/workflow";

const ID = "11111111-1111-4111-8111-111111111111";

const project = (over: Partial<ProjectDetail> = {}): ProjectDetail => ({
  id: ID, clientName: "Test Client", email: "client@example.com", organization: null, package: "presence", websiteType: null,
  stage: "building", progress: 40, deadline: null, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-02T00:00:00Z",
  money: { total: 20000, deposit: 10000, remaining: 10000, paid: 10000, currency: "usd" },
  initialPayment: "paid", finalPayment: "pending", unreadMessages: 0, hasAccount: true,
  description: null, features: [], links: [], existingWebsite: null, timeline: null, budget: null, phone: null,
  previewUrl: null, revisionsIncluded: 2, revisionsUsed: 0, approvedAt: null, initialPaidAt: null, finalPaidAt: null,
  cancellationRequestedAt: null, cancelledAt: null, refundedAmount: 0, milestones: [], payments: [], events: [],
  ...over,
});

const row = (key: string, status: ChecklistRow["status"], extra: Partial<ChecklistRow> = {}): ChecklistRow => ({
  key, label: null, status, answer: null, file_id: null, updated_at: "2026-09-03T00:00:00Z", ...extra,
});

const round = (over: Partial<FeedbackRound>): FeedbackRound => ({
  id: "r", number: 1, status: "draft", extra: false, submittedAt: null, resolvedAt: null, createdAt: "2026-09-04T00:00:00Z", items: [], ...over,
});

describe("mergeChecklist", () => {
  it("lists every template item for the package and applies stored state", () => {
    const items = mergeChecklist("presence", [row("logo", "provided", { file_id: "f1" })], new Map([["f1", "logo.png"]]));
    expect(items.map((i) => i.key)).toEqual(["logo", "copy", "photos", "brand", "domain"]);
    expect(items[0]).toMatchObject({ status: "provided", fileName: "logo.png" });
    expect(items[1].status).toBe("needed");
    expect(items.find((i) => i.key === "brand")?.optional).toBe(true);
  });

  it("appends studio-added items and ignores stale keys from another package", () => {
    const items = mergeChecklist("launch", [row("custom:abc", "needed", { label: "Menu PDF" }), row("logo", "provided")], new Map());
    expect(items.some((i) => i.key === "logo")).toBe(false);
    expect(items.at(-1)).toMatchObject({ key: "custom:abc", label: "Menu PDF", custom: true });
  });
});

describe("feedback eligibility", () => {
  it("is open only in review with a preview and no approval", () => {
    expect(canGiveFeedback({ stage: "client_review", previewUrl: "https://x.example", approvedAt: null })).toBe(true);
    expect(canGiveFeedback({ stage: "client_review", previewUrl: null, approvedAt: null })).toBe(false);
    expect(canGiveFeedback({ stage: "revisions", previewUrl: "https://x.example", approvedAt: "2026-09-05" })).toBe(false);
    expect(canGiveFeedback({ stage: "building", previewUrl: "https://x.example", approvedAt: null })).toBe(false);
  });
});

describe("waitingOn", () => {
  it("asks for the deposit first, linking to checkout", () => {
    const items = waitingOn(project({ stage: "accepted", initialPayment: "pending" }), { checklist: [], rounds: [] });
    expect(items[0]).toMatchObject({ key: "initial-payment", href: `/portal/projects/${ID}/checkout`, cta: "Pay $100" });
  });

  it("flags a failed deposit as a warning", () => {
    const [first] = waitingOn(project({ stage: "accepted", initialPayment: "failed" }), { checklist: [], rounds: [] });
    expect(first).toMatchObject({ key: "initial-payment", tone: "warn" });
  });

  it("lists missing required checklist items while the project is early", () => {
    const checklist = mergeChecklist("presence", [row("logo", "provided")], new Map());
    const items = waitingOn(project(), { checklist, rounds: [] });
    const item = items.find((i) => i.key === "checklist");
    expect(item?.title).toBe("Send 3 items for your site"); // copy, photos, domain (brand is optional)
    expect(item?.href).toBe(`/portal/projects/${ID}/files#checklist`);
  });

  it("asks for a review in client_review, or to finish a drafted round", () => {
    const p = project({ stage: "client_review", previewUrl: "https://x.example" });
    expect(waitingOn(p, { checklist: [], rounds: [] }).find((i) => i.key === "feedback")?.title).toBe("Review your preview");
    const drafted = round({ items: [{ id: "i", page: null, body: "x", fileId: null, fileName: null, status: "open", createdAt: "" }] });
    expect(waitingOn(p, { checklist: [], rounds: [drafted] }).find((i) => i.key === "feedback")?.title).toBe("Finish sending your feedback");
  });

  it("stays quiet while the studio works on a sent round", () => {
    const p = project({ stage: "revisions", previewUrl: "https://x.example" });
    expect(waitingOn(p, { checklist: [], rounds: [round({ status: "submitted" })] }).some((i) => i.key === "feedback")).toBe(false);
  });

  it("asks for the balance when the final charge failed", () => {
    const p = project({ stage: "awaiting_final_payment", finalPayment: "failed" });
    expect(balanceDue(p)).toBe(true);
    expect(waitingOn(p, { checklist: [], rounds: [] })[0]).toMatchObject({ key: "final-payment", tone: "warn", cta: "Pay $100" });
  });

  it("includes unread messages and returns nothing for closed projects", () => {
    expect(waitingOn(project({ unreadMessages: 2 }), { checklist: [], rounds: [] }).find((i) => i.key === "messages")?.title).toBe("2 new messages from the studio");
    expect(waitingOn(project({ stage: "completed", unreadMessages: 2 }), { checklist: [], rounds: [] })).toEqual([]);
  });
});

describe("invoices", () => {
  it("numbers invoices from the paid month and payment id", () => {
    expect(invoiceNumber({ id: "abcdef12-3456-4789-8abc-def012345678", createdAt: "2026-09-01T00:00:00Z", paidAt: "2026-10-02T12:00:00Z" })).toBe("NF-202610-ABCDEF");
  });

  it("only invoices money that arrived", () => {
    expect(isInvoiceable({ type: "deposit", status: "succeeded" })).toBe(true);
    expect(isInvoiceable({ type: "final_balance", status: "failed" })).toBe(false);
    expect(isInvoiceable({ type: "refund", status: "succeeded" })).toBe(false);
  });
});
