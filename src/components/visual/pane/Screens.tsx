import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ThemedPhoto, type PhotoName } from "@/components/visual/ThemedPhoto";

/**
 * Concept website screens shown inside glass panes. Decorative artwork (no client work): the
 * nearest labelled ancestor describes them. Photos are crops of the backdrop photography.
 * Their words are drawn from `data-t` by CSS (pane.css), not written as text nodes, so search engines
 * and AI extractors read the page's real copy instead of repeated mockup slogans.
 */

/** Decorative text: rendered by `[data-t]::before`, absent from the document text. */
const t = (text: string) => ({ "data-t": text });

type Photo = PhotoName;

const Photo = ({ src, sizes = "30vw", className }: { src: Photo; sizes?: string; className?: string }) => (
  <div className={className ?? "scr__img"}>
    <ThemedPhoto name={src} sizes={sizes} />
  </div>
);

const Nav = ({ burger }: { burger?: boolean }) => (
  <div className="scr__nav">
    <b {...t("Northframe")} />
    {burger ? (
      <i className="scr__burger" style={{ marginLeft: "auto" }} />
    ) : (
      <span>
        <em {...t("Services")} />
        <em {...t("Process")} />
        <em {...t("About")} />
        <i className="scr__burger" />
      </span>
    )}
  </div>
);

export const ScreenIdeas = ({ photo = "portal" }: { photo?: Photo }) => (
  <div className="scr scr--split">
    <Nav />
    <div className="scr__body">
      <div className="scr__copy">
        <p className="scr__h" {...t("Ideas deserve better websites.")} />
        <p className="scr__p" {...t("Strategic design for a more ambitious web.")} />
        <span className="scr__link" style={{ marginTop: "auto", paddingBottom: "2.4em" }} {...t("Explore ")}>
          <ArrowRight size="1.2em" strokeWidth={1.6} />
        </span>
      </div>
      <Photo src={photo} />
    </div>
  </div>
);

export const ScreenPhoto = ({ title, photo = "peak", burger }: { title: string; photo?: Photo; burger?: boolean }) => (
  <div className="scr scr--photo">
    <Photo src={photo} sizes="40vw" />
    <Nav burger={burger} />
    <div className="scr__copy">
      <p className="scr__h" {...t(title)} />
      <span className="scr__rule" />
    </div>
  </div>
);

export const ScreenTall = ({ title = "Built for what's next.", photo = "range" }: { title?: string; photo?: Photo }) => (
  <div className="scr scr--tall">
    <Nav burger />
    <div className="scr__copy">
      <p className="scr__h" {...t(title)} />
      <span className="scr__rule" />
    </div>
    <Photo src={photo} sizes="20vw" />
  </div>
);

export const ScreenPage = ({ photo = "portal" }: { photo?: Photo }) => (
  <div className="scr scr--page">
    <Nav />
    <div className="scr__body">
      <div className="scr__copy">
        <p className="scr__h" {...t("Purposeful websites for what's next.")} />
        <p className="scr__p" {...t("Designed and built for creators, student organizations, and small businesses.")} />
        <span className="scr__btn" {...t("Start a Project ")}>
          <ArrowUpRight size="1.2em" strokeWidth={1.6} />
        </span>
      </div>
      <Photo src={photo} sizes="35vw" />
    </div>
    <div className="scr__strip">
      <div {...t("Strategy")}>
        <small {...t("A clear foundation")} />
      </div>
      <div {...t("Design")}>
        <small {...t("Thoughtful and refined")} />
      </div>
      <div {...t("Development")}>
        <small {...t("Built for growth")} />
      </div>
    </div>
  </div>
);

export const ScreenWire = () => (
  <div className="scr scr--wire">
    <div className="scr__nav">
      <b {...t("Northframe")} />
      <span className="scr__navbars">
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
    <div className="scr__body">
      <div className="scr__bars">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="scr__x" />
      <div className="scr__tiles">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  </div>
);

export const ScreenCode = () => (
  <div className="scr scr--code">
    <div className="scr__dots">
      <i />
      <i />
      <i />
    </div>
    <div className="scr__body">
      <div className="scr__tree" {...t("▾ northframe\n› app\n› components\n› pages\n› styles\n› utils")} />
      <div className="scr__src">
        <span className="k" {...t("export default function")} /> <span className="f" {...t("Home")} />
        <span {...t("() {\n  ")} />
        <span className="k" {...t("return")} />
        <span {...t(" (\n    ")} />
        <span className="t" {...t("<main>\n      <Hero />\n      <Features />\n      <Process />\n      <Footer />\n    </main>")} />
        <span {...t("\n  );\n}")} />
      </div>
    </div>
  </div>
);
