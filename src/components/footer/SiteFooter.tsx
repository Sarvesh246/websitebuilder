import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { footerLinks, legalLinks } from "@/config/nav";
import { siteConfig } from "@/config/site";

/**
 * Minimal footer: wordmark, one line of descriptor, a short link list, legal, and the year.
 * The email only renders when NEXT_PUBLIC_CONTACT_EMAIL is set; social links only when
 * siteConfig.social has real entries. The year is the build/render year.
 */
export const SiteFooter = () => (
  <footer className="site-footer">
    <Container className="site-footer__inner">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <Link href="/" className="site-nav__logo" aria-label={`${siteConfig.name} home`}>
            <span aria-hidden className="site-nav__mark" />
            {siteConfig.name}
          </Link>
          <p className="t-small">{siteConfig.descriptor}</p>
        </div>

        <nav aria-label="Footer" className="site-footer__nav">
          <ul>
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            {siteConfig.social.map((link) => (
              <li key={link.href}>
                <a href={link.href} rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal" className="site-footer__nav">
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

      <p aria-hidden className="site-footer__wordmark">
        {siteConfig.name}
      </p>

      <p className="site-footer__legal t-small">
        &copy; {new Date().getFullYear()} {siteConfig.name}. Designed and built independently.
      </p>
    </Container>
  </footer>
);
