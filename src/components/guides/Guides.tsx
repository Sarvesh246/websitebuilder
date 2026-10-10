import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { DocAside, slugify, tocFrom, type TocItem } from "@/components/legal/DocAside";
import { CostCalculator } from "@/components/tools/CostCalculator";
import { ComparisonGuide, isComparisonGuide } from "@/components/guides/ComparisonGuide";
import { Button } from "@/components/ui/Button";
import { Ambient } from "@/components/visual/Ambient";
import { articleBySlug, articles, formatDate, type Article } from "@/config/articles";
import { audienceGuides, faqPage, guideBySlug, guidesUpdated, priceLine, type GuideFaq, type GuideSection } from "@/config/guides";
import { startHref } from "@/config/inquiry";
import { commonInclusions, customTier, packageTiers } from "@/config/pricing";
import { aboutPage } from "@/config/about";
import { siteConfig } from "@/config/site";
import { parseRich, plainText } from "@/lib/richText";
import { founderId, founderNode, graph, organizationNode, orgId, toJsonLd } from "@/lib/structuredData";

type Crumb = { name: string; path: string };

const jsonLdScript = (data: object) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(data) }} />
);

/** Breadcrumb markup for search results: Home, then each level down to this page. Only real, existing URLs. */
const breadcrumbJsonLd = (trail: readonly Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: siteConfig.entityName, path: "" }, ...trail].map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: `${siteConfig.url}${c.path}`,
  })),
});

type Byline = { updated: string; published?: string };

/**
 * Readable long-form layout shared by the FAQ, the audience pages, the guides and About. Plain text on
 * the page, no glass. One <article> with a header (breadcrumbs, h1, lead, byline) and the body.
 * From lg up the page is centred: header across the top, text column left, sticky `DocAside` rail
 * right. `wide` drops the rail and lets the body use the full width (calculator, guides index).
 */
const GuideShell = ({
  trail,
  h1,
  lead,
  byline,
  jsonLd,
  toc = [],
  wide = false,
  purpose,
  children,
}: {
  trail: readonly Crumb[];
  h1: string;
  lead: string;
  byline?: Byline;
  jsonLd?: object;
  toc?: readonly TocItem[];
  wide?: boolean;
  purpose?: "calculator" | "comparison";
  children: ReactNode;
}) => (
  <Section className="legal guide" spacing="none" aria-labelledby="guide-title">
    {jsonLdScript(breadcrumbJsonLd(trail))}
    {jsonLd && jsonLdScript(jsonLd)}
    <Ambient preset="quiet" />
    <Container>
      <article className={`legal__wrap doc${wide ? " doc--wide" : ""}${purpose ? ` purpose-guide purpose-guide--${purpose}` : ""}`}>
        <header className="legal__head">
          <nav aria-label="Breadcrumb" className="guide__crumbs t-small">
            <Link href="/">{siteConfig.entityName}</Link>
            {trail.map((c, i) => (
              <Fragment key={c.path}>
                <span aria-hidden>/</span>
                {i === trail.length - 1 ? <span aria-current="page">{c.name}</span> : <Link href={c.path}>{c.name}</Link>}
              </Fragment>
            ))}
          </nav>
          <h1 id="guide-title" className="t-h2">
            {h1}
          </h1>
          <p className="t-lead">{lead}</p>
          {byline && (
            <p className="guide__byline t-small">
              By <Link href="/about">{siteConfig.founder.fullName}</Link>, {siteConfig.entityName}
              <span aria-hidden> · </span>
              Updated <time dateTime={byline.updated}>{formatDate(byline.updated)}</time>
            </p>
          )}
        </header>
        <div className="legal__body">{children}</div>
        {!wide && <DocAside toc={toc} />}
      </article>
    </Container>
  </Section>
);

const orgRef = { "@id": orgId };
const founderRef = { "@id": founderId };

/** One commercial page = one Service offered by the organization (no ratings, areas or reviews). */
const serviceJsonLd = (name: string, description: string, path: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name,
  description,
  url: `${siteConfig.url}${path}`,
  serviceType: "Web design",
  provider: orgRef,
});

/** Copy with `[anchor](/path)` links rendered as in-body internal links (see lib/richText.ts). */
const Rich = ({ text }: { text: string }) =>
  parseRich(text).map((part, i) =>
    part.href ? (
      <Link key={i} href={part.href}>
        {part.text}
      </Link>
    ) : (
      <Fragment key={i}>{part.text}</Fragment>
    ),
  );

const Sections = ({ sections }: { sections: readonly GuideSection[] }) =>
  sections.map((section) => (
    <section key={section.heading} id={slugify(section.heading)} className="legal__section">
      <h2 className="t-h4">{section.heading}</h2>
      {section.body?.map((p) => (
        <p key={p}>
          <Rich text={p} />
        </p>
      ))}
      {section.table && (
        <div className="guide__table">
          <table>
            <caption className="sr-only">{section.table.caption}</caption>
            <thead>
              <tr>
                {section.table.columns.map((c, i) => (
                  <th key={c} scope="col">
                    {i === 0 ? <span className="sr-only">{c}</span> : c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map(([label, ...cells]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {cells.map((cell, i) => (
                    <td key={i} data-label={section.table?.columns[i + 1]}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {section.points && (
        <ul>
          {section.points.map((point) => (
            <li key={point}>
              <Rich text={point} />
            </li>
          ))}
        </ul>
      )}
    </section>
  ));

const FaqList = ({ items }: { items: readonly GuideFaq[] }) => (
  <div className="guide__faq">
    {items.map((item) => (
      <div key={item.q} className="guide__qa">
        <h3 className="t-h4">{item.q}</h3>
        <p>
          <Rich text={item.a} />
        </p>
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
  const cluster = articles.filter((a) => a.hub === guide.slug);

  return (
    <GuideShell
      trail={[{ name: guide.title, path: `/${guide.slug}` }]}
      h1={guide.h1}
      lead={guide.lead}
      byline={{ updated: guidesUpdated }}
      jsonLd={serviceJsonLd(guide.title, guide.description, `/${guide.slug}`)}
      toc={[
        ...tocFrom(guide.sections.map((s) => s.heading)),
        { id: "guide-pkg", label: "The package that usually fits" },
        { id: "guide-faq", label: "Common questions" },
      ]}
    >
      <Sections sections={guide.sections} />

      <section id="guide-pkg" className="legal__section guide__pkg" aria-labelledby="guide-pkg-title">
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

      <section id="guide-faq" className="legal__section" aria-labelledby="guide-faq-title">
        <h2 id="guide-faq-title" className="t-h4">
          Common questions
        </h2>
        <FaqList items={guide.faq} />
        <p>
          More answers are on the <Link href="/faq">FAQ</Link>.
        </p>
      </section>

      <ClosingCta />

      <nav aria-label="Related guides" className="legal__section guide__related">
        <h2 className="t-h4">Related guides</h2>
        <ul>
          {related.map((g) => (
            <li key={g.slug}>
              <Link href={`/${g.slug}`}>{g.label}</Link>
            </li>
          ))}
          {cluster.map((a) => (
            <li key={a.slug}>
              <Link href={`/guides/${a.slug}`}>{a.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </GuideShell>
  );
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqPage.groups.flatMap((g) =>
    g.items.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: plainText(item.a) } })),
  ),
};

export const FaqView = () => (
  <GuideShell
    trail={[{ name: "FAQ", path: "/faq" }]}
    h1={faqPage.h1}
    lead={faqPage.lead}
    byline={{ updated: guidesUpdated }}
    jsonLd={faqJsonLd}
    toc={tocFrom(faqPage.groups.map((g) => g.title))}
  >
    {faqPage.groups.map((group) => (
      <section key={group.title} id={slugify(group.title)} className="legal__section">
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
        <li>
          <Link href="/guides">All guides</Link>
        </li>
        <li>
          <Link href="/tools/website-cost-calculator">Website cost calculator</Link>
        </li>
      </ul>
    </nav>
  </GuideShell>
);

const articleJsonLd = (a: Article) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: a.h1,
  description: a.description,
  url: `${siteConfig.url}/guides/${a.slug}`,
  mainEntityOfPage: `${siteConfig.url}/guides/${a.slug}`,
  datePublished: a.published,
  dateModified: a.updated,
  inLanguage: "en-US",
  author: { "@type": "Person", ...founderRef, name: siteConfig.founder.fullName, url: `${siteConfig.url}/about` },
  publisher: orgRef,
});

const guidesCrumb: Crumb = { name: "Guides", path: "/guides" };

/** One guide under /guides/[slug]: the direct answer first, then sections, questions, and the next step. */
export const ArticleView = ({ slug }: { slug: string }) => {
  const article = articleBySlug(slug);
  if (!article) throw new Error(`Unknown article: ${slug}`);
  const hub = guideBySlug(article.hub);
  const related = article.related.map(articleBySlug).filter((a) => a !== undefined);

  return (
    <GuideShell
      trail={[guidesCrumb, { name: article.title, path: `/guides/${article.slug}` }]}
      h1={article.h1}
      lead={article.lead}
      byline={{ updated: article.updated, published: article.published }}
      jsonLd={articleJsonLd(article)}
      wide={isComparisonGuide(slug)}
      purpose={isComparisonGuide(slug) ? "comparison" : undefined}
      toc={[
        ...tocFrom(article.sections.map((s) => s.heading)),
        ...(article.faq ? [{ id: "article-faq", label: "Common questions" }] : []),
        { id: "article-next", label: hub.label },
      ]}
    >
      {isComparisonGuide(slug) && <ComparisonGuide slug={slug} />}
      {isComparisonGuide(slug) ? <div className="comparison-reading"><Sections sections={article.sections} /></div> : <Sections sections={article.sections} />}

      {article.faq && (
        <section id="article-faq" className="legal__section" aria-labelledby="article-faq-title">
          <h2 id="article-faq-title" className="t-h4">
            Common questions
          </h2>
          <FaqList items={article.faq} />
        </section>
      )}

      <section id="article-next" className="legal__section guide__pkg" aria-labelledby="article-next-title">
        <h2 id="article-next-title" className="t-h4">
          {hub.label}
        </h2>
        <div className="guide__card">
          <p>{hub.description}</p>
          <div className="guide__actions">
            <Button href={`/${hub.slug}`} icon="diag" aria-label={`Read more: ${hub.label}`}>
              Read more
            </Button>
            <Button href="/#pricing" variant="secondary">
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      <nav aria-label="Related guides" className="legal__section guide__related">
        <h2 className="t-h4">Related guides</h2>
        <ul>
          {related.map((a) => (
            <li key={a.slug}>
              <Link href={`/guides/${a.slug}`}>{a.title}</Link>
            </li>
          ))}
          <li>
            <Link href="/guides">All guides</Link>
          </li>
          <li>
            <Link href="/faq">FAQ</Link>
          </li>
        </ul>
      </nav>
    </GuideShell>
  );
};

/** /guides: every guide grouped under the audience page it supports. */
export const GuidesIndex = () => (
  <GuideShell
    trail={[guidesCrumb]}
    wide
    h1="Guides for planning a website."
    lead="Practical guides on portfolios, student organization sites, small business websites, pricing, and ownership. Each one answers a specific question, and links to the page for that kind of project."
    jsonLd={{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Guides",
      url: `${siteConfig.url}/guides`,
      publisher: orgRef,
      hasPart: articles.map((a) => ({ "@type": "Article", headline: a.h1, url: `${siteConfig.url}/guides/${a.slug}` })),
    }}
  >
    {audienceGuides
      .filter((g) => articles.some((a) => a.hub === g.slug))
      .map((g) => (
        <section key={g.slug} className="legal__section guide__related">
          <h2 className="t-h4">
            <Link href={`/${g.slug}`}>{g.label}</Link>
          </h2>
          <ul className="guide__list">
            {articles
              .filter((a) => a.hub === g.slug)
              .map((a) => (
                <li key={a.slug}>
                  <Link href={`/guides/${a.slug}`}>{a.title}</Link>
                  <span className="t-small">{a.description}</span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    <section className="legal__section guide__related">
      <h2 className="t-h4">Tools and answers</h2>
      <ul className="guide__list">
        <li>
          <Link href="/tools/website-cost-calculator">Website cost calculator</Link>
          <span className="t-small">Choose your pages and features to see which package fits and what it costs.</span>
        </li>
        <li>
          <Link href="/faq">FAQ</Link>
          <span className="t-small">{faqPage.description}</span>
        </li>
      </ul>
    </section>
    <ClosingCta />
  </GuideShell>
);

/** /about: who runs Northframe Builds, what it makes and how. Person + Organization + AboutPage markup. */
export const AboutView = () => (
  <GuideShell
    trail={[{ name: "About", path: "/about" }]}
    toc={tocFrom(aboutPage.sections.map((s) => s.heading))}
    h1={aboutPage.h1}
    lead={aboutPage.lead}
    jsonLd={graph(
      { "@type": "AboutPage", url: `${siteConfig.url}/about`, name: aboutPage.title, about: orgRef, mainEntity: founderRef },
      organizationNode,
      founderNode,
    )}
  >
    <Sections sections={aboutPage.sections} />
    <nav aria-label="More from Northframe Builds" className="legal__section guide__related">
      <h2 className="t-h4">See more</h2>
      <ul>
        <li>
          <Link href="/work">Website concepts</Link>
        </li>
        <li>
          <Link href="/#pricing">Packages and pricing</Link>
        </li>
        <li>
          <Link href="/guides">Guides</Link>
        </li>
        <li>
          <Link href="/faq">FAQ</Link>
        </li>
        {siteConfig.social.map((s) => (
          <li key={s.href}>
            <a href={s.href} rel="me noopener noreferrer">
              {siteConfig.entityName} on {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
    <ClosingCta />
  </GuideShell>
);

const calcPath = "/tools/website-cost-calculator";

/** /tools/website-cost-calculator: the interactive estimate, then the same rules as plain text. */
export const CalculatorView = () => (
  <GuideShell
    trail={[{ name: "Website cost calculator", path: calcPath }]}
    wide
    purpose="calculator"
    h1="Website cost calculator. Know your starting price."
    lead="Estimate your custom website cost from the pages and features you need. See your Northframe package, one-time build price, and payment breakdown instantly."
    byline={{ updated: "2026-10-09" }}
    jsonLd={{
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Website cost calculator",
      description: "Estimate custom website design and build pricing from page count and features, with package inclusions and a payment breakdown.",
      url: `${siteConfig.url}${calcPath}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
      publisher: orgRef,
    }}
  >
    <CostCalculator />

    <section className="legal__section">
      <h2 className="t-h4">How your website cost is calculated</h2>
      <p>The number of pages sets the smallest package that fits. Features can only move the estimate up, never down.</p>
      <ul>
        {packageTiers.map((t) => (
          <li key={t.id}>
            {priceLine(t.id)}: up to {t.pages} {t.pages === 1 ? "page" : "pages"}, {t.revisions} revision{" "}
            {t.revisions === 1 ? "round" : "rounds"}.
          </li>
        ))}
        <li>
          {customTier.name}: logins, payments, databases, dashboards, or more than five pages. {customTier.note}
        </li>
      </ul>
      <p>
        Every package includes {commonInclusions.items.join(", ").toLowerCase()}. {commonInclusions.ownership}
      </p>
    </section>

    <nav aria-label="Related guides" className="legal__section guide__related">
      <h2 className="t-h4">Related guides</h2>
      <ul>
        {articles
          .filter((a) => a.slug.startsWith("how-much"))
          .map((a) => (
            <li key={a.slug}>
              <Link href={`/guides/${a.slug}`}>{a.title}</Link>
            </li>
          ))}
        <li>
          <Link href="/faq">FAQ</Link>
        </li>
        <li><Link href="/guides/custom-website-vs-website-builder">Custom website vs Wix or Squarespace</Link></li>
      </ul>
    </nav>
  </GuideShell>
);
