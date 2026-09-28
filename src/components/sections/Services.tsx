import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Ambient } from "@/components/visual/Ambient";
import { Plinth, Scene } from "@/components/visual/environment/Scene";
import { MiniSite, type MiniKind } from "@/components/visual/MiniSite";
import { services } from "@/config/about";

const kinds: readonly MiniKind[] = ["personal", "professional", "business", "custom"];

/**
 * Four kinds of project as tall standing glass panels: offset heights on desktop (an architectural
 * stair, not a grid of equal cards), 2x2 on tablet, a simple stack on phones. Each panel carries
 * a small site sketch that grows in complexity. Copy comes from config/about.ts and mirrors the
 * package tiers in config/pricing.ts (no prices here: pricing owns those).
 */
export const Services = () => (
  <Section id="services" aria-labelledby="services-title">
    <Ambient preset="section" />
    <Scene variant="backdrop" seed={3} relief={0.8} />
    <Container className="flex flex-col gap-[var(--section-header-gap)]">
      <Reveal>
        <SectionHeader titleId="services-title" eyebrow={services.eyebrow} title={services.title} lead={services.lead} />
      </Reveal>
      <div className="services">
        <RevealGroup className="services__row" stagger={0.1}>
          {services.items.map((item, i) => (
            <RevealItem key={item.id} className={`services__item services__item--${i}`}>
              <GlassSurface as="article" padded={false} className="glass-slab panel">
                <div aria-hidden className="panel__art">
                  <MiniSite kind={kinds[i]} />
                </div>
                <div className="panel__body">
                  <span aria-hidden className="panel__index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="t-h3">{item.name}</h3>
                  <p className="t-label panel__for">{item.for}</p>
                  <p className="t-body text-muted">{item.body}</p>
                  <ul className="panel__points">
                    {item.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </GlassSurface>
            </RevealItem>
          ))}
        </RevealGroup>
        <Plinth className="services__plinth" />
      </div>
    </Container>
  </Section>
);
