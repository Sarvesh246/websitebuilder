import Image from "next/image";

export type PhotoName = "peak" | "range" | "portal" | "own" | "vista" | "lake" | "hall";

/** "own" is already a dusk scene, so it has no separate dark crop. */
const hasDark = (name: PhotoName) => name !== "own";

/**
 * A decorative photo from the backdrop set (public/images/scenes/pic-*), with its dusk crop in the
 * dark theme. Both render; CSS (.pic--light / .pic--dark in pane.css) hides the inactive one, and
 * since next/image lazy-loads, the hidden one is never downloaded. Fills its positioned parent.
 */
export const ThemedPhoto = ({ name, sizes, small }: { name: PhotoName; sizes: string; small?: boolean }) => {
  const file = (variant: string) => `/images/scenes/pic-${name}${variant}${small ? "-900" : ""}.webp`;
  if (!hasDark(name)) return <Image src={file("")} alt="" fill sizes={sizes} />;
  return (
    <>
      <Image src={file("")} alt="" fill sizes={sizes} className="pic--light" />
      <Image src={file("-dark")} alt="" fill sizes={sizes} className="pic--dark" />
    </>
  );
};
