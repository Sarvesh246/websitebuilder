"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import { ease, revealTransition } from "@/lib/motion";

type TrackItem = { key: string; number: string; visual: ReactNode; text: ReactNode };

/**
 * Process progression. When the list scrolls into view each step rises in turn and the connector
 * to the next step draws itself (horizontal at xl, vertical below). Transform + opacity only,
 * once. Reduced motion is handled by <MotionProvider/> (transforms drop out).
 * `data-reveal` keeps everything visible without JS (see the noscript rule in layout.tsx).
 */
export const ProcessTrack = ({ items }: { items: TrackItem[] }) => {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <ol ref={ref} className="process__steps">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const delay = 0.1 + i * 0.22;
        const draw = { duration: 0.7, ease: ease.out, delay: delay + 0.3 };
        return (
          <motion.li
            key={item.key}
            data-reveal
            className="process__step"
            style={{ "--i": i } as React.CSSProperties}
            initial={{ opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ ...revealTransition, delay }}
          >
            <div className="process__visual">{item.visual}</div>
            <div className="process__node" aria-hidden>
              <span className="process__num">{item.number}</span>
              {!last && (
                <>
                  <motion.span
                    data-reveal
                    className="process__link process__link--h"
                    initial={{ scaleX: 0 }}
                    animate={inView ? { scaleX: 1 } : undefined}
                    transition={draw}
                  />
                  <motion.span
                    data-reveal
                    className="process__link process__link--v"
                    initial={{ scaleY: 0 }}
                    animate={inView ? { scaleY: 1 } : undefined}
                    transition={draw}
                  />
                </>
              )}
            </div>
            <div className="process__text">{item.text}</div>
          </motion.li>
        );
      })}
    </ol>
  );
};
