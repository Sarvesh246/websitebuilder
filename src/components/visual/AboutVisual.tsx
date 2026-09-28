import { BrowserMockup, PortfolioScreen } from "@/components/visual/mockup/Mockups";
import { about } from "@/config/about";

/**
 * About composition: a browser concept set inside an architectural frame (the logo's corner
 * motif, scaled up). Purely decorative and CSS-built; real artwork can replace it later without
 * changing the box. No founder photo: none exists or is approved.
 */
export const AboutVisual = () => (
  <figure className="about-visual" role="img" aria-label={about.visualLabel}>
    <span aria-hidden className="about-visual__frame" />
    <span aria-hidden className="about-visual__rule about-visual__rule--v" />
    <span aria-hidden className="about-visual__rule about-visual__rule--h" />
    <BrowserMockup url="nora.studio" className="about-visual__browser">
      <PortfolioScreen />
    </BrowserMockup>
    <span aria-hidden className="about-visual__chip glass-elevated">
      <b>Aa</b>
      <i />
      <i />
      <i />
    </span>
    <span aria-hidden className="about-visual__code glass">
      {"<Hero />"}
    </span>
    <span aria-hidden className="about-visual__caption badge badge--neutral">
      {about.visualCaption}
    </span>
  </figure>
);
