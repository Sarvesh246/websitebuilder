/**
 * Pricing is data, not markup. The pricing section and any summary elsewhere read from here,
 * so prices and package contents only ever change in one place.
 * No client counts, testimonials, or "most popular" claims belong here: the business is new.
 */
export type PackageId = "starter" | "plus" | "pro" | "custom";

export type PackageTier = {
  id: Exclude<PackageId, "custom">;
  name: string;
  /** One line on what the package is. */
  blurb: string;
  /** Who it is for. Starts with "Best for". */
  audience: string;
  /** Price the visitor pays today, in USD. */
  price: number;
  /** Regular price. Present only while launch pricing applies to this package. */
  regularPrice?: number;
  /** Lead-in above the feature list when a package builds on the previous one. */
  includesLead?: string;
  features: readonly string[];
  /** Small reassurance line under the CTA. */
  note: string;
  ctaLabel: string;
  /** Factual emphasis label ("Best value"); never a popularity claim. */
  badge?: string;
  featured?: boolean;
};

export type CustomTier = {
  id: "custom";
  name: string;
  blurb: string;
  audience: string;
  /** What gets quoted. Shown as a compact list, not promised at any price. */
  scope: readonly string[];
  note: string;
  ctaLabel: string;
};

export const packageTiers: readonly PackageTier[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "A polished one-page site for your work and contact info.",
    audience: "Best for student portfolios and resumes.",
    price: 50,
    includesLead: "What's included",
    features: [
      "One-page custom design",
      "Projects and resume sections",
      "Mobile responsive",
      "Contact and social links",
      "Domain and deployment setup",
      "1 revision round",
    ],
    note: "You own the final site.",
    ctaLabel: "Choose Starter",
  },
  {
    id: "plus",
    name: "Plus",
    blurb: "A fuller site with more pages, stronger polish, and a contact form.",
    audience: "Best for creators, freelancers, and student orgs.",
    price: 200,
    regularPrice: 350,
    includesLead: "Everything in Starter, plus",
    features: [
      "Up to 3 pages",
      "Project and gallery sections",
      "Contact form",
      "SEO and analytics setup",
      "Enhanced animations",
      "2 revision rounds",
    ],
    note: "Domain and setup help included.",
    ctaLabel: "Choose Plus",
    badge: "Best value",
    featured: true,
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "A larger custom site with advanced interactions and room to grow.",
    audience: "Best for organizations and small businesses.",
    price: 350,
    regularPrice: 500,
    includesLead: "Everything in Plus, plus",
    features: [
      "Up to 5 pages",
      "Service, team, or event pages",
      "Forms and simple integrations",
      "CMS support where it fits",
      "Advanced UI and interactions",
      "3 revision rounds",
    ],
    note: "Scope is confirmed before work starts.",
    ctaLabel: "Choose Pro",
  },
];

export const customTier: CustomTier = {
  id: "custom",
  name: "Custom",
  blurb: "For projects that go beyond a website: accounts, data, payments, or unusual requirements.",
  audience: "Best for complex or unusual projects.",
  scope: [
    "Authentication",
    "Databases",
    "Dashboards",
    "Payments",
    "Admin panels",
    "APIs",
    "Advanced integrations",
    "Custom functionality",
  ],
  note: "Priced by scope after a short conversation. No commitment to ask.",
  ctaLabel: "Request a quote",
};

/** Launch pricing is intro pricing, stated plainly. It is not a countdown and not a scarcity claim. */
export const launchPricing = {
  title: "Launch pricing",
  body: "Intro pricing while the studio builds its first client portfolio. Regular prices apply once launch pricing ends.",
};

/** true = included, false = not included, string = short description. */
export type CompareCell = boolean | string;

export type CompareRow = {
  label: string;
  /** Order matches [starter, plus, pro, custom]. */
  values: readonly [CompareCell, CompareCell, CompareCell, CompareCell];
};

export const compareRows: readonly CompareRow[] = [
  { label: "Best for", values: ["Portfolios and resumes", "Creators and student orgs", "Organizations and businesses", "Complex builds"] },
  { label: "Pages", values: ["1 page", "Up to 3", "Up to 5", "As scoped"] },
  { label: "Contact", values: ["Links", "Contact form", "Contact form", "As scoped"] },
  { label: "Animation", values: ["Subtle", "Enhanced", "Advanced", "As scoped"] },
  { label: "SEO and analytics", values: [false, true, true, "As scoped"] },
  { label: "CMS support", values: [false, false, "Where it fits", "As scoped"] },
  { label: "Simple integrations", values: [false, false, true, "As scoped"] },
  { label: "Logins, database, payments", values: [false, false, false, "Quoted"] },
  { label: "Revisions", values: ["1 round", "2 rounds", "3 rounds", "By scope"] },
];

export const compareFootnote =
  "Every package includes custom design, mobile-responsive layouts, and domain and deployment setup.";

/** Scope boundaries, kept short on purpose. */
export const scopeNotes: readonly string[] = [
  "Domain names cost extra if you don't already own one.",
  "Paid third-party services, like premium hosting or email plans, have their own fees.",
  "If a request goes beyond your package, the price is updated and you approve it before work continues.",
];
