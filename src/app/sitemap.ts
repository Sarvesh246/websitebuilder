import type { MetadataRoute } from "next";
import { articles, articlesUpdated } from "@/config/articles";
import { conceptPath, concepts } from "@/config/concepts";
import { guideLinks, guidesUpdated } from "@/config/guides";
import { pricingUpdated } from "@/config/pricing";
import { legalUpdated, siteConfig } from "@/config/site";

/**
 * Indexable routes only, each with the date its content last changed (from config, never the build
 * time). /start is noindex (conversion form), so it is deliberately absent, as are /api,
 * /design-system, the portal and the 404.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const at = (path: string, date: string) => ({ url: `${siteConfig.url}${path}`, lastModified: new Date(date) });
  const latest = (...dates: string[]) => dates.reduce((a, b) => (new Date(b) > new Date(a) ? b : a));
  return [
    at("", latest(pricingUpdated.iso, guidesUpdated)),
    at("/about", guidesUpdated),
    at("/work", guidesUpdated),
    ...concepts.map((c) => at(conceptPath(c.slug), guidesUpdated)),
    ...guideLinks.map((link) => at(link.href, latest(guidesUpdated, pricingUpdated.iso))),
    at("/guides", articlesUpdated),
    ...articles.map((a) => at(`/guides/${a.slug}`, a.updated)),
    at("/tools/website-cost-calculator", latest(guidesUpdated, pricingUpdated.iso)),
    at("/privacy", legalUpdated),
    at("/terms", legalUpdated),
  ];
}
