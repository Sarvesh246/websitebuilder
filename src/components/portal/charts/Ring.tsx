"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type RingProps = {
  /** 0 to 100. */
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  caption?: string;
  className?: string;
};

/** Large progress ring. Client only so the arc can ease in once after mount (transform-free stroke transition). */
export const Ring = ({ value, size = 200, stroke = 14, label = "Project progress", caption, className }: RingProps) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("pt-ring", className)} style={{ width: size, height: size }} role="img" aria-label={`${label}: ${pct} percent`}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
        <circle className="pt-ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="pt-ring__arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="pt-ring__center">
        <span className="pt-ring__num">
          {pct}
          <small>%</small>
        </span>
        {caption && <span className="pt-ring__cap">{caption}</span>}
      </div>
    </div>
  );
};
