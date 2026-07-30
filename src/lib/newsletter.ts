import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import type { Locale } from "@/i18n/routing";

/**
 * Put an address on the seasonal letter.
 *
 * Re-subscribing is idempotent AND deliberately re-opens a closed subscription:
 * someone asking to be on the list again is asking to be back on it, so
 * `unsubscribedAt` is cleared. When they first joined is left alone.
 *
 * Plain function rather than a server action, because two callers need it: the
 * footer form (its own action) and the register form (as one step of signing up).
 */
export function upsertSubscriber({
  email,
  locale,
  source,
}: {
  email: string;
  locale: Locale;
  source?: string | null;
}) {
  return db
    .insert(newsletterSubscribers)
    .values({ email, locale, source: source ?? null })
    .onConflictDoUpdate({
      target: newsletterSubscribers.email,
      set: { locale, unsubscribedAt: null },
    });
}
