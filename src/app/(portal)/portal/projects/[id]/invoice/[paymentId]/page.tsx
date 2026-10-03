import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/portal/PrintButton";
import { getContext, loadProject, portalMeta } from "@/components/portal/loaders";
import { paymentTypeLabel, projectTitle } from "@/components/portal/copy";
import { packageName } from "@/components/portal/parts";
import { siteConfig } from "@/config/site";
import { formatUsd } from "@/lib/money";
import { shortDate } from "@/lib/portal/format";
import { invoiceNumber, isInvoiceable } from "@/lib/portal/workflow";

export const metadata = portalMeta("Invoice");

/** Printable invoice for one received payment. "Save as PDF" is the browser's print dialog, styled by @media print. */
export default async function InvoicePage({ params }: PageProps<"/portal/projects/[id]/invoice/[paymentId]">) {
  const { id, paymentId } = await params;
  const { viewer, perspective } = await getContext(`/portal/projects/${id}/invoice/${paymentId}`);
  const p = await loadProject(viewer, perspective, id);
  const pay = p?.payments.find((x) => x.id === paymentId);
  if (!p || !pay || !isInvoiceable(pay)) notFound();

  const number = invoiceNumber(pay);
  const issued = pay.paidAt ?? pay.createdAt;
  const host = new URL(siteConfig.url).host;
  const refunded = pay.status === "refunded" ? "Refunded in full" : pay.status === "partially_refunded" ? "Partly refunded" : null;

  return (
    <>
      <div className="pt-invoice-bar">
        <Link href={`/portal/projects/${id}/payments`} className="pt-back">
          <ArrowLeft aria-hidden size={16} strokeWidth={1.9} />
          Back to payments
        </Link>
        <div className="pt-head__actions">
          {pay.receiptUrl && (
            <a href={pay.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              Stripe receipt
              <ExternalLink aria-hidden size={15} strokeWidth={1.9} />
            </a>
          )}
          <PrintButton />
        </div>
      </div>

      <article className="pt-invoice" aria-labelledby="pt-invoice-title">
        <header className="pt-invoice__head">
          <div>
            <p className="pt-invoice__brand">{siteConfig.name}</p>
            <p className="pt-invoice__muted">{siteConfig.descriptor}</p>
            <p className="pt-invoice__muted">{host}</p>
            {siteConfig.contactEmail && <p className="pt-invoice__muted">{siteConfig.contactEmail}</p>}
          </div>
          <div className="pt-invoice__title">
            <h1 id="pt-invoice-title">Invoice</h1>
            <span className="pt-invoice__paid">{refunded ?? "Paid"}</span>
          </div>
        </header>

        <dl className="pt-invoice__meta">
          <div>
            <dt>Invoice number</dt>
            <dd>{number}</dd>
          </div>
          <div>
            <dt>Date paid</dt>
            <dd>{shortDate(issued)}</dd>
          </div>
          <div>
            <dt>Payment method</dt>
            <dd>Card, via Stripe</dd>
          </div>
        </dl>

        <section className="pt-invoice__party" aria-label="Billed to">
          <p className="pt-invoice__label">Billed to</p>
          <p className="pt-invoice__strong">{p.clientName}</p>
          {p.organization && <p>{p.organization}</p>}
          <p>{p.email}</p>
        </section>

        <table className="pt-invoice__table">
          <thead>
            <tr>
              <th scope="col">Description</th>
              <th scope="col" className="pt-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="pt-invoice__strong">
                  {packageName(p.package)} website package, {paymentTypeLabel[pay.type].toLowerCase()}
                </span>
                <span className="pt-invoice__muted">{projectTitle(p)}</span>
              </td>
              <td className="pt-right pt-num">{formatUsd(pay.amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total paid</th>
              <td className="pt-right pt-num">{formatUsd(pay.amount)}</td>
            </tr>
          </tfoot>
        </table>

        {p.money.total != null && (
          <p className="pt-invoice__summary">
            Project total {formatUsd(p.money.total)} · Paid to date {formatUsd(p.money.paid)} · Remaining {formatUsd(Math.max(0, p.money.remaining ?? 0))}
          </p>
        )}
        {refunded && <p className="pt-invoice__summary">{refunded}. Refunds go back to the original card through Stripe.</p>}
        <p className="pt-invoice__foot">Thank you for working with {siteConfig.name}. Amounts are in US dollars.</p>
      </article>
    </>
  );
}
