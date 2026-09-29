import "server-only";
import { demoMode } from "@/lib/auth/session";
import { createAdminClient } from "@/utils/supabase/server";
import {
  PROJECT_COLUMNS, buildOverview, filterAndSort, isUuid, otherSide, toDetail, toFile, toMessage, toPaymentRow, toSummary,
  type EventDb, type FileDb, type ListOpts, type MessageDb, type MilestoneDb, type Perspective, type PaymentDb, type ProjectRow,
} from "./mappers";
import type { AdminOverview, Message, PaymentRow, ProjectDetail, ProjectFile, ProjectNote, ProjectSummary, Viewer } from "./types";

/**
 * Portal reads. Every function re-checks access in code with the service-role client: admins see all
 * rows, clients only rows whose user_id is the viewer. Ids from the browser are never trusted, and
 * internal_notes, stripe ids and payment method ids are never selected.
 */
const loadDemo = () => import("./demo");

const db = () => {
  const client = createAdminClient();
  if (!client) throw new Error("Portal storage is not configured");
  return client;
};

/** Awaits a Supabase query and returns its rows. Failures throw a generic error (no DB text leaks). */
const rowsOf = async <T>(query: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> => {
  const { data, error } = await query;
  if (error) throw new Error("Portal data is unavailable");
  return (data ?? []) as T[];
};

const authorize = (viewer: Viewer, perspective: Perspective) => {
  if (perspective === "admin" && viewer.role !== "admin") throw new Error("Not authorized");
};

const requireAdminViewer = (viewer: Viewer) => {
  if (viewer.role !== "admin") throw new Error("Not authorized");
};

type Batches = { payments: PaymentDb[]; milestones: Pick<MilestoneDb, "project_id" | "status">[]; unread: Map<string, number> };

const PAYMENT_COLUMNS = "id, project_id, type, status, amount, currency, created_at, paid_at";

/** One query per table for a whole list (no N+1). Admins fetch unfiltered, clients by their project ids. */
const fetchBatches = async (projectIds: string[], perspective: Perspective): Promise<Batches> => {
  if (perspective === "client" && projectIds.length === 0) return { payments: [], milestones: [], unread: new Map() };
  const client = db();
  const scope = <Q extends { in: (col: string, vals: string[]) => Q }>(q: Q) => (perspective === "admin" ? q : q.in("project_id", projectIds));
  const [payments, milestones, unreadRows] = await Promise.all([
    rowsOf<PaymentDb>(scope(client.from("payments").select(PAYMENT_COLUMNS).limit(5000))),
    rowsOf<Pick<MilestoneDb, "project_id" | "status">>(scope(client.from("milestones").select("project_id, status").limit(5000))),
    rowsOf<{ project_id: string }>(
      scope(client.from("messages").select("project_id").is("read_at", null).eq("sender_role", otherSide(perspective)).limit(5000)),
    ),
  ]);
  const unread = new Map<string, number>();
  for (const m of unreadRows) unread.set(m.project_id, (unread.get(m.project_id) ?? 0) + 1);
  return { payments, milestones, unread };
};

const group = <T extends { project_id: string }>(items: T[]) => {
  const map = new Map<string, T[]>();
  for (const item of items) map.set(item.project_id, [...(map.get(item.project_id) ?? []), item]);
  return map;
};

const fetchProjectRows = async (viewer: Viewer, perspective: Perspective): Promise<ProjectRow[]> => {
  let query = db().from("project_requests").select(PROJECT_COLUMNS).order("created_at", { ascending: false }).limit(500);
  if (perspective === "client") query = query.eq("user_id", viewer.userId);
  const found = await rowsOf<ProjectRow>(query);
  // Belt and braces: enforce ownership in code as well as in the query.
  return perspective === "client" ? found.filter((r) => r.user_id === viewer.userId) : found;
};

const summarize = async (project: ProjectRow[], perspective: Perspective): Promise<ProjectSummary[]> => {
  const b = await fetchBatches(project.map((r) => r.id), perspective);
  const pay = group(b.payments);
  const mil = group(b.milestones);
  return project.map((r) => toSummary(r, { payments: pay.get(r.id) ?? [], milestones: mil.get(r.id) ?? [], unread: b.unread.get(r.id) ?? 0 }));
};

export type ProjectAccess = {
  id: string; user_id: string | null; status: string; remaining_amount: number | null; total_amount: number | null;
  initial_payment_status: string; final_payment_status: string; client_name: string; email: string; package: string; approved_at: string | null;
};

/** Returns the project's minimal access row when the viewer may see it in this perspective, else null. */
export const assertProjectAccess = async (viewer: Viewer, perspective: Perspective, projectId: string): Promise<ProjectAccess | null> => {
  if (!isUuid(projectId)) return null;
  authorize(viewer, perspective);
  const [row] = await rowsOf<ProjectAccess>(
    db().from("project_requests")
      .select("id, user_id, status, remaining_amount, total_amount, initial_payment_status, final_payment_status, client_name, email, package, approved_at")
      .eq("id", projectId).limit(1),
  );
  if (!row) return null;
  if (perspective === "client" && row.user_id !== viewer.userId) return null;
  return row;
};

export const listProjects = async (viewer: Viewer, perspective: Perspective, opts?: ListOpts): Promise<ProjectSummary[]> => {
  authorize(viewer, perspective);
  if (demoMode()) return (await loadDemo()).demoListProjects(perspective, opts);
  return filterAndSort(await summarize(await fetchProjectRows(viewer, perspective), perspective), opts);
};

export const getProject = async (viewer: Viewer, perspective: Perspective, id: string): Promise<ProjectDetail | null> => {
  authorize(viewer, perspective);
  if (!isUuid(id)) return null;
  if (demoMode()) return (await loadDemo()).demoGetProject(perspective, id);
  const client = db();
  const [row] = await rowsOf<ProjectRow>(client.from("project_requests").select(PROJECT_COLUMNS).eq("id", id).limit(1));
  if (!row || (perspective === "client" && row.user_id !== viewer.userId)) return null;
  const [payments, milestones, events, unread] = await Promise.all([
    rowsOf<PaymentDb>(client.from("payments").select(PAYMENT_COLUMNS).eq("project_id", id).order("created_at", { ascending: false })),
    rowsOf<MilestoneDb>(client.from("milestones").select("id, project_id, title, detail, position, status, due_date, completed_at").eq("project_id", id).order("position")),
    rowsOf<EventDb>(client.from("project_events").select("id, project_id, kind, title, actor_role, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(50)),
    rowsOf<{ id: string }>(client.from("messages").select("id").eq("project_id", id).is("read_at", null).eq("sender_role", otherSide(perspective))),
  ]);
  return toDetail(row, { payments, milestones, events, unread: unread.length });
};

export const getAdminOverview = async (viewer: Viewer): Promise<AdminOverview> => {
  requireAdminViewer(viewer);
  if (demoMode()) return (await loadDemo()).demoOverview();
  const client = db();
  const rows = await fetchProjectRows(viewer, "admin");
  const projects = await summarize(rows, "admin");
  const [payments, unread, events] = await Promise.all([
    rowsOf<PaymentDb>(client.from("payments").select(PAYMENT_COLUMNS).limit(5000)),
    rowsOf<{ id: string }>(client.from("messages").select("id").is("read_at", null).eq("sender_role", "client").limit(5000)),
    rowsOf<EventDb>(client.from("project_events").select("id, project_id, kind, title, actor_role, created_at").order("created_at", { ascending: false }).limit(20)),
  ]);
  const nameOf = new Map(rows.map((r) => [r.id, r.client_name]));
  return buildOverview({
    projects,
    payments: payments.map((p) => ({ type: p.type, status: p.status, amount: p.amount, createdAt: p.created_at, paidAt: p.paid_at })),
    unread: unread.length,
    activity: events.map((e) => ({ id: e.id, projectId: e.project_id, clientName: nameOf.get(e.project_id) ?? "", title: e.title, createdAt: e.created_at })),
  });
};

export const listMessages = async (viewer: Viewer, perspective: Perspective, projectId: string): Promise<Message[]> => {
  authorize(viewer, perspective);
  if (!isUuid(projectId)) return [];
  if (demoMode()) return (await loadDemo()).demoMessages(perspective, projectId);
  if (!(await assertProjectAccess(viewer, perspective, projectId))) return [];
  const found = await rowsOf<MessageDb>(
    db().from("messages").select("id, project_id, sender_role, body, created_at, read_at").eq("project_id", projectId).order("created_at", { ascending: true }).limit(1000),
  );
  return found.map((m) => toMessage(m, perspective));
};

export const listInbox = async (viewer: Viewer, perspective: Perspective): Promise<{ project: ProjectSummary; last: Message | null }[]> => {
  authorize(viewer, perspective);
  if (demoMode()) return (await loadDemo()).demoInbox(perspective);
  const rows = await fetchProjectRows(viewer, perspective);
  const projects = await summarize(rows, perspective);
  if (rows.length === 0) return [];
  let query = db().from("messages").select("id, project_id, sender_role, body, created_at, read_at").order("created_at", { ascending: false }).limit(2000);
  if (perspective === "client") query = query.in("project_id", rows.map((r) => r.id));
  const latest = new Map<string, MessageDb>();
  for (const m of await rowsOf<MessageDb>(query)) if (!latest.has(m.project_id)) latest.set(m.project_id, m);
  return projects
    .map((project) => {
      const m = latest.get(project.id);
      return { project, last: m ? toMessage(m, perspective) : null };
    })
    .sort((a, b) => (b.last?.createdAt ?? b.project.updatedAt).localeCompare(a.last?.createdAt ?? a.project.updatedAt));
};

export const listFiles = async (viewer: Viewer, perspective: Perspective, projectId: string): Promise<ProjectFile[]> => {
  authorize(viewer, perspective);
  if (!isUuid(projectId)) return [];
  if (demoMode()) return (await loadDemo()).demoFiles(perspective, projectId);
  if (!(await assertProjectAccess(viewer, perspective, projectId))) return [];
  const found = await rowsOf<FileDb>(
    db().from("project_files").select("id, project_id, name, size_bytes, mime_type, uploader_role, created_at").eq("project_id", projectId).order("created_at", { ascending: false }),
  );
  return found.map(toFile);
};

export const listNotes = async (viewer: Viewer, projectId: string): Promise<ProjectNote[]> => {
  requireAdminViewer(viewer);
  if (!isUuid(projectId)) return [];
  if (demoMode()) return (await loadDemo()).demoNotes(projectId);
  const found = await rowsOf<{ id: string; body: string; created_at: string }>(
    db().from("project_notes").select("id, body, created_at").eq("project_id", projectId).order("created_at", { ascending: false }),
  );
  return found.map((n) => ({ id: n.id, body: n.body, createdAt: n.created_at }));
};

export const listPayments = async (
  viewer: Viewer,
  perspective: Perspective,
): Promise<(PaymentRow & { projectId: string; clientName: string; packageId: string })[]> => {
  authorize(viewer, perspective);
  if (demoMode()) return (await loadDemo()).demoPayments(perspective);
  const rows = await fetchProjectRows(viewer, perspective);
  if (rows.length === 0) return [];
  let query = db().from("payments").select(PAYMENT_COLUMNS).order("created_at", { ascending: false }).limit(2000);
  if (perspective === "client") query = query.in("project_id", rows.map((r) => r.id));
  const byId = new Map(rows.map((r) => [r.id, r]));
  return (await rowsOf<PaymentDb>(query))
    .filter((p) => byId.has(p.project_id))
    .map((p) => {
      const r = byId.get(p.project_id) as ProjectRow;
      return { ...toPaymentRow(p), projectId: p.project_id, clientName: r.client_name, packageId: r.package };
    });
};
