import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ProductForm, type ProductInitial } from "../../product-form";
import { categoryOptions } from "../../new/page";
import { updateProduct } from "@/lib/admin/product-actions";
import { db } from "@/lib/db";

function localeFields(
  translations: {
    locale: string;
    name: string;
    slug: string;
    description: string | null;
  }[],
  locale: "ka" | "en",
) {
  const tr = translations.find((t) => t.locale === locale);
  return {
    name: tr?.name ?? "",
    slug: tr?.slug ?? "",
    description: tr?.description ?? "",
  };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Admin.form"),
  ]);

  const product = await db.query.products.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    with: { translations: true, images: true },
  });
  if (!product) notFound();

  const options = await categoryOptions(locale);

  const initial: ProductInitial = {
    id: product.id,
    priceGel: product.priceGel,
    priceUsd: product.priceUsd,
    stock: product.stock,
    sortOrder: product.sortOrder,
    categoryId: product.categoryId ?? "",
    isFeatured: product.isFeatured,
    isHidden: product.isHidden,
    isOutOfStock: product.isOutOfStock,
    imageUrls: [...product.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => img.url),
    ka: localeFields(product.translations, "ka"),
    en: localeFields(product.translations, "en"),
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("editProduct")}</h1>
      <ProductForm
        action={updateProduct}
        categories={options}
        initial={initial}
      />
    </main>
  );
}
