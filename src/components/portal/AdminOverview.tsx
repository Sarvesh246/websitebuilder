import { AlarmClock, Banknote, FolderKanban, Hourglass, Inbox, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatUsd } from "@/lib/money";
import { getAdminOverview } from "@/lib/portal/data";
import { shortDate, timeAgo } from "@/lib/portal/format";
import { type Viewer, stageLabel } from "@/lib/portal/types";
import { AreaChart } from "./charts/AreaChart";
import { Donut } from "./charts/Donut";
import { PipelineBars } from "./charts/PipelineBars";
import { ProgressBar } from "./charts/ProgressBar";
import { Sparkline } from "./charts/Sparkline";
import { StatTile } from "./charts/StatTile";
import { monthLabel } from "./copy";
import { Card, DeadlineChip, EmptyState, PageHeader, StageChip, packageName } from "./parts";

export const AdminOverview = async ({ viewer }: { viewer: Viewer }) => {
  const o = await getAdminOverview(viewer);
  const k = o.kpis;
  const first = viewer.fullName?.split(" ")[0];
  const months = o.revenueByMonth.map((m) => ({ label: monthLabel(m.month), value: m.collected }));
  const totalCollected = o.revenueByMonth.reduce((n, m) => n + m.collected, 0);

  return (
    <>
      <PageHeader
        eyebrow="Studio overview"
        title={first ? `Welcome back, ${first}` : "Welcome back"}
        sub="Where every project stands today: requests to answer, work to ship and money still to collect."
        actions={
          <Link href="/portal/projects" className="btn btn-secondary btn-sm">
            All projects
          </Link>
        }
      />

      <div className="pt-grid pt-kpis">
        <StatTile label="Active projects" value={k.activeProjects} sub="Accepted through launch" icon={FolderKanban} />
        <StatTile label="New requests" value={k.newRequests} sub={k.newRequests === 1 ? "Awaiting a reply" : "Awaiting replies"} icon={Inbox} />
        <StatTile label="Collected" value={formatUsd(k.collected)} sub="All time, after refunds" icon={Banknote}>
          <Sparkline values={o.revenueByMonth.map((m) => m.collected)} label="Collected per month, last six months" />
        </StatTile>
        <StatTile label="Outstanding" value={formatUsd(k.outstanding)} sub="Balances not yet paid" icon={Hourglass} />
        <StatTile label="Overdue" value={k.overdue} sub={k.overdue === 0 ? "Everything on schedule" : "Past their deadline"} icon={AlarmClock} tone={k.overdue > 0 ? "warn" : "default"} />
        <StatTile label="Unread" value={k.unread} sub={k.unread === 0 ? "Inbox is clear" : "Client messages"} icon={MessageSquare} />
      </div>

      <div className="pt-grid pt-cols-main pt-section-gap">
        <Card title="Revenue by month" note={`${formatUsd(totalCollected)} collected in the last six months`}>
          <AreaChart data={months} title="Revenue collected by month, last six months" />
        </Card>
        <Card title="Collected and outstanding" note="Across every project">
          <Donut collected={k.collected} outstanding={k.outstanding} />
        </Card>
      </div>

      <div className="pt-grid pt-cols-2 pt-section-gap">
        <Card title="Pipeline" note="Projects at each stage">
          <PipelineBars title="Projects by stage" rows={o.pipeline.map((p) => ({ label: stageLabel[p.stage], value: p.count }))} />
        </Card>

        <Card
          title="New requests"
          note="Waiting for the studio's first reply"
          action={
            <Link href="/portal/projects?stage=requested" className="pt-link">
              View all
            </Link>
          }
        >
          {o.newRequests.length === 0 ? (
            <EmptyState icon={Inbox} title="No new requests">
              New requests from the intake form land here. Open one to accept it, set a deadline and plan milestones.
            </EmptyState>
          ) : (
            <ul className="pt-list">
              {o.newRequests.slice(0, 5).map((p) => (
                <li key={p.id} className="pt-row">
                  <div className="pt-row__main">
                    <Link href={`/portal/projects/${p.id}`} className="pt-row__title">
                      {p.clientName}
                    </Link>
                    <p className="pt-row__meta">
                      <span>{packageName(p.package)}</span>
                      {p.websiteType && <span>{p.websiteType}</span>}
                      <span>{timeAgo(p.createdAt)}</span>
                    </p>
                  </div>
                  <Link href={`/portal/projects/${p.id}`} className="btn btn-secondary btn-sm">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="pt-grid pt-cols-2 pt-section-gap">
        <Card title="Upcoming deadlines" note="Open projects, soonest first">
          {o.deadlines.length === 0 ? (
            <EmptyState icon={AlarmClock} title="No deadlines set">
              Set a target date in a project’s studio controls and it is tracked here, soonest first.
            </EmptyState>
          ) : (
            <ul className="pt-list">
              {o.deadlines.slice(0, 6).map((p) => (
                <li key={p.id} className="pt-row">
                  <div className="pt-row__main">
                    <Link href={`/portal/projects/${p.id}`} className="pt-row__title">
                      {p.clientName}
                    </Link>
                    <p className="pt-row__meta">
                      <StageChip stage={p.stage} />
                      <span>{shortDate(p.deadline)}</span>
                    </p>
                  </div>
                  <div className="pt-row__aside">
                    <DeadlineChip deadline={p.deadline} stage={p.stage} />
                    <ProgressBar value={p.progress} size="sm" label={`${p.clientName} progress`} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent activity" note="The latest changes across projects">
          {o.activity.length === 0 ? (
            <EmptyState icon={FolderKanban} title="Nothing yet">
              Payments, uploads, feedback rounds and stage changes across all projects are listed here as they happen.
            </EmptyState>
          ) : (
            <ul className="pt-list pt-feed">
              {o.activity.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <span className="pt-dot" aria-hidden />
                  <div>
                    <Link href={`/portal/projects/${a.projectId}`} className="pt-strong" style={{ textDecoration: "none" }}>
                      {a.clientName || "Project"}
                    </Link>
                    <span className="pt-muted">: {a.title}</span>
                    <time dateTime={a.createdAt}>{timeAgo(a.createdAt)}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};
