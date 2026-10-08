/** Pure row-to-DTO mapping and aggregation. No I/O, safe to unit test. Money is integer cents. */
import {
  normalizeStage, projectStages, stageProgress,
  type AdminOverview, type FeedbackRound, type Message, type Milestone, type PaymentRow, type ProjectDetail, type ProjectFile,
  type ProjectStage, type ProjectSummary,
} from "./types";
import { dayKey } from "./format";

export type Perspective = "admin" | "client";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

/** Explicit column list: internal_notes, stripe ids and payment method ids are never selected. */
export const PROJECT_COLUMNS =
  "id, created_at, updated_at, client_name, email, phone, organization, package, website_type, project_description, " +
  "features_needed, inspiration_links, existing_website, timeline, budget, status, deadline, preview_url, " +
  "revisions_included, revisions_used, approved_at, currency, total_amount, deposit_amount, remaining_amount, " +
  "initial_payment_status, final_payment_status, initial_paid_at, final_paid_at, cancellation_requested_at, " +
  "cancelled_at, refunded_amount, user_id";

export type ProjectRow = {
  id: string; created_at: string; updated_at: string; client_name: string; email: string; phone: string | null;
  organization: string | null; package: string; website_type: string | null; project_description: string | null;
  features_needed: unknown; inspiration_links: unknown; existing_website: string | null; timeline: string | null;
  budget: string | null; status: string; deadline: string | null; preview_url: string | null;
  revisions_included: number; revisions_used: number; approved_at: string | null; currency: string;
  total_amount: number | null; deposit_amount: number | null; remaining_amount: number | null;
  initial_payment_status: ProjectSummary["initialPayment"]; final_payment_status: ProjectSummary["finalPayment"];
  initial_paid_at: string | null; final_paid_at: string | null; cancellation_requested_at: string | null;
  cancelled_at: string | null; refunded_amount: number; user_id: string | null;
};

export type PaymentDb = {
  id: string; project_id: string; type: PaymentRow["type"]; status: PaymentRow["status"]; amount: number;
  currency: string; created_at: string; paid_at: string | null; receipt_url?: string | null;
};
export type MilestoneDb = {
  id: string; project_id: string; title: string; detail: string | null; position: number;
  status: Milestone["status"]; due_date: string | null; completed_at: string | null;
};
export type MessageDb = {
  id: string; project_id: string; sender_role: "client" | "admin"; body: string; created_at: string; read_at: string | null;
};
export type FileDb = {
  id: string; project_id: string; name: string; size_bytes: number; mime_type: string | null;
  uploader_role: "client" | "admin"; created_at: string; path?: string;
};
export type FeedbackRoundDb = {
  id: string; project_id: string; number: number; status: FeedbackRound["status"]; extra: boolean;
  submitted_at: string | null; resolved_at: string | null; created_at: string;
};
export type FeedbackItemDb = {
  id: string; round_id: string; page: string | null; body: string; file_id: string | null; status: "open" | "done"; created_at: string;
};
export type EventDb = {
  id: string; project_id: string; kind: string; title: string; actor_role: "client" | "admin" | "system" | null; created_at: string;
};

const PACKAGES = ["launch", "presence", "business", "custom"] as const;
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const isOpenStage = (stage: ProjectStage) => stage !== "completed" && stage !== "cancelled";
export const otherSide = (p: Perspective): "client" | "admin" => (p === "admin" ? "client" : "admin");

export const computeProgress = (stage: ProjectStage, milestones: { status: string }[]): number => {
  if (stage === "cancelled") return 0;
  if (stage === "completed") return 100;
  if (milestones.length === 0) return stageProgress[stage];
  const done = milestones.filter((m) => m.status === "done").length;
  const active = milestones.filter((m) => m.status === "active").length;
  return Math.min(100, Math.max(0, Math.round(((done + active * 0.5) / milestones.length) * 100)));
};

const countsAsRefund = (status: string) => status !== "failed" && status !== "cancelled" && status !== "pending";
const countsAsPaid = (status: string) => status === "succeeded" || status === "refunded" || status === "partially_refunded";

/** Net money collected from ledger rows: paid payments minus refund rows. */
export const sumPaid = (payments: { type: string; status: string; amount: number }[]): number => {
  let gross = 0;
  let refunds = 0;
  for (const p of payments) {
    if (p.type === "refund") {
      if (countsAsRefund(p.status)) refunds += p.amount;
    } else if (countsAsPaid(p.status)) {
      gross += p.amount;
    }
  }
  return Math.max(0, gross - refunds);
};

export const toPaymentRow = (p: PaymentDb): PaymentRow => ({
  id: p.id, type: p.type, status: p.status, amount: p.amount, currency: p.currency, createdAt: p.created_at, paidAt: p.paid_at,
  receiptUrl: p.receipt_url ?? null,
});

export const toMilestone = (m: MilestoneDb): Milestone => ({
  id: m.id, title: m.title, detail: m.detail, position: m.position, status: m.status, dueDate: m.due_date, completedAt: m.completed_at,
});

export const toMessage = (m: MessageDb, perspective: Perspective): Message => ({
  id: m.id, projectId: m.project_id, senderRole: m.sender_role, body: m.body, createdAt: m.created_at, readAt: m.read_at,
  mine: m.sender_role === perspective,
});

export const toFile = (f: FileDb, thumbUrl: string | null = null): ProjectFile => ({
  id: f.id, projectId: f.project_id, name: f.name, sizeBytes: f.size_bytes, mimeType: f.mime_type,
  uploaderRole: f.uploader_role, createdAt: f.created_at, thumbUrl,
});

/** Rounds newest first, each with its comments oldest first. */
export const toRounds = (rounds: FeedbackRoundDb[], items: FeedbackItemDb[], fileNames: Map<string, string>): FeedbackRound[] =>
  [...rounds]
    .sort((a, b) => b.number - a.number)
    .map((r) => ({
      id: r.id, number: r.number, status: r.status, extra: r.extra, submittedAt: r.submitted_at, resolvedAt: r.resolved_at, createdAt: r.created_at,
      items: items
        .filter((i) => i.round_id === r.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((i) => ({
          id: i.id, page: i.page, body: i.body, fileId: i.file_id, fileName: i.file_id ? (fileNames.get(i.file_id) ?? null) : null,
          status: i.status, createdAt: i.created_at,
        })),
    }));

export const toSummary = (
  row: ProjectRow,
  ctx: { payments: { type: string; status: string; amount: number }[]; milestones: { status: string }[]; unread: number },
): ProjectSummary => {
  const stage = normalizeStage(row.status);
  return {
    id: row.id,
    clientName: row.client_name,
    email: row.email,
    organization: row.organization,
    package: (PACKAGES as readonly string[]).includes(row.package) ? (row.package as ProjectSummary["package"]) : "custom",
    websiteType: row.website_type,
    stage,
    progress: computeProgress(stage, ctx.milestones),
    deadline: row.deadline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    money: { total: row.total_amount, deposit: row.deposit_amount, remaining: row.remaining_amount, paid: sumPaid(ctx.payments), currency: row.currency },
    initialPayment: row.initial_payment_status,
    finalPayment: row.final_payment_status,
    unreadMessages: ctx.unread,
    hasAccount: row.user_id != null,
  };
};

export const toDetail = (
  row: ProjectRow,
  ctx: { payments: PaymentDb[]; milestones: MilestoneDb[]; events: EventDb[]; unread: number },
): ProjectDetail => ({
  ...toSummary(row, { payments: ctx.payments, milestones: ctx.milestones, unread: ctx.unread }),
  description: row.project_description,
  features: strings(row.features_needed),
  links: strings(row.inspiration_links),
  existingWebsite: row.existing_website,
  timeline: row.timeline,
  budget: row.budget,
  phone: row.phone,
  previewUrl: row.preview_url,
  revisionsIncluded: row.revisions_included,
  revisionsUsed: row.revisions_used,
  approvedAt: row.approved_at,
  initialPaidAt: row.initial_paid_at,
  finalPaidAt: row.final_paid_at,
  cancellationRequestedAt: row.cancellation_requested_at,
  cancelledAt: row.cancelled_at,
  refundedAmount: row.refunded_amount,
  milestones: [...ctx.milestones].sort((a, b) => a.position - b.position).map(toMilestone),
  payments: [...ctx.payments].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(toPaymentRow),
  events: ctx.events.map((e) => ({ id: e.id, kind: e.kind, title: e.title, actorRole: e.actor_role, createdAt: e.created_at })),
});

export type ListOpts = { stage?: string; q?: string; sort?: "recent" | "deadline" | "progress" | "balance" };

export const filterAndSort = (list: ProjectSummary[], opts: ListOpts = {}): ProjectSummary[] => {
  let out = list;
  if (opts.stage && opts.stage !== "all") {
    const wanted = opts.stage;
    out = wanted === "open" ? out.filter((p) => isOpenStage(p.stage)) : out.filter((p) => p.stage === normalizeStage(wanted));
  }
  const q = opts.q?.trim().toLowerCase();
  if (q) {
    out = out.filter((p) => [p.clientName, p.email, p.organization ?? "", p.package, p.websiteType ?? "", p.id].some((s) => s.toLowerCase().includes(q)));
  }
  const sorted = [...out];
  switch (opts.sort) {
    case "deadline":
      sorted.sort((a, b) => (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31"));
      break;
    case "progress":
      sorted.sort((a, b) => b.progress - a.progress);
      break;
    case "balance":
      sorted.sort((a, b) => (b.money.remaining ?? 0) - (a.money.remaining ?? 0));
      break;
    default:
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return sorted;
};

const monthKey = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`;

/** Shared by the live and demo paths so the dashboard math has one definition. */
export const buildOverview = (
  input: {
    projects: ProjectSummary[];
    payments: { type: string; status: string; amount: number; createdAt: string; paidAt: string | null }[];
    unread: number;
    activity: AdminOverview["activity"];
  },
  now: Date = new Date(),
): AdminOverview => {
  const today = dayKey(now); // same day basis as the overdue chip (isOverdue)
  const open = input.projects.filter((p) => isOpenStage(p.stage));

  const months: { key: string; month: string; collected: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({ key: monthKey(d), month: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }), collected: 0 });
  }
  for (const p of input.payments) {
    const isRefund = p.type === "refund";
    if (isRefund ? !countsAsRefund(p.status) : !countsAsPaid(p.status)) continue;
    const bucket = months.find((m) => m.key === monthKey(new Date(p.paidAt ?? p.createdAt)));
    if (bucket) bucket.collected += isRefund ? -p.amount : p.amount;
  }

  const newRequests = input.projects.filter((p) => p.stage === "requested").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    kpis: {
      activeProjects: open.length,
      newRequests: newRequests.length,
      collected: sumPaid(input.payments),
      outstanding: open
        .filter((p) => p.initialPayment === "paid" || p.stage === "accepted")
        .reduce((sum, p) => sum + (p.money.remaining ?? 0), 0),
      overdue: open.filter((p) => p.deadline != null && p.deadline < today).length,
      unread: input.unread,
    },
    revenueByMonth: months.map(({ month, collected }) => ({ month, collected: Math.max(0, collected) })),
    pipeline: projectStages.map((stage) => ({ stage, count: input.projects.filter((p) => p.stage === stage).length })),
    newRequests: newRequests.slice(0, 6),
    deadlines: open.filter((p) => p.deadline).sort((a, b) => (a.deadline as string).localeCompare(b.deadline as string)).slice(0, 6),
    activity: [...input.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
  };
};
