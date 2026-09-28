import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Ambient } from "@/components/visual/Ambient";
import { legalUpdated, siteConfig } from "@/config/site";

/** Readable long-form layout for Privacy and Terms. Plain text on a solid page: no glass. */
export const LegalPage = ({ title, intro, children }: { title: string; intro: string; children: ReactNode }) => (
  <Section className="legal" spacing="none" aria-labelledby="legal-title">
    <Ambient preset="quiet" />
    <Container>
      <div className="legal__wrap">
        <header className="legal__head">
          <span className="t-label t-label--rule">Legal</span>
          <h1 id="legal-title" className="t-h2">
            {title}
          </h1>
          <p className="t-small">Last updated {legalUpdated}</p>
          <p className="t-lead">{intro}</p>
        </header>
        <div className="legal__body">{children}</div>
      </div>
    </Container>
  </Section>
);

export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="legal__section">
    <h2 className="t-h4">{title}</h2>
    {children}
  </section>
);

/** Public contact line: the business email when configured, otherwise the inquiry form. */
export const ContactLine = () =>
  siteConfig.contactEmail ? (
    <p>
      Email <a href={`mailto:${siteConfig.contactEmail}`} className="break-anywhere">{siteConfig.contactEmail}</a>, or
      use the <Link href="/start">project inquiry form</Link>.
    </p>
  ) : (
    <p>
      Use the <Link href="/start">project inquiry form</Link> and mention that your message is about this page.
    </p>
  );
