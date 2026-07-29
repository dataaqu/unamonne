import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { JsonLd } from "@/components/seo/json-ld";
import { routing, type Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { localizedUrl } from "@/lib/seo/metadata";
import { getProductBySlug } from "@/lib/shop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const product = await getProductBySlug(locale, slug);
  if (!product) return {};

  const tr = pickTranslation(product.translations, locale);
  const image = [...product.images].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )[0];

  const languages: Record<string, string> = {};
  for (const t of product.translations) {
    languages[t.locale] = localizedUrl(t.locale, `/product/${t.slug}`);
  }
  languages["x-default"] = languages[routing.defaultLocale] ?? languages[locale];

  return {
    title: tr?.name,
    description: tr?.description ?? undefined,
    alternates: {
      canonical: localizedUrl(locale, `/product/${tr?.slug ?? slug}`),
      languages,
    },
    openGraph: {
      title: tr?.name,
      description: tr?.description ?? undefined,
      images: image ? [image.url] : undefined,
    },
  };
}

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
      <JsonLd
        data={productJsonLd({
          name: tr?.name ?? "",
          description: tr?.description,
          image: images[0]?.url,
          price,
          currency: region === "GE" ? "GEL" : "USD",
          inStock: !soldOut,
          url: localizedUrl(locale, `/product/${tr?.slug ?? slug}`),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Vintage", url: localizedUrl(locale, "") },
          { name: t("title"), url: localizedUrl(locale, "/shop") },
          {
            name: tr?.name ?? "",
            url: localizedUrl(locale, `/product/${tr?.slug ?? slug}`),
          },
        ])}
      />
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

        <AddToCartButton productId={product.id} disabled={soldOut} />

        {tr?.description ? (
          <p className="whitespace-pre-line text-muted-foreground">
            {tr.description}
          </p>
        ) : null}
      </div>
    </main>
  );
}
