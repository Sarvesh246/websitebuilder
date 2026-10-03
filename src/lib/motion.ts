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

/** Distance a reveal travels (px). Small on purpose: motion should be felt, not watched. Mirrors --reveal-y in base.css. */
export const revealDistance = 16;
