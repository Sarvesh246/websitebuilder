/**
 * Copy for About, the principles list and the final CTA.
 * Voice: "Northframe" for marketing statements, first-person "I" only where the founder is
 * speaking directly (About note, final CTA, inquiry confirmation). Never "we" or "our team".
 */
export const about = {
  eyebrow: "About",
  title: "Small studio. Serious about the details.",
  lead: "Northframe is an independent web design and development studio for students, creators, organizations, and small businesses.",
  body: "The goal is the care and polish people expect from expensive agencies, without a price that makes a professional website unrealistic when you're just starting out.",
  founder: {
    heading: "Built by Sarvesh.",
    note: "I'm a student and developer who likes building polished digital products. Northframe started from a simple idea: good website design shouldn't only be available to companies with agency budgets.",
  },
  /** Aria label for the decorative composition. */
  visualLabel: "Concept designs for a portfolio site, shown in a browser window inside a frame",
  visualCaption: "Concept design, not client work.",
} as const;

export const expect = {
  eyebrow: "How it works",
  title: "What you can expect.",
  items: [
    {
      title: "Clear communication",
      body: "You know what is being built, what is included, and what happens next.",
    },
    {
      title: "Thoughtful design",
      body: "Layouts are designed around your content, not squeezed into a generic template.",
    },
    {
      title: "Responsive by default",
      body: "Your site is built to work properly on phones, tablets, and desktops.",
    },
    {
      title: "You own it",
      body: "Your domain, accounts, code, and data stay under your control.",
      link: { label: "See what's covered", href: "/#ownership" },
    },
  ],
} as const;

export const finalCta = {
  eyebrow: "Have something in mind?",
  title: "Let's build something worth sharing.",
  body: "Tell me what you're working on and I'll help figure out the right direction.",
  primary: { label: "Start a Project", href: "/start" },
  secondary: { label: "View Pricing", href: "/#pricing" },
} as const;
