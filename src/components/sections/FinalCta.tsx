import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Ambient } from "@/components/visual/Ambient";
import { Plinth, Scene } from "@/components/visual/environment/Scene";
import { finalCta } from "@/config/about";

/**
 * Last space on the page: a glass slab standing on a stone platform in front of the shared
 * mountains. The scene's mist resolves into the footer colour, so the page ends without a seam. Both buttons are real links (Start a
 * Project -> /start, View Pricing -> /#pricing).
 */
export const FinalCta = () => (
  <Section aria-labelledby="final-cta-title" className="final-cta" spacing="none">
    <Ambient preset="horizon" />
    <Scene variant="wide" seed={5} />
    <Container>
      <Reveal className="final-cta__stage">
        <Plinth className="final-cta__plinth" />
        <GlassSurface variant="feature" className="glass-slab final-cta__panel">
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
