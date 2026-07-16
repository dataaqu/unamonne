import { describe, it, expect } from "vitest";

import { registerSchema } from "@/lib/auth/schemas";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Nino",
      email: "  Nino@Example.com ",
      password: "supersecret",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("Nino@Example.com");
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "supersecret",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain("EMAIL_INVALID");
    }
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({
      email: "a@b.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain(
        "PASSWORD_TOO_SHORT",
      );
    }
  });
});
