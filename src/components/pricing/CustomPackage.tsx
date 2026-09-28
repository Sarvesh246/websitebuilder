import { GlassSurface } from "@/components/ui/GlassSurface";
import { Button } from "@/components/ui/Button";
import { packageCtaHref, type CustomTier } from "@/config/pricing";

/**
 * The Custom tier. Deliberately not a fourth card: it is a wide, quieter panel under the three
 * core packages, so "priced by scope" reads as a different kind of offer, not a bigger price.
 */
export const CustomPackage = ({ tier }: { tier: CustomTier }) => (
  <GlassSurface as="article" variant="subtle" className="pkg-custom" aria-labelledby="pkg-custom">
    <div className="pkg-custom__intro">
      <h3 id="pkg-custom" className="t-h4">
        {tier.name}
      </h3>
      <p className="pkg__blurb">{tier.blurb}</p>
    </div>
    <div className="pkg-custom__scope">
      <p className="pkg__lead-in">Quoted by scope</p>
      <ul className="chip-list">
        {tier.scope.map((item) => (
          <li key={item} className="badge badge--outline">
            {item}
          </li>
        ))}
      </ul>
    </div>
    <div className="pkg-custom__cta">
      <Button href={packageCtaHref} variant="secondary" icon="diag" block data-package={tier.id}>
        {tier.ctaLabel}
      </Button>
      <p className="pkg__note">{tier.note}</p>
    </div>
  </GlassSurface>
);
