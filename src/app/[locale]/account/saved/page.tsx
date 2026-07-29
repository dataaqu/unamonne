import { getLocale, getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/shop/product-card";
import { BtnLink } from "@/components/ui/btn";
import { HeartIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/notice";
import type { Locale } from "@/i18n/routing";
import { getRegion } from "@/lib/region";
import { getSavedProductIds, getSavedProducts } from "@/lib/wishlist";

/**
 * The saved list behind the hearts on the catalog. Guest saves are kept on a
 * cookie token and claimed at sign-in, so a list built before registering is
 * still here afterwards.
 */
export default async function SavedPage() {
  const [t, tShop, locale, region] = await Promise.all([
    getTranslations("Account"),
    getTranslations("Shop"),
    getLocale() as Promise<Locale>,
    getRegion(),
  ]);

  const [products, saved] = await Promise.all([
    getSavedProducts().catch(() => []),
    getSavedProductIds(),
  ]);

  return (
    <div>
      <h1 className="text-3xl tracking-[-0.025em]">{t("savedTitle")}</h1>

      {products.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<HeartIcon className="h-6 w-6" />}
          title={t("noSaved")}
          action={
            <BtnLink href="/shop" variant="outline">
              {tShop("allProducts")}
            </BtnLink>
          }
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              region={region}
              saved={saved.has(product.id)}
              imageClassName="h-[240px] sm:h-[300px]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
