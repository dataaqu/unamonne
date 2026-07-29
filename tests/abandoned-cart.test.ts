import { describe, it, expect } from "vitest";

import {
  abandonmentCutoff,
  filterByEmailed,
  hasBeenEmailed,
  isAbandonmentCandidate,
} from "@/lib/abandoned-cart";

const NOW = new Date("2026-07-12T12:00:00Z");

function hoursAgo(h: number): Date {
  return new Date(NOW.getTime() - h * 60 * 60 * 1000);
}

describe("abandonmentCutoff", () => {
  it("subtracts the idle window from now", () => {
    expect(abandonmentCutoff(NOW, 24)).toEqual(hoursAgo(24));
  });
});

describe("isAbandonmentCandidate", () => {
  const base = { status: "active", updatedAt: hoursAgo(30), itemCount: 2 };

  it("flags an idle active cart that still has items", () => {
    expect(isAbandonmentCandidate(base, NOW, 24)).toBe(true);
  });

  it("ignores a cart touched within the idle window", () => {
    expect(
      isAbandonmentCandidate({ ...base, updatedAt: hoursAgo(1) }, NOW, 24),
    ).toBe(false);
  });

  it("ignores an empty cart", () => {
    expect(isAbandonmentCandidate({ ...base, itemCount: 0 }, NOW, 24)).toBe(
      false,
    );
  });

  it("ignores carts that are not active (converted or already abandoned)", () => {
    expect(
      isAbandonmentCandidate({ ...base, status: "converted" }, NOW, 24),
    ).toBe(false);
    expect(
      isAbandonmentCandidate({ ...base, status: "abandoned" }, NOW, 24),
    ).toBe(false);
  });

  it("treats a cart exactly at the cutoff as abandoned", () => {
    expect(
      isAbandonmentCandidate({ ...base, updatedAt: hoursAgo(24) }, NOW, 24),
    ).toBe(true);
  });
});

describe("hasBeenEmailed / filterByEmailed", () => {
  const carts = [
    { id: "a", emails: [{ id: "e1" }] },
    { id: "b", emails: [] },
    { id: "c", emails: [{ id: "e2" }, { id: "e3" }] },
  ];

  it("reports whether a cart has any recovery email", () => {
    expect(hasBeenEmailed(carts[0])).toBe(true);
    expect(hasBeenEmailed(carts[1])).toBe(false);
  });

  it("returns the list unchanged with no filter", () => {
    expect(filterByEmailed(carts)).toHaveLength(3);
  });

  it("keeps only emailed carts when emailed=true", () => {
    expect(filterByEmailed(carts, true).map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("keeps only un-emailed carts when emailed=false", () => {
    expect(filterByEmailed(carts, false).map((c) => c.id)).toEqual(["b"]);
  });
});
