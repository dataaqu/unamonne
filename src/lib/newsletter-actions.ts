"use server";

import { z } from "zod";

import { routing } from "@/i18n/routing";
import { upsertSubscriber } from "@/lib/newsletter";

export type NewsletterState = {
  ok: boolean;
  error?: "EMAIL_INVALID" | "UNKNOWN";
};

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("EMAIL_INVALID")),
  locale: z.enum(routing.locales).catch(routing.defaultLocale),
  source: z.string().trim().max(40).optional(),
});

/**
 * Join the seasonal letter.
 *
 * The response never distinguishes "new" from "already subscribed" — that would
 * turn the form into an oracle for whether an address is on the list.
 */
export async function subscribeToNewsletterAction(
  _prev: NewsletterState | undefined,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = schema.safeParse({
    email: formData.get("email") ?? "",
    locale: formData.get("locale") ?? routing.defaultLocale,
    source: formData.get("source") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "EMAIL_INVALID" };

  try {
    await upsertSubscriber({
      email: parsed.data.email,
      locale: parsed.data.locale,
      source: parsed.data.source,
    });
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }

  return { ok: true };
}
