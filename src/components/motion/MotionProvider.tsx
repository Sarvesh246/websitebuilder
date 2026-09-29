"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// Loaded as its own chunk after first paint, so the animation engine never blocks the first screen on a slow link.
const loadFeatures = () => import("./features").then((mod) => mod.default);

/** LazyMotion + `m` components ship only the animation feature set (no drag/layout). reducedMotion="user": transform/layout animations drop out when the OS asks for less motion. */
export const MotionProvider = ({ children }: { children: ReactNode }) => (
  <LazyMotion features={loadFeatures} strict>
    <MotionConfig reducedMotion="user">{children}</MotionConfig>
  </LazyMotion>
);
