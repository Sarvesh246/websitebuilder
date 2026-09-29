import { SiteFooter } from "@/components/footer/SiteFooter";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteNav } from "@/components/nav/SiteNav";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <MotionProvider>
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </MotionProvider>
  );
}
