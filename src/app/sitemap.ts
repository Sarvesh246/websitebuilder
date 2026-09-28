import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const paths = ["", "/start", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: `${siteConfig.url}${path}` }));
}
