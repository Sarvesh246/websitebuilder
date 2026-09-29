type SparklineProps = { values: number[]; label: string; width?: number; height?: number };

/** Tiny trend line for tiles. Decorative next to a printed number; label names the series for assistive tech. */
export const Sparkline = ({ values, label, width = 96, height = 28 }: SparklineProps) => {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 3 - ((v - min) / span) * (height - 6)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg className="pt-spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={label}>
      <path d={d} fill="none" className="pt-spark__line" />
      <circle cx={last[0]} cy={last[1]} r={3} className="pt-spark__dot" />
    </svg>
  );
};
