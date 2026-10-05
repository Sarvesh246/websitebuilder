import Image from "next/image";
import { Fraunces, Karla } from "next/font/google";
import { ConceptFrame } from "@/components/concept/ConceptFrame";
import { MenuTabs } from "@/components/concept/cafe/MenuTabs";
import { OpenNow } from "@/components/concept/cafe/OpenNow";
import { Reveal } from "@/components/concept/cafe/Reveal";
import { pageMetadata } from "@/lib/seo";
import "./cafe.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--cx-display",
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});
const sans = Karla({ subsets: ["latin"], variable: "--cx-sans", display: "swap" });

export const metadata = pageMetadata({
  title: "Marlow & Finch cafe concept",
  description:
    "A concept website for a fictional neighbourhood cafe and bakery, designed and built by Northframe as a Business package example.",
  path: "/work/cafe",
  index: false,
});

const HOURS = [
  ["Monday to Friday", "7am to 6pm"],
  ["Saturday and Sunday", "8am to 5pm"],
];

export default function CafePage() {
  return (
    <ConceptFrame slug="cafe" className={`${display.variable} ${sans.variable}`}>
      <header className="cafe-nav">
        <div className="cafe-nav__in">
          <a href="#top" className="cafe-logo">
            <svg aria-hidden viewBox="0 0 32 32" width="28" height="28">
              <path d="M5 28V15a11 11 0 0 1 22 0v13" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M10 28V16a6 6 0 0 1 12 0v12" fill="var(--cx-terra)" />
            </svg>
            <span>Marlow &amp; Finch</span>
          </a>
          <nav aria-label="Marlow and Finch" className="cafe-nav__links">
            <a href="#menu">Menu</a>
            <a href="#hours">Hours</a>
            <a href="#visit">Visit</a>
          </nav>
          <a href="#visit" className="cafe-btn cafe-btn--sm">Order ahead</a>
        </div>
      </header>

      <section id="top" className="cafe-hero">
        <div className="cafe-hero__copy">
          <p className="cafe-eyebrow">Cafe and bakery on Alder Street</p>
          <h1 className="cafe-h1">
            Warm bread, <em>slow</em> coffee, a seat by the window.
          </h1>
          <p className="cafe-hero__lead">
            Marlow &amp; Finch bakes every morning and pours every cup by hand. Stay a while, or grab something warm for the walk.
          </p>
          <div className="cafe-hero__cta">
            <a href="#visit" className="cafe-btn">Order ahead</a>
            <a href="#menu" className="cafe-link">See the menu</a>
          </div>
          <p className="cafe-script" aria-hidden>
            come as you are, stay for the second cup
          </p>
        </div>
        <div className="cafe-hero__art">
          <div className="cafe-arch">
            <Image src="/images/work/cafe/table.webp" alt="A sunny cafe table by the window with a french press, cups and plants" fill priority sizes="(min-width: 900px) 46vw, 92vw" />
          </div>
          <svg className="cafe-steam" aria-hidden viewBox="0 0 40 60" width="40" height="60">
            <path d="M12 56c-6-10 6-14 0-24s6-14 0-24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M28 56c-6-10 6-14 0-24s6-14 0-24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="cafe-sticker" aria-hidden>
            <span>Baked</span>
            <span>daily</span>
          </div>
        </div>
      </section>

      <section className="cafe-today" aria-label="Today">
        <div className="cafe-today__in">
          <OpenNow />
          <p className="cafe-today__item">Fresh bread out at 8am</p>
          <p className="cafe-today__item">Dogs welcome on the terrace</p>
          <p className="cafe-today__item">Order ahead, skip the line</p>
        </div>
      </section>

      <section id="menu" className="cafe-sec cafe-menu-sec">
        <div className="cafe-wrap cafe-menu-grid">
          <Reveal className="cafe-menu-side">
            <p className="cafe-eyebrow">The menu</p>
            <h2 className="cafe-h2">Simple things, made properly.</h2>
            <p className="cafe-body">A short menu that changes with the season and with what the oven allows.</p>
            <div className="cafe-menu-photo">
              <Image src="/images/work/cafe/latte.webp" alt="Two latte art cups decorated with leaves" fill sizes="(min-width: 900px) 30vw, 70vw" />
            </div>
          </Reveal>
          <Reveal className="cafe-menu-main" delay={80}>
            <MenuTabs />
          </Reveal>
        </div>
      </section>

      <section className="cafe-sec cafe-mosaic-sec" aria-label="Photo gallery">
        <div className="cafe-wrap">
          <Reveal>
            <p className="cafe-eyebrow">In the shop</p>
            <h2 className="cafe-h2">Made in small batches, shared at big tables.</h2>
          </Reveal>
          <Reveal className="cafe-mosaic" delay={60}>
            <figure className="m m-a">
              <Image src="/images/work/cafe/pour.webp" alt="A barista setting up a pour-over coffee" fill sizes="(min-width: 900px) 36vw, 92vw" />
            </figure>
            <figure className="m m-b">
              <Image src="/images/work/cafe/pastry.webp" alt="Fruit tarts lined up on a white surface, seen from above" fill sizes="(min-width: 900px) 22vw, 46vw" />
            </figure>
            <figure className="m m-c">
              <Image src="/images/work/cafe/bread.webp" alt="Rustic sourdough loaves with wheat stalks" fill sizes="(min-width: 900px) 30vw, 92vw" />
            </figure>
            <figure className="m m-d">
              <Image src="/images/work/cafe/cheers.webp" alt="Two people clinking latte cups, seen from above" fill sizes="(min-width: 900px) 30vw, 92vw" />
            </figure>
            <figure className="m m-e">
              <Image src="/images/work/cafe/interior.webp" alt="Cafe interior with plants and wooden tables" fill sizes="(min-width: 900px) 30vw, 92vw" />
            </figure>
            <figure className="m m-f">
              <Image src="/images/work/cafe/beans.webp" alt="Close up of roasted coffee beans" fill sizes="(min-width: 900px) 20vw, 46vw" />
            </figure>
          </Reveal>
        </div>
      </section>

      <section id="visit" className="cafe-sec cafe-visit-sec">
        <div className="cafe-wrap">
          <Reveal className="cafe-visit">
            <div className="cafe-visit__info">
              <p className="cafe-eyebrow cafe-eyebrow--light">Visit us</p>
              <h2 className="cafe-h2">Find us on Alder Street.</h2>
              <address className="cafe-address">
                214 Alder Street
                <br />
                Your neighbourhood
              </address>
              <div id="hours" className="cafe-hours">
                <h3 className="cafe-h3">Hours</h3>
                <table>
                  <caption className="cafe-sr">Opening hours</caption>
                  <tbody>
                    {HOURS.map(([d, h]) => (
                      <tr key={d}>
                        <th scope="row">{d}</th>
                        <td>{h}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cafe-visit__cta">
                <a href="#visit" className="cafe-btn cafe-btn--light">Order ahead</a>
                <a href="#visit" className="cafe-link cafe-link--light">Call the cafe</a>
                <a href="#visit" className="cafe-link cafe-link--light">Email us</a>
              </div>
            </div>
            <div className="cafe-map" role="img" aria-label="Stylised map showing the cafe on Alder Street">
              <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden>
                <rect width="400" height="320" fill="#efe3d0" />
                <path d="M0 210h400M0 110h400" stroke="#fbf6ed" strokeWidth="26" />
                <path d="M120 0v320M290 0v320" stroke="#fbf6ed" strokeWidth="20" />
                <path d="M0 160 L400 120" stroke="#fbf6ed" strokeWidth="12" />
                <rect x="140" y="130" width="130" height="60" rx="10" fill="#8a9a7b" opacity=".55" />
                <rect x="20" y="20" width="80" height="70" rx="10" fill="#e2d2b9" />
                <rect x="310" y="20" width="70" height="70" rx="10" fill="#e2d2b9" />
                <rect x="20" y="230" width="80" height="70" rx="10" fill="#e2d2b9" />
                <rect x="140" y="230" width="130" height="70" rx="10" fill="#e2d2b9" />
                <rect x="310" y="230" width="70" height="70" rx="10" fill="#e2d2b9" />
                <text x="130" y="206" fontSize="11" fill="#6b5543" letterSpacing="2">ALDER STREET</text>
                <g transform="translate(205 118)">
                  <path d="M0 0c-14-18-20-26-20-36a20 20 0 0 1 40 0c0 10-6 18-20 36z" fill="#c9672f" />
                  <circle cy="-36" r="8" fill="#f6efe4" />
                </g>
              </svg>
              <p className="cafe-map__tag">Marlow &amp; Finch</p>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="cafe-foot">
        <div className="cafe-wrap cafe-foot__in">
          <div className="cafe-foot__brand">
            <p className="cafe-foot__logo">Marlow &amp; Finch</p>
            <p>Cafe and bakery, 214 Alder Street.</p>
          </div>
          <nav aria-label="Footer" className="cafe-foot__nav">
            <a href="#menu">Menu</a>
            <a href="#hours">Hours</a>
            <a href="#visit">Visit</a>
          </nav>
          <a href="#visit" className="cafe-btn cafe-btn--light">Order ahead</a>
        </div>
        <p className="cafe-foot__fine">A concept website. Marlow &amp; Finch is a fictional cafe.</p>
      </footer>
    </ConceptFrame>
  );
}
