import { describe, expect, it } from "vitest";
import { mapPublicCampaignCards } from "./publicCampaignCards";

describe("mapPublicCampaignCards", () => {
  it("uses backend images and content, resolving backend campaign slugs to landing pages", () => {
    const cards = mapPublicCampaignCards([
      {
        id: 18,
        slug: "sitr",
        name_ar: "حملة ستر من الباك إند",
        name_en: "Backend Sitr",
        image: "https://api.elyusr.org/storage/media/campaigns/sitr.webp",
        category: { slug: "relief-housing", name_ar: "إيواء وإغاثة", name_en: "Relief housing" },
        minimum_amount: 200,
        is_active: true,
        description_ar: "وصف ستر الحالي",
      },
    ]);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      slug: "sitr",
      path: "/setr",
      ar: "حملة ستر من الباك إند",
      descriptionAr: "وصف ستر الحالي",
      image: "/storage/media/campaigns/sitr.webp",
      category: "seasonal",
      priceFrom: 200,
    });
  });

  it("does not restore static cards when the backend has no public campaigns", () => {
    expect(mapPublicCampaignCards([])).toEqual([]);
    expect(mapPublicCampaignCards([
      { id: 4, slug: "hidden", name_ar: "مخفية", is_active: true, hide_from_audience: true },
    ])).toEqual([]);
  });

  it("does not use a static image when the backend campaign has no image", () => {
    const [card] = mapPublicCampaignCards([
      { id: 23, slug: "food", name_ar: "الغذاء الشهري", is_active: true },
    ]);

    expect(card.path).toBe("/food-box");
    expect(card.image).toBe("/placeholder.svg");
    expect(card.image).not.toContain("program-food");
  });
});
