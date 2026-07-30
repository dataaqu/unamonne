import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { NewsletterForm } from "@/components/layout/newsletter-form";
import { SiteChrome } from "@/components/layout/site-chrome";
import { ScrollMotion } from "@/components/motion/scroll-motion";
import { ProductCard } from "@/components/shop/product-card";
import { ArrowLink } from "@/components/ui/btn";
import { Link } from "@/i18n/navigation";
import {
  findPublishedPosts,
  pickTranslation as pickPost,
  readingMinutes,
} from "@/lib/blog";
import { getRegion } from "@/lib/region";
import { localizedAlternates } from "@/lib/seo/metadata";
import { getSettings } from "@/lib/settings";
import { getCategoryCards, getVisibleProducts } from "@/lib/shop";
import { getSavedProductIds } from "@/lib/wishlist";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { alternates: localizedAlternates(locale, "") };
}

/**
 * Every section on the homepage loads independently and degrades to nothing:
 * if the database is unreachable the hero and the type still render (and the
 * e2e smoke flow stays green) instead of the whole page erroring.
 */
async function safely<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const [t, tNews, tShop, tBlog, locale, region] = await Promise.all([
    getTranslations("HomePage"),
    getTranslations("Newsletter"),
    getTranslations("Shop"),
    getTranslations("Blog"),
    getLocale(),
    getRegion(),
  ]);

  const [featured, categories, posts, saved, settings] = await Promise.all([
    safely(() => getVisibleProducts({ featuredOnly: true, limit: 4 }), []),
    safely(() => getCategoryCards(locale), []),
    safely(() => findPublishedPosts(new Date()), []),
    getSavedProductIds(),
    getSettings(),
  ]);

  // Product photography, used for the contact-sheet strip beside the statement
  // panel — and as the fallback for the editorial slots before the studio has
  // uploaded a campaign shot.
  const gallery = featured
    .flatMap((product) =>
      [...product.images].sort((a, b) => a.sortOrder - b.sortOrder),
    )
    .slice(0, 6);
  const strip = gallery.slice(0, 4);

  const heroUrl = settings.homeCampaignImage ?? gallery[0]?.url ?? null;
  const workshopUrl = settings.homeWorkshopImage ?? gallery[1]?.url ?? null;
  const newsletterUrl = settings.homeNewsletterImage ?? gallery[2]?.url ?? null;

  const journal = posts.slice(0, 3);
  const dateFmt = new Intl.DateTimeFormat(
    locale === "ka" ? "ka-GE" : "en-US",
    { dateStyle: "medium" },
  );

  return (
    <SiteChrome header="transparent" locale={locale}>
      {/* campaign */}
      <section className="relative overflow-hidden bg-ink-900">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-drift
            src={heroUrl}
            alt=""
            className="h-[480px] w-full object-cover object-center sm:h-[620px] lg:h-[720px]"
          />
        ) : (
          <div className="h-[480px] w-full sm:h-[560px]" />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-ink-950/70 via-ink-950/30 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 px-6 pb-12 lg:px-10 lg:pb-16">
          <div className="mx-auto w-full max-w-[1600px] text-ink-50">
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink-200">
              {t("kicker")}
            </div>
            <h1 className="mt-5 max-w-2xl text-5xl leading-[0.94] tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <ArrowLink href="/shop" tone="light" className="mt-9">
              {t("browse")}
            </ArrowLink>
          </div>
        </div>
      </section>

      {/* featured */}
      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-[1600px] px-6 py-16 lg:px-10 lg:py-24">
          <div
            data-rise
            className="flex flex-wrap items-end justify-between gap-6 border-b border-ink-900 pb-6"
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-ink-500">
                {t("featuredKicker")}
              </div>
              <h2 className="mt-3 max-w-lg text-4xl leading-[0.98] tracking-[-0.03em] text-balance sm:text-5xl">
                {t("featuredTitle")}
              </h2>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-600">
              {t("featuredBody")}
            </p>
          </div>

          <div
            data-rise-group
            className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4"
          >
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                region={region}
                saved={saved.has(product.id)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="mx-auto w-full max-w-[1600px] px-6 py-20 text-center lg:px-10">
          <p className="text-[13px] text-ink-500">{tShop("noProducts")}</p>
        </section>
      )}

      {/* the workshop */}
      <section className="bg-ink-900">
        <div className="mx-auto grid w-full max-w-[1600px] lg:grid-cols-[1fr_120px_1.1fr]">
          <div
            data-rise-group
            className="flex flex-col justify-center gap-8 px-6 py-14 lg:px-10 lg:py-20"
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-ink-400">
                {t("workshopKicker")}
              </div>
              <h2 className="mt-6 max-w-md text-4xl leading-[0.98] tracking-[-0.03em] text-ink-50 text-balance sm:text-5xl">
                {t("workshopTitle")}
              </h2>
            </div>
            <p className="max-w-md text-[13px] leading-relaxed text-ink-300">
              {t("workshopBody")}
            </p>
            <ArrowLink href="/blog" tone="light">
              {t("workshopCta")}
            </ArrowLink>
          </div>

          <div
            data-rise-group
            className="hidden flex-col gap-1 overflow-hidden py-1 lg:flex"
          >
            {strip.map((image) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={image.id}
                src={image.url}
                alt=""
                className="h-[160px] w-[120px] shrink-0 object-cover"
              />
            ))}
          </div>

          {workshopUrl ? (
            <div className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-settle
                src={workshopUrl}
                alt=""
                className="h-[340px] w-full object-cover lg:h-full"
              />
            </div>
          ) : (
            <div />
          )}
        </div>
      </section>

      {/* shop by piece */}
      {categories.length > 0 ? (
        <section className="mx-auto w-full max-w-[1600px] px-6 py-16 lg:px-10 lg:py-24">
          <div data-rise className="flex items-end justify-between gap-6">
            <h2 className="text-4xl leading-[0.98] tracking-[-0.03em] sm:text-5xl">
              {t("categoriesTitle")}
            </h2>
            <ArrowLink href="/shop" className="hidden sm:inline-flex">
              {t("allProducts")}
            </ArrowLink>
          </div>

          <div
            data-rise-group
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group relative block overflow-hidden bg-accent-100"
              >
                {category.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.coverUrl}
                    alt=""
                    className="h-[300px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] lg:h-[420px]"
                  />
                ) : (
                  <div className="h-[300px] w-full lg:h-[420px]" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-950/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-ink-50">
                  <span className="text-[13px] uppercase tracking-[0.18em]">
                    {category.name}
                  </span>
                  <span className="text-[11px] tabular-nums text-ink-200">
                    {t("pieceCount", { count: category.count })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* journal */}
      {journal.length > 0 ? (
        <section className="mx-auto w-full max-w-[1600px] border-t border-ink-200 px-6 py-16 lg:px-10 lg:py-24">
          <div
            data-rise
            className="flex flex-wrap items-end justify-between gap-6"
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-ink-500">
                {t("journalKicker")}
              </div>
              <h2 className="mt-3 text-4xl leading-[0.98] tracking-[-0.03em] sm:text-5xl">
                {t("journalTitle")}
              </h2>
            </div>
            <ArrowLink href="/blog">{t("allPosts")}</ArrowLink>
          </div>

          <div
            data-rise-group
            className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-3"
          >
            {journal.map((post) => {
              const tr = pickPost(post.translations, locale);
              if (!tr) return null;
              const tag = post.tags[0]
                ? pickPost(post.tags[0].tag.translations, locale)
                : null;

              return (
                <article key={post.id} className="group">
                  <Link
                    href={`/blog/${tr.slug}`}
                    className="block overflow-hidden bg-accent-100"
                  >
                    {post.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverUrl}
                        alt=""
                        className="h-[200px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-[200px] w-full" />
                    )}
                  </Link>
                  <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-ink-500">
                    {tag?.name ?? tBlog("title")}
                  </div>
                  <h3 className="mt-2 text-xl leading-snug tracking-[-0.015em]">
                    <Link
                      href={`/blog/${tr.slug}`}
                      className="border-b border-transparent transition-colors hover:border-ink-900"
                    >
                      {tr.title}
                    </Link>
                  </h3>
                  <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
                    {post.publishedAt ? (
                      <time
                        dateTime={post.publishedAt.toISOString()}
                        className="tabular-nums"
                      >
                        {dateFmt.format(post.publishedAt)}
                      </time>
                    ) : null}
                    <span className="text-ink-300">·</span>
                    <span>
                      {tBlog("readTime", { count: readingMinutes(tr.body) })}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* newsletter */}
      <section className="grid bg-brand-100 lg:grid-cols-2">
        <div
          data-rise-group
          className="flex flex-col justify-center px-6 py-14 lg:px-10 lg:py-20"
        >
          <h2 className="max-w-sm text-3xl leading-[1] tracking-[-0.03em] text-balance sm:text-4xl">
            {tNews("title")}
          </h2>
          <p className="mt-5 max-w-md text-[13px] leading-relaxed text-ink-700">
            {tNews("body")}
          </p>
          <NewsletterForm source="home" className="mt-9" />
        </div>
        {newsletterUrl ? (
          <div className="hidden overflow-hidden lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-settle
              src={newsletterUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
      </section>

      <ScrollMotion />
    </SiteChrome>
  );
}
