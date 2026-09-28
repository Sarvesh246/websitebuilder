import { Container } from "@/components/layout/Container";
import { Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal } from "@/components/motion/Reveal";
import { Ambient } from "@/components/visual/Ambient";
import { AboutVisual } from "@/components/visual/AboutVisual";
import { about } from "@/config/about";
import { siteConfig } from "@/config/site";

/** Who is behind Northframe. Copy-first on phones; composition to the right from lg. */
export const About = () => (
  <Section id="about" aria-labelledby="about-title">
    <Ambient preset="section" />
    <Container>
      <Grid cols="split" className="about lg:gap-x-[var(--grid-gap)]">
        <Reveal className="about__copy lg:col-span-6">
          <SectionHeader titleId="about-title" eyebrow={about.eyebrow} title={about.title} lead={about.lead} />
          <p className="t-body max-w-[52ch] text-muted">{about.body}</p>
          <div className="founder">
            <span aria-hidden className="founder__mark">
              {siteConfig.founder.initial}
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="t-h4">{about.founder.heading}</h3>
              <p className="t-body max-w-[52ch] text-muted">{about.founder.note}</p>
            </div>
          </div>
        </Reveal>
        <Reveal className="about__art lg:col-span-6" delay={0.1}>
          <AboutVisual />
        </Reveal>
      </Grid>
    </Container>
  </Section>
);
