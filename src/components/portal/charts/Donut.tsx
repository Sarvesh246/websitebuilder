import { formatUsd } from "@/lib/money";

type DonutProps = {
  collected: number;
  outstanding: number;
  title?: string;
};

const SIZE = 160;
const STROKE = 20;

/** Collected vs outstanding, in cents. Legend and centre text carry the numbers. */
export const Donut = ({ collected, outstanding, title = "Collected versus outstanding" }: DonutProps) => {
  const total = collected + outstanding;
  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const share = total > 0 ? collected / total : 0;
  const gap = total > 0 && collected > 0 && outstanding > 0 ? 6 : 0;
  const collectedLen = Math.max(0, c * share - gap);
  const pct = Math.round(share * 100);

  return (
    <div className="pt-donut" role="group" aria-label={title}>
      <div className="pt-donut__chart">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} aria-hidden>
          <circle className="pt-donut__rest" cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" strokeWidth={STROKE} />
          {collectedLen > 0 && (
            <circle
              className="pt-donut__got"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${collectedLen} ${c}`}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          )}
        </svg>
        <div className="pt-donut__center">
          <span className="pt-donut__pct">{total > 0 ? `${pct}%` : "0%"}</span>
          <span className="pt-donut__cap">collected</span>
        </div>
      </div>
      <dl className="pt-donut__legend">
        <div>
          <dt>
            <i className="pt-swatch pt-swatch--accent" aria-hidden /> Collected
          </dt>
          <dd>{formatUsd(collected)}</dd>
        </div>
        <div>
          <dt>
            <i className="pt-swatch pt-swatch--rest" aria-hidden /> Outstanding
          </dt>
          <dd>{formatUsd(outstanding)}</dd>
        </div>
      </dl>
    </div>
  );
};
