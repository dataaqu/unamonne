import type { RestockMailer } from "@/lib/back-in-stock";
import { sendEmail } from "@/lib/email/client";
import { BackInStockEmail } from "@/lib/email/templates/back-in-stock";

const SUBJECT = {
  en: "It is back",
  ka: "ისევ ხელმისაწვდომია",
} as const;

/** Resend-backed mailer for the restock sweep. */
export const resendRestockMailer: RestockMailer = async (notice) => {
  await sendEmail({
    to: notice.email,
    subject: SUBJECT[notice.locale],
    react: (
      <BackInStockEmail
        locale={notice.locale}
        productName={notice.productName}
        variantLabel={notice.variantLabel}
        productUrl={notice.productUrl}
      />
    ),
  });
};
