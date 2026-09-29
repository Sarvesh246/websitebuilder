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

/*
 * Reveals fade through `--reveal`, which base.css applies as opacity on the wrapper's CHILDREN, not
 * the wrapper. An ancestor with opacity < 1 becomes the "backdrop root" for backdrop-filter, so a
 * frosted card inside a fading wrapper would blur only the wrapper's (empty) contents and then snap
 * to full frost when the fade ends. The wrapper itself only moves (transform is not a backdrop root).
 */
export const fadeUp = (y = revealDistance): Variants => ({
  hidden: { "--reveal": 0, y },
  show: { "--reveal": 1, y: 0, transition: revealTransition },
});

/** Shared viewport config: fire once, slightly before the element is fully in view. */
export const revealViewport = { once: true, amount: 0.2 } as const;
