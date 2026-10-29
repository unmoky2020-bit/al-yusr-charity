import { describe, expect, it } from "vitest";
import { Droplets } from "lucide-react";
import { SERVICE_PAGES, SERVICE_PAGE_LIST } from "@/data/servicePagesConfig";
import { DONATE_SECTORS } from "@/data/servicesMap";
import { mapApiService, resolveServicePages } from "./services";
import { mapApiSector, resolveSectors } from "./servicesMap";
import { API_AXIS_FOOD, API_SERVICE_WELLS } from "./_testFixtures";

describe("service pages source", () => {
  it("maps a (proposed) /services record to ServicePageConfig", () => {
    const fb = SERVICE_PAGES.wells;
    const s = mapApiService(API_SERVICE_WELLS, fb);
    expect(s.slug).toBe("wells");
    expect(s.programSlug).toBe("water");
    expect(s.title_ar).toBe("حفر الآبار وشبكات المياه (API)");
    expect(s.bullets_ar).toEqual(["بند أول", "بند ثاني"]);
    expect(s.stats).toEqual([{ ar: "750م", en: "750m", arL: "شبكات", enL: "pipelines" }]);
    expect(s.features[0].Icon).toBe(Droplets);
    expect(s.tiers[0]).toEqual({ amount: 500, unit_ar: "سهم", unit_en: "Share", desc_ar: "وصف", desc_en: "desc", highlight: true });
    expect(s.related).toEqual([{ to: "/services/farm", ar: "المزرعة", en: "Farm" }]);
  });

  it("falls back to the static page for missing fields", () => {
    const fb = SERVICE_PAGES.wells;
    const s = mapApiService(API_SERVICE_WELLS, fb);
    expect(s.hero).toBe(fb.hero);
    expect(s.badge_ar).toBe(fb.badge_ar);
    expect(s.bullets_en).toEqual(fb.bullets_en);
    expect(s.seo_title_ar).toBe(fb.seo_title_ar);
    expect(s.intro_en).toBe(fb.intro_en);
    expect(mapApiService({ slug: "wells" }, fb)).toEqual(fb);
  });

  it("returns the static list unchanged when the flag is static", () => {
    expect(resolveServicePages(undefined)).toBe(SERVICE_PAGE_LIST);
    expect(resolveServicePages([API_SERVICE_WELLS], "static")).toBe(SERVICE_PAGE_LIST);
  });

  it("api mode merges by slug and falls back to static for the rest", () => {
    const list = resolveServicePages([API_SERVICE_WELLS], "api");
    expect(list.map((s) => s.slug)).toEqual(SERVICE_PAGE_LIST.map((s) => s.slug));
    expect(list.find((s) => s.slug === "wells")!.title_en).toBe("Wells & Water Networks (API)");
    expect(list.find((s) => s.slug === "mosques")).toBe(SERVICE_PAGES.mosques);
    expect(resolveServicePages([], "api")).toBe(SERVICE_PAGE_LIST);
  });
});

describe("services-map sectors source (/axes)", () => {
  it("maps an axis to a Sector; nested programs without slug fall back to the static programs", () => {
    const fb = DONATE_SECTORS.find((s) => s.id === "food")!;
    const s = mapApiSector(API_AXIS_FOOD, fb);
    expect(s.id).toBe("food");
    expect(s.donate).toBe("sector-food");
    expect(s.title_ar).toBe("الغذاء");
    expect(s.intro_ar).toBe(API_AXIS_FOOD.description_ar);
    expect(s.summary_ar).toBe(fb.summary_ar);
    expect(s.programs).toBe(fb.programs);
    expect(Object.keys(s).sort()).toEqual(Object.keys(fb).sort());
  });

  it("maps nested programs once they carry a slug", () => {
    const s = mapApiSector({ ...API_AXIS_FOOD, programs: [{ id: 40, slug: "bride", name: "جواز عروسة", is_active: true }] });
    expect(s.programs).toEqual([{ slug: "bride", title_ar: "جواز عروسة", title_en: "جواز عروسة", desc_ar: "", desc_en: "" }]);
  });

  it("static flag returns DONATE_SECTORS unchanged", () => {
    expect(resolveSectors(undefined)).toBe(DONATE_SECTORS);
    expect(resolveSectors([API_AXIS_FOOD], "static")).toBe(DONATE_SECTORS);
    expect(resolveSectors([API_AXIS_FOOD], "api").map((s) => s.id)).toEqual(DONATE_SECTORS.map((s) => s.id));
  });
});
