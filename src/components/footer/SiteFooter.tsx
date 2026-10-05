import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Container } from "@/components/layout/Container";
import { guideLinks } from "@/config/guides";
import { footerLinks, legalLinks } from "@/config/nav";
import { siteConfig } from "@/config/site";

/**
 * Quiet footer: wordmark and descriptor, two link columns, and a hairline with the year.
 * The email only renders when NEXT_PUBLIC_CONTACT_EMAIL is set; social links only when
 * siteConfig.social has real entries. The year is the build/render year.
 */
export const SiteFooter = () => (
  <footer className="site-footer">
    <Container className="site-footer__inner">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <Link href="/" className="brand" aria-label={`${siteConfig.name} home`}>
            <BrandLogo />
          </Link>
          <p className="t-small">{siteConfig.descriptor}</p>
        </div>

        <nav aria-label="Footer" className="site-footer__nav">
          <p className="site-footer__title t-small">Explore</p>
          <ul>
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            {siteConfig.social.map((link) => (
              <li key={link.href}>
                <a href={link.href} rel="me noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Guides" className="site-footer__nav">
          <p className="site-footer__title t-small">Guides</p>
          <ul>
            {guideLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/tools/website-cost-calculator">Website cost calculator</Link>
            </li>
            <li>
              <Link href="/guides">All guides</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal" className="site-footer__nav">
          <p className="site-footer__title t-small">Legal</p>
          <ul>
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            {siteConfig.contactEmail && (
              <li>
                <a href={`mailto:${siteConfig.contactEmail}`} className="break-anywhere">
                  {siteConfig.contactEmail}
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <p className="site-footer__legal t-small">
        &copy; {new Date().getFullYear()} {siteConfig.entityName}. Designed and built independently.
      </p>
    </Container>
  </footer>
);
