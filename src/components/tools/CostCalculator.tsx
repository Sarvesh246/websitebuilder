"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import { ChoiceGroup } from "@/components/inquiry/fields";
import { Button } from "@/components/ui/Button";
import { startHref } from "@/config/inquiry";
import { commonInclusions, customTier, discountLabel } from "@/config/pricing";
import { dollars, estimate, FEATURE_OPTIONS, PAGE_OPTIONS, type FeatureId, type PagesId } from "@/lib/estimate";

const pageHints = ["A focused portfolio or resume", "Room for work, about, and contact", "Services, team, and more", "A larger site, scoped together"];

export const CostCalculator = () => {
  const [pages, setPages] = useState<PagesId>("1");
  const [features, setFeatures] = useState<FeatureId[]>([]);
  const result = estimate(pages, features);
  const toggle = (id: string) => setFeatures((cur) => cur.includes(id as FeatureId) ? cur.filter((f) => f !== id) : [...cur, id as FeatureId]);
  const packageId = result.kind === "fixed" ? result.tier.id : "custom";

  return (
    <div className="calc">
      <div className="calc__mobile-summary"><span aria-live="polite" aria-atomic="true">{result.kind === "fixed" ? `${result.tier.name} · ${dollars(result.tier.price * 100)}` : "Custom · Quoted by scope"}</span><a href="#calc-result">View breakdown</a></div>
      <form className="calc__form" onSubmit={(e) => e.preventDefault()} aria-label="Website cost calculator">
        <div className="calc__intro"><h2 className="t-h4">Build your estimate</h2><p>Two choices. A clearer starting point.</p></div>
        <ChoiceGroup legend="How many pages do you need?" hint="Count separate pages, not sections on a page." name="pages" type="radio" layout="card"
          choices={PAGE_OPTIONS.map((p, i) => ({ id: p.id, label: p.label, description: pageHints[i] }))} selected={[pages]} onToggle={(id) => setPages(id as PagesId)} />
        <ChoiceGroup legend="What should your website do?" hint="Select any features you need. You can leave these blank." name="features" type="checkbox"
          choices={FEATURE_OPTIONS.map((f) => ({ id: f.id, label: f.label, meta: f.needs === "custom" ? "Quoted individually" : `Included from ${f.needs === "presence" ? "Presence" : "Business"}` }))}
          selected={features} onToggle={toggle} />
        <button className="calc__reset" type="button" onClick={() => { setPages("1"); setFeatures([]); }}><RotateCcw size={14} aria-hidden />Reset choices</button>
      </form>
      <section id="calc-result" className="calc__result" aria-labelledby="calc-result-title">
        <div className="calc__receipt-head"><span>Your Northframe estimate</span><span>USD</span></div>
        <div className="calc__summary" aria-live="polite" aria-atomic="true">
          <h2 id="calc-result-title">{result.kind === "fixed" ? result.tier.name : customTier.name}</h2>
          <div key={packageId} className={`calc__price${result.kind === "custom" ? " calc__price--custom" : ""}`}>{result.kind === "fixed" ? dollars(result.tier.price * 100) : "Let’s scope it."}</div>
          <p>{result.kind === "fixed" ? "One-time design & build" : "A quote built around your requirements"}</p>
          {result.kind === "fixed" && discountLabel(result.tier) && <p className="calc__discount">{discountLabel(result.tier)}{result.tier.regularPrice !== undefined && <> · Regularly <s>{dollars(result.tier.regularPrice * 100)}</s></>}</p>}
        </div>
        {result.kind === "fixed" ? <>
          <dl className="calc__payments"><div><dt>At the start</dt><dd>{dollars(result.upfrontCents)}</dd></div><div><dt>{result.laterCents > 0 ? "After revisions" : "Remaining balance"}</dt><dd>{dollars(result.laterCents)}</dd></div></dl>
          <div className="calc__included"><h3>Included in {result.tier.name}</h3><ul>{result.tier.features.map((f) => <li key={f}><Check size={15} aria-hidden />{f}</li>)}</ul></div>
        </> : <div className="calc__custom"><p>{customTier.note}</p><p>Accounts, payments, data, or a larger site need an individual scope before a price is agreed.</p></div>}
        <div className="calc__why"><h3>Why this package?</h3><ul>{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>
        <Button href={startHref(packageId)} icon="diag" block>{result.kind === "fixed" ? result.tier.ctaLabel : customTier.ctaLabel}</Button>
        <p className="calc__fine">No payment or commitment to request a project.</p>
        <p className="calc__fine">Domain registration and paid third-party services are separate. {commonInclusions.ownership}</p>
        <Link className="calc__all" href="/#pricing">Compare all packages</Link>
      </section>
    </div>
  );
};
