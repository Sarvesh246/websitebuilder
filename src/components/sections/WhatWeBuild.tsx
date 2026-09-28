import { ArrowUpRight, Blocks, Briefcase, Building2, User, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Ambient } from "@/components/visual/Ambient";
import { Horizon, type RidgeName } from "@/components/visual/Horizon";
import { serviceCategories, servicesIntro, type ServiceCategory } from "@/config/services";

const icons: Record<ServiceCategory["id"], LucideIcon> = {
  personal: User,
  professional: Briefcase,
  business: Building2,
  custom: Blocks,
};
const fragments: Record<ServiceCategory["id"], RidgeName> = {
  personal: "a",
  professional: "b",
  business: "c",
  custom: "d",
};

/**
 * "What we build": four kinds of site, presented as glass slabs standing at different heights and
 * angles (lg+), a 2x2 grid on tablets, a single stack on phones. Each slab links to #pricing; the
 * packages themselves stay in Pricing so nothing is duplicated.
 */
export const WhatWeBuild = () => (
  <Section id="services" aria-labelledby="services-title" className="build">
    <Ambient preset="build" />
    <Horizon name="wide" className="horizon-band horizon-band--faint" />
    <Container className="flex flex-col gap-[var(--section-header-gap)]">
      <Reveal>
        <SectionHeader
          titleId="services-title"
          eyebrow={servicesIntro.eyebrow}
          title={servicesIntro.title}
          lead={servicesIntro.lead}
        />
      </Reveal>

      <RevealGroup className="build__stage" stagger={0.1}>
        {serviceCategories.map((category) => {
          const Icon = icons[category.id];
          return (
            <RevealItem key={category.id} className="build__item" y={24}>
              <a
                href="#pricing"
                className="glass-slab build-panel"
                aria-labelledby={`svc-${category.id}`}
                aria-describedby={`svc-${category.id}-desc`}
              >
                <span className="build-panel__icon">
                  <Icon aria-hidden size={22} strokeWidth={1.7} />
                </span>
                <div className="build-panel__body">
                  <h3 id={`svc-${category.id}`} className="t-h3">
                    {category.title}
                  </h3>
                  <p id={`svc-${category.id}-desc`} className="t-body">
                    {category.description}
                  </p>
                  <ul className="build-panel__for">
                    {category.audience.map((who) => (
                      <li key={who}>{who}</li>
                    ))}
                  </ul>
                </div>
                <span className="build-panel__go" aria-hidden>
                  <ArrowUpRight size={18} strokeWidth={1.8} />
                </span>
                <Horizon name={fragments[category.id]} className="build-panel__scene" />
              </a>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Container>
  </Section>
);
