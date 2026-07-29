import { getTranslations } from "next-intl/server";

import { CheckIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import type { Region } from "@/lib/region";
import { shopHref, type ShopParams } from "@/lib/shop-params";
import type { CategoryCard } from "@/lib/shop";
import { cn } from "@/lib/utils";

/**
 * The catalog filter rail.
 *
 * Every control is a link, not a form control: filtering is a navigation, so
 * the state lives in the URL, works without JavaScript, is crawlable, and the
 * back button undoes exactly one choice. The price filter is a set of bands
 * rather than a slider for the same reason — a slider cannot be a link.
 */
export async function ShopFilters({
  categories,
  params,
  region,
  ceiling,
  total,
}: {
  categories: CategoryCard[];
  params: ShopParams;
  region: Region;
  ceiling: number;
  total: number;
}) {
  const t = await getTranslations("Shop");

  // Four bands spanning the catalog, rounded to something a person would say.
  const step = Math.max(1, Math.ceil(ceiling / 4 / 5000) * 5000);
  const bands = [1, 2, 3].map((n) => n * step).filter((band) => band < ceiling);

  const rowClass = (active: boolean) =>
    cn(
      "flex w-full items-baseline justify-between py-1.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900",
      active ? "text-ink-900" : "text-ink-600 hover:text-ink-900",
    );

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {t("category")}
        </div>
        <ul className="mt-4 space-y-1">
          <li>
            <Link
              href={shopHref("/shop", params, { category: undefined })}
              className={rowClass(!params.category)}
            >
              <span className={!params.category ? "border-b border-ink-900 pb-0.5" : ""}>
                {t("allProducts")}
              </span>
              <span className="text-xs tabular-nums text-ink-400">{total}</span>
            </Link>
          </li>
          {categories.map((category) => {
            const active = params.category === category.slug;
            return (
              <li key={category.id}>
                <Link
                  href={shopHref("/shop", params, { category: category.slug })}
                  className={rowClass(active)}
                >
                  <span className={active ? "border-b border-ink-900 pb-0.5" : ""}>
                    {category.name}
                  </span>
                  <span className="text-xs tabular-nums text-ink-400">
                    {category.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {bands.length > 0 ? (
        <div className="border-t border-ink-200 pt-7">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
            {t("priceUpTo")}
          </div>
          <ul className="mt-4 space-y-1">
            {bands.map((band) => {
              const active = params.max === band;
              return (
                <li key={band}>
                  <Link
                    href={shopHref("/shop", params, {
                      max: active ? undefined : band,
                    })}
                    className={rowClass(active)}
                  >
                    <span className={active ? "border-b border-ink-900 pb-0.5" : ""}>
                      {formatPrice(band, region)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="border-t border-ink-200 pt-7">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {t("availability")}
        </div>
        <Link
          href={shopHref("/shop", params, { inStock: !params.inStock })}
          className="mt-4 flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
        >
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center border",
              params.inStock
                ? "border-ink-900 bg-ink-900 text-ink-50"
                : "border-ink-400 text-transparent",
            )}
          >
            <CheckIcon className="h-3 w-3" />
          </span>
          <span className="text-[13px] text-ink-700">{t("inStockOnly")}</span>
        </Link>
      </div>

      <div className="border-t border-ink-200 pt-7">
        <Link
          href="/shop"
          className="text-[11px] uppercase tracking-[0.16em] text-ink-500 underline underline-offset-4 hover:text-ink-900"
        >
          {t("clearAll")}
        </Link>
      </div>
    </div>
  );
}
