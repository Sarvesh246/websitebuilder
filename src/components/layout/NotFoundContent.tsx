import { Container } from "./Container";
import { Section } from "./Section";
import { Button } from "@/components/ui/Button";
import { Ambient } from "@/components/visual/Ambient";
import { siteConfig } from "@/config/site";

export const NotFoundContent = () => (
  <Section className="legal not-found" spacing="none">
    <Ambient preset="quiet" />
    <Container>
      <div className="legal__wrap not-found__wrap flex flex-col items-center gap-5 text-center">
        <span className="t-label t-label--rule t-label--rule-both">404</span>
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
);
