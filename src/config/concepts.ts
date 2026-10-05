import type { PackageId } from "@/config/pricing";

export type ConceptSlug = "portfolio" | "lens" | "cafe" | "org" | "freelance";

export type Concept = {
  slug: ConceptSlug;
  /** Fictional brand shown on the concept itself. */
  brand: string;
  /** Short label on the /work card. */
  title: string;
  audience: string;
  /** Package this concept fits; the "Want one like this?" CTA preselects it. */
  pkg: PackageId;
  summary: string;
  look: string;
  /** Card photo (local, under public/) and the glow colour used on hover. */
  image: string;
  glow: string;
  /** Card text colour over the photo. */
  tone: "light" | "dark";
};

export const concepts: readonly Concept[] = [
  {
    slug: "portfolio",
    brand: "Ines Calder",
    title: "Student portfolio",
    audience: "Students and job seekers",
    pkg: "launch",
    summary: "A clean editorial one-pager: projects, resume, and one way to get in touch.",
    look: "Warm paper, strong serif type, numbered projects",
    image: "/images/work/portfolio/portrait.webp",
    glow: "#e2552d",
    tone: "dark",
  },
  {
    slug: "lens",
    brand: "Oren Vale",
    title: "Photographer",
    audience: "Photographers and visual artists",
    pkg: "presence",
    summary: "A dark, full-bleed gallery where the images do the talking, with a lightbox and booking.",
    look: "Near-black, hairline type, edge-to-edge photography",
    image: "/images/work/lens/alpine.webp",
    glow: "#d9c9a8",
    tone: "light",
  },
  {
    slug: "cafe",
    brand: "Marlow & Finch",
    title: "Local cafe",
    audience: "Cafes, studios, and local shops",
    pkg: "business",
    summary: "Photo-led and warm: menu, hours, location, and one clear way to order or visit.",
    look: "Cream and espresso, soft serif, generous photography",
    image: "/images/work/cafe/pour.webp",
    glow: "#c9672f",
    tone: "light",
  },
  {
    slug: "org",
    brand: "Surge Collective",
    title: "Student organization",
    audience: "Clubs, orgs, and campus events",
    pkg: "business",
    summary: "Loud and energetic: a schedule, a join button, and an event that feels like an event.",
    look: "Black, acid green, oversized condensed type",
    image: "/images/work/org/concert.webp",
    glow: "#c6ff3d",
    tone: "light",
  },
  {
    slug: "freelance",
    brand: "Juno Park",
    title: "Independent professional",
    audience: "Freelancers, consultants, and creators",
    pkg: "presence",
    summary: "Personality first: what Juno does, selected projects, and a simple way to book a call.",
    look: "Lilac and butter, rounded type, stickers and soft shapes",
    image: "/images/work/freelance/smile.webp",
    glow: "#b9a2ff",
    tone: "dark",
  },
];

export const packageName = (id: PackageId) => id.charAt(0).toUpperCase() + id.slice(1);
export const conceptBySlug = (slug: ConceptSlug) => concepts.find((c) => c.slug === slug)!;
export const conceptPath = (slug: ConceptSlug) => `/work/${slug}`;
