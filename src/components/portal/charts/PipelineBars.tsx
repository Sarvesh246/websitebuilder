import { cn } from "@/lib/cn";

type Row = { label: string; value: number };

type PipelineBarsProps = {
  rows: Row[];
  title: string;
  /** Count formatter; defaults to the raw number. */
  format?: (n: number) => string;
  className?: string;
};

/** Horizontal bars, one per stage. The number is always printed, so colour never carries meaning alone. */
export const PipelineBars = ({ rows, title, format = String, className }: PipelineBarsProps) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className={cn("pt-bars", className)} aria-label={title}>
      {rows.map((r) => (
        <li key={r.label} className="pt-bars__row">
          <span className="pt-bars__label">{r.label}</span>
          <span className="pt-bars__track" aria-hidden>
            <span className="pt-bars__fill" style={{ width: `${(r.value / max) * 100}%` }} data-empty={r.value === 0 || undefined} />
          </span>
          <span className="pt-bars__num">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
};
