import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { blogTags, products } from "@/lib/db/schema";
import { pickTranslation } from "@/lib/catalog";

export type AdminOption = { id: string; name: string };

/** Every product (including hidden ones), for admin select boxes. */
export async function productOptions(locale: string): Promise<AdminOption[]> {
  const rows = await db.query.products.findMany({
    with: { translations: true },
    orderBy: [asc(products.sortOrder)],
  });

  return rows.map((product) => ({
    id: product.id,
    name: pickTranslation(product.translations, locale)?.name ?? product.id,
  }));
}

/** Journal tags, for the post editor's checkboxes. */
export async function blogTagOptions(locale: string): Promise<AdminOption[]> {
  const rows = await db.query.blogTags.findMany({
    with: { translations: true },
    orderBy: [asc(blogTags.sortOrder)],
  });

  return rows.map((tag) => ({
    id: tag.id,
    name: pickTranslation(tag.translations, locale)?.name ?? tag.id,
  }));
}
