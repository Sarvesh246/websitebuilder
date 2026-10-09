import { describe, expect, it } from "vitest";
import { aboutPage } from "@/config/about";
import { articles } from "@/config/articles";
import { audienceGuides, faqPage, type GuideSection } from "@/config/guides";
import { parseRich, plainText, richHrefs } from "@/lib/richText";

type Source = { page: string; texts: string[] };

const sectionTexts = (sections: readonly GuideSection[]) =>
  sections.flatMap((s) => [...(s.body ?? []), ...(s.points ?? [])]);

const sources: Source[] = [
  ...articles.map((a) => ({
    page: `/guides/${a.slug}`,
    texts: [...sectionTexts(a.sections), ...(a.faq ?? []).map((f) => f.a)],
  })),
  ...audienceGuides.map((g) => ({
    page: `/${g.slug}`,
    texts: [...sectionTexts(g.sections), ...g.faq.map((f) => f.a)],
  })),
  {
    page: "/faq",
    texts: faqPage.groups.flatMap((g) => g.items.map((i) => i.a)),
  },
  { page: "/about", texts: sectionTexts(aboutPage.sections) },
];

const routes = new Set([
  "/",
  "/about",
  "/faq",
  "/work",
  "/guides",
  "/tools/website-cost-calculator",
  "/privacy",
  "/terms",
  "/start",
  ...audienceGuides.map((g) => `/${g.slug}`),
  ...articles.map((a) => `/guides/${a.slug}`),
]);

const links = sources.flatMap((s) =>
  s.texts.flatMap((t) => richHrefs(t).map((href) => ({ from: s.page, href }))),
);

describe("rich text", () => {
  it("splits copy into text and links", () => {
    expect(parseRich("See [the FAQ](/faq) first.")).toEqual([
      { text: "See " },
      { text: "the FAQ", href: "/faq" },
      { text: " first." },
    ]);
    expect(plainText("See [the FAQ](/faq).")).toBe("See the FAQ.");
  });

  it("ignores external and malformed links", () => {
    expect(richHrefs("[x](https://example.com) [y](faq)")).toEqual([]);
  });
});

describe("in-body internal links", () => {
  it("only point at pages that exist", () => {
    const broken = links.filter((l) => !routes.has(l.href));
    expect(broken).toEqual([]);
  });

  it("never link a page to itself", () => {
    expect(links.filter((l) => l.from === l.href)).toEqual([]);
  });

  it("give every guide and audience page at least three contextual links from other pages", () => {
    const targets = [
      ...articles.map((a) => `/guides/${a.slug}`),
      ...audienceGuides.map((g) => `/${g.slug}`),
    ];
    const weak = targets
      .map((page) => ({
        page,
        inbound: new Set(
          links.filter((l) => l.href === page).map((l) => l.from),
        ).size,
      }))
      .filter((t) => t.inbound < 3);
    expect(weak).toEqual([]);
  });

  it("leave no unparsed link syntax in titles, descriptions or leads", () => {
    const meta = [...articles, ...audienceGuides].flatMap((p) => [
      p.title,
      p.description,
      p.h1,
      p.lead,
    ]);
    expect(meta.filter((t) => /\]\(/.test(t))).toEqual([]);
  });
});

describe("guide graph", () => {
  it("hubs and related guides resolve", () => {
    const slugs = new Set(articles.map((a) => a.slug));
    for (const a of articles) {
      expect(audienceGuides.some((g) => g.slug === a.hub)).toBe(true);
      for (const r of a.related) expect(slugs.has(r)).toBe(true);
    }
  });

  it("keeps meta descriptions short enough for search snippets", () => {
    const long = [...articles, ...audienceGuides]
      .filter((p) => p.description.length > 160)
      .map((p) => p.title);
    expect(long).toEqual([]);
  });
});
