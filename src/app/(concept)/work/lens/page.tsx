import Image from "next/image";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { ConceptFrame } from "@/components/concept/ConceptFrame";
import { Gallery } from "@/components/concept/lens/Gallery";
import { pageMetadata } from "@/lib/seo";
import "./lens.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--cx-display",
  display: "swap",
});
const sans = Jost({ subsets: ["latin"], variable: "--cx-sans", display: "swap" });

export const metadata = pageMetadata({
  title: "Oren Vale photography concept",
  description: "A dark, full-bleed photographer portfolio concept with a filterable gallery, lightbox and booking form, designed by Northframe.",
  path: "/work/lens",
  index: false,
});

const services = [
  { name: "Portraits", note: "Studio or on location, one hour to a full day." },
  { name: "Editorial", note: "Story-led commissions for print and web." },
  { name: "Prints", note: "Archival fine art prints, signed and numbered." },
];

export default function LensPage() {
  return (
    <ConceptFrame slug="lens" className={`${display.variable} ${sans.variable}`}>
      <header className="lens-nav">
        <a className="lens-nav__mark" href="#top">
          Oren Vale
        </a>
        <nav aria-label="Primary">
          <ul className="lens-nav__list">
            <li><a href="#work">Work</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#book">Book</a></li>
          </ul>
        </nav>
      </header>

      <section className="lens-hero" id="top" aria-label="Introduction">
        <div className="lens-hero__media">
          <Image
            className="lens-hero__img"
            src="/images/work/lens/alpine.webp"
            alt="Sunset light on jagged peaks above a still mountain lake"
            fill
            priority
            sizes="100vw"
            quality={75}
          />
        </div>
        <div className="lens-hero__copy">
          <p className="lens-label">Landscape &middot; Portrait &middot; Street</p>
          <h1 className="lens-hero__title">
            Oren <em>Vale</em>
          </h1>
        </div>
        <a className="lens-hero__scroll" href="#work">
          <span>Scroll</span>
          <span className="lens-hero__line" aria-hidden />
        </a>
      </section>

      <Gallery />

      <section className="lens-about" id="about" aria-labelledby="lens-about-t">
        <p className="lens-label">About</p>
        <h2 id="lens-about-t" className="lens-about__text">
          I wait for the <em>light</em>, then I wait a little longer.
        </h2>
        <p className="lens-about__sub">Based between the mountains and the city, shooting on assignment worldwide.</p>
      </section>

      <section className="lens-services" id="services" aria-labelledby="lens-services-t">
        <h2 id="lens-services-t" className="lens-label">Services</h2>
        <ul className="lens-services__list">
          {services.map((s) => (
            <li key={s.name} className="lens-services__row">
              <span className="lens-services__name">{s.name}</span>
              <span className="lens-services__note">{s.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="lens-book" id="book" aria-labelledby="lens-book-t">
        <div className="lens-book__head">
          <p className="lens-label">Book a session</p>
          <h2 id="lens-book-t" className="lens-book__title">
            Let&rsquo;s make <em>something</em> quiet.
          </h2>
        </div>
        <form className="lens-form" aria-label="Booking request (concept, not submitted)">
          <div className="lens-field">
            <label htmlFor="lens-name">Name</label>
            <input id="lens-name" name="name" type="text" autoComplete="off" />
          </div>
          <div className="lens-field">
            <label htmlFor="lens-date">Preferred date</label>
            <input id="lens-date" name="date" type="date" />
          </div>
          <div className="lens-field lens-field--wide">
            <label htmlFor="lens-brief">Brief</label>
            <textarea id="lens-brief" name="brief" rows={3} />
          </div>
          <button type="button" className="lens-form__send">
            Send request
          </button>
          <p className="lens-form__note">Concept form. Nothing is sent.</p>
        </form>
      </section>

      <footer className="lens-foot">
        <span>&copy; Oren Vale</span>
        <span>A Northframe concept. Fictional studio.</span>
      </footer>
    </ConceptFrame>
  );
}
