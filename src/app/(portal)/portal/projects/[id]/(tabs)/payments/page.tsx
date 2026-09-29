import { Receipt } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext, loadProject, portalMeta } from "@/components/portal/loaders";
import { PayBalanceButton, RequestCancellationButton } from "@/components/portal/ProjectActions";
import { AdminPaymentTools, MoneySummary } from "@/components/portal/ProjectBlocks";
import { dueFor, paymentStatusLabel, paymentTypeLabel } from "@/components/portal/copy";
import { Card, EmptyState } from "@/components/portal/parts";
import { CANCELLATION_WINDOW_DAYS, cancellationPolicy } from "@/config/payments";
import { formatUsd } from "@/lib/money";
import { shortDate } from "@/lib/portal/format";
import type { ProjectDetail } from "@/lib/portal/types";

export const metadata = portalMeta("Payments");

const inCancellationWindow = (paidAt: string | null): boolean =>
  paidAt ? Date.now() - new Date(paidAt).getTime() <= CANCELLATION_WINDOW_DAYS * 86_400_000 : false;

type Obligation = { key: string; title: string; amount: number; state: string; tone: "done" | "accent" | "warn" | "outline"; when: string };

const obligations = (p: ProjectDetail): Obligation[] => {
  const out: Obligation[] = [];
  const split = (p.money.remaining ?? 0) > 0 || p.finalPayment === "paid";
  if (p.money.deposit != null) {
    const paid = p.initialPayment === "paid";
    out.push({
      key: "initial",
      title: split ? "Deposit" : "Full payment",
      amount: p.money.deposit,
      state: paid ? "Paid" : p.initialPayment === "processing" ? "Processing" : p.initialPayment === "failed" ? "Failed" : "Due today",
      tone: paid ? "done" : p.initialPayment === "failed" ? "warn" : "accent",
      when: paid && p.initialPaidAt ? `Paid ${shortDate(p.initialPaidAt)}` : "Due when you start the project",
    });
  }
  if (split && p.money.total != null) {
    const amount = p.finalPayment === "paid" ? Math.max(0, p.money.total - (p.money.deposit ?? 0)) : (p.money.remaining ?? 0);
    const state =
      p.finalPayment === "paid" ? "Paid" : p.finalPayment === "processing" ? "Processing" : p.finalPayment === "failed" ? "Failed" : p.finalPayment === "requires_action" ? "Action needed" : "Due after revisions";
    out.push({
      key: "final",
      title: "Final balance",
      amount,
      state,
      tone: p.finalPayment === "paid" ? "done" : p.finalPayment === "failed" || p.finalPayment === "requires_action" ? "warn" : "outline",
      when: p.finalPayment === "paid" && p.finalPaidAt ? `Paid ${shortDate(p.finalPaidAt)}` : "Charged after the included revisions are finished",
    });
  }
  return out;
};

export default async function ProjectPaymentsPage({ params }: PageProps<"/portal/projects/[id]/payments">) {
  const { id } = await params;
  const { viewer, perspective } = await getContext(`/portal/projects/${id}/payments`);
  const p = await loadProject(viewer, perspective, id);
  if (!p) notFound();
  const isAdmin = perspective === "admin";
  const previewing = viewer.role === "admin" && perspective === "client";
  const due = dueFor(p);
  const rows = obligations(p);
  const needsBalance = !isAdmin && (p.finalPayment === "failed" || p.finalPayment === "requires_action" || (p.stage === "awaiting_final_payment" && p.finalPayment !== "processing")) && (p.money.remaining ?? 0) > 0 && p.finalPayment !== "paid";
  const withinWindow = inCancellationWindow(p.initialPaidAt);
  const canCancel = !isAdmin && !previewing && withinWindow && !p.cancellationRequestedAt && !p.cancelledAt;

  return (
    <div className="pt-grid pt-cols-side">
      <div className="pt-stack">
        <Card title="Payment schedule" note={due.label}>
          {rows.length === 0 ? (
            <EmptyState icon={Receipt} title="Awaiting a quote">
              The studio will set a price for this custom project. It will show up here.
            </EmptyState>
          ) : (
            <ul className="pt-list">
              {rows.map((r) => (
                <li key={r.key} className="pt-row">
                  <div className="pt-row__main">
                    <span className="pt-row__title">{r.title}</span>
                    <p className="pt-row__meta">
                      <span>{r.when}</span>
                    </p>
                  </div>
                  <div className="pt-row__aside">
                    <span className="pt-strong pt-num">{formatUsd(r.amount)}</span>
                    <span className={`pt-chip pt-chip--${r.tone === "done" ? "done" : r.tone}`}>{r.state}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {p.initialPayment !== "paid" && p.money.deposit != null && !isAdmin && p.stage !== "cancelled" && (
            <Link href={`/portal/projects/${p.id}/checkout`} className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Pay {formatUsd(p.money.deposit)}
            </Link>
          )}
          {needsBalance && (
            <div style={{ marginTop: "1rem" }}>
              <PayBalanceButton projectId={p.id} amountLabel={formatUsd(p.money.remaining)} />
              <p className="pt-small" style={{ marginTop: "0.5rem" }}>
                Opens secure checkout for the remaining balance.
              </p>
            </div>
          )}
        </Card>

        <Card title="Receipts and history" note="Every payment on this project">
          {p.payments.length === 0 ? (
            <EmptyState icon={Receipt} title="No payments yet">
              Payments and receipts will be listed here.
            </EmptyState>
          ) : (
            <ul className="pt-list">
              {p.payments.map((x) => (
                <li key={x.id} className="pt-row">
                  <div className="pt-row__main">
                    <span className="pt-row__title">{paymentTypeLabel[x.type]}</span>
                    <p className="pt-row__meta">
                      <span>{shortDate(x.paidAt ?? x.createdAt)}</span>
                    </p>
                  </div>
                  <div className="pt-row__aside">
                    <span className="pt-strong pt-num">
                      {x.type === "refund" ? "-" : ""}
                      {formatUsd(x.amount)}
                    </span>
                    <span className={`pt-chip ${x.status === "succeeded" ? "pt-chip--done" : x.status === "failed" ? "pt-chip--warn" : "pt-chip--outline"}`}>{paymentStatusLabel[x.status]}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="pt-stack">
        <MoneySummary p={p} />
        {isAdmin && (
          <Card title="Final payment and refunds" note="Only you can see this">
            <AdminPaymentTools p={p} />
          </Card>
        )}
        {!isAdmin && (
          <Card title={cancellationPolicy.title}>
            <div className="pt-stack">
              {cancellationPolicy.body.map((line) => (
                <p key={line} className="pt-small">
                  {line}
                </p>
              ))}
              <p className="pt-small">{cancellationPolicy.note}</p>
              {p.cancellationRequestedAt ? (
                <p className="pt-msg" role="status">
                  Cancellation requested {shortDate(p.cancellationRequestedAt)}. The studio will follow up.
                </p>
              ) : canCancel ? (
                <RequestCancellationButton projectId={p.id} />
              ) : (
                <p className="pt-small">{p.initialPaidAt ? "The cancellation window for this project has passed." : "Available for three days after the initial payment."}</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
