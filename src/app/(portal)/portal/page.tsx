import { AdminOverview } from "@/components/portal/AdminOverview";
import { ClientOverview } from "@/components/portal/ClientOverview";
import { ScrollToTop } from "@/components/portal/ScrollToTop";
import { getContext, loadProjects, portalMeta } from "@/components/portal/loaders";

export const metadata = portalMeta("Overview");

export default async function PortalHome() {
  const { viewer, perspective } = await getContext();
  if (perspective === "admin") {
    return (
      <>
        <ScrollToTop />
        <AdminOverview viewer={viewer} />
      </>
    );
  }
  const projects = await loadProjects(viewer, "client");
  return (
    <>
      <ScrollToTop />
      <ClientOverview viewer={viewer} projects={projects} />
    </>
  );
}
