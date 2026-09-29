"use client";

import { Check, Clock, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { paymentTerms } from "@/config/payment";
import { formatCents } from "@/lib/payments/plan";
import type { PayView } from "@/lib/payments/view";

const POLL_MS = 3000;
const POLL_MAX = 10;

const money = (cents: number | null) => (cents === null ? "To be quoted" : formatCents(cents));

/**
 * Payment status and actions for one project. It only DISPLAYS state loaded by the server and starts
 * Checkout; it never marks anything paid (returning from Stripe just polls for the webhook's result).
 */
export const PayPanel = ({ view, returned }: { view: PayView | null; returned: "success" | "cancelled" | null }) => {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const consentId = useId();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  const waiting = returned === "success" && !!view && (view.phase === "pay_initial" || view.phase === "final_due" || view.phase === "final_processing");
  useEffect(() => {
    if (!waiting) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      if (++tries > POLL_MAX) return window.clearInterval(timer);
      router.refresh();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [waiting, router]);
  useEffect(() => headingRef.current?.focus(), [view?.phase]);

  if (!view) {
    return (
      <GlassSurface variant="elevated" className="success">
        <h1 ref={headingRef} tabIndex={-1} className="t-h2 success__title">Payment is unavailable.</h1>
        <p className="t-lead">Project payments can&apos;t be loaded right now. Nothing has been charged. Please try again later.</p>
        <Button href="/" variant="secondary" icon="right">Back to Northframe</Button>
      </GlassSurface>
    );
  }

  const post = async (url: string, body: Record<string, unknown>) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(20_000) });
    const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
    return { ok: res.ok, data };
  };

  const pay = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await post("/api/checkout", { projectId: view.id, accept: accepted });
      if (ok && data.url) return void window.location.assign(data.url);
      setError(data.message ?? "Something went wrong. Nothing was charged.");
    } catch {
      setError("Something went wrong. Nothing was charged. Please try again.");
    }
    setBusy(false);
  };

  const requestCancel = async () => {
    setBusy(true);
    setError("");
    try {
      const { ok } = await post(`/api/projects/${view.id}/cancel-request`, {});
      if (ok) setCancelled(true);
      else setError("We couldn't record that. Please try again.");
    } catch {
      setError("We couldn't record that. Please try again.");
    }
    setBusy(false);
  };

  const { phase } = view;
  const split = view.hasBalanceLater;
  const heading = {
    quote: "Your project quote is on its way.",
    pay_initial: waiting ? "Payment received. Confirming…" : split ? "Start your project." : "Pay to start your project.",
    deposit_paid: "Deposit paid. Your project can begin.",
    paid_full: "Paid in full.",
    final_due: waiting ? "Payment received. Confirming…" : "Your remaining balance is due.",
    final_processing: "Confirming your final payment…",
    complete: view.readyForLaunch ? "Paid in full. Ready for launch." : "Paid in full.",
    cancelled: "This project was cancelled.",
    refunded: "This project was refunded.",
  }[phase];

  return (
    <GlassSurface variant="elevated" className="success pay">
      <span className="success__icon" aria-hidden>
        {waiting || phase === "final_processing" ? <Clock size={22} /> : phase === "final_due" ? <TriangleAlert size={22} /> : <Check size={22} strokeWidth={2.25} />}
      </span>
      <h1 ref={headingRef} tabIndex={-1} className="t-h2 success__title">{heading}</h1>
      <p className="sr-only" aria-live="polite">{waiting ? "Confirming your payment." : ""}</p>

      {returned === "cancelled" && (phase === "pay_initial" || phase === "final_due") && (
        <p className="t-body">Checkout was cancelled. Nothing was charged.</p>
      )}
      {phase === "quote" && <p className="t-lead">This Custom project doesn&apos;t have a confirmed price yet. I&apos;ll follow up by email with a quote before anything is charged.</p>}
      {phase === "deposit_paid" && <p className="t-lead">The remaining balance becomes due after the included revision stage. Launch or delivery happens after it is paid.</p>}
      {phase === "paid_full" && <p className="t-lead">Thank you. Your project can begin, and there is nothing else to pay.</p>}
      {phase === "final_due" && !waiting && <p className="t-lead">The saved payment method couldn&apos;t be charged automatically. You can pay the remaining balance securely with any card. Launch or delivery happens after it is paid.</p>}

      {phase !== "quote" && phase !== "cancelled" && phase !== "refunded" && (
        <dl className="pay__rows" aria-label="Payment summary">
          <div><dt>{view.packageName} project total</dt><dd>{money(view.totalCents)}</dd></div>
          {phase === "pay_initial" ? (
            <>
              <div className="pay__strong"><dt>Due today</dt><dd>{money(view.dueTodayCents)}</dd></div>
              <div><dt>{split ? "Due after revisions" : "Remaining after payment"}</dt><dd>{money(split ? view.dueLaterCents : 0)}</dd></div>
            </>
          ) : (
            <>
              <div><dt>Paid</dt><dd>{formatCents(view.paidCents)}</dd></div>
              <div className="pay__strong"><dt>Remaining balance</dt><dd>{formatCents(view.remainingCents ?? 0)}</dd></div>
            </>
          )}
        </dl>
      )}

      {phase === "pay_initial" && !waiting && (
        <>
          <div className="pay__consent">
            <input id={consentId} type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <label htmlFor={consentId}>
              {split ? paymentTerms.authorizationSplit : paymentTerms.authorizationFull} I have read the{" "}
              <a href="/terms#payments">payment terms and {paymentTerms.cancellation.title}</a>.
            </label>
          </div>
          <Button type="button" size="lg" onClick={pay} disabled={!accepted || busy} aria-busy={busy}>
            {busy ? "Opening secure checkout…" : `Pay ${money(view.dueTodayCents)}`}
          </Button>
          <p className="t-small pay__note">Secure checkout by Stripe. No commitment beyond the amount shown today.</p>
        </>
      )}
      {phase === "final_due" && !waiting && (
        <Button type="button" size="lg" onClick={pay} disabled={busy} aria-busy={busy}>
          {busy ? "Opening secure checkout…" : `Pay remaining balance ${formatCents(view.remainingCents ?? 0)}`}
        </Button>
      )}

      {view.canRequestCancellation && !cancelled && (
        <div className="pay__cancel">
          <p className="t-small"><strong>{paymentTerms.cancellation.title}.</strong> {paymentTerms.cancellation.body}</p>
          <Button type="button" variant="link" onClick={requestCancel} disabled={busy}>Request cancellation</Button>
        </div>
      )}
      {(cancelled || view.cancellationRequested) && phase !== "cancelled" && phase !== "refunded" && (
        <p className="t-small">Your cancellation request was received. I&apos;ll review it under the policy and reply by email. No refund is issued automatically.</p>
      )}
      {error && <p role="alert" className="pay__error">{error}</p>}
      <Button href="/" variant="secondary" icon="right">Back to Northframe</Button>
    </GlassSurface>
  );
};
