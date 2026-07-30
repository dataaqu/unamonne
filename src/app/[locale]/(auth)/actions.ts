"use server";

import { AuthError } from "next-auth";

import { routing, type Locale } from "@/i18n/routing";
import { signIn, signOut } from "@/lib/auth";
import { registerUser, type RegisterState } from "@/lib/auth/actions";
import { loginSchema } from "@/lib/auth/schemas";
import { upsertSubscriber } from "@/lib/newsletter";

function localeFromForm(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

export type LoginState = {
  ok: boolean;
  error?: "INVALID_CREDENTIALS" | "UNKNOWN";
  fieldErrors?: Partial<Record<"email" | "password", string[]>>;
};

/**
 * Sign in with the Credentials provider. On success `signIn` throws a redirect
 * (to `redirectTo`) that must propagate; only auth failures are caught and
 * surfaced to the form.
 */
export async function loginAction(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "INVALID_CREDENTIALS" };
    }
    throw error; // redirect
  }

  return { ok: true };
}

/**
 * Register a customer, then sign them in immediately. Validation/uniqueness
 * failures come back from `registerUser`; a successful sign-in redirects home.
 *
 * The seasonal letter is opt-in on the same form. It is subscribed after the
 * account exists and never blocks the sign-in: someone who has just created an
 * account should not be held at the door because the mailing list is down.
 */
export async function registerAction(
  prevState: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const result = await registerUser(prevState, formData);
  if (!result.ok) return result;

  if (formData.get("newsletter") != null) {
    try {
      await upsertSubscriber({
        email: String(formData.get("email") ?? "")
          .trim()
          .toLowerCase(),
        locale: localeFromForm(formData),
        source: "register",
      });
    } catch (error) {
      console.error("[auth] failed to subscribe on register", error);
    }
  }

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Account was created; let them sign in manually.
      return { ok: true };
    }
    throw error; // redirect
  }

  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
