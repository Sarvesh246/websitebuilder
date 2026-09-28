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
src/components/layout/  Container, Section, SectionHeader, Grid
src/components/ui/      Button, Badge, GlassSurface
src/components/visual/  Ambient (+Glow, GridOverlay, Fade, Grain), SceneImage
src/components/motion/  MotionProvider, Reveal, RevealGroup, RevealItem
src/components/nav/     SiteNav (client), ThemeToggle
src/components/sections/ (Hero, HeroVisual) and visual/mockup/ (device frames + concept screens); pricing/ later
src/config/         site.ts, nav.ts, pricing.ts (pricing is data; single source of truth)
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
- Nav links are in-page anchors (`#work #services #process #pricing #about`, CTA `#contact`); sections must use matching `id`s. Nav is fixed; `scroll-padding-top` accounts for it.
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
- `#work`, `#services`, `#process`, `#pricing`, `#about`, `#contact` have no targets yet; nav and CTAs are correct but inert until Stages 3-6. Section ids must match.
- Mockups are CSS-built concept screens (no images). Real artwork (Stage 8) can replace them via `SceneImage`; the hero-stage box does not change.
- Container caps at 1344px, so at 1920 the hero sits centred with wide side margins (fine, consistent).
- Mobile menu focus trap still Stage 7/9. Dev launch config at `.claude/launch.json`.
- Stage 3 must keep: `Section`/`Container`/`Ambient` pattern, `id`s, one label per CTA intent, no fake proof, no em dashes.
