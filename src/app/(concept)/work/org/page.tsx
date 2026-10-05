import Image from "next/image";
import { Anton, Space_Grotesk } from "next/font/google";
import { ArrowUpRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { ConceptFrame } from "@/components/concept/ConceptFrame";
import { Schedule } from "@/components/concept/org/Schedule";
import { JoinForm } from "@/components/concept/org/JoinForm";
import { conceptMetadata } from "@/lib/seo";
import "./org.css";

const display = Anton({ subsets: ["latin"], weight: "400", variable: "--cx-display" });
const body = Space_Grotesk({ subsets: ["latin"], variable: "--cx-body" });

export const metadata = conceptMetadata("org");

const marqueeItems = ["Join the collective", "Spring showcase", "Three nights", "Live on campus", "Union Hall", "Bring a friend"];

const tiles = [
  { n: "01", title: "Throw loud nights", text: "Live showcases run by members, from soundcheck to the last encore.", img: "/images/work/org/phone.webp", alt: "Hands filming a live set on a phone under pink stage lights", pos: "50% 40%" },
  { n: "02", title: "Make things together", text: "Posters, zines and mural jams. Every flyer is made in the open studio.", img: "/images/work/org/workshop.webp", alt: "A team brainstorming with sticky notes on a table", pos: "50% 50%" },
  { n: "03", title: "Find your people", text: "Weekly hangs for writers, players, designers and the plain curious.", img: "/images/work/org/laptops.webp", alt: "Students laughing together around laptops at a table", pos: "40% 50%" },
];

const wall = [
  { src: "/images/work/org/confetti.webp", alt: "Confetti falling over a crowd in blue light", cap: "Last encore", rot: "-5deg" },
  { src: "/images/work/org/summit.webp", alt: "Friends sitting arm in arm facing mountains", cap: "Road trip", rot: "3deg" },
  { src: "/images/work/org/sunset.webp", alt: "Friends hugging on a hill at sunset", cap: "After hours", rot: "-2deg" },
  { src: "/images/work/org/grad.webp", alt: "A graduation cap seen from behind", cap: "Seniors", rot: "5deg" },
  { src: "/images/work/org/friends.webp", alt: "Friends studying together with books", cap: "Study jam", rot: "-4deg" },
  { src: "/images/work/org/crowd.webp", alt: "A crowd gathered outdoors under string lights in the evening", cap: "Quad night", rot: "2deg" },
];

const roles = [
  { n: "A", title: "Volunteer", text: "Set up, door crew, stage hands. You get the best view in the house." },
  { n: "B", title: "Perform", text: "Bands, poets, DJs, dancers. Sign up for an open slot or pitch a set." },
  { n: "C", title: "Design", text: "Posters, merch, visuals and the website. Bring a portfolio or just ideas." },
];

const faqs = [
  { q: "Do I need to be a student to come?", a: "Showcase nights are open to the campus community. Members get early entry and a say in the lineup." },
  { q: "Can I perform if I have never been on stage?", a: "Yes. The open mic is built for first sets. Pick the Perform role and we will find you a slot." },
  { q: "How do I become a member?", a: "Fill in the form above. A club officer replies with the next meeting time and what to bring." },
  { q: "Is the venue accessible?", a: "Union Hall has step-free entry and seating. Tell us what you need in your message and we will plan around it." },
  { q: "Does it cost anything to join?", a: "Joining is free. Some workshops ask members to bring their own supplies." },
];

const Join = ({ className = "" }: { className?: string }) => (
  <a href="#join" className={`org-btn org-btn--green ${className}`}>
    Join the club
    <ArrowUpRight aria-hidden size={20} strokeWidth={2.4} />
  </a>
);

export default function OrgConcept() {
  const marquee = (hidden: boolean) => (
    <ul className="org-marquee__group" aria-hidden={hidden || undefined}>
      {marqueeItems.map((m) => (
        <li key={m}>
          <span>{m}</span>
          <i aria-hidden>✺</i>
        </li>
      ))}
    </ul>
  );

  return (
    <ConceptFrame slug="org" className={`${display.variable} ${body.variable}`}>
      <header className="org-head">
        <a href="#top" className="org-logo">
          SURGE<span>/</span>COLLECTIVE
        </a>
        <nav aria-label="Concept site" className="org-nav">
          <a href="#schedule">Schedule</a>
          <a href="#about">What we do</a>
          <a href="#wall">Wall</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a href="#join" className="org-head__cta">
          Join the club
        </a>
      </header>

      <section id="top" className="org-hero" aria-labelledby="org-h1">
        <div className="org-hero__bg" aria-hidden>
          <Image src="/images/work/org/concert.webp" alt="" fill priority sizes="100vw" />
        </div>
        <div className="org-hero__inner">
          <p className="org-kicker">Spring showcase / April 17 to 19</p>
          <h1 id="org-h1" className="org-hero__title">
            <span className="org-hero__word">SURGE</span>
            <span className="org-hero__num">26</span>
          </h1>
          <p className="org-hero__lead">
            Three nights of live music, loud art and good company, run by the students of Surge Collective.
          </p>
          <div className="org-hero__actions">
            <Join />
            <a href="#schedule" className="org-btn org-btn--ghost">
              See the lineup
            </a>
          </div>
        </div>
      </section>

      <div className="org-marquee">
        <div className="org-marquee__track">
          {marquee(false)}
          {marquee(true)}
        </div>
      </div>

      <section className="org-bar" aria-label="Event details">
        <div className="org-bar__item">
          <CalendarDays aria-hidden size={26} strokeWidth={2} />
          <p>
            <b>Date</b>
            Fri to Sun, April 17 to 19
          </p>
        </div>
        <div className="org-bar__item">
          <Clock aria-hidden size={26} strokeWidth={2} />
          <p>
            <b>Doors</b>
            6:00 PM each night
          </p>
        </div>
        <div className="org-bar__item">
          <MapPin aria-hidden size={26} strokeWidth={2} />
          <p>
            <b>Place</b>
            Union Hall, Main Quad
          </p>
        </div>
      </section>

      <section id="schedule" className="org-sec org-schedule" aria-labelledby="org-sch-h">
        <div className="org-sec__head">
          <p className="org-kicker">The lineup</p>
          <h2 id="org-sch-h" className="org-h2">
            Three nights.<br />One stage.
          </h2>
        </div>
        <Schedule />
      </section>

      <section id="about" className="org-sec org-about" aria-labelledby="org-about-h">
        <div className="org-sec__head">
          <p className="org-kicker">What we do</p>
          <h2 id="org-about-h" className="org-h2">
            Loud on purpose.
          </h2>
        </div>
        <ul className="org-tiles">
          {tiles.map((t) => (
            <li key={t.n} className="org-tile">
              <div className="org-tile__img">
                <Image src={t.img} alt={t.alt} fill sizes="(min-width: 900px) 33vw, 100vw" style={{ objectPosition: t.pos }} />
              </div>
              <span className="org-tile__n" aria-hidden>
                {t.n}
              </span>
              <h3 className="org-tile__title">{t.title}</h3>
              <p className="org-tile__text">{t.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="wall" className="org-sec org-wall" aria-labelledby="org-wall-h">
        <div className="org-sec__head">
          <p className="org-kicker">The wall</p>
          <h2 id="org-wall-h" className="org-h2">
            Pin it up.
          </h2>
        </div>
        <ul className="org-wall__grid">
          {wall.map((w) => (
            <li key={w.src} className="org-polaroid" style={{ ["--rot" as string]: w.rot }}>
              <figure>
                <div className="org-polaroid__img">
                  <Image src={w.src} alt={w.alt} fill sizes="(min-width: 900px) 30vw, (min-width: 560px) 45vw, 90vw" />
                </div>
                <figcaption>{w.cap}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <section id="join" className="org-sec org-join" aria-labelledby="org-join-h">
        <div className="org-join__copy">
          <p className="org-kicker">Get involved</p>
          <h2 id="org-join-h" className="org-h2">
            Your name<br />on the bill.
          </h2>
          <ul className="org-roles-list">
            {roles.map((r) => (
              <li key={r.title}>
                <span className="org-roles-list__n" aria-hidden>
                  {r.n}
                </span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <JoinForm />
      </section>

      <section id="faq" className="org-sec org-faq" aria-labelledby="org-faq-h">
        <div className="org-sec__head">
          <p className="org-kicker">Questions</p>
          <h2 id="org-faq-h" className="org-h2">
            Good to know.
          </h2>
        </div>
        <div className="org-faq__list">
          {faqs.map((f) => (
            <details key={f.q} className="org-qa">
              <summary>
                <span>{f.q}</span>
                <i aria-hidden />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="org-foot">
        <p className="org-foot__big" aria-hidden>
          SURGE 26
        </p>
        <div className="org-foot__row">
          <p>Surge Collective is a fictional campus club made for this concept. Union Hall is not a real venue.</p>
          <Join className="org-foot__btn" />
        </div>
      </footer>
    </ConceptFrame>
  );
}
