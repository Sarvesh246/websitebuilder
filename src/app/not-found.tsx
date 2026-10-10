import type { Metadata } from "next";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { NotFoundContent } from "@/components/layout/NotFoundContent";
import { SiteNav } from "@/components/nav/SiteNav";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
