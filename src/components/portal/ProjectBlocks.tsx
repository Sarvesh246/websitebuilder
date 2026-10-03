import {
  BadgeCheck, CalendarClock, Circle, CircleCheck, CreditCard, Flag, Globe, ListChecks, MessageSquareText, Paperclip, RotateCcw,
  Sparkles, TriangleAlert, Undo2, UserRound, type LucideIcon,
} from "lucide-react";
import { formatUsd } from "@/lib/money";
import { clockTime, relativeDay, shortDate } from "@/lib/portal/format";
import type { ProjectDetail } from "@/lib/portal/types";
import { CollectFinalButton, RefundForm } from "./ProjectActions";
import { dueFor, paymentTypeLabel } from "./copy";
import { Card } from "./parts";

export const MoneySummary = ({ p }: { p: ProjectDetail }) => {
  const due = dueFor(p);
  const m = p.money;
  return (
    <Card title="Payment" note={due.label}>
      {m.total == null ? (
        <p className="pt-small">This is a custom project. The studio sets the price after reviewing the request.</p>
      ) : (
        <dl className="pt-money">
          <div>
            <dt>Project total</dt>
            <dd>{formatUsd(m.total)}</dd>
          </div>
          {(m.deposit ?? 0) !== m.total && (
            <div>
              <dt>Initial payment</dt>
              <dd>{formatUsd(m.deposit)}</dd>
            </div>
          )}
          <div>
            <dt>Paid so far</dt>
            <dd>{formatUsd(m.paid)}</dd>
          </div>
          <div className="pt-money__total">
            <dt className="pt-strong">Remaining</dt>
            <dd>{formatUsd(Math.max(0, m.remaining ?? 0))}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
};

/** Studio-only payment controls. The parent page must only render this for a verified admin perspective. */
export const AdminPaymentTools = ({ p }: { p: ProjectDetail }) => {
  const eligible = p.initialPayment === "paid" && p.finalPayment !== "paid" && p.finalPayment !== "not_required" && (p.money.remaining ?? 0) > 0 && p.stage !== "cancelled";
  const refundable = p.payments
    .filter((x) => x.type !== "refund" && (x.status === "succeeded" || x.status === "partially_refunded"))
    .map((x) => ({ id: x.id, label: `${paymentTypeLabel[x.type]} ${formatUsd(x.amount)} (${shortDate(x.paidAt ?? x.createdAt)})`, amountCents: x.amount }));
  return (
    <div className="pt-stack">
      <div className="pt-stack">
        <CollectFinalButton projectId={p.id} amountLabel={formatUsd(p.money.remaining)} disabled={!eligible} />
        {!eligible && <p className="pt-small">Available once the initial payment is paid and a balance remains.</p>}
      </div>
      <hr style={{ border: 0, borderTop: "1px solid var(--border)" }} />
      <RefundForm projectId={p.id} payments={refundable} />
    </div>
  );
};

export const Requirements = ({ p, admin }: { p: ProjectDetail; admin: boolean }) => (
  <Card title="Project details" note="What was asked for in the request">
    <dl className="pt-dl">
      {p.description && (
        <div>
          <dt>Description</dt>
          <dd style={{ whiteSpace: "pre-wrap" }}>{p.description}</dd>
        </div>
      )}
      {p.websiteType && (
        <div>
          <dt>Type of site</dt>
          <dd>{p.websiteType}</dd>
        </div>
      )}
      <div>
        <dt>Features</dt>
        <dd>{p.features.length ? <span className="pt-tags">{p.features.map((f) => <span key={f} className="pt-chip">{f}</span>)}</span> : "None listed"}</dd>
      </div>
      {p.existingWebsite && (
        <div>
          <dt>Existing site</dt>
          <dd>{p.existingWebsite}</dd>
        </div>
      )}
      {p.links.length > 0 && (
        <div>
          <dt>Inspiration</dt>
          <dd>
            {p.links.map((l) => (
              <span key={l} style={{ display: "block" }}>
                {l}
              </span>
            ))}
          </dd>
        </div>
      )}
      {p.timeline && (
        <div>
          <dt>Timeline</dt>
          <dd>{p.timeline}</dd>
        </div>
      )}
      {p.budget && (
        <div>
          <dt>Budget</dt>
          <dd>{p.budget}</dd>
        </div>
      )}
      {admin && (
        <>
          <div>
            <dt>Email</dt>
            <dd>{p.email}</dd>
          </div>
          {p.phone && (
            <div>
              <dt>Phone</dt>
              <dd>{p.phone}</dd>
            </div>
          )}
          {p.organization && (
            <div>
              <dt>Organization</dt>
              <dd>{p.organization}</dd>
            </div>
          )}
          <div>
            <dt>Account</dt>
            <dd>{p.hasAccount ? "Linked to a client account" : "Not linked to an account yet"}</dd>
          </div>
        </>
      )}
      <div>
        <dt>Received</dt>
        <dd>{shortDate(p.createdAt)}</dd>
      </div>
    </dl>
  </Card>
);

const eventIcon: Record<string, LucideIcon> = {
  payment_received: CreditCard, final_payment_received: CreditCard, payment: CreditCard, payment_failed: TriangleAlert,
  final_payment_failed: TriangleAlert, refund: Undo2, dispute: TriangleAlert, stage: Flag, milestone: CircleCheck,
  file: Paperclip, preview: Globe, approval: BadgeCheck, feedback: MessageSquareText, checklist: ListChecks,
  revision: RotateCcw, deadline: CalendarClock, account: UserRound, request: Sparkles,
};

const actorText = (role: ProjectDetail["events"][number]["actorRole"], admin: boolean) =>
  role === "system" ? "Automatic" : role === "admin" ? (admin ? "You" : "Studio") : role === "client" ? (admin ? "Client" : "You") : null;

const dayKey = (iso: string) => new Date(iso).toDateString();
const dayLabel = (iso: string) => {
  const rel = relativeDay(iso);
  return rel === "Today" || rel === "Yesterday" ? rel : shortDate(iso);
};

/** Project history grouped by day, newest first. Older entries fold away behind "Show full history". */
const EventGroups = ({ events, admin }: { events: ProjectDetail["events"]; admin: boolean }) => {
  const groups: { key: string; label: string; items: ProjectDetail["events"] }[] = [];
  for (const e of events) {
    const key = dayKey(e.createdAt);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(e);
    else groups.push({ key, label: dayLabel(e.createdAt), items: [e] });
  }
  return (
    <>
      {groups.map((g) => (
        <div key={g.key} className="pt-history__day">
          <p className="pt-history__date">{g.label}</p>
          <ol className="pt-history__list">
            {g.items.map((e) => {
              const Icon = eventIcon[e.kind] ?? Circle;
              const actor = actorText(e.actorRole, admin);
              return (
                <li key={e.id} className="pt-history__item" data-kind={e.kind}>
                  <span className="pt-history__icon" aria-hidden>
                    <Icon size={14} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p>{e.title}</p>
                    <p className="pt-history__meta">
                      <time dateTime={e.createdAt}>{clockTime(e.createdAt)}</time>
                      {actor && <span>{actor}</span>}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </>
  );
};

const RECENT = 6;

export const ActivityList = ({ events, admin = false }: { events: ProjectDetail["events"]; admin?: boolean }) => (
  <Card title="Activity" note="Everything that has happened on this project">
    {events.length === 0 ? (
      <p className="pt-small">Payments, files, feedback and stage changes are recorded here as they happen, starting with your request.</p>
    ) : (
      <div className="pt-history">
        <EventGroups events={events.slice(0, RECENT)} admin={admin} />
        {events.length > RECENT && (
          <details className="pt-history__more">
            <summary>Show full history ({events.length - RECENT} more)</summary>
            <EventGroups events={events.slice(RECENT)} admin={admin} />
          </details>
        )}
      </div>
    )}
  </Card>
);
