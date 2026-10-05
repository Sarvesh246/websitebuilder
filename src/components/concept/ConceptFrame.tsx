import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { ArrivalVeil } from "@/components/concept/ArrivalVeil";
import { conceptBySlug, type ConceptSlug } from "@/config/concepts";
import { startHref } from "@/config/inquiry";
import "@/styles/concept-frame.css";

type Props = {
  slug: ConceptSlug;
  /** Font-variable classes from next/font plus the concept's own scope class (e.g. "cx-cafe"). */
  className?: string;
  children: ReactNode;
};

/**
 * Shared shell for every concept site: the slim Northframe preview bar and an isolated page
 * wrapper. Concept CSS must be scoped under its own `.cx-<slug>` class and use `var(--cx-bar)`
 * as the top offset for any sticky/fixed element of its own.
 */
export const ConceptFrame = ({ slug, className = "", children }: Props) => {
  const concept = conceptBySlug(slug);
  return (
    <div className={`cx cx-${slug} ${className}`}>
      <ArrivalVeil image={concept.image} />
      <div className="cx-bar">
        <Link href="/work" className="cx-bar__back">
          <ArrowLeft aria-hidden size={14} strokeWidth={2} />
          <span>Back to Concepts</span>
        </Link>
        <p className="cx-bar__note">
          Concept by Northframe <span aria-hidden>·</span> <span className="cx-bar__fiction">{concept.brand} is not a real business</span>
        </p>
        <Link href={startHref(concept.pkg)} className="cx-bar__cta">
          <span>Want one like this?</span>
          <ArrowUpRight aria-hidden size={14} strokeWidth={2} />
        </Link>
      </div>
      <main id="main" className="cx-page">
        {children}
      </main>
    </div>
  );
};
