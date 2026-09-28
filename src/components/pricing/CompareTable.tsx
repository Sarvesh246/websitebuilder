import { Check, ChevronDown, Minus } from "lucide-react";
import { GlassSurface } from "@/components/ui/GlassSurface";
import {
  compareRows,
  customTier,
  packageTiers,
  type CompareCell,
} from "@/config/pricing";
import { cn } from "@/lib/cn";

const columns = [
  ...packageTiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    price: `$${tier.price}`,
    featured: tier.featured,
    badge: tier.badge,
  })),
  { id: customTier.id, name: customTier.name, price: "Quote", featured: false, badge: undefined },
];

const Cell = ({ value }: { value: CompareCell }) => {
  if (value === true) {
    return (
      <>
        <Check aria-hidden size={16} strokeWidth={2} className="compare__yes" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus aria-hidden size={16} strokeWidth={2} className="compare__no" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <>{value}</>;
};

/**
 * Decision-relevant differences only; anything every package has is in the footnote.
 * md and up: a real table. Phones: the same data as a collapsible, row-by-row list
 * (no horizontal scrolling, no tiny columns).
 */
export const CompareTable = () => (
  <div className="flex flex-col gap-6">
    <h3 className="t-h3 hidden md:block">Compare packages</h3>

    <GlassSurface variant="subtle" padded={false} className="compare hidden md:block">
      <div className="compare__clip">
        <table>
          <caption className="sr-only">Comparison of the Launch, Presence, Business, and Custom packages</caption>
          <thead>
            <tr>
              <td />
              {columns.map((col) => (
                <th key={col.id} scope="col" data-featured={col.featured || undefined}>
                  <span className="compare__name">{col.name}</span>
                  <span className="compare__price">{col.price}</span>
                  {col.badge && <span className="compare__badge">{col.badge}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {row.values.map((value, i) => (
                  <td key={columns[i].id} data-featured={columns[i].featured || undefined}>
                    <Cell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassSurface>

    <details className="compare-m md:hidden">
      <summary className="glass-subtle">
        <span className="t-h4">Compare packages</span>
        <ChevronDown aria-hidden size={20} strokeWidth={1.8} className="compare-m__chevron" />
      </summary>
      <div className="compare-m__rows">
        {compareRows.map((row) => (
          <div key={row.label} className="compare-m__row">
            <p className="compare-m__label">{row.label}</p>
            <dl className="compare-m__values">
              {row.values.map((value, i) => (
                <div key={columns[i].id} className={cn(columns[i].featured && "is-featured")}>
                  <dt>{columns[i].name}</dt>
                  <dd>
                    <Cell value={value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </details>

  </div>
);
