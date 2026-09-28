# Development roadmap

Each stage: read `CLAUDE.md` first, update it last. Do not start the next stage until asked.

| Stage | Scope | Status |
| --- | --- | --- |
| 1 | Foundation: tokens, type, layout, glass, ambient, motion, buttons/badges, nav shell, style guide | Done |
| 2 | Global shell and hero: page frame, real hero composition (desktop + purpose-built mobile), first artwork slot, hero motion | Done |
| 3 | Packages + pricing (replaces Services): Starter/Plus/Pro/Custom cards, comparison, launch pricing, ownership + scope notes, CTAs to `#contact` | Done |
| 4 | Portfolio ("Selected Work"), Process (four steps), value sections ("Why", "Ownership") | |
| 5 | Conversion flow: `/start` multi-step inquiry, validation, `/api/inquiry` + Resend email delivery, spam protection | Done |
| 6 | Supporting sections and footer: About, principles, final CTA, footer, Privacy + Terms, 404, metadata/SEO (FAQ skipped: no real content) | Done |
| 7 | Responsive + mobile pass: safe areas, nav focus trap, section rhythm, compact mobile pricing, touch targets, overflow audit (Stage 4 sections still missing) | Done |
| 8 | Art direction: environment system, glass rebuild, hero, Services/Why/Process/Ownership scenes, pricing platform, About, final CTA (Stage 4 sections built here) | Done |
| 9 | Accessibility, performance, testing: keyboard/screen-reader pass, contrast, Lighthouse (LCP/CLS/INP), Playwright smoke tests, SEO/OG, analytics decision | Done |
| 10 | Final cohesion pass: copy audit (no fake proof, no em dashes), spacing/type rhythm across all sections, remove or gate `/design-system`, launch checklist | Partial: Ownership visual transformation done; launch audit still open |
| 11 | Pricing clarity + conversion: Launch/Presence/Business/Custom naming, Founding Client Pricing, shared inclusions, comparison, CTA wording, preselection | Done |

Open decisions to resolve before the stage that needs them: brand name and domain (Stage 2), artwork sourcing/generation (Stage 2 and 8), contact form backend (Stage 5), analytics provider (Stage 9).
