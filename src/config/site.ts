export const siteConfig = {
  // Working brand name and domain, taken from the design references. Change here only.
  name: "Northframe",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://northframe.co",
  tagline: "Professional websites for students and small teams",
  description:
    "Custom-designed, mobile-ready websites for students, creators, student organizations, and small businesses. Clear pricing, and you own your site.",
  cta: { label: "Start a Project", href: "/start" },
} as const;
