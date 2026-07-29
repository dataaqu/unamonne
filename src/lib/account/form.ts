import { auth } from "@/lib/auth";

/** Shared account form-action result shape (works with useActionState). */
export type AccountFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * The signed-in user's id, or throws UNAUTHORIZED. Account actions are the write
 * boundary for a customer's own data, so every one starts here — a page-level
 * guard alone would leave the action callable directly.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}
