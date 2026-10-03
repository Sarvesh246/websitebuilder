import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { getPerspective, requireViewer } from "@/lib/auth/session";
import { getProject, getWorkflow, listProjects, type Workflow } from "@/lib/portal/data";
import type { ProjectDetail, ProjectSummary, Viewer } from "@/lib/portal/types";

/** Every portal page is private: noindex, and the title template supplies "| Northframe". */
export const portalMeta = (title: string): Metadata => ({ title, robots: { index: false, follow: false } });

/** Viewer + effective perspective, resolved once per request (auth is re-checked in each page, never assumed from the layout). */
export const getContext = cache(async (next = "/portal") => {
  const viewer = await requireViewer(next);
  const perspective = await getPerspective(viewer);
  return { viewer, perspective };
});

/** One project's detail, shared between a layout and its page within a request. Null = not found or not yours. */
export const loadProject = cache(async (viewer: Viewer, perspective: "admin" | "client", id: string): Promise<ProjectDetail | null> => {
  try {
    return await getProject(viewer, perspective, id);
  } catch {
    return null;
  }
});

/** Feedback rounds + checklist for a project the page already loaded. Empty (never throws) when unavailable. */
export const loadWorkflow = async (viewer: Viewer, perspective: "admin" | "client", project: Pick<ProjectSummary, "id" | "package">): Promise<Workflow> => {
  try {
    return await getWorkflow(viewer, perspective, project);
  } catch {
    return { rounds: [], checklist: [] };
  }
};

/** The viewer's project list, shared between the shell (unread badge) and the page within one request. */
export const loadProjects = cache(async (viewer: Viewer, perspective: "admin" | "client"): Promise<ProjectSummary[]> => {
  try {
    return await listProjects(viewer, perspective);
  } catch {
    return [];
  }
});
