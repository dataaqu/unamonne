import { getLocale, getTranslations } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { deletePost } from "@/lib/admin/blog-actions";
import { findPostsForAdmin, pickTranslation } from "@/lib/blog";

export default async function AdminBlogPage() {
  const [locale, t, tf] = await Promise.all([
    getLocale(),
    getTranslations("Admin.blog"),
    getTranslations("Admin.form"),
  ]);

  const posts = await findPostsForAdmin();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link href="/admin/blog/new" className={buttonVariants({ size: "sm" })}>
          {t("newPost")}
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tf("noItems")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-2 font-medium">{t("titleField")}</th>
              <th className="py-2 font-medium">{t("status")}</th>
              <th className="py-2 font-medium">{t("seoScore")}</th>
              <th className="py-2 text-right font-medium">{tf("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const tr = pickTranslation(post.translations, locale);
              return (
                <tr key={post.id} className="border-b">
                  <td className="py-2">
                    {tr?.title ?? "—"}
                    {post.isFeatured ? (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                        {tf("featured")}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2">{t(post.status)}</td>
                  <td className="py-2 tabular-nums">{tr?.seoScore ?? "—"}</td>
                  <td className="py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        {tf("edit")}
                      </Link>
                      <form action={deletePost}>
                        <input type="hidden" name="id" value={post.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button variant="ghost" size="sm" type="submit">
                          {tf("delete")}
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
