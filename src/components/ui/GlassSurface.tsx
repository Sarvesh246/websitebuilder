import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/cn";

const variants = {
  subtle: "glass-subtle",
  default: "glass",
  elevated: "glass-elevated",
  feature: "glass-feature",
} as const;

type GlassSurfaceProps<T extends ElementType> = {
  as?: T;
  variant?: keyof typeof variants;
  /** Adds hover lift and a focus-within ring. Use on cards that contain a link or action. */
  interactive?: boolean;
  /** Applies the standard card padding token. */
  padded?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/** Thin wrapper over the glass CSS classes (styles/glass.css). Keep visuals in CSS, not here. */
export const GlassSurface = <T extends ElementType = "div">({
  as,
  variant = "default",
  interactive,
  padded = true,
  className,
  ...props
}: GlassSurfaceProps<T>) => {
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cn(variants[variant], interactive && "glass-interactive", padded && "glass-pad", className)}
      {...props}
    />
  );
};
