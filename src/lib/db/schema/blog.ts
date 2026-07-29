import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { products } from "./catalog";
import { locale } from "./common";

/**
 * Bilingual blog (T5.x). Language-neutral state (status, cover, author, feature
 * flag, publish time) lives on `blog_post`; everything translatable — including
 * the per-locale slug for localized URLs and the SEO fields the in-admin scorer
 * (T5.3) writes — lives on `blog_post_translation`, mirroring the catalog.
 */
export const blogStatus = pgEnum("blog_status", ["draft", "published"]);

export const blogPosts = pgTable("blog_post", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  coverUrl: text("cover_url"),
  status: blogStatus("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { mode: "date" }),
  authorId: text("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  /**
   * The piece the post is about, surfaced as the "in this piece" card in the
   * article sidebar. Set-null on delete: a post outlives a discontinued piece.
   */
  productId: text("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const blogPostTranslations = pgTable(
  "blog_post_translation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    body: text("body").notNull(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImage: text("og_image"),
    focusKeyword: text("focus_keyword"),
    // 0-100 score from the in-admin SEO scorer (T5.3), recomputed on save.
    seoScore: integer("seo_score"),
  },
  (t) => [
    uniqueIndex("blog_post_translation_post_locale_uq").on(t.postId, t.locale),
    uniqueIndex("blog_post_translation_locale_slug_uq").on(t.locale, t.slug),
  ],
);

/**
 * Journal tags ("Workshop", "Guide", "Material", "Care"). Language-neutral
 * ordering lives on the tag; the display name and the per-locale slug live on
 * the translation, mirroring categories and products.
 */
export const blogTags = pgTable("blog_tag", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const blogTagTranslations = pgTable(
  "blog_tag_translation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tagId: text("tag_id")
      .notNull()
      .references(() => blogTags.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [
    uniqueIndex("blog_tag_translation_tag_locale_uq").on(t.tagId, t.locale),
    uniqueIndex("blog_tag_translation_locale_slug_uq").on(t.locale, t.slug),
  ],
);

export const blogPostTags = pgTable(
  "blog_post_tag",
  {
    postId: text("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => blogTags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

export const blogPostsRelations = relations(blogPosts, ({ many, one }) => ({
  translations: many(blogPostTranslations),
  tags: many(blogPostTags),
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [blogPosts.productId],
    references: [products.id],
  }),
}));

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  translations: many(blogTagTranslations),
  posts: many(blogPostTags),
}));

export const blogTagTranslationsRelations = relations(
  blogTagTranslations,
  ({ one }) => ({
    tag: one(blogTags, {
      fields: [blogTagTranslations.tagId],
      references: [blogTags.id],
    }),
  }),
);

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}));

export const blogPostTranslationsRelations = relations(
  blogPostTranslations,
  ({ one }) => ({
    post: one(blogPosts, {
      fields: [blogPostTranslations.postId],
      references: [blogPosts.id],
    }),
  }),
);

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type BlogPostTranslation = typeof blogPostTranslations.$inferSelect;
export type NewBlogPostTranslation = typeof blogPostTranslations.$inferInsert;
export type BlogTag = typeof blogTags.$inferSelect;
export type NewBlogTag = typeof blogTags.$inferInsert;
export type BlogTagTranslation = typeof blogTagTranslations.$inferSelect;
export type NewBlogTagTranslation = typeof blogTagTranslations.$inferInsert;
