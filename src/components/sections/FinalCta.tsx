import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/visual/Plate";
import { finalCta } from "@/config/about";

/**
 * Last space on the page: one thick glass slab over the same lake and plinth the page opened with,
 * so the site ends where it began. Both buttons are real links (/start and /#pricing).
 */
export const FinalCta = () => (
  <Section aria-labelledby="final-cta-title" className="final-cta">
    <Plate name="cta" className="final-cta__plate" />
    <Container>
      <Reveal className="final-cta__wrap">
        <div className="pane final-cta__panel">
          <span className="t-label t-label--rule t-label--rule-both">{finalCta.eyebrow}</span>
          <h2 id="final-cta-title" className="t-h2 max-w-[15ch]">
            {finalCta.title}
          </h2>
          <p className="t-lead max-w-[38ch]">{finalCta.body}</p>
          <div className="final-cta__actions">
            <Button href={finalCta.primary.href} size="lg" icon="diag">
              {finalCta.primary.label}
            </Button>
            <Button href={finalCta.secondary.href} size="lg" variant="secondary" icon="right">
              {finalCta.secondary.label}
            </Button>
          </div>
        </div>
      </Reveal>
    </Container>
  </Section>
);
