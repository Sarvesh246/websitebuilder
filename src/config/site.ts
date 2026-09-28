export const siteConfig = {
  // Working brand name and domain, taken from the design references. Change here only.
  name: "Northframe",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://northframe.co",
  tagline: "Websites for students, creators and small businesses",
  description:
    "Northframe is an independent web design and development studio. Custom, mobile-ready websites for students, creators, student organizations, and small businesses, with clear pricing and full ownership.",
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
export const legalUpdated = "September 28, 2026";
