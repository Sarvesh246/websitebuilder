/**
 * Renders the environment plates and screen "photos" used by the site (offline, not part of the build).
 *
 *   node scripts/art/render.mjs [name ...] [--preview]
 *
 * Needs playwright-core + a Chromium build: set PLAYWRIGHT_CORE (path to the playwright-core package)
 * and CHROMIUM (path to chrome.exe) if they are not at the defaults below. Output: public/images/scenes/
 * as WebP (sharp, from node_modules). --preview writes small PNGs to scripts/art/out/ instead.
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { scenes } from "./scenes.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const require = createRequire(import.meta.url);
const pwPath = process.env.PLAYWRIGHT_CORE ?? join(process.env.APPDATA ?? "", "npm/node_modules/omniroute/node_modules/playwright-core");
const { chromium } = require(pwPath);
const exe = process.env.CHROMIUM ?? join(process.env.LOCALAPPDATA ?? "", "ms-playwright/chromium-1243/chrome-win64/chrome.exe");

const args = process.argv.slice(2);
const preview = args.includes("--preview");
const names = args.filter((a) => !a.startsWith("--"));
const list = Object.entries(scenes).filter(([n]) => names.length === 0 || names.includes(n));

const browser = await chromium.launch({ executablePath: exe, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
page.on("console", (m) => m.type() === "error" && console.error(m.text()));
page.on("pageerror", (e) => console.error(e.message));
await page.goto(pathToFileURL(join(here, "scene.html")).href);
await page.waitForFunction(() => window.ready === true);

const outDir = preview ? join(here, "out") : join(root, "public/images/scenes");
mkdirSync(outDir, { recursive: true });

for (const [name, cfg] of list) {
  const w = preview ? 800 : cfg.width;
  const h = Math.round((w * cfg.height) / cfg.width);
  const t0 = Date.now();
  const url = await page.evaluate((c) => window.renderScene(c), { ...cfg, width: w, height: h, spp: preview ? 1 : cfg.spp ?? 4 });
  const png = Buffer.from(url.split(",")[1], "base64");
  if (preview) {
    writeFileSync(join(outDir, `${name}.png`), png);
  } else {
    for (const width of cfg.sizes ?? [cfg.width]) {
      const suffix = width === cfg.width ? "" : `-${width}`;
      await sharp(png).resize({ width }).webp({ quality: cfg.quality ?? 74, effort: 6, smartSubsample: true }).toFile(join(outDir, `${name}${suffix}.webp`));
    }
  }
  console.log(`${name} ${w}x${h} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
await browser.close();
