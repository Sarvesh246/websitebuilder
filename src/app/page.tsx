import { About } from "@/components/sections/About";
import { Expect } from "@/components/sections/Expect";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Pricing } from "@/components/sections/Pricing";
import { siteConfig } from "@/config/site";

/** Organization data: only facts that exist. No address, ratings, founding date, or profiles. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  founder: { "@type": "Person", name: siteConfig.founder.name },
  ...(siteConfig.contactEmail && { email: siteConfig.contactEmail }),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <Pricing />
      <About />
      <Expect />
      <FinalCta />
    </>
  );
}
