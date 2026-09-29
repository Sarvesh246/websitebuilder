/**
 * Encodes the owner's backdrop photos (public/images/scenes2/*.png, gitignored sources) into the
 * WebP files the site ships. Run after adding or replacing a source: `node scripts/backdrops.mjs`.
 *
 *   backdrops/<name>-lite.webp  1280 wide q74, served only on slow / Save-Data connections.
 *   backdrops/<name>.webp     2560 wide, lanczos3 upscale + light sharpening, q88. Used at every width:
 *                             phones show it as a viewport-sized sticky backdrop, so it needs the resolution.
 *   scenes/pic-<name>[-dark].webp  photos inside the glass panes and Services cards, cropped from the
 *                             same set (light + dusk): 1600 wide q90, plus a 1000 wide "-900" copy q88
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const images = join(dirname(fileURLToPath(import.meta.url)), "../public/images");
const src = (file) => join(images, "scenes2", file);
const sources = readdirSync(join(images, "scenes2")).filter((f) => f.startsWith("ChatGPT")).sort();

/** Scene pairs, by position in the sorted source list, plus the dedicated pricing, about and intake (/start) pairs. */
const backdrops = {
  "a-light": sources[0], "a-dark": sources[1],
  "b-light": sources[2], "b-dark": sources[3],
  "c-light": sources[4], "c-dark": sources[5],
  "d-light": sources[6], "d-dark": sources[7],
  "pricing-light": "pricingpagelight.png", "pricing-dark": "pricingpagedark.png",
  "about-light": "aboutsectionlight.png", "about-dark": "aboutsectiondark.png",
  "intake-light": "intakesectionlight.png", "intake-dark": "intakesectiondark.png",
};

/**
 * Crops (in source pixels) used as the concept-site photos inside the panes and the Services cards.
 * Each light/dark source pair shares its composition, so the same box gives the dusk version.
 */
const photos = {
  peak: [6, { left: 330, top: 170, width: 860, height: 560 }],
  range: [2, { left: 0, top: 260, width: 1000, height: 600 }],
  portal: [4, { left: 760, top: 120, width: 912, height: 700 }],
};
const ownPhoto = [7, { left: 420, top: 160, width: 820, height: 600 }];

const hq = (img, width) =>
  img.resize({ width, kernel: "lanczos3" }).sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 });

for (const [name, file] of Object.entries(backdrops)) {
  await hq(sharp(src(file)), 2560).webp({ quality: 88, effort: 6, smartSubsample: true }).toFile(join(images, "backdrops", `${name}.webp`));
  // Same composition at half the pixels, for Save-Data and 3G-or-slower connections (html[data-net="slow"]).
  await hq(sharp(src(file)), 1280).webp({ quality: 74, effort: 6, smartSubsample: true }).toFile(join(images, "backdrops", `${name}-lite.webp`));
  console.log("backdrop", name);
}

const writePhoto = async (name, file, box) => {
  const crop = await sharp(src(file)).extract(box).toBuffer();
  await hq(sharp(crop), 1600).webp({ quality: 90, effort: 6 }).toFile(join(images, "scenes", `pic-${name}.webp`));
  await hq(sharp(crop), 1000).webp({ quality: 88, effort: 6 }).toFile(join(images, "scenes", `pic-${name}-900.webp`));
  console.log("photo", name);
};
for (const [name, [i, box]] of Object.entries(photos)) {
  await writePhoto(name, sources[i], box);
  await writePhoto(`${name}-dark`, sources[i + 1], box);
}
await writePhoto("own", sources[ownPhoto[0]], ownPhoto[1]);
