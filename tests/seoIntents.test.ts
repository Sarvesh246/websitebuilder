import { describe, expect, it } from "vitest";
import { articles } from "@/config/articles";
import { audienceGuides } from "@/config/guides";
import { intents } from "@/config/intents";
import sitemap from "@/app/sitemap";
import { GET as llms } from "@/app/llms.txt/route";
import { siteConfig } from "@/config/site";
import { existsSync } from "node:fs";
import { join } from "node:path";

const slugify = (s: string) => s.replace(/[^a-z0-9]+/g, "-");

describe("search-intent pages", () => {
  it("serve the query itself as the URL, title, H1 and lead", () => {
    for (const i of intents) {
      expect(i.slug).toBe(slugify(i.query));
      expect(i.title.toLowerCase()).toBe(i.query);
      expect(i.h1.toLowerCase()).toContain(i.query);
    }
  });

  it("have unique slugs that do not collide with other routes", () => {
    const taken = new Set([...audienceGuides.map((g) => g.slug), ...articles.map((a) => a.slug)]);
    const slugs = intents.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.filter((s) => taken.has(s))).toEqual([]);
  });

  it("each has a route file", () => {
    const missing = intents.filter((i) => !existsSync(join(process.cwd(), "src/app/(marketing)", i.slug, "page.tsx")));
    expect(missing.map((i) => i.slug)).toEqual([]);
  });

  it("resolve their hub, related intents and guides", () => {
    const slugs = new Set(intents.map((i) => i.slug));
    const guides = new Set(articles.map((a) => a.slug));
    for (const i of intents) {
      expect(audienceGuides.some((g) => g.slug === i.hub)).toBe(true);
      for (const r of i.related) expect(slugs.has(r) && r !== i.slug).toBe(true);
      for (const g of i.guides) expect(guides.has(g)).toBe(true);
    }
  });

  it("stay honest: disclose the interest, no ratings, no em dashes, short descriptions", () => {
    for (const i of intents) {
      const text = JSON.stringify(i);
      expect(i.lead).toMatch(/publishes this page and sells one of the options/);
      expect(text).not.toMatch(/—/);
      expect(text).not.toMatch(/\b(#1|number one|top[- ]rated|five[- ]star|guaranteed)\b/i);
      expect(i.description.length).toBeLessThanOrEqual(160);
      expect(i.comparison.table?.rows.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("are in the sitemap and in llms.txt", async () => {
    const urls = sitemap().map((e) => e.url);
    const body = await llms().text();
    for (const path of ["/best", ...intents.map((i) => `/${i.slug}`)]) {
      expect(urls).toContain(`${siteConfig.url}${path}`);
      expect(body).toContain(`${siteConfig.url}${path}`);
    }
  });
});
