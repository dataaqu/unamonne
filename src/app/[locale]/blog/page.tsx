import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { NewsletterForm } from "@/components/layout/newsletter-form";
import { SiteChrome } from "@/components/layout/site-chrome";
import { ArrowLink, BtnLink } from "@/components/ui/btn";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/notice";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  findBlogTags,
  findJournalPosts,
  pickTranslation,
  readingMinutes,
  type JournalPost,
} from "@/lib/blog";
import { localizedAlternates } from "@/lib/seo/metadata";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Blog"),
  ]);
  return {
    title: t("title"),
    description: t("heroBody"),
    alternates: localizedAlternates(locale, "/blog"),
  };
}

async function safely<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch {
    return fallback;
  }
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [sp, locale, t, tNews] = await Promise.all([
    searchParams,
    getLocale() as Promise<Locale>,
    getTranslations("Blog"),
    getTranslations("Newsletter"),
  ]);

  const rawTag = sp.tag;
  const tagSlug = (Array.isArray(rawTag) ? rawTag[0] : rawTag) || undefined;

  const [posts, tags] = await Promise.all([
    safely(() => findJournalPosts(locale, new Date(), tagSlug), []),
    safely(() => findBlogTags(), []),
  ]);

  // Featured first; within that the query's newest-first order is preserved.
  const ordered = [...posts].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
  );
  // Only lead with a featured post on the unfiltered index — inside a tag the
  // reader asked for a list, not an editor's pick.
  const lead = !tagSlug && ordered[0]?.isFeatured ? ordered[0] : null;
  const archive = lead ? ordered.slice(1) : ordered;

  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "medium",
  });

  function meta(post: JournalPost, body: string) {
    return (
      <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
        {post.publishedAt ? (
          <time
            dateTime={post.publishedAt.toISOString()}
            className="tabular-nums"
          >
            {dateFmt.format(post.publishedAt)}
          </time>
        ) : null}
        <span className="text-ink-300">·</span>
        <span>{t("readTime", { count: readingMinutes(body) })}</span>
      </div>
    );
  }

  const leadTr = lead ? pickTranslation(lead.translations, locale) : null;

  return (
    <SiteChrome locale={locale} section="journal">
      <div className="mx-auto w-full max-w-[1600px] px-6 lg:px-10">
        <div className="border-b border-ink-900 py-14">
          <div className="text-[10px] uppercase tracking-[0.24em] text-ink-500">
            {t("kicker")}
          </div>
          <h1 className="mt-5 max-w-2xl text-5xl leading-[0.94] tracking-[-0.035em] text-balance sm:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-ink-600">
            {t("heroBody")}
          </p>
        </div>

        {lead && leadTr ? (
          <article className="group grid gap-8 border-b border-ink-200 py-12 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
            <Link
              href={`/blog/${leadTr.slug}`}
              className="overflow-hidden bg-accent-100"
            >
              {lead.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lead.coverUrl}
                  alt=""
                  className="h-[280px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] sm:h-[420px]"
                />
              ) : (
                <div className="h-[280px] w-full sm:h-[420px]" />
              )}
            </Link>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-ink-500">
                <span className="bg-brand-100 px-2.5 py-1 text-ink-900">
                  {t("featured")}
                </span>
                {lead.tags[0] ? (
                  <span>
                    {pickTranslation(lead.tags[0].tag.translations, locale)?.name}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-6 text-3xl leading-[1.05] tracking-[-0.025em] text-balance sm:text-4xl">
                <Link
                  href={`/blog/${leadTr.slug}`}
                  className="border-b border-transparent transition-colors hover:border-ink-900"
                >
                  {leadTr.title}
                </Link>
              </h2>
              {leadTr.excerpt ? (
                <p className="mt-5 max-w-md text-[15px] leading-[1.7] text-ink-600">
                  {leadTr.excerpt}
                </p>
              ) : null}
              {meta(lead, leadTr.body)}
              <ArrowLink href={`/blog/${leadTr.slug}`} className="mt-8">
                {t("readThePiece")}
              </ArrowLink>
            </div>
          </article>
        ) : null}

        {tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 py-8">
            <Chip href="/blog" active={!tagSlug}>
              {t("all")}
            </Chip>
            {tags.map((tag) => {
              const tagTr = pickTranslation(tag.translations, locale);
              if (!tagTr) return null;
              return (
                <Chip
                  key={tag.id}
                  href={`/blog?tag=${encodeURIComponent(tagTr.slug)}`}
                  active={tagSlug === tagTr.slug}
                >
                  {tagTr.name}
                </Chip>
              );
            })}
          </div>
        ) : null}

        {archive.length === 0 ? (
          <EmptyState
            className="my-8"
            title={tagSlug ? t("emptyFiltered") : t("empty")}
            action={
              tagSlug ? (
                <BtnLink href="/blog" variant="outline">
                  {t("showEverything")}
                </BtnLink>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-x-6 gap-y-12 pb-16 sm:grid-cols-2 lg:grid-cols-3">
            {archive.map((post) => {
              const tr = pickTranslation(post.translations, locale);
              if (!tr) return null;
              const tag = post.tags[0]
                ? pickTranslation(post.tags[0].tag.translations, locale)
                : null;

              return (
                <article key={post.id} className="group">
                  <Link
                    href={`/blog/${tr.slug}`}
                    className="block overflow-hidden bg-accent-100"
                  >
                    {post.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverUrl}
                        alt=""
                        className="h-[220px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="h-[220px] w-full" />
                    )}
                  </Link>
                  {tag ? (
                    <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-ink-500">
                      {tag.name}
                    </div>
                  ) : null}
                  <h3 className="mt-2.5 text-xl leading-snug tracking-[-0.015em]">
                    <Link
                      href={`/blog/${tr.slug}`}
                      className="border-b border-transparent transition-colors hover:border-ink-900"
                    >
                      {tr.title}
                    </Link>
                  </h3>
                  {tr.excerpt ? (
                    <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink-600">
                      {tr.excerpt}
                    </p>
                  ) : null}
                  {meta(post, tr.body)}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <section className="bg-brand-100 px-6 py-14 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-end justify-between gap-8">
          <div>
            <h2 className="max-w-sm text-3xl leading-[1] tracking-[-0.03em] text-balance">
              {tNews("journalTitle")}
            </h2>
            <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink-700">
              {tNews("journalBody")}
            </p>
          </div>
          <NewsletterForm source="journal" className="w-full lg:w-auto lg:min-w-md" />
        </div>
      </section>
    </SiteChrome>
  );
}
