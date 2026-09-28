import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Ambient } from "@/components/visual/Ambient";
import { Plinth } from "@/components/visual/environment/Scene";
import { BrowserMockup, CafeScreen, CreatorScreen, PhoneMockup, PortfolioScreen } from "@/components/visual/mockup/Mockups";
import { why } from "@/config/about";

/**
 * Why Northframe: an editorial moment. Copy and four numbered principles on the left (rows, not
 * cards), a large glass browser with two supporting objects standing on a stone platform on the
 * right. The composition does the persuading, so there is very little copy.
 */
export const Why = () => (
  <Section aria-labelledby="why-title" id="why">
    <Ambient preset="quiet" />
    <Container>
      <div className="why">
        <div className="why__copy">
          <Reveal>
            <SectionHeader titleId="why-title" eyebrow={why.eyebrow} title={why.title} />
          </Reveal>
          <RevealGroup className="why__list" stagger={0.09}>
            {why.items.map((item, index) => (
              <RevealItem key={item.title} className="why__row">
                <span aria-hidden className="why__num">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="t-h4">{item.title}</h3>
                  <p className="t-body max-w-[46ch] text-muted">{item.body}</p>
                  {"link" in item && (
                    <Link href={item.link.href} className="btn btn-link why__link">
                      {item.link.label}
                      <ArrowRight aria-hidden size={16} strokeWidth={1.75} className="btn__icon btn__icon--right" />
                    </Link>
                  )}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
        <Reveal className="why__art" delay={0.1}>
          <div className="why-stage" role="img" aria-label="Concept designs for a cafe website, a portfolio, and a creator page, shown on glass panels standing on a stone platform">
            <Plinth className="why-stage__plinth" />
            <div className="why-stage__scene">
              <div className="why-stage__back">
                <BrowserMockup url="nora.studio">
                  <PortfolioScreen />
                </BrowserMockup>
              </div>
              <div className="why-stage__main reflect">
                <BrowserMockup url="alder.coffee">
                  <CafeScreen />
                </BrowserMockup>
              </div>
              <div className="why-stage__phone">
                <PhoneMockup>
                  <CreatorScreen />
                </PhoneMockup>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Container>
  </Section>
);
