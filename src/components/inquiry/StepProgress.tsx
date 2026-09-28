import { Check } from "lucide-react";
import { steps } from "@/config/inquiry";
import { cn } from "@/lib/cn";

/**
 * Accessible step list. Below lg it collapses to a segmented bar plus "Step 2 of 6"; from lg it is
 * a vertical list in the sidebar. Steps already reached are buttons, so people can jump back.
 */
export const StepProgress = ({ current, reached, onGo }: { current: number; reached: number; onGo: (index: number) => void }) => (
  <nav aria-label="Progress" className="steps">
    <p className="steps__now" aria-hidden>
      Step {current + 1} of {steps.length}: {steps[current].label}
    </p>
    <ol className="steps__list">
      {steps.map((step, index) => {
        const done = index < current;
        const clickable = index <= reached && index !== current;
        const inner = (
          <>
            <span className="steps__dot" aria-hidden>
              {done ? <Check size={13} strokeWidth={2.75} /> : index + 1}
            </span>
            <span className="steps__label">
              {step.label}
              {done && <span className="sr-only"> (completed)</span>}
            </span>
          </>
        );
        return (
          <li key={step.id} className={cn("steps__item", done && "is-done", index === current && "is-current")} aria-current={index === current ? "step" : undefined}>
            {clickable ? (
              <button type="button" className="steps__btn" onClick={() => onGo(index)}>
                {inner}
              </button>
            ) : (
              <span className="steps__btn">{inner}</span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
