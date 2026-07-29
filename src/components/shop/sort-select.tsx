"use client";

import { useTranslations } from "next-intl";

import { ChevronIcon } from "@/components/ui/icons";
import { useRouter } from "@/i18n/navigation";
import type { SortKey } from "@/lib/shop";
import { shopHref, type ShopParams } from "@/lib/shop-params";

/**
 * Sort control. Navigating on change keeps the choice in the URL like every
 * other filter, so a sorted view stays shareable — this component only saves
 * the shopper a submit button.
 */
export function SortSelect({
  basePath,
  params,
}: {
  basePath: string;
  params: ShopParams;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();

  return (
    <label className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
        {t("sort")}
      </span>
      <span className="relative">
        <select
          value={params.sort}
          onChange={(event) =>
            router.push(
              shopHref(basePath, params, {
                sort: event.target.value as SortKey,
              }),
            )
          }
          className="appearance-none rounded-none border-0 border-b border-ink-300 bg-transparent py-1 pl-0 pr-6 text-[13px] text-ink-900 focus:border-ink-900 focus:outline-none"
        >
          <option value="new">{t("sortNew")}</option>
          <option value="low">{t("sortLow")}</option>
          <option value="high">{t("sortHigh")}</option>
        </select>
        <ChevronIcon className="pointer-events-none absolute right-0 top-1.5 h-3 w-3 text-ink-500" />
      </span>
    </label>
  );
}
