import { getTranslations } from "next-intl/server";

import { formatPrice } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { getFreeShippingThreshold } from "@/lib/shipping";

/**
 * The cocoa strip above the header. It quotes the real free-shipping threshold
 * from the shipping zones — a promise the checkout will actually keep — and
 * renders nothing at all when shipping is never free in the active region,
 * rather than inventing a number.
 */
export async function AnnouncementBar() {
  const [t, region] = await Promise.all([getTranslations("Nav"), getRegion()]);
  const threshold = await getFreeShippingThreshold(region);
  if (threshold === null) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-ink-900 px-6 py-2.5 text-center text-[10px] uppercase tracking-[0.2em] text-ink-200">
      {t("freeShipping", { amount: formatPrice(threshold, region) })}
    </div>
  );
}
