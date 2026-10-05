import { Check, Info, Tag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { CompareTable } from "@/components/pricing/CompareTable";
import { CustomCard, PackageCard } from "@/components/pricing/PackageCard";
import { Plate } from "@/components/visual/Plate";
import {
  commonInclusions,
  customTier,
  foundingPricing,
  packageTiers,
  pricingUpdated,
  scopeNotes,
  studentFootnote,
} from "@/config/pricing";

/**
 * Packages and pricing (reference 7): centred header, four cards in one row on desktop (Custom
 * is the fourth, priced by scope), then what every package includes, the comparison and the
 * scope notes. All content comes from config/pricing.ts.
 */
export const Pricing = () => (
  <Section id="pricing" aria-labelledby="pricing-title" className="pricing">
    <Plate name="pricing" />
    <Container className="flex flex-col gap-[var(--section-header-gap)]">
      <Reveal className="flex flex-col items-center gap-6">
        <SectionHeader
          align="center"
          titleId="pricing-title"
          eyebrow="Pricing"
          title={<>Simple packages. No <span className="whitespace-nowrap">agency-sized</span> price tag.</>}
          lead="Fixed one-time prices, listed up front. Pick the size of site you need. Accounts, databases, and payments are Custom."
        />
        <p className="pricing__founding">
          <Tag aria-hidden size={15} strokeWidth={1.8} />
          <span>
            <strong>{foundingPricing.title}:</strong> {foundingPricing.body}
          </span>
        </p>
        {studentFootnote() && <p className="t-small text-muted">{studentFootnote()}</p>}
        <p className="t-small text-muted">
          Pricing updated <time dateTime={pricingUpdated.iso}>{pricingUpdated.label}</time>.
        </p>
      </Reveal>

      <RevealGroup className="pricing__row" stagger={0.08}>
        {packageTiers.map((tier) => (
          <RevealItem key={tier.id} className="h-full">
            <PackageCard tier={tier} />
          </RevealItem>
        ))}
        <RevealItem className="h-full">
          <CustomCard tier={customTier} />
        </RevealItem>
      </RevealGroup>

      <Reveal>
        <div className="pkg-common">
          <h3 className="t-label">{commonInclusions.title}</h3>
          <ul>
            {commonInclusions.items.map((item) => (
              <li key={item}>
                <Check aria-hidden size={15} strokeWidth={2} />
                {item}
              </li>
            ))}
          </ul>
          <p className="pkg-common__own">
            <strong>{commonInclusions.ownership}</strong> {commonInclusions.flow}
          </p>
        </div>
      </Reveal>

      <Reveal>
        <CompareTable />
      </Reveal>

      <Reveal>
        <div className="scope-notes">
          <h3 className="t-label">Good to know</h3>
          <ul>
            {scopeNotes.map((note) => (
              <li key={note}>
                <Info aria-hidden size={16} strokeWidth={1.8} />
                {note}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Container>
  </Section>
);
