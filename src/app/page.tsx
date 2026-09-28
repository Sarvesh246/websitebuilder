import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Ambient } from "@/components/visual/Ambient";
import { siteConfig } from "@/config/site";

/** Stage 1 placeholder. Stage 2 replaces this with the real hero and global shell. */
export default function Home() {
  return (
    <Section className="flex min-h-[100dvh] items-center pt-[calc(var(--nav-h)+2rem)]" spacing="tight">
      <Ambient preset="hero" />
      <Container>
        <Reveal className="flex flex-col items-start gap-6">
          <span className="t-label t-label--rule whitespace-nowrap">Web design studio</span>
          <h1 className="t-display max-w-[15ch] sm:max-w-[18ch]">Websites built to make an impression.</h1>
        </Reveal>
        <Reveal delay={0.1} className="mt-6 flex max-w-[34rem] flex-col gap-8">
          <p className="t-lead">{siteConfig.description}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={siteConfig.cta.href} size="lg" icon="diag">
              {siteConfig.cta.label}
            </Button>
            <Button href="/design-system" variant="secondary" size="lg" icon="right">
              Design system
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
