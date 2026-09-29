import { PortalShell } from "@/components/portal/PortalShell";
import { getContext, loadProjects, portalMeta } from "@/components/portal/loaders";

export const metadata = { ...portalMeta("Portal"), title: { default: "Portal", template: "%s | Northframe" } };

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const { viewer, perspective } = await getContext();
  const projects = await loadProjects(viewer, perspective);
  const unread = projects.reduce((n, p) => n + p.unreadMessages, 0);
  return (
    <PortalShell viewer={viewer} perspective={perspective} unreadMessages={unread}>
      {children}
    </PortalShell>
  );
}
