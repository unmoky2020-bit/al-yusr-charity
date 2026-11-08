import { describe, expect, it } from "vitest";
import {
  resolveTakrimContent,
  TAKRIM_DEFAULT_DESC,
  TAKRIM_DEFAULT_IMAGE,
  TAKRIM_DEFAULT_SHARES,
  TAKRIM_DEFAULT_TITLE,
} from "./takrimContent";

describe("takrim landing content", () => {
  it("returns the bilingual defaults when there is no program record", () => {
    const c = resolveTakrimContent();
    expect(c.title).toEqual(TAKRIM_DEFAULT_TITLE);
    expect(c.desc).toEqual(TAKRIM_DEFAULT_DESC);
    expect(c.image).toBe(TAKRIM_DEFAULT_IMAGE);
    expect(c.shares).toEqual(TAKRIM_DEFAULT_SHARES);
    expect(c.shares.map((s) => s.id)).toEqual(["tkr-shroud", "tkr-running", "tkr-washer", "tkr-new-car"]);
    expect(c.shares.map((s) => s.amount)).toEqual([500, 1000, 500, 10000]);
  });

  it("maps the hero fields and the active packages, sorted by sort_order", () => {
    const c = resolveTakrimContent({
      slug: "takrim",
      name_ar: "تكريم الإنسان",
      name_en: "Takrim",
      hero_h1_ar: "عنوان أعلى الصفحة",
      hero_h1_en: "Top section title",
      hero_h3_ar: "وصف أعلى الصفحة",
      hero_h3_en: "Top section description",
      description_ar: "الوصف العام",
      description_en: "General description",
      hero_image: "storage/programs/takrim-hero.jpg",
      image: "storage/programs/takrim.jpg",
      donation_packages: [
        { id: 12, key: "tkr-running", name_ar: "تشغيل السيارة", name_en: "Van running", amount: "1000.00", sort_order: 2, is_active: true },
        { id: 11, name_ar: "كفن شرعي", name_en: "Islamic shroud", amount: 500, sort_order: 1, is_active: true },
        { id: 13, name_ar: "غير مفعّل", name_en: "Inactive share", amount: 999, sort_order: 0, is_active: false },
        { id: 14, name_ar: "سيارة جديدة", name_en: "New van", amount: 10000, sort_order: 3 },
      ],
    });

    expect(c.title).toEqual({ ar: "عنوان أعلى الصفحة", en: "Top section title" });
    expect(c.desc).toEqual({ ar: "وصف أعلى الصفحة", en: "Top section description" });
    expect(c.image).toContain("/storage/programs/takrim-hero.jpg");
    expect(c.shares.map((s) => s.id)).toEqual(["pkg-11", "tkr-running", "pkg-14"]);
    expect(c.shares.map((s) => s.amount)).toEqual([500, 1000, 10000]);
    expect(c.shares.map((s) => s.apiId)).toEqual([11, 12, 14]);
    expect(c.shares[1].nameAr).toBe("تشغيل السيارة");
  });

  it("falls back to name_* and description_* when the hero fields are empty", () => {
    const c = resolveTakrimContent({
      name_ar: "اسم البرنامج",
      name_en: "Program name",
      description_ar: "وصف البرنامج",
      description_en: "Program description",
      image: "storage/programs/takrim.jpg",
    });
    expect(c.title).toEqual({ ar: "اسم البرنامج", en: "Program name" });
    expect(c.desc).toEqual({ ar: "وصف البرنامج", en: "Program description" });
    expect(c.image).toContain("/storage/programs/takrim.jpg");
  });

  it("returns the four default shares when no package is active", () => {
    const c = resolveTakrimContent({
      slug: "takrim",
      donation_packages: [
        { id: 21, key: "old-share", name_ar: "قديم", name_en: "Old", amount: 250, sort_order: 1, is_active: false },
        { id: 22, name_ar: "صفر", name_en: "Zero", amount: 0, sort_order: 2, is_active: 0 },
      ],
    });
    expect(c.shares).toEqual(TAKRIM_DEFAULT_SHARES);
  });
});

describe("resolveTakrimFromRecords", () => {
  it("uses the takrim project's packages when there is no takrim program", async () => {
    const { resolveTakrimFromRecords, TAKRIM_DEFAULT_TITLE } = await import("./takrimContent");
    const c = resolveTakrimFromRecords({
      programs: [{ id: 1, slug: "zakat" }],
      projects: [
        { id: 31, slug: "takrim", name: "سيارات تكريم الإنسان", donation_packages: [
          { id: 141, name_ar: "ب", amount: "250.00", sort_order: 2 },
          { id: 140, name_ar: "أ", amount: "100.00", sort_order: 1 },
          { id: 142, name_ar: "ج", amount: "500.00", is_active: false },
        ] },
      ],
    });
    expect(c.shares.map((s) => [s.apiId, s.amount])).toEqual([[140, 100], [141, 250]]);
    expect(c.title).toEqual(TAKRIM_DEFAULT_TITLE);
  });

  it("falls back to the static shares when neither record exists", async () => {
    const { resolveTakrimFromRecords, TAKRIM_DEFAULT_SHARES } = await import("./takrimContent");
    const c = resolveTakrimFromRecords({ programs: [], projects: [] });
    expect(c.shares.map((s) => s.id)).toEqual(TAKRIM_DEFAULT_SHARES.map((s) => s.id));
  });
});

describe("takrim hero image", () => {
  it("uses the takrim project's cover image", async () => {
    const { resolveTakrimFromRecords } = await import("./takrimContent");
    const c = resolveTakrimFromRecords({ programs: [], projects: [{ id: 31, slug: "takrim", cover_image: "https://api.elyusr.org/storage/media/programs/takrim.webp" }] });
    expect(c.image).toContain("takrim.webp");
  });
});
