import Image from "next/image";

export type PhotoName = "peak" | "range" | "portal" | "own" | "vista" | "lake" | "hall";

/**
 * Short descriptions. The photos sit inside labelled or aria-hidden containers, so screen readers
 * never read these; they exist because search engines flag images with an empty alt.
 */
const ALT: Record<PhotoName, string> = {
  peak: "Snow-capped mountain peak",
  range: "Mountain range under a pale sky",
  portal: "Concrete architecture framing a mountain view",
  own: "Mountains at dusk",
  vista: "Open concrete hall with a curved ceiling and mountain view",
  lake: "Mountain lake with curved stone steps",
  hall: "Column corridor opening onto mountains",
};

/** "own" is already a dusk scene, so it has no separate dark crop. */
const hasDark = (name: PhotoName) => name !== "own";

/**
 * A decorative photo from the backdrop set (public/images/scenes/pic-*), with its dusk crop in the
 * dark theme. Both render; CSS (.pic--light / .pic--dark in pane.css) hides the inactive one, and
 * since next/image lazy-loads, the hidden one is never downloaded. Fills its positioned parent.
 */
export const ThemedPhoto = ({ name, sizes, small }: { name: PhotoName; sizes: string; small?: boolean }) => {
  const file = (variant: string) => `/images/scenes/pic-${name}${variant}${small ? "-900" : ""}.webp`;
  // Decorative art inside glass panes: quality 60 is visually identical at these sizes and ~20% lighter.
  if (!hasDark(name)) return <Image src={file("")} alt={ALT[name]} fill sizes={sizes} quality={60} />;
  return (
    <>
      <Image src={file("")} alt={ALT[name]} fill sizes={sizes} quality={60} className="pic--light" />
      <Image src={file("-dark")} alt={`${ALT[name]}, at dusk`} fill sizes={sizes} quality={60} className="pic--dark" />
    </>
  );
};
