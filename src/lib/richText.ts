/**
 * Inline links inside guide copy: `[anchor text](/path)` in a paragraph, bullet or FAQ answer.
 * Only site-relative paths are allowed (external links stay in markup, never in copy), so every
 * in-body link is a contextual internal link whose target the tests can check.
 */
export type RichPart = { text: string; href?: string };

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

/** Splits copy into plain text and link parts, in order. */
export const parseRich = (source: string): RichPart[] => {
  const parts: RichPart[] = [];
  let last = 0;
  for (const m of source.matchAll(LINK)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ text: source.slice(last, at) });
    parts.push({ text: m[1], href: m[2] });
    last = at + m[0].length;
  }
  if (last < source.length) parts.push({ text: source.slice(last) });
  return parts;
};

/** The same copy with links reduced to their anchor text (structured data, plain-text outputs). */
export const plainText = (source: string): string => source.replace(LINK, "$1");

/** Every link target in the copy, without any #fragment. */
export const richHrefs = (source: string): string[] =>
  [...source.matchAll(LINK)].map((m) => m[2].split("#")[0] || "/");
