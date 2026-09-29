"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { startCheckout } from "@/lib/payments/actions";
import { useAction } from "./useAction";

type CheckoutFormProps = {
  projectId: string;
  amountLabel: string;
  authorization: string;
  policyTitle: string;
};

export const CheckoutForm = ({ projectId, amountLabel, authorization, policyTitle }: CheckoutFormProps) => {
  const [authorized, setAuthorized] = useState(false);
  const [terms, setTerms] = useState(false);
  const { pending, error, run } = useAction();
  const ready = authorized && terms;

  return (
    <form
      className="pt-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        run(() => startCheckout(projectId, true), {
          refresh: false,
          onOk: (r) => {
            if (r.url) window.location.assign(r.url);
          },
        });
      }}
    >
      <label className="pt-check">
        <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} />
        <span>{authorization}</span>
      </label>
      <label className="pt-check">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>
          I have read the{" "}
          <Link href="/terms" target="_blank" className="pt-link" style={{ minHeight: 0 }}>
            Terms
          </Link>{" "}
          and the {policyTitle} shown below.
        </span>
      </label>
      {error && (
        <p className="pt-msg pt-msg--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!ready || pending} aria-busy={pending}>
        <Lock aria-hidden size={17} strokeWidth={1.9} />
        {pending ? "Opening secure checkout" : `Pay ${amountLabel}`}
      </button>
      <p className="pt-small" style={{ textAlign: "center" }}>
        You will finish on Stripe&apos;s secure page. Northframe never sees your card details.
      </p>
    </form>
  );
};
