import { describe, it, expect, vi } from "vitest";

// Force the DB-backed branches to fail so we exercise the static fallback.
vi.mock("@/lib/blog", () => ({
  findPublishedPosts: () => {
    throw new Error("no db");
  },
}));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      products: {
        findMany: () => {
          throw new Error("no db");
        },
      },
    },
  },
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("robots", () => {
  it("blocks the private areas and points at the sitemap", () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.disallow).toEqual(
      expect.arrayContaining(["/*/admin", "/*/account", "/*/checkout"]),
    );
    expect(String(r.sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});

describe("sitemap", () => {
  it("degrades to the localized static routes without a database", async () => {
    const entries = await sitemap();
    expect(entries).toHaveLength(3);
    expect(entries.some((e) => e.url.endsWith("/shop"))).toBe(true);
    // Every entry carries hreflang alternates.
    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {})).toContain("en");
      expect(Object.keys(entry.alternates?.languages ?? {})).toContain("ka");
    }
  });
});
