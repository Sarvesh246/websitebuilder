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
  /**
   * Home page <title> (also the Open Graph title). Keyword first, brand last, 55 characters so Google
   * does not truncate it (~60). Subpages use "<Page> | Northframe" via the root template.
   */
  homeTitle: "Web Design for Students & Small Businesses | Northframe",
  /** Meta description (also Open Graph, Twitter and JSON-LD). Keep it at or under about 155 characters. */
  description:
    "Affordable, custom-designed websites for students, creators, student orgs, and small businesses. Clear pricing, mobile-ready, and you own your site.",
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
  /**
   * Business phone in international format (E.164). Published ONLY in structured data (JSON-LD) so search
   * engines attribute the right number to Northframe; it is not shown on the page. Add it to the footer
   * deliberately if you want it visible. Set to null to remove it everywhere.
   */
  contactPhone: "+17327620126" as string | null,
  /** Only real, approved profiles. Empty on purpose: no placeholder social links. */
  social: [] as readonly { label: string; href: string }[],
  /** Owned profiles declared to search engines (JSON-LD `sameAs`) so they are tied to this site. Not rendered. */
  profiles: ["https://www.instagram.com/northframebuilds/"] as readonly string[],
  founder: { name: "Sarvesh", initial: "S" },
} as const;

/** Bump when the privacy policy or terms text changes. */
export const legalUpdated = "October 4, 2026";
