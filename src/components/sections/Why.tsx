import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Plate } from "@/components/visual/Plate";
import { GlassPane } from "@/components/visual/pane/GlassPane";
import { PaneStage } from "@/components/visual/pane/PaneStage";
import { ScreenPage, ScreenPhoto, ScreenTall } from "@/components/visual/pane/Screens";
import { why } from "@/config/about";

/**
 * Why Northframe (reference 2): statement and four principles left, a large glass page with three
 * satellite panes and a faint light ring floating over the plinth right.
 */
export const Why = () => (
  <Section aria-labelledby="why-title" id="why" className="why">
    <Plate name="why" />
    <Container className="why__grid">
      <div className="why__copy">
        <Reveal>
          <SectionHeader titleId="why-title" eyebrow={why.eyebrow} title={why.title} lead={why.lead} />
        </Reveal>
        <RevealGroup className="why__list" stagger={0.08}>
          {why.items.map((item, index) => (
            <RevealItem key={item.title} className="why__row">
              <span aria-hidden className="why__num">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="why__title">{item.title}</h3>
              <p className="why__body">{item.body}</p>
              {"link" in item && (
                <Link href={item.link.href} className="btn btn-link why__link">
                  {item.link.label}
                  <ArrowRight aria-hidden size={16} strokeWidth={1.75} className="btn__icon btn__icon--right" />
                </Link>
              )}
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
      <div className="why__art">
        <span aria-hidden className="why__ring" />
        <PaneStage
          className="why-stage"
          label={why.visualLabel}
          layers={[
            { id: "top", className: "why-pane--top", depth: 8, node: <GlassPane><ScreenPhoto title="Cleaner websites. Bigger ideas." photo="lake" /></GlassPane> },
            { id: "left", className: "why-pane--left", depth: 10, node: <GlassPane><ScreenTall title="Ideas deserve better websites." photo="hall" /></GlassPane> },
            { id: "right", className: "why-pane--right", depth: 12, node: <GlassPane><ScreenTall photo="vista" /></GlassPane> },
            { id: "main", className: "why-pane--main", depth: 20, float: true, node: <GlassPane><ScreenPage /></GlassPane> },
          ]}
        />
      </div>
    </Container>
  </Section>
);
