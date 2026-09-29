import { FolderKanban, Search } from "lucide-react";
import Link from "next/link";
import { getContext, portalMeta } from "@/components/portal/loaders";
import { ProjectCard } from "@/components/portal/ProjectCard";
import { ProgressBar } from "@/components/portal/charts/ProgressBar";
import { Card, DeadlineChip, EmptyState, PageHeader, StageChip, packageName } from "@/components/portal/parts";
import { formatUsd } from "@/lib/money";
import { listProjects } from "@/lib/portal/data";
import { timeAgo } from "@/lib/portal/format";
import type { ListOpts } from "@/lib/portal/mappers";
import { projectStages, stageLabel } from "@/lib/portal/types";

export const metadata = portalMeta("Projects");

const sorts: { value: NonNullable<ListOpts["sort"]>; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "deadline", label: "Deadline" },
  { value: "progress", label: "Progress" },
  { value: "balance", label: "Balance due" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ProjectsPage({ searchParams }: PageProps<"/portal/projects">) {
  const { viewer, perspective } = await getContext("/portal/projects");
  const sp = await searchParams;
  const stage = one(sp.stage) ?? "all";
  const q = (one(sp.q) ?? "").slice(0, 80);
  const sortRaw = one(sp.sort);
  const sort = sorts.find((s) => s.value === sortRaw)?.value ?? "recent";
  const isAdmin = perspective === "admin";
  const list = await listProjects(viewer, perspective, isAdmin ? { stage, q, sort } : undefined).catch(() => []);
  const filtered = stage !== "all" || q !== "";

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "Studio" : "Your work"}
        title="Projects"
        sub={isAdmin ? "Every project and request, with stage, progress, deadline and balance." : "Your website projects and where each one stands."}
        actions={
          !isAdmin && (
            <Link href="/start" className="btn btn-primary btn-sm">
              Start a project
            </Link>
          )
        }
      />

      {isAdmin && (
        <form className="pt-filters" method="get" role="search" aria-label="Filter projects">
          <div className="pt-field pt-field--grow">
            <label htmlFor="pf-q">Search</label>
            <input id="pf-q" name="q" type="search" className="pt-input" defaultValue={q} placeholder="Client, organization or email" />
          </div>
          <div className="pt-field">
            <label htmlFor="pf-stage">Stage</label>
            <select id="pf-stage" name="stage" className="pt-select" defaultValue={stage}>
              <option value="all">All stages</option>
              <option value="open">Open only</option>
              {[...projectStages, "cancelled" as const].map((s) => (
                <option key={s} value={s}>
                  {stageLabel[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-field">
            <label htmlFor="pf-sort">Sort by</label>
            <select id="pf-sort" name="sort" className="pt-select" defaultValue={sort}>
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            <Search aria-hidden size={15} />
            Apply
          </button>
          {filtered && (
            <Link href="/portal/projects" className="btn btn-secondary btn-sm">
              Clear
            </Link>
          )}
        </form>
      )}

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title={filtered ? "No projects match" : "No projects yet"}
            action={
              !isAdmin && !filtered ? (
                <Link href="/start" className="btn btn-primary btn-sm">
                  Start a project
                </Link>
              ) : undefined
            }
          >
            {filtered ? "Try a different search or clear the filters." : isAdmin ? "New requests will appear here." : "When you start a project it will show up here."}
          </EmptyState>
        </Card>
      ) : isAdmin ? (
        <>
          <Card flush className="pt-tablewrap">
            <table className="pt-table">
              <caption className="sr-only">Projects</caption>
              <thead>
                <tr>
                  <th scope="col">Client</th>
                  <th scope="col">Package</th>
                  <th scope="col">Stage</th>
                  <th scope="col" style={{ minWidth: "9rem" }}>
                    Progress
                  </th>
                  <th scope="col">Deadline</th>
                  <th scope="col" className="pt-right">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/portal/projects/${p.id}`} className="pt-table__client">
                        {p.unreadMessages > 0 && (
                          <>
                            <span className="pt-dot" aria-hidden /> <span className="sr-only">{p.unreadMessages} unread messages. </span>
                          </>
                        )}
                        {p.clientName}
                      </Link>
                      <span className="pt-small">{p.organization ?? p.email}</span>
                      <span className="pt-small" style={{ display: "block" }}>
                        {timeAgo(p.createdAt)}
                      </span>
                    </td>
                    <td>{packageName(p.package)}</td>
                    <td>
                      <StageChip stage={p.stage} />
                    </td>
                    <td>
                      <ProgressBar value={p.progress} size="sm" label={`${p.clientName} progress`} />
                    </td>
                    <td>
                      <DeadlineChip deadline={p.deadline} stage={p.stage} />
                    </td>
                    <td className="pt-right pt-num">{p.money.total == null ? "Quote" : (p.money.remaining ?? 0) > 0 ? formatUsd(p.money.remaining) : "Paid"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="pt-cardlist">
            {list.map((p) => (
              <article key={p.id} className="pt-card">
                <div className="pt-row" style={{ padding: 0 }}>
                  <div className="pt-row__main">
                    <Link href={`/portal/projects/${p.id}`} className="pt-row__title" style={{ fontSize: "1.05rem" }}>
                      {p.unreadMessages > 0 && <span className="pt-dot" aria-hidden />} {p.clientName}
                    </Link>
                    <p className="pt-row__meta">
                      <span>{packageName(p.package)}</span>
                      <span>{p.organization ?? p.email}</span>
                    </p>
                  </div>
                  <StageChip stage={p.stage} />
                </div>
                <div style={{ margin: "0.9rem 0" }}>
                  <ProgressBar value={p.progress} label={`${p.clientName} progress`} />
                </div>
                <div className="pt-tags">
                  <DeadlineChip deadline={p.deadline} stage={p.stage} />
                  <span className="pt-chip pt-chip--outline">{p.money.total == null ? "Quote pending" : (p.money.remaining ?? 0) > 0 ? `${formatUsd(p.money.remaining)} due` : "Paid"}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="pt-grid pt-cols-2">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </>
  );
}
