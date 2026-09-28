import Image from "next/image";

type SceneImageProps = {
  /** Path under /public, e.g. "/images/scenes/hero-light.webp". */
  light: string;
  /** Optional dark-theme variant. Falls back to `light` when omitted. */
  dark?: string;
  /** Decorative by default. Give real alt text only when the image carries meaning. */
  alt?: string;
  /** Only the single LCP image on a page. */
  priority?: boolean;
  sizes?: string;
  /** Re-frame the crop on small screens, e.g. "70% 50%". */
  objectPosition?: string;
};

/**
 * Full-bleed scene artwork (rendered glass panels, landscapes) behind a section.
 * Fills its positioned parent. Theme variants swap via CSS (no JS, no hydration flicker).
 * See public/images/README.md for asset naming, sizes, and formats.
 */
export const SceneImage = ({
  light,
  dark,
  alt = "",
  priority,
  sizes = "100vw",
  objectPosition,
}: SceneImageProps) => (
  <div className="scene">
    <Image
      src={light}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className="scene__light"
      style={{ objectPosition }}
    />
    {dark && (
      <Image
        src={dark}
        alt={alt}
        fill
        sizes={sizes}
        className="scene__dark"
        style={{ objectPosition }}
      />
    )}
  </div>
);
