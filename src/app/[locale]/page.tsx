import { getLocale, getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/shop/product-card";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getRegion } from "@/lib/region";
import { getVisibleProducts } from "@/lib/shop";

/**
 * Featured products, degrading gracefully: if the database isn't reachable yet,
 * the homepage still renders its hero (and the e2e smoke flow stays green).
 */
async function loadFeatured() {
  try {
    return await getVisibleProducts({ featuredOnly: true, limit: 8 });
  } catch {
    return [];
  }
}

export default async function Home() {
  const [t, locale, region, featured] = await Promise.all([
    getTranslations("HomePage"),
    getLocale(),
    getRegion(),
    loadFeatured(),
  ]);

  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          {t("title")}
        </h1>
        <p className="max-w-md text-lg text-muted-foreground text-pretty">
          {t("tagline")}
        </p>
        <Link href="/shop" className={buttonVariants()}>
          {t("browse")}
        </Link>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 pb-16">
          <h2 className="mb-4 text-lg font-medium">{t("featured")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                region={region}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
