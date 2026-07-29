import { getTranslations } from "next-intl/server";

import { AddressForm } from "../address-form";
import { createAddress } from "@/lib/account/address-actions";

export default async function NewAddressPage() {
  const t = await getTranslations("Account");

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("newAddress")}</h1>
      <AddressForm action={createAddress} />
    </main>
  );
}
