# Bilingual Two-Region Shop — Project Brief

> Build brief for a bilingual (KA/EN), two-region (Georgia / Rest of World) e-commerce
> shop with a custom admin panel, physical-product catalog, region-based pricing and
> payments, a bilingual SEO-optimized blog, abandoned-cart recovery, and customer profiles.
>
> Design is intentionally out of scope for now — this brief covers stack, architecture,
> data model, features, and build phases. Visual design will be layered on later.

---

## 1. Overview

A storefront selling **physical products**, shipped from Georgia, serving two regions:

- **Georgia** → prices in **GEL (₾)**, payment via **Bank of Georgia iPay**.
- **Rest of World** → prices in **USD ($)**, payment via **Stripe**.

Region determines both the **displayed currency** and the **available payment method**.
The site is fully bilingual (Georgian + English) on both the storefront and the blog.

A **custom admin panel** (built into the same Next.js app) manages products, categories,
stock/visibility, orders, the blog, and abandoned-cart recovery.

---

## 2. Core Requirements

- Bilingual storefront and blog (KA / EN) with proper URL structure and hreflang.
- Product catalog with categories, featured products on the homepage.
- Admin: add/manage products and categories; toggle **out-of-stock**, **hidden**, **featured**.
- Region-aware pricing (GEL vs USD) and payment (BoG vs Stripe).
- Shipping to both Georgia and international, with configurable zones and rates.
- Customer accounts with profile + full purchase history.
- Abandoned-cart tracking → automated offer emails.
- Bilingual blog with in-admin SEO scoring and best-practice SEO output.
- Media (images/video) served from Cloudflare; all transactional email via Resend.

---

## 3. Tech Stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | SSR/SSG/ISR = the SEO backbone; full-stack (API routes / server actions), no separate backend |
| i18n | **next-intl** | `/ka` + `/en` routing, message catalogs, hreflang |
| Database | **PostgreSQL (Supabase)** | Postgres + Auth + Row Level Security in one; auth covers profiles, login, admin roles |
| ORM | **Drizzle ORM** | Lightweight, fast on serverless, type-safe (Prisma is the fallback if preferred) |
| Media | **Cloudflare R2 + Images + Stream** | R2 = image storage (no egress fees); Images = resize/optimize; Stream = video |
| Email | **Resend + React Email** | Order confirmations, abandoned-cart, offers; React-based templates |
| Payments (GE) | **Bank of Georgia iPay** | REST API (api.bog.ge), Hosted Payment Page, GEL, ~60% of GE e-commerce |
| Payments (Intl) | **Stripe (+ Stripe Tax)** | Standard for international card payments on physical goods, USD |
| SEO data | **Ahrefs (connector)** | Keyword data feeding the in-admin blog SEO scorer |
| Hosting | **Vercel** + Cloudflare (media/DNS/CDN in front) | Native Next.js DX; Cloudflare handles media + edge geo |

---

## 4. Architecture Overview

```
                        ┌──────────────────────────┐
   Visitor ── Cloudflare ┤  CF-IPCountry (geo)      │
   (edge, DNS, CDN)      │  → region + currency     │
                        └──────────┬───────────────┘
                                   │
                        ┌──────────▼───────────────┐
                        │   Next.js (Vercel)        │
                        │   App Router + next-intl  │
                        │   Storefront + Admin +    │
                        │   API routes / actions    │
                        └───┬───────┬──────────┬────┘
                            │       │          │
              ┌─────────────▼─┐  ┌──▼────────┐ ┌▼──────────────┐
              │ Supabase       │  │ Resend    │ │ Cloudflare     │
              │ Postgres+Auth  │  │ (email)   │ │ R2/Images/Stream│
              └───────┬────────┘  └───────────┘ └────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │ Payments (region-routed)   │
        │ GE → BoG iPay (GEL)        │
        │ Intl → Stripe (USD)        │
        └────────────────────────────┘
```

**Region logic:** `CF-IPCountry` sets the default region; user can override manually; the
choice is stored (cookie + profile). Region drives currency shown and payment method
offered. Only currency/payment change per region — page content is never cloaked (SEO-safe).

---

## 5. Data Model (Postgres)

Localized content lives in `*_translations` tables (one row per locale). Prices are stored
per currency (not live-converted).

**profiles** — `id (fk auth.users)`, `email`, `full_name`, `phone`, `locale_pref`,
`region_pref`, `role (customer|admin)`, `created_at`

**addresses** — `id`, `user_id`, `country`, `city`, `line1`, `line2`, `postal_code`,
`phone`, `is_default`

**categories** — `id`, `slug`, `parent_id`, `sort_order`, `is_hidden`, `created_at`
**category_translations** — `id`, `category_id`, `locale`, `name`, `description`

**products** — `id`, `slug`, `category_id`, `price_gel`, `price_usd`, `sku`,
`stock_quantity`, `is_out_of_stock`, `is_hidden`, `is_featured`, `weight_grams`, `created_at`
**product_translations** — `id`, `product_id`, `locale`, `name`, `description`,
`seo_title`, `seo_description`
**product_images** — `id`, `product_id`, `cf_image_id`, `alt`, `sort_order`, `is_primary`
**product_videos** — `id`, `product_id`, `cf_stream_id`, `sort_order`

**carts** — `id`, `user_id (nullable)`, `session_id`, `region`, `currency`,
`status (active|abandoned|converted)`, `created_at`, `updated_at`
**cart_items** — `id`, `cart_id`, `product_id`, `quantity`, `unit_price`, `currency`

**orders** — `id`, `user_id`, `cart_id`, `region`, `currency`, `subtotal`,
`shipping_cost`, `tax`, `total`, `payment_provider (bog|stripe)`,
`payment_status (pending|paid|failed|refunded)`,
`fulfillment_status (pending|processing|shipped|delivered|cancelled)`,
`shipping_address_id`, `tracking_number`, `created_at`
**order_items** — `id`, `order_id`, `product_id`, `name_snapshot`, `quantity`,
`unit_price`, `currency`

**shipping_zones** — `id`, `name`, `countries (array)`, `is_georgia`
**shipping_rates** — `id`, `zone_id`, `rate`, `currency`, `free_threshold`

**blog_posts** — `id`, `slug`, `cf_cover_id`, `status (draft|published)`,
`published_at`, `author_id`, `is_featured`
**blog_post_translations** — `id`, `post_id`, `locale`, `title`, `excerpt`, `body`,
`seo_title`, `seo_description`, `og_image`, `focus_keyword`, `seo_score`

**abandoned_cart_emails** — `id`, `cart_id`, `sent_at`, `offer_code`

---

## 6. Features

### 6.1 Storefront (public)
- Homepage with featured products + latest blog posts.
- Category browsing, product detail pages (images + video, localized copy).
- Region/currency + language switchers.
- Cart (DB-backed, persists across sessions) and checkout.
- Out-of-stock products show as unavailable; hidden products are not rendered or indexed.

### 6.2 Admin Panel (custom, role-protected)
- **Products:** create/edit, set `price_gel` + `price_usd`, SKU, stock quantity, upload
  images/video, per-locale name/description + SEO fields; toggles for out-of-stock, hidden, featured.
- **Categories:** create/edit, nesting, ordering, hide, per-locale names.
- **Orders:** list/filter, view detail, update fulfillment status + tracking number.
- **Customers:** view profiles + purchase history.
- **Abandoned carts:** list of carts with items but no order; trigger/track offer emails.
- **Blog:** bilingual editor with live SEO scoring (see 6.5).
- **Shipping:** manage zones and rates.

### 6.3 Payments (region-routed)
- **Georgia (GEL):** BoG iPay Hosted Payment Page. Redirect → pay → webhook confirms →
  order marked paid. (Requires a `businessonline.ge` merchant account + iPay credentials.)
- **Intl (USD):** Stripe Checkout + webhooks; **Stripe Tax** for international VAT/sales tax.
- Order records which provider + currency was used; both flows write to the same `orders` table.

### 6.4 Abandoned Cart
- Cart stored server-side, tied to user or session.
- Cron (Vercel Cron) finds carts `status=active`, idle > N hours, with items and no order →
  mark `abandoned`, send Resend offer email (optionally with a discount code), log in
  `abandoned_cart_emails`. Admin sees the full list.

### 6.5 Blog + SEO
- Bilingual posts (KA/EN), draft/published, featured flag, cover via Cloudflare.
- **In-admin SEO scorer** (RankMath/Yoast-style): checks focus keyword usage,
  meta title/description length, slug, headings, readability, internal/OG image presence —
  returns a score + actionable tips as the author writes.
- **Ahrefs connector** feeds keyword volume/difficulty into the scorer.
- Auto **sitemaps**, **hreflang**, and **structured data** (Article, Product, BreadcrumbList).

### 6.6 Customer Profiles
- Account with saved addresses, order history, region + language preferences.

---

## 7. SEO Strategy

- Server-rendered pages + ISR for the blog (fast, indexable).
- Per-page `metadata` (title, description, canonical, OG/Twitter).
- Separate localized URLs (`/ka/...`, `/en/...`) + hreflang pairs + `x-default`.
- JSON-LD: `Product` (with price/currency/availability), `Article`, `BreadcrumbList`,
  `Organization`.
- Auto `sitemap.xml` (localized) + `robots.txt`.
- Region/currency handled client-safe so Googlebot always sees full content.

---

## 8. Integrations & Env

- **Cloudflare:** R2 bucket, Images, Stream, geo header (`CF-IPCountry`).
- **Resend:** API key, verified sending domain, React Email templates.
- **BoG iPay:** `client_id`, `client_secret`, callback URLs (via businessonline.ge).
- **Stripe:** secret key, webhook secret, Stripe Tax enabled.
- **Supabase:** project URL, anon + service keys, RLS policies.
- **Ahrefs:** connector auth for the blog SEO scorer.

---

## 9. Build Phases (PR-style, for Claude Code)

**PR1 — Foundation.** Next.js + TypeScript + next-intl (KA/EN), Supabase + Drizzle,
auth (customer/admin roles), base layout, region + currency detection + switchers.

**PR2 — Catalog.** Categories + products schema, storefront listing + product detail,
admin CRUD for products/categories, Cloudflare image/video upload, out-of-stock / hidden /
featured toggles, homepage featured products.

**PR3 — Cart + Checkout + Orders.** DB-backed cart, region-based currency, BoG (GEL) +
Stripe (USD) checkout with webhooks, orders + order items, shipping zones/rates, customer
profiles + order history.

**PR4 — Abandoned Cart + Email.** Cart lifecycle + cron, Resend offer emails + order
confirmations, admin abandoned-cart view.

**PR5 — Blog + SEO.** Bilingual blog, admin editor with SEO scorer + Ahrefs, structured
data, sitemaps, hreflang, per-page metadata.

**PR6 — SEO hardening + polish.** Schema audit, performance, analytics, final metadata pass.

---

## 10. Open Decisions (to confirm)

- **Shipping rates:** flat per zone (default) vs weight-based? (schema supports both).
- **Stock tracking:** exact quantity decrement vs manual out-of-stock toggle only?
  (default: manual toggle + optional quantity).
- **Stripe Tax:** auto-collect international VAT/sales tax? (recommended: on).
- **Customs/duties on international shipments:** DDU (buyer pays on arrival) vs DDP?
  (default: DDU — simpler, but state it clearly at checkout).
- **BoG account:** do you already have a `businessonline.ge` merchant account + iPay
  credentials? (prerequisite for the GE payment flow).
- **Domestic courier:** integrate a Georgian courier later, or manual fulfillment at launch?
