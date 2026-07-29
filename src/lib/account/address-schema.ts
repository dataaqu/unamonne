import { z } from "zod";

/**
 * Saved-address form. Country is stored as an ISO-3166 alpha-2 code (uppercased)
 * so it matches how shipping zones are keyed; the optional fields normalize a
 * blank input to null rather than an empty string.
 */
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .default(null);

export const addressFormSchema = z.object({
  fullName: z.string().trim().min(1, "REQUIRED"),
  phone: optionalText,
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "COUNTRY_INVALID"),
  city: z.string().trim().min(1, "REQUIRED"),
  line1: z.string().trim().min(1, "REQUIRED"),
  line2: optionalText,
  postalCode: optionalText,
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

export function extractAddressForm(formData: FormData) {
  return {
    fullName: formData.get("fullName") ?? "",
    phone: formData.get("phone") ?? "",
    country: formData.get("country") ?? "",
    city: formData.get("city") ?? "",
    line1: formData.get("line1") ?? "",
    line2: formData.get("line2") ?? "",
    postalCode: formData.get("postalCode") ?? "",
  };
}

/**
 * The first address a user saves becomes their default automatically — there is
 * no one to compete with — and any later one only if they ask for it.
 */
export function shouldDefaultOnCreate(
  existingCount: number,
  requested: boolean,
): boolean {
  return existingCount === 0 || requested;
}

/**
 * Recompute the default flag across a user's addresses so exactly `targetId`
 * is the default. Pure — the action applies the diff inside a transaction.
 */
export function markDefault<T extends { id: string; isDefault: boolean }>(
  addresses: readonly T[],
  targetId: string,
): T[] {
  return addresses.map((a) => ({ ...a, isDefault: a.id === targetId }));
}
