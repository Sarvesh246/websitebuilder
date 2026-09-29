/** Shared portal contracts. Money is always integer cents. Server code returns these DTOs; never raw rows. */
export const projectStages = [
  "requested", "accepted", "building", "client_review", "revisions", "awaiting_final_payment", "ready_for_launch", "completed",
] as const;
export type ProjectStage = (typeof projectStages)[number] | "cancelled";

/** Legacy statuses written by the Stage-5 intake map onto the workflow. */
export const normalizeStage = (status: string): ProjectStage => {
  const legacy: Record<string, ProjectStage> = {
    new: "requested", contacted: "requested", awaiting_payment: "accepted", paid: "accepted",
    in_progress: "building", awaiting_client: "client_review", review: "client_review",
  };
  return (legacy[status] ?? status) as ProjectStage;
};

export const stageLabel: Record<ProjectStage, string> = {
  requested: "Requested", accepted: "Accepted", building: "Building", client_review: "In review", revisions: "Revisions",
  awaiting_final_payment: "Final payment", ready_for_launch: "Ready to launch", completed: "Completed", cancelled: "Cancelled",
};

/** Coarse progress used when a project has no milestones yet. */
export const stageProgress: Record<ProjectStage, number> = {
  requested: 5, accepted: 15, building: 45, client_review: 65, revisions: 78, awaiting_final_payment: 90,
  ready_for_launch: 96, completed: 100, cancelled: 0,
};

export type MilestoneStatus = "pending" | "active" | "done";
export type Milestone = { id: string; title: string; detail: string | null; position: number; status: MilestoneStatus; dueDate: string | null; completedAt: string | null };

export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "requires_action" | "cancelled" | "refunded" | "partially_refunded";
export type PaymentRow = { id: string; type: "full" | "deposit" | "final_balance" | "refund"; status: PaymentStatus; amount: number; currency: string; createdAt: string; paidAt: string | null };

export type Money = { total: number | null; deposit: number | null; remaining: number | null; paid: number; currency: string };

export type ProjectSummary = {
  id: string;
  clientName: string;
  email: string;
  organization: string | null;
  package: "launch" | "presence" | "business" | "custom";
  websiteType: string | null;
  stage: ProjectStage;
  progress: number; // 0-100
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  money: Money;
  initialPayment: "pending" | "processing" | "paid" | "failed" | "cancelled";
  finalPayment: "pending" | "processing" | "paid" | "failed" | "requires_action" | "not_required";
  unreadMessages: number; // unread from the OTHER side, relative to the viewer
  hasAccount: boolean;
};

export type ProjectDetail = ProjectSummary & {
  description: string | null;
  features: string[];
  links: string[];
  existingWebsite: string | null;
  timeline: string | null;
  budget: string | null;
  phone: string | null;
  previewUrl: string | null;
  revisionsIncluded: number;
  revisionsUsed: number;
  approvedAt: string | null;
  initialPaidAt: string | null;
  finalPaidAt: string | null;
  cancellationRequestedAt: string | null;
  cancelledAt: string | null;
  refundedAmount: number;
  milestones: Milestone[];
  payments: PaymentRow[];
  events: { id: string; kind: string; title: string; actorRole: "client" | "admin" | "system" | null; createdAt: string }[];
};

export type Message = { id: string; projectId: string; senderRole: "client" | "admin"; body: string; createdAt: string; readAt: string | null; mine: boolean };
export type ProjectFile = { id: string; projectId: string; name: string; sizeBytes: number; mimeType: string | null; uploaderRole: "client" | "admin"; createdAt: string };
export type ProjectNote = { id: string; body: string; createdAt: string };

export type AdminOverview = {
  kpis: { activeProjects: number; newRequests: number; collected: number; outstanding: number; overdue: number; unread: number };
  revenueByMonth: { month: string; collected: number }[]; // last 6 months, oldest first, cents
  pipeline: { stage: ProjectStage; count: number }[];
  newRequests: ProjectSummary[];
  deadlines: ProjectSummary[]; // soonest first, open projects with a deadline
  activity: { id: string; projectId: string; clientName: string; title: string; createdAt: string }[];
};

export type Viewer = { userId: string; email: string; fullName: string | null; role: "client" | "admin" };
