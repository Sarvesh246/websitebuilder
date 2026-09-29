import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatUsd } from "@/lib/money";
import type { ProjectSummary } from "@/lib/portal/types";
import { projectTitle } from "./copy";
import { ProgressBar } from "./charts/ProgressBar";
import { DeadlineChip, StageChip, packageName } from "./parts";

/** Compact project card: the client's project list and the multi-project overview. */
export const ProjectCard = ({ project }: { project: ProjectSummary }) => {
  const owing = project.money.remaining ?? 0;
  return (
    <article className="pt-card">
      <div className="pt-row" style={{ padding: 0 }}>
        <div className="pt-row__main">
          <Link href={`/portal/projects/${project.id}`} className="pt-row__title" style={{ fontSize: "1.05rem" }}>
            {projectTitle(project)}
          </Link>
          <p className="pt-row__meta">
            <span>{packageName(project.package)} package</span>
          </p>
        </div>
        <StageChip stage={project.stage} />
      </div>
      <div style={{ margin: "1rem 0" }}>
        <ProgressBar value={project.progress} label={`${projectTitle(project)} progress`} />
      </div>
      <div className="pt-row" style={{ padding: 0 }}>
        <div className="pt-tags">
          <DeadlineChip deadline={project.deadline} stage={project.stage} />
          {owing > 0 && project.stage !== "cancelled" && <span className="pt-chip pt-chip--outline">{formatUsd(owing)} remaining</span>}
          {project.unreadMessages > 0 && (
            <span className="pt-chip pt-chip--accent">
              <span className="pt-dot" aria-hidden /> {project.unreadMessages} new
            </span>
          )}
        </div>
        <Link href={`/portal/projects/${project.id}`} className="pt-link" aria-label={`Open ${projectTitle(project)}`}>
          Open
          <ArrowUpRight aria-hidden size={15} strokeWidth={2} />
        </Link>
      </div>
    </article>
  );
};
