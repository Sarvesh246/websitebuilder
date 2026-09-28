export type ProcessStep = {
  id: "define" | "design" | "build" | "launch";
  number: string;
  title: string;
  body: string;
};

export const processIntro = {
  eyebrow: "Our process",
  title: "A clear process.",
  lead: "From first direction to final launch, every step has a purpose.",
} as const;

export const processSteps: readonly ProcessStep[] = [
  {
    id: "define",
    number: "01",
    title: "Define",
    body: "We clarify what the site needs to communicate before deciding how it should look.",
  },
  {
    id: "design",
    number: "02",
    title: "Design",
    body: "Layout, typography, interaction, and visual direction come together into a clear system.",
  },
  {
    id: "build",
    number: "03",
    title: "Build",
    body: "The design becomes a responsive, production-ready website.",
  },
  {
    id: "launch",
    number: "04",
    title: "Launch",
    body: "We connect the domain and infrastructure, test everything, and hand over the finished site.",
  },
];
