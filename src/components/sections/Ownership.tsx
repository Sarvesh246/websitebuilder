import { Code2, Database, Globe, User } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Plinth, Scene } from "@/components/visual/environment/Scene";
import { ownershipScene as own } from "@/config/about";

const icons = [Globe, Code2, User, Database] as const;

/**
 * Ownership: the one dark scene, between Process and Pricing (the finished site is handed over,
 * then the packages). `.dusk` flips the subtree to dark tokens; fades top and bottom blend it into
 * the bright sections around it. One smoked-glass frame on a stone plinth, lit from the upper
 * left like the rest of the page. Quiet on purpose: near-black, cool rim light, no grid.
 */
export const Ownership = () => (
  <Section id="ownership" aria-labelledby="ownership-title" className="dusk own">
    <Scene variant="dusk" seed={19} />
    <Container className="own__grid">
      <Reveal className="own__copy own__head">
        <span className="t-label t-label--rule">{own.eyebrow}</span>
        <h2 id="ownership-title" className="t-h2 own__title">
          {own.titleLines.map((line) => (
            <span key={line} className="own__line">
              {line}
            </span>
          ))}
        </h2>
        <p className="t-lead max-w-[36ch]">{own.lead}</p>
      </Reveal>
      <Reveal className="own__visual" delay={0.1}>
        <div className="own-stage" role="img" aria-label={own.visualLabel}>
          <Plinth className="own-stage__plinth" />
          <div className="own-frame">
            <div className="own-frame__glass">
              <span className="own-frame__brand">Northframe</span>
              <span className="own-frame__menu" />
              <span className="own-frame__text">
                Your website.
                <br />
                Your ownership.
              </span>
              <span className="own-frame__peaks" />
              <span className="own-frame__water" />
            </div>
          </div>
        </div>
      </Reveal>
      <Reveal className="own__copy own__foot">
        <RevealGroup className="own__items" stagger={0.08}>
          {own.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <RevealItem key={item.label} className="own__item">
                <span aria-hidden className="own__icon">
                  <Icon size={18} strokeWidth={1.6} />
                </span>
                <h3 className="t-h4">{item.label}.</h3>
                <p className="t-small">{item.body}</p>
              </RevealItem>
            );
          })}
        </RevealGroup>
        <p className="t-small own__statement">{own.statement}</p>
      </Reveal>
    </Container>
  </Section>
);
