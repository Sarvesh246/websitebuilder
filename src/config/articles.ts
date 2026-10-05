/**
 * Long-form guides under /guides. Practical, first-party advice that supports the commercial pages:
 * each guide links to the audience page it belongs to and to related guides.
 * Package names and prices are never typed here: they come from config/pricing.ts via `priceLine`
 * and the tier facts, so a price change cannot leave a guide out of date.
 * Voice: third person for Northframe, "you" for the reader. No invented statistics, clients or results.
 */
import { priceLine, type GuideFaq, type GuideSection } from "@/config/guides";
import { commonInclusions, customTier, packageTiers, scopeNotes } from "@/config/pricing";

export type Article = {
  slug: string;
  /** Page <title> before " | Northframe Builds", and the breadcrumb label. */
  title: string;
  /** Meta description, about 150 characters. */
  description: string;
  h1: string;
  /** The direct answer, in two or three sentences, so the page can be quoted on its own. */
  lead: string;
  /** ISO dates (yyyy-mm-dd). Bump `updated` whenever the text changes: it feeds the sitemap and the byline. */
  published: string;
  updated: string;
  sections: readonly GuideSection[];
  faq?: readonly GuideFaq[];
  /** The audience page this guide supports (slug of config/guides.ts), linked as the next step. */
  hub: string;
  /** Other guides in the same cluster. */
  related: readonly string[];
};

const tier = (id: "launch" | "presence" | "business") => {
  const found = packageTiers.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown package: ${id}`);
  return found;
};

const launch = tier("launch");
const presence = tier("presence");
const business = tier("business");

export const articles: readonly Article[] = [
  {
    slug: "student-portfolio-website-checklist",
    title: "Student portfolio website checklist",
    description:
      "A practical checklist for a student portfolio website: what to include, how to describe projects, and what to check before you share the link.",
    h1: "Student portfolio website checklist.",
    lead: "A good student portfolio does three jobs: it shows your strongest work first, explains who you are in a few lines, and makes it easy to contact you. Use this checklist before you share the link with a recruiter, professor, or admissions reader.",
    published: "2026-10-05",
    updated: "2026-10-05",
    sections: [
      {
        heading: "Before you build",
        body: [
          "Decide who the site is for. A portfolio for engineering internships, one for design roles, and one for graduate school applications should lead with different work. Pick one main reader and order everything for them.",
        ],
        points: [
          "Choose three to six projects. Fewer, stronger projects read better than a long list.",
          "Write one sentence on what you want next: an internship, a research position, freelance work.",
          "Collect images or screenshots for each project, plus links to code, papers, or live demos.",
          "Get a current resume as a PDF, and decide whether to show it on the page, link it, or both.",
        ],
      },
      {
        heading: "How to describe each project",
        body: [
          "Most visitors skim. Give each project a short, specific summary before any detail, and make your own contribution obvious, especially on team projects.",
        ],
        points: [
          "What it is, in one line, without jargon.",
          "Your role: what you personally designed, built, tested, or wrote.",
          "Tools and methods you used, named plainly.",
          "The outcome, stated honestly: what works, what you learned, what you would change.",
          "A link to the code, report, or live version where you are allowed to share it.",
        ],
      },
      {
        heading: "The essentials on the page",
        points: [
          "Your name and a one-line description near the top.",
          "Your strongest project visible without much scrolling.",
          "A short about section in your own words.",
          "Contact details and links to profiles such as GitHub or LinkedIn.",
          "A layout that works on a phone, because links from messages and emails are often opened there.",
        ],
      },
      {
        heading: "Checks before you share it",
        points: [
          "Open every link and download, including the resume.",
          "Read the whole page on a phone and on a laptop.",
          "Check spelling in headings, project titles, and your own name.",
          "Make sure the page title and description say who you are, since that is what appears in search results and link previews.",
          "Use your own domain if you can. It looks more deliberate and stays with you after you graduate.",
        ],
      },
      {
        heading: "When a one-page site is enough",
        body: [
          `For most students, one well-organized page is enough: projects, resume, and contact. That is what the Launch package covers. ${priceLine("launch")}, with ${launch.revisions} revision round.`,
          `If you have detailed case studies, freelance work, or a lot to show, a few pages give each project room. Presence covers up to ${presence.pages} pages.`,
        ],
      },
    ],
    faq: [
      {
        q: "How many projects should a student portfolio include?",
        a: "Three to six is a good range for most students. Lead with the work that best matches the role or program you are applying for, and cut anything you would not want to talk about in an interview.",
      },
      {
        q: "Should I put my resume on my portfolio website?",
        a: "Yes, in a form that reads quickly on a phone, with a downloadable PDF for people who want the file. Keep both versions in step.",
      },
    ],
    hub: "web-design-for-students",
    related: ["how-much-does-a-student-website-cost", "portfolio-website-vs-linkedin"],
  },
  {
    slug: "how-much-does-a-student-website-cost",
    title: "How much does a student website cost?",
    description:
      "What a student portfolio or resume website costs: the design and build, the domain, hosting, and what affects the price. With Northframe's student pricing.",
    h1: "How much does a student website cost?",
    lead: `A student website has three kinds of cost: the design and build (paid once), the domain name (renewed every year), and hosting (often free for a simple site). At Northframe, ${priceLine("launch")}, a one-time price for a custom one-page portfolio.`,
    published: "2026-10-05",
    updated: "2026-10-05",
    sections: [
      {
        heading: "The three costs",
        points: [
          "Design and build: a one-time cost, whether you pay a designer or spend your own time.",
          "Domain name: a yearly renewal paid to a registrar. Prices depend on the registrar and the ending (.com, .dev, .me and so on).",
          "Hosting: many hosts have free plans that comfortably run a simple personal site. Paid plans matter once you need more traffic, storage, or features.",
        ],
      },
      {
        heading: "What Northframe charges",
        body: [
          `${priceLine("launch")}. It includes ${launch.features.join(", ").toLowerCase()}, plus what every package has: ${commonInclusions.items.join(", ").toLowerCase()}.`,
          `If you need more than one page, ${priceLine("presence")} and covers up to ${presence.pages} pages with a contact form and SEO and analytics setup.`,
          scopeNotes[0],
        ],
      },
      {
        heading: "What pushes the price up",
        points: [
          "More pages, or a separate page for every project.",
          "Features such as contact forms, galleries, or analytics.",
          "Logins, databases, or payments, which turn a website into an application.",
          "Extra rounds of changes beyond what was agreed.",
        ],
      },
      {
        heading: "Template or custom?",
        body: [
          "A template builder can be cheaper in cash, but the monthly plan, the template's limits, and the time spent fighting it all count. A custom site costs more upfront and fits your work exactly. Either is a reasonable choice. What matters most is that the site is clear, current, and on a domain you control.",
        ],
      },
    ],
    faq: [
      {
        q: "Is the Northframe price one-time or monthly?",
        a: "One-time. Domain renewal and any paid third-party services are separate and paid to those providers directly, under your own account.",
      },
    ],
    hub: "web-design-for-students",
    related: ["student-portfolio-website-checklist", "domain-hosting-and-website-ownership"],
  },
  {
    slug: "portfolio-website-vs-linkedin",
    title: "Portfolio website vs LinkedIn",
    description:
      "Do you need a portfolio website if you have LinkedIn? What each one is good at, where they overlap, and how students and creators can use both.",
    h1: "Portfolio website vs LinkedIn: do you need both?",
    lead: "LinkedIn is a profile inside someone else's platform. A portfolio website is a page you control, built around your work. Most students and creators benefit from both: LinkedIn for being found and connecting, the website for showing the work in depth.",
    published: "2026-10-05",
    updated: "2026-10-05",
    sections: [
      {
        heading: "What LinkedIn is good at",
        points: [
          "Being found by recruiters who search inside LinkedIn.",
          "A familiar format that people already know how to read.",
          "Connections, messages, and recommendations in one place.",
        ],
      },
      {
        heading: "What a portfolio website is good at",
        points: [
          "Showing work properly: images, case studies, demos, and writing, laid out the way you want.",
          "One link that is yours, on your own domain, that does not change when a platform does.",
          "Room to explain your role and decisions on each project, which a profile field cannot hold.",
          "Being found on search engines under your own name.",
        ],
      },
      {
        heading: "How to use both",
        body: [
          "Keep LinkedIn as the summary and the website as the evidence. Link the website from your LinkedIn profile, link LinkedIn from the website, and keep job titles and dates consistent between them.",
          "If you only have time for one right now, choose based on your field. Where the work itself is the proof (design, photography, engineering projects, writing), the website usually earns its keep sooner.",
        ],
      },
    ],
    hub: "portfolio-websites-for-creators",
    related: ["student-portfolio-website-checklist", "how-much-does-a-student-website-cost"],
  },
  {
    slug: "student-organization-website-checklist",
    title: "Student organization website checklist",
    description:
      "A checklist for student club and organization websites: the pages you need, who should own the accounts, and how to keep the site alive after officers change.",
    h1: "Student organization website checklist.",
    lead: "A student organization site needs to answer a few questions well: what the group is, what is coming up, who to contact, and how to join. The bigger risk is not design but handover. Most club sites stop being updated because they were tied to one officer's accounts.",
    published: "2026-10-05",
    updated: "2026-10-05",
    sections: [
      {
        heading: "Pages most organizations need",
        points: [
          "Home: what the organization is and who it is for, in one or two sentences.",
          "Events: upcoming and past events, easy for any officer to update.",
          "Team: current officers and how to reach them.",
          "Join or contact: one clear way to sign up or get in touch.",
          "Sponsors or partners, only if you have real ones to list.",
        ],
      },
      {
        heading: "Accounts and ownership",
        body: [
          "Register the domain, hosting, and analytics with a shared organization email that is passed down with the officer roles, not with anyone's personal address. Keep a short document with every account, what it is for, and who has access.",
        ],
        points: [
          "A shared organization email as the owner of every account.",
          "At least two current officers with access to each account.",
          "Renewal dates for the domain written down where the next board will see them.",
          "The site's code stored in a repository the organization owns.",
        ],
      },
      {
        heading: "Keeping it current",
        points: [
          "Make the events page the easiest thing on the site to edit.",
          "Remove dates that have passed, or move them to a past events list.",
          "Review the team page each time officers change.",
          "Add website access to the officer handover checklist. See the website handoff checklist guide.",
        ],
      },
      {
        heading: "What it costs at Northframe",
        body: [
          `${priceLine("business")}. It covers up to ${business.pages} pages, including service, team, or event pages, with simple integrations and forms. A smaller club can start with Presence: ${priceLine("presence").replace("Presence is ", "")}, up to ${presence.pages} pages.`,
          `Member logins, dues, and online payments go beyond a website and are quoted under ${customTier.name}.`,
        ],
      },
    ],
    hub: "student-organization-websites",
    related: ["website-handoff-checklist", "domain-hosting-and-website-ownership"],
  },
  {
    slug: "website-handoff-checklist",
    title: "Website handoff checklist",
    description:
      "What you should receive when a website project is handed over: domain, hosting, code, analytics, and access, so you never depend on the developer to keep it running.",
    h1: "Website handoff checklist: what you should own at the end.",
    lead: "When a website project ends, you should hold the keys: the domain, the hosting account, the code, analytics, and every login, all under your name. This is the list Northframe works through at launch, and a useful checklist for any web project.",
    published: "2026-10-05",
    updated: "2026-10-05",
    sections: [
      {
        heading: "Accounts in your name",
        points: [
          "Domain registrar account, with the domain registered to you or your organization.",
          "Hosting account, where the site is deployed.",
          "Analytics, if the site has it.",
          "Email or form services the site sends messages through.",
          "Any third-party service the site depends on, with billing in your name where it is paid.",
        ],
      },
      {
        heading: "The code and content",
        points: [
          "The finished source code, in a repository you own.",
          "Original images, font licences, and any other files used on the site.",
          "A short note on how to update the most common content.",
        ],
      },
      {
        heading: "Access and security",
        points: [
          "Passwords changed by you after handover, stored in your own password manager.",
          "Two-factor authentication turned on for the registrar and hosting accounts.",
          "The developer's access removed or reduced to what you choose to keep.",
          "Renewal dates and recovery email addresses checked.",
        ],
      },
      {
        heading: "How Northframe handles it",
        body: [
          `${commonInclusions.ownership} Domain, hosting, and accounts are set up in your name during the Launch step of the process, and the finished code is yours to keep, host, and change. There is no locked platform and no dependency on Northframe to keep the site running.`,
        ],
      },
    ],
    hub: "small-business-websites",
    related: ["domain-hosting-and-website-ownership", "student-organization-website-checklist"],
  },
  {
    slug: "domain-hosting-and-website-ownership",
    title: "Domain, hosting, and website ownership explained",
    description:
      "The difference between owning your domain, your hosting, your code, and your data, and what to check so a website is really yours.",
    h1: "Domain, hosting, and code: what it means to own your website.",
    lead: "Owning a website means four separate things: the domain is registered to you, the hosting account is yours, you have the code, and you control the data the site collects. Many people own one or two of these and only find out about the rest when they want to leave a provider.",
    published: "2026-10-05",
    updated: "2026-10-05",
    sections: [
      {
        heading: "The domain",
        body: [
          "The domain is the address, such as yourname.com. It is rented yearly from a registrar. Whoever is listed as the registrant controls where it points. If a designer registers it in their own account, they control it, even if you paid.",
        ],
      },
      {
        heading: "Hosting",
        body: [
          "Hosting is where the site's files run. The account holder decides when it is updated, moved, or taken down. Website builders bundle hosting with their editor, which is convenient but makes leaving harder.",
        ],
      },
      {
        heading: "The code",
        body: [
          "The code is the site itself. If you have it, any developer can update it or move it to another host. If it only exists inside a builder platform or someone else's account, moving usually means rebuilding.",
        ],
      },
      {
        heading: "The data",
        body: [
          "Form submissions, analytics, and any customer information belong in accounts you control, both for practical reasons and because you are responsible for how they are handled.",
        ],
      },
      {
        heading: "Questions to ask any web designer",
        points: [
          "Whose name will the domain be registered in?",
          "Whose account will host the site?",
          "Will I receive the finished code?",
          "Where will form submissions and analytics go?",
          "What happens if I want to move to another developer?",
        ],
      },
      {
        heading: "Northframe's answer",
        body: [
          `All four stay with you. The domain is registered in your name, hosting and analytics live under your login, and the finished code is yours to keep, host, and change. ${scopeNotes[0]}`,
        ],
      },
    ],
    hub: "small-business-websites",
    related: ["website-handoff-checklist", "how-much-does-a-small-business-website-cost"],
  },
  {
    slug: "how-much-does-a-small-business-website-cost",
    title: "How much does a small business website cost?",
    description:
      "What goes into the cost of a small business website: pages, features, the domain and hosting, and what Northframe charges for each package.",
    h1: "How much does a small business website cost?",
    lead: `The cost of a small business website depends mostly on how many pages it has and what it needs to do. At Northframe, ${priceLine("presence")} for up to ${presence.pages} pages, and ${priceLine("business")} for up to ${business.pages} pages. Both are one-time prices.`,
    published: "2026-10-05",
    updated: "2026-10-05",
    sections: [
      {
        heading: "What drives the price",
        points: [
          "Number of pages, and how different each one is.",
          "Features: contact forms, galleries, booking links, integrations with other services.",
          "Content: whether text and photos are ready or still need to be written and gathered.",
          "Custom functionality such as accounts, databases, or payments, which is closer to building an application.",
          "Rounds of revisions.",
        ],
      },
      {
        heading: "Northframe's packages",
        points: packageTiers.map(
          (t) => `${priceLine(t.id)}: up to ${t.pages} ${t.pages === 1 ? "page" : "pages"}, ${t.revisions} revision ${t.revisions === 1 ? "round" : "rounds"}. ${t.audience}`,
        ),
        body: [
          `Every package includes ${commonInclusions.items.join(", ").toLowerCase()}. ${customTier.name} projects (${customTier.scope.slice(0, 4).join(", ").toLowerCase()} and similar) are quoted by scope.`,
        ],
      },
      {
        heading: "Ongoing costs",
        body: [
          `A site also has running costs paid to other providers: the domain renewal every year, and hosting or email plans if the site needs paid ones. ${scopeNotes[0]}`,
        ],
      },
      {
        heading: "How to keep the cost down",
        points: [
          "Start with the pages visitors actually need, and add more later.",
          "Have your text and photos ready before design starts.",
          "Agree the page list and features in writing before work begins.",
          "Leave logins and payments for a later phase unless the business depends on them.",
        ],
      },
    ],
    faq: [
      {
        q: "Are there monthly fees?",
        a: "Not from Northframe. The package price is one-time. Third-party services such as the domain registrar or a paid email plan bill you directly.",
      },
      {
        q: "What if I need more than the package includes?",
        a: scopeNotes[1],
      },
    ],
    hub: "small-business-websites",
    related: ["what-pages-does-a-small-business-website-need", "domain-hosting-and-website-ownership"],
  },
  {
    slug: "what-pages-does-a-small-business-website-need",
    title: "What pages does a small business website need?",
    description:
      "The pages most small business websites need, what goes on each one, and which ones you can safely leave out at the start.",
    h1: "What pages does a small business website need?",
    lead: "Most small business websites need four or five pages: home, services, about, contact, and often an FAQ. Each one answers a question a visitor already has. Pages that answer nobody's question can wait.",
    published: "2026-10-05",
    updated: "2026-10-05",
    sections: [
      {
        heading: "Home",
        body: [
          "Say what the business does, who it is for, and where it works, in the first screen. Then point to the next step: services, booking, or contact.",
        ],
      },
      {
        heading: "Services",
        body: [
          "One clear section or page per main service, in plain language: what it is, who it suits, and how to get it. If services are very different, give each its own page so each can be found on search.",
        ],
      },
      {
        heading: "About",
        body: [
          "Who runs the business and why. Real names and real photos build more trust than stock images and slogans.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "A short form, plus the details people need: email, phone if you take calls, hours, and location if customers visit.",
        ],
      },
      {
        heading: "FAQ",
        body: [
          "Answer the questions you hear most: prices, timing, what is included, what is not. A good FAQ saves you emails and helps visitors decide.",
        ],
      },
      {
        heading: "Pages that can wait",
        points: [
          "A blog, unless you will actually keep writing.",
          "Testimonials, until you have real ones from real customers.",
          "A careers page, until you are hiring.",
        ],
      },
      {
        heading: "Which Northframe package fits",
        body: [
          `Four or five pages fits the Business package: ${priceLine("business").replace("Business is ", "")}, up to ${business.pages} pages with service, team, and FAQ sections and simple integrations. With three pages or fewer, Presence covers it: ${priceLine("presence").replace("Presence is ", "")}.`,
        ],
      },
    ],
    hub: "small-business-websites",
    related: ["how-much-does-a-small-business-website-cost", "website-handoff-checklist"],
  },
];

export const articleBySlug = (slug: string): Article | undefined => articles.find((a) => a.slug === slug);

/** Latest `updated` date across all guides (sitemap lastmod for /guides). */
export const articlesUpdated = articles.reduce((latest, a) => (a.updated > latest ? a.updated : latest), "");

/** "October 5, 2026" from an ISO date, independent of the server time zone. */
export const formatDate = (iso: string): string =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
