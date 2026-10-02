import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ThemedPhoto, type PhotoName } from "@/components/visual/ThemedPhoto";

/**
 * Concept website screens shown inside glass panes. Decorative artwork (no client work): the
 * nearest labelled ancestor describes them. Photos are crops of the backdrop photography.
 */

type Photo = PhotoName;

const Photo = ({ src, sizes = "30vw", className }: { src: Photo; sizes?: string; className?: string }) => (
  <div className={className ?? "scr__img"}>
    <ThemedPhoto name={src} sizes={sizes} />
  </div>
);

const Nav = ({ burger }: { burger?: boolean }) => (
  <div className="scr__nav">
    <b>Northframe</b>
    {burger ? (
      <i className="scr__burger" style={{ marginLeft: "auto" }} />
    ) : (
      <span>
        <em>Services</em>
        <em>Process</em>
        <em>About</em>
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
        <p className="scr__h">Ideas deserve better websites.</p>
        <p className="scr__p">Strategic design for a more ambitious web.</p>
        <span className="scr__link" style={{ marginTop: "auto", paddingBottom: "2.4em" }}>
          Explore <ArrowRight size="1.2em" strokeWidth={1.6} />
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
      <p className="scr__h">{title}</p>
      <span className="scr__rule" />
    </div>
  </div>
);

export const ScreenTall = ({ title = "Built for what's next.", photo = "range" }: { title?: string; photo?: Photo }) => (
  <div className="scr scr--tall">
    <Nav burger />
    <div className="scr__copy">
      <p className="scr__h">{title}</p>
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
        <p className="scr__h">Purposeful websites for what&apos;s next.</p>
        <p className="scr__p">Designed and built for creators, student organizations, and small businesses.</p>
        <span className="scr__btn">
          Start a Project <ArrowUpRight size="1.2em" strokeWidth={1.6} />
        </span>
      </div>
      <Photo src={photo} sizes="35vw" />
    </div>
    <div className="scr__strip">
      <div>
        Strategy<small>A clear foundation</small>
      </div>
      <div>
        Design<small>Thoughtful and refined</small>
      </div>
      <div>
        Development<small>Built for growth</small>
      </div>
    </div>
  </div>
);

export const ScreenWire = () => (
  <div className="scr scr--wire">
    <div className="scr__nav">
      <b>Northframe</b>
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
      <div className="scr__tree">
        <b>▾ northframe</b>
        <br />› app
        <br />› components
        <br />› pages
        <br />› styles
        <br />› utils
      </div>
      <div className="scr__src">
        <span className="k">export default function</span> <span className="f">Home</span>() {"{"}
        {"\n  "}
        <span className="k">return</span> (
        {"\n    "}
        <span className="t">&lt;main&gt;</span>
        {"\n      "}
        <span className="t">&lt;Hero /&gt;</span>
        {"\n      "}
        <span className="t">&lt;Features /&gt;</span>
        {"\n      "}
        <span className="t">&lt;Process /&gt;</span>
        {"\n      "}
        <span className="t">&lt;Footer /&gt;</span>
        {"\n    "}
        <span className="t">&lt;/main&gt;</span>
        {"\n  "});{"\n"}
        {"}"}
      </div>
    </div>
  </div>
);
