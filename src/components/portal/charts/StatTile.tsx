import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StatTileProps = {
  label: string;
  value: ReactNode;
  /** Small supporting line: a delta, a count, a hint. */
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "warn";
  href?: string;
  children?: ReactNode;
};

export const StatTile = ({ label, value, sub, icon: Icon, tone = "default", children }: StatTileProps) => (
  <div className={cn("pt-stat", tone === "warn" && "pt-stat--warn")}>
    <div className="pt-stat__head">
      <span className="pt-stat__label">{label}</span>
      {Icon && <Icon aria-hidden size={18} strokeWidth={1.75} className="pt-stat__icon" />}
    </div>
    <div className="pt-stat__value">{value}</div>
    {sub && <div className="pt-stat__sub">{sub}</div>}
    {children}
  </div>
);
