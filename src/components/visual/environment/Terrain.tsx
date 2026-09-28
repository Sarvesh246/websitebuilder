import { useId } from "react";

/**
 * Procedural mountain terrain, one lighting model for the whole site: light comes from the upper
 * left, so the left face of every peak is lit and the right face is shaded. Output is three
 * atmospheric layers (far, mid, near); nearer layers are darker and crisper, farther ones fade
 * into mist. Deterministic per seed (no randomness at runtime) and a few kilobytes of SVG path
 * data, so it costs no image weight. Colours are tokens (--terrain-*), so dark theme and the
 * ownership dusk section re-light it with no extra markup.
 */

type Pt = [number, number];
type Layer = { className: string; points: Pt[]; peaks: { l: Pt; p: Pt; r: Pt; f: Pt }[] };

const W = 1440;
const H = 520;

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildLayer = (className: string, seed: number, base: number, amp: number, count: number): Layer => {
  const rand = rng(seed);
  const step = (W + 240) / count;
  const points: Pt[] = [[-120, base + amp * 0.2]];
  const peaks: Layer["peaks"] = [];
  let prevValley: Pt = points[0];
  for (let i = 0; i < count; i++) {
    const x0 = -120 + i * step;
    const peak: Pt = [x0 + step * (0.35 + rand() * 0.3), base - amp * (0.45 + rand() * 0.55)];
    const valley: Pt = [x0 + step, base + amp * (0.05 + rand() * 0.2) - amp * 0.05];
    // craggy midpoints on each slope
    const mid1: Pt = [(prevValley[0] + peak[0]) / 2 + (rand() - 0.5) * step * 0.12, (prevValley[1] + peak[1]) / 2 - rand() * amp * 0.08];
    const mid2: Pt = [(peak[0] + valley[0]) / 2 + (rand() - 0.5) * step * 0.12, (peak[1] + valley[1]) / 2 + rand() * amp * 0.06];
    points.push(mid1, peak, mid2, valley);
    const fold: Pt = [peak[0] + (rand() - 0.5) * step * 0.16, peak[1] + (Math.max(prevValley[1], valley[1]) - peak[1]) * (0.5 + rand() * 0.2)];
    peaks.push({ l: prevValley, p: peak, r: valley, f: fold });
    prevValley = valley;
  }
  return { className, points, peaks };
};

const d = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(0)} ${y.toFixed(0)}`).join("");
const closed = (pts: Pt[]) => `${d(pts)}L${W + 120} ${H}L-120 ${H}Z`;
const poly = (pts: Pt[]) => `${d(pts)}Z`;

type TerrainProps = {
  seed?: number;
  /** Rough peak height relative to the viewBox. Lower for quiet sections. */
  relief?: number;
  /** How many of the three layers to draw (mobile-light scenes use 2). */
  layers?: 2 | 3;
  className?: string;
};

export const Terrain = ({ seed = 7, relief = 1, layers = 3, className }: TerrainProps) => {
  const uid = useId().replace(/:/g, "");
  const all: Layer[] = [
    buildLayer("terrain__far", seed, 260, 190 * relief, 9),
    buildLayer("terrain__mid", seed + 11, 350, 160 * relief, 8),
    buildLayer("terrain__near", seed + 23, 440, 120 * relief, 6),
  ];
  const drawn = layers === 2 ? [all[0], all[2]] : all;
  return (
    <svg
      className={className ? `terrain ${className}` : "terrain"}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      focusable="false"
    >
      <defs>
        {drawn.map((l) => (
          <linearGradient key={l.className} id={`${uid}-${l.className}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: `var(--${l.className.replace("__", "-")})` }} />
            <stop offset="0.85" style={{ stopColor: `color-mix(in srgb, var(--${l.className.replace("__", "-")}) 35%, var(--mist))` }} />
          </linearGradient>
        ))}
      </defs>
      {drawn.map((l) => (
        <g key={l.className} className={l.className}>
          <path d={closed(l.points)} fill={`url(#${uid}-${l.className})`} />
          <g className="terrain__lit">
            {l.peaks.map((k, i) => (
              <path key={i} d={poly([k.l, k.p, k.f])} />
            ))}
          </g>
          <g className="terrain__shade">
            {l.peaks.map((k, i) => (
              <path key={i} d={poly([k.p, k.r, k.f])} />
            ))}
          </g>
          <path className="terrain__rim" d={d(l.points)} fill="none" />
        </g>
      ))}
    </svg>
  );
};
