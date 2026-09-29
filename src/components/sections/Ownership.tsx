import { Code2, Database, Globe, UserRound } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Plate } from "@/components/visual/Plate";
import { GlassPane } from "@/components/visual/pane/GlassPane";
import { PaneStage } from "@/components/visual/pane/PaneStage";
import { ScreenPhoto } from "@/components/visual/pane/Screens";
import { ownershipScene as own } from "@/config/about";

const icons = [Globe, Code2, UserRound, Database] as const;

/**
 * Ownership (reference 6): the one dark scene in both themes (`.dusk` forces dark tokens). Copy,
 * four ownership marks and the plain-language promise left; one large smoked-glass pane standing
 * on the lit plinth of the rendered interior right.
 */
export const Ownership = () => (
  <Section id="ownership" aria-labelledby="ownership-title" className="dusk own">
    <Plate name="ownership" />
    <Container className="own__grid">
      <div className="own__copy">
        <Reveal className="flex flex-col items-start gap-6">
          <span className="t-label t-label--rule">{own.eyebrow}</span>
          <h2 id="ownership-title" className="t-h2 own__title">
            {own.titleLines.map((line) => (
              <span key={line} className="own__line">
                {line}
              </span>
            ))}
          </h2>
          <p className="t-lead own__lead">{own.lead}</p>
        </Reveal>
        <RevealGroup className="own__items" stagger={0.08}>
          {own.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <RevealItem key={item.label} className="own__item">
                <span aria-hidden className="own__icon">
                  <Icon size={22} strokeWidth={1.4} />
                </span>
                <h3 className="own__label">{item.label}.</h3>
                <p className="sr-only">{item.body}</p>
              </RevealItem>
            );
          })}
        </RevealGroup>
        <Reveal>
          <p className="own__statement">{own.statement}</p>
        </Reveal>
      </div>
      <PaneStage
        className="own-stage"
        label={own.visualLabel}
        layers={[{ id: "own", className: "own-pane", depth: 14, float: true, node: <GlassPane className="pane--smoke"><ScreenPhoto title="Your website. Your ownership." burger /></GlassPane> }]}
      />
    </Container>
  </Section>
);
