import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { ArrivalVeil } from "@/components/concept/ArrivalVeil";
import { conceptBySlug, conceptPath, packageName, type ConceptSlug } from "@/config/concepts";
import { startHref } from "@/config/inquiry";
import { siteConfig } from "@/config/site";
import { graph, orgId, toJsonLd } from "@/lib/structuredData";
import "@/styles/concept-frame.css";

type Props = {
  slug: ConceptSlug;
  /** Font-variable classes from next/font plus the concept's own scope class (e.g. "cx-cafe"). */
  className?: string;
  children: ReactNode;
};

/**
 * Shared shell for every concept site: the slim Northframe preview bar and an isolated page
 * wrapper. Concept CSS must be scoped under its own `.cx-<slug>` class and use `var(--cx-bar)`
 * as the top offset for any sticky/fixed element of its own.
 */
export const ConceptFrame = ({ slug, className = "", children }: Props) => {
  const concept = conceptBySlug(slug);
  const url = `${siteConfig.url}${conceptPath(slug)}`;
  // Invisible to visitors: says this is a design concept by Northframe Builds for a fictional brand.
  const jsonLd = graph(
    {
      "@type": "CreativeWork",
      "@id": `${url}#concept`,
      name: `${concept.title} website concept`,
      url,
      genre: "Website design concept",
      description: `${concept.summary} A concept for ${concept.brand}, a fictional brand (not a real business or client). Fits the ${packageName(concept.pkg)} package.`,
      creator: { "@id": orgId },
      audience: { "@type": "Audience", audienceType: concept.audience },
      image: `${siteConfig.url}${concept.image}`,
      isPartOf: { "@id": `${siteConfig.url}/work#concepts` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteConfig.entityName, item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Concepts", item: `${siteConfig.url}/work` },
        { "@type": "ListItem", position: 3, name: `${concept.title} concept`, item: url },
      ],
    },
  );
  return (
    <div className={`cx cx-${slug} ${className}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
      <ArrivalVeil image={concept.image} />
      <div className="cx-bar">
        <Link href="/work" className="cx-bar__back">
          <ArrowLeft aria-hidden size={14} strokeWidth={2} />
          <span>Back to Concepts</span>
        </Link>
        <p className="cx-bar__note">
          Concept by Northframe <span aria-hidden>·</span> <span className="cx-bar__fiction">{concept.brand} is not a real business</span>
        </p>
        <Link href={startHref(concept.pkg)} className="cx-bar__cta">
          <span>Want one like this?</span>
          <ArrowUpRight aria-hidden size={14} strokeWidth={2} />
        </Link>
      </div>
      <main id="main" className="cx-page">
        {children}
      </main>
    </div>
  );
};
