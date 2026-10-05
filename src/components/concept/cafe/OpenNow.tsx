"use client";

import { useEffect, useState } from "react";

/** Opening hours by weekday index (0 = Sunday), [open, close] in 24h. */
const HOURS: Record<number, [number, number]> = {
  0: [8, 17],
  1: [7, 18],
  2: [7, 18],
  3: [7, 18],
  4: [7, 18],
  5: [7, 18],
  6: [8, 17],
};

const fmt = (h: number) => `${h > 12 ? h - 12 : h}${h >= 12 ? "pm" : "am"}`;

type State = { open: boolean; label: string } | null;

const compute = (now: Date): State => {
  const day = now.getDay();
  const t = now.getHours() + now.getMinutes() / 60;
  const [o, c] = HOURS[day];
  if (t >= o && t < c) return { open: true, label: `Open now, until ${fmt(c)}` };
  if (t < o) return { open: false, label: `Closed, opens today at ${fmt(o)}` };
  const next = HOURS[(day + 1) % 7];
  return { open: false, label: `Closed, opens tomorrow at ${fmt(next[0])}` };
};

export const OpenNow = () => {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    const tick = () => setState(compute(new Date()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="cafe-status" data-open={state ? String(state.open) : "unknown"} role="status">
      <span className="cafe-status__dot" aria-hidden />
      <span>{state ? state.label : "Hours today: see below"}</span>
    </p>
  );
};
