import { cn } from "@/lib/cn";

/**
 * Tiny CSS-built site sketches used inside physical panels. Purely decorative (render inside an
 * aria-hidden parent). `kind` picks a layout; complexity rises from personal to custom so the
 * panels also communicate size at a glance. Styles: styles/sections.css (.mini*).
 */
export type MiniKind = "personal" | "professional" | "business" | "custom" | "wire" | "design" | "code" | "live";

const Bar = ({ url }: { url?: string }) => (
  <span className="mini__bar">
    <i />
    <i />
    <i />
    {url && <b>{url}</b>}
  </span>
);

export const MiniSite = ({ kind, className }: { kind: MiniKind; className?: string }) => {
  if (kind === "code") {
    return (
      <div className={cn("mini mini--code", className)}>
        <Bar />
        <pre className="mini__code">
          <span className="k">export default</span> <span className="f">function</span> Page() {"{"}
          {"\n  "}
          <span className="k">return</span> (
          {"\n    "}&lt;<span className="f">Hero</span> /&gt;
          {"\n    "}&lt;<span className="f">Gallery</span> /&gt;
          {"\n    "}&lt;<span className="f">Contact</span> /&gt;
          {"\n  "})
          {"\n"}
          {"}"}
        </pre>
      </div>
    );
  }
  const layout = kind === "wire" || kind === "design" || kind === "live" ? "professional" : kind;
  return (
    <div className={cn("mini", `mini--${kind}`, `mini--l-${layout}`, className)}>
      <Bar url={kind === "live" ? "yourname.com" : undefined} />
      {layout === "custom" ? (
        <div className="mini__app">
          <span className="mini__side">
            <i /><i /><i /><i />
          </span>
          <span className="mini__main">
            <span className="mini__chart">
              <i /><i /><i /><i /><i />
            </span>
            <span className="mini__line" />
            <span className="mini__line mini__line--s" />
          </span>
        </div>
      ) : (
        <div className="mini__page">
          <span className="mini__nav">
            {Array.from({ length: layout === "business" ? 5 : layout === "personal" ? 2 : 3 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
          <span className="mini__hero">
            <span className="mini__title" />
            <span className="mini__line" />
            <span className="mini__cta" />
          </span>
          <span className={cn("mini__tiles", `mini__tiles--${layout}`)}>
            {Array.from({ length: layout === "personal" ? 3 : layout === "business" ? 3 : 4 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </div>
      )}
      {kind === "live" && <span className="mini__live">Live</span>}
    </div>
  );
};
