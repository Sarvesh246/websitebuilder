# Northframe

Website for Northframe, a small web design studio. It has the public marketing site, a project-request form, and a client and admin portal where clients follow a project, give feedback on previews, and pay through Stripe.

## Prerequisites

- Node.js 24 and npm
- A Supabase project (Postgres and Auth) for the request form and portal
- A Stripe account (test mode is fine) for payments
- Optional: a Resend account for email notifications

The marketing pages render without any of the services above. The request form, sign-in and payments need the environment variables below.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values you need
npm run dev                  # http://localhost:3000
```

Apply the SQL files in `supabase/migrations/` in filename order (Supabase SQL editor or CLI). To make an account an admin, set its `role` to `admin` in `public.profiles`.

To browse the portal without Supabase, start the dev server with `PORTAL_DEMO=1`. It serves fixtures and is ignored in production builds.

To test payments locally, forward Stripe webhooks to the app:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Environment variables

Copy `.env.example` for the full annotated list. Never commit `.env.local`.

| Variable                                                    | Required       | Purpose                                                          |
| ----------------------------------------------------------- | -------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes     | Supabase client. Inlined at build time, so rebuild after changing |
| `SUPABASE_SERVICE_ROLE_KEY`                                 | Yes            | Server-only writes (requests, payments, portal actions)          |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                | For payments   | Hosted Checkout and webhook verification                         |
| `CRON_SECRET`                                               | For payments   | Bearer token for the daily `/api/cron/payments` reconciliation   |
| `NEXT_PUBLIC_SITE_URL`                                      | Before launch  | Canonical URLs, sitemap, Open Graph, Stripe return URLs          |
| `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL`             | No             | Email notifications. Requests are stored even without them       |
| `NEXT_PUBLIC_CONTACT_EMAIL`                                 | No             | Public contact address for the footer and legal pages            |
| `STRIPE_AUTO_REFUND_DUPLICATES`                             | No             | Set to `off` to flag duplicate payments instead of refunding     |
| `POSTHOG_LOGS_KEY`, `POSTHOG_HOST`                          | No             | Ship server error logs to PostHog over OpenTelemetry             |
| `BING_SITE_VERIFICATION`                                    | No             | Bing Webmaster Tools verification meta tag                       |

## Scripts

| Command                                 | What it does                                                           |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `npm run dev` / `build` / `start`       | Next.js development server, production build, production server        |
| `npm run lint` / `typecheck`            | ESLint, and `tsc` after generating route types                         |
| `npm test`                              | Vitest suite (payments, webhooks, portal rules, SEO links)             |
| `npm run format` / `format:check`       | Prettier write and check                                               |
| `npm run secrets`                       | secretlint scan of the working tree                                    |
| `npm run contrast`                      | WCAG contrast check of the colour token pairs                          |
| `npm run check:copy` / `check:seo`      | Optional copy and SEO audits against a running or live site            |

A pre-commit hook formats and lints staged files and scans them for secrets. A commit-msg hook enforces [Conventional Commits](https://www.conventionalcommits.org/). CI runs the same checks plus tests, a production dependency audit and a build.

## Architecture notes

- **Next.js App Router with three route groups.** `(marketing)` is the public site, `(portal)` is the signed-in portal, `(concept)` holds fictional concept sites. `src/proxy.ts` refreshes the Supabase session and redirects signed-out portal requests, but every page and server action re-checks the session and role itself.
- **No browser writes to the database.** Row-level security gives browsers owner-only reads on a limited set of columns. All writes are server actions or route handlers using the service-role key after an ownership or admin check.
- **Money has one source.** `src/config/pricing.ts` holds package prices, and `src/lib/payments/plan.ts` turns them into deposit and balance amounts in cents. Only verified Stripe webhooks (and the shared `finalize.ts`) mark a payment as paid. Duplicate-payment handling and the daily reconciliation job are documented in `src/lib/payments/`.
- **Design tokens drive the styling.** Colours are `light-dark()` pairs in `src/styles/tokens.css`, bridged into Tailwind v4 through `src/styles/theme.css`. Component styling lives in CSS under `src/styles/`; components stay thin.
- **Content is configuration.** Copy, packages, guides and FAQ live in `src/config/`, and the SEO tests check links between them.

Deeper conventions and decisions are recorded in the project notes, `docs/ROADMAP.md` and `docs/AUDIT-2026-10-10.md`.
