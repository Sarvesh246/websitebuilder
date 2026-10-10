import type { Metadata } from "next";
import { CalculatorView } from "@/components/guides/Guides";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Website Cost Calculator: Custom Web Design Pricing",
  description:
    "Estimate your custom website cost with Northframe’s free calculator. Choose pages and features to see web design pricing, inclusions, and payment breakdowns.",
  path: "/tools/website-cost-calculator",
});

export default function Page() {
  return <CalculatorView />;
}
