"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { PasswordField } from "@/components/auth/password-field";
import { ArrowLink, Btn } from "@/components/ui/btn";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Link } from "@/i18n/navigation";

import { loginAction, type LoginState } from "../actions";

const initialState: LoginState = { ok: false };

export function LoginForm() {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  // React clears an uncontrolled form once its action resolves. A rejected
  // sign-in must not cost the shopper their email as well as their attempt.
  const [email, setEmail] = useState("");

  const fieldError = (codes: string[] | undefined) =>
    codes?.length ? t(`errors.${codes[0]}`) : undefined;

  return (
    <>
      <h1 className="text-4xl leading-[1] tracking-[-0.03em]">
        {t("loginTitle")}
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-600">
        {t("loginSubtitle")}
      </p>

      {state.error ? (
        <Notice tone="danger" role="alert" className="mt-7">
          {t(`errors.${state.error}`)}
        </Notice>
      ) : null}

      {/* `noValidate` hands validation to the schema, so both locales get the
          house's wording instead of the browser's. */}
      <form action={formAction} className="mt-8 space-y-7" noValidate>
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
          autoComplete="current-password"
          placeholder="••••••••"
          error={fieldError(state.fieldErrors?.password)}
          action={
            <Link
              href="/forgot-password"
              className="text-[11px] text-ink-500 underline underline-offset-4 transition-colors hover:text-ink-900"
            >
              {t("forgot")}
            </Link>
          }
        />

        <Btn type="submit" size="lg" full loading={pending}>
          {pending ? t("submitting") : t("login")}
        </Btn>
      </form>

      <p className="mt-8 text-[13px] text-ink-600">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="border-b border-ink-900 pb-0.5 text-ink-900"
        >
          {t("register")}
        </Link>
      </p>

      <div className="mt-10 border-t border-ink-200 pt-6">
        <ArrowLink
          href="/order-status"
          className="gap-4 tracking-[0.16em] text-ink-500 hover:text-ink-900"
        >
          {t("guestOrder")}
        </ArrowLink>
      </div>
    </>
  );
}
