"use client";

import { useEffect } from "react";

/** Locks page scroll while `locked` is true (mobile menu sheet). */
export const useLockBodyScroll = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [locked]);
};
