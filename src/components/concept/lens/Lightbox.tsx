"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { m } from "motion/react";
import { spring } from "@/lib/motion";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import type { LensPhoto } from "./photos";

type Props = {
  photos: readonly LensPhoto[];
  index: number;
  onClose: () => void;
  onIndex: (next: number) => void;
};

const FOCUSABLE = "button:not([disabled])";

export const Lightbox = ({ photos, index, onClose, onIndex }: Props) => {
  const root = useRef<HTMLDialogElement>(null);
  useLockBodyScroll(true);
  const touchX = useRef<number | null>(null);
  const photo = photos[index];
  const count = photos.length;

  const go = (delta: number) => onIndex((index + delta + count) % count);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = root.current;
    element?.showModal();
    element?.querySelector<HTMLElement>("[data-close]")?.focus();
    return () => {
      element?.close();
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && root.current) {
        const items = Array.from(root.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (!root.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <m.dialog
      ref={root}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      transition={{ ...spring, opacity: { duration: .16 } }}
      className="lens-lb"
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.title}, ${photo.place}, ${photo.year}`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="lens-lb__top">
        <span className="lens-lb__count" aria-live="polite">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
        <button type="button" className="lens-lb__btn" data-close onClick={onClose}>
          Close
        </button>
      </div>
      <div className="lens-lb__stage">
        <button type="button" className="lens-lb__nav lens-lb__nav--prev" onClick={() => go(-1)} aria-label="Previous photograph">
          <span aria-hidden>&larr;</span>
        </button>
        <div className="lens-lb__frame" key={photo.id}>
          <Image
            className="lens-lb__img"
            src={photo.src}
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            sizes="100vw"
            quality={75}
            priority
          />
        </div>
        <button type="button" className="lens-lb__nav lens-lb__nav--next" onClick={() => go(1)} aria-label="Next photograph">
          <span aria-hidden>&rarr;</span>
        </button>
      </div>
      <p className="lens-lb__cap">
        <span className="lens-lb__title">{photo.title}</span>
        <span className="lens-lb__meta">
          {photo.place} &middot; {photo.year}
        </span>
      </p>
    </m.dialog>
  );
};
