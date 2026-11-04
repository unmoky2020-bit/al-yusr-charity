import { describe, expect, it } from "vitest";
import { findShare, mapShares, resolveShares, shareDonateHref, type Share } from "./entityShares";

const DEFAULTS: Share[] = [{ id: "d1", nameAr: "افتراضي", nameEn: "Default", amount: 100 }];

describe("entityShares", () => {
  it("falls back to the defaults without a record or active packages", () => {
    expect(resolveShares(undefined, DEFAULTS)).toEqual(DEFAULTS);
    expect(resolveShares({ donation_packages: [{ id: 1, name_ar: "مخفي", amount: 50, is_active: false }] }, DEFAULTS)).toEqual(DEFAULTS);
  });

  it("maps active packages in sort order and drops unpriced or nameless rows", () => {
    const shares = mapShares([
      { id: 9, name_ar: "ثاني", name_en: "Second", amount: "300.00", sort_order: 2 },
      { id: 7, key: "first", name_ar: "أول", amount: 200, sort_order: 1 },
      { id: 8, name_ar: "بدون سعر", amount: 0, sort_order: 3 },
      { id: 10, name_ar: "", amount: 100, sort_order: 4 },
    ]);
    expect(shares).toEqual([
      { id: "first", apiId: 7, nameAr: "أول", nameEn: "أول", amount: 200 },
      { id: "pkg-9", apiId: 9, nameAr: "ثاني", nameEn: "Second", amount: 300 },
    ]);
  });

  it("builds donate links on the backend package id, and finds a share by keyword", () => {
    const [s] = mapShares([{ id: 5, name_ar: "صرف روشتة", amount: 200 }]);
    expect(shareDonateHref("project", "medical", s)).toBe("/donate?project=medical&package=5&amount=200");
    expect(findShare([s], ["روشت"])).toBe(s);
    expect(findShare([s], ["عملي"])).toBeUndefined();
  });
});
