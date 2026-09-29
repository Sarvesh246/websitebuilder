"use client";

import { AlertTriangle } from "lucide-react";

export default function PortalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="pt-card" style={{ maxWidth: "36rem" }}>
      <div className="pt-empty">
        <span className="pt-empty__icon">
          <AlertTriangle aria-hidden size={22} strokeWidth={1.7} />
        </span>
        <p className="pt-empty__title">This page could not load</p>
        <p>Something went wrong while loading it, and nothing was changed. Try again in a moment.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
