import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/shop/product-card";
import { Link } from "@/i18n/navigation";
import { pickTranslation } from "@/lib/catalog";
import { getRegion } from "@/lib/region";
import { localizedAlternates } from "@/lib/seo/metadata";
import { getVisibleCategories, getVisibleProducts } from "@/lib/shop";

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

export default async function ShopPage() {
  const [locale, region, t] = await Promise.all([
    getLocale(),
    getRegion(),
    getTranslations("Shop"),
  ]);

  const [categories, products] = await Promise.all([
    getVisibleCategories(),
    getVisibleProducts(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>

      {categories.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">{t("categories")}</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const tr = pickTranslation(category.translations, locale);
              return (
                <Link
                  key={category.id}
                  href={`/category/${tr?.slug ?? ""}`}
                  className="rounded-full border px-4 py-1.5 text-sm hover:bg-muted"
                >
                  {tr?.name ?? "—"}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{t("allProducts")}</h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noProducts")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                region={region}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
