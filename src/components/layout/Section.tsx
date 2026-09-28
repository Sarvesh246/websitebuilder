import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

const spacing = {
  default: "py-[var(--section-y)]",
  tight: "py-[var(--section-y-tight)]",
  none: "",
} as const;

type SectionProps = {
  spacing?: keyof typeof spacing;
} & ComponentPropsWithoutRef<"section">;

/**
 * Page section. Owns vertical rhythm and is the positioning context for <Ambient/>.
 * Put <Ambient/> first, then a <Container/> (which stacks above it) inside.
 */
export const Section = ({ spacing: space = "default", className, ...props }: SectionProps) => (
  <section
    className={cn("relative isolate", spacing[space], className)}
    {...props}
  />
);
