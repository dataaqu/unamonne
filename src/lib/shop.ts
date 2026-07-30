import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gt,
  ilike,
  inArray,
  lte,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm";

import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import {
  categories,
  categoryTranslations,
  productTranslations,
  productVariants,
  products,
} from "@/lib/db/schema";
import type { Region } from "@/lib/region";

/** Visible categories, ordered, with their translations. */
export function getVisibleCategories() {
  return db.query.categories.findMany({
    where: eq(categories.isVisible, true),
    with: { translations: true },
    orderBy: [asc(categories.sortOrder)],
  });
}

const listRelations = {
  translations: true,
  images: true,
  variants: true,
} as const;

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
    with: listRelations,
    orderBy: [asc(products.sortOrder)],
    limit: options?.limit,
  });
}

/* --------------------------------- stock -------------------------------- */

type StockShape = {
  stock: number;
  isOutOfStock: boolean;
  variants?: { stock: number; isMadeToOrder: boolean }[];
};

/**
 * Whether a piece can be bought at all.
 *
 * A product with variants delegates availability to them entirely: the
 * product-level `stock` column is only the count for a piece that has no sizes.
 * A made-to-order variant counts as available — the studio will cut one — which
 * is why this is not simply `stock > 0`.
 */
export function isProductAvailable(product: StockShape): boolean {
  if (product.isOutOfStock) return false;
  const variants = product.variants ?? [];
  if (variants.length > 0) {
    return variants.some((v) => v.stock > 0 || v.isMadeToOrder);
  }
  return product.stock > 0;
}

/** A made-to-order size has no shelf count; cap it at a sane per-order run. */
export const MADE_TO_ORDER_CAP = 5;

/** How many units of one configuration can actually be added to a bag. */
export function availableStock(
  product: {
    stock: number;
    isOutOfStock: boolean;
    variants?: { id: string; stock: number; isMadeToOrder: boolean }[];
  },
  variantId?: string | null,
): number {
  if (product.isOutOfStock) return 0;
  const variants = product.variants ?? [];

  if (variants.length > 0) {
    if (!variantId) return 0;
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return 0;
    if (variant.stock > 0) return variant.stock;
    return variant.isMadeToOrder ? MADE_TO_ORDER_CAP : 0;
  }
  return product.stock;
}

/* -------------------------------- browsing ------------------------------- */

export type SortKey = "new" | "low" | "high";

export type ShopQuery = {
  locale: Locale;
  region: Region;
  /** Category slug in `locale`, or undefined for everything. */
  categorySlug?: string;
  /** Free-text search over the localized name and description. */
  q?: string;
  /** Inclusive ceiling in the region's currency, minor units. */
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

export const SHOP_PER_PAGE = 12;

/**
 * A product has no variant rows at all — the case where its own `stock` column
 * is the count that matters.
 */
function hasNoVariants() {
  return not(
    exists(
      db
        .select({ one: sql`1` })
        .from(productVariants)
        .where(eq(productVariants.productId, products.id)),
    ),
  );
}

/** …or it has at least one variant that can be bought. */
function hasAvailableVariant() {
  return exists(
    db
      .select({ one: sql`1` })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, products.id),
          or(
            gt(productVariants.stock, 0),
            eq(productVariants.isMadeToOrder, true),
          ),
        ),
      ),
  );
}

function shopConditions(query: ShopQuery, categoryId: string | null) {
  const priceColumn =
    query.region === "GE" ? products.priceGel : products.priceUsd;

  const conditions = [eq(products.isHidden, false)];

  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (query.maxPrice !== undefined) {
    conditions.push(lte(priceColumn, query.maxPrice));
  }

  const term = query.q?.trim();
  if (term) {
    const pattern = `%${term}%`;
    conditions.push(
      inArray(
        products.id,
        db
          .select({ id: productTranslations.productId })
          .from(productTranslations)
          .where(
            or(
              ilike(productTranslations.name, pattern),
              ilike(productTranslations.description, pattern),
            ),
          ),
      ),
    );
  }

  if (query.inStockOnly) {
    conditions.push(eq(products.isOutOfStock, false));
    const available = or(
      hasAvailableVariant(),
      and(hasNoVariants(), gt(products.stock, 0)),
    );
    if (available) conditions.push(available);
  }

  return and(...conditions);
}

function shopOrder(query: ShopQuery) {
  const priceColumn =
    query.region === "GE" ? products.priceGel : products.priceUsd;
  if (query.sort === "low") return [asc(priceColumn), asc(products.sortOrder)];
  if (query.sort === "high") return [desc(priceColumn), asc(products.sortOrder)];
  // "Newest" respects the curated order first — the studio decides what leads.
  return [asc(products.sortOrder), desc(products.createdAt)];
}

export type ShopProduct = Awaited<ReturnType<typeof getVisibleProducts>>[number];

export type ShopResult = {
  items: ShopProduct[];
  total: number;
  page: number;
  pageCount: number;
};

/**
 * The catalog listing behind /shop and /category/[slug]: filters, sort and
 * pagination all resolved in SQL, so a filtered view is a plain URL a shopper
 * can share and a crawler can walk.
 */
export async function getShopProducts(query: ShopQuery): Promise<ShopResult> {
  let categoryId: string | null = null;
  if (query.categorySlug) {
    const tr = await db.query.categoryTranslations.findFirst({
      where: and(
        eq(categoryTranslations.locale, query.locale),
        eq(categoryTranslations.slug, query.categorySlug),
      ),
    });
    // An unknown slug must return nothing, never the unfiltered catalog.
    if (!tr) return { items: [], total: 0, page: 1, pageCount: 0 };
    categoryId = tr.categoryId;
  }

  const where = shopConditions(query, categoryId);
  const perPage = query.perPage ?? SHOP_PER_PAGE;
  const page = Math.max(1, query.page ?? 1);

  const [totals, items] = await Promise.all([
    db.select({ value: count() }).from(products).where(where),
    db.query.products.findMany({
      where,
      with: listRelations,
      orderBy: shopOrder(query),
      limit: perPage,
      offset: (page - 1) * perPage,
    }),
  ]);

  const total = Number(totals[0]?.value ?? 0);
  return { items, total, page, pageCount: Math.ceil(total / perPage) };
}

/** How many visible products sit in each category, for the filter counts. */
export async function getCategoryCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({ categoryId: products.categoryId, value: count() })
    .from(products)
    .where(eq(products.isHidden, false))
    .groupBy(products.categoryId);

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.categoryId) counts.set(row.categoryId, Number(row.value));
  }
  return counts;
}

export type CategoryCard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number;
  coverUrl: string | null;
};

/**
 * Categories with a count and a cover shot for the homepage tiles. The cover is
 * the first image of the category's leading product rather than a separate
 * upload — one fewer thing for the studio to keep in sync, and it is always a
 * picture of something actually on sale.
 */
export async function getCategoryCards(locale: string): Promise<CategoryCard[]> {
  const [categoryRows, productRows] = await Promise.all([
    getVisibleCategories(),
    db.query.products.findMany({
      where: eq(products.isHidden, false),
      with: { images: true },
      orderBy: [asc(products.sortOrder)],
      columns: { id: true, categoryId: true },
    }),
  ]);

  const covers = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const product of productRows) {
    if (!product.categoryId) continue;
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    if (!covers.has(product.categoryId)) {
      const image = [...product.images].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      )[0];
      if (image) covers.set(product.categoryId, image.url);
    }
  }

  return categoryRows
    .map((category) => {
      const tr =
        category.translations.find((t) => t.locale === locale) ??
        category.translations[0];
      if (!tr) return null;
      return {
        id: category.id,
        name: tr.name,
        slug: tr.slug,
        description: tr.description,
        count: counts.get(category.id) ?? 0,
        coverUrl: covers.get(category.id) ?? null,
      };
    })
    .filter((card) => card !== null);
}

/** The most expensive visible piece, so the price filter knows its ceiling. */
export async function getPriceCeiling(region: Region): Promise<number> {
  const column = region === "GE" ? products.priceGel : products.priceUsd;
  const [row] = await db
    .select({ value: sql<number>`coalesce(max(${column}), 0)` })
    .from(products)
    .where(eq(products.isHidden, false));
  return Number(row?.value ?? 0);
}

/** A visible category by its per-locale slug (products come from `getShopProducts`). */
export async function getCategoryBySlug(locale: Locale, slug: string) {
  const tr = await db.query.categoryTranslations.findFirst({
    where: and(
      eq(categoryTranslations.locale, locale),
      eq(categoryTranslations.slug, slug),
    ),
  });
  if (!tr) return null;

  const category = await db.query.categories.findFirst({
    where: and(eq(categories.id, tr.categoryId), eq(categories.isVisible, true)),
    with: { translations: true },
  });
  return category ?? null;
}

/* -------------------------------- product -------------------------------- */

/** A visible product by its per-locale slug, with everything the page renders. */
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
      variants: {
        orderBy: [asc(productVariants.sortOrder), asc(productVariants.label)],
      },
      specs: true,
      category: { with: { translations: true } },
    },
  });
  return product ?? null;
}

/** A product by id with its variants — what cart mutations validate against. */
export function getBuyableProduct(id: string) {
  return db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.isHidden, false)),
    with: { variants: true, translations: true },
  });
}

/**
 * "Pairs well with" — other visible pieces from the same category, topped up
 * with featured pieces when a category is thin (or absent), so the rail is
 * never half-empty.
 */
export async function getRelatedProducts(
  product: { id: string; categoryId: string | null },
  limit = 4,
): Promise<ShopProduct[]> {
  const sameCategory = product.categoryId
    ? await db.query.products.findMany({
        where: and(
          eq(products.isHidden, false),
          eq(products.categoryId, product.categoryId),
          ne(products.id, product.id),
        ),
        with: listRelations,
        orderBy: [asc(products.sortOrder)],
        limit,
      })
    : [];

  if (sameCategory.length >= limit) return sameCategory;

  const seen = new Set([product.id, ...sameCategory.map((p) => p.id)]);
  const filler = await db.query.products.findMany({
    where: and(eq(products.isHidden, false), eq(products.isFeatured, true)),
    with: listRelations,
    orderBy: [asc(products.sortOrder)],
    limit: limit + seen.size,
  });

  return [...sameCategory, ...filler.filter((p) => !seen.has(p.id))].slice(
    0,
    limit,
  );
}
