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

/**
 * The lockup's proportions, measured off the studio's artwork.
 *
 * Everything is expressed in mark widths, so the crescent and the name keep the
 * same relationship at every size and on every surface — the header, the
 * footer, and the overture are one drawing rather than three.
 */
export const LOCKUP = {
  /** The name's width, in mark widths. */
  wordWidth: 2.59,
  /** Where the name begins, in mark widths — inside the crescent's opening. */
  wordLeft: 0.67,
  /** The mark's own width ÷ height. */
  markAspect: 560 / 598,
} as const;

/** A piece counts as "new in" for this long after it is added to the catalog. */
export const NEW_IN_DAYS = 30;

export function isNewIn(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() < NEW_IN_DAYS * 86_400_000;
}
