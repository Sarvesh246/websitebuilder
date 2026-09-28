@AGENTS.md

# Northframe: project memory

Read this first every session. Update it at the end of every stage (what was done, files, conventions, what the next stage must know). Roadmap: `docs/ROADMAP.md`.

## What this is
Marketing site for a student-focused web design and development studio. Audience: college students, student orgs, freelancers, small businesses. Working brand name **Northframe** (`northframe.co`), taken from the design reference screenshots and centralised in `src/config/site.ts`. Change it there only.

**No fake social proof, ever.** New business: no client counts, testimonials, reviews, awards, "trusted by" claims. Confidence comes from design quality and clarity.

## Stack
Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 (CSS-first config, no tailwind.config), `motion` (import from `motion/react`), `lucide-react` icons, `clsx`. Fonts via `next/font`: **Figtree** (display/body) and **Nunito** (rounded, labels/badges/small caps text). No backend, auth, or DB yet. Node 24.
Next 16 has breaking changes vs older versions: docs are in `node_modules/next/dist/docs/`. `LayoutProps<"/">` is a generated global type (run `npx next typegen` after adding routes if types are missing).

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run contrast` (WCAG check of token pairs in `scripts/contrast.mjs`; update its table when colour tokens change).

## Design direction (locked)
"Glacier". Light is the default theme: pale cool sky, near-black ink, frosted glass over soft atmospheric light, rendered glass panels and mountain landscapes as artwork (to be created later). **Dark mode is the same world at dusk** (near-black, cool rim light), not a separate section style. The whole page follows one theme, switched by `<html data-theme="light|dark">` (inline script sets it before paint from localStorage `nf-theme`, else system preference). Reference screenshots (pricing, ownership, process, services, work, why, hero) define target layouts.
One accent only (glacier blue). Shape rule: buttons `--radius-sm` 12px, cards `--radius-card` 24px, badges pill only.

## Architecture
```
src/app/            layout.tsx (fonts, theme script, nav, grain), page.tsx (Stage 1 placeholder), design-system/ (noindex living style guide)
src/styles/         tokens.css  all design tokens (colours as light-dark() pairs, type, space, radii, shadows, motion, z-index)
                    theme.css   Tailwind @theme bridge + dark variant
                    base.css / type.css (.t-display .t-h2 .t-h3 .t-h4 .t-lead .t-body .t-small .t-label .t-price)
                    glass.css   glass system      ambient.css  glows/grid/fade/grain/scene
                    ui.css      buttons, icon-btn, badge   nav.css  header + mobile sheet
                    hero.css, mockup.css   pricing.css  packages, Custom panel, comparison, ownership/scope notes
src/components/layout/  Container, Section, SectionHeader, Grid
src/components/ui/      Button, Badge, GlassSurface
src/components/visual/  Ambient (+Glow, GridOverlay, Fade, Grain), SceneImage
src/components/motion/  MotionProvider, Reveal, RevealGroup, RevealItem
src/components/nav/     SiteNav (client), ThemeToggle
src/components/sections/ (Hero, HeroVisual, Pricing) and visual/mockup/ (device frames + concept screens)
src/components/sections/ also WhatWeBuild, WhyNorthframe, Process (Stage 4); src/components/process/ ProcessVisual (server), ProcessTrack (client)
src/styles/         also environment.css (horizon, stone, arc), services.css, why.css, process.css; glass.css has `.glass-slab`
src/components/visual/Horizon.tsx  shared SVG landscape
src/components/pricing/ PackageCard, CustomPackage, CompareTable (server components, all read config/pricing.ts)
src/config/         site.ts, nav.ts, pricing.ts (packages, prices, comparison, ownership + scope copy: single source of truth), services.ts, why.ts, process.ts (Stage 4 copy), work.ts (deferred case-study schema, renders nothing)
src/lib/            cn.ts, motion.ts     src/hooks/  useLockBodyScroll, useScrolledPast
public/images/      scenes/ work/ og/  (see public/images/README.md for asset rules)
```

## Conventions
- **Tokens first.** Never hardcode colours, radii, shadows, spacing in components. Add a token in `tokens.css`. Colours use `light-dark(a, b)`: one declaration per theme pair. Tailwind utilities available via theme.css (`bg-bg`, `text-strong`, `text-muted`, `border-line`, `rounded-card`, ...).
- **Visual styling lives in CSS** (`@layer components` in src/styles), components stay thin wrappers. Tailwind utilities are for layout/one-offs and override component classes.
- **Layout:** every section = `<Section>` (rhythm, positioning context) containing `<Ambient preset=.../>` first, then `<Container>`. Headers use `<SectionHeader>`. Grids use `<Grid cols="two|three|four|split">` (each preset declares its phone fallback). Breakpoints are Tailwind defaults; desktop nav starts at `lg` (1024).
- **Type is fluid** (clamp tokens). Do not add per-breakpoint font sizes. Buttons never wrap: shorten labels. One label per CTA intent ("Start a Project" is the contact/start CTA).
- **Glass** (`GlassSurface` or `.glass*` classes): subtle / default / elevated / feature (+ `interactive`). Needs contrast behind it: always place over `<Ambient/>` or artwork. Falls back to solid for `prefers-reduced-transparency` / no backdrop-filter. Blur is reduced under 768px.
- **Ambient lighting** is static CSS radial gradients only (no big `filter: blur`, no canvas). One global film grain layer in the root layout. Add lighting presets in `Ambient.tsx`, don't hand-place glows per section.
- **Motion:** transform + opacity only, reveal once, don't animate everything. `Reveal` for single elements, `RevealGroup`+`RevealItem` for staggered siblings. Reduced motion handled by `MotionProvider` (`reducedMotion="user"`) and the global block in base.css. Constants in `src/lib/motion.ts` mirror CSS `--dur-*`/`--ease-*`.
- **Icons:** lucide-react only, `strokeWidth` 1.6 to 2, `aria-hidden` when decorative.
- **Client components** only where needed (nav, theme toggle, motion). Everything else is server.
- **Copy:** no em dashes in visible text. No hallucinated stats or testimonials.
- **Artwork:** slots are structural until real art exists. Sections must look complete on CSS lighting alone; art swaps in via `SceneImage` without layout change.

## Stage workflow (run automatically every stage, no user prompting needed)
Goal: same code quality, fewer tokens. Skills are loaded **once per stage, only the ones in that stage's row**. Never load a skill "just in case". A fresh session per stage is fine: this file plus `docs/ROADMAP.md` carry all state.

**BEFORE (pre-flight)**
1. Read `CLAUDE.md` + `docs/ROADMAP.md`. Do only the requested stage; never start the next one.
2. Load that stage's *pre* skills from the table below. Use `/effort` low only for mechanical work, never for design or debugging.
3. Explore with Grep/Glob first; Read only hits, with offset/limit. Broad exploration goes to an `Explore` subagent told to reply in <= 200 words.
4. Design read in one line, then build. Reference screenshots and the design direction above beat generic skill defaults (e.g. taste-skill's "one eyebrow per 3 sections" and theme-lock rules do NOT override the references; its em-dash ban and pre-flight checklist DO apply).

**DURING**
- Edit existing files (never rewrite whole files). Batch independent tool calls in one message. Don't re-read a file after editing it.
- Any browser verification with 3+ calls goes to a `general-purpose` subagent (model sonnet) with a self-contained scenario. It must return <= 200 words plus screenshot paths. Downscale screenshots before viewing: `node C:/Users/sarve/.claude/plugins/cache/ww-w-ai/super-token-saver/3.6.1/scripts/shrink-img.js <file> --maxdim 1000`.
- Dev server: start once in the background, reuse it; `.next` cache stays.

**AFTER (gate, in order)**
1. `npm run lint`, `npm run typecheck`, `npm run build`; `npm run contrast` if colour tokens changed. Fix everything introduced.
2. Browser check at 1440 / 768 / 390, light and dark, plus reduced motion once. Zero console errors. Delete screenshots afterwards.
3. Run that stage's *post* skills from the table (simplify always). Apply fixes, don't just report them.
4. Update this file: replace the "Stage N" status block (do not accumulate history), list files/conventions/notes for the next stage, and tick `docs/ROADMAP.md`.
5. **Commit and push to `main`** (standing authorization from the user, see Git section), only after steps 1-4 are complete and green.
6. Final response follows the Stage 1 format (summary, files, decisions, concerns, roadmap, build status, commit hash, exact next prompt). Then STOP. Do not start the next stage.

| Stage | Pre skills | Post skills |
| --- | --- | --- |
| 2 Shell + hero | `sarvesh-ui-style`, `design-taste-frontend` (sections 0, 4.7, 14 only), `vercel-react-best-practices` | `simplify`, `design:design-critique` (screenshots), `web-design-guidelines` |
| 3 Services | `sarvesh-ui-style`, `design-taste-frontend` | `simplify`, `design:design-critique` |
| 4 Work / process / value | `sarvesh-ui-style`, `design-taste-frontend`, `high-end-visual-design` | `simplify`, `design:design-critique` |
| 5 Pricing + conversion | `sarvesh-ui-style`, `pwp:pwp-api-design` (if an API/route is added) | `simplify`, `security-review` (form/API), `code-review` (medium) |
| 6 Supporting + footer | `sarvesh-ui-style` | `simplify`, `design:ux-copy` (copy audit) |
| 7 Mobile refinement | `sarvesh-ui-style`, `anthropic-skills:pwa-checklist` (touch/viewport parts) | `simplify`, `design:design-critique` at 390 |
| 8 Motion + polish | `sarvesh-ui-style`, `hzblj-skills:ui-motion`, `hzblj-skills:css-animations` | `simplify`, `design:design-critique`, perf spot check |
| 9 A11y / perf / tests | `pwp:pwp-test`, `pwp:pwp-perf` | `design:accessibility-review`, `anthropic-skills:webapp-testing`, `security-review`, `code-review` (high) |
| 10 Final cohesion | `sarvesh-ui-style` | `simplify`, `design:design-critique`, `code-review` (high), `pwp:pwp-deploy` (launch checklist) |

## Git
Remote `origin` = https://github.com/Sarvesh246/websitebuilder.git (branch `main`). **Standing authorization (given by the user 2026-09-28):** at the end of every stage, after all work, validation, and skills have finished and passed, commit and push directly to `main` without asking. This covers stage-completion commits only; any other commit/push (mid-stage, other branches, force-push, history rewrites) still needs an explicit request. Never push if lint/typecheck/build fail. Before committing run `git status` and confirm no `.env*`, secrets, `node_modules`, `.next`, or screenshots are staged. One commit per stage: `feat(stage-N): <summary>`, ending with the Co-Authored-By line from the session attribution reminder. Push with `git push origin main`.

## Stage 1 (Foundation): DONE 2026-09-28
Repo was empty (only `skills-lock.json`). Scaffolded Next 16 app, built the token, type, layout, glass, ambient, motion, button/badge, and nav foundation described above, plus `/design-system` living style guide and Stage 1 placeholder home. Validated: lint, typecheck, contrast script, production build all pass; verified in browser at 1440 and 390 widths, light and dark, mobile menu, reduced motion, zero console errors.

Stage 1 carry-overs still true:
- Nav links are in-page anchors (`#services #process #pricing #about`, CTA `#contact`; `Work` was removed in Stage 4 and returns only via `config/work.ts`); sections must use matching `id`s. Nav is fixed; `scroll-padding-top` accounts for it.
- Mobile menu has no focus trap yet (Escape closes, focus moves in, aria-modal set). Do a proper trap or `inert` on `<main>` in Stage 9.
- Scroll reveals (`Reveal`) start hidden (`data-reveal`); a `<noscript>` style makes them visible without JS.
- `/design-system` is noindex. Keep it as the regression reference; remove or gate before launch if desired.
- Tooling gotcha: user's global PostToolUse hook `lint_edit.py` errors on Windows (`$env:USERPROFILE` not expanded). Harmless, files still write. Not a project issue.

## Stage 2 (Shell + hero): DONE 2026-09-28
Validated: lint, typecheck, production build pass. Browser checked at 1920/1440/1024/768/430/390/375/320: no horizontal overflow (only clipped glow layers exceed viewport, by design), zero console errors, mobile menu opens/closes with Escape, one h1. Light and dark checked at 1440; mobile checked in light only. Reduced motion is verified by CSS gating only (all hero animation is inside `prefers-reduced-motion: no-preference`; the global block in base.css also applies); not emulated in a browser. `contrast` script not re-run (no colour tokens changed).

**Hero copy (in `Hero.tsx`)**: badge "Web design for students and small teams"; h1 "Professional websites without agency prices."; lead "Custom-designed sites for creators, student orgs, and small businesses, with the polish of a product studio."; CTAs "Start a Project" (`#contact`) + "Explore Work" (`#work`); value points "Clear pricing", "Mobile-ready", "You own your site". Note: this exceeds taste-skill's hero cap (badge + value row), deliberately, per the Stage 2 brief. Caption under the visual: "Concept designs, not client work."

**Architecture**
- `components/sections/Hero.tsx` (server): Section id `top` (class `hero`) + `Ambient preset="hero"` + an extra `.hero-stagelight` ambient (two glows behind the visual) + `.hero__grid` (1 col; 0.9fr/1.1fr from lg). Copy uses CSS entrance (`.hero-enter`, stagger via `--i`), NOT the JS `Reveal`, so the h1 paints immediately (LCP).
- `components/sections/HeroVisual.tsx` (client): `.hero-stage` (role="img" + aria-label; contents decorative). Four `Layer`s: back cafe browser, main portfolio browser, creator phone, glass Aa/swatch chip. Desktop-mouse-only pointer parallax via `useMotionValue`/`useSpring`/`useTransform` (no state, no re-render); disabled under reduced motion and for touch/pen. Layer structure: motion div (parallax translate) > `.hero-layer__in.hero-enter` (CSS tilt via `--tilt` + entrance) > optional `.hero-float`.
- `components/visual/mockup/Mockups.tsx` (server): `BrowserMockup`, `PhoneMockup`, and screens `PortfolioScreen`, `CafeScreen`, `CreatorScreen`. Add new concept screens here for Stage 4 work cards if wanted.
- Styles: `styles/hero.css` (layout, entrance, float, stage positions), `styles/mockup.css` (device chrome + screens). Screens use a scoped palette `--m-bg/--m-ink/--m-a...` on `.ms` (artwork colours, intentionally not theme-aware). Screens are designed on a 40em x 30em canvas; font-size is `cqw`, so they scale with the frame.
- Tokens/type added: `--fs-hero` and `.t-hero` (hero h1, one step below display). Body now has a static top sky wash (`--atmos-sky-top` to `--bg` over 60rem) that all sections inherit.
- Nav: unchanged structure; added frame logo mark (`.site-nav__mark`, accent corner nudges on hover). Nav config unchanged (Work, Services, Process, Pricing, About; CTA "Start a Project").
- Metadata: `siteConfig.tagline` + new description; title `Northframe | Professional websites for students and small teams`.

**Responsive**: below 640px the stage shows only main browser (90%) + phone (31%) + chip (back browser hidden; stage aspect 1/0.98); CTAs stack full width. 640+ shows all four layers. Floats only at 768+ and no reduced motion.

**Motion**: entrance (CSS, once), pointer parallax (desktop mouse), two slow floats (phone, chip). Nothing else loops.

**Known limitations / next stages must know**
- `#work`, `#process`, `#about`, `#contact` have no targets yet (`#pricing` exists since Stage 3); nav and CTAs are inert until Stages 4-6. Section ids must match.
- Mockups are CSS-built concept screens (no images). Real artwork (Stage 8) can replace them via `SceneImage`; the hero-stage box does not change.
- Container caps at 1344px, so at 1920 the hero sits centred with wide side margins (fine, consistent).
- Mobile menu focus trap still Stage 7/9. Dev launch config at `.claude/launch.json`.
- Stage 3 must keep: `Section`/`Container`/`Ambient` pattern, `id`s, one label per CTA intent, no fake proof, no em dashes.

## Stage 3 (Packages + pricing): DONE 2026-09-28
Scope note: the user's Stage 3 brief replaced the roadmap's "Services" stage. There is **no separate Services section**; the four packages are the services. One section, `id="pricing"`, serves the single **Pricing** nav link (the "Services" nav link and `#services` anchor were removed to avoid duplicate content). Roadmap Stage 5 now covers only the contact/conversion flow.
Validated: lint, typecheck, production build pass; no test runner exists yet (Stage 9). Checked with playwright-core (the MCP browser was busy) at 1920/1440/1280/1024/768/430/390/375/320: zero horizontal overflow, zero console errors, all reveals fire (also with reduced motion at 375), nav link scrolls to `#pricing`, all 4 CTAs 44px tall, light and dark at 1440, light at 1024/768/390. Mobile comparison `<details>` opens.

**Packages (names/prices in `config/pricing.ts`, change only there)**
| Package | Price shown | Regular | For | Includes |
| --- | --- | --- | --- | --- |
| Starter | $50 flat, "One-time price" | none | student portfolios and resumes | 1-page custom design, projects/resume sections, mobile responsive, contact + social links, domain + deployment setup, 1 revision |
| Plus (featured) | $200 "Launch price" | $350 | creators, freelancers, student orgs | Everything in Starter, plus up to 3 pages, project/gallery sections, contact form, SEO + analytics setup, enhanced animations, 2 revisions |
| Pro | $350 "Launch price" | $500 | organizations, small businesses | Everything in Plus, plus up to 5 pages, service/team/event pages, forms + simple integrations, CMS support where it fits, advanced UI/interactions, 3 revisions |
| Custom | "Request a quote" (no number unless decided later) | n/a | complex projects | Quoted by scope: authentication, databases, dashboards, payments, admin panels, APIs, advanced integrations, custom functionality |

Backend/auth/db/payments are explicitly NOT in Starter/Plus/Pro (only "simple integrations" in Pro).

**Launch pricing language**: label "Launch price" on the card, "Regularly $350" with struck `<del>`. Section note (`launchPricing` in config): "Intro pricing while the studio builds its first client portfolio. Regular prices apply once launch pricing ends." No countdowns, no scarcity, no "most popular".
**Featured logic**: Plus is emphasised as "Best value" (factual, not a sales claim): `glass-feature` surface, "Best value" badge with icon, filled primary CTA, tinted comparison column. Set with `featured: true` + `badge` in config. Not colour-only.
**Copy rules kept**: no em dashes, no fake proof. CTA labels: "Choose Starter/Plus/Pro", "Request a quote". Microcopy under each CTA is a per-package `note` (avoid invented timelines/policies).

**Architecture**
- `components/sections/Pricing.tsx` (server): Section `#pricing` (aria-labelledby `pricing-title`) + `Ambient preset="pricing"`. Order: intro row (SectionHeader + launch note, 7/5 at lg), then a `RevealGroup` holding the Grid `packages` of `PackageCard`s and the `CustomPackage`, then `CompareTable`, then ownership panel + "Good to know" scope notes.
- `PackageCard`: `GlassSurface as="article"` (feature variant when featured). CSS grid areas `head` (name, badge, blurb, price block), `body` (audience, lead-in, features), `foot` (CTA + note). Price block is always label / number / sub so cards align. Price a11y: reads "Launch price $200 Regularly $350" (`<del>`); CTA aria-label includes package + price.
- `CustomPackage`: quieter `glass-subtle` wide panel under the three cards (intro, chip list of scope, CTA), so "priced by scope" reads as a different kind of offer, not a fourth price card.
- `CompareTable`: 9 decision-relevant rows from `compareRows` (values order = starter, plus, pro, custom). md+: real `<table>` (sr-only caption, `th scope`, featured column tinted, check/minus icons have sr-only text). Phones: collapsed `<details>` with per-row 2x2 `<dl>` (no horizontal scroll). Footnote lists what every package includes.
- `Grid` got a `packages` preset (1 col, 3 at lg). `SectionHeader` got `titleId`. Card hover is a 3px lift + firmer border (cards are not links, so no pointer cursor and not `glass-interactive`).
- `/design-system` pricing block now renders `PackageCard` + `CustomPackage` (old "Most Popular" badge removed).

**Responsive**: below md stacked cards (tier order stays Starter, Plus, Pro, Custom; recommended package is not reordered); md to lg each card is a wide two-column card (head + CTA left, list right), one per row; lg+ three cards in a row plus a full-width Custom panel. Blurb and audience line have min-heights at lg so price blocks and lists align (revisit if copy lengths change).
**Scope + ownership messaging**: "You own your site and accounts." panel (hosting, domain, email, analytics, database, logins live under the client's name). "Good to know": domain costs extra if not owned; paid third-party services have their own fees; scope beyond the package is re-priced and approved first.
**CTA behaviour**: every CTA is `href="#contact"` with `data-package="starter|plus|pro|custom"`. `#contact` does not exist yet. Stage 5 builds it and can read `data-package` (or add a `?package=` param) to preselect.
**Stage 4 must preserve**: the single `#pricing` anchor (no Services duplicate), package names/prices from config only, no "most popular" claim, the `Section > Ambient > Container` pattern, and Reveal patterns (never put `RevealGroup` on a `display: contents` element: IntersectionObserver needs a box). `#work` and `#process` are still inert nav targets; when they land, move `<Pricing/>` in `page.tsx` after them.
Tooling tip: `playwright-core` with `chromium-1243` under `%LOCALAPPDATA%/ms-playwright` works from a scratch dir when the Playwright MCP is busy.

## Stage 4 (What we build, Why Northframe, Process): DONE 2026-09-28
Page order: Hero, `#services` What we build, `#about` Why Northframe (temporary About target), `#process`, `#pricing` (contains the Stage 3 ownership panel, unchanged).
Validated: lint, typecheck, production build pass; no test runner yet (Stage 9). Checked with playwright (global, chromium at /opt/pw-browsers/chromium) at 1920/1440/1280/1024/768/430/390: zero horizontal overflow, zero console errors, all four anchors resolve, reduced motion checked at 1280 dark. `#contact` still has no target (Stage 5), so "Start a Project" is inert as before.

**Selected Work is intentionally NOT public.** No client work is approved yet and personal projects (Datebook, ParkPoint) must not stand in for it. The old `#work` nav link was removed (it had no section anyway). `config/work.ts` holds the future `CaseStudy` type (client, category, summary, services, desktop/mobile screens, projectUrl, detailHref, testimonial, results with source, `permission: pending|approved|declined`), an empty `caseStudies` array, `publicCaseStudies` (approved only) and `showSelectedWork`. `config/nav.ts` adds "Work" only when `showSelectedWork` is true, so no dead anchor. When real work exists: add entries, build a `#work` section (floating dimensional browser panels with refractive glass framing, architectural environment, depth/perspective, desktop + mobile views, asymmetric editorial layout using `.glass-slab` + `Horizon` + `BrowserMockup`/`PhoneMockup`), render only `publicCaseStudies`, add testimonials/results only when real. Never publish placeholder content.

**Copy (config/services.ts, why.ts, process.ts, change only there)**
- What we build: eyebrow "What we build", h2 "What we build.", lead "From a straightforward portfolio to a more custom digital experience." Categories: Personal (students, resumes, portfolios, personal sites), Professional (creators, freelancers, independent professionals, personal brands), Business (organizations, student organizations, small businesses, teams), Custom (authenticated experiences, database-backed projects, dashboards, integrations). Each has the approved one-line description. Panels link to `#pricing`; no prices here.
- Why Northframe: "Good work deserves more than a template." / "Your website should feel like an extension of what you're building, not something you settled for." / "Intentional design, clear structure, and a stronger online presence." plus four points (Custom visual direction, Clear structure, Responsive by default, Yours to keep). No template-bashing, no unverifiable claims.
- Process: "A clear process." / "From first direction to final launch, every step has a purpose." 01 Define, 02 Design, 03 Build, 04 Launch with the approved step copy.

**Environment and material system (new, reuse it)**
- `Horizon` (SVG, static): layered far/mid ridges plus a lit facet on each right-hand slope (light always from the upper right). Variants `wide` and `a-d` (panel fragments). Colours are `--mtn-*` tokens. `.horizon-band` pins it to a section bottom with a fade into the page colour. `.stone` = platform, `.arc` = one faint arc. Ambient presets added: `build`, `scene`, `flow`. `.why` uses a soft deeper-tone band that fades in and out (no seams).
- `.glass-slab` (glass.css, tokens `--slab-*`): lit bevel, edge-thickness band, inner base shade, specular streak, grounded shadow. Use on a few hero objects only (service panels, process frames, floating concept panels). Reduced-transparency and no-backdrop fallbacks included.
- No raster art was added; nothing to optimise. `public/images` unchanged.

**Responsive**: Services: 1 col phones, 2 cols at sm, 4 tall slabs at lg (rise 1.75rem each, rotateY up to ~4deg, per-item perspective so text stays flat). Why: copy then main browser then two small panels on phones (phone mock, ridge, arc, stone hidden); md+ full floating composition bleeding right. Process: vertical rail below md; visual + text side by side md-xl; four columns on subgrid rows at xl (nodes share a baseline, later visuals sit higher), connectors draw left to right. Mockups are decorative (`aria-hidden` / `role="img"`).
**Motion**: reveal once (existing Reveal/RevealGroup), process steps stagger and connectors scale in (`ProcessTrack`), slab hover lift, Why floating panels drift via CSS scroll-driven animation (md+, only with `animation-timeline` support and no reduced motion). No loops, no JS parallax.
**Performance**: 4 blurred slabs + 4 process frames + 2 Why panels, each in a different viewport; blur reduced on phones; SVG landscape only.

**Ownership final treatment (NOT built yet; the Stage 3 panel in Pricing stays)**: dark cinematic environment. Eyebrow "OWNERSHIP"; h2 "Built for you. Owned by you."; "Your website, domain, accounts, and data stay under your control."; items Your domain / Your code / Your accounts / Your data; secondary "No locked platform. No mystery credentials. No dependency on Northframe to keep your site running." Visual: dark architectural environment, large refractive browser panel, dramatic edge lighting, reflective stone platform, minimal cool highlights.

**Known limitations**: `#contact` missing (Stage 5). Slab tilt/rise is subtle. Ridge facets are low-poly and read as a placeholder for real landscape art. Slab links all go to `#pricing`. Why concept screens reuse fictional demo names inside mockups (labelled concept, not client work). No case-study section, No Work nav. Nav order (Services, Process, Pricing, About) differs from page order because About currently targets Why (section 2).

**FINAL VISUAL POLISH stage must address**: stronger architectural/mountain environmental continuity (real art replacing SVG ridges); more physical/refractive glass and better edge highlights; stronger foreground/midground/background depth; reflective stone/concrete materials; consistent lighting direction; more asymmetrical, cinematic spatial layouts; seamless section transitions; removal of remaining generic SaaS patterns (pricing cards, comparison table, hero mockups); final matching against the approved reference imagery; the dark cinematic Ownership section above; Selected Work only once real approved client work exists.
