import type { PackageId } from "@/config/pricing";

/**
 * What the studio needs from the client before building, per package. The portal stores only what the
 * client has done with each item (keyed by `key`), so wording here can change without a migration.
 * Keep keys stable: renaming a key forgets what clients already sent for it.
 */
export type IntakeTemplate = {
  key: string;
  label: string;
  hint: string;
  kind: "upload" | "answer";
  options?: readonly string[];
  optional?: boolean;
};

export const domainOptions = [
  "I own a domain and can log in",
  "I own a domain but can't log in",
  "I need a new domain",
  "Not sure yet",
] as const;

const copy: IntakeTemplate = {
  key: "copy",
  label: "Page text",
  hint: "A document with the words for each page. Rough drafts are fine; they get polished during the build.",
  kind: "upload",
};
const photos: IntakeTemplate = {
  key: "photos",
  label: "Photos and images",
  hint: "Photos of your work, team or space. Put many photos in one ZIP.",
  kind: "upload",
};
const logo: IntakeTemplate = {
  key: "logo",
  label: "Logo",
  hint: "PNG or SVG, ideally on a transparent background.",
  kind: "upload",
};
const domain: IntakeTemplate = {
  key: "domain",
  label: "Domain",
  hint: "Where your site will live, for example yourname.com.",
  kind: "answer",
  options: domainOptions,
};
const brand: IntakeTemplate = {
  key: "brand",
  label: "Brand colors and fonts",
  hint: "A brand guide, or a screenshot of colors you like.",
  kind: "upload",
  optional: true,
};

export const intakeTemplates: Record<PackageId, readonly IntakeTemplate[]> = {
  launch: [
    { key: "resume", label: "Resume or CV", hint: "PDF or DOCX. It shapes the resume section and the download link.", kind: "upload" },
    { key: "headshot", label: "Headshot", hint: "A clear photo of you. Optional, but it makes a portfolio feel personal.", kind: "upload", optional: true },
    { ...photos, label: "Project images", hint: "Screenshots or photos of the work you want to show. Put many in one ZIP." },
    domain,
  ],
  presence: [logo, copy, photos, brand, domain],
  business: [
    logo,
    copy,
    photos,
    { key: "team", label: "Team bios and photos", hint: "Names, roles, a line or two each, and a photo per person.", kind: "upload", optional: true },
    brand,
    domain,
  ],
  custom: [logo, copy, photos, brand, domain],
};

/** Labels for the custom items the studio adds (key prefix). */
export const CUSTOM_INTAKE_PREFIX = "custom:";
