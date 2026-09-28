export type NavLink = { label: string; href: string };

/**
 * Header links. Every href must resolve to a real anchor or route (no dead links).
 * "Services" (/#services) and "Process" (/#process) join once those sections exist (roadmap Stage 4);
 * "Work" stays out until real, approved client work exists.
 */
export const navLinks: readonly NavLink[] = [
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
