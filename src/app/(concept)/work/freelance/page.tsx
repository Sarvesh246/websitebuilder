import Image from "next/image";
import { Bricolage_Grotesque, DM_Sans, Caveat } from "next/font/google";
import { ArrowUpRight, Compass, LayoutTemplate, Presentation, Sparkles } from "lucide-react";
import { ConceptFrame } from "@/components/concept/ConceptFrame";
import { BookCall } from "@/components/concept/freelance/BookCall";
import { pageMetadata } from "@/lib/seo";
import "./freelance.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--cx-display", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--cx-body", display: "swap" });
const hand = Caveat({ subsets: ["latin"], variable: "--cx-hand", display: "swap" });

export const metadata = pageMetadata({
  title: "Juno Park freelance concept",
  description:
    "A concept website for a fictional freelance brand designer and strategist, built by Northframe to show what a Presence package can look like.",
  path: "/work/freelance",
  index: false,
});

const WORDS = ["brands", "decks", "launches", "ideas"];

const SERVICES = [
  { icon: Compass, title: "Brand strategy", text: "Positioning, voice and the one sentence everyone can repeat.", tint: "lilac" },
  { icon: Sparkles, title: "Identity design", text: "Logos, type and colour that feel like you on a good day.", tint: "butter" },
  { icon: Presentation, title: "Pitch decks", text: "Stories that hold a room, built slide by slide.", tint: "coral" },
  { icon: LayoutTemplate, title: "Launch kits", text: "Everything a new thing needs to show up well in week one.", tint: "ink" },
] as const;

const PROJECTS = [
  {
    title: "Oat & Ember",
    tag: "Brand identity",
    text: "A small bakery found a warmer voice and a look that fits a chalkboard and a shopfront.",
    src: "/images/work/freelance/office.webp",
    alt: "Bright open studio with wood surfaces and plants",
    pos: "30% 50%",
    tint: "lilac",
  },
  {
    title: "Slow Sundays",
    tag: "Launch kit",
    text: "A newsletter went from idea to first issue with a name, a look and a welcome sequence.",
    src: "/images/work/freelance/workshop.webp",
    alt: "Team brainstorming with sticky notes on a whiteboard",
    pos: "50% 40%",
    tint: "butter",
  },
  {
    title: "Fieldnote Labs",
    tag: "Pitch deck",
    text: "A research startup turned dense findings into a deck that people could follow without a guide.",
    src: "/images/work/freelance/talk.webp",
    alt: "People around a conference table with laptops during a presentation",
    pos: "70% 50%",
    tint: "coral",
  },
  {
    title: "Pebble Studio",
    tag: "Brand strategy",
    text: "Three co-founders agreed on who the studio is for, and what it will happily say no to.",
    src: "/images/work/freelance/suit.webp",
    alt: "A founder in a grey blazer smiling by an office window",
    pos: "50% 30%",
    tint: "lilac",
  },
] as const;

const STEPS = [
  { n: "01", title: "Chat", text: "A short call about what you are making and who it is for." },
  { n: "02", title: "Sketch", text: "Rough ideas on the table early, so changes are cheap and honest." },
  { n: "03", title: "Ship", text: "Polished files, a tidy handover and a launch you feel good about." },
] as const;

export default function FreelanceConceptPage() {
  return (
    <ConceptFrame slug="freelance" className={`${display.variable} ${body.variable} ${hand.variable}`}>
      <header className="fl-nav">
        <a href="#top" className="fl-logo" aria-label="Juno Park, home">
          <span className="fl-logo__dot" aria-hidden />
          Juno Park
        </a>
        <nav className="fl-nav__links" aria-label="Concept sections">
          <a href="#work">Work</a>
          <a href="#services">What I do</a>
          <a href="#process">Process</a>
        </nav>
        <a href="#book" className="fl-pill fl-pill--ink fl-nav__cta">
          Book a call
        </a>
      </header>

      <section id="top" className="fl-hero">
        <span className="fl-blob fl-blob--a" aria-hidden />
        <span className="fl-blob fl-blob--b" aria-hidden />
        <div className="fl-hero__copy">
          <p className="fl-hello">Hi, I am Juno</p>
          <h1 className="fl-h1">
            I make{" "}
            <span className="fl-rotor" aria-hidden>
              {WORDS.map((w, i) => (
                <span key={w} className="fl-rotor__w" style={{ animationDelay: `${i * 2.5}s` }}>
                  {w}
                </span>
              ))}
            </span>
            <span className="fl-sr">brands, decks, launches and ideas</span>
            <br />
            people remember.
          </h1>
          <p className="fl-lead">
            Freelance brand designer and strategist helping small teams and solo makers look as good as their ideas
            sound.
          </p>
          <div className="fl-actions">
            <a href="#book" className="fl-pill fl-pill--ink">
              Book a call
            </a>
            <a href="#work" className="fl-pill fl-pill--ghost">
              See projects
            </a>
          </div>
          <p className="fl-note" aria-hidden>
            coffee chats welcome
          </p>
        </div>

        <div className="fl-hero__art">
          <div className="fl-portrait">
            <Image
              src="/images/work/freelance/portrait.webp"
              alt="Juno Park, a young woman with long brown hair in a striped top"
              width={1600}
              height={2397}
              sizes="(min-width: 900px) 420px, 80vw"
              priority
              className="fl-portrait__img"
            />
          </div>
          <span className="fl-sticker fl-sticker--open">
            <span className="fl-sticker__dot" aria-hidden />
            Open for projects
          </span>
          <svg className="fl-star" viewBox="0 0 100 100" aria-hidden>
            <path
              d="M50 4l11 27 29-3-21 20 14 26-27-10-26 10 14-26L10 28l29 3z"
              fill="#ffe36e"
              stroke="#1c1830"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
          <p className="fl-hand fl-hand--portrait" aria-hidden>
            that is me!
          </p>
        </div>
      </section>

      <section id="services" className="fl-sec">
        <div className="fl-sec__head">
          <p className="fl-eyebrow">What I do</p>
          <h2 className="fl-h2">Four things I do really well</h2>
        </div>
        <ul className="fl-services">
          {SERVICES.map((s, i) => (
            <li key={s.title} className={`fl-card fl-card--${s.tint} fl-card--t${i}`}>
              <span className="fl-card__icon">
                <s.icon aria-hidden size={24} strokeWidth={2} />
              </span>
              <h3 className="fl-card__title">{s.title}</h3>
              <p className="fl-card__text">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="work" className="fl-sec">
        <div className="fl-sec__head">
          <p className="fl-eyebrow">Selected projects</p>
          <h2 className="fl-h2">Recent things I made</h2>
          <p className="fl-hand" aria-hidden>
            (all imaginary, all lovingly designed)
          </p>
        </div>
        <ul className="fl-projects">
          {PROJECTS.map((p, i) => (
            <li key={p.title} className={`fl-proj fl-proj--${i}`}>
              <div className={`fl-proj__cover fl-proj__cover--${p.tint}`}>
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 900px) 40vw, 92vw"
                  className="fl-proj__img"
                  style={{ objectPosition: p.pos }}
                />
                <span className="fl-proj__tag">{p.tag}</span>
              </div>
              <div className="fl-proj__body">
                <h3 className="fl-proj__title">
                  {p.title}
                  <ArrowUpRight aria-hidden size={20} strokeWidth={2.2} />
                </h3>
                <p className="fl-proj__text">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="process" className="fl-sec">
        <div className="fl-sec__head">
          <p className="fl-eyebrow">How I work</p>
          <h2 className="fl-h2">Simple, friendly, no surprises</h2>
        </div>
        <ol className="fl-steps">
          {STEPS.map((s) => (
            <li key={s.n} className="fl-step">
              <span className="fl-step__n">{s.n}</span>
              <h3 className="fl-step__title">{s.title}</h3>
              <p className="fl-step__text">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="about" className="fl-sec fl-about">
        <div className="fl-about__photo">
          <Image
            src="/images/work/freelance/smile.webp"
            alt="Juno laughing in a red top"
            width={1600}
            height={2400}
            sizes="(min-width: 900px) 300px, 60vw"
            className="fl-about__img"
          />
        </div>
        <div className="fl-about__copy">
          <p className="fl-eyebrow">A little about me</p>
          <h2 className="fl-h2">Serious about the work, not about myself</h2>
          <p className="fl-lead">
            I work with one or two projects at a time so each gets real attention. Expect honest feedback, quick
            replies and a few bad puns.
          </p>
        </div>
      </section>

      <section id="book" className="fl-sec fl-bookwrap">
        <div className="fl-bookwrap__copy">
          <p className="fl-eyebrow">Book a call</p>
          <h2 className="fl-h2">Let us talk about your thing</h2>
          <p className="fl-lead">Twenty minutes, no pitch. Tell me what you are building and we will see if I can help.</p>
          <p className="fl-hand" aria-hidden>
            pick a slot, any slot
          </p>
        </div>
        <BookCall />
      </section>

      <footer className="fl-foot">
        <p className="fl-foot__big">Say hi, make something good.</p>
        <p className="fl-foot__small">
          Juno Park is a fictional designer created for this concept. Built by Northframe.
        </p>
        <span className="fl-foot__sticker" aria-hidden>
          made with love
        </span>
      </footer>
    </ConceptFrame>
  );
}
