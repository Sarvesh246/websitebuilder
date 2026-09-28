import type { Transition, Variants } from "motion/react";

/**
 * Motion conventions (JS side). CSS-side equivalents live in styles/tokens.css
 * (--dur-*, --ease-*). Keep both in sync.
 *
 * Rules: animate transform and opacity only. Reveal once, on entry. Do not animate
 * everything. Reduced motion is handled globally by <MotionProvider/> (transforms drop
 * out, opacity remains) and by the reduced-motion block in styles/base.css.
 */
export const ease = {
  out: [0.16, 1, 0.3, 1],
  standard: [0.2, 0, 0, 1],
} as const;

export const duration = { fast: 0.15, base: 0.26, slow: 0.64 } as const;

export const revealTransition: Transition = {
  duration: duration.slow,
  ease: ease.out,
};

/** Distance a reveal travels. Small on purpose: motion should be felt, not watched. */
export const revealDistance = 16;

export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  // Concrete values (not empty) so the parent animates and propagates its label to children.
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const fadeUp = (y = revealDistance): Variants => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: revealTransition },
});

/** Shared viewport config: fire once, slightly before the element is fully in view. */
export const revealViewport = { once: true, amount: 0.2 } as const;
