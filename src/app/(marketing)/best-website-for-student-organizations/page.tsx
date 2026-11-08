import type { Metadata } from "next";
import { IntentView } from "@/components/guides/Guides";
import { intentBySlug } from "@/config/intents";
import { pageMetadata } from "@/lib/seo";

const intent = intentBySlug("best-website-for-student-organizations");

export const metadata: Metadata = pageMetadata({
  title: intent.title,
  description: intent.description,
  path: `/${intent.slug}`,
  article: { published: intent.published, modified: intent.updated },
});

export default function Page() {
  return <IntentView slug={intent.slug} />;
}
