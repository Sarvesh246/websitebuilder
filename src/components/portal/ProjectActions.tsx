"use client";

import { BadgeCheck, CreditCard, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { payRemainingBalance, collectFinalPayment, refundPayment, requestCancellation } from "@/lib/payments/actions";
import { approveFinalVersion } from "@/lib/portal/actions";
import { useAction } from "./useAction";

const Feedback = ({ error, notice }: { error: string | null; notice: string | null }) => (
  <>
    {error && (
      <p className="pt-msg pt-msg--error" role="alert">
        {error}
      </p>
    )}
    {notice && (
      <p className="pt-msg" role="status">
        {notice}
      </p>
    )}
  </>
);

/** Native modal confirm. Focus is trapped and Escape closes it by the platform. */
const ConfirmDialog = ({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  busy: boolean;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId(); // several dialogs can share a page
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="pt-dialog"
      onClose={onClose}
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{title}</h2>
      <div className="pt-small">{children}</div>
      <div className="pt-dialog__actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onConfirm} disabled={busy} aria-busy={busy}>
          {busy ? "Working" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
};

/**
 * Approving completes the revision stage. When a balance is due on the saved card, the client confirms the
 * exact amount first, because approval is what triggers that charge (see approveFinalVersion).
 */
export const ApproveButton = ({ projectId, chargeLabel }: { projectId: string; chargeLabel?: string | null }) => {
  const [open, setOpen] = useState(false);
  const { pending, error, notice, run } = useAction();
  const approve = () =>
    run(() => approveFinalVersion(projectId), {
      success: (r) => (r as { notice?: string }).notice ?? "",
      onOk: () => setOpen(false),
    });
  return (
    <div className="pt-stack">
      <button type="button" className="btn btn-primary" disabled={pending} aria-busy={pending} onClick={() => (chargeLabel ? setOpen(true) : approve())}>
        <BadgeCheck aria-hidden size={17} strokeWidth={1.9} />
        {pending ? "Approving" : "Approve final version"}
      </button>
      {chargeLabel && (
        <ConfirmDialog open={open} onClose={() => setOpen(false)} title="Approve and pay the balance?" confirmLabel={`Approve and pay ${chargeLabel}`} onConfirm={approve} busy={pending}>
          <p>Approving ends the revision rounds. Your remaining balance of {chargeLabel} is then charged to the card you saved at checkout, as you authorized.</p>
        </ConfirmDialog>
      )}
      <Feedback error={error} notice={notice} />
    </div>
  );
};

export const PayBalanceButton = ({ projectId, amountLabel }: { projectId: string; amountLabel: string }) => {
  const { pending, error, run } = useAction();
  return (
    <div className="pt-stack">
      <button
        type="button"
        className="btn btn-primary"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          run(() => payRemainingBalance(projectId), {
            refresh: false,
            onOk: (r) => {
              if (r.url) window.location.assign(r.url);
            },
          })
        }
      >
        <CreditCard aria-hidden size={17} strokeWidth={1.9} />
        {pending ? "Opening secure checkout" : `Pay ${amountLabel}`}
      </button>
      <Feedback error={error} notice={null} />
    </div>
  );
};

const outcomeText: Record<string, string> = {
  paid: "Final payment collected.",
  already_paid: "The final payment was already collected.",
  processing: "The payment is processing. This page will update when it is confirmed.",
  requires_action: "The card needs the client to confirm the payment. Ask them to use Pay remaining balance.",
  failed: "The card was declined. The client can pay the balance through checkout.",
  not_eligible: "This project is not ready for final payment.",
};

export const CollectFinalButton = ({ projectId, amountLabel, disabled }: { projectId: string; amountLabel: string; disabled?: boolean }) => {
  const [open, setOpen] = useState(false);
  const { pending, error, notice, run } = useAction();
  return (
    <div className="pt-stack">
      <button type="button" className="btn btn-primary" disabled={disabled || pending} onClick={() => setOpen(true)}>
        Complete revisions and collect final payment
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Collect the final payment?"
        confirmLabel={`Charge ${amountLabel}`}
        busy={pending}
        onConfirm={() =>
          run(() => collectFinalPayment(projectId), {
            success: (r) => outcomeMessage(r.outcome, r.message),
            onOk: () => setOpen(false),
          })
        }
      >
        <p>
          This marks revisions complete and charges the saved card {amountLabel} once. If the card is declined nothing is retried automatically, and the client is
          asked to pay through checkout.
        </p>
      </ConfirmDialog>
      <Feedback error={error} notice={notice} />
    </div>
  );
};

/** Turns the structured outcome into words the studio can act on. */
export const outcomeMessage = (outcome: string | undefined, fallback?: string) => (outcome && outcomeText[outcome]) || fallback || "";

export const RefundForm = ({ projectId, payments }: { projectId: string; payments: { id: string; label: string; amountCents: number }[] }) => {
  const [chosenId, setPaymentId] = useState(payments[0]?.id ?? "");
  // After a refresh the list can change (a payment fully refunded drops out): never submit a stale id.
  const paymentId = payments.some((p) => p.id === chosenId) ? chosenId : (payments[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const { pending, error, notice, run } = useAction();
  if (payments.length === 0) return <p className="pt-small">No refundable payments yet.</p>;

  const cents = amount.trim() === "" ? undefined : Math.round(Number(amount) * 100);
  const invalid = cents !== undefined && (!Number.isFinite(cents) || cents <= 0);

  return (
    <div className="pt-stack">
      <div className="pt-form-row">
        <div className="pt-field">
          <label htmlFor="pt-refund-pay">Payment</label>
          <select id="pt-refund-pay" className="pt-select" value={paymentId} onChange={(e) => setPaymentId(e.target.value)}>
            {payments.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="pt-field">
          <label htmlFor="pt-refund-amt">Amount in dollars (blank = full)</label>
          <input id="pt-refund-amt" className="pt-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Full amount" />
        </div>
        <button type="button" className="btn btn-secondary btn-sm" disabled={invalid || !paymentId || pending} onClick={() => setConfirming(true)}>
          <RotateCcw aria-hidden size={15} />
          Refund
        </button>
      </div>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Issue this refund?"
        confirmLabel="Issue refund"
        busy={pending}
        onConfirm={() => run(() => refundPayment(projectId, paymentId, cents), { success: "Refund issued.", onOk: () => setConfirming(false) })}
      >
        <p>The refund goes back to the original payment method through Stripe. It cannot be undone.</p>
      </ConfirmDialog>
      <Feedback error={error} notice={notice} />
    </div>
  );
};

export const RequestCancellationButton = ({ projectId }: { projectId: string }) => {
  const [open, setOpen] = useState(false);
  const { pending, error, notice, run } = useAction();
  return (
    <div className="pt-stack">
      <button type="button" className="btn btn-secondary btn-sm btn-danger" onClick={() => setOpen(true)} disabled={pending}>
        <XCircle aria-hidden size={15} />
        Request cancellation
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Request cancellation?"
        confirmLabel="Send request"
        busy={pending}
        onConfirm={() => run(() => requestCancellation(projectId), { success: "Cancellation requested. The studio will follow up.", onOk: () => setOpen(false) })}
      >
        <p>This sends a request to the studio. Nothing is refunded automatically; any approved refund follows the cancellation policy.</p>
      </ConfirmDialog>
      <Feedback error={error} notice={notice} />
    </div>
  );
};
