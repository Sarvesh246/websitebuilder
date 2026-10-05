import type { Metadata } from "next";
import { FaqView } from "@/components/guides/Guides";
import { faqPage } from "@/config/guides";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description: faqPage.description,
  path: "/faq",
});

export default function FaqPage() {
  return <FaqView />;
}
