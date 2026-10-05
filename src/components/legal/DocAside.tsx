import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { startHref } from "@/config/inquiry";

export type TocItem = { id: string; label: string };

/** Stable anchor id from a heading ("Data retention" -> "data-retention"). */
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const tocFrom = (headings: readonly string[]): TocItem[] => headings.map((h) => ({ id: slugify(h), label: h }));

/**
 * Right-hand rail for the reading pages (guides, FAQ, About, legal) from lg up: "On this page" links
 * and an optional project card. Sticky, so the wide desktop canvas stays balanced while the text
 * column keeps a readable measure. Hidden below lg, where the page is a single column.
 */
export const DocAside = ({ toc, cta = true }: { toc: readonly TocItem[]; cta?: boolean }) => (
  <aside className="doc__aside">
    {toc.length > 1 && (
      <nav aria-label="On this page" className="doc__toc">
        <p className="doc__aside-title t-small">On this page</p>
        <ol>
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ol>
      </nav>
    )}
    {cta && (
      <div className="doc__cta">
        <p className="doc__cta-title">Have a project in mind?</p>
        <p className="t-small">A request takes a few minutes, costs nothing, and commits you to nothing.</p>
        <Button href={startHref()} icon="diag" block>
          Start a Project
        </Button>
        <Link href="/#pricing" className="doc__cta-link t-small">
          View pricing
        </Link>
      </div>
    )}
  </aside>
);
