import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { CopyButton } from "@/components/shop/copy-button";
import { ArrowLink, BtnLink } from "@/components/ui/btn";
import { Breadcrumbs, Chip } from "@/components/ui/chip";
import { InstagramIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  extractHeadings,
  findPublishedPostBySlug,
  findRelatedPosts,
  pickTranslation,
  readingMinutes,
} from "@/lib/blog";
import { BRAND } from "@/lib/brand";
import { slugify } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
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
  for (const row of post.translations) {
    languages[row.locale] = localizedUrl(row.locale, `/blog/${row.slug}`);
  }
  languages["x-default"] = languages[routing.defaultLocale] ?? languages[locale];

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
 * Render the Markdown-ish body: split on blank lines, promote `##`/`###` to
 * headings (with the same anchor ids `extractHeadings` produces, so the table of
 * contents links land), turn `- ` runs into lists, and treat `> ` as a pull
 * quote. Everything else is a paragraph.
 *
 * No raw HTML is ever injected, so untrusted body content cannot script the
 * page — the trade-off is a small dialect rather than full Markdown.
 */
function renderBody(body: string) {
  const used = new Map<string, number>();

  function anchor(text: string): string {
    const base = slugify(text) || "section";
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  }

  return body.split(/\n{2,}/).map((block, index) => {
    const text = block.trim();
    if (!text) return null;

    if (text.startsWith("### ")) {
      return (
        <h3 key={index} className="mt-10 text-xl tracking-[-0.015em]">
          {text.slice(4)}
        </h3>
      );
    }

    if (text.startsWith("## ")) {
      const heading = text.slice(3).trim();
      return (
        <h2
          key={index}
          id={anchor(heading)}
          className="mt-12 scroll-mt-28 text-2xl tracking-[-0.02em]"
        >
          {heading}
        </h2>
      );
    }

    if (text.startsWith("> ")) {
      return (
        <blockquote
          key={index}
          className="my-12 border-l-2 border-ink-900 pl-7"
        >
          <p className="text-2xl leading-[1.35] tracking-[-0.02em]">
            {text
              .split("\n")
              .map((line) => line.replace(/^>\s?/, ""))
              .join(" ")}
          </p>
        </blockquote>
      );
    }

    const lines = text.split("\n");
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return (
        <ul key={index} className="mt-6 space-y-3 text-[15px] leading-[1.7] text-ink-700">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-4">
              {/* Centred on the first line of text, not on its ascender. */}
              <span className="mt-[0.8em] h-1 w-1 shrink-0 rounded-pill bg-ink-900" />
              {line.replace(/^[-*]\s+/, "")}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p
        key={index}
        className="mt-5 whitespace-pre-line text-[15px] leading-[1.8] text-ink-700"
      >
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
  const [{ slug }, rawLocale, t, region] = await Promise.all([
    params,
    getLocale(),
    getTranslations("Blog"),
    getRegion(),
  ]);

  const locale = resolveLocale(rawLocale);
  const now = new Date();

  const post = await findPublishedPostBySlug(locale, slug, now);
  if (!post) notFound();

  const tr = pickTranslation(post.translations, locale);
  const body = tr?.body ?? "";
  const headings = extractHeadings(body);
  const related = await findRelatedPosts(post, now);

  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "long",
  });
  const shortFmt = new Intl.DateTimeFormat(
    locale === "ka" ? "ka-GE" : "en-US",
    { dateStyle: "medium" },
  );

  const url = localizedUrl(locale, `/blog/${tr?.slug ?? slug}`);
  const leadTag = post.tags[0]
    ? pickTranslation(post.tags[0].tag.translations, locale)
    : null;

  const piece = post.product;
  const pieceTr = piece ? pickTranslation(piece.translations, locale) : null;
  const pieceImage = piece
    ? [...piece.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]
    : null;

  return (
    <SiteChrome locale={locale} section="journal">
      <JsonLd
        data={articleJsonLd({
          title: tr?.title ?? "",
          description: tr?.seoDescription ?? tr?.excerpt,
          image: post.coverUrl,
          datePublished: post.publishedAt?.toISOString(),
          url,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: BRAND.name, url: localizedUrl(locale, "") },
          { name: t("title"), url: localizedUrl(locale, "/blog") },
          { name: tr?.title ?? "", url },
        ])}
      />

      {/* title block */}
      <div className="mx-auto w-full max-w-[1600px] px-6 pb-10 pt-12 lg:px-10 lg:pt-16">
        <Breadcrumbs
          items={[
            { label: t("title"), href: "/blog" },
            ...(leadTag ? [{ label: leadTag.name }] : []),
          ]}
        />
        <h1 className="mt-7 max-w-3xl text-5xl leading-[0.95] tracking-[-0.035em] text-balance sm:text-6xl">
          {tr?.title}
        </h1>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-ink-200 pt-6 text-xs text-ink-500">
          {post.author?.name ? (
            <span className="text-ink-700">{post.author.name}</span>
          ) : null}
          {post.publishedAt ? (
            <time
              dateTime={post.publishedAt.toISOString()}
              className="tabular-nums"
            >
              {dateFmt.format(post.publishedAt)}
            </time>
          ) : null}
          <span>{t("readTime", { count: readingMinutes(body) })}</span>
          <span className="ml-auto flex items-center gap-2">
            <CopyButton
              value={url}
              label={t("copyLink")}
              copiedLabel={t("linkCopied")}
              className="border border-ink-300 px-3 py-1.5 text-[10px] hover:border-ink-900"
            />
            <a
              href={BRAND.instagram}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram"
              className="border border-ink-300 p-1.5 text-ink-500 transition-colors hover:border-ink-900 hover:text-ink-900"
            >
              <InstagramIcon className="h-3.5 w-3.5" />
            </a>
          </span>
        </div>
      </div>

      {post.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverUrl}
          alt=""
          className="h-[320px] w-full bg-accent-100 object-cover sm:h-[460px] lg:h-[560px]"
        />
      ) : null}

      {/* body */}
      <div className="mx-auto grid w-full max-w-[1600px] gap-12 px-6 py-14 lg:grid-cols-[200px_minmax(0,680px)_1fr] lg:gap-16 lg:px-10">
        <aside className="hidden lg:block">
          {headings.length > 1 ? (
            <nav className="sticky top-28" aria-label={t("inThisPiece")}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
                {t("inThisPiece")}
              </div>
              <ul className="mt-4 space-y-2.5">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className="text-left text-[13px] text-ink-500 transition-colors hover:text-ink-900"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </aside>

        <article>
          {tr?.excerpt ? (
            <p className="text-[19px] leading-[1.65] tracking-[-0.01em] text-ink-800">
              {tr.excerpt}
            </p>
          ) : null}
          {renderBody(body)}

          {post.tags.length > 0 ? (
            <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-ink-200 pt-8">
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
                {t("filedUnder")}
              </span>
              {post.tags.map((link) => {
                const tagTr = pickTranslation(link.tag.translations, locale);
                if (!tagTr) return null;
                return (
                  <Chip
                    key={link.tagId}
                    href={`/blog?tag=${encodeURIComponent(tagTr.slug)}`}
                  >
                    {tagTr.name}
                  </Chip>
                );
              })}
            </div>
          ) : null}
        </article>

        {/* shop the piece */}
        <aside className="lg:pl-4">
          {piece && pieceTr ? (
            <div className="sticky top-28 border border-ink-200 bg-white p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
                {t("inThisPiece")}
              </div>
              <Link
                href={`/product/${pieceTr.slug}`}
                className="mt-4 block bg-accent-100"
              >
                {pieceImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pieceImage.url}
                    alt={pieceTr.name}
                    className="h-[180px] w-full object-cover"
                  />
                ) : (
                  <div className="h-[180px] w-full" />
                )}
              </Link>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.16em]">
                  {pieceTr.name}
                </span>
                <span className="text-sm tabular-nums">
                  {formatPrice(
                    region === "GE" ? piece.priceGel : piece.priceUsd,
                    region,
                  )}
                </span>
              </div>
              <BtnLink
                href={`/product/${pieceTr.slug}`}
                full
                className="mt-5"
              >
                {t("shopThePiece")}
              </BtnLink>
            </div>
          ) : null}
        </aside>
      </div>

      {/* keep reading */}
      {related.length > 0 ? (
        <section className="mx-auto w-full max-w-[1600px] border-t border-ink-200 px-6 py-14 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-3xl tracking-[-0.025em]">{t("keepReading")}</h2>
            <ArrowLink href="/blog" className="hidden sm:inline-flex">
              {t("allPosts")}
            </ArrowLink>
          </div>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-3">
            {related.map((item) => {
              const itemTr = pickTranslation(item.translations, locale);
              if (!itemTr) return null;
              const tag = item.tags[0]
                ? pickTranslation(item.tags[0].tag.translations, locale)
                : null;

              return (
                <article key={item.id} className="group">
                  <Link
                    href={`/blog/${itemTr.slug}`}
                    className="block overflow-hidden bg-accent-100"
                  >
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.coverUrl}
                        alt=""
                        className="h-[200px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="h-[200px] w-full" />
                    )}
                  </Link>
                  {tag ? (
                    <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-ink-500">
                      {tag.name}
                    </div>
                  ) : null}
                  <h3 className="mt-2 text-lg leading-snug tracking-[-0.015em]">
                    <Link
                      href={`/blog/${itemTr.slug}`}
                      className="border-b border-transparent transition-colors hover:border-ink-900"
                    >
                      {itemTr.title}
                    </Link>
                  </h3>
                  <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
                    {item.publishedAt ? (
                      <time
                        dateTime={item.publishedAt.toISOString()}
                        className="tabular-nums"
                      >
                        {shortFmt.format(item.publishedAt)}
                      </time>
                    ) : null}
                    <span className="text-ink-300">·</span>
                    <span>
                      {t("readTime", { count: readingMinutes(itemTr.body) })}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </SiteChrome>
  );
}
