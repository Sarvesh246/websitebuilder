import { Info, Tag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { CompareTable } from "@/components/pricing/CompareTable";
import { CustomPackage } from "@/components/pricing/CustomPackage";
import { PackageCard } from "@/components/pricing/PackageCard";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Ambient } from "@/components/visual/Ambient";
import { Plinth, Scene } from "@/components/visual/environment/Scene";
import { customTier, launchPricing, packageTiers, scopeNotes } from "@/config/pricing";

/**
 * Packages and pricing. Serves the single `#pricing` nav anchor (there is no separate Services
 * section: the packages are the services). Order: intro + launch note, three core packages,
 * Custom panel, comparison, scope notes. Ownership has its own dark section. All content comes from config/pricing.ts.
 */
export const Pricing = () => (
  <Section id="pricing" aria-labelledby="pricing-title">
    <Ambient preset="pricing" />
    <Scene variant="backdrop" seed={31} relief={0.9} />
    <Container className="flex flex-col gap-[var(--section-header-gap)]">
      <Reveal className="pricing__intro">
        <SectionHeader
          titleId="pricing-title"
          eyebrow="Pricing"
          title={<>Simple packages. No <span className="whitespace-nowrap">agency-sized</span> price tag.</>}
          lead="Fixed prices, listed up front. Pick the size of site you need, and you own it once it's live."
        />
        <GlassSurface variant="subtle" className="launch-note">
          <Tag aria-hidden size={18} strokeWidth={1.8} />
          <div>
            <h3 className="t-h4">{launchPricing.title}</h3>
            <p className="t-small">{launchPricing.body}</p>
          </div>
        </GlassSurface>
      </Reveal>

      <RevealGroup className="pricing__stage">
        <div className="pricing__cards">
          <Plinth className="pricing__plinth" />
          <Grid cols="packages" className="pricing__row">
            {packageTiers.map((tier) => (
              <RevealItem key={tier.id} className="h-full">
                <PackageCard tier={tier} />
              </RevealItem>
            ))}
          </Grid>
        </div>
        <RevealItem>
          <CustomPackage tier={customTier} />
        </RevealItem>
      </RevealGroup>

      <Reveal>
        <CompareTable />
      </Reveal>

      <Reveal>
        <div className="pricing__notes">
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
        </div>
      </Reveal>
    </Container>
  </Section>
);
