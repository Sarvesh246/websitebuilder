import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Plate } from "@/components/visual/Plate";
import { GlassPane } from "@/components/visual/pane/GlassPane";
import { ScreenCode, ScreenIdeas, ScreenPhoto, ScreenWire } from "@/components/visual/pane/Screens";
import { processSteps } from "@/config/about";

/** The same site as a wireframe, a design, code, and a live page: the work in order. */
const screens: readonly ReactNode[] = [<ScreenWire key="w" />, <ScreenIdeas key="d" photo="vista" />, <ScreenCode key="c" />, <ScreenPhoto key="l" title="Cleaner websites. Bigger ideas." photo="lake" />];

/**
 * Process (reference 5): centred header, four numbered steps, each over a framed glass pane; the
 * panes fan gently in perspective and are joined by a hairline with nodes. No durations or promises.
 */
export const Process = () => (
  <Section id="process" aria-labelledby="process-title" className="process">
    <Plate name="process" />
    <Container className="flex flex-col gap-[var(--section-header-gap)]">
      <Reveal>
        <SectionHeader align="center" titleId="process-title" eyebrow={processSteps.eyebrow} title={processSteps.title} lead={processSteps.lead} />
      </Reveal>
      <div className="process__flow">
        <span aria-hidden className="process__line" />
        <RevealGroup className="process__list" stagger={0.12}>
          {processSteps.steps.map((step, i) => (
            <RevealItem key={step.name} className="process__step">
              <span aria-hidden className="process__num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="process__name">
                <span className="sr-only">Step {i + 1}: </span>
                {step.name}
              </h3>
              <p className="process__body">{step.body}</p>
              <div aria-hidden className="process__pane">
                <GlassPane>{screens[i]}</GlassPane>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Container>
  </Section>
);
