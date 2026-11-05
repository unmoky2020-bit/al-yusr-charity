import { describe, expect, it } from "vitest";
import { PAGE_GALLERIES, PAGE_GALLERY_KEYS, parseGalleryItems } from "./pageGalleries";
import { pageImageUrl } from "./pageImages";

describe("page galleries", () => {
  it("reads saved pictures defensively", () => {
    expect(parseGalleryItems(null)).toEqual([]);
    expect(parseGalleryItems("not json")).toEqual([]);
    expect(parseGalleryItems('{"items":"x"}')).toEqual([]);
    expect(
      parseGalleryItems(JSON.stringify({ items: [{ src: " https://a/1.jpg ", alt: { ar: "أ" } }, { src: "" }, 3, { src: "asset:yusr-water.png", caption: { ar: "مياه" } }] })),
    ).toEqual([
      { src: "https://a/1.jpg", alt: { ar: "أ", en: "" } },
      { src: "asset:yusr-water.png", alt: { ar: "", en: "" }, caption: { ar: "مياه", en: "" } },
    ]);
  });

  it("every default picture resolves to a bundled file", () => {
    for (const k of PAGE_GALLERY_KEYS) {
      expect(PAGE_GALLERIES[k].defaults.length).toBeGreaterThan(0);
      for (const it of PAGE_GALLERIES[k].defaults) expect(pageImageUrl(it.src), `${k}: ${it.src}`).toBeTruthy();
    }
  });

  it("the Qurbani gallery keeps only Qurbani photos", () => {
    expect(PAGE_GALLERIES.qurbani.defaults.every((it) => it.src.includes("qurbani"))).toBe(true);
    expect(PAGE_GALLERIES.farm.defaults.length).toBeGreaterThan(PAGE_GALLERIES.qurbani.defaults.length);
  });
});
