import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductCard } from "@/components/shop/product-card";
import { SortSelect } from "@/components/shop/sort-select";
import { ArrowLink } from "@/components/ui/btn";
import { Breadcrumbs, Chip } from "@/components/ui/chip";
import { Pagination } from "@/components/ui/pagination";
import type { Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/catalog";
import { getRegion } from "@/lib/region";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { localizedUrl } from "@/lib/seo/metadata";
import {
  getCategoryBySlug,
  getCategoryCards,
  getShopProducts,
} from "@/lib/shop";
import { parseShopParams, shopHref } from "@/lib/shop-params";
import { getSavedProductIds } from "@/lib/wishlist";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const category = await getCategoryBySlug(locale, slug);
  if (!category) return {};

  const tr = pickTranslation(category.translations, locale);

  // Slugs differ per locale, so alternates come from the category's own rows.
  const languages: Record<string, string> = {};
  for (const row of category.translations) {
    languages[row.locale] = localizedUrl(row.locale, `/category/${row.slug}`);
  }

  return {
    title: tr?.name,
    description: tr?.description ?? undefined,
    alternates: {
      canonical: localizedUrl(locale, `/category/${tr?.slug ?? slug}`),
      languages,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, sp, locale] = await Promise.all([
    params,
    searchParams,
    getLocale() as Promise<Locale>,
  ]);

  const category = await getCategoryBySlug(locale, slug);
  if (!category) notFound();

  const [region, t] = await Promise.all([getRegion(), getTranslations("Shop")]);

  const tr = pickTranslation(category.translations, locale);
  // The house shows the piece's name in the other language under the title —
  // "ყელსაბამები / Necklaces" — so a bilingual customer recognises it either way.
  const alternate = category.translations.find((row) => row.locale !== locale);

  const filters = parseShopParams(sp);
  const basePath = `/category/${tr?.slug ?? slug}`;

  const [result, siblings, saved] = await Promise.all([
    getShopProducts({
      locale,
      region,
      categorySlug: tr?.slug ?? slug,
      sort: filters.sort,
      page: filters.page,
    }),
    getCategoryCards(locale),
    getSavedProductIds(),
  ]);

  const cover = result.items
    .flatMap((product) =>
      [...product.images].sort((a, b) => a.sortOrder - b.sortOrder),
    )
    .at(0);

  return (
    <SiteChrome locale={locale} section="shop">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t("title"), url: localizedUrl(locale, "/shop") },
          { name: tr?.name ?? "", url: localizedUrl(locale, basePath) },
        ])}
      />

      <section className="grid lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col justify-center px-6 py-14 lg:px-10 lg:py-20">
          <Breadcrumbs
            items={[
              { label: t("title"), href: "/shop" },
              { label: tr?.name ?? "" },
            ]}
          />
          <h1 className="mt-6 text-5xl leading-[0.95] tracking-[-0.035em] text-balance sm:text-6xl">
            {tr?.name}
          </h1>
          {alternate && alternate.name !== tr?.name ? (
            <div className="mt-3 text-2xl tracking-[-0.02em] text-ink-500">
              {alternate.name}
            </div>
          ) : null}
          {tr?.description ? (
            <p className="mt-7 max-w-md text-[15px] leading-[1.7] text-ink-700">
              {tr.description}
            </p>
          ) : null}

          {siblings.length > 1 ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {siblings.map((sibling) => (
                <Chip
                  key={sibling.id}
                  href={`/category/${sibling.slug}`}
                  active={sibling.slug === (tr?.slug ?? slug)}
                >
                  {sibling.name}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>

        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt=""
            className="h-[300px] w-full bg-accent-100 object-cover lg:h-[520px]"
          />
        ) : (
          <div className="hidden bg-accent-100 lg:block" />
        )}
      </section>

      <div className="mx-auto w-full max-w-[1600px] px-6 py-12 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-900 pb-4">
          <span className="text-[11px] uppercase tracking-[0.18em] tabular-nums text-ink-500">
            {t("pieces", { count: result.total })}
          </span>
          <SortSelect basePath={basePath} params={filters} />
        </div>

        {result.items.length === 0 ? (
          <p className="mt-10 text-sm text-ink-500">{t("noProducts")}</p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
              {result.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  region={region}
                  saved={saved.has(product.id)}
                  imageClassName="h-[260px] sm:h-[360px]"
                />
              ))}
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ink-200 pt-6">
              <ArrowLink href="/shop">{t("allProducts")}</ArrowLink>
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                nextLabel={t("next")}
                hrefFor={(page) => shopHref(basePath, filters, { page })}
              />
            </div>
          </>
        )}
      </div>
    </SiteChrome>
  );
}
