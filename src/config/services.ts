export type ServiceCategory = {
  id: "personal" | "professional" | "business" | "custom";
  title: string;
  description: string;
  /** Who it is for. Short noun phrases, shown as a quiet list. */
  audience: readonly string[];
};

/**
 * "What we build": kinds of sites, not prices. Pricing lives in config/pricing.ts and this
 * section links to it, so the two never duplicate each other.
 */
export const servicesIntro = {
  eyebrow: "What we build",
  title: "What we build.",
  lead: "From a straightforward portfolio to a more custom digital experience.",
} as const;

export const serviceCategories: readonly ServiceCategory[] = [
  {
    id: "personal",
    title: "Personal",
    description: "Portfolio and resume websites built to present your work clearly.",
    audience: ["Students", "Resumes", "Portfolios", "Personal sites"],
  },
  {
    id: "professional",
    title: "Professional",
    description: "Polished websites for people building a stronger online presence.",
    audience: ["Creators", "Freelancers", "Independent professionals", "Personal brands"],
  },
  {
    id: "business",
    title: "Business",
    description: "Complete websites for organizations and businesses that need credibility and room to grow.",
    audience: ["Organizations", "Student organizations", "Small businesses", "Teams"],
  },
  {
    id: "custom",
    title: "Custom",
    description: "Projects that require functionality beyond a traditional marketing website.",
    audience: ["Authenticated experiences", "Database-backed projects", "Dashboards", "Integrations"],
  },
];
