"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type Project = {
  n: string;
  title: string;
  kind: string;
  year: string;
  blurb: string;
  img: string;
  alt: string;
  w: number;
  h: number;
};

/** Numbered work list. On hover-capable pointers a photo follows the cursor (transform only). */
export const ProjectList = ({ projects }: { projects: Project[] }) => {
  const [active, setActive] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const fine = useRef(false);

  useEffect(() => {
    fine.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const tickRef = useRef<() => void>(() => {});
  const tick = useCallback(() => {
    const el = preview.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const k = reduce ? 1 : 0.16;
    current.current.x += (target.current.x - current.current.x) * k;
    current.current.y += (target.current.y - current.current.y) * k;
    el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
    const settled =
      Math.abs(target.current.x - current.current.x) < 0.3 &&
      Math.abs(target.current.y - current.current.y) < 0.3;
    raf.current = settled ? null : requestAnimationFrame(() => tickRef.current());
  }, []);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const move = (e: React.PointerEvent) => {
    if (!fine.current) return;
    target.current = { x: e.clientX + 28, y: e.clientY - 120 };
    if (raf.current === null) raf.current = requestAnimationFrame(tick);
  };

  const enter = (i: number, e: React.PointerEvent) => {
    if (!fine.current) return;
    if (active === null) {
      current.current = { x: e.clientX + 28, y: e.clientY - 120 };
      target.current = { ...current.current };
      if (preview.current) {
        preview.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      }
    }
    setActive(i);
  };

  return (
    <div onPointerMove={move} onPointerLeave={() => setActive(null)}>
      <ol className="pf-list">
        {projects.map((p, i) => (
          <li key={p.n} className="pf-row" data-active={active === i || undefined}>
            <a
              href="#"
              className="pf-row__link"
              onPointerEnter={(e) => enter(i, e)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <span className="pf-row__n">{p.n}</span>
              <span className="pf-row__thumb">
                <Image src={p.img} alt={p.alt} width={p.w} height={p.h} sizes="(max-width: 700px) 92vw, 0px" />
              </span>
              <span className="pf-row__title">{p.title}</span>
              <span className="pf-row__kind">{p.kind}</span>
              <span className="pf-row__year">{p.year}</span>
              <span className="pf-row__blurb">{p.blurb}</span>
              <span className="pf-row__arrow" aria-hidden>
                &#8599;
              </span>
            </a>
          </li>
        ))}
      </ol>
      <div ref={preview} className="pf-preview" aria-hidden data-on={active !== null || undefined}>
        <div className="pf-preview__frame">
          {projects.map((p, i) => (
            <Image
              key={p.n}
              src={p.img}
              alt={`${p.title} project preview`}
              fill
              sizes="320px"
              className="pf-preview__img"
              data-on={active === i || undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
