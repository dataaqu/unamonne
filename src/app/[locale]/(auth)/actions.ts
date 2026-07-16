"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { registerUser, type RegisterState } from "@/lib/auth/actions";
import { loginSchema } from "@/lib/auth/schemas";

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
 */
export async function registerAction(
  prevState: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const result = await registerUser(prevState, formData);
  if (!result.ok) return result;

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
