import type { RecoveryMailer } from "@/lib/abandoned-cart";

import { appUrl, sendEmail } from "./client";
import { AbandonedCartOfferEmail } from "./templates/abandoned-cart-offer";

const SUBJECT = {
  en: "You left something in your cart",
  ka: "თქვენს კალათაში დარჩა ნივთი",
} as const;

/**
 * Resend-backed recovery mailer (T4.4). Drop-in for the cron/admin default
 * `logRecoveryMailer`: both the cron (T4.3) and the admin manual send (T4.5)
 * import this, so they upgrade together. A cart with no email is skipped — a
 * guest who never reached checkout left no address. Carts do not carry a
 * locale, so the offer defaults to English.
 */
export const resendRecoveryMailer: RecoveryMailer = async ({
  email,
  offerCode,
}) => {
  if (!email) return;

  const locale = "en" as const;
  const cartUrl = `${appUrl()}/${locale}/cart`;

  await sendEmail({
    to: email,
    subject: SUBJECT[locale],
    react: (
      <AbandonedCartOfferEmail
        locale={locale}
        offerCode={offerCode}
        cartUrl={cartUrl}
      />
    ),
  });
};
