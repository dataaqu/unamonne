"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { loginAction, type LoginState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = { ok: false };

export function LoginForm() {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        {state.fieldErrors?.email?.map((code) => (
          <p key={code} className="text-sm text-destructive">
            {t(`errors.${code}`)}
          </p>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.password?.map((code) => (
          <p key={code} className="text-sm text-destructive">
            {t(`errors.${code}`)}
          </p>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("submitting") : t("login")}
      </Button>
    </form>
  );
}
