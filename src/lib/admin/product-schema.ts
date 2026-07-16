import { z } from "zod";

/**
 * Product admin form. Prices are entered/stored in MINOR units (tetri/cents).
 * Names required per locale; slugs auto-generate when blank.
 */
export const productFormSchema = z.object({
  nameKa: z.string().trim().min(1, "REQUIRED"),
  nameEn: z.string().trim().min(1, "REQUIRED"),
  slugKa: z.string().trim().optional().default(""),
  slugEn: z.string().trim().optional().default(""),
  descriptionKa: z.string().trim().optional().default(""),
  descriptionEn: z.string().trim().optional().default(""),
  priceGel: z.coerce.number().int().min(0).catch(0),
  priceUsd: z.coerce.number().int().min(0).catch(0),
  stock: z.coerce.number().int().min(0).catch(0),
  sortOrder: z.coerce.number().int().min(0).catch(0),
  categoryId: z.string().trim().optional().default(""),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function extractProductForm(formData: FormData) {
  return {
    nameKa: formData.get("nameKa"),
    nameEn: formData.get("nameEn"),
    slugKa: formData.get("slugKa") ?? "",
    slugEn: formData.get("slugEn") ?? "",
    descriptionKa: formData.get("descriptionKa") ?? "",
    descriptionEn: formData.get("descriptionEn") ?? "",
    priceGel: formData.get("priceGel") ?? 0,
    priceUsd: formData.get("priceUsd") ?? 0,
    stock: formData.get("stock") ?? 0,
    sortOrder: formData.get("sortOrder") ?? 0,
    categoryId: formData.get("categoryId") ?? "",
  };
}
