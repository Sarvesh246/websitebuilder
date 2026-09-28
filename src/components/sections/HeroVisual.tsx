"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { BrowserMockup, CafeScreen, CreatorScreen, PhoneMockup, PortfolioScreen } from "@/components/visual/mockup/Mockups";
import { Plinth } from "@/components/visual/environment/Scene";
import { cn } from "@/lib/cn";

/**
 * Hero centrepiece: layered concept-site mockups. Depth comes from stacking, soft shadows, a
 * small static tilt, and (desktop mouse only) a pointer parallax that moves each layer by a
 * different amount. Pointer position lives in motion values, so nothing re-renders on move.
 * Entrance and the two slow floats are CSS (styles/hero.css); parallax is the only JS motion.
 */

type LayerProps = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  depth: number;
  index: number;
  className: string;
  children: ReactNode;
  floating?: boolean;
};

const Layer = ({ x, y, depth, index, className, children, floating }: LayerProps) => {
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(y, (v) => v * depth);
  return (
    <motion.div className={cn("hero-layer", className)} style={{ x: tx, y: ty }}>
      <div className="hero-layer__in hero-enter" style={{ "--i": index } as CSSProperties}>
        <div className={floating ? "hero-float" : undefined}>{children}</div>
      </div>
    </motion.div>
  );
};

export const HeroVisual = () => {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 90, damping: 22, mass: 0.6 });
  const y = useSpring(py, { stiffness: 90, damping: 22, mass: 0.6 });

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - box.left) / box.width - 0.5);
    py.set((event.clientY - box.top) / box.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div className="hero-visual">
      <div
        className="hero-stage"
        role="img"
        aria-label="Concept website designs for a portfolio, a coffee shop, and a creator, shown in browser and phone mockups"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <Plinth className="hero-plinth" />
        <div className="hero-scene3d">
        <Layer x={x} y={y} depth={8} index={1} className="hero-layer--panel">
          <div className="glass hero-panel">
            <span className="hero-panel__row hero-panel__row--on" />
            <span className="hero-panel__row" />
            <span className="hero-panel__row" />
          </div>
        </Layer>
        <Layer x={x} y={y} depth={10} index={2} className="hero-layer--back">
          <BrowserMockup url="alder.coffee">
            <CafeScreen />
          </BrowserMockup>
        </Layer>
        <Layer x={x} y={y} depth={22} index={3} className="hero-layer--main">
          <BrowserMockup url="nora.studio" className="reflect">
            <PortfolioScreen />
          </BrowserMockup>
        </Layer>
        <Layer x={x} y={y} depth={40} index={5} className="hero-layer--phone" floating>
          <PhoneMockup>
            <CreatorScreen />
          </PhoneMockup>
        </Layer>
        <Layer x={x} y={y} depth={32} index={6} className="hero-layer--chip" floating>
          <div className="glass-elevated hero-chip">
            <span className="hero-chip__aa">Aa</span>
            <span className="hero-chip__swatches">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </Layer>
        </div>
      </div>
      <p className="hero-visual__note">Concept designs, not client work.</p>
    </div>
  );
};
