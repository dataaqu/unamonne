/**
 * House constants. The storefront is an editorial jewellery house — the name,
 * the studio line and the social handle appear in the header, the footer, the
 * organization JSON-LD and every transactional email, so they live in one place
 * rather than being retyped per surface.
 */
export const BRAND = {
  name: "Unamonne",
  legalName: "Unamonne LLC",
  city: "Tbilisi",
  instagram: "https://instagram.com/unamonne",
} as const;

/** A piece counts as "new in" for this long after it is added to the catalog. */
export const NEW_IN_DAYS = 30;

export function isNewIn(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() < NEW_IN_DAYS * 86_400_000;
}
