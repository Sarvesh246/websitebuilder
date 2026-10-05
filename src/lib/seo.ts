import type { Metadata } from "next";
import { conceptBySlug, conceptPath, packageName, type ConceptSlug } from "@/config/concepts";
import { siteConfig } from "@/config/site";

type PageMeta = {
  /** Short page title; the root template appends "| Northframe Builds". Omit for the home page (uses the full default). */
  title?: string;
  description: string;
  /** Route path, e.g. "/privacy". Becomes the canonical (resolved against metadataBase). */
  path: string;
  /** false = noindex, follow. Social previews still work. */
  index?: boolean;
  /** Long-form guides: Open Graph type "article" with author and dates (ISO yyyy-mm-dd). */
  article?: { published: string; modified: string };
};

/**
 * One place that builds per-route metadata. Child `openGraph` replaces the parent's object, so
 * the shared fields are repeated here. The share image comes from the app-level opengraph-image.
 */
export function pageMetadata({ title, description, path, index = true, article }: PageMeta): Metadata {
  // Nested routes don't inherit the app-level opengraph-image file once they define openGraph,
  // so the same image is referenced explicitly (unhashed path, always served).
  const images = [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.socialAlt }];
  const fullTitle = title ? `${title} | ${siteConfig.entityName}` : siteConfig.homeTitle;
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    ...(!index && { robots: { index: false, follow: true } }),
    ...(article && { authors: [{ name: siteConfig.founder.fullName, url: "/about" }] }),
    openGraph: {
      ...(article
        ? {
            type: "article",
            publishedTime: article.published,
            modifiedTime: article.modified,
            authors: [siteConfig.founder.fullName],
          }
        : { type: "website" }),
      siteName: siteConfig.entityName,
      locale: "en_US",
      title: fullTitle,
      description,
      url: path,
      images,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
  };
}

/**
 * Concept sites: indexable, and labelled as concepts for fictional businesses in the title and
 * description so search engines never mistake the fictional brand for a real one.
 */
export const conceptMetadata = (slug: ConceptSlug): Metadata => {
  const c = conceptBySlug(slug);
  return pageMetadata({
    title: `${c.title} website concept`,
    description: `${c.title} website design concept by ${siteConfig.entityName} for ${c.brand}, a fictional brand. ${c.summary} Fits the ${packageName(c.pkg)} package.`,
    path: conceptPath(slug),
  });
};
