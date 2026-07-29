import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { updatePost } from "@/lib/admin/blog-actions";
import { blogTagOptions, productOptions } from "@/lib/admin/options";
import { findPostForAdmin } from "@/lib/blog";
import type { BlogPostTranslation } from "@/lib/db/schema";

import { PostForm } from "../../post-form";

function fields(tr: BlogPostTranslation | undefined) {
  return {
    title: tr?.title ?? "",
    slug: tr?.slug ?? "",
    excerpt: tr?.excerpt ?? "",
    body: tr?.body ?? "",
    seoTitle: tr?.seoTitle ?? "",
    seoDescription: tr?.seoDescription ?? "",
    focusKeyword: tr?.focusKeyword ?? "",
  };
}

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, locale, t] = await Promise.all([
    params,
    getLocale(),
    getTranslations("Admin.blog"),
  ]);

  const post = await findPostForAdmin(id);
  if (!post) notFound();

  const [products, tags] = await Promise.all([
    productOptions(locale),
    blogTagOptions(locale),
  ]);

  const byLocale = (loc: "ka" | "en") =>
    post.translations.find((tr) => tr.locale === loc);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("editPost")}</h1>
      <PostForm
        action={updatePost}
        products={products}
        tags={tags}
        initial={{
          id: post.id,
          status: post.status,
          isFeatured: post.isFeatured,
          coverUrls: post.coverUrl ? [post.coverUrl] : [],
          productId: post.productId ?? "",
          tagIds: post.tags.map((link) => link.tagId),
          ka: fields(byLocale("ka")),
          en: fields(byLocale("en")),
        }}
      />
    </main>
  );
}
