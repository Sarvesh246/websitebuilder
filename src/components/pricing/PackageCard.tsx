import { Check, Sparkles, Tag } from "lucide-react";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { packageCtaHref, type PackageTier } from "@/config/pricing";

/**
 * One core package. Reads top to bottom as: name, what it is, price, who it is for,
 * what is included, CTA. Layout (stacked, two-column on tablet, stacked again on desktop)
 * lives in styles/pricing.css so this stays a thin wrapper.
 */
export const PackageCard = ({ tier }: { tier: PackageTier }) => {
  const launch = tier.regularPrice !== undefined;
  return (
    <GlassSurface
      as="article"
      variant={tier.featured ? "feature" : "default"}
      className="pkg"
      aria-labelledby={`pkg-${tier.id}`}
    >
      <div className="pkg__head">
        <div className="pkg__title">
          <h3 id={`pkg-${tier.id}`} className="t-h4">
            {tier.name}
          </h3>
          {tier.badge && (
            <Badge>
              <Sparkles aria-hidden size={12} strokeWidth={2} />
              {tier.badge}
            </Badge>
          )}
        </div>
        <p className="pkg__blurb">{tier.blurb}</p>
        <div className="pkg__price">
          <span className={launch ? "pkg__price-label pkg__price-label--launch" : "pkg__price-label"}>
            {launch && <Tag aria-hidden size={13} strokeWidth={2} />}
            {launch ? "Launch price" : "Flat price"}
          </span>
          <span className="t-price">${tier.price}</span>
          <span className="pkg__price-sub">
            {launch ? (
              <>
                Regularly <del className="t-price-was">${tier.regularPrice}</del>
              </>
            ) : (
              "One-time price"
            )}
          </span>
        </div>
      </div>

      <div className="pkg__body">
        <p className="pkg__for">{tier.audience}</p>
        {tier.includesLead && <p className="pkg__lead-in">{tier.includesLead}</p>}
        <ul className="pkg__list">
          {tier.features.map((feature) => (
            <li key={feature}>
              <Check aria-hidden size={16} strokeWidth={2} />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="pkg__foot">
        <Button
          href={packageCtaHref}
          variant={tier.featured ? "primary" : "secondary"}
          icon="right"
          block
          data-package={tier.id}
          aria-label={`${tier.ctaLabel} package, ${launch ? `launch price $${tier.price}` : `$${tier.price}`}`}
        >
          {tier.ctaLabel}
        </Button>
        <p className="pkg__note">{tier.note}</p>
      </div>
    </GlassSurface>
  );
};
