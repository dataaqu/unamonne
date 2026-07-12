# PR1 — Foundation — Design Spec

> Scope: the foundation slice of the bilingual, two-region shop described in
> `shop-project-brief.md`. This spec covers **PR1 only**. Catalog (PR2), cart/checkout/
> payments (PR3), abandoned-cart/email (PR4), and blog/SEO (PR5) each get their own
> spec → plan cycle later.

## Revised stack (changes from the brief)

The brief locked Supabase (Postgres + Auth + RLS). That is replaced:

| Layer | Brief | This project |
|---|---|---|
| Database | ~~Supabase~~ | **Neon** (serverless Postgres) |
| ORM | Drizzle | Drizzle (unchanged) |
| Auth | ~~Supabase Auth~~ | **Auth.js (NextAuth v5)** + `@auth/drizzle-adapter` |
| Access control | ~~Row Level Security~~ | Application-level: Auth.js session + server-action / route-handler guards |
| Framework, i18n, media, email, payments, hosting | — | unchanged from brief |

Note: **Stripe stays as a test-only placeholder** for now; the international payment
provider may change later. Not a PR1 concern (payments land in PR3).

## 1. Scope

**PR1 delivers:**
- Next.js (App Router) + TypeScript scaffold, Tailwind + shadcn/ui installed.
- next-intl: locales `en` and `ka`, **both always prefixed** (`/en/...`, `/ka/...`),
  default locale **EN**, `/` redirects to the default.
- Neon + Drizzle: connection, schema + migration pipeline, **PR1 tables only** (auth + user).
- Auth.js (NextAuth v5) + Drizzle adapter: email + password (Credentials), register /
  login / logout, session.
- Roles: `customer` (default) / `admin`; first admin created via a seed script.
- Region detection: Vercel `x-vercel-ip-country` → `GE = GEL`, everything else = `USD`,
  behind a single `getRegion()` abstraction.
- Preferences: locale + region persisted in a cookie (anonymous) and in the user row
  (authenticated).
- Base layout: header (language switcher + region/currency switcher), footer, placeholder
  home page, minimal login/register/admin-placeholder pages.

**PR1 explicitly does NOT do:** products/catalog (PR2), cart/checkout/payments (PR3),
abandoned-cart/email (PR4), blog + SEO scorer (PR5), visual design (separate later PR).

## 2. Architecture — middleware & region/locale flow

- **Single middleware chain** composing next-intl's locale middleware with custom region
  logic. Order per request: (1) resolve/redirect locale, (2) if no region cookie yet,
  resolve region from `x-vercel-ip-country`, (3) set the region/currency cookie.
- **Geo abstraction** — `getRegion(request)` in one file. Today reads the Vercel header;
  swappable tomorrow. Returns `{ region: 'GE' | 'ROW', currency: 'GEL' | 'USD' }`.
  Missing/unknown country → `{ ROW, USD }`.
- **Region ≠ locale.** Independent. Locale always defaults to EN (via geo-independent
  redirect); region defaults from geo. Both user-overridable and stored.
- **Server-side access** — server components / actions read region + locale from the
  cookie (for authenticated users, the profile is the source of truth and is synced to the
  cookie on login). Page content never changes by region (SEO-safe); only currency /
  payment do, and that arrives in PR3.
- **Switchers** — language switcher uses next-intl navigation (URL changes). Region/currency
  switcher calls a server action that updates the cookie (+ profile if logged in) and
  revalidates.

## 3. Data model (PR1 tables only)

Auth.js Drizzle adapter core tables, kept for future OAuth compatibility, with the `users`
table extended for password auth + app fields:

- **users** — `id`, `name`, `email` (unique), `emailVerified`, `image`,
  `passwordHash`, `role` (`customer` | `admin`, default `customer`), `fullName`, `phone`,
  `localePref` (`en` | `ka`, nullable), `regionPref` (`GE` | `ROW`, nullable),
  `createdAt`.
- **accounts**, **sessions**, **verificationTokens** — standard Auth.js adapter tables
  (unused by Credentials directly, but present so OAuth can be added later without a
  migration churn).

Sessions use the **JWT strategy** (required by the Credentials provider); the `sessions`
table is provisioned for future database-session / OAuth use but not the active store in
PR1. `role`, `userId`, `localePref`, `regionPref` are embedded in the JWT via callbacks.

Catalog / order / blog tables are deliberately deferred to their respective PRs.

## 4. Auth design

- **Credentials provider** — `authorize()` looks up the user by email and verifies the
  password (argon2 via `@node-rs/argon2`, or bcrypt fallback). Returns the user minus the
  hash.
- **Registration** — server action: validate input (zod), reject duplicate email, hash
  password, insert `users` row with `role = customer`.
- **Session** — JWT strategy; `jwt` and `session` callbacks copy `userId` + `role` (+
  prefs) so authorization checks never hit the DB on every request.
- **Route protection** — admin routes gated two ways: (a) middleware short-circuit for the
  `/[locale]/admin` prefix, (b) an `admin` layout that calls `auth()` server-side and
  redirects non-admins. Defense in depth.
- **Seed admin** — `scripts/seed-admin.ts`: promote (or create) a specified email to
  `role = admin`.

## 5. UI shell

- **Layout** — `app/[locale]/layout.tsx` wraps children in the next-intl provider and the
  shadcn theme provider. Header + footer here.
- **Header** — `LanguageSwitcher` (next-intl `usePathname`/`Link`, preserves current path)
  and `RegionCurrencySwitcher` (server action + cookie). Auth-aware: shows login/register
  vs. account/logout.
- **Pages (minimal, unstyled beyond shadcn defaults)** — placeholder home,
  `/[locale]/login`, `/[locale]/register`, `/[locale]/admin` (role-gated placeholder
  dashboard).
- **i18n messages** — `messages/en.json`, `messages/ka.json` with the shell strings.

## 6. Testing strategy (full TDD)

Tests written before implementation. **Vitest** for unit + integration; **Playwright** for
a couple of critical end-to-end flows.

- **Unit** — `getRegion()` mapping (GE→GEL, other→USD, missing header→ROW/USD); password
  hash/verify; zod validators.
- **Integration** — middleware locale redirect (`/` → `/en`, prefix enforcement) and region
  cookie set; register server action (happy path + duplicate email rejected); Credentials
  `authorize()` success/failure; JWT/session callbacks carry `role`.
- **Route protection** — `/[locale]/admin` blocks anonymous + customer, allows admin.
- **i18n** — both message catalogs load; no missing keys for shell strings.
- **E2E (Playwright)** — register → login → see authenticated header; anonymous hitting
  `/admin` is redirected.

## 7. Open items (carry-forward, not blocking PR1)

- Real Stripe replacement decision (PR3).
- BoG iPay merchant credentials (PR3 prerequisite).
- Whether authenticated region/locale prefs should override the cookie on every load or
  only on login (PR1 default: sync on login, cookie is the per-request read source).
