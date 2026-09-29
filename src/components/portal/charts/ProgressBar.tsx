import { cn } from "@/lib/cn";

type ProgressBarProps = {
  /** 0 to 100. */
  value: number;
  /** Visible text label; also used as the accessible name. */
  label?: string;
  /** Show the percentage as text beside the bar (never colour alone). */
  showValue?: boolean;
  tone?: "accent" | "warn" | "muted";
  size?: "sm" | "md";
  className?: string;
};

export const ProgressBar = ({ value, label, showValue = true, tone = "accent", size = "md", className }: ProgressBarProps) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("pt-progress", `pt-progress--${size}`, `pt-progress--${tone}`, className)}>
      <div className="pt-progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label ?? "Progress"}>
        <span className="pt-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      {showValue && <span className="pt-progress__value">{pct}%</span>}
    </div>
  );
};
