import type { Metadata } from "next";
import { About } from "@/components/sections/About";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Ownership } from "@/components/sections/Ownership";
import { Pricing } from "@/components/sections/Pricing";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { Why } from "@/components/sections/Why";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ description: siteConfig.description, path: "/" });

/**
 * Structured data: only facts that exist (name, url, description, founder first name, business phone,
 * owned profiles, public email if configured). Never an address, ratings, reviews, prices, founding
 * date or counts: none are claimed anywhere on the site. Phone/profiles come from siteConfig.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      founder: { "@type": "Person", name: siteConfig.founder.name },
      knowsAbout: ["Web design", "Web development", "Responsive websites", "Portfolio websites"],
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
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/brand/icon-192.png`, width: 192, height: 192 },
      // Owned profiles (same list as the footer) so search engines tie them to this site.
      ...(siteConfig.social.length > 0 && { sameAs: siteConfig.social.map((s) => s.href) }),
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      name: siteConfig.name,
      url: siteConfig.url,
      inLanguage: "en-US",
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      // What is sold and to whom. No price, rating, area or review fields: none are claimed anywhere on the site.
      "@type": "Service",
      "@id": `${siteConfig.url}/#service`,
      name: "Web design and development",
      serviceType: "Web design",
      url: siteConfig.url,
      description: siteConfig.description,
      provider: { "@id": `${siteConfig.url}/#organization` },
      audience: {
        "@type": "Audience",
        audienceType: "Students, creators, student organizations, and small businesses",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <Why />
      <Services />
      <Process />
      <Ownership />
      <Pricing />
      <About />
      <FinalCta />
    </>
  );
}
