"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Lightbox } from "./Lightbox";
import { lensPhotos, type LensCategory, type LensPhoto } from "./photos";

const FILTERS: readonly ("All" | LensCategory)[] = ["All", "Landscape", "Portrait", "Street"];

type TileProps = { photo: LensPhoto; priority: boolean; onOpen: () => void };

const Tile = ({ photo, priority, onOpen }: TileProps) => {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.in = "";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.in = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <li ref={ref} className="lens-tile">
      <button type="button" className="lens-tile__btn" onClick={onOpen} aria-haspopup="dialog" aria-label={`Open ${photo.title}, ${photo.place}, ${photo.year}`}>
        <Image
          className="lens-tile__img"
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          sizes="(min-width: 1400px) 33vw, (min-width: 700px) 50vw, 100vw"
          quality={70}
          priority={priority}
        />
        <span className="lens-tile__cap" aria-hidden>
          <span className="lens-tile__title">{photo.title}</span>
          <span className="lens-tile__meta">
            {photo.place} &middot; {photo.year}
          </span>
        </span>
      </button>
    </li>
  );
};

export const Gallery = () => {
  const [filter, setFilter] = useState<"All" | LensCategory>("All");
  const [open, setOpen] = useState<number | null>(null);

  const photos = useMemo(
    () => (filter === "All" ? lensPhotos : lensPhotos.filter((p) => p.category === filter)),
    [filter],
  );

  return (
    <section className="lens-work" id="work" aria-label="Selected photographs">
      <div className="lens-filters" role="group" aria-label="Filter photographs by category">
        {FILTERS.map((f) => (
          <button key={f} type="button" className="lens-filter" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
        <span className="lens-filters__count" aria-live="polite">
          {photos.length} {photos.length === 1 ? "frame" : "frames"}
        </span>
      </div>
      <ul className="lens-grid" key={filter}>
        {photos.map((photo, i) => (
          <Tile key={photo.id} photo={photo} priority={i < 2} onOpen={() => setOpen(i)} />
        ))}
      </ul>
      {open !== null && photos[open] && <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </section>
  );
};
