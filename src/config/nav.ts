export type NavLink = { label: string; href: string; glow?: boolean };

/**
 * Header links. Every href must resolve to a real anchor or route (no dead links).
 * "Concepts" opens /work: labelled design concepts, not client work. Real "Work" stays out until
 * real, approved client work exists.
 */
export const navLinks: readonly NavLink[] = [
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "Concepts", href: "/work", glow: true },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/about" },
];

export const footerLinks: readonly NavLink[] = [
  ...navLinks,
  { label: "Guides", href: "/guides" },
  { label: "Start a Project", href: "/start" },
];

export const legalLinks: readonly NavLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];
