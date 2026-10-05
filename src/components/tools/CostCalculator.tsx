"use client";

import { useState } from "react";
import { ChoiceGroup } from "@/components/inquiry/fields";
import { Button } from "@/components/ui/Button";
import { startHref } from "@/config/inquiry";
import { customTier, discountLabel } from "@/config/pricing";
import { dollars, estimate, FEATURE_OPTIONS, PAGE_OPTIONS, type FeatureId, type PagesId } from "@/lib/estimate";

/** Two questions in, one package and price out. All rules live in lib/estimate.ts. */
export const CostCalculator = () => {
  const [pages, setPages] = useState<PagesId>("1");
  const [features, setFeatures] = useState<FeatureId[]>([]);
  const result = estimate(pages, features);
  const toggle = (id: string) =>
    setFeatures((cur) => (cur.includes(id as FeatureId) ? cur.filter((f) => f !== id) : [...cur, id as FeatureId]));

  return (
    <div className="calc">
      <form className="calc__form" onSubmit={(e) => e.preventDefault()} aria-label="Website cost calculator">
        <ChoiceGroup
          legend="How many pages do you need?"
          name="pages"
          type="radio"
          choices={PAGE_OPTIONS.map((p) => ({ id: p.id, label: p.label }))}
          selected={[pages]}
          onToggle={(id) => setPages(id as PagesId)}
        />
        <ChoiceGroup
          legend="Which features do you need?"
          hint="Pick any that apply."
          name="features"
          type="checkbox"
          optional
          choices={FEATURE_OPTIONS.map((f) => ({ id: f.id, label: f.label }))}
          selected={features}
          onToggle={toggle}
        />
      </form>

      <section className="calc__result guide__card" aria-live="polite" aria-labelledby="calc-result-title">
        <h2 id="calc-result-title" className="t-h4">
          {result.kind === "fixed" ? `${result.tier.name}: ${dollars(result.tier.price * 100)}` : `${customTier.name}: quoted by scope`}
        </h2>
        {result.kind === "fixed" ? (
          <>
            <p>
              {discountLabel(result.tier) && result.tier.regularPrice !== undefined
                ? `${discountLabel(result.tier)}, regularly $${result.tier.regularPrice}. `
                : ""}
              One-time price.{" "}
              {result.laterCents > 0
                ? `${dollars(result.upfrontCents)} at the start and ${dollars(result.laterCents)} after the revision stage.`
                : "Paid in full at the start."}
            </p>
            <ul>
              {result.tier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>{customTier.note}</p>
        )}
        <ul className="calc__why t-small">
          {result.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="t-small guide__note">Domain registration and any paid third-party services are billed separately by those providers.</p>
        <div className="guide__actions">
          <Button href={startHref(result.kind === "fixed" ? result.tier.id : "custom")} icon="diag">
            {result.kind === "fixed" ? result.tier.ctaLabel : customTier.ctaLabel}
          </Button>
          <Button href="/#pricing" variant="secondary">
            Compare all packages
          </Button>
        </div>
      </section>
    </div>
  );
};
