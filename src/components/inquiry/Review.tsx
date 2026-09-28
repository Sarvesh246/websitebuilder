import { budgets, features, pageOptions, projectTypes, steps, timelines } from "@/config/inquiry";
import { customTier, packageTiers } from "@/config/pricing";
import type { InquiryValues } from "@/lib/inquiry/schema";

const label = (list: readonly { id: string; label: string }[], id: string) => list.find((i) => i.id === id)?.label ?? "";

const packageLine = (id: InquiryValues["package"]) => {
  const tier = packageTiers.find((t) => t.id === id);
  if (tier) return `${tier.name}, $${tier.price}${tier.regularPrice !== undefined ? " Founding Client Pricing" : ""}`;
  return id === "custom" ? `${customTier.name}, quoted by scope` : "";
};

/** Read-only recap grouped by step, each with an Edit action that jumps back to that step. */
export const Review = ({ values, onEdit }: { values: InquiryValues; onEdit: (step: number) => void }) => {
  const other = (base: string, extra: string) => (extra ? `${base}: ${extra}` : base);
  const featureText = values.features
    .map((id) => (id === "other" ? other(label(features, id), values.featuresOther) : label(features, id)))
    .join(", ");
  const groups: { step: number; rows: [string, string][] }[] = [
    {
      step: 0,
      rows: [
        ["Package", packageLine(values.package)],
        ["Project type", other(label(projectTypes, values.projectType), values.projectTypeOther)],
      ],
    },
    {
      step: 1,
      rows: [
        ["Current website", values.hasSite === "yes" ? values.siteUrl || "Yes" : "None"],
        ["Pages", values.pages.map((id) => label(pageOptions, id)).join(", ") || "None selected"],
      ],
    },
    { step: 2, rows: [["Features", featureText || "None selected"]] },
    {
      step: 3,
      rows: [
        ["References", values.links.filter(Boolean).join("\n") || "None"],
        ["Timeline", label(timelines, values.timeline) || "Not specified"],
        ...(values.package === "custom" ? [["Budget", label(budgets, values.budget) || "Not specified"] as [string, string]] : []),
      ],
    },
    {
      step: 4,
      rows: [
        ...(values.description ? [["Details", values.description] as [string, string]] : []),
        ["Name", values.name],
        ["Email", values.email],
        ...(values.phone ? [["Phone", values.phone] as [string, string]] : []),
        ...(values.organization ? [["Organization", values.organization] as [string, string]] : []),
      ],
    },
  ];

  return (
    <div className="review">
      {groups.map((group) => (
        <section key={group.step} className="review__group" aria-label={steps[group.step].label}>
          <div className="review__head">
            <h3 className="t-label">{steps[group.step].label}</h3>
            <button type="button" className="review__edit" onClick={() => onEdit(group.step)}>
              Edit<span className="sr-only"> {steps[group.step].label.toLowerCase()}</span>
            </button>
          </div>
          <dl className="review__list">
            {group.rows.map(([term, value]) => (
              <div key={term} className="review__row">
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
};
