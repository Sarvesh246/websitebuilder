import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Grid } from "@/components/layout/Grid";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Ambient } from "@/components/visual/Ambient";
import { CustomPackage } from "@/components/pricing/CustomPackage";
import { PackageCard } from "@/components/pricing/PackageCard";
import { customTier, packageTiers } from "@/config/pricing";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const swatches = [
  ["--bg", "Background"],
  ["--bg-raised", "Raised"],
  ["--surface-solid", "Solid surface"],
  ["--text-strong", "Text strong"],
  ["--text", "Text"],
  ["--text-muted", "Text muted"],
  ["--accent", "Accent"],
  ["--accent-soft", "Accent soft"],
  ["--btn-primary-bg", "Primary button"],
  ["--border-strong", "Border strong"],
] as const;

const typeScale = [
  ["t-display", "Websites built to make an impression."],
  ["t-h2", "Choose what fits."],
  ["t-h3", "A clear process."],
  ["t-h4", "Personal, professional, business."],
  ["t-lead", "Start simple or build something more ambitious. Every project includes responsive design, deployment, and complete ownership."],
  ["t-body", "Body copy sits at a comfortable measure with generous line height, so longer paragraphs stay easy to read on any screen."],
  ["t-small", "Supporting copy, captions and helper text."],
] as const;

export default function DesignSystemPage() {
  return (
    <>
      <Section spacing="tight" className="pt-[calc(var(--nav-h)+3rem)]">
        <Ambient preset="hero" />
        <Container>
          <SectionHeader
            as="h1"
            eyebrow="Foundation"
            title="Design system"
            lead="Tokens, type, glass, lighting, motion and layout primitives. Switch the theme in the header to check both modes."
          />
        </Container>
      </Section>

      <Section spacing="tight">
        <Ambient preset="quiet" />
        <Container>
          <h2 className="t-h3 mb-8">Colour tokens</h2>
          <Grid cols="four" className="[&>*]:min-w-0">
            {swatches.map(([token, label]) => (
              <div key={token} className="flex items-center gap-4">
                <span
                  className="size-14 flex-none rounded-md border border-line-strong"
                  style={{ background: `var(${token})` }}
                />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-strong">{label}</span>
                  <code className="text-xs text-muted">{token}</code>
                </span>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section spacing="tight">
        <Container className="flex flex-col gap-10">
          <h2 className="t-h3">Typography</h2>
          <div className="flex flex-col gap-8">
            {typeScale.map(([cls, sample]) => (
              <div key={cls} className="grid gap-2 lg:grid-cols-[9rem_1fr] lg:gap-8">
                <code className="pt-2 text-xs text-muted">.{cls}</code>
                <p className={`${cls} max-w-[32ch] lg:max-w-[46ch]`}>{sample}</p>
              </div>
            ))}
            <div className="grid gap-2 lg:grid-cols-[9rem_1fr] lg:gap-8">
              <code className="pt-2 text-xs text-muted">.t-label / .t-price</code>
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <span className="t-label t-label--rule">The process</span>
                <span className="flex items-baseline gap-3">
                  <span className="t-price">$200</span>
                  <span className="t-price-was text-2xl">$350</span>
                </span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="tight">
        <Container className="flex flex-col gap-10">
          <h2 className="t-h3">Buttons and badges</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button icon="diag">Start a Project</Button>
            <Button variant="secondary" icon="right">Explore Work</Button>
            <Button variant="link" icon="diag">View project</Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" icon="diag">Large primary</Button>
            <Button size="lg" variant="secondary" icon="right">Large secondary</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge><Sparkles aria-hidden size={12} strokeWidth={2} />Best value</Badge>
            <Badge>Founding Client Pricing</Badge>
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="outline">Outline</Badge>
          </div>
        </Container>
      </Section>

      <Section>
        <Ambient preset="section" />
        <Container className="flex flex-col gap-12">
          <SectionHeader
            eyebrow="Glass"
            title="Surfaces with depth."
            lead="Fill, blur, hairline, inner highlight, rim light and tinted shadow, layered over lighting."
          />
          <RevealGroup>
            <Grid cols="four">
              {(
                [
                  ["subtle", "Subtle", "Quiet grouping. Low blur, no shadow."],
                  ["default", "Default", "The standard card surface."],
                  ["elevated", "Elevated", "Floating UI: menus and bars."],
                  ["feature", "Feature", "The one highlighted card in a set."],
                ] as const
              ).map(([variant, name, note]) => (
                <RevealItem key={variant} className="min-h-full">
                  <GlassSurface variant={variant} className="flex h-full min-h-48 flex-col gap-2">
                    <h3 className="t-h4">{name}</h3>
                    <p className="t-small">{note}</p>
                  </GlassSurface>
                </RevealItem>
              ))}
            </Grid>
          </RevealGroup>
          <Grid cols="two">
            <GlassSurface interactive as="a" href="#main" className="flex min-h-40 flex-col gap-2">
              <h3 className="t-h4">Interactive</h3>
              <p className="t-small">Hover lifts the card and strengthens the edge. Keyboard focus shows a ring.</p>
            </GlassSurface>
            <GlassSurface variant="subtle" className="flex min-h-40 flex-col gap-2">
              <h3 className="t-h4">Reduced transparency</h3>
              <p className="t-small">Falls back to a solid surface when blur is unavailable or the OS asks for less transparency.</p>
            </GlassSurface>
          </Grid>
        </Container>
      </Section>

      <Section>
        <Ambient preset="pricing" />
        <Container className="flex flex-col gap-12">
          <SectionHeader
            align="center"
            eyebrow="Pricing"
            title="Choose what fits."
            lead="Real data from config/pricing.ts, rendered by the PackageCard and CustomPackage components."
            className="mx-auto"
          />
          <Grid cols="packages">
            {packageTiers.map((tier) => (
              <PackageCard key={tier.id} tier={tier} />
            ))}
          </Grid>
          <CustomPackage tier={customTier} />
        </Container>
      </Section>
    </>
  );
}
