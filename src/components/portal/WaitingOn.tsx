import { ArrowRight, CircleAlert, PartyPopper } from "lucide-react";
import Link from "next/link";
import type { ProjectStage, WaitingItem } from "@/lib/portal/types";
import { stageLabel } from "@/lib/portal/types";

/** The client's to-do list for one project: each row says what, why, and links straight to where it is done. */
export const WaitingOn = ({ items, stage }: { items: WaitingItem[]; stage: ProjectStage }) => (
  <section className="pt-card pt-waiting" aria-labelledby="pt-waiting-title">
    <div className="pt-card__head">
      <div>
        <h2 className="pt-card__title" id="pt-waiting-title">
          Waiting on you
        </h2>
        <p className="pt-card__note">{items.length === 0 ? "Nothing right now" : `${items.length} ${items.length === 1 ? "thing" : "things"} to do`}</p>
      </div>
    </div>
    {items.length === 0 ? (
      <div className="pt-waiting__clear">
        <PartyPopper aria-hidden size={20} strokeWidth={1.7} />
        <p className="pt-small">
          {stage === "completed"
            ? "Your project is complete. Everything is in your hands now."
            : `You are all caught up. The studio has the next step (${stageLabel[stage].toLowerCase()}), and you will see it here when something needs you.`}
        </p>
      </div>
    ) : (
      <ol className="pt-waiting__list">
        {items.map((item) => (
          <li key={item.key} className="pt-waiting__item" data-tone={item.tone}>
            <span className="pt-waiting__mark" aria-hidden>
              {item.tone === "warn" ? <CircleAlert size={16} strokeWidth={2} /> : null}
            </span>
            <div className="pt-waiting__text">
              <p className="pt-strong">{item.title}</p>
              <p className="pt-small">{item.detail}</p>
            </div>
            <Link href={item.href} className={item.tone === "warn" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}>
              {item.cta}
              <ArrowRight aria-hidden size={15} strokeWidth={1.9} />
            </Link>
          </li>
        ))}
      </ol>
    )}
  </section>
);
