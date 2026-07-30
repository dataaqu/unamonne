import { describe, it, expect } from "vitest";

import { addressLines, countryName } from "@/lib/account/address-format";
import { firstName, profileFormSchema } from "@/lib/account/profile-schema";
import {
  dominantOrderRegion,
  firstOrderDate,
  orderHistoryStats,
  orderReference,
} from "@/lib/orders";

const order = (
  overrides: Partial<{
    total: number;
    region: "GE" | "INTL";
    paymentStatus: string;
    items: { quantity: number }[];
    createdAt: Date;
  }> = {},
) => ({
  total: 100_000,
  region: "GE" as const,
  paymentStatus: "paid",
  items: [{ quantity: 1 }],
  createdAt: new Date("2026-03-01"),
  ...overrides,
});

describe("orderHistoryStats", () => {
  it("counts every order but only spends paid ones", () => {
    const stats = orderHistoryStats([
      order(),
      order({ paymentStatus: "pending", total: 500_000 }),
      order({ paymentStatus: "refunded", total: 900_000 }),
    ]);

    expect(stats.orders).toBe(3);
    expect(stats.spent).toBe(100_000);
    expect(stats.pieces).toBe(1);
  });

  it("never adds two currencies together", () => {
    const list = [
      order({ total: 100_000, region: "GE" }),
      order({ total: 40_000, region: "INTL" }),
    ];

    expect(orderHistoryStats(list, "GE").spent).toBe(100_000);
    expect(orderHistoryStats(list, "INTL").spent).toBe(40_000);
  });

  it("sums quantities across the lines of paid orders", () => {
    const stats = orderHistoryStats([
      order({ items: [{ quantity: 2 }, { quantity: 1 }] }),
      order({ paymentStatus: "failed", items: [{ quantity: 9 }] }),
    ]);

    expect(stats.pieces).toBe(3);
  });
});

describe("dominantOrderRegion", () => {
  it("picks the region most of the paid orders were charged in", () => {
    expect(
      dominantOrderRegion([
        order({ region: "INTL" }),
        order({ region: "GE" }),
        order({ region: "GE" }),
      ]),
    ).toBe("GE");
  });

  it("ignores unpaid orders when deciding", () => {
    expect(
      dominantOrderRegion([
        order({ region: "INTL", paymentStatus: "pending" }),
        order({ region: "INTL", paymentStatus: "pending" }),
        order({ region: "GE" }),
      ]),
    ).toBe("GE");
  });

  it("breaks a tie with the newest paid order", () => {
    expect(
      dominantOrderRegion([order({ region: "INTL" }), order({ region: "GE" })]),
    ).toBe("INTL");
  });

  it("is null when nothing has been paid for", () => {
    expect(dominantOrderRegion([order({ paymentStatus: "failed" })])).toBeNull();
    expect(dominantOrderRegion([])).toBeNull();
  });
});

describe("firstOrderDate", () => {
  it("takes the oldest from a newest-first list", () => {
    const list = [
      order({ createdAt: new Date("2026-07-17") }),
      order({ createdAt: new Date("2026-03-12") }),
    ];

    expect(firstOrderDate(list)).toEqual(new Date("2026-03-12"));
  });

  it("is null with no orders", () => {
    expect(firstOrderDate([])).toBeNull();
  });
});

describe("orderReference", () => {
  it("shortens a uuid to eight upper-case characters", () => {
    expect(orderReference("3f6a9c12-1111-2222-3333-444455556666")).toBe(
      "3F6A9C12",
    );
  });
});

describe("addressLines", () => {
  const address = {
    fullName: "ნინო ბერიძე",
    line1: "ვერის ქუჩა 4",
    line2: "ბინა 12",
    city: "თბილისი",
    postalCode: "0179",
    country: "GE",
    phone: "+995 555 12 34 56",
  };

  it("writes name, street, place and phone on their own lines", () => {
    expect(addressLines(address, "ka")).toEqual([
      "ნინო ბერიძე",
      "ვერის ქუჩა 4, ბინა 12",
      `თბილისი 0179, ${countryName("GE", "ka")}`,
      "+995 555 12 34 56",
    ]);
  });

  it("drops the name when the card already shows it", () => {
    expect(addressLines(address, "en", { includeName: false })[0]).toBe(
      "ვერის ქუჩა 4, ბინა 12",
    );
  });

  it("collapses blank parts instead of leaving stray separators", () => {
    const lines = addressLines(
      { ...address, line2: null, postalCode: null, phone: null },
      "en",
    );

    expect(lines).toEqual([
      "ნინო ბერიძე",
      "ვერის ქუჩა 4",
      `თბილისი, ${countryName("GE", "en")}`,
    ]);
  });
});

describe("profile form", () => {
  it("requires a name and normalizes a blank phone to null", () => {
    const parsed = profileFormSchema.safeParse({ name: " Nino ", phone: "  " });
    expect(parsed.success && parsed.data).toEqual({
      name: "Nino",
      phone: null,
    });

    expect(profileFormSchema.safeParse({ name: "  ", phone: "" }).success).toBe(
      false,
    );
  });

  it("greets by the first name only", () => {
    expect(firstName("ნინო ბერიძე")).toBe("ნინო");
    expect(firstName(null)).toBe("");
  });
});
