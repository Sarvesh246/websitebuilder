"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { conceptPath, packageName, type Concept } from "@/config/concepts";

const EXPAND_MS = 620;

type Inset = { t: number; r: number; b: number; l: number };

/**
 * A concept card on /work. Hover: a coloured aura follows the cursor and the rim lights up.
 * Click: the card opens out to fill the screen (clip-path from the card's own box), then the concept
 * site loads under it. Modified clicks, reduced motion and no-JS fall back to a plain link.
 */
export const ConceptCard = ({ concept, index }: { concept: Concept; index: number }) => {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [inset, setInset] = useState<Inset | null>(null);
  const href = conceptPath(concept.slug);
  const tier = { name: packageName(concept.pkg) };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const track = (event: PointerEvent<HTMLAnchorElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
  };

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (modified || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !ref.current) return;
    event.preventDefault();
    if (inset) return;
    const box = ref.current.getBoundingClientRect();
    setInset({ t: box.top, r: window.innerWidth - box.right, b: window.innerHeight - box.bottom, l: box.left });
    document.documentElement.dataset.arrive = concept.slug;
    router.prefetch(href);
    timer.current = window.setTimeout(() => router.push(href), EXPAND_MS);
  };

  const style = { "--glow": concept.glow, "--i": index } as CSSProperties;
  const veil = inset && {
    "--t": `${inset.t}px`,
    "--r": `${inset.r}px`,
    "--b": `${inset.b}px`,
    "--l": `${inset.l}px`,
    "--glow": concept.glow,
    backgroundImage: `url(${concept.image})`,
  } as CSSProperties;

  return (
    <>
      <Link
        ref={ref}
        href={href}
        className="cc"
        data-tone={concept.tone}
        data-slug={concept.slug}
        style={style}
        onPointerMove={track}
        onClick={open}
        aria-label={`View concept: ${concept.title}, fits the ${tier.name} package`}
      >
        <Image
          src={concept.image}
          alt={`${concept.title} website concept preview`}
          fill
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
          className="cc__img"
          priority={index < 2}
        />
        <span aria-hidden className="cc__shade" />
        <span aria-hidden className="cc__aura" />
        <span aria-hidden className="cc__rim" />
        <span className="cc__body">
          <span className="cc__top">
            <span className="cc__num" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="cc__pill">Fits {tier.name}</span>
          </span>
          <span className="cc__bottom">
            <span className="cc__aud">{concept.audience}</span>
            <span className="cc__title">{concept.title}</span>
            <span className="cc__sum">{concept.summary}</span>
            <span className="cc__cta">
              View concept
              <ArrowUpRight aria-hidden size={16} strokeWidth={2} />
            </span>
          </span>
        </span>
      </Link>
      {inset &&
        createPortal(
          <div className="cc-expand" style={veil || undefined} aria-hidden>
            <span className="cc-expand__label">{concept.brand}</span>
          </div>,
          document.body,
        )}
    </>
  );
};
