/**
 * Copy for About, the principles list and the final CTA.
 * Voice: "Northframe" for marketing statements, first-person "I" only where the founder is
 * speaking directly (About note, final CTA, inquiry confirmation). Never "we" or "our team".
 */
export const about = {
  eyebrow: "About",
  title: "Small studio. Serious about the details.",
  lead: "Northframe Builds is an independent web design and development studio for students, creators, organizations, and small businesses.",
  body: "The goal is the care and polish people expect from expensive agencies, without a price that makes a professional website unrealistic when you're just starting out.",
  founder: {
    heading: "Built by Sarvesh.",
    note: "I'm an engineering student at Texas A&M and developer who likes building polished digital products. Northframe started from a simple idea: good website design shouldn't only be available to companies with agency budgets.",
  },
  /** Aria label for the decorative composition. */
  visualLabel: "Concept designs for a portfolio site, shown in a browser window inside a frame",
  visualCaption: "Concept design, not client work.",
  more: { label: "More about Northframe Builds", href: "/about" },
} as const;

/** The /about page. Facts only: nothing here that is not true today. */
export const aboutPage = {
  title: "About Northframe Builds",
  description:
    "Northframe Builds is an independent web design and development studio founded by Sarvesh Jagtap, an engineering student at Texas A&M, for students, creators, and small businesses.",
  h1: "About Northframe Builds.",
  lead: "Northframe Builds (shown as Northframe) is an independent web design and development studio. It designs and builds custom, responsive websites for students, creators, student organizations, and small businesses, with fixed prices and full ownership for the client.",
  sections: [
    {
      heading: "Who runs it",
      body: [
        "Northframe Builds was founded by Sarvesh Jagtap, an engineering student at Texas A&M University and a web developer. Sarvesh personally designs and builds every site, from the first outline to launch.",
        "It started from a simple idea: good website design shouldn't only be available to companies with agency budgets.",
      ],
    },
    {
      heading: "What Northframe Builds makes",
      body: [
        "Custom websites in four sizes: Launch (one page, for student portfolios and resumes), Presence (up to three pages, for creators and professionals), Business (up to five pages, for organizations and small businesses), and Custom (accounts, databases, payments, and other functionality, quoted by scope).",
        "Every site is designed around the client's content rather than a template, built to work on phones, tablets, and desktops, and handed over with the domain, hosting, and accounts in the client's name.",
      ],
    },
    {
      heading: "How sites are built",
      body: [
        "Sites are hand-coded with modern, widely used tools, so any developer can maintain them later. This website is built the same way.",
      ],
      points: [
        "Next.js and React for the site itself, server-rendered so content loads fast and search engines can read it.",
        "TypeScript and Tailwind CSS for maintainable code and styling.",
        "Vercel for hosting and deployment.",
        "Supabase and Stripe when a Custom project needs accounts, data, or payments.",
      ],
    },
    {
      heading: "What Northframe Builds does not do",
      points: [
        "No fake reviews, client counts, or promised search rankings.",
        "No locked platforms: clients own the domain, the code, and their accounts.",
        "No monthly fee from the studio. Package prices are one-time (see [running a website without a monthly fee](/guides/website-without-a-monthly-fee)).",
      ],
    },
  ],
} as const;

export const services = {
  eyebrow: "What Northframe builds",
  title: "A site sized to what you need.",
  lead: "Four kinds of project, from a single portfolio page to something built around your own logic. Prices are in the pricing section.",
  items: [
    {
      id: "launch",
      name: "Launch",
      for: "Portfolios and resumes",
      body: "One clean page that shows your work, links, and contact details.",
      points: ["Custom one-page design", "Projects and resume", "Live on your own domain"],
    },
    {
      id: "presence",
      name: "Presence",
      for: "Creators and professionals",
      body: "A few pages with galleries, a contact form, and the basics set up to be found.",
      points: ["Up to 3 pages", "Gallery and contact form", "SEO and analytics setup"],
    },
    {
      id: "business",
      name: "Business",
      for: "Organizations and businesses",
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
  lead: "Every site is designed around your content, built to work on every screen, and handed over in your name.",
  /** Aria label for the decorative pane composition. */
  visualLabel: "Concept website designs shown on floating glass panels",
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
    { name: "Design", body: "Layout, type, and color take shape around your content." },
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
  visualLabel: "A dark glass panel showing a concept site that reads: Your website. Your ownership.",
  statement: "No locked platform. No mystery credentials. No dependency on us to keep your website running.",
} as const;

export const finalCta = {
  eyebrow: "Have something in mind?",
  title: "Let's build something worth sharing.",
  body: "Tell me what you're working on and I'll help figure out the right direction.",
  primary: { label: "Start a Project", href: "/start" },
  secondary: { label: "View Pricing", href: "/#pricing" },
} as const;
