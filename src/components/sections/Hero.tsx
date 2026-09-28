import { KeyRound, Smartphone, Tag } from "lucide-react";
import type { CSSProperties } from "react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { HeroVisual } from "@/components/sections/HeroVisual";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Ambient, Glow } from "@/components/visual/Ambient";
import { siteConfig } from "@/config/site";

const valuePoints = [
  { icon: Tag, label: "Clear pricing" },
  { icon: Smartphone, label: "Mobile-ready" },
  { icon: KeyRound, label: "You own your site" },
] as const;

const step = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Above-the-fold hero. Left: badge, h1, one supporting line, CTAs, value points.
 * Right (below the copy on phones): the layered mockup composition.
 * Copy uses a CSS entrance (not a JS reveal) so the h1 paints immediately, which keeps LCP fast.
 */
export const Hero = () => (
  <Section id="top" spacing="none" className="hero">
    <Ambient preset="hero" />
    {/* Extra light behind the mockups so glass and shadows have something to sit in. */}
    <div aria-hidden className="ambient hero-stagelight">
      <Glow tone="cool" x="72%" y="52%" size="46rem" intensity={0.8} />
      <Glow tone="warm" x="86%" y="82%" size="28rem" intensity={0.7} />
    </div>
    <Container className="hero__grid">
      <div className="hero__copy">
        <Badge tone="neutral" className="hero-enter" style={step(0)}>
          Web design for students and small teams
        </Badge>
        <h1 className="t-hero hero-enter" style={step(1)}>
          Professional websites without agency prices.
        </h1>
        <p className="t-lead hero__lead hero-enter" style={step(2)}>
          Custom-designed sites for creators, student orgs, and small businesses, with the polish of a product studio.
        </p>
        <div className="hero__cta hero-enter" style={step(3)}>
          <Button href={siteConfig.cta.href} size="lg" icon="diag" className="w-full sm:w-auto">
            {siteConfig.cta.label}
          </Button>
          <Button href="/#work" variant="secondary" size="lg" icon="right" className="w-full sm:w-auto">
            Explore Work
          </Button>
        </div>
        <ul className="hero__values hero-enter" style={step(4)}>
          {valuePoints.map(({ icon: Icon, label }) => (
            <li key={label}>
              <Icon aria-hidden size={16} strokeWidth={1.8} />
              {label}
            </li>
          ))}
        </ul>
      </div>
      <HeroVisual />
    </Container>
  </Section>
);
