import { describe, it, expect } from "vitest";

import { getKeywordMetrics, parseAhrefsMetrics } from "@/lib/seo/ahrefs";

describe("parseAhrefsMetrics", () => {
  it("reads volume and difficulty from a keywords array", () => {
    expect(
      parseAhrefsMetrics({ keywords: [{ volume: 1200, difficulty: 34 }] }),
    ).toEqual({ volume: 1200, difficulty: 34 });
  });

  it("tolerates snake_case field names", () => {
    expect(
      parseAhrefsMetrics({ search_volume: 500, keyword_difficulty: 10 }),
    ).toEqual({ volume: 500, difficulty: 10 });
  });

  it("returns null on an unrecognized shape", () => {
    expect(parseAhrefsMetrics({ nope: true })).toBeNull();
    expect(parseAhrefsMetrics(null)).toBeNull();
  });
});

describe("getKeywordMetrics", () => {
  it("degrades to null when no token is configured", async () => {
    const original = process.env.AHREFS_API_TOKEN;
    delete process.env.AHREFS_API_TOKEN;
    try {
      expect(await getKeywordMetrics("vintage chair")).toBeNull();
    } finally {
      if (original !== undefined) process.env.AHREFS_API_TOKEN = original;
    }
  });
});
