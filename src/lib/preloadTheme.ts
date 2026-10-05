const done = new Set<string>();

const skip = () => {
  const root = document.documentElement;
  return root.dataset.net === "slow" || root.dataset.power === "low";
};

/**
 * Warms the cache with the inactive theme's art so the first switch doesn't wait on the network:
 * the CSS backdrops (read from each plate's --plate-l/--plate-d) and the hidden next/image photos
 * (flipped from lazy to eager, which fetches the exact optimised URL the other theme will use).
 * Idempotent; skipped on slow connections, Save-Data and low-power devices.
 */
export const preloadOtherTheme = () => {
  if (skip()) return;
  const root = document.documentElement;
  const other = root.dataset.theme === "dark" ? "light" : "dark";

  document.querySelectorAll<HTMLElement>(".plate").forEach((plate) => {
    const value = getComputedStyle(plate).getPropertyValue(other === "dark" ? "--plate-d" : "--plate-l");
    const url = /url\(["']?([^"')]+)["']?\)/.exec(value)?.[1];
    if (!url || done.has(url)) return;
    done.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  });

  document.querySelectorAll<HTMLImageElement>(`img.pic--${other}`).forEach((img) => {
    if (img.loading === "lazy") img.loading = "eager";
  });
};
