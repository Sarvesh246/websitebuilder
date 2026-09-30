/**
 * Builds the brand mark assets from the two owner-supplied logos in public/images/scenes2/
 * (logolight.png / logodark.png, opaque renders). Run after replacing either source:
 *   node scripts/logo.mjs
 * Each render is keyed onto transparency (colour-to-alpha against its own background), then cropped
 * and scaled around the door FRAME so both variants have the same frame size and position: the mark
 * looks identical in size in either theme. Output: public/brand/mark-{light,dark}.webp (in-page),
 * icon-{light,dark}.png (tab icon), favicon.ico (dark fallback), public/brand/apple-icon.png.
 */
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";

const SRC = "public/images/scenes2/";
const OUT = "public/brand/";
mkdirSync(OUT, { recursive: true });

// Door-frame box in each source (1254px render), measured from the pixels. The dark frame is
// smaller in its render, so it gets a scale factor that equalises the two.
const V = {
  light: { file: "logolight.png", cx: 627, cy: 611.5, w: 434, h: 483, bg: [253, 253, 252] },
  dark: { file: "logodark.png", cx: 627.5, cy: 564.5, w: 349, h: 401, bg: [1, 4, 11] },
};

const clamp = (v, a = 0, b = 255) => Math.min(b, Math.max(a, v));

async function keyed(name) {
  const v = V[name];
  const { data, info } = await sharp(SRC + v.file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += 3, o += 4) {
    let a, c;
    if (name === "light") {
      // colour-to-alpha against the near-white ground; 0.8 of full contrast counts as opaque
      const d = Math.max(v.bg[0] - data[i], v.bg[1] - data[i + 1], v.bg[2] - data[i + 2], 0) / 253;
      a = Math.min(1, d / 0.8);
      c = a < 0.004 ? [0, 0, 0] : [0, 1, 2].map((k) => clamp((data[i + k] - v.bg[k] * (1 - a)) / a));
    } else {
      // colour-to-alpha against black, after removing the render's own near-black floor
      const p = [0, 1, 2].map((k) => Math.max(0, data[i + k] - v.bg[k] - 5));
      const m = Math.max(...p);
      a = m / 255;
      c = m === 0 ? [0, 0, 0] : p.map((x) => clamp((x * 255) / m));
    }
    out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = Math.round(a * 255);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
}

/** frameH = frame height in output px; size = square canvas; fy = frame centre as fraction of height. */
async function render(name, size, frameH, fy, feather) {
  const v = V[name];
  const k = name === "dark" ? Math.sqrt((V.light.w * V.light.h) / (V.dark.w * V.dark.h)) : 1;
  const scale = (frameH / V.light.h) * k; // out px per source px
  const region = size / scale;
  const left = Math.round(v.cx - region / 2);
  const top = Math.round(v.cy - region * fy);
  const base = await keyed(name);
  const png = await base.png().toBuffer();
  const S = Math.round(region);
  // pad so a crop that runs past the source is transparent, not clamped
  const pad = 400;
  const padded = await sharp(png).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  let img = sharp(padded).extract({ left: left + pad, top: top + pad, width: S, height: S }).resize(size, size, { kernel: "lanczos3" });
  if (feather) {
    const f = feather;
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><linearGradient id="h"><stop offset="0" stop-color="#000"/><stop offset="${f / size}" stop-color="#fff"/><stop offset="${1 - f / size}" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="${f / size}" stop-color="#fff"/><stop offset="${1 - f / size}" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#h)"/><rect width="100%" height="100%" fill="url(#v)" style="mix-blend-mode:multiply"/></svg>`,
    );
    img = sharp(await sharp(await img.png().toBuffer()).composite([{ input: await sharp(mask).greyscale().png().toBuffer(), blend: "dest-in" }]).png().toBuffer());
  }
  return img;
}

for (const name of ["light", "dark"]) {
  // in-page mark: frame 200px tall on a 320 canvas, a little above centre (glow falls below)
  await (await render(name, 320, 200, 0.47, 56)).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(`${OUT}mark-${name}.webp`);
  // tab icon: frame fills most of the square, no feather needed
  await (await render(name, 128, 108, 0.5, 14)).png().toFile(`${OUT}icon-${name}.png`);
}

// favicon.ico: dark variant (fallback when a browser ignores the media-switched icons)
const ico = [16, 32, 48];
const pngs = [];
for (const s of ico) pngs.push(await (await render("dark", 128, 108, 0.5, 14)).resize(s, s, { kernel: "lanczos3" }).png().toBuffer());
const head = Buffer.alloc(6 + 16 * ico.length);
head.writeUInt16LE(1, 2); head.writeUInt16LE(ico.length, 4);
let off = head.length;
ico.forEach((s, i) => {
  const e = 6 + 16 * i;
  head[e] = s; head[e + 1] = s; head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(pngs[i].length, e + 8); head.writeUInt32LE(off, e + 12);
  off += pngs[i].length;
});
writeFileSync("public/favicon.ico", Buffer.concat([head, ...pngs]));

// apple touch icon: light mark on the site's light ground, full-bleed square
const apple = await (await render("light", 180, 108, 0.5, 0)).png().toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 3, background: "#f5f4f1" } }).composite([{ input: apple }]).png().toFile("public/brand/apple-icon.png");
console.log("done");
