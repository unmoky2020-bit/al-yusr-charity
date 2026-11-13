import { describe, expect, it } from "vitest";
import { parseCsv, SEO_KEYWORDS, summarize, tierOf } from "./seoKeywords";

describe("seo keyword map", () => {
  it("reads the CSV with quotes", () => {
    expect(parseCsv('a,b\n"x, y",z\n')).toEqual([["a", "b"], ["x, y", "z"]]);
  });
  it("loads the plan from docs/seo-keywords.csv", () => {
    expect(SEO_KEYWORDS.length).toBeGreaterThan(400);
    const mosque = SEO_KEYWORDS.find((k) => k.keyword === "إعمار مسجد في مصر");
    expect(mosque?.page).toBe("/mosques");
    expect(mosque?.seenInGsc).toBe(true);
  });
  it("puts each keyword in a tier", () => {
    expect(tierOf({ pos: 2 })).toBe("top3");
    expect(tierOf({ pos: 9 })).toBe("top10");
    expect(tierOf({ pos: 15 })).toBe("top20");
    expect(tierOf({ pos: null, date: "2026-11-13" })).toBe("far");
    expect(tierOf(undefined)).toBe("untracked");
    const s = summarize(SEO_KEYWORDS.slice(0, 3), { [SEO_KEYWORDS[0].keyword]: { pos: 1 } });
    expect(s.all.top3).toBe(1);
    expect(s.all.untracked).toBe(2);
  });
});
