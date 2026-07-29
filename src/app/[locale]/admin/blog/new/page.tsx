import { getTranslations } from "next-intl/server";

import { createPost } from "@/lib/admin/blog-actions";

import { PostForm } from "../post-form";

export default async function NewBlogPostPage() {
  const t = await getTranslations("Admin.blog");

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("newPost")}</h1>
      <PostForm action={createPost} />
    </main>
  );
}
