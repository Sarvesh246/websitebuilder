# Northframe

Marketing site and project inquiry flow for a student-focused web design studio. Next.js 16 (App Router), React 19, Tailwind v4, Motion. Node 24.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values, see below
npm run dev                  # http://localhost:3000 (style guide at /design-system, noindex)
```

## Checks

```bash
npm run lint
npm run typecheck
npm run contrast             # WCAG check of colour token pairs
npm run build && npm start   # production build
```

There is no automated test runner yet. The inquiry API can be tested locally by pointing `RESEND_API_BASE` at a mock server.

## Environment variables

Documented in `.env.example`. Required for the inquiry form to deliver: `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL` (sender domain must be verified in Resend). Set before launch: `NEXT_PUBLIC_SITE_URL` (real origin, used at build time for canonicals, Open Graph, sitemap, robots), `NEXT_PUBLIC_CONTACT_EMAIL`. Never commit `.env*`.

## Deployment

Built for Vercel (`VERCEL_ENV=preview` disables indexing) but runs anywhere Node runs. Set the env vars for the Production environment, then redeploy so `NEXT_PUBLIC_*` values are baked in. Add a platform firewall/rate rule for `/api/inquiry`; the built-in limiter is per instance.

Project memory, architecture and conventions: `CLAUDE.md`. Roadmap: `docs/ROADMAP.md`.
