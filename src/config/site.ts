/**
 * Single public origin for canonicals, Open Graph, sitemap, robots and structured data.
 * Set NEXT_PUBLIC_SITE_URL to the live domain; a bare host ("example.com") is accepted and
 * trailing slashes are stripped. The fallback is the working brand domain, never localhost.
 */
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://northframe.co";
const siteUrl = (/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`).replace(/\/+$/, "");

export const siteConfig = {
  // Working brand name and domain, taken from the design references. Change here only.
  name: "Northframe",
  url: siteUrl,
  tagline: "Websites for Students, Creators & Small Businesses",
  description:
    "Northframe designs and builds responsive websites for students, creators, organizations, and small businesses. Clear pricing, and you own the finished site.",
  /** Social card alt text (also used for og:image:alt). */
  socialAlt: "Northframe, web design and development, over a dark mountain landscape",
  descriptor: "Independent web design & development.",
  cta: { label: "Start a Project", href: "/start" },
  /**
   * Public business email. Optional and NOT the inquiry inbox (CONTACT_EMAIL is server-only).
   * Set NEXT_PUBLIC_CONTACT_EMAIL to a Northframe business address before launch; while unset,
   * the site shows no email anywhere and points people to the inquiry form instead.
   */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
  /** Only real, approved profiles. Empty on purpose: no placeholder social links. */
  social: [] as readonly { label: string; href: string }[],
  founder: { name: "Sarvesh", initial: "S" },
} as const;

/** Bump when the privacy policy or terms text changes. */
export const legalUpdated = "October 4, 2026";
