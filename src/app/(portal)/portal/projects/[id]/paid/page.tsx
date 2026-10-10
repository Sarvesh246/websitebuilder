import { CheckCircle2, Loader } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext, loadProject, portalMeta } from "@/components/portal/loaders";
import { PaidPoller } from "@/components/portal/PaidPoller";
import { Card, PageHeader } from "@/components/portal/parts";
import { formatUsd } from "@/lib/money";

export const metadata = portalMeta("Payment confirmation");

/** Read-only. Payment state is set by the Stripe webhook; this page only reports what the database says. */
export default async function PaidPage({ params, searchParams }: PageProps<"/portal/projects/[id]/paid">) {
  const { id } = await params;
  const { viewer } = await getContext(`/portal/projects/${id}/paid`);
  const p = await loadProject(viewer, "client", id);
  if (!p) notFound();

  const sp = await searchParams;
  // This hint selects which obligation to display; only stored payment states confirm payment.
  const final = sp.payment === "final_balance";
  const confirmed = final ? p.finalPayment === "paid" : p.initialPayment === "paid";
  const remaining = p.money.remaining ?? 0;
  const split = remaining > 0;

  return (
    <div style={{ maxWidth: "40rem" }}>
      <PageHeader eyebrow="Payment" title={confirmed ? (final || !split ? "Paid in full" : "Deposit paid") : "Confirming payment"} />
      <Card>
        <div className="pt-empty" style={{ padding: "1.5rem 0.5rem" }}>
          <span className="pt-empty__icon">{confirmed ? <CheckCircle2 aria-hidden size={24} strokeWidth={1.7} /> : <Loader aria-hidden size={24} strokeWidth={1.7} />}</span>
          {confirmed ? (
            <>
              <p className="pt-empty__title">{p.stage === "cancelled" ? "Payment recorded for a cancelled project." : final ? "Balance payment confirmed. The studio will coordinate your launch." : split ? "Deposit confirmed. The studio can begin your project." : "Full payment confirmed."}</p>
              {p.stage === "cancelled" ? <p>Message the studio to confirm the cancellation and any refund.</p> : !final && split && <p>Remaining balance: {formatUsd(remaining)}. It becomes due after the included revision stage.</p>}
            </>
          ) : (
            <>
              <p className="pt-empty__title">Waiting for payment confirmation.</p>
              <p>Stripe has not confirmed this {final ? "balance" : "payment"} in your project yet. This page updates automatically. Check Payments before trying again.</p>
              <PaidPoller active />
            </>
          )}
          <Link href={`/portal/projects/${id}`} className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
            Go to project
          </Link>
          <Link href={`/portal/projects/${id}/payments`} className="pt-link">View payments</Link>
        </div>
      </Card>
    </div>
  );
}
