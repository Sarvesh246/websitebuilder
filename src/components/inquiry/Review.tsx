import { budgets, features, projectTypes, steps, timelines } from "@/config/inquiry";
import { customTier, packageTiers } from "@/config/pricing";
import type { InquiryValues } from "@/lib/inquiry/schema";

const label = (list: readonly { id: string; label: string }[], id: string) => list.find((i) => i.id === id)?.label ?? "";

const packageLine = (id: InquiryValues["package"]) => {
  const tier = packageTiers.find((t) => t.id === id);
  if (tier) return `${tier.name}, $${tier.price}${tier.regularPrice !== undefined ? " launch price" : ""}`;
  return id === "custom" ? `${customTier.name}, quoted by scope` : "";
};

/** Read-only recap grouped by step, each with an Edit action that jumps back to that step. */
export const Review = ({ values, onEdit }: { values: InquiryValues; onEdit: (step: number) => void }) => {
  const groups: { step: number; rows: [string, string][] }[] = [
    {
      step: 0,
      rows: [
        ["Package", packageLine(values.package)],
        ["Project type", label(projectTypes, values.projectType)],
      ],
    },
    {
      step: 1,
      rows: [
        ["Details", values.description],
        ["Current website", values.hasSite === "yes" ? values.siteUrl || "Yes" : "None"],
        ...(values.links.some(Boolean) ? [["Links", values.links.filter(Boolean).join("\n")] as [string, string]] : []),
      ],
    },
    {
      step: 2,
      rows: [
        ["Features", values.features.map((id) => label(features, id)).join(", ") || "None selected"],
        ["Timeline", label(timelines, values.timeline) || "Not specified"],
        ...(values.package === "custom" ? [["Budget", label(budgets, values.budget) || "Not specified"] as [string, string]] : []),
      ],
    },
    {
      step: 3,
      rows: [
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
