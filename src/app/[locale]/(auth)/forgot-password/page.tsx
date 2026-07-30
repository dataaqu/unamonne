import { getTranslations } from "next-intl/server";

import { AuthSplit } from "@/components/auth/auth-split";

import { ForgotForm } from "./forgot-form";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("Auth");

  return (
    <AuthSplit side="left" caption={t("loginCaption")} kicker={t("loginKicker")}>
      <ForgotForm />
    </AuthSplit>
  );
}
