export const siteConfig = {
  // Working brand name and domain, taken from the design references. Change here only.
  name: "Northframe",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://northframe.co",
  description:
    "Thoughtfully designed websites for students, creators, organizations, and growing businesses.",
  cta: { label: "Start a Project", href: "#contact" },
} as const;
