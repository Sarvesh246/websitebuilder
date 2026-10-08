import { ExternalLink, Globe } from "lucide-react";
import { notFound } from "next/navigation";
import { getContext, loadProject, loadWorkflow, portalMeta } from "@/components/portal/loaders";
import { FeedbackPanel } from "@/components/portal/Feedback";
import { ApproveButton } from "@/components/portal/ProjectActions";
import { approvalChargeLabel, approvalNote } from "@/components/portal/copy";
import { Card, EmptyState } from "@/components/portal/parts";
import { shortDate } from "@/lib/portal/format";
import { canGiveFeedback, draftRound, roundInProgress } from "@/lib/portal/workflow";

export const metadata = portalMeta("Preview");

/** Only http(s) links are ever rendered as anchors. The preview opens in a new tab and is never framed. */
const safeUrl = (raw: string | null): URL | null => {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
};

export default async function ProjectPreviewPage({ params }: PageProps<"/portal/projects/[id]/preview">) {
  const { id } = await params;
  const { viewer, perspective } = await getContext(`/portal/projects/${id}/preview`);
  const p = await loadProject(viewer, perspective, id);
  if (!p) notFound();
  const url = safeUrl(p.previewUrl);
  const { rounds } = await loadWorkflow(viewer, perspective, p);
  const isAdmin = perspective === "admin";
  const previewing = viewer.role === "admin" && perspective === "client";
  const open = canGiveFeedback(p);
  const busy = Boolean(roundInProgress(rounds));
  const drafted = (draftRound(rounds)?.items.length ?? 0) > 0;
  const showApprove = !isAdmin && open && !busy && !drafted;

  return (
    <div className="pt-grid pt-cols-side">
      <div className="pt-stack">
        {url ? (
          <div className="pt-frame">
            <div className="pt-frame__bar">
              <span className="pt-frame__dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="pt-frame__url">{url.host}</span>
            </div>
            <div className="pt-frame__body">
              <span className="pt-empty__icon">
                <Globe aria-hidden size={22} strokeWidth={1.7} />
              </span>
              <p className="pt-empty__title">{p.approvedAt ? "Approved version" : "Your preview is ready"}</p>
              <p className="pt-small" style={{ maxWidth: "30rem" }}>
                {isAdmin
                  ? "This is the link the client reviews. Their comments arrive below once they send a round."
                  : open
                    ? "Open it in a new tab, look through every page (on your phone too), then leave comments below."
                    : "It opens in a new tab. A preview is a work in progress until launch."}
              </p>
              <a href={url.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Open preview
                <ExternalLink aria-hidden size={16} strokeWidth={1.9} />
              </a>
            </div>
          </div>
        ) : (
          <Card>
            <EmptyState icon={Globe} title="No preview yet">
              {isAdmin
                ? "Add a preview link in the studio controls on the Overview tab. The client is then asked to review it."
                : "When the first version is ready, a preview link appears here and you can comment on it page by page."}
            </EmptyState>
          </Card>
        )}
        <FeedbackPanel projectId={p.id} rounds={rounds} admin={isAdmin} canGive={open} used={p.revisionsUsed} included={p.revisionsIncluded} previewing={previewing} />
      </div>

      <div className="pt-stack">
        {showApprove && (
          <div className="pt-prompt pt-prompt--stack">
            <div>
              <p className="pt-strong">Happy with it as it is?</p>
              <p className="pt-small">{approvalNote(approvalChargeLabel(p), "Approving tells the studio the design is final and ends the revision rounds.")}</p>
            </div>
            <ApproveButton projectId={p.id} chargeLabel={approvalChargeLabel(p)} />
          </div>
        )}
        {p.approvedAt && (
          <p className="pt-msg" role="status">
            Final version approved {shortDate(p.approvedAt)}.
          </p>
        )}
        <Card title="How feedback works">
          <ol className="pt-steps">
            <li>Open the preview and note anything to change.</li>
            <li>Add one comment per change, with the page and a screenshot if it helps.</li>
            <li>Send the round. Each round uses one of your {p.revisionsIncluded} included revisions.</li>
            <li>The studio works through it and lets you know when the round is addressed.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
