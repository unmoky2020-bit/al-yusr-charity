import { describe, expect, it } from "vitest";
import { imagesColumn, l, mergeCampaignContent, type CampaignPageContent } from "./types";
import { toCampaignColumns } from "./api";
import { projectPageColumn } from "@/data/projectPages";
import { pageImageUrl, resolveImages } from "@/data/pageImages";

const withImages: CampaignPageContent = {
  hero: { eyebrow: l("", ""), title: l("عنوان", "Title"), title2: l("", ""), lead: l("", ""), donateLabel: l("تبرع", "Donate") },
  hadith: { text: l("", ""), source: l("", "") },
  prices: [],
  stats: [],
  sections: {},
  faq: [],
  cta: { title: l("", ""), sub: l("", "") },
  images: {
    hero: { label: l("صورة", "Hero"), max: 1, items: [{ src: "asset:yusr-water.png", alt: l("مياه", "Water") }] },
    gallery: {
      label: l("معرض", "Gallery"),
      items: [
        { src: "asset:poster-water.png", alt: l("أ", "a") },
        { src: "asset:yusr-meals.webp", alt: l("ب", "b") },
      ],
    },
  },
};

describe("page image slots", () => {
  it("keeps the default pictures when nothing (or nothing usable) is saved", () => {
    expect(mergeCampaignContent(withImages, null).images).toEqual(withImages.images);
    expect(mergeCampaignContent(withImages, { images: "x" }).images).toEqual(withImages.images);
    expect(mergeCampaignContent(withImages, { images: { gallery: { items: [] } } }).images?.gallery.items).toEqual(withImages.images!.gallery.items);
    expect(mergeCampaignContent(withImages, { images: { gallery: { items: [{ src: "  " }, null, 5] } } }).images?.gallery.items).toEqual(withImages.images!.gallery.items);
  });

  it("replaces a slot's pictures with the saved list, in its order, and keeps the code labels", () => {
    const m = mergeCampaignContent(withImages, {
      images: {
        gallery: { label: l("hacked", "hacked"), items: [{ src: "https://cdn.example/b.jpg", alt: { ar: "ب", en: "" } }, { src: "asset:yusr-water.png" }] },
        ghost: { items: [{ src: "https://cdn.example/x.jpg" }] },
      },
    });
    expect(m.images?.gallery.label).toEqual(l("معرض", "Gallery"));
    expect(m.images?.gallery.items).toEqual([
      { src: "https://cdn.example/b.jpg", alt: l("ب", "") },
      { src: "asset:yusr-water.png", alt: l("", "") },
    ]);
    expect(m.images).not.toHaveProperty("ghost");
    expect(m.images?.hero.items).toEqual(withImages.images!.hero.items);
  });

  it("caps single-image slots at their max", () => {
    const m = mergeCampaignContent(withImages, { images: { hero: { items: [{ src: "https://a/1.jpg" }, { src: "https://a/2.jpg" }] } } });
    expect(m.images?.hero.items.map((i) => i.src)).toEqual(["https://a/1.jpg"]);
  });

  it("stores only each slot's pictures", () => {
    expect(imagesColumn(withImages.images)).toEqual({ hero: { items: withImages.images!.hero.items }, gallery: { items: withImages.images!.gallery.items } });
    expect(toCampaignColumns(withImages).page_content.images).toEqual(imagesColumn(withImages.images));
    expect(projectPageColumn(withImages).images).toEqual(imagesColumn(withImages.images));
  });

  it("resolves bundled names and drops unknown ones", () => {
    expect(pageImageUrl("asset:yusr-water.png")).toBeTruthy();
    expect(pageImageUrl("asset:missing.png")).toBe("");
    const r = resolveImages([{ src: "asset:missing.png", alt: l("", "") }, { src: "asset:yusr-water.png", alt: l("مياه", ""), caption: l("عنوان", "") }]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ altAr: "مياه", altEn: "مياه", captionAr: "عنوان", captionEn: "عنوان" });
  });
});
