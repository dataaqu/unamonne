import { and, asc, desc, eq, inArray, lte, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  blogPostTags,
  blogPostTranslations,
  blogPosts,
  blogTagTranslations,
  blogTags,
} from "@/lib/db/schema";
import { slugify } from "@/lib/catalog";

export { pickTranslation } from "@/lib/catalog";

/**
 * A post is publicly visible only when published AND its publish time has
 * arrived — a future `publishedAt` schedules a post without exposing it. Pure,
 * so the visibility rule is testable without a clock or database.
 */
export function isPostPublished(
  post: { status: string; publishedAt: Date | null },
  now: Date,
): boolean {
  return (
    post.status === "published" &&
    post.publishedAt !== null &&
    post.publishedAt <= now
  );
}

const withTranslations = { with: { translations: true } } as const;

const withTranslationsAndTags = {
  with: {
    translations: true,
    tags: { with: { tag: { with: { translations: true } } } },
  },
} as const;

/** Published posts, newest first, for the public blog index (T5.5). */
export function findPublishedPosts(now: Date) {
  return db.query.blogPosts.findMany({
    where: and(
      eq(blogPosts.status, "published"),
      lte(blogPosts.publishedAt, now),
    ),
    orderBy: [desc(blogPosts.publishedAt)],
    ...withTranslationsAndTags,
  });
}

export type JournalPost = Awaited<
  ReturnType<typeof findPublishedPosts>
>[number];

/**
 * Published posts for the journal index, optionally narrowed to one tag by its
 * localized slug. An unknown slug returns nothing rather than everything, for
 * the same reason an unknown category slug does on /shop.
 */
export async function findJournalPosts(
  locale: "ka" | "en",
  now: Date,
  tagSlug?: string,
): Promise<JournalPost[]> {
  if (!tagSlug) return findPublishedPosts(now);

  const tag = await db.query.blogTagTranslations.findFirst({
    where: and(
      eq(blogTagTranslations.locale, locale),
      eq(blogTagTranslations.slug, tagSlug),
    ),
    columns: { tagId: true },
  });
  if (!tag) return [];

  const links = await db.query.blogPostTags.findMany({
    where: eq(blogPostTags.tagId, tag.tagId),
    columns: { postId: true },
  });
  if (links.length === 0) return [];

  return db.query.blogPosts.findMany({
    where: and(
      eq(blogPosts.status, "published"),
      lte(blogPosts.publishedAt, now),
      inArray(
        blogPosts.id,
        links.map((link) => link.postId),
      ),
    ),
    orderBy: [desc(blogPosts.publishedAt)],
    ...withTranslationsAndTags,
  });
}

/** Every journal tag with its translations, for the filter chips. */
export function findBlogTags() {
  return db.query.blogTags.findMany({
    with: { translations: true },
    orderBy: [asc(blogTags.sortOrder)],
  });
}

/**
 * Other published posts to keep reading, preferring ones that share a tag with
 * the current post and topping up with the newest so the rail is never short.
 */
export async function findRelatedPosts(
  post: { id: string; tags: { tagId: string }[] },
  now: Date,
  limit = 3,
): Promise<JournalPost[]> {
  const published = and(
    eq(blogPosts.status, "published"),
    lte(blogPosts.publishedAt, now),
    ne(blogPosts.id, post.id),
  );

  const tagIds = post.tags.map((t) => t.tagId);
  let sameTag: JournalPost[] = [];

  if (tagIds.length > 0) {
    const links = await db.query.blogPostTags.findMany({
      where: inArray(blogPostTags.tagId, tagIds),
      columns: { postId: true },
    });
    const ids = [...new Set(links.map((l) => l.postId))].filter(
      (id) => id !== post.id,
    );
    if (ids.length > 0) {
      sameTag = await db.query.blogPosts.findMany({
        where: and(published, inArray(blogPosts.id, ids)),
        orderBy: [desc(blogPosts.publishedAt)],
        limit,
        ...withTranslationsAndTags,
      });
    }
  }

  if (sameTag.length >= limit) return sameTag;

  const seen = new Set([post.id, ...sameTag.map((p) => p.id)]);
  const newest = await db.query.blogPosts.findMany({
    where: published,
    orderBy: [desc(blogPosts.publishedAt)],
    limit: limit + seen.size,
    ...withTranslationsAndTags,
  });

  return [...sameTag, ...newest.filter((p) => !seen.has(p.id))].slice(0, limit);
}

/* ------------------------------ article shape ----------------------------- */

const WORDS_PER_MINUTE = 200;

/** Reading time, derived from the body rather than stored and left to rot. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export type Heading = { id: string; text: string };

/**
 * The "in this piece" rail, built from the `##` headings in the body — the same
 * headings `renderBody` turns into `<h2 id>`, so the anchors always line up.
 */
export function extractHeadings(body: string): Heading[] {
  const headings: Heading[] = [];
  const used = new Map<string, number>();

  for (const line of body.split("\n")) {
    if (!line.startsWith("## ") || line.startsWith("### ")) continue;
    const text = line.slice(3).trim();
    if (!text) continue;

    // Two sections can legitimately share a title; anchors cannot.
    const base = slugify(text) || "section";
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    headings.push({ id: seen === 0 ? base : `${base}-${seen + 1}`, text });
  }

  return headings;
}

/**
 * A single published post by its localized slug. Resolves the translation
 * first, then re-checks the post is actually published (so a draft's slug never
 * leaks). Returns null when missing or unpublished.
 */
export async function findPublishedPostBySlug(
  locale: "ka" | "en",
  slug: string,
  now: Date,
) {
  const translation = await db.query.blogPostTranslations.findFirst({
    where: and(
      eq(blogPostTranslations.locale, locale),
      eq(blogPostTranslations.slug, slug),
    ),
    with: {
      post: {
        with: {
          translations: true,
          tags: { with: { tag: { with: { translations: true } } } },
          // The "in this piece" card in the article sidebar.
          product: { with: { translations: true, images: true, variants: true } },
          author: { columns: { name: true, image: true } },
        },
      },
    },
  });

  if (!translation || !isPostPublished(translation.post, now)) return null;
  return translation.post;
}

/** All posts (any status) for the admin list (T5.2). */
export function findPostsForAdmin() {
  return db.query.blogPosts.findMany({
    orderBy: [desc(blogPosts.updatedAt)],
    ...withTranslations,
  });
}

/** One post with its translations and tag links for the admin editor (T5.2). */
export function findPostForAdmin(id: string) {
  return db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, id),
    with: { translations: true, tags: true },
  });
}
