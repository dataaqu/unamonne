import type { Region } from "@/lib/region";

export type PaymentProvider = "ipay" | "stripe";

/**
 * Region routes the payment rail: Georgia settles in GEL through Bank of
 * Georgia iPay, everywhere else in USD through Stripe. Same mapping as
 * currency, kept separate because it names a provider, not a currency.
 */
export function paymentProviderForRegion(region: Region): PaymentProvider {
  return region === "GE" ? "ipay" : "stripe";
}
