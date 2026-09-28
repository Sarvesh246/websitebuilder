import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type GlowProps = {
  tone?: "cool" | "warm" | "haze" | "shade";
  /** CSS lengths/percentages relative to the Ambient container. */
  x?: string;
  y?: string;
  size?: string;
  intensity?: number;
  drift?: boolean;
};

export const Glow = ({ tone = "cool", x = "50%", y = "50%", size = "50rem", intensity = 1, drift }: GlowProps) => (
  <span
    aria-hidden
    className={cn("glow", `glow--${tone}`, drift && "glow--drift")}
    style={{ "--x": x, "--y": y, "--size": size, "--intensity": intensity } as CSSProperties}
  />
);

export const GridOverlay = () => <span aria-hidden className="ambient-grid" />;

export const Fade = ({ edge }: { edge: "top" | "bottom" }) => (
  <span aria-hidden className={cn("ambient-fade", `ambient-fade--${edge}`)} />
);

/**
 * Section lighting presets. Render as the first child of a <Section/>; it fills the section
 * and sits behind content. Add new presets here rather than hand-placing glows in sections,
 * so lighting stays consistent across the page.
 *
 *   hero     large cool key light top-right, warm horizon glow low, soft haze left, faint grid
 *   section  one soft cool glow off-centre, edges faded into the page colour
 *   pricing  centred glow behind the featured card, haze either side
 *   quiet    a single faint glow, for text-heavy sections
 */
type Preset = "hero" | "section" | "pricing" | "quiet";

export const Ambient = ({ preset = "section", className }: { preset?: Preset; className?: string }) => (
  <div aria-hidden className={cn("ambient", className)}>
    {preset === "hero" && (
      <>
        <Glow tone="cool" x="78%" y="18%" size="62rem" intensity={0.9} drift />
        <Glow tone="warm" x="50%" y="108%" size="72rem" intensity={0.85} />
        <Glow tone="haze" x="12%" y="40%" size="46rem" intensity={0.8} />
        <GridOverlay />
        <Fade edge="bottom" />
      </>
    )}
    {preset === "section" && (
      <>
        <Glow tone="cool" x="72%" y="30%" size="52rem" intensity={0.7} />
        <Glow tone="haze" x="20%" y="70%" size="40rem" intensity={0.7} />
        <Fade edge="top" />
        <Fade edge="bottom" />
      </>
    )}
    {preset === "pricing" && (
      <>
        <Glow tone="cool" x="50%" y="52%" size="56rem" intensity={0.85} />
        <Glow tone="haze" x="8%" y="30%" size="36rem" intensity={0.7} />
        <Glow tone="haze" x="92%" y="70%" size="36rem" intensity={0.7} />
        <Fade edge="top" />
        <Fade edge="bottom" />
      </>
    )}
    {preset === "quiet" && (
      <>
        <Glow tone="cool" x="80%" y="20%" size="40rem" intensity={0.45} />
        <Fade edge="top" />
        <Fade edge="bottom" />
      </>
    )}
  </div>
);

/** One fixed film-grain layer for the whole site. Mount once, in the root layout. */
export const Grain = () => <div aria-hidden className="grain" />;
