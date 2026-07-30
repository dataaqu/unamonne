"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { PasswordField } from "@/components/auth/password-field";
import { Btn, BtnLink } from "@/components/ui/btn";
import { Notice } from "@/components/ui/notice";
import { Link } from "@/i18n/navigation";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/lib/auth/reset-actions";

const initialState: ResetPasswordState = { ok: false };

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  // A spent, expired or invented link all land here. One message for all
  // three — telling them apart only helps someone guessing.
  if (!token) {
    return (
      <>
        <h1 className="text-4xl leading-[1] tracking-[-0.03em]">
          {t("resetTitle")}
        </h1>
        <Notice tone="danger" role="alert" className="mt-7">
          {t("errors.TOKEN_INVALID")}
        </Notice>
        <BtnLink href="/forgot-password" variant="outline" className="mt-8">
          {t("forgotSubmit")}
        </BtnLink>
      </>
    );
  }

  if (state.ok) {
    return (
      <>
        <h1 className="text-4xl leading-[1] tracking-[-0.03em]">
          {t("resetDoneTitle")}
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-ink-600">
          {t("resetDoneBody")}
        </p>
        <BtnLink href="/login" size="lg" full className="mt-8">
          {t("login")}
        </BtnLink>
      </>
    );
  }

  return (
    <>
      <h1 className="text-4xl leading-[1] tracking-[-0.03em]">
        {t("resetTitle")}
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-600">
        {t("resetSubtitle")}
      </p>

      {state.error ? (
        <Notice tone="danger" role="alert" className="mt-7">
          {t(`errors.${state.error}`)}
        </Notice>
      ) : null}

      <form action={formAction} className="mt-8 space-y-7" noValidate>
        <input type="hidden" name="token" value={token} />
        <PasswordField
          label={t("newPassword")}
          name="password"
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
          meter
          error={
            state.fieldErrors?.password?.length
              ? t(`errors.${state.fieldErrors.password[0]}`)
              : undefined
          }
        />
        <Btn type="submit" size="lg" full loading={pending}>
          {pending ? t("submitting") : t("resetSubmit")}
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
