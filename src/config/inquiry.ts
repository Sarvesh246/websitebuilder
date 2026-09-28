/**
 * Inquiry flow data: option lists, limits, and copy. Shared by the form (client) and the
 * validator (server), so an option can never exist in one and not the other.
 * Package names, prices and contents come from config/pricing.ts, never restated here.
 */
import { customTier, foundingLabel, packageTiers, type PackageId } from "@/config/pricing";

export const startPath = "/start";

/** Where every "Start a Project" / package CTA goes. Pass a package to preselect it. */
export const startHref = (pkg?: PackageId) => (pkg ? `${startPath}?package=${pkg}` : startPath);

export const packageIds = ["launch", "presence", "business", "custom"] as const satisfies readonly PackageId[];
export const isPackageId = (value: unknown): value is PackageId =>
  typeof value === "string" && (packageIds as readonly string[]).includes(value);

/** Earlier package names. Old links and saved drafts still resolve to the right package. */
const legacyPackageIds: Record<string, PackageId> = { starter: "launch", plus: "presence", pro: "business" };

/** URL or stored value to a package id, or null. Accepts the current ids and the legacy ones. */
export const parsePackageId = (value: unknown): PackageId | null => {
  if (isPackageId(value)) return value;
  return typeof value === "string" ? (legacyPackageIds[value] ?? null) : null;
};

/** One-line description per package for the picker. Prices are derived from pricing.ts. */
export type PackageChoice = { id: PackageId; name: string; price: string; blurb: string };

export const packageChoices: readonly PackageChoice[] = [
  ...packageTiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    price: tier.regularPrice !== undefined ? `$${tier.price} ${foundingLabel}` : `$${tier.price} one-time`,
    blurb: tier.audience.replace(/^Best for /, "For "),
  })),
  {
    id: customTier.id,
    name: customTier.name,
    price: "Request a quote",
    blurb: "For advanced projects: accounts, data, payments, or unusual requirements.",
  },
];

export const projectTypes = [
  { id: "portfolio", label: "Student portfolio or resume" },
  { id: "personal", label: "Personal website" },
  { id: "creator", label: "Creator or freelancer" },
  { id: "professional", label: "Professional portfolio" },
  { id: "student-org", label: "Student organization" },
  { id: "small-business", label: "Small business" },
  { id: "organization", label: "Organization or team" },
  { id: "redesign", label: "Website redesign" },
  { id: "web-app", label: "Custom web application" },
  { id: "other", label: "Other" },
] as const;

/** Sections or pages the visitor expects. On Launch (one page) these become sections, not pages. */
export const pageOptions = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "portfolio", label: "Portfolio or projects" },
  { id: "resume", label: "Resume or experience" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" },
  { id: "gallery", label: "Gallery" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "blog", label: "Blog" },
  { id: "team", label: "Team" },
  { id: "custom", label: "Custom page" },
] as const;

/** Page counts each fixed package covers (Launch is one page). Beyond it we only show a calm note. */
export const packagePageLimit: Partial<Record<PackageId, number>> = { launch: 1, presence: 3, business: 5 };

/** `advanced` features are not part of Launch, Presence or Business, so they trigger the quote note. */
export const features = [
  { id: "contact-form", label: "Contact form", advanced: false },
  { id: "gallery", label: "Gallery or portfolio", advanced: false },
  { id: "cms", label: "Blog or CMS", advanced: false },
  { id: "analytics", label: "Analytics", advanced: false },
  { id: "animations", label: "Custom animations", advanced: false },
  { id: "newsletter", label: "Email or newsletter", advanced: false },
  { id: "booking", label: "Booking or scheduling integration", advanced: false },
  { id: "auth", label: "Authentication", advanced: true },
  { id: "database", label: "Database", advanced: true },
  { id: "payments", label: "Payments", advanced: true },
  { id: "dashboard", label: "Dashboard", advanced: true },
  { id: "admin", label: "Admin tools", advanced: true },
  { id: "api", label: "API integration", advanced: true },
  { id: "other", label: "Something else", advanced: false },
] as const;

export const timelines = [
  { id: "asap", label: "As soon as practical" },
  { id: "2-4-weeks", label: "Within 2 to 4 weeks" },
  { id: "1-2-months", label: "Within 1 to 2 months" },
  { id: "3-months", label: "Within 3 months" },
  { id: "flexible", label: "No hard deadline" },
  { id: "other", label: "Other" },
] as const;

export const budgets = [
  { id: "under-500", label: "Under $500" },
  { id: "500-1000", label: "$500 to $1,000" },
  { id: "1000-2500", label: "$1,000 to $2,500" },
  { id: "2500-plus", label: "$2,500+" },
  { id: "unsure", label: "Not sure yet" },
] as const;

export const siteAnswers = [
  { id: "no", label: "No" },
  { id: "yes", label: "Yes" },
] as const;

export const limits = {
  name: 100,
  email: 254,
  phone: 30,
  organization: 120,
  descriptionMax: 5000,
  other: 300,
  url: 300,
  links: 3,
  /** Hard cap on the request body, bytes. */
  body: 32_000,
} as const;

export const steps = [
  { id: "project", label: "Project", title: "What are you looking to build?" },
  { id: "website", label: "Website", title: "Your website and pages" },
  { id: "features", label: "Features", title: "What should it do?" },
  { id: "direction", label: "Direction", title: "References and timing" },
  { id: "details", label: "Details", title: "Last details" },
  { id: "review", label: "Review", title: "Check and send" },
] as const;

export type StepId = (typeof steps)[number]["id"];

export const copy = {
  quoteNote: "This may require a custom quote depending on scope.",
  pageScopeNote:
    "This may go beyond the standard scope of this package. You can still send your request and I'll review the best fit.",
  launchPagesNote: "Launch is one page, so these become sections on that page rather than separate pages.",
  credentials:
    "You won't need to share account passwords. Services can be connected through client-owned accounts and proper access permissions.",
  timingNote: "Timing depends on project scope and availability.",
  consent: "By submitting, you're asking Northframe to contact you about this project.",
  successTitle: "Project request received.",
  successBody:
    "Thanks for reaching out. I'll review the details and follow up using the email you provided.",
  errorBody:
    "Something went wrong while sending your request. Your answers are still here, so you can try again.",
  unconfigured:
    "Project requests can't be delivered right now. Your answers are still here, so you can try again later.",
} as const;

export const inquiryDraftKey = "nf-inquiry-draft";
