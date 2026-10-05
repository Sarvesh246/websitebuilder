import { Check, Minus } from "lucide-react";
import { GlassSurface } from "@/components/ui/GlassSurface";
import {
  compareRows,
  customTier,
  packageTiers,
  type CompareCell,
} from "@/config/pricing";

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
 * Decision-relevant differences only. One semantic table at every width (crawlers and screen readers
 * get the data once): md and up it is a grid; on phones CSS restacks each row into a 2x2 block and
 * prints the package name from `data-label` (no horizontal scrolling, no duplicate markup).
 */
export const CompareTable = () => (
  <div className="flex flex-col gap-6">
    <h3 className="t-h3">Compare packages</h3>

    <GlassSurface variant="subtle" padded={false} className="compare">
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
                  <td key={columns[i].id} data-label={columns[i].name} data-featured={columns[i].featured || undefined}>
                    <Cell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassSurface>
  </div>
);
