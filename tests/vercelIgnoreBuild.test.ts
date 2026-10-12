import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const script = path.resolve("scripts/vercel-ignore-build.mjs");
let repo: string;

function git(...args: string[]) {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

function commit(file: string) {
  const target = path.join(repo, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, file);
  git("add", ".");
  git("-c", "user.name=Build Test", "-c", "user.email=build@example.com", "commit", "-m", file);
  return git("rev-parse", "HEAD");
}

function run(previous = "") {
  return spawnSync(process.execPath, [script], {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: previous },
  });
}

describe("Vercel ignored build step", () => {
  beforeEach(() => {
    repo = mkdtempSync(path.join(tmpdir(), "northframe-build-test-"));
    git("init");
    commit("README.md");
  });

  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  it("continues cleanly when the previous deployment commit is unavailable", () => {
    commit("docs/note.md");
    const result = run("1faf679ae88e7d901cc339b009c2d1c4b37fafde");
    expect(result.status).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Previous commit unavailable");
  });

  it("continues for an initial commit with no parent", () => {
    expect(run().status).toBe(1);
  });

  it("skips docs-only changes with an available comparison commit", () => {
    const base = git("rev-parse", "HEAD");
    commit("docs/note.md");
    expect(run(base).status).toBe(0);
    expect(run().status).toBe(0);
  });

  it.each(["src/app/page.tsx", "public/logo.svg", "scripts/build.mjs", "package.json", "vercel.json"])(
    "continues when %s changes",
    (file) => {
      const base = git("rev-parse", "HEAD");
      commit(file);
      expect(run(base).status).toBe(1);
    },
  );

  it("compares the full range since deployment even when the latest commit is docs-only", () => {
    const base = git("rev-parse", "HEAD");
    commit("src/app/page.tsx");
    commit("docs/note.md");
    expect(run(base).status).toBe(1);
    expect(run().status).toBe(0);
  });
});
