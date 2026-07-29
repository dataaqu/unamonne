import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AddressForm } from "../../address-form";
import { updateAddress } from "@/lib/account/address-actions";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session, t] = await Promise.all([
    params,
    auth(),
    getTranslations("Account"),
  ]);
  const userId = session!.user.id;

  const address = await db.query.addresses.findFirst({
    where: and(eq(addresses.id, id), eq(addresses.userId, userId)),
  });
  if (!address) notFound();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("editAddress")}</h1>
      <AddressForm
        action={updateAddress}
        initial={{
          id: address.id,
          fullName: address.fullName,
          phone: address.phone ?? "",
          country: address.country,
          city: address.city,
          line1: address.line1,
          line2: address.line2 ?? "",
          postalCode: address.postalCode ?? "",
          isDefault: address.isDefault,
        }}
      />
    </main>
  );
}
