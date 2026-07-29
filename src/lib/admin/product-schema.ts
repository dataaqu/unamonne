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
  sku: z.string().trim().optional().default(""),
  /** Blank means an open run — no "Edition of N" badge. */
  editionSize: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v > 0), "INVALID")
    .nullable()
    .default(null),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * One buyable option, entered as a row in the admin form. `label` is the only
 * required part: a row with a blank label is an empty row the admin left behind
 * and is dropped rather than rejected.
 */
export const variantRowSchema = z.object({
  label: z.string().trim().min(1),
  sku: z.string().trim().optional().default(""),
  stock: z.coerce.number().int().min(0).catch(0),
  isMadeToOrder: z.boolean().default(false),
});

export type VariantRow = z.infer<typeof variantRowSchema>;

/**
 * Read the repeated variant rows off the form. Parallel arrays (one input name
 * per column) keep the markup plain HTML — no JSON blob in a hidden field — and
 * the checkbox column carries the row index as its value, because unchecked
 * checkboxes post nothing and would otherwise shift every later row's flag.
 */
export function extractVariants(formData: FormData): VariantRow[] {
  const labels = formData.getAll("variantLabel").map(String);
  const skus = formData.getAll("variantSku").map(String);
  const stocks = formData.getAll("variantStock").map(String);
  const madeToOrder = new Set(
    formData.getAll("variantMadeToOrder").map((v) => Number(v)),
  );

  const rows: VariantRow[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index]?.trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);

    rows.push({
      label,
      sku: skus[index]?.trim() ?? "",
      stock: Math.max(0, Number(stocks[index] ?? 0) || 0),
      isMadeToOrder: madeToOrder.has(index),
    });
  }

  return rows;
}

export type SpecRow = { locale: "ka" | "en"; label: string; value: string };

/** Same shape for the specification table, one set of rows per locale. */
export function extractSpecs(formData: FormData): SpecRow[] {
  const rows: SpecRow[] = [];

  for (const locale of ["ka", "en"] as const) {
    const labels = formData.getAll(`specLabel_${locale}`).map(String);
    const values = formData.getAll(`specValue_${locale}`).map(String);

    for (let index = 0; index < labels.length; index += 1) {
      const label = labels[index]?.trim();
      const value = values[index]?.trim();
      if (!label || !value) continue;
      rows.push({ locale, label, value });
    }
  }

  return rows;
}

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
    sku: formData.get("sku") ?? "",
    editionSize: formData.get("editionSize") ?? "",
  };
}
