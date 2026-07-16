import { asc } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";

import { ProductForm } from "../product-form";
import { createProduct } from "@/lib/admin/product-actions";
import { pickTranslation } from "@/lib/catalog";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

export async function categoryOptions(locale: string) {
  const rows = await db.query.categories.findMany({
    with: { translations: true },
    orderBy: [asc(categories.sortOrder)],
  });
  return rows.map((c) => ({
    id: c.id,
    name: pickTranslation(c.translations, locale)?.name ?? c.id,
  }));
}

export default async function NewProductPage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Admin.form"),
  ]);
  const options = await categoryOptions(locale);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("newProduct")}</h1>
      <ProductForm action={createProduct} categories={options} />
    </main>
  );
}
