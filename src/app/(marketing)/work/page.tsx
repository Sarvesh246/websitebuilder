import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ConceptCard } from "@/components/concept/ConceptCard";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { concepts } from "@/config/concepts";
import { startHref } from "@/config/inquiry";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Website concepts",
  description:
    "Five concept websites for students, photographers, cafes, student organizations, and freelancers. Scroll them, click around, and see what a Northframe site can feel like.",
  path: "/work",
});

export default function WorkPage() {
  return (
    <section className="work" aria-labelledby="work-title">
      <Container>
        <header className="work__head">
          <div className="flex flex-col items-start gap-5">
            <span className="t-label t-label--rule">Concepts</span>
            <h1 id="work-title" className="t-display max-w-[14ch]">
              Five sites. Five different worlds.
            </h1>
          </div>
          <div className="work__note">
            <p className="t-lead">
              Each concept has its own type, colour, layout and motion, built for a different kind of person.
            </p>
            <p>
              These are design concepts for fictional businesses, not client work. Open one, scroll it, click around.
            </p>
          </div>
        </header>

        <div className="work__grid">
          {concepts.map((concept, index) => (
            <ConceptCard key={concept.slug} concept={concept} index={index} />
          ))}
        </div>

        <Reveal className="work__cta">
          <h2 className="t-h3">Want one like this?</h2>
          <Button href={startHref()} size="lg" icon="diag">
            Start a Project
          </Button>
        </Reveal>
        <p className="work__credit">Photography from Unsplash, used under the Unsplash License.</p>
      </Container>
    </section>
  );
}
