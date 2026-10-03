"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { VIEW_AS_COOKIE, demoMode, getPerspective, requireViewer } from "@/lib/auth/session";
import { assertProjectAccess, type ProjectAccess } from "./data";
import { isOpenStage, isUuid, otherSide, type Perspective } from "./mappers";
import { normalizeStage, projectStages, type ChecklistStatus, type MilestoneStatus, type ProjectStage, type Viewer } from "./types";
import { canGiveFeedback } from "./workflow";
import { CUSTOM_INTAKE_PREFIX, intakeTemplates } from "@/config/intake";
import { parsePackageId } from "@/config/inquiry";
import { MAX_UPLOAD_BYTES, UPLOAD_BUCKET, UPLOAD_TYPES, uploadErrors } from "@/config/uploads";
import { createAdminClient } from "@/utils/supabase/server";

type Fail = { ok: false; error: string };
type Done<T = object> = { ok: true } & T;
type Result<T = object> = Done<T> | Fail;

const fail = (error: string): Fail => ({ ok: false, error });
const GENERIC = "Something went wrong. Please try again.";
const DEMO = "Demo mode is read-only";
const PREVIEW = "Preview mode: switch back to your admin view to do this.";
const NOT_FOUND = "That project could not be found.";

type Ctx = { viewer: Viewer; perspective: Perspective; db: NonNullable<ReturnType<typeof createAdminClient>> };

/** Resolves the caller server-side. Never trusts a role or id sent from the browser. */
const begin = async (): Promise<Ctx | Fail> => {
  if (demoMode()) return fail(DEMO);
  const viewer = await requireViewer();
  const db = createAdminClient();
  if (!db) return fail("The portal is not available right now.");
  return { viewer, perspective: await getPerspective(viewer), db };
};

/** Admin-only actions also refuse while the admin is previewing the client view. */
const beginAdmin = async (): Promise<Ctx | Fail> => {
  const ctx = await begin();
  if ("ok" in ctx) return ctx;
  if (ctx.viewer.role !== "admin") return fail("You do not have permission to do that.");
  if (ctx.perspective !== "admin") return fail(PREVIEW);
  return ctx;
};

const revalidate = () => revalidatePath("/portal", "layout");

const cleanText = (v: unknown, min: number, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t =v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return t.length >= min && t.length <= max ? t : null;
};

const validDate = (v: unknown): string | null => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
};

const logEvent = async (db: Ctx["db"], projectId: string, kind: string, title: string, actor: "client" | "admin" | "system") => {
  await db.from("project_events").insert({ project_id: projectId, kind, title: title.slice(0, 200), actor_role: actor });
};

/** Access check that also returns a clean failure for missing or forbidden projects. */
const access = async (ctx: Ctx, projectId: string): Promise<ProjectAccess | Fail> => {
  const row = await assertProjectAccess(ctx.viewer, ctx.perspective, projectId);
  return row ?? fail(NOT_FOUND);
};
const isFail = (v: unknown): v is Fail => typeof v === "object" && v !== null && "ok" in v && (v as Fail).ok === false;

// ---------------------------------------------------------------- messages
export const sendMessage = async (projectId: string, body: string): Promise<Result<{ id: string }>> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.viewer.role === "admin" && ctx.perspective === "client") return fail(PREVIEW);
  const text = cleanText(body, 1, 4000);
  if (!text) return fail("Write a message between 1 and 4000 characters.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const { data, error } = await ctx.db.from("messages")
    .insert({ project_id: projectId, sender_id: ctx.viewer.userId, sender_role: ctx.perspective, body: text })
    .select("id").single<{ id: string }>();
  if (error || !data) return fail("Your message could not be sent. Please try again.");
  await ctx.db.from("project_requests").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
  revalidate();
  return { ok: true, id: data.id };
};

export const markMessagesRead = async (projectId: string): Promise<Result> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.viewer.role === "admin" && ctx.perspective === "client") return { ok: true }; // preview never marks anything read
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const { error } = await ctx.db.from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("project_id", projectId).eq("sender_role", otherSide(ctx.perspective)).is("read_at", null);
  if (error) return fail(GENERIC);
  revalidate();
  return { ok: true };
};

// ---------------------------------------------------------------- files
const FILE_TYPES = UPLOAD_TYPES;
const BUCKET = UPLOAD_BUCKET;
const ACCEPTED_MIME = new Set([...Object.values(FILE_TYPES), "application/x-zip-compressed", "application/octet-stream", ""]);

const safeFileName = (raw: string): { safe: string; display: string; ext: string } | null => {
  const base =(raw.split(/[\\/]/).pop() ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return null;
  const ext = base.slice(dot + 1).toLowerCase();
  if (!(ext in FILE_TYPES)) return null;
  const stem = base.slice(0, dot).replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^[._-]+/, "").slice(0, 80) || "file";
  return { safe: `${stem}.${ext}`, display: base.slice(0, 200), ext };
};

const UPLOAD_PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}-[A-Za-z0-9._-]{1,90}$/;

/**
 * Step 1 of an upload: checks access, name, type and size, then returns a one-time signed upload URL.
 * The browser sends the bytes straight to storage (real progress, no serverless body limit) and then
 * calls confirmUpload. Nothing is recorded until the confirm step finds the object.
 */
export const createUploadTicket = async (
  projectId: string,
  input: { name: string; size: number; type: string },
): Promise<Result<{ path: string; signedUrl: string; contentType: string }>> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.viewer.role === "admin" && ctx.perspective === "client") return fail(PREVIEW);
  const names = safeFileName(String(input?.name ?? ""));
  if (!names || !ACCEPTED_MIME.has(String(input?.type ?? ""))) return fail(uploadErrors.type);
  if (!Number.isInteger(input.size) || input.size <= 0) return fail(uploadErrors.empty);
  if (input.size > MAX_UPLOAD_BYTES) return fail(uploadErrors.size);
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const path = `${projectId}/${crypto.randomUUID()}-${names.safe}`;
  const { data, error } = await ctx.db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data?.signedUrl) return fail("The upload could not be started. Please try again.");
  return { ok: true, path, signedUrl: data.signedUrl, contentType: FILE_TYPES[names.ext] };
};

/** Step 2: verifies the uploaded object (path, size) and records it. Safe to call twice (path is unique). */
export const confirmUpload = async (projectId: string, path: string, name: string): Promise<Result<{ id: string }>> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.viewer.role === "admin" && ctx.perspective === "client") return fail(PREVIEW);
  const names = safeFileName(String(name ?? ""));
  if (typeof path !== "string" || !UPLOAD_PATH_RE.test(path) || !path.startsWith(`${projectId}/`) || !names || !path.endsWith(`-${names.safe}`)) {
    return fail("That upload could not be found.");
  }
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const [{ data: existing }, { data: info, error: infoErr }] = await Promise.all([
    ctx.db.from("project_files").select("id").eq("path", path).maybeSingle<{ id: string }>(),
    ctx.db.storage.from(BUCKET).info(path),
  ]);
  if (existing) return { ok: true, id: existing.id };
  const meta = info as { size?: number; metadata?: { size?: number } } | null;
  const size = Number(meta?.size ?? meta?.metadata?.size ?? NaN);
  if (infoErr || !Number.isFinite(size) || size <= 0) return fail("The upload did not finish. Please try again.");
  if (size > MAX_UPLOAD_BYTES) {
    await ctx.db.storage.from(BUCKET).remove([path]);
    return fail(uploadErrors.size);
  }
  const { data, error } = await ctx.db.from("project_files")
    .insert({
      project_id: projectId, uploader_id: ctx.viewer.userId, uploader_role: ctx.perspective, path,
      name: names.display, size_bytes: size, mime_type: FILE_TYPES[names.ext],
    })
    .select("id").single<{ id: string }>();
  if (error || !data) {
    await ctx.db.storage.from(BUCKET).remove([path]);
    return fail("The file could not be saved. Please try again.");
  }
  await logEvent(ctx.db, projectId, "file", `File added: ${names.display}`, ctx.perspective);
  revalidate();
  return { ok: true, id: data.id };
};

type FileRow = { id: string; project_id: string; path: string; name: string; uploader_id: string | null };
const loadFile = async (ctx: Ctx, fileId: string): Promise<FileRow | Fail> => {
  if (!isUuid(fileId)) return fail("That file could not be found.");
  const { data } = await ctx.db.from("project_files").select("id, project_id, path, name, uploader_id").eq("id", fileId).maybeSingle<FileRow>();
  if (!data) return fail("That file could not be found.");
  const project = await access(ctx, data.project_id);
  return isFail(project) ? fail("That file could not be found.") : data;
};

export const fileDownloadUrl = async (fileId: string): Promise<Result<{ url: string }>> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  const file = await loadFile(ctx, fileId);
  if (isFail(file)) return file;
  const { data, error } = await ctx.db.storage.from(BUCKET).createSignedUrl(file.path, 60, { download: file.name });
  if (error || !data?.signedUrl) return fail("The download link could not be created.");
  return { ok: true, url: data.signedUrl };
};

export const deleteFile = async (fileId: string): Promise<Result> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.viewer.role === "admin" && ctx.perspective === "client") return fail(PREVIEW);
  const file = await loadFile(ctx, fileId);
  if (isFail(file)) return file;
  const isAdmin = ctx.viewer.role === "admin" && ctx.perspective === "admin";
  if (!isAdmin && file.uploader_id !== ctx.viewer.userId) return fail("Only the uploader can delete this file.");
  await ctx.db.storage.from(BUCKET).remove([file.path]);
  const { error } = await ctx.db.from("project_files").delete().eq("id", file.id);
  if (error) return fail(GENERIC);
  await logEvent(ctx.db, file.project_id, "file", `File removed: ${file.name}`, ctx.perspective);
  revalidate();
  return { ok: true };
};

// ---------------------------------------------------------------- admin: notes and milestones
export const addNote = async (projectId: string, body: string): Promise<Result<{ id: string }>> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  const text = cleanText(body, 1, 4000);
  if (!text) return fail("Write a note between 1 and 4000 characters.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const { data, error } = await ctx.db.from("project_notes").insert({ project_id: projectId, body: text }).select("id").single<{ id: string }>();
  if (error || !data) return fail(GENERIC);
  revalidate();
  return { ok: true, id: data.id };
};

export const addMilestone = async (
  projectId: string,
  input: { title: string; detail?: string; dueDate?: string | null },
): Promise<Result<{ id: string }>> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  const title = cleanText(input?.title, 1, 120);
  if (!title) return fail("Give the milestone a title (up to 120 characters).");
  const detail = input.detail ? cleanText(input.detail, 1, 400) : null;
  if (input.detail && !detail) return fail("Details can be up to 400 characters.");
  const dueDate = input.dueDate ? validDate(input.dueDate) : null;
  if (input.dueDate && !dueDate) return fail("Use a valid due date.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const { data: last } = await ctx.db.from("milestones").select("position").eq("project_id", projectId).order("position", { ascending: false }).limit(1).maybeSingle<{ position: number }>();
  const { data, error } = await ctx.db.from("milestones")
    .insert({ project_id: projectId, title, detail, due_date: dueDate, position: (last?.position ?? -1) + 1 })
    .select("id").single<{ id: string }>();
  if (error || !data) return fail(GENERIC);
  await logEvent(ctx.db, projectId, "milestone", `Milestone added: ${title}`, "admin");
  revalidate();
  return { ok: true, id: data.id };
};

const loadMilestone = async (ctx: Ctx, milestoneId: string) => {
  if (!isUuid(milestoneId)) return null;
  const { data } = await ctx.db.from("milestones").select("id, project_id, title").eq("id", milestoneId).maybeSingle<{ id: string; project_id: string; title: string }>();
  return data;
};

export const setMilestoneStatus = async (milestoneId: string, status: MilestoneStatus): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  if (!["pending", "active", "done"].includes(status)) return fail("Unknown milestone status.");
  const m = await loadMilestone(ctx, milestoneId);
  if (!m) return fail("That milestone could not be found.");
  const { error } = await ctx.db.from("milestones")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null }).eq("id", m.id);
  if (error) return fail(GENERIC);
  if (status === "done") await logEvent(ctx.db, m.project_id, "milestone", `Milestone done: ${m.title}`, "admin");
  revalidate();
  return { ok: true };
};

export const deleteMilestone = async (milestoneId: string): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  const m = await loadMilestone(ctx, milestoneId);
  if (!m) return fail("That milestone could not be found.");
  const { error } = await ctx.db.from("milestones").delete().eq("id", m.id);
  if (error) return fail(GENERIC);
  revalidate();
  return { ok: true };
};

// ---------------------------------------------------------------- admin: project controls
const ALL_STAGES: readonly string[] = [...projectStages, "cancelled"];
const stageEventTitle: Record<string, string> = {
  requested: "Moved to Requested", accepted: "Project accepted", building: "Build started", client_review: "Ready for your review",
  revisions: "Revisions in progress", awaiting_final_payment: "Awaiting final payment", ready_for_launch: "Ready to launch",
  completed: "Project completed", cancelled: "Project cancelled",
};

/** Changes the stage label only. This action never charges or refunds anything. */
export const setStage = async (projectId: string, stage: ProjectStage): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  if (!ALL_STAGES.includes(stage)) return fail("Unknown stage.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  if (stage === "ready_for_launch" || stage === "completed") {
    const paidUp = project.remaining_amount === 0 || (project.remaining_amount == null && project.final_payment_status === "not_required");
    if (!paidUp) return fail("The remaining balance must be paid before this stage. Collect the final payment first.");
  }
  const patch: Record<string, unknown> = { status: stage };
  if (stage === "cancelled") patch.cancelled_at = new Date().toISOString();
  const { error } = await ctx.db.from("project_requests").update(patch).eq("id", projectId);
  if (error) return fail(GENERIC);
  await logEvent(ctx.db, projectId, "stage", stageEventTitle[stage] ?? "Stage updated", "admin");
  revalidate();
  return { ok: true };
};

export const setDeadline = async (projectId: string, isoDate: string | null): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  const date = isoDate === null ? null : validDate(isoDate);
  if (isoDate !== null && !date) return fail("Use a valid date.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const { error } = await ctx.db.from("project_requests").update({ deadline: date }).eq("id", projectId);
  if (error) return fail(GENERIC);
  await logEvent(ctx.db, projectId, "deadline", date ? "Deadline updated" : "Deadline cleared", "admin");
  revalidate();
  return { ok: true };
};

export const setPreviewUrl = async (projectId: string, url: string | null): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  let value: string | null = null;
  if (url !== null && url.trim() !== "") {
    const raw = url.trim();
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return fail("Enter a full link that starts with https://");
    }
    if (parsed.protocol !== "https:" || raw.length > 500) return fail("The preview link must start with https:// and be under 500 characters.");
    value = parsed.toString();
  }
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const { error } = await ctx.db.from("project_requests").update({ preview_url: value }).eq("id", projectId);
  if (error) return fail(GENERIC);
  if (value) await logEvent(ctx.db, projectId, "preview", "Preview link shared", "admin");
  revalidate();
  return { ok: true };
};

export const setRevisions = async (projectId: string, input: { included?: number; used?: number }): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  const patch: Record<string, number> = {};
  for (const [key, col] of [["included", "revisions_included"], ["used", "revisions_used"]] as const) {
    const v = input?.[key];
    if (v === undefined) continue;
    if (!Number.isInteger(v) || v < 0 || v > 99) return fail("Revisions must be a whole number from 0 to 99.");
    patch[col] = v;
  }
  if (Object.keys(patch).length === 0) return fail("Nothing to update.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const { error } = await ctx.db.from("project_requests").update(patch).eq("id", projectId);
  if (error) return fail(GENERIC);
  await logEvent(ctx.db, projectId, "revision", "Revisions updated", "admin");
  revalidate();
  return { ok: true };
};

/** Records the client's approval. It never charges anything: collecting the balance is a separate admin action. */
export const approveFinalVersion = async (projectId: string): Promise<Result> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.perspective !== "client" || ctx.viewer.role === "admin") return fail("Only the project owner can approve the final version.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  if (project.approved_at) return { ok: true };
  const { error } = await ctx.db.from("project_requests").update({ approved_at: new Date().toISOString() }).eq("id", projectId).is("approved_at", null);
  if (error) return fail(GENERIC);
  await logEvent(ctx.db, projectId, "approval", "Final version approved", "client");
  revalidate();
  return { ok: true };
};

// ---------------------------------------------------------------- account
/** Toggles the admin's "view as client" preview. Works in demo mode too (it changes no data). */
export const setViewAs = async (on: boolean): Promise<Result> => {
  const viewer = await requireViewer();
  if (viewer.role !== "admin") return fail("You do not have permission to do that.");
  const jar = await cookies();
  if (on === true) jar.set(VIEW_AS_COOKIE, "client", { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  else jar.delete(VIEW_AS_COOKIE);
  revalidate();
  return { ok: true };
};

export const updateFullName = async (name: string): Promise<Result> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  const value = cleanText(name, 1, 100);
  if (!value) return fail("Enter your name (up to 100 characters).");
  const { error } = await ctx.db.from("profiles").update({ full_name: value }).eq("id", ctx.viewer.userId);
  if (error) return fail(GENERIC);
  revalidate();
  return { ok: true };
};

export const linkProjectToUser = async (projectId: string, email: string): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  const normalized = cleanText(email, 3, 254)?.toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return fail("Enter a valid email address.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const { data: profile } = await ctx.db.from("profiles").select("id").eq("email", normalized).limit(1).maybeSingle<{ id: string }>();
  if (!profile) return fail("No account exists with that email yet. Ask them to sign up first.");
  const { error } = await ctx.db.from("project_requests").update({ user_id: profile.id }).eq("id", projectId);
  if (error) return fail(GENERIC);
  await logEvent(ctx.db, projectId, "account", "Project linked to a client account", "admin");
  revalidate();
  return { ok: true };
};

// ---------------------------------------------------------------- preview feedback
const CLIENT_ONLY = "Only the client can do this.";
const FEEDBACK_CLOSED = "Feedback is open while a preview is ready for your review.";

/** Clients act for themselves; an admin previewing the client view is refused like every other write. */
const beginClient = async (): Promise<Ctx | Fail> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.viewer.role === "admin") return fail(ctx.perspective === "client" ? PREVIEW : CLIENT_ONLY);
  return ctx;
};

const feedbackOpen = (p: ProjectAccess) =>
  canGiveFeedback({ stage: normalizeStage(p.status), previewUrl: p.preview_url, approvedAt: p.approved_at });

/** A file id is only accepted when the file belongs to the same project. */
const fileInProject = async (ctx: Ctx, projectId: string, fileId: unknown): Promise<string | null | Fail> => {
  if (fileId == null || fileId === "") return null;
  if (!isUuid(fileId)) return fail("That file could not be found.");
  const { data } = await ctx.db.from("project_files").select("id").eq("id", fileId).eq("project_id", projectId).maybeSingle<{ id: string }>();
  return data ? data.id : fail("That file could not be found.");
};

/** The project's draft round, created on first use. A unique index keeps it to one draft per project. */
const draftRoundId = async (ctx: Ctx, projectId: string): Promise<string | null> => {
  const find = () => ctx.db.from("feedback_rounds").select("id").eq("project_id", projectId).eq("status", "draft").maybeSingle<{ id: string }>();
  const { data: found } = await find();
  if (found) return found.id;
  const { data: last } = await ctx.db.from("feedback_rounds").select("number").eq("project_id", projectId).order("number", { ascending: false }).limit(1).maybeSingle<{ number: number }>();
  const { data, error } = await ctx.db.from("feedback_rounds").insert({ project_id: projectId, number: (last?.number ?? 0) + 1 }).select("id").single<{ id: string }>();
  if (data) return data.id;
  if (error?.code === "23505") return (await find()).data?.id ?? null; // a parallel call created it first
  return null;
};

export const addFeedback = async (projectId: string, input: { page?: string; body: string; fileId?: string | null }): Promise<Result<{ id: string }>> => {
  const ctx = await beginClient();
  if (isFail(ctx)) return ctx;
  const body = cleanText(input?.body, 1, 2000);
  if (!body) return fail("Write a comment between 1 and 2000 characters.");
  const page = input.page ? cleanText(input.page, 1, 120) : null;
  if (input.page && !page) return fail("Keep the page or section name under 120 characters.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  if (!feedbackOpen(project)) return fail(FEEDBACK_CLOSED);
  const [{ data: busy }, fileId] = await Promise.all([
    ctx.db.from("feedback_rounds").select("id").eq("project_id", projectId).eq("status", "submitted").limit(1).maybeSingle(),
    fileInProject(ctx, projectId, input.fileId),
  ]);
  if (busy) return fail("The studio is still working on your last round. You can add comments once it is done.");
  if (isFail(fileId)) return fileId;
  const roundId = await draftRoundId(ctx, projectId);
  if (!roundId) return fail(GENERIC);
  const { data, error } = await ctx.db.from("feedback_items")
    .insert({ project_id: projectId, round_id: roundId, page, body, file_id: fileId })
    .select("id").single<{ id: string }>();
  if (error || !data) return fail("Your comment could not be saved. Please try again.");
  revalidate();
  return { ok: true, id: data.id };
};

export const deleteFeedback = async (itemId: string): Promise<Result> => {
  const ctx = await beginClient();
  if (isFail(ctx)) return ctx;
  if (!isUuid(itemId)) return fail("That comment could not be found.");
  const { data: item } = await ctx.db.from("feedback_items")
    .select("id, project_id, feedback_rounds!inner(status)").eq("id", itemId)
    .maybeSingle<{ id: string; project_id: string; feedback_rounds: { status: string } }>();
  if (!item) return fail("That comment could not be found.");
  const project = await access(ctx, item.project_id);
  if (isFail(project)) return project;
  if (item.feedback_rounds.status !== "draft") return fail("Sent comments can't be removed. Message the studio instead.");
  const { error } = await ctx.db.from("feedback_items").delete().eq("id", item.id);
  if (error) return fail(GENERIC);
  revalidate();
  return { ok: true };
};

/** Sends the draft round: uses one revision (atomically, in SQL) and moves a project in review into revisions. */
export const submitFeedback = async (projectId: string): Promise<Result<{ number: number; extra: boolean }>> => {
  const ctx = await beginClient();
  if (isFail(ctx)) return ctx;
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  if (!feedbackOpen(project)) return fail(FEEDBACK_CLOSED);
  const { data, error } = await ctx.db.rpc("submit_feedback_round", { p_project_id: projectId });
  if (error) return fail(GENERIC);
  const sent = ((data ?? []) as { round_number: number; is_extra: boolean }[])[0];
  if (!sent) return fail("Add at least one comment before sending.");
  await logEvent(ctx.db, projectId, "feedback", `Feedback round ${sent.round_number} sent${sent.is_extra ? " (beyond included revisions)" : ""}`, "client");
  revalidate();
  return { ok: true, number: sent.round_number, extra: sent.is_extra };
};

export const setFeedbackItemStatus = async (itemId: string, status: "open" | "done"): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  if (!isUuid(itemId) || (status !== "open" && status !== "done")) return fail("That comment could not be found.");
  const { data: item } = await ctx.db.from("feedback_items").select("id, project_id").eq("id", itemId).maybeSingle<{ id: string; project_id: string }>();
  if (!item) return fail("That comment could not be found.");
  const { error } = await ctx.db.from("feedback_items").update({ status }).eq("id", item.id);
  if (error) return fail(GENERIC);
  revalidate();
  return { ok: true };
};

/** Marks a round addressed. A project in revisions goes back to review so the client is asked to look again. */
export const resolveFeedbackRound = async (roundId: string): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  if (!isUuid(roundId)) return fail("That round could not be found.");
  const { data: round } = await ctx.db.from("feedback_rounds").select("id, project_id, number, status").eq("id", roundId)
    .maybeSingle<{ id: string; project_id: string; number: number; status: string }>();
  if (!round || round.status !== "submitted") return fail("Only a sent round can be marked addressed.");
  const project = await access(ctx, round.project_id);
  if (isFail(project)) return project;
  const { data: resolved, error } = await ctx.db.rpc("resolve_feedback_round", { p_round_id: round.id });
  if (error) return fail(GENERIC);
  if (!resolved) return { ok: true }; // a parallel click already resolved it
  await logEvent(ctx.db, round.project_id, "feedback", `Feedback round ${round.number} addressed`, "admin");
  revalidate();
  return { ok: true };
};

// ---------------------------------------------------------------- content checklist
const CHECKLIST_STATUSES: readonly ChecklistStatus[] = ["needed", "provided", "skipped"];

export const updateChecklistItem = async (
  projectId: string,
  key: string,
  input: { status: ChecklistStatus; answer?: string | null; fileId?: string | null },
): Promise<Result> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.viewer.role === "admin" && ctx.perspective === "client") return fail(PREVIEW);
  if (typeof key !== "string" || key.length > 60 || !CHECKLIST_STATUSES.includes(input?.status)) return fail("That item could not be found.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const template = intakeTemplates[parsePackageId(project.package) ?? "custom"].find((t) => t.key === key);
  let label = template?.label;
  if (!template) {
    if (!key.startsWith(CUSTOM_INTAKE_PREFIX)) return fail("That item could not be found.");
    const { data: row } = await ctx.db.from("checklist_items").select("label").eq("project_id", projectId).eq("key", key).maybeSingle<{ label: string | null }>();
    if (!row) return fail("That item could not be found.");
    label = row.label ?? "Requested item";
  }
  if (input.status === "skipped" && ctx.perspective !== "admin" && !template?.optional) {
    return fail("Only optional items can be skipped. Message the studio if this one does not apply.");
  }
  let answer: string | null = null;
  if (input.answer != null && input.answer !== "") {
    answer = cleanText(input.answer, 1, 300);
    if (!answer || (template?.options && !template.options.includes(answer))) return fail("Choose one of the options.");
  }
  const fileId = await fileInProject(ctx, projectId, input.fileId);
  if (isFail(fileId)) return fileId;
  const patch: Record<string, unknown> = { project_id: projectId, key, status: input.status, updated_at: new Date().toISOString() };
  if (input.answer !== undefined) patch.answer = answer;
  if (input.fileId !== undefined) patch.file_id = fileId;
  const { error } = await ctx.db.from("checklist_items").upsert(patch, { onConflict: "project_id,key" });
  if (error) return fail(GENERIC);
  if (input.status === "provided") await logEvent(ctx.db, projectId, "checklist", `Sent: ${label}`, ctx.perspective);
  revalidate();
  return { ok: true };
};

export const addChecklistItem = async (projectId: string, label: string): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  const text = cleanText(label, 1, 120);
  if (!text) return fail("Describe what you need in up to 120 characters.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const key = `${CUSTOM_INTAKE_PREFIX}${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await ctx.db.from("checklist_items").insert({ project_id: projectId, key, label: text });
  if (error) return fail(GENERIC);
  await logEvent(ctx.db, projectId, "checklist", `Studio asked for: ${text}`, "admin");
  revalidate();
  return { ok: true };
};

export const removeChecklistItem = async (projectId: string, key: string): Promise<Result> => {
  const ctx = await beginAdmin();
  if (isFail(ctx)) return ctx;
  if (typeof key !== "string" || !key.startsWith(CUSTOM_INTAKE_PREFIX)) return fail("Only items the studio added can be removed.");
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const { error } = await ctx.db.from("checklist_items").delete().eq("project_id", projectId).eq("key", key);
  if (error) return fail(GENERIC);
  revalidate();
  return { ok: true };
};

// ---------------------------------------------------------------- account deletion
/**
 * Deletes the client's sign-in, profile, messages and files. Projects that never took money are removed
 * entirely; paid projects keep their record (amounts and dates) for accounting, unlinked from the account.
 * Refused while a paid project is still open, so nobody deletes their way out of work in progress.
 */
export const deleteAccount = async (confirmText: string): Promise<Result> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.viewer.role === "admin") return fail("Studio admin accounts can't be deleted from the portal.");
  if (typeof confirmText !== "string" || confirmText.trim() !== "DELETE") return fail("Type DELETE to confirm.");
  const { data: projects, error: listErr } = await ctx.db.from("project_requests")
    .select("id, status, initial_payment_status").eq("user_id", ctx.viewer.userId)
    .returns<{ id: string; status: string; initial_payment_status: string }[]>();
  if (listErr) return fail(GENERIC);
  const owned = projects ?? [];
  const paid = (p: { initial_payment_status: string }) => p.initial_payment_status === "paid" || p.initial_payment_status === "processing";
  if (owned.some((p) => paid(p) && isOpenStage(normalizeStage(p.status)))) {
    return fail("You have a project in progress. Message the studio to wrap it up before deleting your account.");
  }
  const ids = owned.map((p) => p.id);
  if (ids.length > 0) {
    const { data: files } = await ctx.db.from("project_files").select("path").in("project_id", ids).returns<{ path: string }[]>();
    const paths = (files ?? []).map((f) => f.path);
    for (let i = 0; i < paths.length; i += 100) await ctx.db.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    await ctx.db.from("project_files").delete().in("project_id", ids);
    await ctx.db.from("messages").delete().in("project_id", ids);
    const unpaid = owned.filter((p) => !paid(p)).map((p) => p.id);
    if (unpaid.length > 0) {
      const { data: ledger } = await ctx.db.from("payments").select("project_id").in("project_id", unpaid).returns<{ project_id: string }[]>();
      const withLedger = new Set((ledger ?? []).map((l) => l.project_id));
      const removable = unpaid.filter((id) => !withLedger.has(id));
      if (removable.length > 0) await ctx.db.from("project_requests").delete().in("id", removable);
    }
  }
  const { error } = await ctx.db.auth.admin.deleteUser(ctx.viewer.userId);
  if (error) return fail("Your account could not be deleted. Please try again or message the studio.");
  return { ok: true };
};
