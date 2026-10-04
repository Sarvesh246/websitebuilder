import { ArrowLeft, CalendarClock, Check, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { customTier, packageTiers, type PackageId } from "@/config/pricing";
import { cn } from "@/lib/cn";
import { avatarDataUri } from "@/lib/avatar";
import { initials, isOverdue, relativeDay, shortDate } from "@/lib/portal/format";
import { type Milestone, type ProjectStage, stageLabel } from "@/lib/portal/types";

export const packageName = (id: PackageId): string => (id === "custom" ? customTier.name : (packageTiers.find((t) => t.id === id)?.name ?? id));

export const PageHeader = ({
  eyebrow,
  title,
  sub,
  actions,
  back,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) => (
  <>
    {back && (
      <Link href={back.href} className="pt-back">
        <ArrowLeft aria-hidden size={16} strokeWidth={1.9} />
        {back.label}
      </Link>
    )}
    <header className="pt-head">
      <div>
        {eyebrow && <span className="pt-eyebrow">{eyebrow}</span>}
        <h1 className="pt-head__title">{title}</h1>
        {sub && <p className="pt-head__sub">{sub}</p>}
      </div>
      {actions && <div className="pt-head__actions">{actions}</div>}
    </header>
  </>
);

export const Card = ({
  title,
  note,
  action,
  children,
  className,
  flush,
  id,
}: {
  title?: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
  id?: string;
}) => (
  <section className={cn("pt-card", flush && "pt-card--flush", className)} id={id}>
    {(title || action) && (
      <div className={cn("pt-card__head", flush && "px-5 pt-5")}>
        <div>
          {title && <h2 className="pt-card__title">{title}</h2>}
          {note && <p className="pt-card__note">{note}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const EmptyState = ({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) => (
  <div className="pt-empty">
    <span className="pt-empty__icon">
      <Icon aria-hidden size={22} strokeWidth={1.7} />
    </span>
    <p className="pt-empty__title">{title}</p>
    {children && <p>{children}</p>}
    {action}
  </div>
);

export const StageChip = ({ stage }: { stage: ProjectStage }) => (
  <span className={cn("pt-chip", stage === "completed" ? "pt-chip--done" : stage === "cancelled" ? "pt-chip--outline" : "pt-chip--accent")}>{stageLabel[stage]}</span>
);

/** Deadline chip. Overdue pairs colour with the words "overdue"; at-risk (within 3 days) says so in text. */
export const DeadlineChip = ({ deadline, stage }: { deadline: string | null; stage: ProjectStage }) => {
  if (!deadline) return <span className="pt-chip pt-chip--outline">No deadline</span>;
  if (stage === "completed" || stage === "cancelled") return <span className="pt-chip pt-chip--outline">{shortDate(deadline)}</span>;
  const overdue = isOverdue(deadline, stage);
  const rel = relativeDay(deadline);
  const soon = !overdue && (rel === "Today" || rel === "Tomorrow" || /^in [123] days?$/.test(rel));
  return (
    <span className={cn("pt-chip", overdue ? "pt-chip--warn" : soon ? "pt-chip--accent" : "pt-chip--outline")} title={shortDate(deadline)}>
      <CalendarClock aria-hidden size={13} strokeWidth={2} />
      {overdue ? rel : soon ? `At risk: ${rel.toLowerCase()}` : shortDate(deadline)}
    </span>
  );
};

export const Avatar = ({ name, seed }: { name: string | null | undefined; seed?: string }) => {
  const uri = seed ? avatarDataUri(seed) : null;
  return (
    <span className="pt-avatar" aria-hidden style={uri ? { backgroundImage: `url("${uri}")` } : undefined}>
      {uri ? null : initials(name)}
    </span>
  );
};

export const Timeline = ({ milestones, empty }: { milestones: Milestone[]; empty?: ReactNode }) => {
  if (milestones.length === 0) return <>{empty ?? <p className="pt-small">The studio maps out the milestones once your project is accepted. Each step, and when it is due, appears here.</p>}</>;
  return (
    <ol className="pt-timeline">
      {milestones.map((m) => (
        <li key={m.id} className="pt-tl" data-status={m.status}>
          <span className="pt-tl__node" aria-hidden>
            {m.status === "done" && <Check size={13} strokeWidth={3} />}
          </span>
          <div>
            <p className="pt-tl__title">
              {m.title} <span className="sr-only">({m.status === "done" ? "done" : m.status === "active" ? "in progress" : "upcoming"})</span>
            </p>
            {m.detail && <p className="pt-small">{m.detail}</p>}
            <p className="pt-tl__meta">
              <span>{m.status === "done" ? "Done" : m.status === "active" ? "In progress" : "Upcoming"}</span>
              {m.status === "done" && m.completedAt ? <span>{shortDate(m.completedAt)}</span> : m.dueDate ? <span>Due {shortDate(m.dueDate)}</span> : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
};
