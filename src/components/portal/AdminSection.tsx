import { requireAdmin } from "@/lib/auth/session";
import { listNotes } from "@/lib/portal/data";
import { timeAgo } from "@/lib/portal/format";
import type { ProjectDetail } from "@/lib/portal/types";
import { LinkUserForm, MilestoneEditor, NoteForm, ScheduleControls, StageControl } from "./AdminControls";
import { AdminPaymentTools } from "./ProjectBlocks";
import { Card } from "./parts";

/**
 * Studio-only control panel for one project. Re-verifies admin on the server (requireAdmin redirects
 * anyone else), so hiding it in the UI is never the only gate.
 */
export const AdminControls = async ({ project: p }: { project: ProjectDetail }) => {
  const viewer = await requireAdmin();
  const notes = await listNotes(viewer, p.id).catch(() => []);
  return (
    <div className="pt-grid pt-cols-2 pt-section-gap">
      <div className="pt-stack">
        <Card title="Studio controls" note="Only you can see these">
          <div className="pt-stack pt-tools">
            <StageControl projectId={p.id} stage={p.stage} />
            <ScheduleControls projectId={p.id} deadline={p.deadline} previewUrl={p.previewUrl} revisionsIncluded={p.revisionsIncluded} revisionsUsed={p.revisionsUsed} />
            {!p.hasAccount && <LinkUserForm projectId={p.id} email={p.email} />}
          </div>
        </Card>
        <Card title="Internal notes" note="Never shown to the client">
          <div className="pt-stack">
            {notes.length > 0 && (
              <ul className="pt-list">
                {notes.map((n) => (
                  <li key={n.id} className="pt-row">
                    <div className="pt-row__main">
                      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{n.body}</p>
                      <p className="pt-small">{timeAgo(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <NoteForm projectId={p.id} />
          </div>
        </Card>
      </div>
      <div className="pt-stack">
        <Card title="Milestones" note="Drives the progress percentage">
          <MilestoneEditor projectId={p.id} milestones={p.milestones} />
        </Card>
        <Card title="Final payment and refunds">
          <AdminPaymentTools p={p} />
        </Card>
      </div>
    </div>
  );
};
