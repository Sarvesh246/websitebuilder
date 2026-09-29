"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { VIEW_AS_COOKIE, demoMode, getPerspective, requireViewer } from "@/lib/auth/session";
import { assertProjectAccess, type ProjectAccess } from "./data";
import { isUuid, otherSide, type Perspective } from "./mappers";
import { projectStages, type MilestoneStatus, type ProjectStage, type Viewer } from "./types";
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
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const FILE_TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", pdf: "application/pdf",
  zip: "application/zip", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", txt: "text/plain",
};
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

export const uploadFile = async (projectId: string, formData: FormData): Promise<Result<{ id: string }>> => {
  const ctx = await begin();
  if (isFail(ctx)) return ctx;
  if (ctx.viewer.role === "admin" && ctx.perspective === "client") return fail(PREVIEW);
  const project = await access(ctx, projectId);
  if (isFail(project)) return project;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Choose a file to upload.");
  if (file.size > MAX_FILE_BYTES) return fail("That file is larger than 25 MB.");
  const names = safeFileName(file.name);
  if (!names || !ACCEPTED_MIME.has(file.type)) return fail("That file type is not supported. Use images, PDF, ZIP, DOCX or TXT.");
  const path = `${projectId}/${crypto.randomUUID()}-${names.safe}`;
  const { error: upErr } = await ctx.db.storage.from("project-files")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: FILE_TYPES[names.ext], upsert: false });
  if (upErr) return fail("The file could not be uploaded. Please try again.");
  const { data, error } = await ctx.db.from("project_files")
    .insert({
      project_id: projectId, uploader_id: ctx.viewer.userId, uploader_role: ctx.perspective, path,
      name: names.display, size_bytes: file.size, mime_type: FILE_TYPES[names.ext],
    })
    .select("id").single<{ id: string }>();
  if (error || !data) {
    await ctx.db.storage.from("project-files").remove([path]);
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
  const { data, error } = await ctx.db.storage.from("project-files").createSignedUrl(file.path, 60, { download: file.name });
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
  await ctx.db.storage.from("project-files").remove([file.path]);
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
