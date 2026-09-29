import type { Metadata } from "next";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteNav } from "@/components/nav/SiteNav";
import { Button } from "@/components/ui/Button";
import { Ambient } from "@/components/visual/Ambient";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <MotionProvider>
      <SiteNav />
      <main id="main">
    <Section className="legal not-found" spacing="none">
      <Ambient preset="quiet" />
      <Container>
        <div className="legal__wrap flex flex-col items-start gap-5">
          <span className="t-label t-label--rule">404</span>
          <h1 className="t-h2">Page not found.</h1>
          <p className="t-lead max-w-[38ch]">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
          <div className="final-cta__actions">
            <Button href="/" size="lg" variant="secondary">
              Back home
            </Button>
            <Button href={siteConfig.cta.href} size="lg" icon="diag">
              {siteConfig.cta.label}
            </Button>
          </div>
        </div>
      </Container>
    </Section>
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
