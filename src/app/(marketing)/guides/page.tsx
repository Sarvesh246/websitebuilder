import type { Metadata } from "next";
import { GuidesIndex } from "@/components/guides/Guides";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Website guides",
  description:
    "Practical guides on student portfolios, student organization websites, small business websites, website costs, and owning your domain and code.",
  path: "/guides",
});

export default function Page() {
  return <GuidesIndex />;
}
