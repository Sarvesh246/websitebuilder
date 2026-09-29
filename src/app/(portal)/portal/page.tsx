import { AdminOverview } from "@/components/portal/AdminOverview";
import { ClientOverview } from "@/components/portal/ClientOverview";
import { getContext, loadProjects, portalMeta } from "@/components/portal/loaders";

export const metadata = portalMeta("Overview");

export default async function PortalHome() {
  const { viewer, perspective } = await getContext();
  if (perspective === "admin") return <AdminOverview viewer={viewer} />;
  const projects = await loadProjects(viewer, "client");
  return <ClientOverview viewer={viewer} projects={projects} />;
}
