import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { about } from "@/config/about";
import { siteConfig } from "@/config/site";

/**
 * Who is behind Northframe: an understated editorial block. Statement left, the studio note and
 * the founder's own words right, separated by hairlines. No visual: the page has enough art.
 */
export const About = () => (
  <Section id="about" aria-labelledby="about-title" className="about">
    <Container>
      <div className="about__grid">
        <Reveal className="about__head">
          <span className="t-label t-label--rule">{about.eyebrow}</span>
          <h2 id="about-title" className="t-h2">
            {about.title}
          </h2>
        </Reveal>
        <Reveal className="about__text" delay={0.08}>
          <p className="t-lead about__lead">{about.lead}</p>
          <p className="about__body">{about.body}</p>
          <div className="founder">
            <span aria-hidden className="founder__mark">
              {siteConfig.founder.initial}
            </span>
            <div>
              <h3 className="founder__name">{about.founder.heading}</h3>
              <p className="founder__note">{about.founder.note}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </Container>
  </Section>
);
