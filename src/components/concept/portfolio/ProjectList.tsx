"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { spring } from "@/lib/motion";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

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
  const [selected, setSelected] = useState<Project | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, spring);
  const springY = useSpring(y, spring);
  const reduce = useReducedMotion();
  const fine = useRef(false);

  useEffect(() => {
    fine.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  const move = (e: React.PointerEvent) => {
    if (!fine.current) return;
    x.set(Math.max(8, Math.min(e.clientX + 28, window.innerWidth - 340)));
    y.set(Math.max(8, Math.min(e.clientY - 120, window.innerHeight - 240)));
  };

  const enter = (i: number, e: React.PointerEvent) => {
    if (!fine.current) return;
    if (active === null) {
      move(e);
      springX.jump(x.get());
      springY.jump(y.get());
    }
    setActive(i);
  };

  return (
    <div onPointerMove={move} onPointerLeave={() => setActive(null)}>
      <ol className="pf-list">
        {projects.map((p, i) => (
          <li key={p.n} className="pf-row" data-active={active === i || undefined}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                setSelected(p);
                setActive(null);
              }}
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
            </button>
          </li>
        ))}
      </ol>
      <m.div
        className="pf-preview"
        style={{ x: reduce ? x : springX, y: reduce ? y : springY }}
        aria-hidden
        data-on={active !== null || undefined}
      >
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
      </m.div>
      <AnimatePresence>
        {selected && <ProjectDetails project={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
};

const ProjectDetails = ({ project, onClose }: { project: Project; onClose: () => void }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  useLockBodyScroll(true);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <m.dialog
      ref={dialog}
      className="pf-project-dialog"
      aria-label={project.title}
      initial={{ y: 12, scale: 0.98, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ y: 6, scale: 0.99, opacity: 0 }}
      transition={{ ...spring, opacity: { duration: 0.15 } }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button type="button" className="pf-btn pf-btn--ghost" onClick={onClose}>
        Close project
      </button>
      <h2 className="pf-h2">{project.title}</h2>
      <p>
        {project.kind} · {project.year}
      </p>
      <Image
        src={project.img}
        alt={project.alt}
        width={project.w}
        height={project.h}
        sizes="(max-width: 760px) 90vw, 720px"
      />
      <p>{project.blurb}</p>
    </m.dialog>
  );
};
