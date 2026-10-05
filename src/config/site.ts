/**
 * Single public origin for canonicals, Open Graph, sitemap, robots and structured data.
 * Set NEXT_PUBLIC_SITE_URL to the live domain; a bare host ("example.com") is accepted and
 * trailing slashes are stripped. The fallback is the working brand domain, never localhost.
 */
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://northframebuilds.vercel.app";
const siteUrl = (/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`).replace(/\/+$/, "");

export const siteConfig = {
  // Working brand name and domain, taken from the design references. Change here only.
  name: "Northframe",
  /**
   * Searchable entity name. "Northframe" alone is shared by several unrelated businesses, so titles,
   * structured data, the footer and About copy use "Northframe Builds" (it matches the
   * northframebuilds handle and hostname); the logo keeps the short name. `name` becomes alternateName.
   */
  entityName: "Northframe Builds",
  url: siteUrl,
  tagline: "Websites for Students, Creators & Small Businesses",
  /**
   * Home page <title> (also the Open Graph title). Entity name first so it is unambiguous, then the
   * keywords. Subpages use "<Page> | Northframe Builds" via the root template.
   */
  homeTitle: "Northframe Builds | Web Design for Students & Small Businesses",
  /** Meta description (also Open Graph, Twitter and JSON-LD). Keep it at or under about 155 characters. */
  description:
    "Northframe Builds designs affordable, custom websites for students, creators, student orgs, and small businesses. Clear pricing, and you own your site.",
  /** Social card alt text (also used for og:image:alt). */
  socialAlt: "Northframe Builds, web design and development, over a dark mountain landscape",
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
  /** Only real, approved profiles (shown in the footer, rel="me"). No placeholder social links. */
  social: [{ label: "Instagram", href: "https://www.instagram.com/northframebuilds/" }] as readonly { label: string; href: string }[],
  founder: {
    name: "Sarvesh",
    fullName: "Sarvesh Jagtap",
    initial: "S",
    role: "Founder and developer",
    school: "Texas A&M University",
  },
} as const;

/**
 * Bing Webmaster Tools ownership token (msvalidate.01). Public by design. Set BING_SITE_VERIFICATION
 * (or paste the token here) after adding the site in Bing Webmaster Tools.
 */
export const bingVerification = process.env.BING_SITE_VERIFICATION?.trim() || null;

/** Bump when the privacy policy or terms text changes. */
export const legalUpdated = "October 4, 2026";
