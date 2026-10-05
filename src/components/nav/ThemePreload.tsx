"use client";

import { useEffect } from "react";
import { preloadOtherTheme } from "@/lib/preloadTheme";

/** Fetches the other theme's art once the page has loaded and the browser is idle. */
export const ThemePreload = () => {
  useEffect(() => {
    let timer: number | undefined;
    const run = () => {
      timer = window.setTimeout(() => {
        if ("requestIdleCallback" in window) window.requestIdleCallback(preloadOtherTheme, { timeout: 4000 });
        else preloadOtherTheme();
      }, 1500);
    };
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
    return () => {
      window.removeEventListener("load", run);
      window.clearTimeout(timer);
    };
  }, []);
  return null;
};
