import { createHash, randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";

import { hashPassword } from "./password";

/**
 * How long a reset link stays alive. Long enough to walk to a laptop, short
 * enough that a forwarded mail from last month is worthless.
 */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** A fresh, unguessable token for the emailed link. */
export function createResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * What is stored for a token. SHA-256 rather than bcrypt on purpose: the token
 * is already 256 bits of entropy, so there is nothing to slow a guesser down
 * for, and lookup has to be a single indexed read.
 */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A stored token is usable while it is unused and unexpired. */
export function isResetTokenUsable(
  row: { expiresAt: Date; usedAt: Date | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!row) return false;
  if (row.usedAt !== null) return false;
  return row.expiresAt.getTime() > now.getTime();
}

export function resetTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MS);
}

/**
 * Issue a reset for a user and return the token to email. Any earlier tokens
 * are dropped, so asking twice invalidates the first link rather than leaving
 * two live doors into the account.
 */
export async function issuePasswordReset(
  userId: string,
  now: Date = new Date(),
): Promise<string> {
  const token = createResetToken();

  await db.transaction(async (tx) => {
    await tx
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));

    await tx.insert(passwordResetTokens).values({
      userId,
      tokenHash: hashResetToken(token),
      expiresAt: resetTokenExpiry(now),
    });
  });

  return token;
}

/**
 * Spend a reset token on a new password. Returns false for a token that is
 * unknown, already used or expired — the caller shows one message for all
 * three, because telling them apart only helps someone guessing.
 */
export async function completePasswordReset(
  token: string,
  password: string,
  now: Date = new Date(),
): Promise<boolean> {
  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, hashResetToken(token)),
      isNull(passwordResetTokens.usedAt),
    ),
  });

  if (!isResetTokenUsable(row, now)) return false;

  const passwordHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: now })
      .where(eq(users.id, row!.userId));

    // Single use, and every other pending link for this account dies with it.
    await tx
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, row!.userId));
  });

  return true;
}
