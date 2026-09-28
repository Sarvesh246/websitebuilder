import { Check } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Plinth, Scene } from "@/components/visual/environment/Scene";
import { BrowserMockup } from "@/components/visual/mockup/Mockups";
import { ownershipScene as own } from "@/config/about";

const rows = [
  { k: "Domain", v: "yourname.com" },
  { k: "Code", v: "Repository and files" },
  { k: "Accounts", v: "Hosting, analytics, email" },
  { k: "Data", v: "Forms and content" },
] as const;

/**
 * Ownership: the one dark scene. `.dusk` flips the subtree to dark tokens, so glass, text and
 * terrain re-light themselves; fades top and bottom blend it into the bright sections around it.
 * Quiet on purpose: near-black, cool rim light, one low glow, no grid.
 */
export const Ownership = () => (
  <Section id="ownership" aria-labelledby="ownership-title" className="dusk own">
    <Scene variant="dusk" seed={19} />
    <Container className="own__grid">
      <Reveal className="own__copy">
        <span className="t-label t-label--rule">{own.eyebrow}</span>
        <h2 id="ownership-title" className="t-h2 own__title">
          {own.titleLines.map((line) => (
            <span key={line} className="own__line">
              {line}
            </span>
          ))}
        </h2>
        <p className="t-lead max-w-[36ch]">{own.lead}</p>
        <RevealGroup className="own__items" stagger={0.08}>
          {own.items.map((item) => (
            <RevealItem key={item.label} className="own__item">
              <h3 className="t-h4">{item.label}</h3>
              <p className="t-small">{item.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Reveal>
      <Reveal className="own__visual" delay={0.1}>
        <div className="own-stage" role="img" aria-label={own.visualLabel}>
          <Plinth className="own-stage__plinth" />
          <div className="own-stage__glass">
            <BrowserMockup url="yourname.com/account">
              <div className="own-screen">
                <p className="own-screen__title">Account overview</p>
                {rows.map((r) => (
                  <div key={r.k} className="own-screen__row">
                    <span className="own-screen__k">{r.k}</span>
                    <span className="own-screen__v">{r.v}</span>
                    <span className="own-screen__owner">
                      <Check aria-hidden size={12} strokeWidth={2.4} />
                      You
                    </span>
                  </div>
                ))}
              </div>
            </BrowserMockup>
          </div>
        </div>
        <p className="own__note">{own.note}</p>
      </Reveal>
    </Container>
  </Section>
);
