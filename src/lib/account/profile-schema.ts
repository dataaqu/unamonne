import { z } from "zod";

/**
 * The profile form behind "Edit profile". Only the name and phone are editable
 * here — the email is the account's identity and is changed by hand, after the
 * studio has verified the new address, so it is deliberately not a field.
 */
export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "REQUIRED"),
  phone: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function extractProfileForm(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
  };
}

/** First name only — what the account greets a shopper by. */
export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}
