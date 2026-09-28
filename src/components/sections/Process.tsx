import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal } from "@/components/motion/Reveal";
import { ProcessTrack } from "@/components/process/ProcessTrack";
import { ProcessVisual } from "@/components/process/ProcessVisual";
import { Ambient } from "@/components/visual/Ambient";
import { processIntro, processSteps } from "@/config/process";

/**
 * Process: one site shown four ways (wireframe, design, code, live), joined by a connector that
 * draws itself. Horizontal at xl, vertical rail below. Step numbers are decorative (the ordered
 * list already carries order), so screen readers get title + description only.
 */
export const Process = () => (
  <Section id="process" aria-labelledby="process-title" className="process">
    <Ambient preset="flow" />
    <Container className="flex flex-col gap-[var(--section-header-gap)]">
      <Reveal>
        <SectionHeader
          titleId="process-title"
          eyebrow={processIntro.eyebrow}
          title={processIntro.title}
          lead={processIntro.lead}
        />
      </Reveal>
      <ProcessTrack
        items={processSteps.map((step) => ({
          key: step.id,
          number: step.number,
          visual: <ProcessVisual stage={step.id} />,
          text: (
            <>
              <h3 className="t-h3">{step.title}</h3>
              <p className="t-body">{step.body}</p>
            </>
          ),
        }))}
      />
    </Container>
  </Section>
);
