import { formatUsd } from "@/lib/money";

type Point = { label: string; value: number };

type AreaChartProps = {
  data: Point[];
  /** Accessible name and table caption. */
  title: string;
};

const W = 640;
const H = 240;
const PAD = { t: 16, r: 16, b: 32, l: 52 };

const niceMax = (max: number) => {
  if (max <= 0) return 10_000;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
};

/** Revenue-style area chart. Values are integer cents. Server rendered; the sr-only table is the accessible form. */
export const AreaChart = ({ data, title }: AreaChartProps) => {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const pts = data.map((d, i) => [x(i), y(d.value)] as const);
  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)} ${PAD.t + ih} L${pts[0][0].toFixed(1)} ${PAD.t + ih} Z` : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  return (
    <figure className="pt-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="pt-chart__svg">
        <defs>
          <linearGradient id="pt-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line className="pt-chart__grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
            <text className="pt-chart__tick" x={PAD.l - 8} y={y(t) + 4} textAnchor="end">
              {formatUsd(Math.round(t), { compact: true })}
            </text>
          </g>
        ))}
        {area && <path d={area} fill="url(#pt-area-fill)" />}
        {line && <path d={line} className="pt-chart__line" fill="none" />}
        {pts.map(([px, py], i) => (
          <g key={data[i].label}>
            <circle cx={px} cy={py} r={4.5} className="pt-chart__dot" />
            <text className="pt-chart__tick" x={px} y={H - 10} textAnchor="middle">
              {data[i].label}
            </text>
          </g>
        ))}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Collected</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{formatUsd(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
