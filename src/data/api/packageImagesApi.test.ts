import { describe, expect, it } from "vitest";
import { parsePackageImages } from "./packageImagesApi";
import { withPackageImages } from "@/data/sources/donationEntities";
import type { DonationEntity } from "@/data/donationEntities";

describe("package images", () => {
  it("parses the backend map and drops bad rows", () => {
    const map = parsePackageImages({
      data: {
        "12": { image: "https://api.elyusr.org/storage/storage/media/a.webp", alt_ar: "كرتونة" },
        "0": { image: "https://x/y.webp" },
        abc: { image: "https://x/y.webp" },
        "13": { image: "" },
      },
    });
    expect(Object.keys(map)).toEqual(["12"]);
    expect(map[12].image).toMatch(/\/storage\/media\/a\.webp$/);
    expect(map[12].image).not.toContain("storage/storage");
    expect(map[12].altAr).toBe("كرتونة");
  });

  it("returns an empty map for anything else", () => {
    expect(parsePackageImages(null)).toEqual({});
    expect(parsePackageImages({ data: [] })).toEqual({});
  });

  it("puts each picture on the share with the same backend id", () => {
    const ent = {
      id: "food", shares: [
        { id: "a", nameAr: "كرتونة", nameEn: "Box", price: 300, apiId: 12 },
        { id: "b", nameAr: "نص", nameEn: "Half", price: 150, apiId: 14 },
      ],
    } as unknown as DonationEntity;
    const [out] = withPackageImages([ent], { 12: { image: "https://x/a.webp" } });
    expect(out.shares[0].image).toBe("https://x/a.webp");
    expect(out.shares[0].imageAlt).toBe("كرتونة");
    expect(out.shares[1].image).toBeUndefined();
    expect(withPackageImages([ent], {})[0]).toBe(ent);
  });
});
