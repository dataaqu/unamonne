import { z } from "zod";

/**
 * Offer-code admin form.
 *
 * A code is either a percentage OR fixed amounts per currency, never both — a
 * code that is 10% *and* ₾20 off has no defined meaning, so the form rejects it
 * rather than silently picking one. Amounts are minor units like every other
 * money column.
 */
const optionalInt = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || (Number.isInteger(value) && value >= 0), {
    message: "INVALID",
  })
  .nullable()
  .default(null);

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : new Date(value)))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    message: "INVALID",
  })
  .nullable()
  .default(null);

export const discountFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "REQUIRED")
      .regex(/^[A-Z0-9-]+$/, "INVALID"),
    percentOff: optionalInt,
    amountOffGel: optionalInt,
    amountOffUsd: optionalInt,
    minSubtotalGel: optionalInt,
    minSubtotalUsd: optionalInt,
    maxRedemptions: optionalInt,
    startsAt: optionalDate,
    expiresAt: optionalDate,
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.percentOff === null ||
      (data.amountOffGel === null && data.amountOffUsd === null),
    { path: ["percentOff"], message: "PERCENT_OR_AMOUNT" },
  )
  .refine(
    (data) =>
      data.percentOff !== null ||
      data.amountOffGel !== null ||
      data.amountOffUsd !== null,
    { path: ["percentOff"], message: "REQUIRED" },
  )
  .refine((data) => data.percentOff === null || data.percentOff <= 100, {
    path: ["percentOff"],
    message: "INVALID",
  })
  .refine(
    (data) =>
      data.startsAt === null ||
      data.expiresAt === null ||
      data.startsAt < data.expiresAt,
    { path: ["expiresAt"], message: "INVALID" },
  );

export type DiscountFormValues = z.infer<typeof discountFormSchema>;

/** `datetime-local` posts "YYYY-MM-DDTHH:mm"; the input wants the same shape. */
export function toDateTimeLocal(value: Date | null): string {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export function extractDiscountForm(formData: FormData) {
  return {
    code: formData.get("code") ?? "",
    percentOff: formData.get("percentOff") ?? "",
    amountOffGel: formData.get("amountOffGel") ?? "",
    amountOffUsd: formData.get("amountOffUsd") ?? "",
    minSubtotalGel: formData.get("minSubtotalGel") ?? "",
    minSubtotalUsd: formData.get("minSubtotalUsd") ?? "",
    maxRedemptions: formData.get("maxRedemptions") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    expiresAt: formData.get("expiresAt") ?? "",
    isActive: formData.get("isActive") != null,
  };
}
