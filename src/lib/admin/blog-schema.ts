import { z } from "zod";

/**
 * Blog post admin form. Title + body required per locale; slugs auto-generate
 * from the title when blank. The SEO fields feed the in-admin scorer (T5.3),
 * whose score is recomputed and stored on every save.
 */
export const blogPostFormSchema = z.object({
  titleKa: z.string().trim().min(1, "REQUIRED"),
  titleEn: z.string().trim().min(1, "REQUIRED"),
  slugKa: z.string().trim().optional().default(""),
  slugEn: z.string().trim().optional().default(""),
  excerptKa: z.string().trim().optional().default(""),
  excerptEn: z.string().trim().optional().default(""),
  bodyKa: z.string().trim().min(1, "REQUIRED"),
  bodyEn: z.string().trim().min(1, "REQUIRED"),
  seoTitleKa: z.string().trim().optional().default(""),
  seoTitleEn: z.string().trim().optional().default(""),
  seoDescriptionKa: z.string().trim().optional().default(""),
  seoDescriptionEn: z.string().trim().optional().default(""),
  focusKeywordKa: z.string().trim().optional().default(""),
  focusKeywordEn: z.string().trim().optional().default(""),
});

export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;

export function extractBlogPostForm(formData: FormData) {
  const g = (name: string) => formData.get(name) ?? "";
  return {
    titleKa: g("titleKa"),
    titleEn: g("titleEn"),
    slugKa: g("slugKa"),
    slugEn: g("slugEn"),
    excerptKa: g("excerptKa"),
    excerptEn: g("excerptEn"),
    bodyKa: g("bodyKa"),
    bodyEn: g("bodyEn"),
    seoTitleKa: g("seoTitleKa"),
    seoTitleEn: g("seoTitleEn"),
    seoDescriptionKa: g("seoDescriptionKa"),
    seoDescriptionEn: g("seoDescriptionEn"),
    focusKeywordKa: g("focusKeywordKa"),
    focusKeywordEn: g("focusKeywordEn"),
  };
}

export function isPublishStatus(value: unknown): value is "draft" | "published" {
  return value === "draft" || value === "published";
}
