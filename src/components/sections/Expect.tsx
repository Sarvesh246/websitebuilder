import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Ambient } from "@/components/visual/Ambient";
import { expect } from "@/config/about";

/** Working principles in place of testimonials: numbered editorial rows, not another card grid. */
export const Expect = () => (
  <Section aria-labelledby="expect-title" spacing="tight">
    <Ambient preset="quiet" />
    <Container>
      <div className="expect">
        <Reveal className="expect__head">
          <SectionHeader titleId="expect-title" eyebrow={expect.eyebrow} title={expect.title} />
        </Reveal>
        <RevealGroup className="expect__list" stagger={0.09}>
          {expect.items.map((item, index) => (
            <RevealItem key={item.title} className="expect__row">
              <span aria-hidden className="expect__num">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="t-h4">{item.title}</h3>
                <p className="t-body max-w-[46ch] text-muted">{item.body}</p>
                {"link" in item && (
                  <Link href={item.link.href} className="btn btn-link expect__link">
                    {item.link.label}
                    <ArrowRight aria-hidden size={16} strokeWidth={1.75} className="btn__icon btn__icon--right" />
                  </Link>
                )}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Container>
  </Section>
);
