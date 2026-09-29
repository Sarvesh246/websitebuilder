"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export type PlateName = "hero" | "why" | "services" | "process" | "pricing" | "ownership" | "cta" | "about" | "intake";

/**
 * Rendered environment behind a section (sky, haze, mountains, lake, concrete). First child of a
 * <Section/>. The image is a CSS background chosen per theme in styles/pane.css, so only the active
 * theme's photo downloads. Photos live in public/images/backdrops/.
 *
 * `eager` plates (first screen) paint straight away. The rest get `data-near` once their section is
 * within a viewport of the screen, which is what lets pane.css start the download. It is set on the
 * DOM node directly, so it never re-renders anything; without JS the CSS rule doesn't apply and every
 * backdrop loads as before.
 */
export const Plate = ({ name, className, eager = false }: { name: PlateName; className?: string; eager?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || eager) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.dataset.near = "";
        observer.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <div ref={ref} aria-hidden data-near={eager ? "" : undefined} className={cn("plate", `plate--${name}`, className)}>
      <div className="plate__img" />
    </div>
  );
};
