import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/shop/product-card";
import type { Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/catalog";
import { getRegion } from "@/lib/region";
import { getCategoryBySlug } from "@/lib/shop";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;

  const category = await getCategoryBySlug(locale, slug);
  if (!category) notFound();

  const [region, t] = await Promise.all([
    getRegion(),
    getTranslations("Shop"),
  ]);
  const tr = pickTranslation(category.translations, locale);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{tr?.name}</h1>
        {tr?.description ? (
          <p className="mt-1 text-muted-foreground">{tr.description}</p>
        ) : null}
      </div>

      {category.products.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noProducts")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {category.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              region={region}
            />
          ))}
        </div>
      )}
    </main>
  );
}
