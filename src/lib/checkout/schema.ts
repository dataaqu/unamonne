import { z } from "zod";

import {
  addressFormSchema,
  extractAddressForm,
} from "@/lib/account/address-schema";

/**
 * Checkout collects the same shipping address as the account (reused schema)
 * plus a contact email — a guest has no account email on file, and it is where
 * the confirmation is sent.
 */
export const checkoutSchema = addressFormSchema.extend({
  email: z.string().trim().toLowerCase().pipe(z.email("EMAIL_INVALID")),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export function extractCheckout(formData: FormData) {
  return {
    ...extractAddressForm(formData),
    email: formData.get("email") ?? "",
  };
}
