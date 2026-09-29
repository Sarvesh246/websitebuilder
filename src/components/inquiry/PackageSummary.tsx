import { Check } from "lucide-react";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { customTier, packageTiers, type PackageId } from "@/config/pricing";
import { formatCents, planForPackage } from "@/lib/payments/plan";

/**
 * Compact recap of the chosen package, from config/pricing.ts. Not the pricing page: name, price
 * line, and what's included. The feature list is hidden below lg to keep phones focused on the form.
 */
export const PackageSummary = ({ selected }: { selected: PackageId | "" }) => {
  const tier = packageTiers.find((t) => t.id === selected);

  if (!selected) {
    return (
      <GlassSurface variant="subtle" className="summary" aria-label="Selected package">
        <p className="summary__eyebrow">Package</p>
        <p className="summary__name">Not chosen yet</p>
        <p className="summary__price">Pick one in step 1. You can change it any time.</p>
      </GlassSurface>
    );
  }

  if (!tier) {
    return (
      <GlassSurface variant="default" className="summary" aria-label="Selected package">
        <p className="summary__eyebrow">Package</p>
        <p className="summary__name">Custom project</p>
        <p className="summary__price">Quoted based on scope</p>
        <div className="summary__more">
          <p className="summary__lead">Can include</p>
          <ul className="summary__list">
            {customTier.scope.map((item) => (
              <li key={item}>
                <Check aria-hidden size={15} strokeWidth={2} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </GlassSurface>
    );
  }

  const founding = tier.regularPrice !== undefined;
  const plan = planForPackage(tier.id);
  return (
    <GlassSurface variant="default" className="summary" aria-label="Selected package">
      <p className="summary__eyebrow">Package</p>
      <p className="summary__name">{tier.name}</p>
      <p className="summary__price">
        ${tier.price} {founding ? "Founding Client Pricing" : "flat, one-time"}
      </p>
      {plan && (
        <p className="summary__price">
          {plan.remaining === 0
            ? "Paid in full at checkout."
            : `${formatCents(plan.deposit)} at checkout, ${formatCents(plan.remaining)} after revisions.`}
        </p>
      )}
      <div className="summary__more">
        <p className="summary__lead">{tier.includesLead}</p>
        <ul className="summary__list">
          {tier.features.map((feature) => (
            <li key={feature}>
              <Check aria-hidden size={15} strokeWidth={2} />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </GlassSurface>
  );
};
