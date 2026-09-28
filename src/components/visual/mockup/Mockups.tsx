import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Device frames and the concept-site screens shown inside them. All decorative: consumers wrap
 * them in an aria-hidden / role="img" parent. Sizing is container-relative (see styles/mockup.css),
 * so a screen keeps its proportions at any width.
 */

export const BrowserMockup = ({ url, className, children }: { url: string; className?: string; children: ReactNode }) => (
  <div className={cn("mock", className)}>
    <div className="mock__bar">
      <span className="mock__dots">
        <i />
        <i />
        <i />
      </span>
      <span className="mock__url">{url}</span>
    </div>
    <div className="mock__screen">{children}</div>
  </div>
);

export const PhoneMockup = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("phone", className)}>
    <div className="phone__screen">{children}</div>
  </div>
);

/** Student portfolio: split hero with layered artwork and a project row. */
export const PortfolioScreen = () => (
  <div className="ms ms--portfolio">
    <div className="ms__nav">
      <b>nora.studio</b>
      <span className="ms__links">
        <i />
        <i />
        <i />
      </span>
    </div>
    <div className="ms__hero">
      <div className="ms__copy">
        <span className="ms__tag">Portfolio 2026</span>
        <p className="ms__h">Design that feels considered.</p>
        <span className="ms__line" />
        <span className="ms__line ms__line--short" />
        <span className="ms__btn">View projects</span>
      </div>
      <div className="ms__art">
        <i />
        <i />
        <i />
      </div>
    </div>
    <div className="ms__tiles">
      <i />
      <i />
      <i />
    </div>
  </div>
);

/** Small business: full-bleed visual with an overlaid headline. */
export const CafeScreen = () => (
  <div className="ms ms--cafe">
    <div className="ms__nav">
      <b>Alder Coffee</b>
      <span className="ms__links">
        <i />
        <i />
      </span>
    </div>
    <div className="ms__banner">
      <p className="ms__h">Roasted small, served fresh.</p>
      <span className="ms__btn">See the menu</span>
    </div>
    <div className="ms__tiles ms__tiles--two">
      <i />
      <i />
    </div>
  </div>
);

/** Creator link page, sized for the phone frame. */
export const CreatorScreen = () => (
  <div className="ms ms--creator">
    <span className="ms__avatar" />
    <b className="ms__name">kai.makes</b>
    <span className="ms__line ms__line--short" />
    <span className="ms__pill">New video</span>
    <span className="ms__pill">Shop</span>
    <span className="ms__pill">Newsletter</span>
    <div className="ms__tiles ms__tiles--grid">
      <i />
      <i />
      <i />
      <i />
    </div>
  </div>
);
