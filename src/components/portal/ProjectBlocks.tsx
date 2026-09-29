import { formatUsd } from "@/lib/money";
import { shortDate, timeAgo } from "@/lib/portal/format";
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

export const ActivityList = ({ events }: { events: ProjectDetail["events"] }) => (
  <Card title="Activity">
    {events.length === 0 ? (
      <p className="pt-small">Updates will be listed here.</p>
    ) : (
      <ul className="pt-list pt-feed">
        {events.slice(0, 8).map((e) => (
          <li key={e.id}>
            <span className="pt-dot" aria-hidden />
            <div>
              {e.title}
              <time dateTime={e.createdAt}>{timeAgo(e.createdAt)}</time>
            </div>
          </li>
        ))}
      </ul>
    )}
  </Card>
);
