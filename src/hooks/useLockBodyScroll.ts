"use client";

import { useEffect } from "react";

let locks = 0;
let previousOverflow = "";

/** Locks page scroll while `locked` is true (mobile menu sheet). */
export const useLockBodyScroll = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    if (locks === 0) previousOverflow = root.style.overflow;
    locks += 1;
    root.style.overflow = "hidden";
    return () => {
      locks -= 1;
      if (locks === 0) root.style.overflow = previousOverflow;
    };
  }, [locked]);
};
