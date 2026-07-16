import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";

import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";

describe("auth schema", () => {
  it("defines the Auth.js adapter tables", () => {
    expect(users).toBeDefined();
    expect(accounts).toBeDefined();
    expect(sessions).toBeDefined();
    expect(verificationTokens).toBeDefined();
  });

  it("adds shop-specific columns to users", () => {
    const cols = getTableColumns(users);
    expect(cols.role).toBeDefined();
    expect(cols.passwordHash).toBeDefined();
    expect(cols.email.notNull).toBe(true);
    expect(cols.email.isUnique).toBe(true);
  });

  it("defaults new users to the customer role", () => {
    const cols = getTableColumns(users);
    expect(cols.role.default).toBe("customer");
    expect(cols.role.enumValues).toEqual(["customer", "admin"]);
  });
});
