import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
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

export const blogPostsRelations = relations(blogPosts, ({ many, one }) => ({
  translations: many(blogPostTranslations),
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
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
