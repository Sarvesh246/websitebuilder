import type { Metadata } from "next";
import { AboutView } from "@/components/guides/Guides";
import { aboutPage } from "@/config/about";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: aboutPage.description,
  path: "/about",
});

export default function Page() {
  return <AboutView />;
}
