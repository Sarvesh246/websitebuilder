"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Container } from "@/components/layout/Container";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { navLinks } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useScrolledPast } from "@/hooks/useScrolledPast";

/**
 * Site header. Desktop (lg+): logo, centred links, theme toggle and CTA on one line.
 * Below lg: a compact bar (logo, theme, menu button) that opens a full-height sheet with
 * large, thumb-friendly links and the CTA anchored at the bottom. The bar is transparent at
 * the top of the page and gains a glass background once scrolled.
 */
export const SiteNav = () => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetId = useId();
  const scrolled = useScrolledPast(sentinelRef);
  const [open, setOpen] = useState(false);

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.querySelector<HTMLElement>("a")?.focus();
    // Everything outside the header is inert while the sheet is open (focus trap + no screen reader leakage).
    const behind = Array.from(document.querySelectorAll<HTMLElement>("main, footer"));
    behind.forEach((el) => el.setAttribute("inert", ""));

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    // Sheet is mobile-only: close it if the viewport grows into the desktop layout.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => event.matches && setOpen(false);

    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onChange);
    return () => {
      behind.forEach((el) => el.removeAttribute("inert"));
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onChange);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute top-0 left-0 h-6 w-px" />
      <header className="site-nav" data-scrolled={scrolled || open}>
        <Container className="site-nav__inner">
          <Link href="/" className="brand" aria-label={`${siteConfig.name} home`} onClick={close}>
            <BrandLogo />
          </Link>

          <nav aria-label="Primary" className="site-nav__links">
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="site-nav__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-nav__actions">
            <ThemeToggle />
            <Button href={siteConfig.cta.href} icon="diag" className="hidden lg:inline-flex">
              {siteConfig.cta.label}
            </Button>
            <button
              ref={toggleRef}
              type="button"
              className="icon-btn lg:hidden"
              aria-expanded={open}
              aria-controls={sheetId}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X aria-hidden size={22} strokeWidth={1.6} /> : <Menu aria-hidden size={22} strokeWidth={1.6} />}
            </button>
          </div>
        </Container>

        {open && (
          <div ref={sheetRef} id={sheetId} className="site-nav__sheet lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <nav aria-label="Mobile">
              <ul>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="site-nav__sheet-link" onClick={close}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <Button href={siteConfig.cta.href} size="lg" block icon="diag" onClick={close}>
              {siteConfig.cta.label}
            </Button>
          </div>
        )}
      </header>
    </>
  );
};
