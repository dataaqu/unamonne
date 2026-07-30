import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import { FilterDrawer } from "@/components/shop/filter-drawer";
import { ScrollMotion } from "@/components/motion/scroll-motion";
import { ProductCard } from "@/components/shop/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { SortSelect } from "@/components/shop/sort-select";
import { BtnLink } from "@/components/ui/btn";
import { Breadcrumbs } from "@/components/ui/chip";
import { SearchIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/notice";
import { Pagination } from "@/components/ui/pagination";
import type { Locale } from "@/i18n/routing";
import { getRegion } from "@/lib/region";
import { localizedAlternates } from "@/lib/seo/metadata";
import {
  SHOP_PER_PAGE,
  getCategoryCards,
  getPriceCeiling,
  getShopProducts,
} from "@/lib/shop";
import { parseShopParams, shopHref } from "@/lib/shop-params";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { getSavedProductIds } from "@/lib/wishlist";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Shop"),
  ]);
  return {
    title: t("title"),
    alternates: localizedAlternates(locale, "/shop"),
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

/** Everything below the hero degrades to an empty catalog, never to an error. */
async function safely<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch {
    return fallback;
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [sp, locale, region, t] = await Promise.all([
    searchParams,
    getLocale() as Promise<Locale>,
    getRegion(),
    getTranslations("Shop"),
  ]);

  const params = parseShopParams(sp);

  const [result, categories, ceiling, saved, settings] = await Promise.all([
    safely(
      () =>
        getShopProducts({
          locale,
          region,
          categorySlug: params.category,
          q: params.q,
          maxPrice: params.max,
          inStockOnly: params.inStock,
          sort: params.sort,
          page: params.page,
        }),
      { items: [], total: 0, page: 1, pageCount: 0 },
    ),
    safely(() => getCategoryCards(locale), []),
    safely(() => getPriceCeiling(region), 0),
    getSavedProductIds(),
    getSettings(),
  ]);

  const campaign =
    settings.shopCampaignImage ??
    settings.homeCampaignImage ??
    result.items
      .flatMap((product) => product.images)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ??
    null;

  const activeCategory = categories.find(
    (category) => category.slug === params.category,
  );
  const heading = params.q
    ? t("resultsFor", { q: params.q })
    : (activeCategory?.name ?? t("allProducts"));

  const filters = (
    <ShopFilters
      categories={categories}
      params={params}
      region={region}
      ceiling={ceiling}
      total={categories.reduce((sum, category) => sum + category.count, 0)}
    />
  );

  const shown = result.items.length;
  const firstOnPage = (result.page - 1) * SHOP_PER_PAGE;

  return (
    <SiteChrome locale={locale} section="shop" searchQuery={params.q}>
      {/* page head — a campaign shot when the studio has set one, the cocoa
          field when it has not. */}
      <div className="relative bg-ink-900">
        {campaign ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign}
            alt=""
            className="h-[220px] w-full object-cover object-center sm:h-[280px]"
          />
        ) : null}
        <div
          className={cn(
            campaign
              ? "absolute inset-0 flex flex-col justify-end bg-ink-950/45"
              : "",
            "px-6 py-12 text-ink-50 lg:px-10 lg:py-16",
          )}
        >
          <div className="mx-auto w-full max-w-[1600px]">
            <Breadcrumbs
              tone="light"
              items={[{ label: t("home"), href: "/" }, { label: t("title") }]}
            />
            <h1 className="mt-4 text-5xl leading-[0.95] tracking-[-0.035em] sm:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-3 max-w-md text-[13px] text-ink-200">
              {t("heroBody")}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-6 py-10 lg:px-10">
        <div className="flex items-center justify-between gap-4 border-b border-ink-200 pb-4 lg:hidden">
          <FilterDrawer count={result.total}>{filters}</FilterDrawer>
          <span className="text-xs tabular-nums text-ink-500">
            {t("pieces", { count: result.total })}
          </span>
        </div>

        <div className="grid gap-10 pt-6 lg:grid-cols-[220px_1fr] lg:gap-14">
          <aside className="hidden lg:block">{filters}</aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-900 pb-4">
              <div className="flex items-baseline gap-4">
                <h2 className="text-2xl tracking-[-0.02em]">{heading}</h2>
                <span className="text-xs tabular-nums text-ink-500">
                  {t("pieces", { count: result.total })}
                </span>
              </div>
              <SortSelect basePath="/shop" params={params} />
            </div>

            {result.items.length === 0 ? (
              <EmptyState
                className="mt-16"
                icon={<SearchIcon className="h-7 w-7" />}
                title={t("emptyTitle")}
                body={t("emptyBody")}
                action={
                  <BtnLink href="/shop" variant="outline">
                    {t("clearFilters")}
                  </BtnLink>
                }
              />
            ) : (
              <>
                <div
                  data-rise-group
                  className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3"
                >
                  {result.items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                      region={region}
                      saved={saved.has(product.id)}
                      imageClassName="h-[260px] sm:h-[340px]"
                    />
                  ))}
                </div>

                <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ink-200 pt-6">
                  <span className="text-xs tabular-nums text-ink-500">
                    {t("showing", {
                      shown: `${firstOnPage + 1}–${firstOnPage + shown}`,
                      total: result.total,
                    })}
                  </span>
                  <Pagination
                    page={result.page}
                    pageCount={result.pageCount}
                    nextLabel={t("next")}
                    hrefFor={(page) => shopHref("/shop", params, { page })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ScrollMotion />
    </SiteChrome>
  );
}
