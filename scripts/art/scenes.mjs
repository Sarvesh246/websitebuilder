/**
 * Scene definitions for render.mjs. Units: metres-ish, y up, water at y=0, camera looks down -z.
 * Boxes: c = centre, s = half size, rot = rotation about y (radians), r = edge rounding.
 * cyl = [centre x, centre z, radius, top y] (a round plinth). `-dark` = dusk variant for the dark theme.
 * Plates are 2400x1350 (+1280 wide copy for phones); screen photos are content for the glass mockups.
 */
const plate = { width: 2400, height: 1350, sizes: [2400, 1280], quality: 72, sat: 1.0, tint: [0.985, 0.995, 1.02], bloom: 0.16, exposure: 0.74, mist: 1.0, haze: 0.002 };
const dusk = { dusk: 1, exposure: 0.8, bloom: 0.2 };
const photo = { width: 1600, height: 1000, sizes: [1600, 900], quality: 76, bloom: 0.15, amb: 0.7, exposure: 0.8 };

const plates = {
  hero: {
    ...plate,
    cam: [0, 2.1, 10], target: [2, 3.2, -20], fov: 1.45, sun: [0.62, 0.26, -0.72],
    mtnDist: 300, mtnH: 55, mtnScale: 0.005, seed: 3,
    boxes: [
      { c: [30, 6, -36], s: [7, 6, 1.5], rot: 0.62, r: 0.08 },
      { c: [22, 1.6, -22], s: [9, 1.6, 3], rot: 0.3, r: 0.08 },
    ],
    cyl: [15, 1, 12, 1.0],
  },
  why: {
    ...plate,
    cam: [0, 1.6, 10], target: [2, 3.0, -20], fov: 1.5, sun: [0.3, 0.22, -0.9],
    mtnDist: 260, mtnH: 45, mtnScale: 0.006, seed: 8,
    boxes: [
      { c: [9, 3.2, -26], s: [4, 3.2, 3], rot: 0.1, r: 0.08 },
      { c: [26, 6, -34], s: [6, 6, 2], rot: 0.5, r: 0.08 },
    ],
    cyl: [12, -2, 12, 1.1],
  },
  services: {
    ...plate,
    cam: [0, 2.2, 10], target: [2, 3.6, -20], fov: 1.5, sun: [0.7, 0.3, -0.62],
    mtnDist: 280, mtnH: 50, mtnScale: 0.0055, seed: 14,
    boxes: [
      { c: [26, 5, -18], s: [14, 5, 1.2], rot: 0.95, r: 0.08 },
      { c: [8, 0.7, 2], s: [22, 0.7, 4], rot: 0.12, r: 0.1 },
      { c: [12, 2.0, -12], s: [8, 0.35, 5], rot: 0.3, r: 0.06 },
    ],
  },
  process: {
    ...plate,
    cam: [0, 2.4, 12], target: [0, 3.4, -20], fov: 1.6, sun: [0.2, 0.3, -0.93],
    mtnDist: 220, mtnH: 60, mtnScale: 0.0055, seed: 21,
    boxes: [
      { c: [0, 0.8, 3], s: [30, 0.8, 4], rot: 0, r: 0.12 },
      { c: [46, 6, -44], s: [6, 6, 1.5], rot: 0.4, r: 0.08 },
    ],
  },
  pricing: {
    ...plate, haze: 0.0045, mist: 2.2,
    cam: [0, 1.6, 10], target: [0, 3.2, -20], fov: 1.5, sun: [0.8, 0.3, -0.5],
    mtnDist: 240, mtnH: 45, mtnScale: 0.006, seed: 5,
    boxes: [
      { c: [20, 6, -16], s: [9, 6, 1.2], rot: 1.1, r: 0.08 },
      { c: [14, 2.5, -8], s: [5, 2.5, 3], rot: 0.9, r: 0.08 },
      { c: [-18, 5, -40], s: [3, 5, 3], rot: 0.2, r: 0.08 },
    ],
  },
};

const scenes = {};
for (const [name, cfg] of Object.entries(plates)) {
  scenes[`${name}-light`] = cfg;
  scenes[`${name}-dark`] = { ...cfg, ...dusk };
}

/** Ownership: a dark concrete interior lit through a slot on the right (same in both themes). */
scenes["ownership"] = {
  ...plate, dusk: 1, room: 1, water: 0, mtnH: 0, gloss: 0.3, exposure: 1.1, bloom: 0.35, bloomThreshold: 0.6, haze: 0.0, mist: 0,
  cam: [0, 3.4, 12], target: [3, 2.6, -10], fov: 1.45, sun: [0.85, 0.4, -0.25], amb: 0.9,
  boxes: [
    { c: [0, -0.5, 0], s: [60, 0.5, 60], r: 0.02 },            // floor
    { c: [-2, 16.5, -2], s: [24, 0.5, 14], r: 0.02 },           // ceiling (ends at the walls)
    { c: [-10, 8, -14], s: [16, 8, 1], r: 0.05 },              // back wall, left of the slot
    { c: [15, 8, -14], s: [5, 8, 1], r: 0.05 },                // back wall, right of the slot
    { c: [8, 13, -14], s: [2.2, 3.5, 1], r: 0.05 },            // lintel over the slot
    { c: [21, 8, 6], s: [1, 8, 5], r: 0.05 },                  // right wall (open behind: the light source)
    { c: [21, 13, -8], s: [1, 3.5, 7], r: 0.05 },
    { c: [-24, 8, -2], s: [1, 8, 13], r: 0.05 },               // left wall
    { c: [9.5, 0.75, -3], s: [7.5, 0.75, 3.2], r: 0.06 },      // plinth
    { c: [-6, 8, -9], s: [1.1, 8, 1.1], r: 0.04 },             // column
  ],
};

/** Screen photos (content of the glass mockups). */
scenes["photo-peak"] = {
  ...photo, cam: [0, 3, 30], target: [0, 16, -60], fov: 1.9, sun: [0.85, 0.4, -0.2],
  mtnDist: 115, mtnH: 30, mtnScale: 0.009, seed: 11, haze: 0.002, mist: 0.4, snow: 0.5,
  peak: [8, -130, 75, 42], peak2: [-80, -190, 40, 50],
};
scenes["photo-range"] = {
  ...photo, cam: [0, 4, 30], target: [0, 10, -60], fov: 1.6, sun: [-0.7, 0.35, -0.3],
  mtnDist: 90, mtnH: 45, mtnScale: 0.008, seed: 17, haze: 0.003, mist: 1.2, snow: 0.55,
  peak: [-40, -170, 55, 60], peak2: [60, -200, 40, 45],
};
scenes["photo-portal"] = {
  ...photo, cam: [0, 2.6, 6], target: [3, 5, -40], fov: 1.6, sun: [0.8, 0.4, 0.15],
  mtnDist: 60, mtnH: 25, mtnScale: 0.012, seed: 33, haze: 0.0025, mist: 1.0, snow: 0.5, gloss: 1,
  peak: [18, -110, 60, 32],
  boxes: [
    { c: [-6, 5, -6], s: [0.5, 5, 6], r: 0.03 },
    { c: [-1.5, 10.2, -6], s: [5, 0.5, 6], r: 0.03 },
    { c: [-1.5, 0.15, -6], s: [5, 0.15, 6], r: 0.03 },
  ],
};

export { scenes };
