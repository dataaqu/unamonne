import { and, asc, eq } from "drizzle-orm";

import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import {
  categories,
  categoryTranslations,
  productTranslations,
  products,
} from "@/lib/db/schema";

/** Visible categories, ordered, with their translations. */
export function getVisibleCategories() {
  return db.query.categories.findMany({
    where: eq(categories.isVisible, true),
    with: { translations: true },
    orderBy: [asc(categories.sortOrder)],
  });
}

/** Visible (non-hidden) products, optionally featured-only, with a limit. */
export function getVisibleProducts(options?: {
  featuredOnly?: boolean;
  limit?: number;
}) {
  const where = options?.featuredOnly
    ? and(eq(products.isHidden, false), eq(products.isFeatured, true))
    : eq(products.isHidden, false);

  return db.query.products.findMany({
    where,
    with: { translations: true, images: true },
    orderBy: [asc(products.sortOrder)],
    limit: options?.limit,
  });
}

/** A visible category by its per-locale slug, with its visible products. */
export async function getCategoryBySlug(locale: Locale, slug: string) {
  const tr = await db.query.categoryTranslations.findFirst({
    where: and(
      eq(categoryTranslations.locale, locale),
      eq(categoryTranslations.slug, slug),
    ),
  });
  if (!tr) return null;

  return db.query.categories.findFirst({
    where: and(eq(categories.id, tr.categoryId), eq(categories.isVisible, true)),
    with: {
      translations: true,
      products: {
        where: eq(products.isHidden, false),
        with: { translations: true, images: true },
        orderBy: [asc(products.sortOrder)],
      },
    },
  });
}

/** A visible product by its per-locale slug, with images + category. */
export async function getProductBySlug(locale: Locale, slug: string) {
  const tr = await db.query.productTranslations.findFirst({
    where: and(
      eq(productTranslations.locale, locale),
      eq(productTranslations.slug, slug),
    ),
  });
  if (!tr) return null;

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, tr.productId), eq(products.isHidden, false)),
    with: {
      translations: true,
      images: true,
      category: { with: { translations: true } },
    },
  });
  return product ?? null;
}
