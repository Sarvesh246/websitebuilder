import { Check } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Ambient } from "@/components/visual/Ambient";
import { Horizon } from "@/components/visual/Horizon";
import { BrowserMockup, CreatorScreen, OrgScreen, PhoneMockup } from "@/components/visual/mockup/Mockups";
import { whyNorthframe } from "@/config/why";

const sitemap = ["Home", "Events", "Team", "Contact"];

/**
 * Why Northframe. An editorial scene rather than a grid: copy on the left, a floating concept
 * composition on the right that bleeds toward the viewport edge, standing on a stone platform in
 * front of the shared landscape. Also the temporary target of the "About" nav link (id="about").
 * Phones: copy, then the main browser, then two small panels. The phone and arc are dropped.
 */
export const WhyNorthframe = () => (
  <Section id="about" aria-labelledby="why-title" className="why">
    <Ambient preset="scene" />
    <Container className="why__grid">
      <Reveal className="why__copy">
        <span className="t-label t-label--rule">{whyNorthframe.eyebrow}</span>
        <h2 id="why-title" className="t-h2">
          {whyNorthframe.title}
        </h2>
        <p className="t-lead">{whyNorthframe.lead}</p>
        <p className="why__secondary">{whyNorthframe.secondary}</p>
        <ul className="why__points">
          {whyNorthframe.points.map((point) => (
            <li key={point.title}>
              <Check aria-hidden size={16} strokeWidth={2} />
              <div>
                <h3 className="t-h4">{point.title}</h3>
                <p className="t-small">{point.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="why__scene-wrap" delay={0.1}>
        <div
          className="why__scene"
          role="img"
          aria-label="Concept composition: a custom website design shown on desktop and mobile, with a type and color system and a page structure."
        >
          <Horizon name="wide" className="why__ridge" />
          <span className="arc why__arc" />
          <div className="why__main">
            <BrowserMockup url="yourorganization.org">
              <OrgScreen />
            </BrowserMockup>
          </div>
          <div className="glass-slab why__panel why__panel--type why__float" aria-hidden>
            <span className="why__aa">Aa</span>
            <span className="why__swatches">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="why__cap">Visual direction</span>
          </div>
          <div className="glass-slab why__panel why__panel--map why__float" aria-hidden>
            <span className="why__cap">Structure</span>
            <ul>
              {sitemap.map((page) => (
                <li key={page}>{page}</li>
              ))}
            </ul>
          </div>
          <div className="why__phone why__float" aria-hidden>
            <PhoneMockup>
              <CreatorScreen />
            </PhoneMockup>
          </div>
          <div className="stone" aria-hidden>
            <span className="stone__top" />
            <span className="stone__face" />
          </div>
        </div>
      </Reveal>
    </Container>
  </Section>
);
