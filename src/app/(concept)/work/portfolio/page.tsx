import Image from "next/image";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ConceptFrame } from "@/components/concept/ConceptFrame";
import { ProjectList, type Project } from "@/components/concept/portfolio/ProjectList";
import { conceptMetadata } from "@/lib/seo";
import "./portfolio.css";

export const metadata = conceptMetadata("portfolio");

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--cx-display",
  display: "swap",
});
const sans = DM_Sans({ subsets: ["latin"], variable: "--cx-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--cx-mono", display: "swap" });

const projects: Project[] = [
  {
    n: "01",
    title: "Tidepool",
    kind: "Campus bike-share app",
    year: "2026",
    blurb: "Research, interface and a React Native prototype for sharing bikes across a small campus.",
    img: "/images/work/portfolio/laptop.webp",
    alt: "A laptop on a bright white desk showing an app interface",
    w: 1400,
    h: 934,
  },
  {
    n: "02",
    title: "Fieldnotes",
    kind: "Zine archive",
    year: "2025",
    blurb: "A searchable home for a student zine collective, set in a reading-first editorial layout.",
    img: "/images/work/portfolio/desk.webp",
    alt: "Top-down view of a desk with a notebook and a coffee",
    w: 1400,
    h: 934,
  },
  {
    n: "03",
    title: "Quiet Hours",
    kind: "Focus timer, web",
    year: "2025",
    blurb: "A small timer for study sessions with soft sound, no streaks and no notifications.",
    img: "/images/work/portfolio/dark.webp",
    alt: "A dark laptop screen glowing in a dim room",
    w: 1400,
    h: 991,
  },
  {
    n: "04",
    title: "Type Specimen Kit",
    kind: "Open-source component set",
    year: "2024",
    blurb: "Typed React components for showing off a typeface, with tokens and a short writing guide.",
    img: "/images/work/portfolio/code.webp",
    alt: "A laptop showing lines of code in an editor",
    w: 1400,
    h: 932,
  },
];

const skills = [
  "Interface design",
  "React",
  "TypeScript",
  "Design systems",
  "Typography",
  "Prototyping",
  "Accessibility",
  "Next.js",
  "User research",
  "Motion",
];

const education = [
  { when: "2022 to 2026", what: "BA, Interaction Design", where: "Fictional State University", note: "Final year. Thesis on calm interfaces for study tools." },
  { when: "Summer 2025", what: "Design engineering intern", where: "A small product studio", note: "Built and shipped interface components with a team of four." },
  { when: "2024 to now", what: "Design lead, student paper", where: "Campus newsroom", note: "Redesigned the site and mentored two new designers." },
];

const toolbox = [
  { head: "Design", items: ["Figma", "Type pairing", "Layout and grids", "Prototyping"] },
  { head: "Build", items: ["React and Next.js", "TypeScript", "CSS and motion", "Accessibility checks"] },
  { head: "Working style", items: ["Plain language", "Small, frequent updates", "Notes before pixels"] },
];

const Line = ({ children, i }: { children: React.ReactNode; i: number }) => (
  <span className="pf-line">
    <span className="pf-rise" style={{ "--i": i } as React.CSSProperties}>
      {children}
    </span>
  </span>
);

export default function PortfolioConcept() {
  return (
    <ConceptFrame slug="portfolio" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <div className="pf">
        <header className="pf-head">
          <a href="#top" className="pf-logo">
            Ines Calder
          </a>
          <nav aria-label="Portfolio sections" className="pf-nav">
            <a href="#work">Work</a>
            <a href="#about">About</a>
            <a href="#resume">Resume</a>
            <a href="#contact" className="pf-nav__cta">
              Say hello
            </a>
          </nav>
        </header>

        <section id="top" className="pf-hero" aria-labelledby="pf-title">
          <p className="pf-meta pf-fade" style={{ "--i": 0 } as React.CSSProperties}>
            <span>Portfolio</span>
            <span>2026</span>
            <span>Design and frontend</span>
          </p>
          <h1 id="pf-title" className="pf-title">
            <Line i={1}>Interfaces</Line>
            <Line i={2}>
              <em>with</em> a calm
            </Line>
            <Line i={3}>
              <span className="pf-title__out">point of view.</span>
            </Line>
          </h1>
          <div className="pf-hero__foot">
            <p className="pf-lead pf-fade" style={{ "--i": 5 } as React.CSSProperties}>
              I am Ines, a final-year student who designs and builds for the web. I like clear type, quiet
              layouts and code that other people can read.
            </p>
            <p className="pf-status pf-fade" style={{ "--i": 6 } as React.CSSProperties}>
              <span className="pf-status__dot" aria-hidden />
              Looking for internships, summer 2026
            </p>
          </div>
        </section>

        <div className="pf-marquee" aria-label="Skills">
          <div className="pf-marquee__track">
            {[0, 1].map((copy) => (
              <ul key={copy} className="pf-marquee__set" aria-hidden={copy === 1 || undefined}>
                {skills.map((s) => (
                  <li key={s}>
                    {s}
                    <span aria-hidden className="pf-marquee__dot" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <section id="work" className="pf-section" aria-labelledby="pf-work">
          <div className="pf-sechead">
            <p className="pf-label">
              <span>(01)</span> Selected work
            </p>
            <h2 id="pf-work" className="pf-h2">
              Four projects, <em>made slowly.</em>
            </h2>
          </div>
          <ProjectList projects={projects} />
        </section>

        <section id="about" className="pf-section pf-about" aria-labelledby="pf-about">
          <figure className="pf-portrait">
            <Image
              src="/images/work/portfolio/portrait.webp"
              alt="Portrait of Ines Calder standing in front of a lake"
              width={1400}
              height={934}
              sizes="(max-width: 900px) 92vw, 46vw"
            />
            <figcaption>Ines, outside the studio, with a coffee.</figcaption>
          </figure>
          <div className="pf-about__copy">
            <p className="pf-label">
              <span>(02)</span> About
            </p>
            <h2 id="pf-about" className="pf-h2">
              Part designer, part <em>engineer,</em> fully a student.
            </h2>
            <p>
              I started in print and layout, then taught myself to code so my designs would survive contact with
              a browser. Now I work in both, which means fewer handoffs and fewer surprises.
            </p>
            <p>
              Outside of class I run a small reading group, make type specimens and bike everywhere. I am
              looking for a team where I can learn from people who care about the details.
            </p>
          </div>
        </section>

        <section id="resume" className="pf-section" aria-labelledby="pf-resume">
          <div className="pf-sechead">
            <p className="pf-label">
              <span>(03)</span> Resume
            </p>
            <h2 id="pf-resume" className="pf-h2">
              Where I have <em>studied</em> and worked.
            </h2>
          </div>
          <div className="pf-resume">
            <ol className="pf-time">
              {education.map((e) => (
                <li key={e.what}>
                  <span className="pf-time__when">{e.when}</span>
                  <div>
                    <h3>{e.what}</h3>
                    <p className="pf-time__where">{e.where}</p>
                    <p>{e.note}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="pf-tools">
              {toolbox.map((t) => (
                <div key={t.head}>
                  <h3>{t.head}</h3>
                  <ul>
                    {t.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <a href="#contact" className="pf-btn pf-btn--ghost">
                Download resume (PDF)
              </a>
            </div>
          </div>
        </section>

        <section id="contact" className="pf-contact" aria-labelledby="pf-contact">
          <p className="pf-label">
            <span>(04)</span> Contact
          </p>
          <h2 id="pf-contact" className="pf-contact__title">
            Say <em>hello.</em>
          </h2>
          <div className="pf-contact__row">
            <p>
              Hiring for an internship, or want to talk about a small project? Write a line about what you are
              making and I will reply.
            </p>
            <ul className="pf-contact__links">
              <li>
                <a href="#contact" className="pf-btn">
                  Email me
                </a>
              </li>
              <li>
                <a href="#contact" className="pf-btn pf-btn--ghost">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="#contact" className="pf-btn pf-btn--ghost">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </section>

        <footer className="pf-foot">
          <span>Ines Calder, 2026</span>
          <span>Set in Instrument Serif and DM Sans</span>
          <a href="#top">Back to top</a>
        </footer>
      </div>
    </ConceptFrame>
  );
}
