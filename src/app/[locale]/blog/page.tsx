import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { findPublishedPosts, pickTranslation } from "@/lib/blog";
import { localizedAlternates } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Blog"),
  ]);
  return {
    title: t("title"),
    alternates: localizedAlternates(locale, "/blog"),
  };
}

export default async function BlogIndexPage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Blog"),
  ]);

  const posts = await findPublishedPosts(new Date());
  // Featured first, otherwise the query's newest-first order is preserved.
  const ordered = [...posts].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
  );
  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "medium",
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        {t("title")}
      </h1>

      {ordered.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((post) => {
            const tr = pickTranslation(post.translations, locale);
            if (!tr) return null;
            return (
              <Link
                key={post.id}
                href={`/blog/${tr.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border"
              >
                <div className="aspect-video overflow-hidden bg-muted">
                  {post.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="font-medium leading-snug">{tr.title}</h2>
                  {tr.excerpt ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {tr.excerpt}
                    </p>
                  ) : null}
                  {post.publishedAt ? (
                    <time className="mt-auto text-xs text-muted-foreground">
                      {dateFmt.format(post.publishedAt)}
                    </time>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
