# PR1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the bilingual (KA/EN), two-region (GE/ROW) Next.js foundation with Neon + Drizzle, Auth.js email/password auth with customer/admin roles, Vercel-geo region detection, and a minimal shell with language + region/currency switchers.

**Architecture:** A single Next.js App Router application. Requests pass through one middleware chain that first resolves locale (next-intl) then resolves region from the Vercel geo header and writes a region cookie. Auth is Auth.js (NextAuth v5) with a Credentials provider over a Neon Postgres database accessed through Drizzle; sessions are JWTs carrying `userId` + `role`. Access control is application-level (middleware + server-side `auth()` guards) since there is no RLS.

**Tech Stack:** Next.js (App Router, TypeScript), next-intl, Neon Postgres, Drizzle ORM + drizzle-kit, Auth.js (`next-auth@beta` v5) + `@auth/drizzle-adapter`, bcryptjs, zod, Tailwind + shadcn/ui, Vitest + @testing-library, Playwright.

## Global Constraints

- Locales: exactly `en` and `ka`. Both **always prefixed** (`/en/...`, `/ka/...`). Default locale `en`. `/` redirects to `/en`.
- Regions: `GE` and `ROW`. Currency map: `GE → GEL`, `ROW → USD`. Unknown/missing geo → `ROW`/`USD`.
- Roles: `customer` (default) and `admin`. Role lives in `users.role` and is embedded in the JWT.
- Session strategy: **JWT** (required by the Credentials provider). Adapter tables exist for future OAuth but are not the active session store.
- Page content is never varied by region (SEO-safe). Region only affects currency/payment (payment arrives in PR3).
- Package manager: `npm`. Node: 20+.
- Every task ends with tests green and a commit.

---

## File Structure

```
package.json, tsconfig.json, next.config.ts, vitest.config.ts, playwright.config.ts
.env.local (gitignored), .env.example
drizzle.config.ts
src/
  i18n/
    routing.ts            # next-intl locales + routing config
    request.ts            # next-intl request config (loads messages)
    navigation.ts         # typed Link/usePathname/useRouter
  db/
    schema.ts             # Drizzle tables: users, accounts, sessions, verificationTokens
    index.ts              # Drizzle client bound to Neon
  lib/
    region.ts             # getRegion(request) abstraction + currencyForRegion
    password.ts           # hashPassword / verifyPassword (bcryptjs)
    validators.ts         # zod schemas (registerSchema)
  auth/
    config.ts             # Auth.js config (providers, callbacks, session strategy)
    index.ts              # export { handlers, auth, signIn, signOut }
  middleware.ts           # composed: next-intl locale + region cookie
  app/
    [locale]/
      layout.tsx          # next-intl provider + header/footer
      page.tsx            # placeholder home
      login/page.tsx
      register/page.tsx
      admin/layout.tsx    # server-side admin role guard
      admin/page.tsx      # placeholder dashboard
    api/auth/[...nextauth]/route.ts
  components/
    Header.tsx
    Footer.tsx
    LanguageSwitcher.tsx
    RegionCurrencySwitcher.tsx
  actions/
    auth.ts               # registerUser server action
    prefs.ts              # setRegion server action
messages/
  en.json, ka.json
scripts/
  seed-admin.ts
tests/                    # Vitest unit/integration
e2e/                      # Playwright specs
```

---

## Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/app/[locale]/page.tsx` (temporary), `tests/smoke.test.ts`

**Interfaces:**
- Consumes: nothing (greenfield).
- Produces: a working Next.js + TS app, Tailwind, shadcn initialised, `npm test` (Vitest) and `npm run build` working.

- [ ] **Step 1: Scaffold the app**

Run in the project root (the folder already contains `shop-project-brief.md` and `docs/`; scaffold in place):

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint --no-turbopack --use-npm
```

If prompted about a non-empty directory, choose to continue (keep existing files).

- [ ] **Step 2: Initialise shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input label card
```

- [ ] **Step 3: Install test tooling**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

- [ ] **Step 5: Write `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Add scripts to `package.json`**

Add to the `"scripts"` block:

```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"seed:admin": "tsx scripts/seed-admin.ts"
```

- [ ] **Step 7: Write the smoke test `tests/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs the test suite', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 8: Run the smoke test**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 9: Add `.env.example`**

```
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
AUTH_SECRET=generate-with-npx-auth-secret
```

Confirm `.env*.local` is in `.gitignore` (create-next-app adds it).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, shadcn, Vitest, Playwright"
```

---

## Task 2: Neon + Drizzle connection

**Files:**
- Create: `drizzle.config.ts`, `src/db/index.ts`, `tests/db.test.ts`
- Modify: `.env.local` (add real `DATABASE_URL`)

**Interfaces:**
- Consumes: `DATABASE_URL` env.
- Produces: `db` (Drizzle client) exported from `@/db`.

- [ ] **Step 1: Install Drizzle + Neon driver + tsx**

```bash
npm i drizzle-orm @neondatabase/serverless
npm i -D drizzle-kit tsx dotenv
```

- [ ] **Step 2: Write `drizzle.config.ts`**

```ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

- [ ] **Step 3: Write `src/db/index.ts`**

```ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

- [ ] **Step 4: Create a placeholder schema so the import resolves**

Create `src/db/schema.ts`:

```ts
// tables added in Task 3
export {}
```

- [ ] **Step 5: Write the connection test `tests/db.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { neon } from '@neondatabase/serverless'

describe('database connection', () => {
  it('executes a trivial query against Neon', async () => {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`select 1 as ok`
    expect(rows[0].ok).toBe(1)
  })
})
```

- [ ] **Step 6: Load env into Vitest**

Add to `vitest.config.ts` `test` block: `setupFiles: ['./tests/setup.ts']` already exists — prepend env loading by editing `tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
```

- [ ] **Step 7: Put a real Neon URL in `.env.local`**

Create a Neon project + database, copy the pooled connection string into `.env.local` as `DATABASE_URL`. (Manual step — requires Neon credentials.)

- [ ] **Step 8: Run the connection test**

Run: `npm test -- tests/db.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: Neon + Drizzle connection"
```

---

## Task 3: Schema — users + Auth.js adapter tables

**Files:**
- Modify: `src/db/schema.ts`
- Create: `tests/schema.test.ts`, migration under `drizzle/`

**Interfaces:**
- Produces: exported Drizzle tables `users`, `accounts`, `sessions`, `verificationTokens`. `users` columns include `id: text`, `email: text` (unique), `passwordHash: text`, `role: 'customer' | 'admin'`, `fullName`, `phone`, `localePref`, `regionPref`, `createdAt`.

- [ ] **Step 1: Write the failing schema test `tests/schema.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { getTableColumns } from 'drizzle-orm'
import { users } from '@/db/schema'

describe('users table', () => {
  it('has the expected columns', () => {
    const cols = Object.keys(getTableColumns(users))
    expect(cols).toEqual(
      expect.arrayContaining([
        'id', 'email', 'passwordHash', 'role',
        'fullName', 'phone', 'localePref', 'regionPref', 'createdAt',
      ]),
    )
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- tests/schema.test.ts`
Expected: FAIL (`users` not exported).

- [ ] **Step 3: Write `src/db/schema.ts`**

```ts
import { pgTable, text, timestamp, primaryKey, integer } from 'drizzle-orm/pg-core'
import type { AdapterAccountType } from 'next-auth/adapters'

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['customer', 'admin'] }).notNull().default('customer'),
  fullName: text('full_name'),
  phone: text('phone'),
  localePref: text('locale_pref', { enum: ['en', 'ka'] }),
  regionPref: text('region_pref', { enum: ['GE', 'ROW'] }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccountType>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (a) => ({
  pk: primaryKey({ columns: [a.provider, a.providerAccountId] }),
}))

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  pk: primaryKey({ columns: [vt.identifier, vt.token] }),
}))
```

- [ ] **Step 4: Run the schema test**

Run: `npm test -- tests/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Generate + apply the migration**

```bash
npm run db:generate
npm run db:migrate
```

Expected: a SQL file appears under `drizzle/`, and migrate reports success against Neon.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: users + Auth.js adapter schema and migration"
```

---

## Task 4: next-intl — locales, routing, middleware, layout

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`, `messages/en.json`, `messages/ka.json`, `src/middleware.ts`, `src/app/[locale]/layout.tsx`
- Modify: `next.config.ts`, delete the temporary `src/app/page.tsx` from create-next-app; move home into `src/app/[locale]/page.tsx`
- Create: `tests/i18n.test.ts`, `tests/middleware.locale.test.ts`

**Interfaces:**
- Produces: `routing` (with `locales: ['en','ka']`, `defaultLocale: 'en'`, `localePrefix: 'always'`), typed `Link/usePathname/useRouter/redirect` from `@/i18n/navigation`, and a `middleware` default export.

- [ ] **Step 1: Install next-intl**

```bash
npm i next-intl
```

- [ ] **Step 2: Write the failing routing test `tests/i18n.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { routing } from '@/i18n/routing'

describe('i18n routing config', () => {
  it('defines en and ka with en default, always prefixed', () => {
    expect(routing.locales).toEqual(['en', 'ka'])
    expect(routing.defaultLocale).toBe('en')
    expect(routing.localePrefix).toBe('always')
  })
})
```

- [ ] **Step 3: Run it to confirm failure**

Run: `npm test -- tests/i18n.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Write `src/i18n/routing.ts`**

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ka'],
  defaultLocale: 'en',
  localePrefix: 'always',
})
```

- [ ] **Step 5: Write `src/i18n/navigation.ts`**

```ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
```

- [ ] **Step 6: Write `src/i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'en' | 'ka')) {
    locale = routing.defaultLocale
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 7: Write message catalogs**

`messages/en.json`:

```json
{
  "Nav": { "home": "Home", "login": "Log in", "register": "Sign up", "logout": "Log out", "admin": "Admin" },
  "Home": { "title": "Welcome" },
  "Region": { "label": "Region", "GE": "Georgia", "ROW": "Rest of world" },
  "Auth": { "email": "Email", "password": "Password", "name": "Full name", "submit": "Continue" }
}
```

`messages/ka.json`:

```json
{
  "Nav": { "home": "მთავარი", "login": "შესვლა", "register": "რეგისტრაცია", "logout": "გასვლა", "admin": "ადმინი" },
  "Home": { "title": "მოგესალმებით" },
  "Region": { "label": "რეგიონი", "GE": "საქართველო", "ROW": "დანარჩენი მსოფლიო" },
  "Auth": { "email": "ელფოსტა", "password": "პაროლი", "name": "სახელი და გვარი", "submit": "გაგრძელება" }
}
```

- [ ] **Step 8: Wire the plugin in `next.config.ts`**

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 9: Write `src/middleware.ts` (locale only for now — region added in Task 5)**

```ts
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default intlMiddleware

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

- [ ] **Step 10: Move the home page under `[locale]`**

Delete `src/app/page.tsx`. Create `src/app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

Create `src/app/[locale]/page.tsx`:

```tsx
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations('Home')
  return <h1>{t('title')}</h1>
}
```

Delete the root `src/app/layout.tsx` created by create-next-app (the `[locale]` layout now owns `<html>`), or reduce it to a pass-through if Next requires a root layout — Next 15 allows the root layout to live at `[locale]`. If the build complains about a missing root layout, keep `src/app/layout.tsx` as:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Step 11: Create stub Header/Footer so the layout compiles (filled in Task 10/11)**

`src/components/Header.tsx`:

```tsx
export function Header() {
  return <header />
}
```

`src/components/Footer.tsx`:

```tsx
export function Footer() {
  return <footer />
}
```

- [ ] **Step 12: Write the middleware locale test `tests/middleware.locale.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import middleware from '@/middleware'
import { NextRequest } from 'next/server'

function req(path: string) {
  return new NextRequest(new URL(`https://shop.test${path}`))
}

describe('locale middleware', () => {
  it('redirects / to /en', () => {
    const res = middleware(req('/'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/en')
  })

  it('leaves /ka untouched', () => {
    const res = middleware(req('/ka'))
    expect([200, 204].includes(res.status)).toBe(true)
  })
})
```

- [ ] **Step 13: Run i18n + middleware tests**

Run: `npm test -- tests/i18n.test.ts tests/middleware.locale.test.ts`
Expected: PASS.

- [ ] **Step 14: Verify the app boots**

Run: `npm run build`
Expected: build succeeds; `/en` and `/ka` routes exist.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat: next-intl bilingual routing with locale middleware"
```

---

## Task 5: Region detection abstraction + middleware integration

**Files:**
- Create: `src/lib/region.ts`, `tests/region.test.ts`, `tests/middleware.region.test.ts`
- Modify: `src/middleware.ts`

**Interfaces:**
- Consumes: `NextRequest`.
- Produces: `type Region = 'GE' | 'ROW'`; `type Currency = 'GEL' | 'USD'`; `currencyForRegion(region): Currency`; `getRegion(req): Region`; constant `REGION_COOKIE = 'region'`. Middleware sets the `region` cookie when absent.

- [ ] **Step 1: Write the failing region test `tests/region.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { getRegion, currencyForRegion } from '@/lib/region'

function reqWithCountry(country?: string) {
  const headers = new Headers()
  if (country) headers.set('x-vercel-ip-country', country)
  return new NextRequest(new URL('https://shop.test/en'), { headers })
}

describe('getRegion', () => {
  it('maps GE header to region GE', () => {
    expect(getRegion(reqWithCountry('GE'))).toBe('GE')
  })
  it('maps other countries to ROW', () => {
    expect(getRegion(reqWithCountry('US'))).toBe('ROW')
    expect(getRegion(reqWithCountry('DE'))).toBe('ROW')
  })
  it('defaults to ROW when the header is missing', () => {
    expect(getRegion(reqWithCountry())).toBe('ROW')
  })
})

describe('currencyForRegion', () => {
  it('GE -> GEL, ROW -> USD', () => {
    expect(currencyForRegion('GE')).toBe('GEL')
    expect(currencyForRegion('ROW')).toBe('USD')
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/region.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/lib/region.ts`**

```ts
import type { NextRequest } from 'next/server'

export type Region = 'GE' | 'ROW'
export type Currency = 'GEL' | 'USD'

export const REGION_COOKIE = 'region'

export function currencyForRegion(region: Region): Currency {
  return region === 'GE' ? 'GEL' : 'USD'
}

export function getRegion(req: NextRequest): Region {
  const country = req.headers.get('x-vercel-ip-country')?.toUpperCase()
  return country === 'GE' ? 'GE' : 'ROW'
}
```

- [ ] **Step 4: Run the region test**

Run: `npm test -- tests/region.test.ts`
Expected: PASS.

- [ ] **Step 5: Compose region into the middleware — write the failing test `tests/middleware.region.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import middleware from '@/middleware'
import { NextRequest } from 'next/server'

function req(path: string, country?: string) {
  const headers = new Headers()
  if (country) headers.set('x-vercel-ip-country', country)
  return new NextRequest(new URL(`https://shop.test${path}`), { headers })
}

describe('region middleware', () => {
  it('sets a region cookie of GE for Georgian visitors on a localized path', () => {
    const res = middleware(req('/en', 'GE'))
    const cookie = res.cookies.get('region')
    expect(cookie?.value).toBe('GE')
  })

  it('sets ROW for other visitors', () => {
    const res = middleware(req('/en', 'US'))
    expect(res.cookies.get('region')?.value).toBe('ROW')
  })

  it('does not overwrite an existing region cookie', () => {
    const r = req('/en', 'US')
    r.cookies.set('region', 'GE')
    const res = middleware(r)
    // no Set-Cookie for region when already present
    expect(res.cookies.get('region')).toBeUndefined()
  })
})
```

- [ ] **Step 6: Run it to confirm failure**

Run: `npm test -- tests/middleware.region.test.ts`
Expected: FAIL (cookie not set — current middleware only handles locale).

- [ ] **Step 7: Update `src/middleware.ts` to compose locale + region**

```ts
import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { getRegion, REGION_COOKIE } from './lib/region'

const intlMiddleware = createMiddleware(routing)

export default function middleware(req: NextRequest) {
  const res = intlMiddleware(req)
  if (!req.cookies.get(REGION_COOKIE)) {
    res.cookies.set(REGION_COOKIE, getRegion(req), {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return res
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

- [ ] **Step 8: Run region + existing middleware tests**

Run: `npm test -- tests/middleware.region.test.ts tests/middleware.locale.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: Vercel-geo region detection and region cookie in middleware"
```

---

## Task 6: Password utils + Auth.js Credentials

**Files:**
- Create: `src/lib/password.ts`, `src/lib/validators.ts`, `src/auth/config.ts`, `src/auth/index.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- Create: `tests/password.test.ts`, `tests/auth-config.test.ts`
- Modify: `.env.local` (add `AUTH_SECRET`)

**Interfaces:**
- Produces: `hashPassword(pw: string): Promise<string>`, `verifyPassword(pw: string, hash: string): Promise<boolean>`; `registerSchema` (zod) with `{ email, password, fullName }`; Auth.js `{ handlers, auth, signIn, signOut }`; JWT carries `id` + `role`; `session.user` exposes `id` + `role`.

- [ ] **Step 1: Install auth deps**

```bash
npm i next-auth@beta @auth/drizzle-adapter bcryptjs zod
npm i -D @types/bcryptjs
```

- [ ] **Step 2: Write the failing password test `tests/password.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/password'

describe('password hashing', () => {
  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('s3cret-pw')
    expect(hash).not.toBe('s3cret-pw')
    expect(await verifyPassword('s3cret-pw', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})
```

- [ ] **Step 3: Run it to confirm failure**

Run: `npm test -- tests/password.test.ts`
Expected: FAIL.

- [ ] **Step 4: Write `src/lib/password.ts`**

```ts
import bcrypt from 'bcryptjs'

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10)
}

export function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash)
}
```

- [ ] **Step 5: Write `src/lib/validators.ts`**

```ts
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
```

- [ ] **Step 6: Run the password test**

Run: `npm test -- tests/password.test.ts`
Expected: PASS.

- [ ] **Step 7: Write `src/auth/config.ts`**

```ts
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, accounts, sessions, verificationTokens } from '@/db/schema'
import { verifyPassword } from '@/lib/password'
import { registerSchema } from '@/lib/validators'

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  pages: { signIn: '/en/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const parsed = registerSchema
          .pick({ email: true, password: true })
          .safeParse(creds)
        if (!parsed.success) return null
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1)
        if (!user?.passwordHash) return null
        const ok = await verifyPassword(parsed.data.password, user.passwordHash)
        if (!ok) return null
        return { id: user.id, email: user.email, name: user.fullName, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? 'customer'
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'customer' | 'admin'
      }
      return session
    },
  },
}
```

- [ ] **Step 8: Add the type augmentation at the bottom of `src/auth/config.ts`**

```ts
declare module 'next-auth' {
  interface User { role?: 'customer' | 'admin' }
  interface Session {
    user: { id: string; role: 'customer' | 'admin' } & import('next-auth').DefaultSession['user']
  }
}
declare module 'next-auth/jwt' {
  interface JWT { id?: string; role?: 'customer' | 'admin' }
}
```

- [ ] **Step 9: Write `src/auth/index.ts`**

```ts
import NextAuth from 'next-auth'
import { authConfig } from './config'

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
```

- [ ] **Step 10: Write `src/app/api/auth/[...nextauth]/route.ts`**

```ts
export { GET, POST } from '@/auth'
```

- [ ] **Step 11: Add `AUTH_SECRET` to `.env.local`**

```bash
npx auth secret
```

This writes `AUTH_SECRET` into `.env.local`.

- [ ] **Step 12: Write the auth-config test `tests/auth-config.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { authConfig } from '@/auth/config'

describe('auth config', () => {
  it('uses JWT sessions', () => {
    expect(authConfig.session?.strategy).toBe('jwt')
  })

  it('jwt callback copies id and role from the user', async () => {
    const token = await authConfig.callbacks!.jwt!({
      token: {},
      user: { id: 'u1', role: 'admin' } as never,
    } as never)
    expect(token).toMatchObject({ id: 'u1', role: 'admin' })
  })

  it('session callback exposes id and role', async () => {
    const session = await authConfig.callbacks!.session!({
      session: { user: {} } as never,
      token: { id: 'u1', role: 'admin' } as never,
    } as never)
    expect(session.user).toMatchObject({ id: 'u1', role: 'admin' })
  })
})
```

- [ ] **Step 13: Run the auth-config test**

Run: `npm test -- tests/auth-config.test.ts`
Expected: PASS.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: Auth.js Credentials provider with JWT role sessions"
```

---

## Task 7: Register server action

**Files:**
- Create: `src/actions/auth.ts`, `tests/register.test.ts`

**Interfaces:**
- Consumes: `registerSchema`, `hashPassword`, `db`, `users`.
- Produces: `registerUser(input: unknown): Promise<{ ok: true } | { ok: false; error: string }>`. Inserts a `users` row with `role: 'customer'`. Rejects duplicate email with `error: 'email_taken'` and invalid input with `error: 'invalid'`.

- [ ] **Step 1: Write the failing test `tests/register.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const rows: { email: string }[] = []

vi.mock('@/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => rows.filter(r => true).slice(0, 1) }) }) }),
    insert: () => ({ values: async (v: { email: string }) => { rows.push(v) } }),
  },
}))

import { registerUser } from '@/actions/auth'

beforeEach(() => { rows.length = 0 })

describe('registerUser', () => {
  it('rejects invalid input', async () => {
    const res = await registerUser({ email: 'nope', password: '123', fullName: '' })
    expect(res).toEqual({ ok: false, error: 'invalid' })
  })

  it('creates a customer on valid input', async () => {
    const res = await registerUser({ email: 'a@b.com', password: 'password1', fullName: 'A B' })
    expect(res).toEqual({ ok: true })
    expect(rows[0].email).toBe('a@b.com')
  })

  it('rejects a duplicate email', async () => {
    rows.push({ email: 'a@b.com' })
    const res = await registerUser({ email: 'a@b.com', password: 'password1', fullName: 'A B' })
    expect(res).toEqual({ ok: false, error: 'email_taken' })
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/register.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/actions/auth.ts`**

```ts
'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { hashPassword } from '@/lib/password'
import { registerSchema } from '@/lib/validators'

type Result = { ok: true } | { ok: false; error: string }

export async function registerUser(input: unknown): Promise<Result> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid' }

  const { email, password, fullName } = parsed.data
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) return { ok: false, error: 'email_taken' }

  await db.insert(users).values({
    email,
    fullName,
    passwordHash: await hashPassword(password),
    role: 'customer',
  })
  return { ok: true }
}
```

- [ ] **Step 4: Run the register test**

Run: `npm test -- tests/register.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: registerUser server action with validation and dup-email guard"
```

---

## Task 8: Auth UI — login, register, logout

**Files:**
- Create: `src/app/[locale]/login/page.tsx`, `src/app/[locale]/register/page.tsx`, `src/components/LogoutButton.tsx`
- Create: `tests/register-page.test.tsx`

**Interfaces:**
- Consumes: `registerUser`, `signIn`/`signOut` from `@/auth`, shadcn `Button`/`Input`/`Label`.
- Produces: rendered login + register forms; register form calls `registerUser` then `signIn('credentials', ...)`.

- [ ] **Step 1: Write `src/app/[locale]/register/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { signIn } from 'next-auth/react'
import { registerUser } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    const input = {
      email: String(formData.get('email')),
      password: String(formData.get('password')),
      fullName: String(formData.get('fullName')),
    }
    const res = await registerUser(input)
    if (!res.ok) return setError(res.error)
    await signIn('credentials', { email: input.email, password: input.password, redirect: false })
    router.push('/')
  }

  return (
    <form action={onSubmit} className="mx-auto max-w-sm space-y-4 p-6">
      <div><Label htmlFor="fullName">{t('name')}</Label><Input id="fullName" name="fullName" /></div>
      <div><Label htmlFor="email">{t('email')}</Label><Input id="email" name="email" type="email" /></div>
      <div><Label htmlFor="password">{t('password')}</Label><Input id="password" name="password" type="password" /></div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="submit">{t('submit')}</Button>
    </form>
  )
}
```

- [ ] **Step 2: Write `src/app/[locale]/login/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    const res = await signIn('credentials', {
      email: String(formData.get('email')),
      password: String(formData.get('password')),
      redirect: false,
    })
    if (res?.error) return setError('invalid')
    router.push('/')
  }

  return (
    <form action={onSubmit} className="mx-auto max-w-sm space-y-4 p-6">
      <div><Label htmlFor="email">{t('email')}</Label><Input id="email" name="email" type="email" /></div>
      <div><Label htmlFor="password">{t('password')}</Label><Input id="password" name="password" type="password" /></div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="submit">{t('submit')}</Button>
    </form>
  )
}
```

- [ ] **Step 3: Write `src/components/LogoutButton.tsx`**

```tsx
'use client'

import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const t = useTranslations('Nav')
  return (
    <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
      {t('logout')}
    </Button>
  )
}
```

- [ ] **Step 4: Write the failing render test `tests/register-page.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../messages/en.json'
import RegisterPage from '@/app/[locale]/register/page'

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/actions/auth', () => ({ registerUser: vi.fn() }))

describe('RegisterPage', () => {
  it('renders name, email and password fields', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RegisterPage />
      </NextIntlClientProvider>,
    )
    expect(screen.getByLabelText('Full name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run the render test**

Run: `npm test -- tests/register-page.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: login, register, and logout UI"
```

---

## Task 9: Route protection — admin guard

**Files:**
- Create: `src/app/[locale]/admin/layout.tsx`, `src/app/[locale]/admin/page.tsx`
- Modify: `src/middleware.ts` (fast admin short-circuit)
- Create: `tests/admin-guard.test.ts`

**Interfaces:**
- Consumes: `auth()` from `@/auth`.
- Produces: admin layout that redirects non-admins to `/{locale}/login`; a helper `isAdminPath(pathname): boolean` exported from `@/lib/region`... no — export from a new `src/lib/paths.ts` to keep region focused.

- [ ] **Step 1: Write the failing test `tests/admin-guard.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { isAdminPath } from '@/lib/paths'

describe('isAdminPath', () => {
  it('matches localized admin routes', () => {
    expect(isAdminPath('/en/admin')).toBe(true)
    expect(isAdminPath('/ka/admin/orders')).toBe(true)
  })
  it('rejects non-admin routes', () => {
    expect(isAdminPath('/en')).toBe(false)
    expect(isAdminPath('/en/administrator')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/admin-guard.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/lib/paths.ts`**

```ts
export function isAdminPath(pathname: string): boolean {
  return /^\/(en|ka)\/admin(\/|$)/.test(pathname)
}
```

- [ ] **Step 4: Run the path test**

Run: `npm test -- tests/admin-guard.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the server-side admin guard `src/app/[locale]/admin/layout.tsx`**

```tsx
import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { auth } from '@/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const locale = await getLocale()
  if (session?.user?.role !== 'admin') {
    redirect({ href: '/login', locale })
  }
  return <section>{children}</section>
}
```

- [ ] **Step 6: Write `src/app/[locale]/admin/page.tsx`**

```tsx
export default function AdminDashboard() {
  return <h1>Admin dashboard</h1>
}
```

- [ ] **Step 7: Add the middleware short-circuit (defense in depth) in `src/middleware.ts`**

Replace the `middleware` function body so it checks admin paths before returning. Full updated file:

```ts
import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { routing } from './i18n/routing'
import { getRegion, REGION_COOKIE } from './lib/region'
import { isAdminPath } from './lib/paths'

const intlMiddleware = createMiddleware(routing)

export default async function middleware(req: NextRequest) {
  const res = intlMiddleware(req)

  if (isAdminPath(req.nextUrl.pathname)) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET })
    if (token?.role !== 'admin') {
      const locale = req.nextUrl.pathname.split('/')[1] || routing.defaultLocale
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
    }
  }

  if (!req.cookies.get(REGION_COOKIE)) {
    res.cookies.set(REGION_COOKIE, getRegion(req), {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return res
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

- [ ] **Step 8: Re-run the middleware tests (region + locale still green)**

Run: `npm test -- tests/middleware.region.test.ts tests/middleware.locale.test.ts tests/admin-guard.test.ts`
Expected: PASS. (The middleware tests call `middleware(...)` and now receive a Promise for admin paths, but the locale/region tests use non-admin paths that resolve synchronously via `intlMiddleware`; since the function is `async`, update those two test files to `await middleware(...)`.)

- [ ] **Step 9: Update `tests/middleware.locale.test.ts` and `tests/middleware.region.test.ts` to await**

In both files, change `const res = middleware(req(...))` to `const res = await middleware(req(...))` and mark the test callbacks `async`.

- [ ] **Step 10: Re-run all middleware tests**

Run: `npm test -- tests/middleware.region.test.ts tests/middleware.locale.test.ts`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: admin route protection via middleware and server-side layout guard"
```

---

## Task 10: Preferences + switchers

**Files:**
- Create: `src/actions/prefs.ts`, `src/components/LanguageSwitcher.tsx`, `src/components/RegionCurrencySwitcher.tsx`
- Create: `tests/prefs.test.ts`

**Interfaces:**
- Consumes: `REGION_COOKIE`, `currencyForRegion`, `auth`, `db`, `users`.
- Produces: `setRegion(region: 'GE' | 'ROW'): Promise<void>` server action — writes the cookie and, if authenticated, `users.regionPref`. `LanguageSwitcher` (next-intl nav) and `RegionCurrencySwitcher` (calls `setRegion`).

- [ ] **Step 1: Write the failing test `tests/prefs.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest'

const cookieStore = { set: vi.fn() }
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))
vi.mock('@/auth', () => ({ auth: async () => null }))
const updated: unknown[] = []
vi.mock('@/db', () => ({
  db: { update: () => ({ set: (v: unknown) => ({ where: async () => { updated.push(v) } }) }) },
}))

import { setRegion } from '@/actions/prefs'

describe('setRegion', () => {
  it('writes the region cookie for anonymous users', async () => {
    await setRegion('GE')
    expect(cookieStore.set).toHaveBeenCalledWith(
      'region', 'GE', expect.objectContaining({ path: '/' }),
    )
  })

  it('does not touch the DB when unauthenticated', async () => {
    updated.length = 0
    await setRegion('ROW')
    expect(updated).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/prefs.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/actions/prefs.ts`**

```ts
'use server'

import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { REGION_COOKIE, type Region } from '@/lib/region'

export async function setRegion(region: Region): Promise<void> {
  const store = await cookies()
  store.set(REGION_COOKIE, region, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
  const session = await auth()
  if (session?.user?.id) {
    await db.update(users).set({ regionPref: region }).where(eq(users.id, session.user.id))
  }
}
```

- [ ] **Step 4: Run the prefs test**

Run: `npm test -- tests/prefs.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `src/components/LanguageSwitcher.tsx`**

```tsx
'use client'

import { usePathname, useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>{l.toUpperCase()}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 6: Write `src/components/RegionCurrencySwitcher.tsx`**

```tsx
'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { setRegion } from '@/actions/prefs'
import { currencyForRegion, type Region } from '@/lib/region'

export function RegionCurrencySwitcher({ current }: { current: Region }) {
  const t = useTranslations('Region')
  const [pending, start] = useTransition()
  return (
    <select
      aria-label={t('label')}
      defaultValue={current}
      disabled={pending}
      onChange={(e) => start(() => { void setRegion(e.target.value as Region) })}
    >
      <option value="GE">{t('GE')} — {currencyForRegion('GE')}</option>
      <option value="ROW">{t('ROW')} — {currencyForRegion('ROW')}</option>
    </select>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: region/currency + language switchers with preference persistence"
```

---

## Task 11: Assemble the shell (Header + Footer + home)

**Files:**
- Modify: `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/app/[locale]/page.tsx`
- Create: `tests/header.test.tsx`

**Interfaces:**
- Consumes: `auth`, cookies (`REGION_COOKIE`), `LanguageSwitcher`, `RegionCurrencySwitcher`, `LogoutButton`, next-intl `Link`.
- Produces: server `Header` that reads session + region cookie and renders nav + switchers.

- [ ] **Step 1: Write `src/components/Header.tsx` (server component)**

```tsx
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { auth } from '@/auth'
import { REGION_COOKIE, type Region } from '@/lib/region'
import { LanguageSwitcher } from './LanguageSwitcher'
import { RegionCurrencySwitcher } from './RegionCurrencySwitcher'
import { LogoutButton } from './LogoutButton'

export async function Header() {
  const t = await getTranslations('Nav')
  const session = await auth()
  const store = await cookies()
  const region = (store.get(REGION_COOKIE)?.value as Region) ?? 'ROW'

  return (
    <header className="flex items-center justify-between gap-4 border-b p-4">
      <nav className="flex items-center gap-4">
        <Link href="/">{t('home')}</Link>
        {session?.user?.role === 'admin' && <Link href="/admin">{t('admin')}</Link>}
      </nav>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <RegionCurrencySwitcher current={region} />
        {session?.user ? (
          <LogoutButton />
        ) : (
          <>
            <Link href="/login">{t('login')}</Link>
            <Link href="/register">{t('register')}</Link>
          </>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Write `src/components/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t p-4 text-sm text-muted-foreground">
      © Shop
    </footer>
  )
}
```

- [ ] **Step 3: Write the failing Header test `tests/header.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '../messages/en.json'

vi.mock('@/auth', () => ({ auth: async () => null }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: 'GE' }) }) }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }))
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  usePathname: () => '/', useRouter: () => ({ replace: vi.fn() }),
}))

import { Header } from '@/components/Header'

describe('Header', () => {
  it('shows login/register when logged out and the region switcher', async () => {
    const ui = await Header()
    render(<NextIntlClientProvider locale="en" messages={messages}>{ui}</NextIntlClientProvider>)
    expect(screen.getByLabelText('Language')).toBeInTheDocument()
    expect(screen.getByLabelText(messages.Region.label)).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the Header test**

Run: `npm test -- tests/header.test.tsx`
Expected: PASS.

- [ ] **Step 5: Flesh out the home page `src/app/[locale]/page.tsx`**

```tsx
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations('Home')
  return <div className="p-8"><h1 className="text-2xl font-semibold">{t('title')}</h1></div>
}
```

- [ ] **Step 6: Full build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: assemble header/footer shell with switchers and auth-aware nav"
```

---

## Task 12: Seed admin script

**Files:**
- Create: `scripts/seed-admin.ts`

**Interfaces:**
- Consumes: `db`, `users`, `hashPassword`, env `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
- Produces: an idempotent script that upserts an admin user.

- [ ] **Step 1: Write `scripts/seed-admin.ts`**

```ts
import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import { users } from '../src/db/schema'
import { hashPassword } from '../src/lib/password'

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD')

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    await db.update(users).set({ role: 'admin' }).where(eq(users.email, email))
    console.log(`Promoted ${email} to admin`)
  } else {
    await db.insert(users).values({
      email,
      fullName: 'Administrator',
      role: 'admin',
      passwordHash: await hashPassword(password),
    })
    console.log(`Created admin ${email}`)
  }
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run it against Neon**

```bash
ADMIN_EMAIL=admin@shop.test ADMIN_PASSWORD=change-me-8chars npm run seed:admin
```

Expected: "Created admin admin@shop.test".

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: seed-admin script"
```

---

## Task 13: E2E smoke (Playwright)

**Files:**
- Create: `playwright.config.ts`, `e2e/auth.spec.ts`

**Interfaces:**
- Consumes: the running dev server.
- Produces: two e2e flows — register→login header state, and anonymous `/en/admin` redirect.

- [ ] **Step 1: Install Playwright browsers**

```bash
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/en',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 3: Write `e2e/auth.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('anonymous visitor to /en/admin is redirected to login', async ({ page }) => {
  await page.goto('/en/admin')
  await expect(page).toHaveURL(/\/en\/login/)
})

test('a visitor can register and land authenticated', async ({ page }) => {
  const email = `user${Date.now()}@shop.test`
  await page.goto('/en/register')
  await page.getByLabel('Full name').fill('Test User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button').click()
  await expect(page).toHaveURL(/\/en$/)
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
})
```

- [ ] **Step 4: Run the e2e suite**

Run: `npm run e2e`
Expected: both tests PASS (requires `.env.local` with a reachable Neon `DATABASE_URL` + `AUTH_SECRET`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: Playwright e2e for admin redirect and register flow"
```

---

## Self-Review

**Spec coverage:**
- Scaffold + Tailwind + shadcn → Task 1. ✓
- next-intl `en`/`ka`, always-prefixed, default `en`, `/`→`/en` → Task 4. ✓
- Neon + Drizzle + migration pipeline → Tasks 2, 3. ✓
- PR1 tables only (users + adapter) → Task 3. ✓
- Auth.js Credentials, register/login/logout, JWT → Tasks 6, 7, 8. ✓
- Roles + seed admin → Tasks 6 (role in JWT), 9 (guard), 12 (seed). ✓
- Region via `x-vercel-ip-country`, GE→GEL/else→USD, abstraction → Task 5. ✓
- Region ≠ locale; independent defaults → Tasks 4 (locale default en), 5 (region from geo). ✓
- Preferences in cookie + profile → Tasks 5 (cookie set), 10 (cookie + profile). ✓
- Base layout header/footer/home + switchers → Tasks 10, 11. ✓
- Application-level access control (no RLS) → Task 9. ✓
- Full TDD + Vitest + Playwright → tests in every task + Task 13. ✓

**Placeholder scan:** No TBD/TODO; every code step has real code. ✓

**Type consistency:** `getRegion`/`currencyForRegion`/`REGION_COOKIE`/`Region`/`Currency` (Task 5) reused verbatim in Tasks 10, 11. `registerUser` result shape (Task 7) matches its consumer in Task 8. `setRegion(region)` (Task 10) matches the `RegionCurrencySwitcher` call. `isAdminPath` (Task 9) used in middleware. Auth `session.user.role` type (Task 6 augmentation) used in Tasks 9, 11. ✓

**Note on Task 9 Step 8/9:** making `middleware` `async` requires the earlier middleware tests to `await`; the plan updates them in Step 9 rather than leaving a latent break.
