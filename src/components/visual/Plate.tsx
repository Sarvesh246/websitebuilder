import { cn } from "@/lib/cn";

export type PlateName = "hero" | "why" | "services" | "process" | "pricing" | "ownership" | "cta";

/**
 * Rendered environment behind a section (sky, haze, mountains, lake, concrete). First child of a
 * <Section/>. The image is a CSS background chosen per theme in styles/pane.css, so only the active
 * theme's photo downloads. Photos live in public/images/backdrops/.
 */
export const Plate = ({ name, className }: { name: PlateName; className?: string }) => (
  <div aria-hidden className={cn("plate", `plate--${name}`, className)} />
);
