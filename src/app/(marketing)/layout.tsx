import { SiteFooter } from "@/components/footer/SiteFooter";
import { SiteNav } from "@/components/nav/SiteNav";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
