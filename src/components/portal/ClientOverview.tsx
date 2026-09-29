import { CreditCard, Flag, MessageSquare, Rocket } from "lucide-react";
import Link from "next/link";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { formatUsd } from "@/lib/money";
import { getProject, listInbox } from "@/lib/portal/data";
import { shortDate, timeAgo } from "@/lib/portal/format";
import type { ProjectSummary, Viewer } from "@/lib/portal/types";
import { Ring } from "./charts/Ring";
import { ProjectCard } from "./ProjectCard";
import { ApproveButton } from "./ProjectActions";
import { dueFor, projectTitle, stageSentence } from "./copy";
import { Card, EmptyState, PageHeader, StageChip, Timeline, packageName } from "./parts";

const open = (p: ProjectSummary) => p.stage !== "completed" && p.stage !== "cancelled";

export const ClientOverview = async ({ viewer, projects }: { viewer: Viewer; projects: ProjectSummary[] }) => {
  const first = viewer.fullName?.split(" ")[0];
  const title = first ? `Hello, ${first}` : "Hello";

  if (projects.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Your portal" title={title} sub="This is where your project, messages and payments will live." />
        <Card>
          <EmptyState
            icon={Rocket}
            title="No project yet"
            action={
              <Link href="/start" className="btn btn-primary">
                Start a project
              </Link>
            }
          >
            Tell the studio what you are building and choose a package. Your project and progress will appear here.
          </EmptyState>
        </Card>
      </>
    );
  }

  const primary = projects.find(open) ?? projects[0];
  const others = projects.filter((p) => p.id !== primary.id);
  const [detail, inbox] = await Promise.all([getProject(viewer, "client", primary.id), listInbox(viewer, "client")]);
  const next = detail?.milestones.find((m) => m.status !== "done");
  const last = inbox.find((i) => i.project.id === primary.id)?.last ?? null;
  const due = dueFor(primary);
  const needsApproval = (primary.stage === "client_review" || primary.stage === "revisions") && !detail?.approvedAt;
  const payAmount = due.dueNow > 0 ? due.dueNow : due.dueLater;
  const base = `/portal/projects/${primary.id}`;

  return (
    <>
      <PageHeader eyebrow="Your portal" title={title} sub="Here is where your website stands." />

      <GlassSurface variant="feature" padded={false} className="pt-hero">
        <div className="pt-hero__ring">
          <Ring value={primary.progress} size={196} stroke={14} caption="complete" label={`${projectTitle(primary)} progress`} />
        </div>
        <div>
          <div className="pt-tags" style={{ marginBottom: "0.8rem" }}>
            <span className="pt-chip pt-chip--outline">{packageName(primary.package)} package</span>
            <StageChip stage={primary.stage} />
          </div>
          <h2 className="pt-hero__title">{projectTitle(primary)}</h2>
          <p className="pt-hero__stage">{stageSentence[primary.stage]}</p>
          <dl className="pt-hero__facts">
            <div className="pt-fact">
              <dt>Next milestone</dt>
              <dd>{next ? next.title : primary.stage === "completed" ? "All done" : "To be planned"}</dd>
            </div>
            <div className="pt-fact">
              <dt>Target date</dt>
              <dd>{primary.deadline ? shortDate(primary.deadline) : "Not set yet"}</dd>
            </div>
            <div className="pt-fact">
              <dt>Payment</dt>
              <dd>
                {due.label}
                {payAmount > 0 ? `, ${formatUsd(payAmount)}` : ""}
              </dd>
            </div>
          </dl>
          <div className="pt-head__actions" style={{ marginTop: "1.4rem" }}>
            <Link href={base} className="btn btn-primary">
              View project
            </Link>
            <Link href={`${base}/messages`} className="btn btn-secondary">
              Message the studio
            </Link>
          </div>
        </div>
      </GlassSurface>

      {needsApproval && (
        <div className="pt-prompt pt-section-gap">
          <div>
            <p className="pt-strong">Happy with how it looks?</p>
            <p className="pt-small">Approving tells the studio the design is final. It never charges anything.</p>
          </div>
          <ApproveButton projectId={primary.id} />
        </div>
      )}

      <div className="pt-grid pt-cols-main pt-section-gap">
        <Card title="Milestones" note="What has happened and what is next">
          <Timeline milestones={detail?.milestones ?? []} />
        </Card>

        <div className="pt-stack">
          <Card title="Next payment" action={<CreditCard aria-hidden size={18} className="pt-muted" />}>
            <p className="pt-stat__value" style={{ fontSize: "1.9rem" }}>
              {due.label === "Awaiting quote" ? "Quote pending" : due.label === "Paid in full" ? "Paid in full" : formatUsd(payAmount)}
            </p>
            <p className="pt-small" style={{ marginTop: "0.35rem" }}>
              {due.label === "Due today" && "Due today to start the project."}
              {due.label === "Due after revisions" && "Due after the included revisions are finished."}
              {due.label === "Final payment due" && "The final balance is due before launch."}
              {due.label === "Awaiting quote" && "The studio will send a price for your custom project."}
              {due.label === "Paid in full" && "Nothing more to pay."}
            </p>
            {(due.label === "Due today" || due.label === "Final payment due") && (
              <Link
                href={due.label === "Due today" ? `${base}/checkout` : `${base}/payments`}
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
              >
                {due.label === "Due today" ? `Pay ${formatUsd(due.dueNow)}` : "Pay balance"}
              </Link>
            )}
          </Card>

          <Card title="Latest message" action={<MessageSquare aria-hidden size={18} className="pt-muted" />}>
            {last ? (
              <>
                <p className="pt-small" style={{ marginBottom: "0.4rem" }}>
                  {last.mine ? "You" : "The studio"} · {timeAgo(last.createdAt)}
                </p>
                <p style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{last.body}</p>
                <Link href={`${base}/messages`} className="pt-link" style={{ marginTop: "0.6rem" }}>
                  Open conversation
                </Link>
              </>
            ) : (
              <p className="pt-small">No messages yet. Say hello whenever you are ready.</p>
            )}
          </Card>

          {detail?.previewUrl && (
            <Card title="Preview" action={<Flag aria-hidden size={18} className="pt-muted" />}>
              <p className="pt-small">A live preview of your site is ready.</p>
              <Link href={`${base}/preview`} className="pt-link">
                Open preview
              </Link>
            </Card>
          )}
        </div>
      </div>

      {others.length > 0 && (
        <section className="pt-section-gap" aria-labelledby="pt-other-projects">
          <h2 className="pt-card__title" id="pt-other-projects" style={{ margin: "1.5rem 0 0.9rem" }}>
            Your other projects
          </h2>
          <div className="pt-grid pt-cols-2">
            {others.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};
