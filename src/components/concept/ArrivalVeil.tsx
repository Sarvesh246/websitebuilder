"use client";

import { useEffect } from "react";

/**
 * Landing half of the /work card expand: the card's photo is still covering the screen when the
 * concept mounts (`html[data-arrive]` is set by ConceptCard) and fades out here. Invisible on direct visits.
 */
export const ArrivalVeil = ({ image }: { image: string }) => {
  useEffect(() => {
    const id = window.setTimeout(() => delete document.documentElement.dataset.arrive, 1100);
    return () => window.clearTimeout(id);
  }, []);
  return <div aria-hidden className="cx-arrival" style={{ backgroundImage: `url(${image})` }} />;
};
