import { createAvatar } from "@dicebear/core";
import * as shapes from "@dicebear/shapes";

/**
 * Generated profile avatar (DiceBear "shapes": abstract, no faces). Rendered locally by the
 * library: no network request, no third-party host, and nothing about the user leaves the server.
 * The seed is the opaque account id, never the name or email. The result is a data URI used only
 * as a CSS background image, so the SVG can never run script.
 */
const palette = {
  backgroundColor: ["dbe6f2", "c9d9ea", "e3e8ee", "d3dde8"],
  shape1Color: ["2f4a6b", "46688f", "5f81a8"],
  shape2Color: ["8fa9c5", "a9bdd3", "6f8fb0"],
  shape3Color: ["f5f4f1", "dbe6f2", "ffffff"],
};

const cache = new Map<string, string>();

export const avatarDataUri = (seed: string): string | null => {
  const hit = cache.get(seed);
  if (hit) return hit;
  try {
    const uri = createAvatar(shapes, { seed, size: 72, radius: 50, ...palette }).toDataUri();
    if (cache.size > 200) cache.clear();
    cache.set(seed, uri);
    return uri;
  } catch {
    return null;
  }
};
