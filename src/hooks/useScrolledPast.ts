"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True once the sentinel element has scrolled out of view. Uses IntersectionObserver,
 * not a scroll listener, so it costs nothing per frame.
 */
export const useScrolledPast = (sentinel: RefObject<Element | null>) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, [sentinel]);

  return scrolled;
};
