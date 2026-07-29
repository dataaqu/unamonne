import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";

/**
 * Transactional email through Resend. Env-gated: without RESEND_API_KEY the
 * send is skipped and logged rather than throwing, so the app runs in
 * development (and before the key is provisioned) without email configured.
 * The React Email component is rendered to HTML here, so callers only build
 * templates.
 */
const FROM = process.env.EMAIL_FROM ?? "Vintage <onboarding@resend.dev>";

let cached: Resend | null = null;

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached ??= new Resend(key);
  return cached;
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<{ sent: boolean }> {
  const html = await render(react);
  const api = client();

  if (!api) {
    console.info(
      `[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`,
    );
    return { sent: false };
  }

  await api.emails.send({ from: FROM, to, subject, html });
  return { sent: true };
}

/** Base URL for links in emails (cart deep-links, etc.). */
export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://vintage.example.com"
  ).replace(/\/$/, "");
}
