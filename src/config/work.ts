/**
 * Selected Work: DEFERRED. Nothing here renders publicly.
 *
 * Northframe has no approved client work yet, and placeholder or personal projects must not stand
 * in for it. This file only fixes the shape a case study will have, so the section can be added
 * later without restructuring. Rules:
 *   - Entries go in `caseStudies` only for real work.
 *   - Only entries with `permission: "approved"` are ever shown (see `publicCaseStudies`).
 *   - `testimonial` and `results` are added only when real and supported. Never invent them.
 *   - The nav "Work" link (config/nav.ts) appears only when `showSelectedWork` is true, and the
 *     section it points to (`id="work"`) must exist first.
 */
export type CaseStudyImage = { src: string; alt: string; width: number; height: number };

export type CaseStudy = {
  slug: string;
  client: string;
  category: "personal" | "professional" | "business" | "custom";
  summary: string;
  services: readonly string[];
  screens: { desktop: CaseStudyImage; mobile?: CaseStudyImage };
  /** Live site, if the client is happy for it to be linked. */
  projectUrl?: string;
  /** Internal case-study page. */
  detailHref?: string;
  testimonial?: { quote: string; name: string; role: string };
  results?: readonly { label: string; value: string; source: string }[];
  /** Explicit client permission for public display. Anything but "approved" stays hidden. */
  permission: "pending" | "approved" | "declined";
};

export const caseStudies: readonly CaseStudy[] = [];

export const publicCaseStudies = caseStudies.filter((study) => study.permission === "approved");
export const showSelectedWork = publicCaseStudies.length > 0;
