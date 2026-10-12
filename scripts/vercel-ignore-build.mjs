import { spawnSync } from "node:child_process";

// Vercel: exit 0 skips the build; exit 1 continues it.
const base = process.env.VERCEL_GIT_PREVIOUS_SHA || "HEAD^";
const git = (args) => spawnSync("git", args, { stdio: "ignore" });

// Shallow clones may omit the previous deployment. Comparing only HEAD^ in
// that case could miss app changes across several commits, so always build.
if (git(["rev-parse", "--verify", "--end-of-options", `${base}^{commit}`]).status !== 0) {
  console.log("Previous commit unavailable in this checkout; continuing the build.");
  process.exit(1);
}

const result = git([
  "diff",
  "--quiet",
  "--no-ext-diff",
  base,
  "HEAD",
  "--",
  "src",
  "public",
  "scripts",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
  "next-env.d.ts",
  "vercel.json",
]);

if (result.status === 0) {
  console.log("No app or build configuration changes; skipping the build.");
  process.exit(0);
}

console.log(
  result.status === 1
    ? "App or build configuration changed; continuing the build."
    : "Unable to compare commits; continuing the build.",
);
process.exit(1);
