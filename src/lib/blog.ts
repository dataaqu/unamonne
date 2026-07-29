import { and, desc, eq, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { blogPostTranslations, blogPosts } from "@/lib/db/schema";

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

/** Published posts, newest first, for the public blog index (T5.5). */
export function findPublishedPosts(now: Date) {
  return db.query.blogPosts.findMany({
    where: and(
      eq(blogPosts.status, "published"),
      lte(blogPosts.publishedAt, now),
    ),
    orderBy: [desc(blogPosts.publishedAt)],
    ...withTranslations,
  });
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
    with: { post: { with: { translations: true } } },
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

/** One post with its translations for the admin editor (T5.2). */
export function findPostForAdmin(id: string) {
  return db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, id),
    ...withTranslations,
  });
}
