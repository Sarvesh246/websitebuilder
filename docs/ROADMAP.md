# Development roadmap

Each stage: read `CLAUDE.md` first, update it last. Do not start the next stage until asked.

| Stage | Scope | Status |
| --- | --- | --- |
| 1 | Foundation: tokens, type, layout, glass, ambient, motion, buttons/badges, nav shell, style guide | Done |
| 2 | Global shell and hero: page frame, real hero composition (desktop + purpose-built mobile), first artwork slot, hero motion | Done |
| 3 | Packages + pricing (replaces Services): Starter/Plus/Pro/Custom cards, comparison, launch pricing, ownership + scope notes, CTAs to `#contact` | Done |
| 4 | Portfolio ("Selected Work"), Process (four steps), value sections ("Why", "Ownership") | |
| 5 | Conversion flow (pricing section already built in Stage 3): contact/start-a-project form (`#contact`), validation, submission approach (decision needed: email service / form backend) | |
| 6 | Supporting sections and footer: About, FAQ (only real content), footer, legal stubs | |
| 7 | Mobile-specific refinement: per-section small-screen compositions, touch targets, menu focus trap, performance on low-end phones | |
| 8 | Motion and visual polish: hero choreography, scroll depth, hover refinement, real artwork integration, both themes | |
| 9 | Accessibility, performance, testing: keyboard/screen-reader pass, contrast, Lighthouse (LCP/CLS/INP), Playwright smoke tests, SEO/OG, analytics decision | |
| 10 | Final cohesion pass: copy audit (no fake proof, no em dashes), spacing/type rhythm across all sections, remove or gate `/design-system`, launch checklist | |

Open decisions to resolve before the stage that needs them: brand name and domain (Stage 2), artwork sourcing/generation (Stage 2 and 8), contact form backend (Stage 5), analytics provider (Stage 9).
