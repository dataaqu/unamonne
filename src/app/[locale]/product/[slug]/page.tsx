import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { getProductBySlug } from "@/lib/shop";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;

  const product = await getProductBySlug(locale, slug);
  if (!product) notFound();

  const [region, t] = await Promise.all([
    getRegion(),
    getTranslations("Shop"),
  ]);

  const tr = pickTranslation(product.translations, locale);
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const price = region === "GE" ? product.priceGel : product.priceUsd;
  const soldOut = product.isOutOfStock || product.stock <= 0;

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 md:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        {images.map((image) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={image.url}
            src={image.url}
            alt={tr?.name ?? ""}
            className="aspect-square w-full rounded-lg border object-cover first:col-span-2"
          />
        ))}
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{tr?.name}</h1>
        <p className="text-2xl">{formatMoney(price, region, locale)}</p>

        <p
          className={
            soldOut ? "text-sm text-destructive" : "text-sm text-green-600"
          }
        >
          {soldOut ? t("outOfStock") : t("inStock")}
        </p>

        {tr?.description ? (
          <p className="whitespace-pre-line text-muted-foreground">
            {tr.description}
          </p>
        ) : null}
      </div>
    </main>
  );
}
