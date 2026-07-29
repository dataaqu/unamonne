"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { slugify } from "@/lib/catalog";
import { db } from "@/lib/db";
import { blogPostTags, blogPostTranslations, blogPosts } from "@/lib/db/schema";
import { scoreSeo } from "@/lib/seo/scorer";

import {
  blogPostFormSchema,
  extractBlogPostForm,
  isPublishStatus,
  type BlogPostFormValues,
} from "./blog-schema";
import { requireAdmin, type AdminFormState } from "./form";

function afterWrite(locale: string): never {
  revalidatePath(`/${locale}/admin/blog`);
  redirect(`/${locale}/admin/blog`);
}

type LocaleTranslation = {
  loc: "ka" | "en";
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  focusKeyword: string | null;
  seoScore: number;
};

/**
 * Build both translation rows from the form, auto-slugging blanks and computing
 * each locale's SEO score with the shared scorer, so the stored score always
 * matches what the editor showed.
 */
function buildTranslations(
  d: BlogPostFormValues,
  coverUrl: string | null,
): LocaleTranslation[] {
  const locales = [
    {
      loc: "ka" as const,
      title: d.titleKa,
      slug: d.slugKa || slugify(d.titleKa),
      excerpt: d.excerptKa,
      body: d.bodyKa,
      seoTitle: d.seoTitleKa,
      seoDescription: d.seoDescriptionKa,
      focusKeyword: d.focusKeywordKa,
    },
    {
      loc: "en" as const,
      title: d.titleEn,
      slug: d.slugEn || slugify(d.titleEn),
      excerpt: d.excerptEn,
      body: d.bodyEn,
      seoTitle: d.seoTitleEn,
      seoDescription: d.seoDescriptionEn,
      focusKeyword: d.focusKeywordEn,
    },
  ];

  return locales.map((l) => ({
    loc: l.loc,
    title: l.title,
    slug: l.slug,
    excerpt: l.excerpt || null,
    body: l.body,
    seoTitle: l.seoTitle || null,
    seoDescription: l.seoDescription || null,
    focusKeyword: l.focusKeyword || null,
    seoScore: scoreSeo({
      title: l.title,
      slug: l.slug,
      body: l.body,
      seoTitle: l.seoTitle || null,
      seoDescription: l.seoDescription || null,
      ogImage: coverUrl,
      focusKeyword: l.focusKeyword,
    }).score,
  }));
}

function readMeta(formData: FormData) {
  const status = formData.get("status");
  const coverUrl = formData
    .getAll("imageUrls")
    .map((v) => String(v).trim())
    .filter(Boolean)[0];
  const productId = String(formData.get("productId") ?? "").trim();
  return {
    status: isPublishStatus(status) ? status : "draft",
    isFeatured: formData.get("isFeatured") != null,
    coverUrl: coverUrl ?? null,
    // The piece the post is about, shown as the article's sidebar card.
    productId: productId || null,
    tagIds: formData
      .getAll("tagIds")
      .map((value) => String(value).trim())
      .filter(Boolean),
  };
}

/** Replace a post's tag links. The join table has nothing else to preserve. */
async function writeTags(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  postId: string,
  tagIds: string[],
) {
  await tx.delete(blogPostTags).where(eq(blogPostTags.postId, postId));
  if (tagIds.length > 0) {
    await tx
      .insert(blogPostTags)
      .values(tagIds.map((tagId) => ({ postId, tagId })))
      .onConflictDoNothing();
  }
}

export async function createPost(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = blogPostFormSchema.safeParse(extractBlogPostForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const locale = String(formData.get("locale") ?? "ka");
  const meta = readMeta(formData);
  const translations = buildTranslations(parsed.data, meta.coverUrl);

  await db.transaction(async (tx) => {
    const [post] = await tx
      .insert(blogPosts)
      .values({
        status: meta.status,
        coverUrl: meta.coverUrl,
        isFeatured: meta.isFeatured,
        productId: meta.productId,
        publishedAt: meta.status === "published" ? new Date() : null,
      })
      .returning();

    await tx.insert(blogPostTranslations).values(
      translations.map((t) => ({
        postId: post.id,
        locale: t.loc,
        title: t.title,
        slug: t.slug,
        excerpt: t.excerpt,
        body: t.body,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        ogImage: meta.coverUrl,
        focusKeyword: t.focusKeyword,
        seoScore: t.seoScore,
      })),
    );

    await writeTags(tx, post.id, meta.tagIds);
  });

  afterWrite(locale);
}

export async function updatePost(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "UNKNOWN" };

  const parsed = blogPostFormSchema.safeParse(extractBlogPostForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const locale = String(formData.get("locale") ?? "ka");
  const meta = readMeta(formData);
  const translations = buildTranslations(parsed.data, meta.coverUrl);

  await db.transaction(async (tx) => {
    const existing = await tx.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
    });
    // First transition into published stamps the publish time; later edits keep it.
    const publishedAt =
      meta.status === "published"
        ? (existing?.publishedAt ?? new Date())
        : null;

    await tx
      .update(blogPosts)
      .set({
        status: meta.status,
        coverUrl: meta.coverUrl,
        isFeatured: meta.isFeatured,
        productId: meta.productId,
        publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id));

    for (const t of translations) {
      await tx
        .update(blogPostTranslations)
        .set({
          title: t.title,
          slug: t.slug,
          excerpt: t.excerpt,
          body: t.body,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
          ogImage: meta.coverUrl,
          focusKeyword: t.focusKeyword,
          seoScore: t.seoScore,
        })
        .where(
          and(
            eq(blogPostTranslations.postId, id),
            eq(blogPostTranslations.locale, t.loc),
          ),
        );
    }

    await writeTags(tx, id, meta.tagIds);
  });

  afterWrite(locale);
}

export async function deletePost(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (id) {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }
  revalidatePath(`/${locale}/admin/blog`);
}
