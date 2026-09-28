import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/*
 * Responsive column presets. Each preset declares its own phone fallback explicitly:
 *   two:     1 col  -> 2 cols at md
 *   three:   1 col  -> 2 cols at sm -> 3 cols at lg
 *   four:    1 col  -> 2 cols at sm -> 4 cols at xl   (pricing tiers)
 *   split:   1 col  -> 12-col asymmetric 7/5 at lg    (text + artwork)
 */
const cols = {
  two: "grid-cols-1 md:grid-cols-2",
  three: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  four: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  split: "grid-cols-1 lg:grid-cols-12 lg:items-center",
} as const;

type GridProps = {
  cols?: keyof typeof cols;
} & ComponentPropsWithoutRef<"div">;

export const Grid = ({ cols: preset = "three", className, ...props }: GridProps) => (
  <div className={cn("grid gap-[var(--grid-gap)]", cols[preset], className)} {...props} />
);
