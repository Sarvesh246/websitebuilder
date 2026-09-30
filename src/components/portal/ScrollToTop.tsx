"use client";

import { useEffect } from "react";

/**
 * Overview always opens at the top. Browsers restore the previous scroll offset on refresh (and can
 * carry one over from the sign-in page), which left the page starting part-way down. Restoration is
 * switched to manual only while this page is mounted, so back/forward on other pages still behaves.
 */
export const ScrollToTop = () => {
  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);
  return null;
};
