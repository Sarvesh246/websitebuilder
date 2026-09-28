export type NavLink = { label: string; href: string };

/**
 * Header links. Every href must resolve to a real anchor or route (no dead links).
 * "Work" stays out until real, approved client work exists.
 */
export const navLinks: readonly NavLink[] = [
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/#about" },
];

export const footerLinks: readonly NavLink[] = [
  ...navLinks,
  { label: "Start a Project", href: "/start" },
];

export const legalLinks: readonly NavLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];
