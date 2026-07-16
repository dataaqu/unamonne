"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

import { hashPassword } from "./password";
import { registerSchema } from "./schemas";

export type RegisterState = {
  ok: boolean;
  /** Stable error code for a whole-form failure, mapped to a localized string in the UI. */
  error?: "EMAIL_TAKEN" | "UNKNOWN";
  /** Per-field validation error codes, keyed by field name. */
  fieldErrors?: Partial<Record<"name" | "email" | "password", string[]>>;
};

/**
 * Create a customer account from a registration form.
 *
 * Shaped for `useActionState` (prevState, formData). New accounts always get the
 * `customer` role; admins are provisioned separately (seed script, T1.12).
 */
export async function registerUser(
  _prevState: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name?.trim() || null;

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      return { ok: false, error: "EMAIL_TAKEN" };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await db.insert(users).values({
      email,
      name,
      passwordHash,
      role: "customer",
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
