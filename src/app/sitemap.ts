import type { MetadataRoute } from "next";
import { legalUpdated, siteConfig } from "@/config/site";

/**
 * Indexable routes only. /start is noindex (conversion form), so it is deliberately absent, as are
 * /api, /design-system and the 404. Legal pages carry the real "last updated" date from config.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const legalModified = new Date(legalUpdated);
  return [
    { url: siteConfig.url },
    { url: `${siteConfig.url}/privacy`, lastModified: legalModified },
    { url: `${siteConfig.url}/terms`, lastModified: legalModified },
  ];
}
