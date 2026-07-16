import { auth } from "@/lib/auth";

/** Shared admin form-action result shape (works with useActionState). */
export type AdminFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Throws UNAUTHORIZED unless the caller is a signed-in admin. */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }
}
