import { notFound } from "next/navigation";
import { AdminControls } from "@/components/portal/AdminSection";
import { getContext, loadProject, portalMeta } from "@/components/portal/loaders";
import { ApproveButton } from "@/components/portal/ProjectActions";
import { ActivityList, MoneySummary, Requirements } from "@/components/portal/ProjectBlocks";
import { Ring } from "@/components/portal/charts/Ring";
import { stageSentence } from "@/components/portal/copy";
import { Card, Timeline } from "@/components/portal/parts";
import { ProgressBar } from "@/components/portal/charts/ProgressBar";
import { shortDate } from "@/lib/portal/format";
import { stageLabel } from "@/lib/portal/types";

export const metadata = portalMeta("Project");

export default async function ProjectOverviewPage({ params }: PageProps<"/portal/projects/[id]">) {
  const { id } = await params;
  const { viewer, perspective } = await getContext(`/portal/projects/${id}`);
  const p = await loadProject(viewer, perspective, id);
  if (!p) notFound();
  const isAdmin = perspective === "admin";
  const needsApproval = perspective === "client" && (p.stage === "client_review" || p.stage === "revisions") && !p.approvedAt;

  return (
    <div className="pt-grid pt-cols-side">
      <div className="pt-stack">
        <Card>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.5rem 2.25rem" }}>
            <Ring value={p.progress} size={148} stroke={12} caption="complete" label="Project progress" />
            <div style={{ flex: "1 1 16rem", minWidth: 0 }}>
              <p className="pt-strong" style={{ fontSize: "1.1rem" }}>
                {isAdmin ? "Current stage" : "Where things stand"}
              </p>
              <p className="pt-small" style={{ margin: "0.35rem 0 1rem", fontSize: "0.98rem" }}>
                {isAdmin ? `In ${stageLabel[p.stage].toLowerCase()}. Progress follows the milestones below.` : stageSentence[p.stage]}
              </p>
              <ProgressBar value={p.progress} label="Project progress" />
              <p className="pt-small" style={{ marginTop: "0.75rem" }}>
                Revisions: {p.revisionsUsed} of {p.revisionsIncluded} used
                {p.deadline ? ` · Target date ${shortDate(p.deadline)}` : ""}
              </p>
            </div>
          </div>
        </Card>

        {needsApproval && (
          <div className="pt-prompt">
            <div>
              <p className="pt-strong">Ready to sign off?</p>
              <p className="pt-small">Approving tells the studio the design is final. It never charges anything.</p>
            </div>
            <ApproveButton projectId={p.id} />
          </div>
        )}

        <Card title="Timeline" note="Milestones and what is next">
          <Timeline milestones={p.milestones} />
        </Card>
        <Requirements p={p} admin={isAdmin} />
      </div>

      <div className="pt-stack">
        <MoneySummary p={p} />
        {isAdmin && <AdminControls project={p} />}
        <ActivityList events={p.events} />
      </div>
    </div>
  );
}
