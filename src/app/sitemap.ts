import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";

import { routing } from "@/i18n/routing";
import { findPublishedPosts } from "@/lib/blog";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email/client";
import { products } from "@/lib/db/schema";

// Needs the database for posts/products; don't try to prerender at build.
export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

function languagesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${appUrl()}/${locale}${path}`;
  }
  return languages;
}

function staticEntry(path: string): Entry {
  return {
    url: `${appUrl()}/${routing.defaultLocale}${path}`,
    alternates: { languages: languagesFor(path) },
  };
}

/**
 * Build one entry from a set of per-locale slugs (blog/products localize their
 * slugs, so the alternates can't share a single path). The default locale's URL
 * is the canonical `url`; every locale is listed under alternates.
 */
function localizedEntry(
  prefix: string,
  translations: { locale: string; slug: string }[],
  lastModified?: Date | null,
): Entry | null {
  if (translations.length === 0) return null;
  const languages: Record<string, string> = {};
  for (const tr of translations) {
    languages[tr.locale] = `${appUrl()}/${tr.locale}${prefix}/${tr.slug}`;
  }
  const primary =
    translations.find((t) => t.locale === routing.defaultLocale) ??
    translations[0];
  return {
    url: `${appUrl()}/${primary.locale}${prefix}/${primary.slug}`,
    lastModified: lastModified ?? undefined,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: Entry[] = ["", "/shop", "/blog"].map(staticEntry);

  // The database may not be provisioned yet — the static routes above are still
  // a valid sitemap, so a failure here degrades rather than breaks the route.
  try {
    const posts = await findPublishedPosts(new Date());
    for (const post of posts) {
      const entry = localizedEntry("/blog", post.translations, post.publishedAt);
      if (entry) entries.push(entry);
    }

    const catalogue = await db.query.products.findMany({
      where: eq(products.isHidden, false),
      with: { translations: true },
    });
    for (const product of catalogue) {
      const entry = localizedEntry("/product", product.translations);
      if (entry) entries.push(entry);
    }
  } catch (error) {
    console.error("[sitemap] falling back to static routes", error);
  }

  return entries;
}
