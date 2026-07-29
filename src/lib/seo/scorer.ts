import { slugify } from "@/lib/catalog";

/**
 * In-admin SEO scorer (T5.3), RankMath/Yoast-style. Pure: it takes the post's
 * fields and returns a 0-100 score plus a per-check breakdown. The checks are
 * locale-agnostic (they return an id + ok); the editor maps each id to a
 * localized tip, so the same scorer serves KA and EN.
 */
export type SeoInput = {
  title: string;
  slug: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  focusKeyword: string;
};

export type SeoCheck = { id: string; ok: boolean; weight: number };
export type SeoScore = { score: number; checks: SeoCheck[] };

export const SEO_MAX_SCORE = 100;

const META_TITLE_MIN = 30;
const META_TITLE_MAX = 60;
const META_DESC_MIN = 120;
const META_DESC_MAX = 160;
const BODY_MIN_WORDS = 300;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasHeading(body: string): boolean {
  // Markdown h2/h3 or an HTML heading tag.
  return /(^|\n)#{2,3}\s/.test(body) || /<h[23][\s>]/i.test(body);
}

function hasLink(body: string): boolean {
  // Markdown link or an anchor tag.
  return /\[[^\]]+\]\([^)]+\)/.test(body) || /<a\s[^>]*href=/i.test(body);
}

export function scoreSeo(input: SeoInput): SeoScore {
  const keyword = input.focusKeyword.trim().toLowerCase();
  const hasKeyword = keyword.length > 0;

  const metaTitle = (input.seoTitle?.trim() || input.title).trim();
  const metaDescription = input.seoDescription?.trim() ?? "";
  const body = input.body ?? "";

  const includesKeyword = (text: string) =>
    hasKeyword && text.toLowerCase().includes(keyword);

  const checks: SeoCheck[] = [
    { id: "keywordInTitle", weight: 15, ok: includesKeyword(metaTitle) },
    {
      id: "keywordInMetaDescription",
      weight: 10,
      ok: includesKeyword(metaDescription),
    },
    {
      id: "keywordInSlug",
      weight: 10,
      ok: hasKeyword && input.slug.toLowerCase().includes(slugify(keyword)),
    },
    { id: "keywordInBody", weight: 10, ok: includesKeyword(body) },
    {
      id: "titleLength",
      weight: 10,
      ok:
        metaTitle.length >= META_TITLE_MIN &&
        metaTitle.length <= META_TITLE_MAX,
    },
    {
      id: "metaDescriptionLength",
      weight: 10,
      ok:
        metaDescription.length >= META_DESC_MIN &&
        metaDescription.length <= META_DESC_MAX,
    },
    { id: "bodyLength", weight: 15, ok: wordCount(body) >= BODY_MIN_WORDS },
    { id: "hasHeadings", weight: 10, ok: hasHeading(body) },
    { id: "hasInternalLinks", weight: 5, ok: hasLink(body) },
    { id: "hasOgImage", weight: 5, ok: Boolean(input.ogImage) },
  ];

  const score = checks.reduce((sum, c) => (c.ok ? sum + c.weight : sum), 0);
  return { score, checks };
}

/** The check ids, in display order — the editor renders a tip per id. */
export const SEO_CHECK_IDS = [
  "keywordInTitle",
  "keywordInMetaDescription",
  "keywordInSlug",
  "keywordInBody",
  "titleLength",
  "metaDescriptionLength",
  "bodyLength",
  "hasHeadings",
  "hasInternalLinks",
  "hasOgImage",
] as const;
