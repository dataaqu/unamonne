import { getTranslations } from "next-intl/server";

import { AuthSplit } from "@/components/auth/auth-split";

import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ token }, t] = await Promise.all([
    searchParams,
    getTranslations("Auth"),
  ]);

  return (
    <AuthSplit side="left" caption={t("loginCaption")} kicker={t("loginKicker")}>
      <ResetForm token={token ?? ""} />
    </AuthSplit>
  );
}
