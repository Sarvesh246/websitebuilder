import type { Metadata } from "next";
import { AudiencePage } from "@/components/guides/Guides";
import { guideBySlug } from "@/config/guides";
import { pageMetadata } from "@/lib/seo";

const guide = guideBySlug("portfolio-websites-for-creators");

export const metadata: Metadata = pageMetadata({
  title: guide.title,
  description: guide.description,
  path: `/${guide.slug}`,
});

export default function Page() {
  return <AudiencePage slug={guide.slug} />;
}
