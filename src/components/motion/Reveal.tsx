"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { revealDistance } from "@/lib/motion";

/*
 * Scroll reveals are plain CSS transitions (opacity + transform, both compositor-only), started by
 * flipping one attribute. One shared IntersectionObserver serves every reveal on the page, and nothing
 * re-renders or runs per frame. (They used to animate a CSS variable from JS on every frame, which
 * re-styled each revealed subtree 60 times a second and made key presses wait seconds on slow machines.)
 * CSS lives in styles/base.css ([data-reveal] / [data-in]).
 */
type Revealable = HTMLElement & { __reveal?: () => void };

let observer: IntersectionObserver | null = null;
const sharedObserver = () =>
  (observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer?.unobserve(entry.target);
        (entry.target as Revealable).__reveal?.();
      }
    },
    { threshold: 0.2 },
  ));

/** Reveals `el` (via `show`) once it is 20% in view. Shows immediately where IntersectionObserver is missing. */
const useRevealOnView = (show: (el: HTMLElement) => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current as Revealable | null;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return show(el);
    el.__reveal = () => show(el);
    const io = sharedObserver();
    io.observe(el);
    return () => {
      io.unobserve(el);
      delete el.__reveal;
    };
  }, [show]);
  return ref;
};

const showSelf = (el: HTMLElement) => el.setAttribute("data-in", "");

/** Items of a group reveal in order: each gets its index for the stagger delay, then all flip at once. */
const showItems = (group: HTMLElement) => {
  const items = Array.from(group.querySelectorAll<HTMLElement>("[data-reveal-item]")).filter((item) => item.closest("[data-reveal-group]") === group);
  items.forEach((item, i) => {
    item.style.setProperty("--reveal-i", String(i));
    item.setAttribute("data-in", "");
  });
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

const travel = (y: number | undefined): CSSProperties | undefined =>
  y === undefined || y === revealDistance ? undefined : ({ "--reveal-y": `${y}px` } as CSSProperties);

/**
 * Single-element entrance: fade (children, never the wrapper: see base.css) + small upward travel, once.
 * Use on headings, a hero block, or one artwork. For a set of siblings use <RevealGroup/> so they cascade.
 */
export const Reveal = ({ children, className, delay = 0, y }: RevealProps) => {
  const ref = useRevealOnView(showSelf);
  const style = { ...travel(y), ...(delay ? { "--reveal-delay": `${delay}s` } : null) } as CSSProperties;
  return (
    <div ref={ref} data-reveal className={className} style={style}>
      {children}
    </div>
  );
};

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
};

/** Parent that staggers its <RevealItem/> children (in document order) once the group scrolls into view. */
export const RevealGroup = ({ children, className, stagger = 0.08, delay = 0 }: RevealGroupProps) => {
  const ref = useRevealOnView(showItems);
  const style = { "--reveal-stagger": `${stagger}s`, ...(delay ? { "--reveal-delay": `${delay}s` } : null) } as CSSProperties;
  return (
    <div ref={ref} data-reveal-group className={className} style={style}>
      {children}
    </div>
  );
};

export const RevealItem = ({ children, className, y }: Omit<RevealProps, "delay">) => (
  <div data-reveal data-reveal-item className={className} style={travel(y)}>
    {children}
  </div>
);
