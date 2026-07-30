import type { Locale } from "@/i18n/routing";
import { appUrl, sendEmail } from "@/lib/email/client";
import { PasswordResetEmail } from "@/lib/email/templates/password-reset";

const SUBJECT = {
  en: "Reset your password",
  ka: "პაროლის აღდგენა",
} as const;

const VALID_FOR = { en: "1 hour", ka: "1 საათი" } as const;

/** The reset link a token turns into, in the locale the request came from. */
export function passwordResetUrl(locale: Locale, token: string): string {
  return `${appUrl()}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail({
  to,
  locale,
  token,
}: {
  to: string;
  locale: Locale;
  token: string;
}): Promise<void> {
  const url = passwordResetUrl(locale, token);

  const { sent } = await sendEmail({
    to,
    subject: SUBJECT[locale],
    react: (
      <PasswordResetEmail
        locale={locale}
        resetUrl={url}
        validFor={VALID_FOR[locale]}
      />
    ),
  });

  // Without a mail provider the link would exist nowhere at all, which makes
  // the flow impossible to work on. Printed only when the send was skipped,
  // and never in production.
  if (!sent && process.env.NODE_ENV !== "production") {
    console.info(`[auth] reset link for ${to}: ${url}`);
  }
}
