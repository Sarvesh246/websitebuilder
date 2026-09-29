import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { startHref } from "@/config/inquiry";
import { foundingLabel, type CustomTier, type PackageTier } from "@/config/pricing";

const CheckList = ({ items }: { items: readonly string[] }) => (
  <ul className="pkg__list">
    {items.map((item) => (
      <li key={item}>
        <span aria-hidden className="pkg__check">
          <Check size={11} strokeWidth={2.4} />
        </span>
        {item}
      </li>
    ))}
  </ul>
);

/**
 * One package card (reference 7): name + badge, who it is for, price (struck regular price and the
 * Founding Client Pricing pill while it applies), what is included, CTA with its scope note.
 */
export const PackageCard = ({ tier }: { tier: PackageTier }) => {
  const founding = tier.regularPrice !== undefined;
  return (
    <article className="pkg" data-featured={tier.featured || undefined} aria-labelledby={`pkg-${tier.id}`}>
      <div className="pkg__head">
        <div className="pkg__title">
          <h3 id={`pkg-${tier.id}`} className="pkg__name">
            {tier.name}
          </h3>
          {tier.badge && (
            <span className="pkg__badge">
              <Sparkles aria-hidden size={12} strokeWidth={2} />
              {tier.badge}
            </span>
          )}
        </div>
        <p className="pkg__for">{tier.audience}</p>
        <p className="pkg__price">
          <span className="t-price">${tier.price}</span>
          {founding && (
            <>
              <span className="sr-only">, regularly</span>
              <del className="t-price-was">${tier.regularPrice}</del>
            </>
          )}
        </p>
        <p className={founding ? "pkg__pill" : "pkg__pill pkg__pill--plain"}>{founding ? foundingLabel : "One-time price"}</p>
      </div>
      <div className="pkg__body">
        <p className="pkg__lead-in">{tier.includesLead}</p>
        <CheckList items={tier.features} />
      </div>
      <div className="pkg__foot">
        <Button
          href={startHref(tier.id)}
          variant={tier.featured ? "primary" : "secondary"}
          icon="right"
          block
          data-package={tier.id}
          aria-label={`${tier.ctaLabel} package, $${tier.price}${founding ? ` ${foundingLabel}` : ""}`}
        >
          {tier.ctaLabel}
        </Button>
        <p className="pkg__note">{tier.note}</p>
      </div>
    </article>
  );
};

/** Custom as the fourth card: same anatomy, but "Request a Quote" instead of a number. */
export const CustomCard = ({ tier }: { tier: CustomTier }) => (
  <article className="pkg pkg--custom" aria-labelledby="pkg-custom">
    <div className="pkg__head">
      <div className="pkg__title">
        <h3 id="pkg-custom" className="pkg__name">
          {tier.name}
        </h3>
      </div>
      <p className="pkg__for">{tier.audience}</p>
      <p className="pkg__price">
        <span className="pkg__quote">Request a Quote</span>
      </p>
      <p className="pkg__pill pkg__pill--plain">Priced by scope</p>
    </div>
    <div className="pkg__body">
      <p className="pkg__lead-in">Quoted by scope</p>
      <CheckList items={tier.scope} />
    </div>
    <div className="pkg__foot">
      <Button href={startHref(tier.id)} variant="secondary" icon="right" block data-package={tier.id}>
        {tier.ctaLabel}
      </Button>
      <p className="pkg__note">{tier.note}</p>
    </div>
  </article>
);
