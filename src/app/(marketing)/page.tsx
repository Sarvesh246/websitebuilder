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
import { founderNode, graph, organizationNode, serviceNode, toJsonLd, websiteNode } from "@/lib/structuredData";

export const metadata: Metadata = pageMetadata({ description: siteConfig.description, path: "/" });

/** Organization, founder, website and service graph (lib/structuredData.ts: visible facts only). */
const jsonLd = graph(organizationNode, founderNode, websiteNode, serviceNode);

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
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
