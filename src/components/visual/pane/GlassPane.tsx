import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type GlassPaneProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Wrap children in the inset screen (default). Off for cards that put content on the glass itself. */
  screen?: boolean;
};

/**
 * Thick acrylic slab (styles/pane.css): bevelled rim, refraction edge, glare, extrusion and soft
 * drop shadow. Decorative by default; give the parent role="img" + aria-label when it carries meaning.
 */
export const GlassPane = ({ children, className, style, screen = true }: GlassPaneProps) => (
  <div className={cn("pane", className)} style={style}>
    {screen ? <div className="pane__screen">{children}</div> : children}
  </div>
);
