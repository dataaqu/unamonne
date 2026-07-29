/**
 * Bag limits shared by the server actions and the forms that post to them.
 *
 * They live in their own module because `cart-actions.ts` is a `"use server"`
 * file, and such a file may only export async functions — a plain constant
 * there silently strips every export from the module.
 */

/** Hard cap on a single line's quantity. */
export const MAX_QUANTITY = 99;

/** Free engraving, kept short — it is cut by hand into a 9 mm face. */
export const MAX_ENGRAVING = 12;
