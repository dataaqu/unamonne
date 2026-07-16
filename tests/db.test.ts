import { describe, it, expect, beforeAll } from "vitest";

describe("db module", () => {
  beforeAll(() => {
    // Provide a dummy URL to silence the "DATABASE_URL not set" warning. The
    // pool connects lazily, so no real connection is opened during import.
    process.env.DATABASE_URL ||= "postgres://user:pass@localhost:5432/vintage";
  });

  it("exports a configured drizzle instance", async () => {
    const { db, schema } = await import("@/lib/db");
    expect(db).toBeDefined();
    expect(typeof db.select).toBe("function");
    expect(typeof db.insert).toBe("function");
    expect(schema).toBeDefined();
  });
});
