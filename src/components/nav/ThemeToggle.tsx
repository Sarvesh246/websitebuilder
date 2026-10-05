"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { preloadOtherTheme } from "@/lib/preloadTheme";

type Theme = "light" | "dark";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};
const getSnapshot = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const getServerSnapshot = (): Theme => "light";

export const ThemeToggle = () => {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = () => {
    const root = document.documentElement;
    root.dataset.theme = next;
    try {
      localStorage.setItem("nf-theme", next);
    } catch {
      /* storage blocked: theme still applies for this visit */
    }
  };

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      onPointerEnter={preloadOtherTheme}
      onFocus={preloadOtherTheme}
      aria-label={`Switch to ${next} theme`}>
      {/* Both icons render; CSS shows the one for the active theme, so there is no flash. */}
      <Sun aria-hidden size={20} strokeWidth={1.6} className="theme-icon theme-icon--sun" />
      <Moon aria-hidden size={20} strokeWidth={1.6} className="theme-icon theme-icon--moon" />
    </button>
  );
};
