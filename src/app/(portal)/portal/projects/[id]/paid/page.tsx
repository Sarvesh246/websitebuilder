import { CheckCircle2, Loader } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext, loadProject, portalMeta } from "@/components/portal/loaders";
import { PaidPoller } from "@/components/portal/PaidPoller";
import { Card, PageHeader } from "@/components/portal/parts";
import { formatUsd } from "@/lib/money";

export const metadata = portalMeta("Payment received");

/** Read-only. Payment state is set by the Stripe webhook; this page only reports what the database says. */
export default async function PaidPage({ params }: PageProps<"/portal/projects/[id]/paid">) {
  const { id } = await params;
  const { viewer } = await getContext(`/portal/projects/${id}/paid`);
  const p = await loadProject(viewer, "client", id);
  if (!p) notFound();

  const confirmed = p.initialPayment === "paid";
  const remaining = p.money.remaining ?? 0;
  const split = remaining > 0;

  return (
    <div style={{ maxWidth: "40rem" }}>
      <PageHeader eyebrow="Payment" title={confirmed ? (split ? "Deposit paid" : "Paid in full") : "Payment received"} />
      <Card>
        <div className="pt-empty" style={{ padding: "1.5rem 0.5rem" }}>
          <span className="pt-empty__icon">{confirmed ? <CheckCircle2 aria-hidden size={24} strokeWidth={1.7} /> : <Loader aria-hidden size={24} strokeWidth={1.7} />}</span>
          {confirmed ? (
            <>
              <p className="pt-empty__title">{split ? "Deposit paid. Project can now begin." : "Paid in full. Project can now begin."}</p>
              {split && <p>Remaining balance: {formatUsd(remaining)}. The remaining balance becomes due after the included revision stage.</p>}
            </>
          ) : (
            <>
              <p className="pt-empty__title">Payment received. Confirming it now.</p>
              <p>This usually takes a few seconds. Your project unlocks as soon as it is confirmed.</p>
              <PaidPoller active />
            </>
          )}
          <Link href={`/portal/projects/${id}`} className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
            Go to project
          </Link>
        </div>
      </Card>
    </div>
  );
}
