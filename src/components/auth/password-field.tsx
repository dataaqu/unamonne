"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import {
  passwordStrength,
  type PasswordStrength,
} from "@/lib/auth/password-strength";
import { cn } from "@/lib/utils";

const BARS: Record<PasswordStrength, string> = {
  0: "bg-ink-200",
  1: "bg-danger-500",
  2: "bg-warning-500",
  3: "bg-success-500",
};

/**
 * The house password input: the same underline as every other field, with the
 * eye pinned to the baseline and — on the register form — a live read of how
 * strong what has been typed is.
 */
export function PasswordField({
  label,
  name,
  autoComplete,
  placeholder,
  error,
  action,
  meter = false,
  required = true,
}: {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  error?: React.ReactNode;
  /** Rendered opposite the label — the sign-in form puts "Forgot?" there. */
  action?: React.ReactNode;
  meter?: boolean;
  required?: boolean;
}) {
  const t = useTranslations("Auth");
  const [shown, setShown] = useState(false);
  const [value, setValue] = useState("");

  const strength = passwordStrength(value);

  return (
    <label className="block" htmlFor={name}>
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {label}
        </span>
        {action}
      </span>

      <span className="relative mt-2 block">
        <input
          id={name}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-11 w-full rounded-none border-0 border-b bg-transparent px-0 pr-10 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none",
            error
              ? "border-danger-500 focus:border-danger-600"
              : "border-ink-300 focus:border-ink-900",
          )}
        />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-label={shown ? t("hidePassword") : t("showPassword")}
          className="absolute right-0 top-3 text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
        >
          {shown ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </span>

      {meter ? (
        <span className="mt-3 flex items-center gap-3">
          <span className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3].map((bar) => (
              <span
                key={bar}
                className={cn(
                  "h-0.5 flex-1",
                  bar <= strength ? BARS[strength] : "bg-ink-200",
                )}
              />
            ))}
          </span>
          <span className="w-20 text-[11px] text-ink-500" role="status">
            {strength === 0 ? "" : t(`strength.${strength}`)}
          </span>
        </span>
      ) : null}

      {error ? (
        <span className="mt-1.5 block text-xs text-danger-600">{error}</span>
      ) : null}
    </label>
  );
}
