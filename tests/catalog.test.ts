import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";

import { pickTranslation, slugify } from "@/lib/catalog";
import { categories, categoryTranslations } from "@/lib/db/schema";

describe("pickTranslation", () => {
  const rows = [
    { locale: "ka", name: "კატეგორია" },
    { locale: "en", name: "Category" },
  ];

  it("returns the requested locale", () => {
    expect(pickTranslation(rows, "en")?.name).toBe("Category");
    expect(pickTranslation(rows, "ka")?.name).toBe("კატეგორია");
  });

  it("falls back to the default locale, then the first row", () => {
    expect(pickTranslation(rows, "fr")?.locale).toBe("ka");
    expect(pickTranslation([{ locale: "en", name: "Only" }], "fr")?.name).toBe(
      "Only",
    );
    expect(pickTranslation([], "en")).toBeUndefined();
  });
});

describe("slugify", () => {
  it("normalizes latin and keeps georgian letters", () => {
    expect(slugify("  Vintage Chairs!  ")).toBe("vintage-chairs");
    expect(slugify("ძველი ნივთები")).toBe("ძველი-ნივთები");
  });
});

describe("category schema", () => {
  it("defines category + translation columns", () => {
    const cat = getTableColumns(categories);
    expect(cat.parentId).toBeDefined();
    expect(cat.isVisible).toBeDefined();
    expect(cat.sortOrder).toBeDefined();

    const tr = getTableColumns(categoryTranslations);
    expect(tr.locale).toBeDefined();
    expect(tr.slug).toBeDefined();
    expect(tr.name.notNull).toBe(true);
  });
});
