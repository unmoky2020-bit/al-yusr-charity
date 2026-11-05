import { describe, expect, it } from "vitest";
import { splitMosqueShares } from "./MosquesLanding";
import type { Share } from "@/data/entityShares";

const s = (apiId: number, nameAr: string, nameEn: string, amount: number): Share => ({ id: `pkg-${apiId}`, apiId, nameAr, nameEn, amount });

describe("splitMosqueShares", () => {
  it("puts each backend package under one part only", () => {
    const { build, rebuild } = splitMosqueShares([
      s(136, "سهم فرش وسجاد مسجد (متر واحد)", "Mosque Carpet Share (1 Meter)", 250),
      s(137, "سهم مواد بناء وأسمنت (طن)", "Cement & Building Materials", 500),
      s(138, "سهم متر مربع إنشائي في المسجد", "1 Sq Meter Construction Share", 1000),
      s(139, "سهم إعمار مئذنة ومصلى نساء", "Minaret & Prayer Hall Share", 2500),
    ]);
    expect(build.map((x) => x.apiId)).toEqual([137, 138, 139]);
    expect(rebuild.map((x) => x.apiId)).toEqual([136]);
  });

  it("shows the defaults for a part with no package", () => {
    const { build, rebuild } = splitMosqueShares([s(136, "سهم فرش وسجاد مسجد", "Carpet", 250)]);
    expect(build.every((x) => x.apiId === undefined)).toBe(true);
    expect(rebuild.map((x) => x.apiId)).toEqual([136]);
  });
});
