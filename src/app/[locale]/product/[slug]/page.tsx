import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { BuyForm } from "@/components/shop/buy-form";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery } from "@/components/shop/product-gallery";
import { SaveButton } from "@/components/shop/save-button";
import { ArrowLink } from "@/components/ui/btn";
import { Breadcrumbs } from "@/components/ui/chip";
import { CheckIcon, MoonIcon, TruckIcon } from "@/components/ui/icons";
import { Disclosure } from "@/components/ui/notice";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { localizedUrl } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";
import {
  getProductBySlug,
  getRelatedProducts,
  isProductAvailable,
} from "@/lib/shop";
import { getSavedProductIds } from "@/lib/wishlist";

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
  for (const row of product.translations) {
    languages[row.locale] = localizedUrl(row.locale, `/product/${row.slug}`);
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
  const [{ slug }, locale] = await Promise.all([
    params,
    getLocale() as Promise<Locale>,
  ]);

  const product = await getProductBySlug(locale, slug);
  if (!product) notFound();

  const [region, t, tShop] = await Promise.all([
    getRegion(),
    getTranslations("Product"),
    getTranslations("Shop"),
  ]);

  const [related, saved] = await Promise.all([
    getRelatedProducts(product),
    getSavedProductIds(),
  ]);

  const tr = pickTranslation(product.translations, locale);
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const price = region === "GE" ? product.priceGel : product.priceUsd;
  const available = isProductAvailable(product);
  const categoryTr = product.category
    ? pickTranslation(product.category.translations, locale)
    : null;

  const specs = product.specs
    .filter((spec) => spec.locale === locale)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const url = localizedUrl(locale, `/product/${tr?.slug ?? slug}`);

  return (
    <SiteChrome locale={locale} section="shop">
      <JsonLd
        data={productJsonLd({
          name: tr?.name ?? "",
          description: tr?.description,
          image: images[0]?.url,
          price,
          currency: region === "GE" ? "GEL" : "USD",
          inStock: available,
          url,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: tShop("title"), url: localizedUrl(locale, "/shop") },
            categoryTr
              ? {
                  name: categoryTr.name,
                  url: localizedUrl(locale, `/category/${categoryTr.slug}`),
                }
              : null,
            { name: tr?.name ?? "", url },
          ].filter((crumb) => crumb !== null),
        )}
      />

      <div className="mx-auto w-full max-w-[1600px] px-6 lg:px-10">
        <Breadcrumbs
          className="py-6"
          items={[
            { label: tShop("title"), href: "/shop" },
            ...(categoryTr
              ? [{ label: categoryTr.name, href: `/category/${categoryTr.slug}` }]
              : []),
            { label: tr?.name ?? "" },
          ]}
        />

        {/* gallery + buy */}
        <div className="grid gap-10 pb-16 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <ProductGallery
            name={tr?.name ?? ""}
            images={images.map((image) => ({ url: image.url, alt: image.alt }))}
            badge={
              product.editionSize
                ? tShop("edition", { count: product.editionSize })
                : null
            }
            saveSlot={
              <SaveButton
                productId={product.id}
                productName={tr?.name ?? ""}
                saved={saved.has(product.id)}
                size="detail"
              />
            }
          />

          <div className="lg:pt-2">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-ink-500">
              {categoryTr ? (
                <Link
                  href={`/category/${categoryTr.slug}`}
                  className="hover:text-ink-900"
                >
                  {categoryTr.name}
                </Link>
              ) : null}
              {categoryTr && product.sku ? (
                <span className="text-ink-300">·</span>
              ) : null}
              {product.sku ? (
                <span className="font-mono normal-case tracking-normal">
                  {product.sku}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-4xl leading-[1] tracking-[-0.03em] text-balance sm:text-5xl">
              {tr?.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-4">
              <span className="text-2xl tabular-nums">
                {formatPrice(price, region)}
              </span>
              <span className="text-xs text-ink-500">
                {region === "GE" ? t("taxIncluded") : t("dutiesAtCheckout")}
              </span>
            </div>

            {tr?.description ? (
              <p className="mt-7 max-w-md whitespace-pre-line text-[15px] leading-[1.7] text-ink-700">
                {tr.description}
              </p>
            ) : null}

            <BuyForm
              productId={product.id}
              locale={locale}
              region={region}
              unitPrice={price}
              isSoldOut={!available}
              allowEngraving={product.variants.length > 0}
              variants={product.variants.map((variant) => ({
                id: variant.id,
                label: variant.label,
                stock: variant.stock,
                isMadeToOrder: variant.isMadeToOrder,
              }))}
            />

            <div className="mt-9 border-t border-ink-200">
              {[
                {
                  icon: <TruckIcon className="h-4 w-4" />,
                  text: t("shippingRow"),
                },
                { icon: <MoonIcon className="h-4 w-4" />, text: t("giftRow") },
                {
                  icon: <CheckIcon className="h-4 w-4" />,
                  text: t("returnsRow"),
                },
              ].map((row) => (
                <div
                  key={row.text}
                  className="flex items-center gap-3 border-b border-ink-200 py-3.5 text-[13px] text-ink-700"
                >
                  <span className="text-ink-500">{row.icon}</span>
                  {row.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* specification + before you buy */}
        <div
          className={cn(
            "grid gap-12 border-t border-ink-900 py-14 lg:gap-20",
            // Without a specification table the FAQ takes the full measure
            // rather than leaving half the row empty.
            specs.length > 0 ? "lg:grid-cols-2" : "",
          )}
        >
          {specs.length > 0 ? (
            <div>
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
                {t("specs")}
              </h2>
              <dl className="mt-6 max-w-md border-t border-ink-200">
                {specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex items-baseline justify-between gap-6 border-b border-ink-200 py-3 text-[13px]"
                  >
                    <dt className="text-ink-500">{spec.label}</dt>
                    <dd className="text-right tabular-nums">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="max-w-2xl">
            <h2 className="text-2xl tracking-[-0.02em]">{t("beforeYouBuy")}</h2>
            <div className="mt-6 border-t border-ink-200">
              <Disclosure question={t("faq.sizingQ")}>
                {t("faq.sizingA")}
              </Disclosure>
              <Disclosure question={t("faq.returnsQ")}>
                {t("faq.returnsA")}
              </Disclosure>
              <Disclosure question={t("faq.giftQ")}>{t("faq.giftA")}</Disclosure>
              <Disclosure question={t("faq.paymentQ")}>
                {t("faq.paymentA")}
              </Disclosure>
            </div>
          </div>
        </div>

        {/* pairs well with */}
        {related.length > 0 ? (
          <section className="border-t border-ink-200 py-14">
            <div className="flex items-end justify-between gap-6">
              <h2 className="text-3xl tracking-[-0.025em] sm:text-4xl">
                {t("pairsWith")}
              </h2>
              <ArrowLink href="/shop" className="hidden sm:inline-flex">
                {t("allProducts")}
              </ArrowLink>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  locale={locale}
                  region={region}
                  saved={saved.has(item.id)}
                  imageClassName="h-[240px] sm:h-[300px]"
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </SiteChrome>
  );
}
