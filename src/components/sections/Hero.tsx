import { Mouse } from "lucide-react";
import type { CSSProperties } from "react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { HeroVisual } from "@/components/sections/HeroVisual";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/visual/Plate";
import { siteConfig } from "@/config/site";

const valuePoints = ["Clear pricing", "Mobile-ready", "You own your site"] as const;

const step = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Above-the-fold hero, composed like reference 1: copy left, glass panes floating over the
 * rendered plinth right. Copy uses a CSS entrance (not a JS reveal) so the h1 paints immediately.
 */
export const Hero = () => (
  <Section id="top" spacing="none" className="hero">
    <Plate name="hero" eager />
    <Container className="hero__grid">
      <div className="hero__copy">
        <p className="t-label t-label--rule hero-enter" style={step(0)}>
          Web design for students and small teams
        </p>
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
          <Button href="/#process" variant="secondary" size="lg" icon="right" className="w-full sm:w-auto">
            How It Works
          </Button>
        </div>
        <ul className="hero__values hero-enter" style={step(4)}>
          {valuePoints.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
      <HeroVisual />
    </Container>
    <a href="#why" className="hero__scroll" aria-label="Scroll to the next section">
      {/* The bob animates this HTML wrapper, not the <svg>: Chrome can't composite an svg transform,
          so animating the icon itself re-rendered the whole page on the main thread every frame. */}
      <span className="hero__scroll-icon">
        <Mouse aria-hidden size={26} strokeWidth={1.3} />
      </span>
    </a>
  </Section>
);
