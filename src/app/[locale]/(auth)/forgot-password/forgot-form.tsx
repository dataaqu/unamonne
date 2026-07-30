"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Btn } from "@/components/ui/btn";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Link } from "@/i18n/navigation";
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from "@/lib/auth/reset-actions";

const initialState: ForgotPasswordState = { ok: false };

export function ForgotForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );
  // Controlled for the same reason as the sign-in form: an action resolving
  // would otherwise empty the field under the confirmation.
  const [email, setEmail] = useState("");

  return (
    <>
      <h1 className="text-4xl leading-[1] tracking-[-0.03em]">
        {t("forgotTitle")}
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-600">
        {t("forgotSubtitle")}
      </p>

      {state.ok ? (
        <Notice role="status" className="mt-7">
          {t("forgotSent")}
        </Notice>
      ) : state.error ? (
        <Notice tone="danger" role="alert" className="mt-7">
          {t(`errors.${state.error}`)}
        </Notice>
      ) : null}

      <form action={formAction} className="mt-8 space-y-7" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <Field
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Btn type="submit" size="lg" full loading={pending}>
          {pending ? t("submitting") : t("forgotSubmit")}
        </Btn>
      </form>

      <p className="mt-8 text-[13px] text-ink-600">
        {t("rememberedIt")}{" "}
        <Link
          href="/login"
          className="border-b border-ink-900 pb-0.5 text-ink-900"
        >
          {t("login")}
        </Link>
      </p>
    </>
  );
}
