import { Receipt } from "lucide-react";
import Link from "next/link";
import { AreaChart } from "@/components/portal/charts/AreaChart";
import { Donut } from "@/components/portal/charts/Donut";
import { StatTile } from "@/components/portal/charts/StatTile";
import { getContext, portalMeta } from "@/components/portal/loaders";
import { monthLabel, paymentStatusLabel, paymentTypeLabel } from "@/components/portal/copy";
import { Card, EmptyState, PageHeader } from "@/components/portal/parts";
import { ReceiptLinks } from "@/components/portal/ReceiptLinks";
import { formatUsd } from "@/lib/money";
import { getAdminOverview, listPayments } from "@/lib/portal/data";
import { shortDate } from "@/lib/portal/format";

export const metadata = portalMeta("Payments");

const chip = (s: keyof typeof paymentStatusLabel) => (s === "succeeded" ? "pt-chip--done" : s === "failed" || s === "requires_action" ? "pt-chip--warn" : "pt-chip--outline");

export default async function PaymentsPage() {
  const { viewer, perspective } = await getContext("/portal/payments");
  const isAdmin = perspective === "admin";
  const [payments, overview] = await Promise.all([
    listPayments(viewer, perspective).catch(() => []),
    isAdmin ? getAdminOverview(viewer).catch(() => null) : Promise.resolve(null),
  ]);

  const list = (
    <ul className="pt-list">
      {payments.map((x) => (
        <li key={x.id} className="pt-row">
          <div className="pt-row__main">
            <Link href={`/portal/projects/${x.projectId}/payments`} className="pt-row__title">
              {isAdmin ? x.clientName : paymentTypeLabel[x.type]}
            </Link>
            <p className="pt-row__meta">
              {isAdmin && <span>{paymentTypeLabel[x.type]}</span>}
              <span>{shortDate(x.paidAt ?? x.createdAt)}</span>
            </p>
            <ReceiptLinks projectId={x.projectId} payment={x} />
          </div>
          <div className="pt-row__aside">
            <span className="pt-strong pt-num">
              {x.type === "refund" ? "-" : ""}
              {formatUsd(x.amount)}
            </span>
            <span className={`pt-chip ${chip(x.status)}`}>{paymentStatusLabel[x.status]}</span>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "Studio finance" : "Your portal"}
        title="Payments"
        sub={isAdmin ? "What has been collected, what is still owed and every payment on record." : "Your payments and receipts across projects."}
      />

      {isAdmin && overview && (
        <>
          <div className="pt-grid pt-kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}>
            <StatTile label="Collected" value={formatUsd(overview.kpis.collected)} sub="After refunds" />
            <StatTile label="Outstanding" value={formatUsd(overview.kpis.outstanding)} sub="Balances not yet paid" />
            <StatTile label="Payments recorded" value={payments.length} sub="Deposits, finals and refunds" />
          </div>
          <div className="pt-grid pt-cols-main pt-section-gap">
            <Card title="Revenue by month" note="Collected, last six months">
              <AreaChart title="Revenue collected by month, last six months" data={overview.revenueByMonth.map((m) => ({ label: monthLabel(m.month), value: m.collected }))} />
            </Card>
            <Card title="Collected and outstanding">
              <Donut collected={overview.kpis.collected} outstanding={overview.kpis.outstanding} />
            </Card>
          </div>
        </>
      )}

      <Card title={isAdmin ? "All payments" : "Receipts"} className="pt-section-gap" flush={isAdmin && payments.length > 0}>
        {payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments yet">
            {isAdmin
              ? "Payments appear here as soon as Stripe confirms them, each with an invoice and a receipt."
              : "Once you pay for a project, each payment is listed here with a downloadable invoice and a Stripe receipt."}
          </EmptyState>
        ) : isAdmin ? (
          <>
            <div className="pt-tablewrap">
              <table className="pt-table">
                <caption className="sr-only">All payments</caption>
                <thead>
                  <tr>
                    <th scope="col">Client</th>
                    <th scope="col">Type</th>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="pt-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <Link href={`/portal/projects/${x.projectId}/payments`} className="pt-table__client">
                          {x.clientName}
                        </Link>
                      </td>
                      <td>{paymentTypeLabel[x.type]}</td>
                      <td>
                        {shortDate(x.paidAt ?? x.createdAt)}
                        <ReceiptLinks projectId={x.projectId} payment={x} />
                      </td>
                      <td>
                        <span className={`pt-chip ${chip(x.status)}`}>{paymentStatusLabel[x.status]}</span>
                      </td>
                      <td className="pt-right pt-num">
                        {x.type === "refund" ? "-" : ""}
                        {formatUsd(x.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pt-cardlist" style={{ padding: "0 1.25rem" }}>
              {list}
            </div>
          </>
        ) : (
          list
        )}
      </Card>
    </>
  );
}
