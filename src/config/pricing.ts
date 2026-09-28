/**
 * Pricing is data, not markup. The pricing section (Stage 5) and any summary elsewhere
 * read from here so prices only ever change in one place.
 * Copy comes from the design references. No client counts or testimonials belong here.
 */
export type PricingTier = {
  id: "launch" | "presence" | "business" | "custom";
  name: string;
  audience: string;
  /** Current price in USD. `null` means "request a quote". */
  price: number | null;
  /** Regular price, shown struck through when a founding price is active. */
  regularPrice?: number;
  priceNote?: string;
  features: readonly string[];
  cta: { label: string; href: string };
  featured?: boolean;
};

export const pricingTiers: readonly PricingTier[] = [
  {
    id: "launch",
    name: "Launch",
    audience: "Best for student portfolios.",
    price: 50,
    features: [
      "1 page",
      "Responsive design",
      "Custom visual design",
      "Projects section",
      "Resume / experience",
      "Basic contact section",
      "Domain setup",
      "Deployment",
      "1 revision round",
    ],
    cta: { label: "Get Launch", href: "#contact" },
  },
  {
    id: "presence",
    name: "Presence",
    audience: "Best for creators & professionals.",
    price: 200,
    regularPrice: 350,
    priceNote: "Founding Client Pricing",
    features: [
      "Up to 3 pages",
      "Responsive design",
      "Custom visual design",
      "Portfolio/projects",
      "Contact form",
      "Domain setup",
      "Deployment",
      "SEO setup",
      "Analytics",
      "Enhanced animations",
      "2 revision rounds",
    ],
    cta: { label: "Get Presence", href: "#contact" },
    featured: true,
  },
  {
    id: "business",
    name: "Business",
    audience: "Best for organizations & businesses.",
    price: 350,
    regularPrice: 500,
    priceNote: "Founding Client Pricing",
    features: [
      "Up to 5 pages",
      "Responsive design",
      "Custom visual design",
      "Services / business pages",
      "Testimonials / FAQ",
      "Contact form",
      "Domain setup",
      "Deployment",
      "SEO setup",
      "Analytics",
      "Advanced animations",
      "3 revision rounds",
    ],
    cta: { label: "Get Business", href: "#contact" },
  },
  {
    id: "custom",
    name: "Custom",
    audience: "Best for advanced projects.",
    price: null,
    features: [
      "Custom scope",
      "Authentication optional",
      "Database optional",
      "Payments optional",
      "API integrations optional",
      "Dashboards optional",
      "Custom functionality",
    ],
    cta: { label: "Start a Conversation", href: "#contact" },
  },
];
