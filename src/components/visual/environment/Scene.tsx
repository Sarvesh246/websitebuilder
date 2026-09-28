import { cn } from "@/lib/cn";
import { Terrain } from "./Terrain";

/**
 * Decorative environment for a section: sky wash, sun bloom, terrain, mist. Render as the first
 * child of a <Section/> (instead of, or beside, <Ambient/>). The variant only changes where the
 * terrain sits and how it is masked (styles/environment.css); the lighting model is shared, so
 * sections read as one landscape seen from different places.
 *
 *   hero    terrain low and to the right, masked away from the headline
 *   backdrop terrain across the upper part of a tall section, fading both ways (pricing)
 *   wide    full-width terrain at the base (final CTA); the near ridge meets the footer
 *   dusk    low dark silhouettes behind the ownership scene
 */
type SceneProps = {
  variant: "hero" | "backdrop" | "wide" | "dusk";
  seed?: number;
  relief?: number;
  className?: string;
};

export const Scene = ({ variant, seed, relief, className }: SceneProps) => (
  <div aria-hidden className={cn("env", `env--${variant}`, className)}>
    <span className="env__sun" />
    <Terrain seed={seed} relief={relief} layers={variant === "dusk" ? 2 : 3} className="env__terrain" />
    <span className="env__mist" />
  </div>
);

/** Polished stone slab that objects stand on. Perspective top, lit front edge, soft contact shadow. */
export const Plinth = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn("plinth", className)}>
    <span className="plinth__shadow" />
    <span className="plinth__top" />
    <span className="plinth__face" />
  </div>
);
