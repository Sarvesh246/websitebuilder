import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Viewer } from "@/lib/portal/types";
import { createAdminClient, createClient } from "@/utils/supabase/server";

/** Dev-only fixture mode (never in production): lets the portal render without a live Supabase session. */
export const demoMode = () => process.env.PORTAL_DEMO === "1" && process.env.NODE_ENV !== "production";
export const VIEW_AS_COOKIE = "nf-view-as";

/**
 * The signed-in user with their role. The role always comes from public.profiles via the service
 * role, never from a cookie, header or client-supplied value. Returns null when signed out.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (demoMode()) {
    const role = (await cookies()).get("nf-demo-role")?.value === "client" ? "client" : "admin";
    return { userId: "00000000-0000-4000-8000-000000000001", email: "owner@northframe.co", fullName: "Sarvesh", role };
  }
  let userId: string | undefined;
  let email = "";
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims?.sub;
    email = String(data?.claims?.email ?? "");
  } catch {
    return null;
  }
  if (!userId) return null;
  const db = createAdminClient();
  if (!db) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("full_name, role, email")
    .eq("id", userId)
    .maybeSingle<{ full_name: string | null; role: "client" | "admin"; email: string }>();
  return { userId, email: profile?.email || email, fullName: profile?.full_name ?? null, role: profile?.role === "admin" ? "admin" : "client" };
});

export const requireViewer = async (next = "/portal"): Promise<Viewer> => {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
};

/** Server-side admin gate for every privileged action and page. A hidden button is never authorization. */
export const requireAdmin = async (): Promise<Viewer> => {
  const viewer = await requireViewer();
  if (viewer.role !== "admin") redirect("/portal");
  return viewer;
};

/** Effective perspective: an admin may preview the client experience. Clients can never elevate. */
export const getPerspective = async (viewer: Viewer): Promise<"admin" | "client"> => {
  if (viewer.role !== "admin") return "client";
  return (await cookies()).get(VIEW_AS_COOKIE)?.value === "client" ? "client" : "admin";
};
