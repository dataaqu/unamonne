import { describe, it, expect } from "vitest";

import { isPostPublished, pickTranslation } from "@/lib/blog";

const NOW = new Date("2026-07-12T12:00:00Z");

describe("isPostPublished", () => {
  it("is true for a published post whose time has arrived", () => {
    expect(
      isPostPublished(
        { status: "published", publishedAt: new Date("2026-07-01") },
        NOW,
      ),
    ).toBe(true);
  });

  it("is false for a draft", () => {
    expect(
      isPostPublished({ status: "draft", publishedAt: new Date("2026-07-01") }, NOW),
    ).toBe(false);
  });

  it("is false for a published post with no publish time", () => {
    expect(isPostPublished({ status: "published", publishedAt: null }, NOW)).toBe(
      false,
    );
  });

  it("hides a post scheduled for the future", () => {
    expect(
      isPostPublished(
        { status: "published", publishedAt: new Date("2026-08-01") },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("pickTranslation (re-exported for blog)", () => {
  it("prefers the requested locale", () => {
    const rows = [
      { locale: "en", title: "Hello" },
      { locale: "ka", title: "გამარჯობა" },
    ];
    expect(pickTranslation(rows, "ka")?.title).toBe("გამარჯობა");
  });
});
