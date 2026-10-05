import { articles } from "@/config/articles";
import { conceptPath, concepts } from "@/config/concepts";
import { audienceGuides } from "@/config/guides";
import { customTier, discountLabel, packageTiers, pricingUpdated } from "@/config/pricing";
import { siteConfig } from "@/config/site";

/**
 * /llms.txt, generated from the same config as the pages so prices and names can never drift.
 * An experimental convenience for AI tools, not a ranking factor; the HTML pages are the source.
 */
export const dynamic = "force-static";

export function GET() {
  const u = siteConfig.url;
  const pkg = packageTiers.map((t) => {
    const label = discountLabel(t);
    const price = label && t.regularPrice !== undefined ? `$${t.price} (${label}, regularly $${t.regularPrice})` : `$${t.price}`;
    return `- ${t.name}: ${price}, one-time. Up to ${t.pages} ${t.pages === 1 ? "page" : "pages"}, ${t.revisions} revision ${t.revisions === 1 ? "round" : "rounds"}. ${t.audience}`;
  });
  const body = [
    `# ${siteConfig.entityName}`,
    "",
    `> ${siteConfig.entityName} (also shown as ${siteConfig.name}) is an independent web design and development studio founded by ${siteConfig.founder.fullName}, an engineering student at ${siteConfig.founder.school}. It designs and builds affordable, custom, mobile-ready websites for students, creators, student organizations, and small businesses. Prices are fixed and listed up front, and clients own the finished site, domain, and accounts.`,
    "",
    "## Services",
    "",
    ...audienceGuides.map((g) => `- [${g.label}](${u}/${g.slug}): ${g.description}`),
    "",
    `## Packages (pricing updated ${pricingUpdated.label})`,
    "",
    ...pkg,
    `- ${customTier.name}: quoted by scope. ${customTier.blurb}`,
    "",
    "## Guides",
    "",
    ...articles.map((a) => `- [${a.title}](${u}/guides/${a.slug}): ${a.description}`),
    "",
    "## Website concepts (fictional businesses, not client work)",
    "",
    ...concepts.map((c) => `- [${c.title} concept](${u}${conceptPath(c.slug)}): ${c.summary}`),
    "",
    "## Information",
    "",
    `- [Home](${u}/): services, process, ownership, and pricing.`,
    `- [About](${u}/about): who runs ${siteConfig.entityName} and how sites are built.`,
    `- [FAQ](${u}/faq): packages, pricing, process, payments, revisions, and ownership.`,
    `- [Website concepts](${u}/work): five concept sites for fictional businesses (not client work).`,
    `- [Website cost calculator](${u}/tools/website-cost-calculator): which package fits and what it costs.`,
    `- [Start a project](${u}/start): the project request form.`,
    `- [Privacy](${u}/privacy) and [Terms](${u}/terms).`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
