"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { PasswordField } from "@/components/auth/password-field";
import { Btn } from "@/components/ui/btn";
import { CheckField, Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Link } from "@/i18n/navigation";
import type { RegisterState } from "@/lib/auth/actions";

import { registerAction } from "../actions";

const initialState: RegisterState = { ok: false };

export function RegisterForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  // React clears an uncontrolled form once its action resolves — a rejected
  // sign-up must not empty the fields that were fine.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const fieldError = (codes: string[] | undefined) =>
    codes?.length ? t(`errors.${codes[0]}`) : undefined;

  return (
    <>
      <h1 className="text-4xl leading-[1] tracking-[-0.03em]">
        {t("registerTitle")}
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-600">
        {t("registerSubtitle")}
      </p>

      {/* A successful sign-up signs in and redirects, so `ok` only lands here
          when the account was made but the sign-in did not take. */}
      {state.ok ? (
        <Notice role="status" className="mt-7">
          {t("registered")}
        </Notice>
      ) : state.error ? (
        <Notice tone="danger" role="alert" className="mt-7">
          {t(`errors.${state.error}`)}
        </Notice>
      ) : null}

      <form action={formAction} className="mt-8 space-y-7" noValidate>
        <input type="hidden" name="locale" value={locale} />

        <Field
          label={t("name")}
          name="name"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldError(state.fieldErrors?.name)}
        />

        <Field
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldError(state.fieldErrors?.email)}
        />

        <PasswordField
          label={t("password")}
          name="password"
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
          meter
          error={fieldError(state.fieldErrors?.password)}
        />

        <CheckField
          name="newsletter"
          defaultChecked
          label={t("newsletterOptIn")}
          className="items-start"
        />

        <Btn type="submit" size="lg" full loading={pending}>
          {pending ? t("submitting") : t("register")}
        </Btn>

        <p className="text-xs leading-relaxed text-ink-500">{t("terms")}</p>
      </form>

      <p className="mt-8 text-[13px] text-ink-600">
        {t("haveAccount")}{" "}
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
