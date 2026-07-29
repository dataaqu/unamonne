import { getLocale, getTranslations } from "next-intl/server";

import { createPost } from "@/lib/admin/blog-actions";
import { blogTagOptions, productOptions } from "@/lib/admin/options";

import { PostForm } from "../post-form";

export default async function NewBlogPostPage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Admin.blog"),
  ]);

  const [products, tags] = await Promise.all([
    productOptions(locale),
    blogTagOptions(locale),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("newPost")}</h1>
      <PostForm action={createPost} products={products} tags={tags} />
    </main>
  );
}
