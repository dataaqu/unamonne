import { describe, it, expect } from "vitest";

import {
  MIN_PASSWORD_LENGTH,
  passwordStrength,
} from "@/lib/auth/password-strength";
import {
  RESET_TOKEN_TTL_MS,
  createResetToken,
  hashResetToken,
  isResetTokenUsable,
  resetTokenExpiry,
} from "@/lib/auth/reset";
import { findOrderByReference } from "@/lib/orders";

describe("passwordStrength", () => {
  it("says nothing about an empty field", () => {
    expect(passwordStrength("")).toBe(0);
  });

  it("calls anything under the minimum too short", () => {
    expect(passwordStrength("a".repeat(MIN_PASSWORD_LENGTH - 1))).toBe(1);
  });

  it("accepts a long-enough password as fine", () => {
    expect(passwordStrength("password")).toBe(2);
    expect(passwordStrength("password1")).toBe(2);
    expect(passwordStrength("password!")).toBe(2);
  });

  it("only calls it strong with a digit and a symbol", () => {
    expect(passwordStrength("password1!")).toBe(3);
  });
});

describe("reset tokens", () => {
  it("mints a different token every time", () => {
    const tokens = new Set(Array.from({ length: 50 }, createResetToken));
    expect(tokens.size).toBe(50);
    expect([...tokens][0]!.length).toBeGreaterThan(32);
  });

  it("hashes deterministically, and never stores the token itself", () => {
    const token = createResetToken();
    expect(hashResetToken(token)).toBe(hashResetToken(token));
    expect(hashResetToken(token)).not.toContain(token);
    expect(hashResetToken(token)).toHaveLength(64);
  });

  it("expires an hour out", () => {
    const now = new Date("2026-07-30T10:00:00Z");
    expect(resetTokenExpiry(now).getTime() - now.getTime()).toBe(
      RESET_TOKEN_TTL_MS,
    );
  });

  it("is usable only while unused and unexpired", () => {
    const now = new Date("2026-07-30T10:00:00Z");
    const live = { expiresAt: new Date("2026-07-30T10:30:00Z"), usedAt: null };

    expect(isResetTokenUsable(live, now)).toBe(true);
    expect(
      isResetTokenUsable({ ...live, usedAt: new Date("2026-07-30T10:05:00Z") }, now),
    ).toBe(false);
    expect(
      isResetTokenUsable(
        { expiresAt: new Date("2026-07-30T09:59:00Z"), usedAt: null },
        now,
      ),
    ).toBe(false);
    expect(isResetTokenUsable(null, now)).toBe(false);
    expect(isResetTokenUsable(undefined, now)).toBe(false);
  });
});

describe("findOrderByReference", () => {
  it("refuses a reference that is not eight characters, without querying", async () => {
    await expect(findOrderByReference("7EEBA", "nino@example.ge")).resolves.toBe(
      undefined,
    );
    await expect(
      findOrderByReference("7EEBA295AA", "nino@example.ge"),
    ).resolves.toBe(undefined);
  });
});
