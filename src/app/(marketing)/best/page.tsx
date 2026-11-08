import type { Metadata } from "next";
import { BestHubView } from "@/components/guides/Guides";
import { bestHub } from "@/config/intents";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: bestHub.title,
  description: bestHub.description,
  path: bestHub.path,
});

export default function Page() {
  return <BestHubView />;
}
