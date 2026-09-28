import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

type PageMeta = {
  /** Short page title; the root template appends "| Northframe". Omit for the home page (uses the full default). */
  title?: string;
  description: string;
  /** Route path, e.g. "/privacy". Becomes the canonical (resolved against metadataBase). */
  path: string;
  /** false = noindex, follow. Social previews still work. */
  index?: boolean;
};

/**
 * One place that builds per-route metadata. Child `openGraph` replaces the parent's object, so
 * the shared fields are repeated here. The share image comes from the app-level opengraph-image.
 */
export function pageMetadata({ title, description, path, index = true }: PageMeta): Metadata {
  // Nested routes don't inherit the app-level opengraph-image file once they define openGraph,
  // so the same image is referenced explicitly (unhashed path, always served).
  const images = [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.socialAlt }];
  const fullTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} | ${siteConfig.tagline}`;
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    ...(!index && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: "en_US",
      title: fullTitle,
      description,
      url: path,
      images,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
  };
}
