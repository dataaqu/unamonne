"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";

import { completePasswordReset, issuePasswordReset } from "./reset";

export type ForgotPasswordState = {
  ok: boolean;
  error?: "EMAIL_INVALID" | "UNKNOWN";
};

export type ResetPasswordState = {
  ok: boolean;
  error?: "TOKEN_INVALID" | "UNKNOWN";
  fieldErrors?: Partial<Record<"password", string[]>>;
};

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("EMAIL_INVALID"));

const passwordSchema = z
  .string()
  .min(8, "PASSWORD_TOO_SHORT")
  .max(200, "PASSWORD_TOO_LONG");

function localeFrom(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

/**
 * Ask for a reset link.
 *
 * The answer is the same whether or not the address has an account: anything
 * else turns this form into a way to find out who shops here. A user without a
 * password (a future OAuth sign-in) gets no mail either — there is no password
 * to reset — and still sees the same confirmation.
 */
export async function requestPasswordResetAction(
  _prev: ForgotPasswordState | undefined,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = emailSchema.safeParse(formData.get("email") ?? "");
  if (!parsed.success) return { ok: false, error: "EMAIL_INVALID" };

  const locale = localeFrom(formData);

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, parsed.data),
    });

    if (user?.passwordHash) {
      const token = await issuePasswordReset(user.id);
      await sendPasswordResetEmail({ to: user.email, locale, token });
    }
  } catch (error) {
    // A failure to send is worth knowing about, but it must not be reported
    // back differently — that would leak the same thing the silence protects.
    console.error("[auth] password reset request failed", error);
  }

  return { ok: true };
}

/** Spend a reset link on a new password. */
export async function resetPasswordAction(
  _prev: ResetPasswordState | undefined,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { ok: false, error: "TOKEN_INVALID" };

  const parsed = passwordSchema.safeParse(formData.get("password") ?? "");
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: { password: parsed.error.issues.map((i) => i.message) },
    };
  }

  try {
    const done = await completePasswordReset(token, parsed.data);
    return done ? { ok: true } : { ok: false, error: "TOKEN_INVALID" };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
