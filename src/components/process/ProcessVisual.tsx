import { Check, Lock } from "lucide-react";
import type { ProcessStep } from "@/config/process";

/**
 * The same page shown at four levels of finish, so the section reads as one site evolving:
 * wireframe -> designed -> code -> live. Decorative (the parent hides it from assistive tech).
 */
const Site = ({ mode }: { mode: "wire" | "design" | "live" }) => (
  <div className={`pv-site pv-site--${mode}`}>
    <div className="pv-site__nav">
      <b />
      <span>
        <i />
        <i />
        <i />
      </span>
    </div>
    <div className="pv-site__hero">
      <div className="pv-site__copy">
        <i className="pv-site__h" />
        <i className="pv-site__h pv-site__h--short" />
        <i className="pv-site__line" />
        <i className="pv-site__btn" />
      </div>
      <div className="pv-site__art" />
    </div>
    <div className="pv-site__tiles">
      <i />
      <i />
      <i />
    </div>
  </div>
);

const Code = () => (
  <div className="pv-code">
    <div className="pv-code__tabs">
      <i />
      <i />
    </div>
    {[
      [30, 52, 0],
      [58, 24, 1],
      [40, 34, 1],
      [22, 60, 2],
      [64, 18, 1],
      [46, 30, 2],
      [34, 44, 0],
      [52, 22, 0],
    ].map(([a, b, indent], i) => (
      <div key={i} className={`pv-code__row${i === 3 ? " pv-code__row--on" : ""}`} style={{ paddingLeft: `${indent * 1.6}em` }}>
        <em>{i + 1}</em>
        <i style={{ width: `${a}%` }} />
        <i className="pv-code__b" style={{ width: `${b}%` }} />
      </div>
    ))}
  </div>
);

export const ProcessVisual = ({ stage }: { stage: ProcessStep["id"] }) => (
  <div className={`glass-slab pv pv--${stage}`} aria-hidden>
    {stage === "launch" && (
      <div className="pv__bar">
        <span className="pv__lock">
          <Lock size={11} strokeWidth={2.2} />
          yourdomain.com
        </span>
      </div>
    )}
    <div className="pv__screen">
      {stage === "define" && <Site mode="wire" />}
      {stage === "design" && <Site mode="design" />}
      {stage === "build" && <Code />}
      {stage === "launch" && <Site mode="live" />}
    </div>
    {stage === "launch" && (
      <span className="pv__live">
        <Check size={13} strokeWidth={2.4} />
        Live
      </span>
    )}
  </div>
);
