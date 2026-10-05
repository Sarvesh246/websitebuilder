/**
 * Pricing is data, not markup. The pricing section and any summary elsewhere read from here,
 * so prices and package contents only ever change in one place.
 * No client counts, testimonials, or "most popular" claims belong here: the business is new.
 */
export type PackageId = "launch" | "presence" | "business" | "custom";

export type PackageTier = {
  id: Exclude<PackageId, "custom">;
  name: string;
  /** One line on what the package is for. */
  blurb: string;
  /** Who it is for. Starts with "Best for". */
  audience: string;
  /** Price the visitor pays today, in USD. */
  price: number;
  /** Regular price. Present only while a discount (Founding Client or student pricing) applies to this package. */
  regularPrice?: number;
  /** Name of the discount when it is not Founding Client Pricing (Launch is student pricing). */
  priceLabel?: string;
  /** Lead-in above the feature list when a package builds on the previous one. */
  includesLead: string;
  features: readonly string[];
  /** Scope boundary under the CTA: what this package stops at. */
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
    id: "launch",
    name: "Launch",
    blurb: "A polished one-page site for your work and contact details.",
    audience: "Best for student portfolios and resumes.",
    price: 49,
    regularPrice: 99,
    priceLabel: "Student pricing",
    includesLead: "What's included",
    features: [
      "1 custom-designed page",
      "Projects and resume sections",
      "Basic contact section",
      "1 revision round",
    ],
    note: "One page. Need more pages? See Presence.",
    ctaLabel: "Get Launch",
  },
  {
    id: "presence",
    name: "Presence",
    blurb: "A fuller site for creators and professionals who need it to do more.",
    audience: "Best for creators and professionals.",
    price: 199,
    regularPrice: 349,
    includesLead: "Everything in Launch, plus",
    features: [
      "Up to 3 pages",
      "Portfolio and project sections",
      "Contact form",
      "SEO setup and analytics",
      "Enhanced animations",
      "2 revision rounds",
    ],
    note: "Logins, databases, and payments are Custom.",
    ctaLabel: "Get Presence",
    badge: "Best value",
    featured: true,
  },
  {
    id: "business",
    name: "Business",
    blurb: "More pages, structure, and content for organizations and small businesses.",
    audience: "Best for organizations and businesses.",
    price: 349,
    regularPrice: 499,
    includesLead: "Everything in Presence, plus",
    features: [
      "Up to 5 pages",
      "Service, team, or event pages",
      "FAQ and testimonial sections",
      "Simple integrations",
      "Advanced animations",
      "3 revision rounds",
    ],
    note: "Simple integrations only. Anything bigger is Custom.",
    ctaLabel: "Get Business",
  },
];

export const customTier: CustomTier = {
  id: "custom",
  name: "Custom",
  blurb: "For projects that go beyond a website: accounts, data, payments, or unusual requirements.",
  audience: "Best for advanced projects.",
  scope: [
    "Authentication",
    "Databases",
    "Dashboards",
    "Payments",
    "Admin tools",
    "API integrations",
    "Custom functionality",
  ],
  note: "Priced by scope after a short conversation. No commitment to ask.",
  ctaLabel: "Start a Conversation",
};

/** Term for discounted prices everywhere on the site. Not a countdown and not a scarcity claim. */
export const foundingLabel = "Founding Client Pricing";

export const foundingPricing = {
  title: foundingLabel,
  body: "Available while Northframe builds its first client portfolio. Regular prices apply afterward.",
};

/** The discount's name for a package, or null when it is at its normal price. Launch is student pricing. */
export const discountLabel = (tier: PackageTier): string | null =>
  tier.priceLabel ?? (tier.regularPrice !== undefined ? foundingLabel : null);

/** Footnote for the asterisk on the Launch price. Derived from the config, so it can never disagree with the card. */
export const studentFootnote = (): string | null => {
  const tier = packageTiers.find((t) => t.priceLabel && t.regularPrice !== undefined);
  return tier ? `*Student pricing: ${tier.name} is $${tier.price} for students, regularly $${tier.regularPrice}.` : null;
};

/** What every fixed package has, said once instead of on every card. */
export const commonInclusions = {
  title: "Every package includes",
  items: ["Custom visual design", "Responsive layout", "Domain setup help", "Deployment"],
  ownership: "You own the final site and accounts.",
  flow: "Each button opens a short project request with the package already selected. No payment, no commitment.",
};

/** true = included, false = not included, string = short description. */
export type CompareCell = boolean | string;

export type CompareRow = {
  label: string;
  /** Order matches [launch, presence, business, custom]. */
  values: readonly [CompareCell, CompareCell, CompareCell, CompareCell];
};

export const compareRows: readonly CompareRow[] = [
  { label: "Best for", values: ["Portfolios and resumes", "Creators and professionals", "Organizations and businesses", "Advanced projects"] },
  { label: "Pages", values: ["1 page", "Up to 3", "Up to 5", "As scoped"] },
  { label: "Contact form", values: ["Basic contact section", true, true, "As scoped"] },
  { label: "SEO setup and analytics", values: [false, true, true, "As scoped"] },
  { label: "Animations", values: ["Subtle", "Enhanced", "Advanced", "As scoped"] },
  { label: "Simple integrations", values: [false, false, true, "As scoped"] },
  { label: "Revision rounds", values: ["1", "2", "3", "By scope"] },
  { label: "Logins, databases, payments", values: [false, false, false, "Quoted"] },
];

/** Scope boundaries, kept short on purpose. */
export const scopeNotes: readonly string[] = [
  "Domain registration and paid third-party services, like premium hosting or email plans, are billed separately where required.",
  "If a request goes beyond your package, the price is updated and you approve it before work continues.",
];
