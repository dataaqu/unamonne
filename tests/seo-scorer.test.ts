import { describe, it, expect } from "vitest";

import { SEO_MAX_SCORE, scoreSeo, type SeoInput } from "@/lib/seo/scorer";

const strong: SeoInput = {
  title: "The vintage chair buying guide",
  slug: "vintage-chair-buying-guide",
  body:
    "## Choosing a vintage chair\n\n" +
    "A vintage chair brings character to any room. When you buy a vintage chair, " +
    "check the joints, the finish, and the provenance. ".repeat(40) +
    "\n\nSee our [catalog](/en/shop) for more.",
  seoTitle: "The vintage chair buying guide for collectors",
  seoDescription:
    "Everything you need to buy a vintage chair with confidence: how to judge condition, spot repairs, and value provenance in a single practical guide.",
  ogImage: "https://media.test/cover.jpg",
  focusKeyword: "vintage chair",
};

function ids(checks: { id: string; ok: boolean }[]) {
  return new Set(checks.filter((c) => c.ok).map((c) => c.id));
}

describe("scoreSeo", () => {
  it("scores a well-optimized post at or near the maximum", () => {
    const result = scoreSeo(strong);
    expect(result.score).toBe(SEO_MAX_SCORE);
    const ok = ids(result.checks);
    expect(ok.has("keywordInTitle")).toBe(true);
    expect(ok.has("keywordInSlug")).toBe(true);
    expect(ok.has("keywordInBody")).toBe(true);
    expect(ok.has("hasHeadings")).toBe(true);
    expect(ok.has("hasInternalLinks")).toBe(true);
  });

  it("fails every keyword check when no focus keyword is set", () => {
    const result = scoreSeo({ ...strong, focusKeyword: "" });
    const ok = ids(result.checks);
    expect(ok.has("keywordInTitle")).toBe(false);
    expect(ok.has("keywordInSlug")).toBe(false);
    expect(ok.has("keywordInBody")).toBe(false);
    expect(ok.has("keywordInMetaDescription")).toBe(false);
    expect(result.score).toBeLessThan(SEO_MAX_SCORE);
  });

  it("flags a too-short meta description and thin body", () => {
    const result = scoreSeo({
      ...strong,
      seoDescription: "Too short.",
      body: "Just a few words about a chair.",
    });
    const ok = ids(result.checks);
    expect(ok.has("metaDescriptionLength")).toBe(false);
    expect(ok.has("bodyLength")).toBe(false);
  });

  it("keeps the score within 0..100", () => {
    const empty = scoreSeo({
      title: "",
      slug: "",
      body: "",
      seoTitle: null,
      seoDescription: null,
      ogImage: null,
      focusKeyword: "",
    });
    expect(empty.score).toBeGreaterThanOrEqual(0);
    expect(empty.score).toBeLessThanOrEqual(SEO_MAX_SCORE);
  });
});
