import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { JsonLd } from "@/components/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { findPublishedPostBySlug, pickTranslation } from "@/lib/blog";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { localizedUrl } from "@/lib/seo/metadata";

function resolveLocale(locale: string): "ka" | "en" {
  return routing.locales.includes(locale as "ka" | "en")
    ? (locale as "ka" | "en")
    : routing.defaultLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = resolveLocale(await getLocale());
  const post = await findPublishedPostBySlug(locale, slug, new Date());
  if (!post) return {};

  const tr = pickTranslation(post.translations, locale);
  const title = tr?.seoTitle || tr?.title;
  const description = tr?.seoDescription || tr?.excerpt || undefined;

  // Per-locale slugs differ, so alternates come from the post's own translations.
  const languages: Record<string, string> = {};
  for (const t of post.translations) {
    languages[t.locale] = localizedUrl(t.locale, `/blog/${t.slug}`);
  }
  languages["x-default"] =
    languages[routing.defaultLocale] ?? languages[locale];

  return {
    title,
    description,
    alternates: {
      canonical: localizedUrl(locale, `/blog/${tr?.slug ?? slug}`),
      languages,
    },
    openGraph: {
      type: "article",
      title,
      description,
      images: post.coverUrl ? [post.coverUrl] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Render the Markdown-ish body safely: split on blank lines, promote ##/###
 * lines to headings, everything else is a paragraph. No raw HTML is injected,
 * so untrusted body content cannot script the page.
 */
function renderBody(body: string) {
  return body.split(/\n{2,}/).map((block, index) => {
    const text = block.trim();
    if (text.startsWith("### ")) {
      return (
        <h3 key={index} className="mt-6 text-lg font-semibold">
          {text.slice(4)}
        </h3>
      );
    }
    if (text.startsWith("## ")) {
      return (
        <h2 key={index} className="mt-8 text-xl font-semibold">
          {text.slice(3)}
        </h2>
      );
    }
    return (
      <p key={index} className="mt-4 whitespace-pre-line leading-relaxed">
        {text}
      </p>
    );
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale, t] = await Promise.all([
    params,
    getLocale(),
    getTranslations("Blog"),
  ]);

  const activeLocale = resolveLocale(locale);

  const post = await findPublishedPostBySlug(activeLocale, slug, new Date());
  if (!post) notFound();

  const tr = pickTranslation(post.translations, activeLocale);
  const dateFmt = new Intl.DateTimeFormat(
    activeLocale === "ka" ? "ka-GE" : "en-US",
    { dateStyle: "long" },
  );

  const url = localizedUrl(activeLocale, `/blog/${tr?.slug ?? slug}`);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <JsonLd
        data={articleJsonLd({
          title: tr?.title ?? "",
          description: tr?.seoDescription ?? tr?.excerpt,
          image: post.coverUrl,
          datePublished: post.publishedAt?.toISOString(),
          url,
        })}
      />
      <Link
        href="/blog"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← {t("back")}
      </Link>

      <article className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">{tr?.title}</h1>
        {post.publishedAt ? (
          <time className="mt-2 block text-sm text-muted-foreground">
            {dateFmt.format(post.publishedAt)}
          </time>
        ) : null}

        {post.coverUrl ? (
          <div className="mt-6 aspect-video overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mt-6 text-[15px]">{renderBody(tr?.body ?? "")}</div>
      </article>
    </main>
  );
}
