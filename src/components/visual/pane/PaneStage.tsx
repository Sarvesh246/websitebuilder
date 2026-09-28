"use client";

import { m, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StageLayer = {
  id: string;
  /** Pose class (position + 3D transform live in CSS, per breakpoint). */
  className: string;
  /** Parallax strength in px at the stage edge. Nearer panes move more. */
  depth: number;
  float?: boolean;
  node: ReactNode;
};

const Layer = ({ x, y, layer, index }: { x: MotionValue<number>; y: MotionValue<number>; layer: StageLayer; index: number }) => {
  const tx = useTransform(x, (v) => v * layer.depth);
  const ty = useTransform(y, (v) => v * layer.depth);
  return (
    <m.div className={cn("stage__layer", layer.className)} style={{ x: tx, y: ty }}>
      <div className="stage__pose stage-enter" style={{ "--i": index } as CSSProperties}>
        <div className={layer.float ? "stage__float" : "stage__still"}>{layer.node}</div>
      </div>
    </m.div>
  );
};

/**
 * Floating glass panes staged in perspective (styles/stage.css). The poses are CSS; the only JS
 * motion is a spring-smoothed pointer parallax for desktop mice (never touch, never reduced motion).
 * Pointer position lives in motion values, so moving the mouse never re-renders React.
 */
export const PaneStage = ({ label, className, layers }: { label: string; className?: string; layers: StageLayer[] }) => {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 70, damping: 20, mass: 0.7 });
  const y = useSpring(py, { stiffness: 70, damping: 20, mass: 0.7 });

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
    <div className={cn("stage", className)} role="img" aria-label={label} onPointerMove={onMove} onPointerLeave={onLeave}>
      {layers.map((layer, i) => (
        <Layer key={layer.id} x={x} y={y} layer={layer} index={i} />
      ))}
    </div>
  );
};
