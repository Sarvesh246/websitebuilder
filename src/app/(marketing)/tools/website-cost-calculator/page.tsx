import type { Metadata } from "next";
import { CalculatorView } from "@/components/guides/Guides";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Website cost calculator",
  description:
    "Free website cost calculator: pick your pages and features to see which package fits, the one-time price, and how payment is split.",
  path: "/tools/website-cost-calculator",
});

export default function Page() {
  return <CalculatorView />;
}
