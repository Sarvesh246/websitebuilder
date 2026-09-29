/**
 * Encodes the owner's backdrop photos (public/images/scenes2/*.png, gitignored sources) into the
 * WebP files the site ships. Run after adding or replacing a source: `node scripts/backdrops.mjs`.
 *
 *   backdrops/<name>.webp     2560 wide, lanczos3 upscale + light sharpening, q88 (desktop, retina)
 *   backdrops/<name>-sm.webp  1400 wide, q84 (phones and small tablets)
 *   scenes/pic-<name>.webp    screen photos inside the glass panes, cropped from the same set:
 *                             1600 wide q88, plus -900 q84 for small panes / services cards
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const images = join(dirname(fileURLToPath(import.meta.url)), "../public/images");
const src = (file) => join(images, "scenes2", file);
const sources = readdirSync(join(images, "scenes2")).filter((f) => f.startsWith("ChatGPT")).sort();

/** Scene pairs, by position in the sorted source list, plus the dedicated pricing portrait. */
const backdrops = {
  "a-light": sources[0], "a-dark": sources[1],
  "b-light": sources[2], "b-dark": sources[3],
  "c-light": sources[4], "c-dark": sources[5],
  "d-light": sources[6], "d-dark": sources[7],
  "pricing-light": "pricingpagelight.png", "pricing-dark": "pricingpagedark.png",
};

/** Crops (in source pixels) used as the concept-site photos inside the panes. */
const photos = {
  peak: [sources[6], { left: 330, top: 170, width: 860, height: 560 }],
  range: [sources[2], { left: 0, top: 260, width: 1000, height: 600 }],
  portal: [sources[4], { left: 760, top: 120, width: 912, height: 700 }],
  own: [sources[7], { left: 420, top: 160, width: 820, height: 600 }],
};

const hq = (img, width) =>
  img.resize({ width, kernel: "lanczos3" }).sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 });

for (const [name, file] of Object.entries(backdrops)) {
  await hq(sharp(src(file)), 2560).webp({ quality: 88, effort: 6, smartSubsample: true }).toFile(join(images, "backdrops", `${name}.webp`));
  await sharp(src(file)).resize({ width: 1400, kernel: "lanczos3" }).webp({ quality: 84, effort: 6, smartSubsample: true }).toFile(join(images, "backdrops", `${name}-sm.webp`));
  console.log("backdrop", name);
}
for (const [name, [file, box]] of Object.entries(photos)) {
  const crop = await sharp(src(file)).extract(box).toBuffer();
  await hq(sharp(crop), 1600).webp({ quality: 88, effort: 6 }).toFile(join(images, "scenes", `pic-${name}.webp`));
  await sharp(crop).resize({ width: 900, kernel: "lanczos3" }).webp({ quality: 84, effort: 6 }).toFile(join(images, "scenes", `pic-${name}-900.webp`));
  console.log("photo", name);
}
