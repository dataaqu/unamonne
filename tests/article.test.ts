import { describe, it, expect } from "vitest";

import { extractHeadings, readingMinutes } from "@/lib/blog";

describe("readingMinutes", () => {
  it("never reports less than a minute", () => {
    expect(readingMinutes("Three short words")).toBe(1);
  });

  it("scales with the word count", () => {
    expect(readingMinutes("word ".repeat(1000))).toBe(5);
  });

  it("survives an empty body", () => {
    expect(readingMinutes("")).toBe(1);
  });
});

describe("extractHeadings", () => {
  const body = [
    "An opening paragraph.",
    "",
    "## The blank",
    "",
    "Some prose.",
    "",
    "### A sub-heading that is not in the rail",
    "",
    "## Four passes",
  ].join("\n");

  it("collects the top-level headings in order", () => {
    expect(extractHeadings(body)).toEqual([
      { id: "the-blank", text: "The blank" },
      { id: "four-passes", text: "Four passes" },
    ]);
  });

  it("keeps Georgian headings readable in the anchor", () => {
    const [heading] = extractHeadings("## მთვარის სერია");
    expect(heading.text).toBe("მთვარის სერია");
    expect(heading.id).toBe("მთვარის-სერია");
  });

  it("disambiguates two sections with the same title", () => {
    expect(extractHeadings("## Care\n\n## Care")).toEqual([
      { id: "care", text: "Care" },
      { id: "care-2", text: "Care" },
    ]);
  });

  it("ignores a hash that is not a heading", () => {
    expect(extractHeadings("Not a heading ## really")).toEqual([]);
  });
});
