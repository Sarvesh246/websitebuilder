import { customTier, discountLabel, packageTiers } from "@/config/pricing";
import { siteConfig } from "@/config/site";

/**
 * Schema.org nodes shared by the home page and /about. Only facts that are visible on the site:
 * name, url, description, founder, the published phone, owned profiles, and package prices from
 * config/pricing.ts. Never an address, ratings, reviews, awards, founding date or client counts.
 */
const url = siteConfig.url;
export const orgId = `${url}/#organization`;
export const founderId = `${url}/#founder`;

export const organizationNode = {
  "@type": "Organization",
  "@id": orgId,
  name: siteConfig.entityName,
  alternateName: siteConfig.name,
  url,
  description: siteConfig.description,
  founder: { "@id": founderId },
  knowsAbout: ["Web design", "Web development", "Responsive websites", "Portfolio websites", "Small business websites"],
  ...(siteConfig.contactEmail && { email: siteConfig.contactEmail }),
  ...(siteConfig.contactPhone && {
    telephone: siteConfig.contactPhone,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.contactPhone,
      contactType: "customer service",
      availableLanguage: "English",
    },
  }),
  // The square brand icon: Google uses a logo of at least 112x112 for knowledge panels and results.
  logo: { "@type": "ImageObject", url: `${url}/brand/icon-192.png`, width: 192, height: 192 },
  // Owned profiles (same list as the footer) so search engines tie them to this site.
  ...(siteConfig.social.length > 0 && { sameAs: siteConfig.social.map((s) => s.href) }),
};

export const founderNode = {
  "@type": "Person",
  "@id": founderId,
  name: siteConfig.founder.fullName,
  givenName: siteConfig.founder.name,
  jobTitle: siteConfig.founder.role,
  url: `${url}/about`,
  worksFor: { "@id": orgId },
  affiliation: { "@type": "CollegeOrUniversity", name: siteConfig.founder.school },
  knowsAbout: ["Web design", "Web development", "Next.js", "React", "TypeScript"],
};

export const websiteNode = {
  "@type": "WebSite",
  "@id": `${url}/#website`,
  name: siteConfig.entityName,
  alternateName: siteConfig.name,
  url,
  inLanguage: "en-US",
  publisher: { "@id": orgId },
};

/** What is sold, to whom, and at what (visible) price. Custom has no fixed price, so no Offer price. */
export const serviceNode = {
  "@type": "Service",
  "@id": `${url}/#service`,
  name: "Web design and development",
  serviceType: "Web design",
  url,
  description: siteConfig.description,
  provider: { "@id": orgId },
  audience: { "@type": "Audience", audienceType: "Students, creators, student organizations, and small businesses" },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Website packages",
    itemListElement: [
      ...packageTiers.map((t) => ({
        "@type": "Offer",
        name: `${t.name} package`,
        description: `${t.blurb} Up to ${t.pages} ${t.pages === 1 ? "page" : "pages"}, ${t.revisions} revision ${t.revisions === 1 ? "round" : "rounds"}. ${t.audience}${discountLabel(t) ? ` ${discountLabel(t)}.` : ""}`,
        price: t.price,
        priceCurrency: "USD",
        url: `${url}/#pricing`,
      })),
      { "@type": "Offer", name: `${customTier.name} package`, description: `${customTier.blurb} ${customTier.note}`, url: `${url}/#pricing` },
    ],
  },
};

export const graph = (...nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });

/** Serialized for a <script type="application/ld+json">, with "<" escaped so content can't close the tag. */
export const toJsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
