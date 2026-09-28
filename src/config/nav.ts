import { showSelectedWork } from "@/config/work";

export type NavLink = { label: string; href: string };

/**
 * Anchors must match a real section id. "Work" only appears once approved case studies exist
 * (config/work.ts). "About" points at Why Northframe until a dedicated About section lands.
 */
export const navLinks: readonly NavLink[] = [
  ...(showSelectedWork ? [{ label: "Work", href: "#work" }] : []),
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];
