import { notFound } from "next/navigation";
import { getContext, loadProject } from "@/components/portal/loaders";
import { ProjectTabs } from "@/components/portal/ProjectTabs";
import { DeadlineChip, PageHeader, StageChip, packageName } from "@/components/portal/parts";
import { projectTitle } from "@/components/portal/copy";

export default async function ProjectLayout({ children, params }: LayoutProps<"/portal/projects/[id]">) {
  const { id } = await params;
  const { viewer, perspective } = await getContext(`/portal/projects/${id}`);
  const p = await loadProject(viewer, perspective, id);
  if (!p) notFound();
  const isAdmin = perspective === "admin";

  return (
    <>
      <PageHeader
        back={{ href: "/portal/projects", label: "All projects" }}
        eyebrow={`${packageName(p.package)} package`}
        title={isAdmin ? p.clientName : projectTitle(p)}
        sub={isAdmin ? [p.organization, p.email].filter(Boolean).join(" · ") : undefined}
        actions={
          <>
            <StageChip stage={p.stage} />
            <DeadlineChip deadline={p.deadline} stage={p.stage} />
          </>
        }
      />
      <ProjectTabs
        projectId={p.id}
        tabs={[
          { slug: "", label: "Overview" },
          { slug: "messages", label: p.unreadMessages > 0 ? `Messages (${p.unreadMessages})` : "Messages" },
          { slug: "files", label: "Files" },
          { slug: "payments", label: "Payments" },
          { slug: "preview", label: "Preview" },
        ]}
      />
      {children}
    </>
  );
}
