import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Ambient } from "@/components/visual/Ambient";
import { Horizon } from "@/components/visual/Horizon";
import { finalCta } from "@/config/about";

/**
 * Last space on the page: a glass panel over a soft horizon. The ridge bottom colour is the
 * footer's background, so the page ends without a seam. Both buttons are real links (Start a
 * Project -> /start, View Pricing -> /#pricing).
 */
export const FinalCta = () => (
  <Section aria-labelledby="final-cta-title" className="final-cta" spacing="none">
    <Ambient preset="horizon" />
    <div aria-hidden className="final-cta__scene">
      <Horizon />
    </div>
    <Container>
      <Reveal>
        <GlassSurface variant="feature" className="final-cta__panel">
          <span className="t-label t-label--rule t-label--rule-both">{finalCta.eyebrow}</span>
          <h2 id="final-cta-title" className="t-h2 max-w-[16ch]">
            {finalCta.title}
          </h2>
          <p className="t-lead max-w-[38ch]">{finalCta.body}</p>
          <div className="final-cta__actions">
            <Button href={finalCta.primary.href} size="lg" icon="diag">
              {finalCta.primary.label}
            </Button>
            <Button href={finalCta.secondary.href} size="lg" variant="secondary">
              {finalCta.secondary.label}
            </Button>
          </div>
        </GlassSurface>
      </Reveal>
    </Container>
  </Section>
);
