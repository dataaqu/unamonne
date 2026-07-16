import { z } from "zod";

/**
 * Shipping zone admin form. Rates are entered/stored in MINOR units
 * (tetri/cents), like every other amount in the shop.
 *
 * A blank rate field means "no rate in this currency", which is different from
 * a rate of 0 (free shipping): the former makes the zone unshippable for that
 * region, the latter is a deliberate zero. Both are preserved.
 */
const optionalAmount = z
  .union([z.literal(""), z.coerce.number().int().min(0)])
  .optional()
  .default("");

export const zoneFormSchema = z.object({
  name: z.string().trim().min(1, "REQUIRED"),
  countries: z.string().trim().optional().default(""),
  sortOrder: z.coerce.number().int().min(0).catch(0),
  rateGel: optionalAmount,
  freeThresholdGel: optionalAmount,
  rateUsd: optionalAmount,
  freeThresholdUsd: optionalAmount,
});

export type ZoneFormValues = z.infer<typeof zoneFormSchema>;

export function extractZoneForm(formData: FormData) {
  return {
    name: formData.get("name"),
    countries: formData.get("countries") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
    rateGel: formData.get("rateGel") ?? "",
    freeThresholdGel: formData.get("freeThresholdGel") ?? "",
    rateUsd: formData.get("rateUsd") ?? "",
    freeThresholdUsd: formData.get("freeThresholdUsd") ?? "",
  };
}

/**
 * Countries are typed as a free-form list ("GE, AM, TR" or one per line) and
 * normalized to unique uppercase ISO-3166 alpha-2 codes.
 */
export function parseCountries(input: string): string[] {
  const codes = input
    .split(/[\s,;]+/)
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));

  return [...new Set(codes)];
}

export function formatCountries(countries: readonly string[]): string {
  return countries.join(", ");
}
