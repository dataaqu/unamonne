const INTL_LOCALE: Record<string, string> = { ka: "ka-GE", en: "en-US" };

/** An ISO-3166 alpha-2 code as a localized country name ("GE" → "საქართველო"). */
export function countryName(code: string, locale: string): string {
  try {
    const names = new Intl.DisplayNames([INTL_LOCALE[locale] ?? "en-US"], {
      type: "region",
    });
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export type AddressLike = {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string | null;
  country: string;
  phone: string | null;
};

/**
 * A saved address as the lines it is written on, so every surface that prints
 * one — the profile card, an order's "shipped to", the address book — breaks it
 * the same way. Blank parts collapse instead of leaving a stray comma.
 */
export function addressLines(
  address: AddressLike,
  locale: string,
  { includeName = true }: { includeName?: boolean } = {},
): string[] {
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  const place = [
    [address.city, address.postalCode].filter(Boolean).join(" "),
    countryName(address.country, locale),
  ]
    .filter(Boolean)
    .join(", ");

  return [
    includeName ? address.fullName : "",
    street,
    place,
    address.phone ?? "",
  ].filter((line) => line.length > 0);
}
