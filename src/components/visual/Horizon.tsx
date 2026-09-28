import { cn } from "@/lib/cn";

type Pt = readonly [number, number];

/**
 * The shared landscape. One family of static SVG ridges (far haze, nearer shade) with a lit
 * facet on the right-hand slope of each peak, so light always comes from the upper right.
 * Colours are tokens (--mtn-*), so it follows the theme. Sections and panel fragments all draw
 * from the same silhouettes, which is what makes the page read as one environment.
 */
const ridges = {
  wide: {
    w: 1600,
    h: 420,
    far: [[0, 300], [120, 232], [210, 272], [340, 168], [450, 250], [560, 204], [690, 286], [820, 190], [940, 262], [1080, 148], [1200, 240], [1320, 192], [1450, 266], [1600, 212]],
    mid: [[0, 352], [140, 292], [260, 332], [400, 240], [520, 312], [640, 272], [770, 336], [900, 252], [1030, 322], [1170, 236], [1290, 302], [1420, 268], [1600, 332]],
  },
  a: {
    w: 400,
    h: 200,
    far: [[0, 120], [70, 70], [130, 100], [200, 36], [270, 96], [340, 60], [400, 100]],
    mid: [[0, 150], [90, 104], [170, 138], [250, 86], [330, 130], [400, 112]],
  },
  b: {
    w: 400,
    h: 200,
    far: [[0, 96], [60, 60], [140, 104], [230, 30], [300, 84], [400, 50]],
    mid: [[0, 140], [110, 100], [190, 140], [300, 92], [400, 132]],
  },
  c: {
    w: 400,
    h: 200,
    far: [[0, 110], [90, 50], [150, 92], [220, 44], [310, 108], [400, 72]],
    mid: [[0, 146], [80, 112], [180, 150], [280, 96], [400, 140]],
  },
  d: {
    w: 400,
    h: 200,
    far: [[0, 84], [80, 40], [130, 76], [210, 24], [280, 80], [340, 52], [400, 92]],
    mid: [[0, 130], [100, 92], [170, 128], [260, 80], [400, 124]],
  },
} satisfies Record<string, { w: number; h: number; far: Pt[]; mid: Pt[] }>;

export type RidgeName = keyof typeof ridges;

const fill = (pts: readonly Pt[], w: number, h: number) =>
  `M${pts.map(([x, y]) => `${x} ${y}`).join("L")}L${w} ${h}L0 ${h}Z`;

/** Lit face: a wedge on the right slope of every local peak. */
const facets = (pts: readonly Pt[]) =>
  pts
    .flatMap(([x, y], i) => {
      const prev = pts[i - 1];
      const next = pts[i + 1];
      if (!prev || !next || y >= prev[1] || y >= next[1]) return [];
      return [`M${x} ${y}L${next[0]} ${next[1]}L${x + (next[0] - x) * 0.12} ${next[1]}Z`];
    })
    .join("");

export const Horizon = ({ name = "wide", className }: { name?: RidgeName; className?: string }) => {
  const { w, h, far, mid } = ridges[name];
  return (
    <svg
      aria-hidden
      focusable="false"
      className={cn("horizon", className)}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMax slice"
    >
      <path className="horizon__far" d={fill(far, w, h)} />
      <path className="horizon__far-lit" d={facets(far)} />
      <path className="horizon__mid" d={fill(mid, w, h)} />
      <path className="horizon__mid-lit" d={facets(mid)} />
    </svg>
  );
};
