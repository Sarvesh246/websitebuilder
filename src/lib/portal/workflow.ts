/** Pure client-workflow rules (no I/O, unit tested): intake checklist, feedback eligibility, "waiting on you", invoices. */
import { CUSTOM_INTAKE_PREFIX, intakeTemplates } from "@/config/intake";
import { formatUsd } from "@/lib/money";
import type { ChecklistItem, ChecklistStatus, FeedbackRound, PaymentRow, ProjectDetail, ProjectSummary, WaitingItem } from "./types";

export type ChecklistRow = { key: string; label: string | null; status: ChecklistStatus; answer: string | null; file_id: string | null; updated_at: string };

/** The package template merged with what has been done so far, then any custom items the studio added. */
export const mergeChecklist = (pkg: ProjectSummary["package"], rows: ChecklistRow[], fileNames: Map<string, string>): ChecklistItem[] => {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const state = (key: string) => {
    const r = byKey.get(key);
    return {
      status: r?.status ?? "needed",
      answer: r?.answer ?? null,
      fileId: r?.file_id ?? null,
      fileName: r?.file_id ? (fileNames.get(r.file_id) ?? null) : null,
      updatedAt: r?.updated_at ?? null,
    };
  };
  const fromTemplate: ChecklistItem[] = intakeTemplates[pkg].map((t) => ({
    key: t.key, label: t.label, hint: t.hint, kind: t.kind, options: t.options ?? [], optional: Boolean(t.optional), custom: false, ...state(t.key),
  }));
  const custom: ChecklistItem[] = rows
    .filter((r) => r.key.startsWith(CUSTOM_INTAKE_PREFIX))
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .map((r) => ({ key: r.key, label: r.label ?? "Requested item", hint: null, kind: "upload", options: [], optional: false, custom: true, ...state(r.key) }));
  return [...fromTemplate, ...custom];
};

export const checklistOutstanding = (items: ChecklistItem[]) => items.filter((i) => i.status === "needed" && !i.optional);

/** Feedback is open while a preview is up for review and the client has not signed off. */
export const canGiveFeedback = (p: Pick<ProjectDetail, "stage" | "previewUrl" | "approvedAt">) =>
  Boolean(p.previewUrl) && !p.approvedAt && (p.stage === "client_review" || p.stage === "revisions");

/** A submitted round the studio has not finished yet. */
export const roundInProgress = (rounds: FeedbackRound[]) => rounds.find((r) => r.status === "submitted") ?? null;
export const draftRound = (rounds: FeedbackRound[]) => rounds.find((r) => r.status === "draft") ?? null;

/** The balance is due and the client is the one who can pay it. */
export const balanceDue = (p: ProjectDetail) =>
  (p.money.remaining ?? 0) > 0 &&
  p.finalPayment !== "paid" &&
  p.stage !== "cancelled" &&
  (p.finalPayment === "failed" || p.finalPayment === "requires_action" || (p.stage === "awaiting_final_payment" && p.finalPayment !== "processing"));

const EARLY_STAGES = new Set(["requested", "accepted", "building"]);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Everything the client owes the studio right now, most urgent first. Empty means "all caught up". */
export const waitingOn = (p: ProjectDetail, input: { checklist: ChecklistItem[]; rounds: FeedbackRound[] }): WaitingItem[] => {
  if (p.stage === "cancelled" || p.stage === "completed") return [];
  const base = `/portal/projects/${p.id}`;
  const out: WaitingItem[] = [];

  if (p.money.deposit != null && p.initialPayment !== "paid" && p.initialPayment !== "processing") {
    const full = (p.money.remaining ?? 0) === 0;
    const failed = p.initialPayment === "failed";
    out.push({
      key: "initial-payment",
      title: failed ? "Your payment did not go through" : full ? "Make your payment to start" : "Pay the deposit to start",
      detail: failed ? "Nothing was charged. Try again with the same or another card." : "Work begins once this payment is in.",
      href: `${base}/checkout`,
      cta: `Pay ${formatUsd(p.money.deposit)}`,
      tone: failed ? "warn" : "accent",
    });
  }

  if (balanceDue(p)) {
    const failed = p.finalPayment === "failed" || p.finalPayment === "requires_action";
    out.push({
      key: "final-payment",
      title: failed ? "The final payment needs your attention" : "Pay the remaining balance",
      detail: failed ? "The saved card was not charged. Pay securely from the Payments tab." : "Your site launches once the balance is paid.",
      href: `${base}/payments`,
      cta: `Pay ${formatUsd(p.money.remaining)}`,
      tone: failed ? "warn" : "accent",
    });
  }

  const missing = checklistOutstanding(input.checklist);
  if (missing.length > 0 && EARLY_STAGES.has(p.stage)) {
    const names = missing.slice(0, 3).map((i) => i.label.toLowerCase());
    out.push({
      key: "checklist",
      title: `Send ${plural(missing.length, "item", "items")} for your site`,
      detail: `Still needed: ${names.join(", ")}${missing.length > 3 ? ", and more" : ""}.`,
      href: `${base}/files#checklist`,
      cta: "Open checklist",
      tone: "accent",
    });
  }

  if (canGiveFeedback(p) && !roundInProgress(input.rounds)) {
    const draft = draftRound(input.rounds);
    const drafted = draft?.items.length ?? 0;
    out.push(
      drafted > 0
        ? {
            key: "feedback",
            title: "Finish sending your feedback",
            detail: `You have ${plural(drafted, "comment", "comments")} drafted. The studio sees them once you send the round.`,
            href: `${base}/preview#feedback`,
            cta: "Review and send",
            tone: "accent",
          }
        : {
            key: "feedback",
            title: p.stage === "revisions" ? "Review the latest changes" : "Review your preview",
            detail: "Leave comments on anything to change, or approve it if it is ready.",
            href: `${base}/preview`,
            cta: "Open preview",
            tone: "accent",
          },
    );
  }

  if (p.unreadMessages > 0) {
    out.push({
      key: "messages",
      title: `${plural(p.unreadMessages, "new message", "new messages")} from the studio`,
      detail: "Replies may need an answer from you.",
      href: `${base}/messages`,
      cta: "Read",
      tone: "accent",
    });
  }
  return out;
};

/** Stable, human-readable invoice number derived from the payment (no sequence table needed). */
export const invoiceNumber = (pay: Pick<PaymentRow, "id" | "createdAt" | "paidAt">) => {
  const d = new Date(pay.paidAt ?? pay.createdAt);
  const ym = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `NF-${ym}-${pay.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
};

/** Only money that actually arrived gets an invoice. */
export const isInvoiceable = (pay: Pick<PaymentRow, "type" | "status">) =>
  pay.type !== "refund" && (pay.status === "succeeded" || pay.status === "refunded" || pay.status === "partially_refunded");
