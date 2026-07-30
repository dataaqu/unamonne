import { getTranslations } from "next-intl/server";

import { AuthSplit } from "@/components/auth/auth-split";

import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const t = await getTranslations("Auth");

  return (
    <AuthSplit
      side="right"
      caption={t("registerCaption")}
      kicker={t("registerKicker")}
    >
      <RegisterForm />
    </AuthSplit>
  );
}
