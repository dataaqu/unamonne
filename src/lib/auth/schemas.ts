import { z } from "zod";

/**
 * Shared auth form schemas. Kept in a plain module (not the "use server" file)
 * so both the server actions and the client forms (T1.8) can import them.
 *
 * Validation messages are stable string codes, not prose — the UI maps them to
 * localized (KA/EN) messages.
 */

export const registerSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().min(1, "EMAIL_REQUIRED").pipe(z.email("EMAIL_INVALID")),
  password: z.string().min(8, "PASSWORD_TOO_SHORT").max(200, "PASSWORD_TOO_LONG"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "EMAIL_REQUIRED").pipe(z.email("EMAIL_INVALID")),
  password: z.string().min(1, "PASSWORD_REQUIRED"),
});

export type LoginInput = z.infer<typeof loginSchema>;
