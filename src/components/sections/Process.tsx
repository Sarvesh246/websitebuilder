import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Ambient } from "@/components/visual/Ambient";
import { Plinth } from "@/components/visual/environment/Scene";
import { MiniSite, type MiniKind } from "@/components/visual/MiniSite";
import { processSteps } from "@/config/about";

const kinds: readonly MiniKind[] = ["wire", "design", "code", "live"];

/**
 * Process as progression: the same site appears as a wireframe, a designed page, code, and a
 * live site, each on its own glass panel along a shared rail. Desktop is a rising horizontal
 * path; phones get a vertical rail. No durations or promises: only the order of the work.
 */
export const Process = () => (
  <Section id="process" aria-labelledby="process-title">
    <Ambient preset="section" />
    <Container className="flex flex-col gap-[var(--section-header-gap)]">
      <Reveal>
        <SectionHeader titleId="process-title" eyebrow={processSteps.eyebrow} title={processSteps.title} lead={processSteps.lead} />
      </Reveal>
      <div className="process">
        <span aria-hidden className="process__rail" />
        <RevealGroup className="process__list" stagger={0.12}>
          {processSteps.steps.map((step, i) => (
            <RevealItem key={step.name} className={`process__step process__step--${i}`}>
              <span aria-hidden className="process__node">
                {String(i + 1).padStart(2, "0")}
              </span>
              <GlassSurface as="div" padded={false} className="glass-slab process__panel">
                <div aria-hidden className="process__art">
                  <MiniSite kind={kinds[i]} />
                </div>
                <div className="process__text">
                  <h3 className="t-h4">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.name}
                  </h3>
                  <p className="t-small text-muted">{step.body}</p>
                </div>
              </GlassSurface>
            </RevealItem>
          ))}
        </RevealGroup>
        <Plinth className="process__plinth" />
      </div>
    </Container>
  </Section>
);
