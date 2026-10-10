import { PortalShell } from "@/components/portal/PortalShell";
import { getContext, loadProjects, portalMeta } from "@/components/portal/loaders";

export const metadata = { ...portalMeta("Portal"), title: { default: "Portal", template: "%s | Northframe" } };

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const { viewer, perspective } = await getContext();
  // Keep the navigation available during an outage; page reads still reach the portal error boundary.
  const projects = await loadProjects(viewer, perspective).catch(() => null);
  const unread = projects?.reduce((n, p) => n + p.unreadMessages, 0) ?? 0;
  return (
    <PortalShell viewer={viewer} perspective={perspective} unreadMessages={unread}>
      {children}
    </PortalShell>
  );
}
