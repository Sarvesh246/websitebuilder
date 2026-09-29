"use client";

import { m, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import { fadeUp, revealDistance, revealTransition, revealViewport, staggerContainer } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

/**
 * Single-element entrance: fade (children, see fadeUp in lib/motion.ts) + small upward travel, once. Use on headings, a hero block,
 * or one artwork. For a set of siblings use <RevealGroup/> so they cascade instead of firing
 * independently.
 */
export const Reveal = ({ children, className, delay = 0, y = revealDistance }: RevealProps) => (
  <m.div
    data-reveal
    className={className}
    initial={{ "--reveal": 0, y }}
    whileInView={{ "--reveal": 1, y: 0 }}
    viewport={revealViewport}
    transition={{ ...revealTransition, delay }}
  >
    {children}
  </m.div>
);

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
};

/** Parent that staggers its <RevealItem/> children. */
export const RevealGroup = ({ children, className, stagger, delay }: RevealGroupProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, revealViewport);
  return (
    <m.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={staggerContainer(stagger, delay)}
    >
      {children}
    </m.div>
  );
};

export const RevealItem = ({ children, className, y }: Omit<RevealProps, "delay">) => (
  <m.div data-reveal className={className} variants={fadeUp(y)}>
    {children}
  </m.div>
);
