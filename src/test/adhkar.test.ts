import { describe, expect, it } from "vitest";
import { ALL_DHIKR, DHIKR_GROUPS, MIXED_DHIKR, groupOfDhikr } from "@/data/adhkar";

describe("misbaha adhkar", () => {
  it("every dhikr has a unique id, a text, a virtue and a source", () => {
    const ids = ALL_DHIKR.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of ALL_DHIKR) {
      expect(d.text.length).toBeGreaterThan(3);
      expect(d.virtue.length).toBeGreaterThan(5);
      expect(d.source.length).toBeGreaterThan(3);
    }
  });
  it("the varied mode cycles through many phrases from all four kinds", () => {
    expect(MIXED_DHIKR.length).toBeGreaterThanOrEqual(20);
    expect(new Set(MIXED_DHIKR.map((d) => d.id)).size).toBeGreaterThanOrEqual(20);
    const kinds = new Set(MIXED_DHIKR.map((d) => groupOfDhikr(d.id).id));
    expect([...kinds].sort()).toEqual(DHIKR_GROUPS.map((g) => g.id).sort());
  });
});
