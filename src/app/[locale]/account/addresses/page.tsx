import { desc, eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";

import {
  AddressesManager,
  type AddressCard,
} from "@/components/account/addresses-manager";
import { addressLines } from "@/lib/account/address-format";
import { auth } from "@/lib/auth";
import { countryOptions } from "@/lib/countries";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";

/**
 * The address book. The default sits first — it is the one checkout fills in,
 * so it is the one being looked for.
 */
export default async function AccountAddressesPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);

  const userId = session?.user?.id;
  if (!userId) return null;

  const list = await db.query.addresses.findMany({
    where: eq(addresses.userId, userId),
    orderBy: [desc(addresses.isDefault), desc(addresses.createdAt)],
  });

  const cards: AddressCard[] = list.map((address) => ({
    id: address.id,
    fullName: address.fullName,
    phone: address.phone ?? "",
    country: address.country,
    city: address.city,
    line1: address.line1,
    line2: address.line2 ?? "",
    postalCode: address.postalCode ?? "",
    isDefault: address.isDefault,
    lines: addressLines(address, locale, { includeName: false }),
  }));

  return (
    <AddressesManager cards={cards} countries={countryOptions(locale)} />
  );
}
