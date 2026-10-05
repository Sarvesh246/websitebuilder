import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Ambient } from "@/components/visual/Ambient";
import { audienceGuides, faqPage, guideBySlug, priceLine, type GuideFaq } from "@/config/guides";
import { startHref } from "@/config/inquiry";
import { customTier, packageTiers } from "@/config/pricing";
import { siteConfig } from "@/config/site";

type Crumb = { name: string; path: string };

/** Breadcrumb markup for search results: Home, then this page. Only real, existing URLs. */
const breadcrumbJsonLd = (page: Crumb) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: page.name, item: `${siteConfig.url}${page.path}` },
  ],
});

/** Readable long-form layout shared by the FAQ and the audience guides. Plain text on the page, no glass. */
const GuideShell = ({ crumb, h1, lead, children }: { crumb: Crumb; h1: string; lead: string; children: ReactNode }) => (
  <Section className="legal guide" spacing="none" aria-labelledby="guide-title">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumb)).replace(/</g, "\\u003c") }}
    />
    <Ambient preset="quiet" />
    <Container>
      <div className="legal__wrap guide__wrap">
        <header className="legal__head">
          <nav aria-label="Breadcrumb" className="guide__crumbs t-small">
            <Link href="/">{siteConfig.name}</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">{crumb.name}</span>
          </nav>
          <h1 id="guide-title" className="t-h2">
            {h1}
          </h1>
          <p className="t-lead">{lead}</p>
        </header>
        <div className="legal__body">{children}</div>
      </div>
    </Container>
  </Section>
);

const FaqList = ({ items }: { items: readonly GuideFaq[] }) => (
  <div className="guide__faq">
    {items.map((item) => (
      <div key={item.q} className="guide__qa">
        <h3 className="t-h4">{item.q}</h3>
        <p>{item.a}</p>
      </div>
    ))}
  </div>
);

const ClosingCta = () => (
  <section className="legal__section guide__closing">
    <h2 className="t-h4">Ready to start?</h2>
    <p>
      A project request takes a few minutes, costs nothing, and does not commit you to anything. You can also compare the
      packages first.
    </p>
    <div className="guide__actions">
      <Button href={startHref()} icon="diag">
        Start a Project
      </Button>
      <Button href="/#pricing" variant="secondary">
        View Pricing
      </Button>
    </div>
  </section>
);

export const AudiencePage = ({ slug }: { slug: string }) => {
  const guide = guideBySlug(slug);
  const tier = packageTiers.find((t) => t.id === guide.recommended.id);
  if (!tier) throw new Error(`Unknown package: ${guide.recommended.id}`);
  const related = guide.related.map((s) => audienceGuides.find((g) => g.slug === s)).filter((g) => g !== undefined);

  return (
    <GuideShell crumb={{ name: guide.title, path: `/${guide.slug}` }} h1={guide.h1} lead={guide.lead}>
      {guide.sections.map((section) => (
        <section key={section.heading} className="legal__section">
          <h2 className="t-h4">{section.heading}</h2>
          {section.body?.map((p) => <p key={p}>{p}</p>)}
          {section.points && (
            <ul>
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="legal__section guide__pkg" aria-labelledby="guide-pkg-title">
        <h2 id="guide-pkg-title" className="t-h4">
          The package that usually fits
        </h2>
        <div className="guide__card">
          <p className="guide__price">{priceLine(tier.id)}.</p>
          <p>{guide.recommended.why}</p>
          <ul>
            {tier.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="guide__actions">
            <Button href={startHref(tier.id)} icon="diag">
              {tier.ctaLabel}
            </Button>
            <Button href="/#pricing" variant="secondary">
              Compare all packages
            </Button>
          </div>
          <p className="t-small guide__note">
            {tier.note} Projects that need accounts, databases, or payments are quoted under {customTier.name}.
          </p>
        </div>
      </section>

      <section className="legal__section" aria-labelledby="guide-faq-title">
        <h2 id="guide-faq-title" className="t-h4">
          Common questions
        </h2>
        <FaqList items={guide.faq} />
        <p>
          More answers are on the <Link href="/faq">FAQ</Link>.
        </p>
      </section>

      <ClosingCta />

      {related.length > 0 && (
        <nav aria-label="Related guides" className="legal__section guide__related">
          <h2 className="t-h4">Related guides</h2>
          <ul>
            {related.map((g) => (
              <li key={g.slug}>
                <Link href={`/${g.slug}`}>{g.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </GuideShell>
  );
};

export const FaqView = () => (
  <GuideShell crumb={{ name: "FAQ", path: "/faq" }} h1={faqPage.h1} lead={faqPage.lead}>
    {faqPage.groups.map((group) => (
      <section key={group.title} className="legal__section">
        <h2 className="t-h4">{group.title}</h2>
        <FaqList items={group.items} />
      </section>
    ))}
    <ClosingCta />
    <nav aria-label="Guides" className="legal__section guide__related">
      <h2 className="t-h4">Guides by project type</h2>
      <ul>
        {audienceGuides.map((g) => (
          <li key={g.slug}>
            <Link href={`/${g.slug}`}>{g.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  </GuideShell>
);
