"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERVAL_MS = 3000;
const MAX_TICKS = 10;

/** Re-reads server state every 3s for about 30s after Stripe redirects back. It never changes payment state: only the webhook does. */
export const PaidPoller = ({ active }: { active: boolean }) => {
  const router = useRouter();
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (!active || ticks >= MAX_TICKS) return;
    const id = setTimeout(() => {
      router.refresh();
      setTicks((t) => t + 1);
    }, INTERVAL_MS);
    return () => clearTimeout(id);
  }, [active, ticks, router]);

  if (!active) return null;
  return (
    <p className="pt-small" role="status">
      {ticks >= MAX_TICKS ? "Still confirming. You can close this page; the project updates as soon as the payment clears." : "Confirming the payment with Stripe"}
    </p>
  );
};
