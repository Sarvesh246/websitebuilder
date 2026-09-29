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
 * Structured data: only facts that exist (name, url, description, founder first name, public
 * email if configured). No address, phone, ratings, reviews, founding date, counts, or profiles.
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
      ...(siteConfig.contactEmail && { email: siteConfig.contactEmail }),
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      name: siteConfig.name,
      url: siteConfig.url,
      publisher: { "@id": `${siteConfig.url}/#organization` },
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
