import { packageTiers, type PackageId, type PackageTier } from "@/config/pricing";
import { pricingSnapshot } from "@/lib/payments/plan";

/**
 * The website cost calculator's rules, kept pure so they can be tested. They mirror the package
 * boundaries in config/pricing.ts: pages decide the minimum size, features can only raise it, and
 * anything with accounts, data or payments (or more than five pages) is Custom.
 */
export const PAGE_OPTIONS = [
  { id: "1", label: "1 page", min: 1 },
  { id: "2-3", label: "2 to 3 pages", min: 3 },
  { id: "4-5", label: "4 to 5 pages", min: 5 },
  { id: "6+", label: "6 or more pages", min: 6 },
] as const;

export type PagesId = (typeof PAGE_OPTIONS)[number]["id"];

/** Features and the smallest package that includes them ("custom" = quoted by scope). */
export const FEATURE_OPTIONS = [
  { id: "contact-form", label: "Contact form", needs: "presence" },
  { id: "gallery", label: "Gallery or project pages", needs: "presence" },
  { id: "seo", label: "SEO and analytics setup", needs: "presence" },
  { id: "team-events", label: "Team, service, or event pages", needs: "business" },
  { id: "integrations", label: "Simple integrations (booking link, newsletter)", needs: "business" },
  { id: "accounts", label: "Logins or member accounts", needs: "custom" },
  { id: "payments", label: "Online payments or a store", needs: "custom" },
  { id: "database", label: "Database, dashboard, or admin tools", needs: "custom" },
] as const satisfies readonly { id: string; label: string; needs: PackageId }[];

export type FeatureId = (typeof FEATURE_OPTIONS)[number]["id"];

const ORDER: readonly PackageId[] = ["launch", "presence", "business", "custom"];
const larger = (a: PackageId, b: PackageId): PackageId => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b);

export type Estimate =
  | { kind: "fixed"; tier: PackageTier; reasons: string[]; upfrontCents: number; laterCents: number }
  | { kind: "custom"; reasons: string[] };

export const estimate = (pages: PagesId, features: readonly FeatureId[]): Estimate => {
  const pageNeed = PAGE_OPTIONS.find((p) => p.id === pages)!.min;
  const bySize = packageTiers.find((t) => t.pages >= pageNeed)?.id ?? "custom";
  let pick: PackageId = bySize;
  const reasons: string[] = [bySize === "custom" ? "More than five pages is quoted by scope." : `${PAGE_OPTIONS.find((p) => p.id === pages)!.label} fits ${packageTiers.find((t) => t.id === bySize)!.name}.`];

  for (const f of FEATURE_OPTIONS) {
    if (!features.includes(f.id) || ORDER.indexOf(f.needs) <= ORDER.indexOf(pick)) continue;
    pick = larger(pick, f.needs);
    reasons.push(f.needs === "custom" ? `${f.label} goes beyond a website, so it is quoted under Custom.` : `${f.label} starts at ${packageTiers.find((t) => t.id === f.needs)!.name}.`);
  }

  if (pick === "custom") return { kind: "custom", reasons };
  const tier = packageTiers.find((t) => t.id === pick)!;
  const snap = pricingSnapshot(tier.id);
  return { kind: "fixed", tier, reasons, upfrontCents: snap.deposit ?? 0, laterCents: snap.remaining ?? 0 };
};

export const dollars = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
