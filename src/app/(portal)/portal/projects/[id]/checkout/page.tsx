import { notFound, redirect } from "next/navigation";
import { CheckoutForm } from "@/components/portal/CheckoutForm";
import { getContext, loadProject, portalMeta } from "@/components/portal/loaders";
import { Card, PageHeader, packageName } from "@/components/portal/parts";
import { projectTitle } from "@/components/portal/copy";
import { cancellationPolicy, paymentAuthorization } from "@/config/payments";
import { formatUsd } from "@/lib/money";

export const metadata = portalMeta("Checkout");

export default async function CheckoutPage({ params }: PageProps<"/portal/projects/[id]/checkout">) {
  const { id } = await params;
  const { viewer } = await getContext(`/portal/projects/${id}/checkout`);
  // Always the client perspective: only the owner can pay for a project, admins included.
  const p = await loadProject(viewer, "client", id);
  if (!p) notFound();
  if (p.initialPayment === "paid" || p.stage === "cancelled" || p.money.deposit == null) redirect(`/portal/projects/${id}`);

  const split = (p.money.remaining ?? 0) > 0;
  const today = p.money.deposit;

  return (
    <div style={{ maxWidth: "62rem" }}>
      <PageHeader back={{ href: `/portal/projects/${id}`, label: "Back to project" }} eyebrow="Checkout" title="Start your project" sub={`${projectTitle(p)} · ${packageName(p.package)} package`} />
      <div className="pt-grid pt-cols-side" style={{ alignItems: "start" }}>
        <Card title="Confirm and pay">
          <div className="pt-stack">
            <CheckoutForm projectId={id} amountLabel={formatUsd(today)} authorization={paymentAuthorization(split)} policyTitle={cancellationPolicy.title} />
            <div className="pt-legal">
              <p className="pt-strong" style={{ marginBottom: "0.4rem" }}>
                {cancellationPolicy.title}
              </p>
              {cancellationPolicy.body.map((line) => (
                <p key={line} style={{ marginBottom: "0.4rem" }}>
                  {line}
                </p>
              ))}
              <p>{cancellationPolicy.note}</p>
            </div>
          </div>
        </Card>

        <Card title="Order summary">
          <dl className="pt-money">
            <div>
              <dt>Project total</dt>
              <dd>{formatUsd(p.money.total)}</dd>
            </div>
            <div>
              <dt>Due today</dt>
              <dd>{formatUsd(today)}</dd>
            </div>
            <div>
              <dt>{split ? "Due after revisions" : "Remaining"}</dt>
              <dd>{split ? formatUsd(p.money.remaining) : "Paid in full"}</dd>
            </div>
            <div className="pt-money__total">
              <dt className="pt-strong">Pay today</dt>
              <dd>{formatUsd(today)}</dd>
            </div>
          </dl>
          <p className="pt-small" style={{ marginTop: "1rem" }}>
            {split
              ? "The remaining balance is only charged after the included revisions are finished. Launch happens after it is paid."
              : "A single payment covers the whole project."}
          </p>
        </Card>
      </div>
    </div>
  );
}
