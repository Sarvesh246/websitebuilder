/**
 * Copy for the FAQ and the four audience guides. Package names and prices are never typed here: they are
 * read from config/pricing.ts (`priceLine`), so a price change cannot leave a guide out of date.
 * Voice: "Northframe" in the third person, "you" for the reader. No client counts, ratings or timelines.
 */
import {
  commonInclusions,
  customTier,
  foundingLabel,
  foundingPricing,
  packageTiers,
  scopeNotes,
  type PackageId,
  type PackageTier,
} from "@/config/pricing";

/** Date the guides were last revised (sitemap lastmod). Bump when any text below changes. */
export const guidesUpdated = "2026-10-05";

const tier = (id: Exclude<PackageId, "custom">): PackageTier => {
  const found = packageTiers.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown package: ${id}`);
  return found;
};

/** "Launch is $49 (student pricing, regularly $99)" built from the pricing config. */
export const priceLine = (id: Exclude<PackageId, "custom">): string => {
  const t = tier(id);
  if (t.regularPrice === undefined) return `${t.name} is $${t.price}`;
  const label = t.priceLabel ? t.priceLabel.toLowerCase() : foundingLabel;
  return `${t.name} is $${t.price} (${label}, regularly $${t.regularPrice})`;
};

export type GuideFaq = { q: string; a: string };

export type GuideSection = {
  heading: string;
  /** Paragraphs. */
  body?: readonly string[];
  /** Short bullet list shown under the paragraphs. */
  points?: readonly string[];
};

export type AudienceGuide = {
  slug: string;
  /** Footer link text. */
  label: string;
  /** Page <title> before " | Northframe". */
  title: string;
  /** Meta description, about 150 characters. */
  description: string;
  h1: string;
  lead: string;
  sections: readonly GuideSection[];
  /** The package that usually fits this audience, and one sentence on why. */
  recommended: { id: Exclude<PackageId, "custom">; why: string };
  faq: readonly GuideFaq[];
  /** Slugs of other guides to link at the foot. */
  related: readonly string[];
};

export const audienceGuides: readonly AudienceGuide[] = [
  {
    slug: "web-design-for-students",
    label: "Web design for students",
    title: "Web design for students",
    description:
      "A custom portfolio or resume website for students: one polished page on your own domain, designed around your work, with clear student pricing.",
    h1: "Web design for students, priced for a student budget.",
    lead: "A personal site gives recruiters, professors, and admissions readers one place to see your work. Northframe designs a custom one for students, built around your projects and kept under your own name.",
    sections: [
      {
        heading: "What a student site needs",
        body: [
          "Most student sites do a small number of jobs, and do them well. Visitors should see your strongest work first, understand who you are in a few lines, and know how to reach you.",
        ],
        points: [
          "Your best projects, each with a short description of what you made and your part in it.",
          "A resume or experience section that reads quickly on a phone.",
          "Clear contact details and links to profiles such as GitHub or LinkedIn.",
          "A layout that works on phones, because links are often opened there first.",
        ],
      },
      {
        heading: "One page, done properly",
        body: [
          "The Launch package is a single custom-designed page: projects, resume, and a contact section. It is deliberately small, which is what keeps the price low and the result focused.",
          "If you have case studies, a freelance side business, or a lot of work to show, the Presence package adds up to three pages, a contact form, and SEO and analytics setup.",
        ],
      },
      {
        heading: "It stays yours after graduation",
        body: [
          "Your domain is registered in your name, the finished code is yours to keep, and hosting and analytics live under your own login. The site is not tied to a school account or a template platform, so it still works for you after you leave campus.",
        ],
      },
    ],
    recommended: {
      id: "launch",
      why: "One custom page for your projects, resume, and contact details, which is what most student sites need.",
    },
    faq: [
      {
        q: "Is Launch only for students?",
        a: "Launch is priced as student pricing and built for student portfolios and resumes. If your project is something else, such as a creator site or an organization, Presence or Business is usually a better fit.",
      },
      {
        q: "Do I need finished text and photos before I start?",
        a: "No. The first step of the process is agreeing goals, pages, and content before any design starts, so you can begin with rough notes and a list of projects.",
      },
      {
        q: "Can I change the site myself later?",
        a: "Yes. The finished site is yours to keep, host, and change. Northframe sets hosting up under your login, so you are not dependent on the studio to keep it online.",
      },
    ],
    related: ["portfolio-websites-for-creators", "student-organization-websites"],
  },
  {
    slug: "student-organization-websites",
    label: "Student organization websites",
    title: "Student organization websites",
    description:
      "A clear, custom website for your student club or organization: about, events, team, and a way to get in touch, owned by the organization, not one officer.",
    h1: "Websites for student organizations that outlast their officers.",
    lead: "Clubs change leadership every year, and a site tied to one person's account tends to be lost with them. Northframe builds organization sites that are easy to hand over: clear pages, simple forms, and accounts you control.",
    sections: [
      {
        heading: "What a club site usually needs",
        body: [
          "Most organization sites answer the same questions for the same people: new students, current members, and anyone who wants to work with the group.",
        ],
        points: [
          "What the organization is and who it is for.",
          "Upcoming and past events on a page that is easy to keep current.",
          "Officers or team members, so people know who to contact.",
          "A simple way to join or get in touch.",
        ],
      },
      {
        heading: "Built for handover",
        body: [
          "Hosting, analytics, and the domain are set up under a login your organization controls. Registering them with a shared organization email, rather than one officer's personal address, means the next board can take over without chasing anyone down.",
          "The finished code is yours to keep, so a future officer or developer can update it without starting over.",
        ],
      },
      {
        heading: "Which package fits",
        body: [
          "The Business package covers up to five pages, including service, team, or event pages, plus simple integrations and forms. A smaller club that only needs a few pages can start with Presence, which covers up to three.",
          "Member logins, dues, or online payments go beyond a website and are quoted under the Custom package instead.",
        ],
      },
    ],
    recommended: {
      id: "business",
      why: "Up to five pages with event and team pages and simple forms, enough for most club and organization sites.",
    },
    faq: [
      {
        q: "What happens when our officers change?",
        a: "Because the domain, hosting, and analytics sit under accounts your organization controls, handover is a matter of passing on access to those accounts. Using a shared organization email for them makes it simpler still.",
      },
      {
        q: "Can the site collect dues or run member logins?",
        a: "Not within the fixed packages. Logins, databases, and payments are scoped and quoted separately under Custom, after a short conversation about what you need.",
      },
      {
        q: "Can we start smaller and grow?",
        a: "Yes. A smaller club can start with Presence, which covers up to three pages. Work beyond a package is re-priced and approved by you before it begins.",
      },
    ],
    related: ["small-business-websites", "web-design-for-students"],
  },
  {
    slug: "small-business-websites",
    label: "Small business websites",
    title: "Small business websites",
    description:
      "Custom websites for small businesses: service and team pages, a contact form, SEO and analytics setup, and full ownership of your domain and accounts.",
    h1: "Small business websites without the agency price tag.",
    lead: "A small business site has to do a few things well: explain what you offer, build trust, and make it easy to get in touch. Northframe designs and builds custom sites with clear pricing, and you own everything when it is done.",
    sections: [
      {
        heading: "What the site is there to do",
        body: [
          "Visitors usually arrive with one question: can this business help me, and how do I reach it? The pages are planned around that, not around filling space.",
        ],
        points: [
          "A clear page for each main service, in plain language.",
          "A team or about page so people know who they are dealing with.",
          "A contact form and the details people need to follow up.",
          "FAQ and testimonial sections, where you have real content for them.",
        ],
      },
      {
        heading: "Found on search, not just shared",
        body: [
          "Presence and Business both include SEO setup and analytics: sensible page titles and descriptions, a clean structure, and analytics so you can see how the site is used. This helps search engines understand the site. It is not a promise of any particular ranking, which nobody can honestly make.",
        ],
      },
      {
        heading: "No lock-in",
        body: [
          "Your domain, hosting, and analytics live under your own logins, and the finished code is yours. Domain registration and paid third-party services, such as premium hosting or email plans, are billed separately where required.",
          "If a request goes beyond your package, the price is updated and you approve it before work continues.",
        ],
      },
    ],
    recommended: {
      id: "business",
      why: "Up to five pages with service, team, and FAQ sections, plus simple integrations and forms.",
    },
    faq: [
      {
        q: "Can I sell products on the site?",
        a: "Online payments and stores are outside the fixed packages. They are scoped and quoted under Custom, along with accounts, databases, and API integrations.",
      },
      {
        q: "Will the site show up on Google?",
        a: "Presence and Business include SEO setup and analytics, which gives search engines a clean, well-labelled site to read. No ranking is promised. Results depend on your content, your competition, and time.",
      },
      {
        q: "Who owns the domain and the code?",
        a: "You do. The domain is registered in your name, the finished code is yours to keep, and hosting and analytics sit under your login.",
      },
    ],
    related: ["student-organization-websites", "portfolio-websites-for-creators"],
  },
  {
    slug: "portfolio-websites-for-creators",
    label: "Portfolio websites for creators",
    title: "Portfolio websites for creators",
    description:
      "Custom portfolio websites for designers, photographers, and freelancers: galleries, a contact form, and SEO setup, designed around your work.",
    h1: "Portfolio websites for creators who want their work to lead.",
    lead: "If you make things for a living, or want to, your site is the work. Northframe designs portfolio sites for designers, photographers, freelancers, and other creators, with layouts built around your pieces instead of a generic template.",
    sections: [
      {
        heading: "Your work first",
        body: [
          "A good portfolio shows the work quickly, lets people dig into a project if they want to, and then makes the next step obvious: getting in touch.",
        ],
        points: [
          "Galleries and project pages laid out around your images, not squeezed into a template.",
          "A contact form so enquiries reach you without sending people to a social profile.",
          "Enhanced animations that add polish to how the work is presented.",
          "SEO setup and analytics, so you can see who is looking and from where.",
        ],
      },
      {
        heading: "How many pages do you need?",
        body: [
          "The Presence package covers up to three pages, which suits a home page, a work or gallery page, and an about or contact page. Just starting out with a smaller body of work? The one-page Launch package is a good first step, and you can move up later.",
        ],
      },
      {
        heading: "Owned by you",
        body: [
          "Your domain is registered in your name, and your hosting and analytics sit under your own logins. If you move platforms or work with a different developer later, nothing is held hostage.",
        ],
      },
    ],
    recommended: {
      id: "presence",
      why: "Up to three pages with galleries, a contact form, and SEO and analytics setup, which suits most creators and freelancers.",
    },
    faq: [
      {
        q: "Can clients book or pay through my site?",
        a: "Bookings with payments, and client logins, go beyond a standard portfolio site. They are scoped and quoted under Custom after a short conversation.",
      },
      {
        q: "Can I use my own domain?",
        a: "Yes. Every package includes domain setup help, and the domain is registered in your name.",
      },
      {
        q: "What if I only have a few projects so far?",
        a: "Start with Launch, a single focused page, and move to Presence when your body of work grows. The portfolio is built around the work you have today.",
      },
    ],
    related: ["web-design-for-students", "small-business-websites"],
  },
];

export const guideBySlug = (slug: string): AudienceGuide => {
  const guide = audienceGuides.find((g) => g.slug === slug);
  if (!guide) throw new Error(`Unknown guide: ${slug}`);
  return guide;
};

/** Home link plus every guide, in footer order. */
export const guideLinks = [
  { label: "FAQ", href: "/faq" },
  ...audienceGuides.map((g) => ({ label: g.label, href: `/${g.slug}` })),
] as const;

export type FaqGroup = { title: string; items: readonly GuideFaq[] };

const publicPrices = `${priceLine("launch")}, ${priceLine("presence")}, and ${priceLine("business")}. Custom projects are quoted by scope.`;

export const faqPage = {
  title: "Frequently asked questions",
  description:
    "Answers about Northframe's web design packages, pricing, process, payments, revisions, and ownership, including what each package includes.",
  h1: "Questions, answered plainly.",
  lead: "What Northframe builds, what it costs, how a project runs, and what you own at the end. If something is missing, the project request form is the quickest way to ask.",
  groups: [
    {
      title: "Packages and pricing",
      items: [
        {
          q: "How much does a website cost?",
          a: `${publicPrices} Prices are one-time, not monthly.`,
        },
        {
          q: "What is Founding Client Pricing?",
          a: `${foundingPricing.body} Launch is priced separately as student pricing.`,
        },
        {
          q: "Which package should I choose?",
          a: `Launch suits student portfolios and resumes. Presence suits creators and professionals who need up to three pages. Business suits organizations and small businesses that need up to five. ${customTier.name} is for projects with accounts, databases, payments, or other custom functionality.`,
        },
        {
          q: "What does every package include?",
          a: `${commonInclusions.items.join(", ")}. ${commonInclusions.ownership}`,
        },
        {
          q: "What is not included?",
          a: `Logins, databases, and payments are not part of Launch, Presence, or Business, and are quoted under Custom. ${scopeNotes[0]}`,
        },
        {
          q: "What if I need more than my package includes?",
          a: scopeNotes[1],
        },
      ],
    },
    {
      title: "How a project works",
      items: [
        {
          q: "What does the process look like?",
          a: "Four steps, in order. Define: goals, pages, and content are agreed before any design starts. Design: layout, type, and color take shape around your content. Build: the design becomes a fast, responsive site you can review. Launch: domain, hosting, and accounts are set up in your name.",
        },
        {
          q: "How long will it take?",
          a: "It depends on the package and how quickly content and feedback come back. No fixed turnaround is promised in advance. The request form asks for your timeline, and it is discussed before work starts.",
        },
        {
          q: "How do I start?",
          a: "Send a short project request. It asks about your project, the package you are interested in, and how to reach you. Sending a request has no cost and no commitment. You need an account so you can follow the project and pay for it in the client portal.",
        },
        {
          q: "How many revisions do I get?",
          a: "Launch includes 1 revision round, Presence 2, and Business 3. Custom projects are scoped individually.",
        },
      ],
    },
    {
      title: "Payments",
      items: [
        {
          q: "How do payments work?",
          a: "Payments go through Stripe. Launch is paid in full at the start. Presence and Business are split: half at the start, and the remaining balance after the included revision stage. Launch, transfer, and delivery of the finished site happen after the remaining balance is paid.",
        },
        {
          q: "Can I cancel?",
          a: "You can request to cancel within three calendar days of the initial purchase, as set out in the terms. After that, the initial payment may become non-refundable. The terms have the full wording.",
        },
      ],
    },
    {
      title: "Ownership",
      items: [
        {
          q: "Who owns my website?",
          a: "You do. Your domain is registered in your name, the finished code is yours to keep, host, and change, and hosting, analytics, and email live under your own logins. There is no locked platform and no dependency on Northframe to keep your site running.",
        },
        {
          q: "Will my site show up on Google?",
          a: "Presence and Business include SEO setup and analytics, which helps search engines read the site. No ranking is promised, because results depend on your content, your competition, and time.",
        },
      ],
    },
    {
      title: "About Northframe",
      items: [
        {
          q: "Who builds the site?",
          a: "Northframe is an independent web design and development studio, built by Sarvesh, an engineering student and developer.",
        },
      ],
    },
  ],
} satisfies { title: string; description: string; h1: string; lead: string; groups: readonly FaqGroup[] };
