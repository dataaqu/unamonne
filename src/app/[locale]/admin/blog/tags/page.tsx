import { getLocale, getTranslations } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { findBlogTags } from "@/lib/blog";
import { deleteBlogTag } from "@/lib/admin/blog-tag-actions";

import { TagForm } from "./tag-form";

export default async function AdminBlogTagsPage() {
  const [locale, t, tf] = await Promise.all([
    getLocale(),
    getTranslations("Admin.blog"),
    getTranslations("Admin.form"),
  ]);

  const tags = await findBlogTags();

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("tags")}</h1>
        <Link
          href="/admin/blog"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t("title")}
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">{t("tagsHelp")}</p>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-medium">{t("newTag")}</h2>
        <TagForm />
      </section>

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tf("noItems")}</p>
      ) : (
        <ul className="space-y-3">
          {tags.map((tag) => {
            const ka = tag.translations.find((row) => row.locale === "ka");
            const en = tag.translations.find((row) => row.locale === "en");
            return (
              <li
                key={tag.id}
                className="flex flex-wrap items-end justify-between gap-3 rounded-lg border p-4"
              >
                <TagForm
                  id={tag.id}
                  nameKa={ka?.name ?? ""}
                  nameEn={en?.name ?? ""}
                  sortOrder={tag.sortOrder}
                />
                <form action={deleteBlogTag}>
                  <input type="hidden" name="id" value={tag.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <Button type="submit" variant="ghost" size="sm">
                    {tf("delete")}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
