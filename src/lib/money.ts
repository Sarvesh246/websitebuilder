/** Client-safe money helpers. Amounts are integer cents everywhere; only display converts to dollars. */
export const formatUsd = (cents: number | null | undefined, opts: { compact?: boolean } = {}): string => {
  if (cents == null) return "TBD";
  const dollars = cents / 100;
  const whole = Number.isInteger(dollars);
  if (opts.compact && Math.abs(dollars) >= 10_000) return `$${(dollars / 1000).toFixed(1)}k`;
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
};
