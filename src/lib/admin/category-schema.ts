import { z } from "zod";

/**
 * Category admin form. Names are required per locale; slugs auto-generate from
 * the name when left blank (handled in the action). Error messages are stable
 * codes the form localizes.
 */
export const categoryFormSchema = z.object({
  nameKa: z.string().trim().min(1, "REQUIRED"),
  nameEn: z.string().trim().min(1, "REQUIRED"),
  slugKa: z.string().trim().optional().default(""),
  slugEn: z.string().trim().optional().default(""),
  descriptionKa: z.string().trim().optional().default(""),
  descriptionEn: z.string().trim().optional().default(""),
  sortOrder: z.coerce.number().int().min(0).catch(0),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function extractCategoryForm(formData: FormData) {
  return {
    nameKa: formData.get("nameKa"),
    nameEn: formData.get("nameEn"),
    slugKa: formData.get("slugKa") ?? "",
    slugEn: formData.get("slugEn") ?? "",
    descriptionKa: formData.get("descriptionKa") ?? "",
    descriptionEn: formData.get("descriptionEn") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
  };
}
