import Link from "next/link";
import { ArrowRight, Briefcase, Code2, MonitorSmartphone, UserRound } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Plate } from "@/components/visual/Plate";
import { ThemedPhoto } from "@/components/visual/ThemedPhoto";
import { services } from "@/config/about";

const icons = [UserRound, MonitorSmartphone, Briefcase, Code2] as const;
const art = ["range", "portal", "range", "peak"] as const;

/**
 * What Northframe builds (reference 4): four standing glass cards rising like steps along the
 * rendered ledge. Copy comes from config/about.ts and mirrors the packages in config/pricing.ts
 * (no prices here: pricing owns those, and every arrow leads there).
 */
export const Services = () => (
  <Section id="services" aria-labelledby="services-title" className="services">
    <Plate name="services" />
    <Container className="flex flex-col gap-[var(--section-header-gap)]">
      <Reveal>
        <SectionHeader titleId="services-title" eyebrow={services.eyebrow} title={services.title} lead={services.lead} />
      </Reveal>
      <RevealGroup className="services__row" stagger={0.1}>
        {services.items.map((item, i) => {
          const Icon = icons[i];
          return (
            <RevealItem key={item.id} className="services__item">
              <article className="pane svc">
                <div aria-hidden className="svc__art">
                  <ThemedPhoto name={art[i]} small sizes="(min-width: 1024px) 22vw, 90vw" />
                </div>
                <span aria-hidden className="svc__icon">
                  <Icon size={20} strokeWidth={1.5} />
                </span>
                <h3 className="svc__name">{item.name}</h3>
                <p className="svc__for">{item.for}</p>
                <p className="svc__body">{item.body}</p>
                <Link href="/#pricing" className="svc__link" aria-label={`See ${item.name} in pricing`}>
                  <ArrowRight aria-hidden size={20} strokeWidth={1.5} />
                </Link>
              </article>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Container>
  </Section>
);
