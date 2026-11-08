/**
 * Search-intent pages: one page per "best ..." query people actually type, served at a URL that matches the
 * query 1:1 (/best-web-design-for-students). Each is an honest buyer's guide: the criteria that matter, how the
 * main kinds of option compare, and where Northframe fits, with Northframe's own interest stated up front.
 *
 * Rules (same as the rest of the site): no invented rankings, ratings, reviews, client counts or results; no
 * named competitors; prices come from config/pricing.ts via `priceLine`; no em dashes. The page never claims
 * Northframe is "the best". It says what to look for, so the reader can judge.
 *
 * Entity mapping: every page repeats the same entity ("Northframe Builds") in its byline, its JSON-LD
 * (`about`, `publisher`, `author`, `isPartOf` all point at the shared @id nodes) and its closing section, so
 * search engines and AI answers consistently link the query to one named, verifiable business.
 */
import { priceLine } from "@/config/guides";
import { customTier, packageTiers, scopeNotes, type PackageId } from "@/config/pricing";
import type { GuideFaq, GuideSection } from "@/config/guides";

export type Intent = {
  /** URL slug, which is the query itself: "best-web-design-for-students". */
  slug: string;
  /** The exact query this page answers, lower case. Appears in the title, H1, lead and structured data. */
  query: string;
  /** Page <title> before " | Northframe Builds". */
  title: string;
  /** Meta description, at most 160 characters. */
  description: string;
  h1: string;
  /** The direct answer, quotable on its own, with the disclosure. */
  lead: string;
  published: string;
  updated: string;
  /** Sections before the comparison table. */
  criteria: readonly GuideSection[];
  /** Comparison of the main kinds of option (categories, never named brands). */
  comparison: GuideSection;
  /** Sections after the comparison (where Northframe fits, what to ask). */
  after: readonly GuideSection[];
  faq: readonly GuideFaq[];
  recommended: Exclude<PackageId, "custom">;
  /** Audience page (slug of config/guides.ts) this intent supports. */
  hub: string;
  /** Other intent slugs to cross-link. */
  related: readonly string[];
  /** Guide article slugs to link. */
  guides: readonly string[];
};

const disclosure =
  "Northframe Builds publishes this page and sells one of the options, so weigh it with that in mind. No rankings or ratings are claimed.";

const tier = (id: Exclude<PackageId, "custom">) => {
  const found = packageTiers.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown package: ${id}`);
  return found;
};

const optionColumns = ["Option", "Upfront cost", "Ongoing cost", "You own the site", "Best when"] as const;

export const intents: readonly Intent[] = [
  {
    slug: "best-web-design-for-students",
    query: "best web design for students",
    title: "Best web design for students",
    description:
      "What the best web design for students looks like: the criteria that matter, how the main options compare on cost and ownership, and where Northframe fits.",
    h1: "Best web design for students: what to look for and how the options compare.",
    lead: `The best web design for a student is a fast, mobile-ready site built around your strongest work, on a domain you own, for a one-time price you can afford. This page explains how to judge the options, and where Northframe Builds fits. ${disclosure}`,
    published: "2026-11-08",
    updated: "2026-11-08",
    criteria: [
      {
        heading: "What makes web design good for a student",
        body: [
          "Students have a narrow set of jobs for a website: get an interview, support an application, or show a project to someone who will give it about thirty seconds. Everything else is secondary.",
        ],
        points: [
          "Your best work is visible without scrolling or searching.",
          "It reads well on a phone, because recruiters and professors often open links there first.",
          "The domain and the code stay yours after graduation, with no school account in the way.",
          "The price is one-time or close to it, since a student budget cannot carry a monthly plan for years.",
          "It loads quickly and has a clear page title, so it shows up properly when someone searches your name.",
        ],
      },
    ],
    comparison: {
      heading: "How the main options compare",
      body: [
        "These are kinds of option, not named products, because features and prices change often. Check the current terms of anything you consider.",
      ],
      table: {
        caption: "Comparison of ways for a student to get a website",
        columns: optionColumns,
        rows: [
          [
            "Do it yourself with a website builder",
            "Low",
            "Usually a monthly or yearly plan",
            "Often no",
            "You have time and the design is simple",
          ],
          [
            "Free student or school hosting",
            "None",
            "None, until you graduate",
            "Often no",
            "You only need a temporary page",
          ],
          [
            "Marketplace freelancer",
            "Varies widely",
            "Usually none",
            "Usually yes",
            "You can review a freelancer's past work well",
          ],
          [
            "Full-service agency",
            "High",
            "Often a retainer",
            "Depends on the contract",
            "A large organization with a large budget",
          ],
          [
            "Small independent studio such as Northframe",
            "Fixed, listed up front",
            "Domain and optional hosting only",
            "Yes",
            "You want custom design at a student price",
          ],
        ],
      },
    },
    after: [
      {
        heading: "Where Northframe fits",
        body: [
          `Northframe Builds is an independent studio founded by ${"Sarvesh Jagtap"}, an engineering student at Texas A&M. The student package is one custom page for projects, resume, and contact. ${priceLine("launch")}, paid once, with ${tier("launch").revisions} revision round. The [web design for students](/web-design-for-students) page covers it in full.`,
          "If you have case studies or freelance work, the multi-page packages give each project room. [How much a student website costs](/guides/how-much-does-a-student-website-cost) breaks the price into the package, the domain, and hosting.",
        ],
      },
      {
        heading: "Questions worth asking any designer",
        points: [
          "Whose name is the domain registered in?",
          "Is there a monthly fee, and what happens to the site if I stop paying?",
          "Can I take the finished code and host it anywhere?",
          "How many revisions are included, and what does extra work cost?",
          "Are any results or rankings being promised? Be wary if so, because nobody can honestly guarantee them.",
        ],
      },
    ],
    faq: [
      {
        q: "What is the best web design for students on a small budget?",
        a: `For most students, a single well-designed page on your own domain. ${priceLine("launch")}, one time. A builder can be cheaper at first but usually adds a recurring plan, and a template is rarely built around your actual projects.`,
      },
      {
        q: "Is the best student website one page or several?",
        a: "One page is enough for most students: projects, resume, and contact. Add pages when you have detailed case studies, a freelance business, or more work than fits comfortably on one screen flow.",
      },
    ],
    recommended: "launch",
    hub: "web-design-for-students",
    related: ["best-student-portfolio-website", "best-affordable-web-design", "best-web-design-without-monthly-fees"],
    guides: ["student-portfolio-website-checklist", "how-much-does-a-student-website-cost"],
  },
  {
    slug: "best-student-portfolio-website",
    query: "best student portfolio website",
    title: "Best student portfolio website",
    description:
      "What the best student portfolio website includes, how to structure it, and how a custom site, a builder, and a profile page compare. Includes a checklist.",
    h1: "Best student portfolio website: what it includes and how to get one.",
    lead: `The best student portfolio website leads with your strongest project, explains your role in each, works on a phone, and makes contact easy. It is also one you keep after graduation. ${disclosure}`,
    published: "2026-11-08",
    updated: "2026-11-08",
    criteria: [
      {
        heading: "What the best student portfolio contains",
        points: [
          "Three to six projects, each with a one-line summary, your specific role, the tools you used, and an honest outcome.",
          "A short about section in your own words, with your name and what you want next near the top.",
          "A resume that reads quickly on a phone, plus a downloadable PDF kept in step with it.",
          "Links to GitHub, LinkedIn, or other profiles, and an easy way to get in touch.",
          "A page title and description that say who you are, since that is what shows in search results and link previews.",
        ],
      },
      {
        heading: "Pick the reader first",
        body: [
          "A portfolio for engineering internships, one for design roles, and one for graduate applications should lead with different work. Choose one main reader and order everything for them. The full [student portfolio website checklist](/guides/student-portfolio-website-checklist) walks through it step by step.",
        ],
      },
    ],
    comparison: {
      heading: "Portfolio website, builder, or profile page?",
      table: {
        caption: "Ways to present a student portfolio online",
        columns: optionColumns,
        rows: [
          [
            "Social or professional profile only",
            "None",
            "None",
            "No, the platform owns the layout",
            "A quick presence alongside your resume",
          ],
          [
            "Website builder template",
            "Low",
            "Usually a recurring plan",
            "Often no",
            "A simple page you will maintain yourself",
          ],
          [
            "Hand-coded from scratch",
            "Your time",
            "Domain and hosting",
            "Yes",
            "You are a developer and want to build it",
          ],
          [
            "Custom site from a small studio such as Northframe",
            "Fixed, listed up front",
            "Domain and optional hosting only",
            "Yes",
            "You want it designed around your projects without building it",
          ],
        ],
      },
    },
    after: [
      {
        heading: "A profile page and a portfolio do different jobs",
        body: [
          "A profile page is where people confirm you exist. A portfolio site is where you control the story and show the work in depth. Most students benefit from both, and the [portfolio website vs LinkedIn](/guides/portfolio-website-vs-linkedin) guide explains how they fit together.",
        ],
      },
      {
        heading: "Getting one with Northframe",
        body: [
          `The one-page Launch package is a custom portfolio page: projects, resume, and contact. ${priceLine("launch")}. The domain is registered in your name and the finished code is yours. Details are on the [web design for students](/web-design-for-students) page.`,
        ],
      },
    ],
    faq: [
      {
        q: "How many projects should the best student portfolio include?",
        a: "Three to six. Fewer, stronger projects read better than a long list, and you should be ready to talk about every one in an interview.",
      },
      {
        q: "Do I need my own domain for a student portfolio?",
        a: "It is not required, but your own domain looks more deliberate and stays with you after you graduate, so a school address stops working without breaking your links.",
      },
    ],
    recommended: "launch",
    hub: "web-design-for-students",
    related: ["best-web-design-for-students", "best-portfolio-website-for-creators", "best-affordable-web-design"],
    guides: ["student-portfolio-website-checklist", "portfolio-website-vs-linkedin"],
  },
  {
    slug: "best-affordable-web-design",
    query: "best affordable web design",
    title: "Best affordable web design",
    description:
      "How to find the best affordable web design: what a low price really covers, the hidden costs to check, and how fixed-price custom sites compare with builders.",
    h1: "Best affordable web design: what a low price should include.",
    lead: `Affordable web design is only a good deal if the price is complete: design, build, revisions, and ownership included, with no surprise recurring fees. This page explains what to check, and how Northframe Builds prices its work. ${disclosure}`,
    published: "2026-11-08",
    updated: "2026-11-08",
    criteria: [
      {
        heading: "What affordable should mean",
        body: [
          "A low headline price can hide the costs that matter. Compare the total over the first year or two, not the first invoice.",
        ],
        points: [
          "What exactly is included: pages, revisions, mobile layout, basic SEO setup, contact form.",
          "Whether the price is one-time or the start of a monthly plan.",
          "Who owns the domain and the finished code.",
          "What counts as extra work, and whether you approve the price before it begins.",
          "Whether the designer builds custom or fills a stock template.",
        ],
      },
    ],
    comparison: {
      heading: "How low-cost options compare",
      table: {
        caption: "Comparison of low-cost ways to get a website",
        columns: optionColumns,
        rows: [
          [
            "Website builder subscription",
            "Low",
            "Recurring plan for the life of the site",
            "Often no",
            "A simple site you will build and edit yourself",
          ],
          [
            "Cheapest marketplace listing",
            "Very low",
            "Usually none",
            "Varies",
            "You can check quality and scope carefully",
          ],
          [
            "Template reskin",
            "Low to moderate",
            "Sometimes hosting or licence fees",
            "Varies",
            "A standard look is acceptable",
          ],
          [
            "Fixed-price custom studio such as Northframe",
            "Listed up front",
            "Domain and optional hosting only",
            "Yes",
            "You want custom design with a known price",
          ],
        ],
      },
    },
    after: [
      {
        heading: "Northframe's prices",
        body: [
          `${priceLine("launch")}, ${priceLine("presence")}, and ${priceLine("business")}. All are one-time. ${customTier.name} projects are quoted by scope. ${scopeNotes[0]} The [website cost calculator](/tools/website-cost-calculator) shows which package fits your pages and features.`,
        ],
      },
      {
        heading: "The yearly costs that remain",
        body: [
          "Even with no monthly fee from the designer, the domain renews yearly with a registrar, and some hosting or email plans cost extra. [Running a website without a monthly fee](/guides/website-without-a-monthly-fee) lists them so nothing is a surprise.",
        ],
      },
    ],
    faq: [
      {
        q: "Is cheap web design worth it?",
        a: "It can be, if the scope is clear and you own the result. Be cautious when a low price depends on a recurring plan, a locked platform, or vague terms about extra work.",
      },
      {
        q: "How much does affordable custom web design cost?",
        a: `At Northframe, ${priceLine("launch")}, ${priceLine("presence")}, and ${priceLine("business")}. The [small business website cost guide](/guides/how-much-does-a-small-business-website-cost) explains what drives price in general.`,
      },
    ],
    recommended: "presence",
    hub: "small-business-websites",
    related: [
      "best-web-design-without-monthly-fees",
      "best-web-design-for-small-business",
      "best-web-design-for-students",
    ],
    guides: ["how-much-does-a-small-business-website-cost", "website-without-a-monthly-fee"],
  },
  {
    slug: "best-web-design-for-small-business",
    query: "best web design for small business",
    title: "Best web design for small business",
    description:
      "What the best web design for a small business includes: pages, trust signals, SEO basics and ownership, plus how builders, freelancers and studios compare.",
    h1: "Best web design for small business: what the site has to do.",
    lead: `The best web design for a small business explains what you offer in plain language, builds trust, and makes contact easy, on a site you own. ${disclosure}`,
    published: "2026-11-08",
    updated: "2026-11-08",
    criteria: [
      {
        heading: "What the site is there to do",
        body: [
          "Visitors usually arrive with one question: can this business help me, and how do I reach it? Good small business design answers that quickly.",
        ],
        points: [
          "A clear page for each main service, in plain language.",
          "A team or about page, so people know who they are dealing with.",
          "A contact form and the details people need to follow up.",
          "FAQ and testimonial sections only where you have real content for them.",
          "Sensible page titles, descriptions, and analytics, without promises about rankings.",
        ],
      },
    ],
    comparison: {
      heading: "Builder, freelancer, agency, or studio?",
      table: {
        caption: "Ways a small business can get a website",
        columns: optionColumns,
        rows: [
          ["Website builder", "Low", "Recurring plan", "Often no", "A simple site you will maintain yourself"],
          [
            "Freelancer",
            "Moderate, varies",
            "Usually none",
            "Usually yes",
            "You can vet their past work and communication",
          ],
          ["Agency", "High", "Often a retainer", "Depends on the contract", "Complex needs and a larger budget"],
          [
            "Small independent studio such as Northframe",
            "Fixed, listed up front",
            "Domain and optional hosting only",
            "Yes",
            "Up to five custom pages at a known price",
          ],
        ],
      },
    },
    after: [
      {
        heading: "How Northframe approaches it",
        body: [
          `The Business package covers up to ${tier("business").pages} pages with service, team, and FAQ sections, simple forms and integrations, and SEO and analytics setup. ${priceLine("business")}, one time. See [small business websites](/small-business-websites), and [what pages a small business website needs](/guides/what-pages-does-a-small-business-website-need) for the page list.`,
        ],
      },
      {
        heading: "Honest limits",
        body: [
          "Online payments, stores, logins, and databases are outside the fixed packages and are quoted separately. SEO setup helps search engines read the site. It does not promise a ranking, and nobody can honestly promise one.",
        ],
      },
    ],
    faq: [
      {
        q: "What pages does the best small business website have?",
        a: "At minimum a home page, your main services, an about or team page, and a contact page. The [pages a small business website needs](/guides/what-pages-does-a-small-business-website-need) guide covers each.",
      },
      {
        q: "Is a custom small business website better than a builder?",
        a: "It depends on how much design control and ownership matter to you. The [custom website vs Wix or Squarespace](/guides/custom-website-vs-website-builder) guide compares them without picking a winner for everyone.",
      },
    ],
    recommended: "business",
    hub: "small-business-websites",
    related: [
      "best-affordable-web-design",
      "best-website-for-student-organizations",
      "best-web-design-without-monthly-fees",
    ],
    guides: ["what-pages-does-a-small-business-website-need", "custom-website-vs-website-builder"],
  },
  {
    slug: "best-website-for-student-organizations",
    query: "best website for student organizations",
    title: "Best website for student organizations",
    description:
      "What the best website for a student organization needs: events, team, joining, and handover between officers, and how the main options compare.",
    h1: "Best website for student organizations: built to outlast the officers.",
    lead: `The best website for a student organization answers what the group is, shows what is coming up, and survives the next election, because the domain and accounts belong to the organization, not one officer. ${disclosure}`,
    published: "2026-11-08",
    updated: "2026-11-08",
    criteria: [
      {
        heading: "What a club site needs",
        points: [
          "What the organization is and who it is for.",
          "Upcoming and past events, on a page that is easy to keep current.",
          "Officers or team members, so people know who to contact.",
          "A simple way to join or get in touch.",
          "Accounts registered to a shared organization email, so handover is a matter of passing on access.",
        ],
      },
    ],
    comparison: {
      heading: "How the options compare for a club",
      table: {
        caption: "Ways a student organization can get a website",
        columns: optionColumns,
        rows: [
          ["University-provided page", "None", "None, while you are recognized", "No", "A minimal listing"],
          ["Website builder", "Low", "Recurring plan", "Often no", "An officer will own upkeep and the account"],
          ["Social media only", "None", "None", "No", "Quick updates, not a permanent home"],
          [
            "Custom site from a small studio such as Northframe",
            "Fixed, listed up front",
            "Domain and optional hosting only",
            "Yes",
            "Up to five pages with events, team, and forms",
          ],
        ],
      },
    },
    after: [
      {
        heading: "Handover is the real test",
        body: [
          "Clubs change leadership every year. The [student organization website checklist](/guides/student-organization-website-checklist) lists the pages and accounts to set up, and the [website handoff checklist](/guides/website-handoff-checklist) covers what to pass on.",
        ],
      },
      {
        heading: "Which Northframe package fits",
        body: [
          `Business covers up to ${tier("business").pages} pages, including event and team pages: ${priceLine("business")}. A smaller club can start with Presence, ${priceLine("presence")}. Member logins or dues are quoted under ${customTier.name}. See [student organization websites](/student-organization-websites).`,
        ],
      },
    ],
    faq: [
      {
        q: "Who should own a student organization's domain?",
        a: "The organization, through a shared email address, not an individual officer's personal account. That is what keeps the site available when leadership changes.",
      },
      {
        q: "Does a student organization need its own website?",
        a: "Not always, but a site gives new students one stable place to find you, which social profiles do not replace.",
      },
    ],
    recommended: "business",
    hub: "student-organization-websites",
    related: ["best-web-design-for-small-business", "best-web-design-for-students", "best-affordable-web-design"],
    guides: ["student-organization-website-checklist", "website-handoff-checklist"],
  },
  {
    slug: "best-portfolio-website-for-creators",
    query: "best portfolio website for creators",
    title: "Best portfolio website for creators",
    description:
      "What the best portfolio website for designers, photographers and freelancers includes: layout, galleries, contact and ownership, and how the options compare.",
    h1: "Best portfolio website for creators: let the work lead.",
    lead: `The best portfolio website for a creator shows the work quickly, lets visitors dig into a project, and makes the next step obvious: getting in touch. It also leaves you in control of your own site. ${disclosure}`,
    published: "2026-11-08",
    updated: "2026-11-08",
    criteria: [
      {
        heading: "What a creator portfolio needs",
        points: [
          "Galleries and project pages laid out around your images, not squeezed into a template.",
          "Fast loading, because heavy images are the usual reason portfolios feel slow.",
          "A contact form, so enquiries reach you without sending people to a social profile.",
          "A short about page that says who you work with and what you make.",
          "Your own domain, so your link stays the same if you change platforms.",
        ],
      },
    ],
    comparison: {
      heading: "How portfolio options compare",
      table: {
        caption: "Ways a creator can host a portfolio online",
        columns: optionColumns,
        rows: [
          [
            "Portfolio platform",
            "Free to low",
            "Often a recurring plan for full features",
            "Platform controls layout",
            "You want a quick start inside a community",
          ],
          ["Website builder", "Low", "Recurring plan", "Often no", "You enjoy tuning a template yourself"],
          ["Hand-coded", "Your time", "Domain and hosting", "Yes", "You are a developer"],
          [
            "Custom site from a small studio such as Northframe",
            "Fixed, listed up front",
            "Domain and optional hosting only",
            "Yes",
            "You want the layout built around your pieces",
          ],
        ],
      },
    },
    after: [
      {
        heading: "Fitting the Northframe package",
        body: [
          `Presence covers up to ${tier("presence").pages} pages, which suits a home page, a work page, and an about or contact page: ${priceLine("presence")}. Just starting out? The one-page Launch package works as a first step. See [portfolio websites for creators](/portfolio-websites-for-creators).`,
        ],
      },
    ],
    faq: [
      {
        q: "How many pages should a creator portfolio have?",
        a: "Three is enough for most: home, work, and about or contact. Add case-study pages when you have projects that need more explanation than a gallery caption.",
      },
      {
        q: "Should a freelancer have a portfolio website or just social profiles?",
        a: "Profiles help people find you. A site you own is where you control the presentation and keep the link permanent. The [portfolio website vs LinkedIn](/guides/portfolio-website-vs-linkedin) guide covers the trade-off.",
      },
    ],
    recommended: "presence",
    hub: "portfolio-websites-for-creators",
    related: ["best-student-portfolio-website", "best-web-design-for-small-business", "best-affordable-web-design"],
    guides: ["portfolio-website-vs-linkedin", "domain-hosting-and-website-ownership"],
  },
  {
    slug: "best-web-design-without-monthly-fees",
    query: "best web design without monthly fees",
    title: "Best web design without monthly fees",
    description:
      "How to get a website with no monthly design fee: what one-time pricing covers, the small yearly costs that remain, and how to check you really own the site.",
    h1: "Best web design without monthly fees: one price, and you own the site.",
    lead: `Web design without monthly fees means you pay once for the design and build, and the only ongoing costs are ones you control, such as your domain renewal. ${disclosure}`,
    published: "2026-11-08",
    updated: "2026-11-08",
    criteria: [
      {
        heading: "What no monthly fee should mean",
        points: [
          "The designer or platform charges nothing recurring for the site to stay online.",
          "The domain is registered in your name, so renewals go to the registrar, not through a middleman.",
          "You hold the finished code and can host it anywhere.",
          "Any hosting or email plan is a separate, optional choice with a provider you pick.",
        ],
      },
      {
        heading: "Costs that still exist",
        body: [
          "No monthly design fee does not mean the site is free forever. The domain renews yearly, and some hosting or email plans cost extra. [Running a website without a monthly fee](/guides/website-without-a-monthly-fee) lists them.",
        ],
      },
    ],
    comparison: {
      heading: "One-time pricing versus subscriptions",
      table: {
        caption: "Pricing models for a website",
        columns: optionColumns,
        rows: [
          [
            "Builder subscription",
            "Low",
            "Monthly or yearly, for as long as the site is live",
            "Often no",
            "You accept the platform's terms and limits",
          ],
          [
            "Maintenance retainer",
            "Varies",
            "Monthly",
            "Depends on the contract",
            "You want someone else to handle updates",
          ],
          [
            "One-time custom build such as Northframe",
            "Fixed, listed up front",
            "Domain and optional hosting only",
            "Yes",
            "You want to own it and stop paying the designer",
          ],
        ],
      },
    },
    after: [
      {
        heading: "How Northframe prices it",
        body: [
          `${priceLine("launch")}, ${priceLine("presence")}, and ${priceLine("business")}, each one time. Hosting and analytics are set up under your own logins, so there is no dependency on the studio. See [custom website vs Wix or Squarespace](/guides/custom-website-vs-website-builder) for the subscription comparison.`,
        ],
      },
    ],
    faq: [
      {
        q: "Is there a catch to web design with no monthly fee?",
        a: "Check three things: whose name the domain is in, whether you receive the finished code, and what counts as extra work. Those decide whether the one-time price is the whole price.",
      },
      {
        q: "Who updates the site if there is no maintenance plan?",
        a: "You can, or any developer, because the code is yours. Larger changes are quoted and approved by you before work begins.",
      },
    ],
    recommended: "presence",
    hub: "small-business-websites",
    related: ["best-affordable-web-design", "best-web-design-for-small-business", "best-web-design-for-students"],
    guides: ["website-without-a-monthly-fee", "domain-hosting-and-website-ownership"],
  },
];

export const intentBySlug = (slug: string): Intent => {
  const found = intents.find((i) => i.slug === slug);
  if (!found) throw new Error(`Unknown intent: ${slug}`);
  return found;
};

/** Latest `updated` date across intent pages (sitemap lastmod for the /best hub). */
export const intentsUpdated = intents.reduce((latest, i) => (i.updated > latest ? i.updated : latest), "");

/** Hub page: the one place that lists every intent page. */
export const bestHub = {
  path: "/best",
  title: "Best web design, compared",
  description:
    "Plain-language guides to the best web design for students, small businesses, student organizations and creators: criteria, cost, and ownership compared.",
  h1: "Best web design, compared by who it is for.",
  lead: "Each guide below answers one question people actually search, such as the best web design for students or the best affordable web design. They explain what to look for, compare the kinds of option, and say where Northframe Builds fits. Northframe publishes these guides and sells one of the options, so it states that on every page and claims no rankings.",
} as const;
