import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { locale } from "./common";

/**
 * Categories. Translatable content (name/slug/description) lives in
 * `category_translation`; language-neutral state (ordering, visibility,
 * optional parent for nesting) lives here.
 */
export const categories = pgTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").references((): AnyPgColumn => categories.id, {
    onDelete: "set null",
  }),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const categoryTranslations = pgTable(
  "category_translation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
  },
  (t) => [
    // One translation per (category, locale); slugs unique per locale for URLs.
    uniqueIndex("category_translation_category_locale_uq").on(
      t.categoryId,
      t.locale,
    ),
    uniqueIndex("category_translation_locale_slug_uq").on(t.locale, t.slug),
  ],
);

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  translations: many(categoryTranslations),
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_parent",
  }),
  children: many(categories, { relationName: "category_parent" }),
}));

export const categoryTranslationsRelations = relations(
  categoryTranslations,
  ({ one }) => ({
    category: one(categories, {
      fields: [categoryTranslations.categoryId],
      references: [categories.id],
    }),
  }),
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryTranslation = typeof categoryTranslations.$inferSelect;
export type NewCategoryTranslation = typeof categoryTranslations.$inferInsert;

/**
 * Products. Region pricing is stored as two integer columns in minor units
 * (tetri for GEL, cents for USD) — never floats — so currency math is exact.
 * `isOutOfStock` is a manual admin toggle, separate from the `stock` count.
 * Translatable name/slug/description live in `product_translation`; media
 * (Cloudflare URLs, wired in T2.3) in `product_image`.
 */
export const products = pgTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  /** Reference the studio prints on the tag, e.g. UNM-SIG-16. */
  sku: text("sku"),
  /**
   * Run size for a limited edition ("Edition of 40" on the card). Null means an
   * open run — the badge is simply not shown.
   */
  editionSize: integer("edition_size"),
  priceGel: integer("price_gel").notNull(),
  priceUsd: integer("price_usd").notNull(),
  /**
   * Stock for a product without variants. When a product HAS variants, the
   * variant rows own the counts and this column is ignored for availability —
   * see `productStock()` in src/lib/shop.ts.
   */
  stock: integer("stock").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isHidden: boolean("is_hidden").notNull().default(false),
  isOutOfStock: boolean("is_out_of_stock").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const productTranslations = pgTable(
  "product_translation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
  },
  (t) => [
    uniqueIndex("product_translation_product_locale_uq").on(
      t.productId,
      t.locale,
    ),
    uniqueIndex("product_translation_locale_slug_uq").on(t.locale, t.slug),
  ],
);

export const productImages = pgTable("product_image", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * A buyable option of a product — a ring size, a chain length, a metal. Stock
 * is per variant, because "size 18 is gone" is the honest answer a jewellery
 * buyer needs; the product-level `stock` column only applies when a product has
 * no variants at all.
 *
 * `isMadeToOrder` is the third state between in stock and sold out: nothing on
 * the shelf, but the studio will cut one — it stays orderable with a longer
 * lead time instead of being struck through.
 *
 * Variants do not carry their own price. Every size of a piece costs the same
 * in this catalog, and a per-variant price would have to be snapshotted in both
 * currencies everywhere a price already is.
 */
export const productVariants = pgTable(
  "product_variant",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Short, language-neutral: "16", "42 cm", "Gold". */
    label: text("label").notNull(),
    sku: text("sku"),
    stock: integer("stock").notNull().default(0),
    isMadeToOrder: boolean("is_made_to_order").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("product_variant_product_label_uq").on(t.productId, t.label)],
);

/**
 * The spec table under the product description (Metal / Weight / Made in …).
 * Rows are per locale, because both the label and the value are prose.
 */
export const productSpecs = pgTable(
  "product_spec",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_spec_product_locale_idx").on(t.productId, t.locale)],
);

export const productsRelations = relations(products, ({ many, one }) => ({
  translations: many(productTranslations),
  images: many(productImages),
  variants: many(productVariants),
  specs: many(productSpecs),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const productSpecsRelations = relations(productSpecs, ({ one }) => ({
  product: one(products, {
    fields: [productSpecs.productId],
    references: [products.id],
  }),
}));

export const productTranslationsRelations = relations(
  productTranslations,
  ({ one }) => ({
    product: one(products, {
      fields: [productTranslations.productId],
      references: [products.id],
    }),
  }),
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductTranslation = typeof productTranslations.$inferSelect;
export type NewProductTranslation = typeof productTranslations.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductSpec = typeof productSpecs.$inferSelect;
export type NewProductSpec = typeof productSpecs.$inferInsert;
