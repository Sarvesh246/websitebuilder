import type { MetadataRoute } from "next";
import { guideLinks, guidesUpdated } from "@/config/guides";
import { legalUpdated, siteConfig } from "@/config/site";

/**
 * Indexable routes only. /start is noindex (conversion form), so it is deliberately absent, as are
 * /api, /design-system and the 404. Legal pages carry the real "last updated" date from config.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const legalModified = new Date(legalUpdated);
  const guidesModified = new Date(guidesUpdated);
  return [
    { url: siteConfig.url },
    ...guideLinks.map((link) => ({ url: `${siteConfig.url}${link.href}`, lastModified: guidesModified })),
    { url: `${siteConfig.url}/work` },
    { url: `${siteConfig.url}/privacy`, lastModified: legalModified },
    { url: `${siteConfig.url}/terms`, lastModified: legalModified },
  ];
}
