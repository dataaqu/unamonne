import { relations } from "drizzle-orm";
import {
  boolean,
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
  priceGel: integer("price_gel").notNull(),
  priceUsd: integer("price_usd").notNull(),
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

export const productsRelations = relations(products, ({ many, one }) => ({
  translations: many(productTranslations),
  images: many(productImages),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
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
