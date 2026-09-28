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

export const services = {
  eyebrow: "Services",
  title: "A site sized to what you need.",
  lead: "Four kinds of project, from a single portfolio page to something built around your own logic. Prices are in the pricing section.",
  items: [
    {
      id: "starter",
      name: "Personal",
      for: "Portfolios and resumes",
      body: "One clean page that shows your work, links, and contact details.",
      points: ["Custom one-page design", "Projects and resume", "Live on your own domain"],
    },
    {
      id: "plus",
      name: "Professional",
      for: "Creators, freelancers, student orgs",
      body: "A few pages with galleries, a contact form, and the basics set up to be found.",
      points: ["Up to 3 pages", "Gallery and contact form", "SEO and analytics setup"],
    },
    {
      id: "pro",
      name: "Business",
      for: "Organizations and small businesses",
      body: "A fuller site with service, team, or event pages and simple integrations.",
      points: ["Up to 5 pages", "Service, team, and event pages", "Forms and simple integrations"],
    },
    {
      id: "custom",
      name: "Custom",
      for: "Projects with their own logic",
      body: "Accounts, databases, dashboards, or payments, scoped and quoted for the project.",
      points: ["Authentication and data", "Dashboards and admin", "Quoted by scope"],
    },
  ],
} as const;

export const why = {
  eyebrow: "Why Northframe",
  title: "Considered design. Clear terms.",
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

export const processSteps = {
  eyebrow: "Process",
  title: "From outline to live site.",
  lead: "Four steps, in order. You see the site take shape at each one.",
  steps: [
    { name: "Define", body: "Goals, pages, and content are agreed before any design starts." },
    { name: "Design", body: "Layout, type, and colour take shape around your content." },
    { name: "Build", body: "The design becomes a fast, responsive site you can review." },
    { name: "Launch", body: "Domain, hosting, and accounts are set up in your name." },
  ],
} as const;

export const ownershipScene = {
  eyebrow: "Ownership",
  titleLines: ["Built for you.", "Owned by you."],
  lead: "Your website, domain, accounts, and data stay under your control.",
  items: [
    { label: "Your domain", body: "Registered in your name, pointed wherever you decide." },
    { label: "Your code", body: "The finished site is yours to keep, host, and change." },
    { label: "Your accounts", body: "Hosting, analytics, and email live under your login." },
    { label: "Your data", body: "Whatever your site collects stays under your control." },
  ],
  visualLabel: "Illustration of a glass browser frame reading: Your website. Your ownership.",
  statement: "No locked platform. No mystery credentials. No dependency on us to keep your website running.",
} as const;

export const finalCta = {
  eyebrow: "Have something in mind?",
  title: "Let's build something worth sharing.",
  body: "Tell me what you're working on and I'll help figure out the right direction.",
  primary: { label: "Start a Project", href: "/start" },
  secondary: { label: "View Pricing", href: "/#pricing" },
} as const;
