import type { DonationEntity } from "@/data/donationEntities";
import { mapApiEntity } from "./donationEntities";
import { isPublicRecord, normalizeSlug, type ApiRecord } from "./_shared";

export type PublicCampaignCard = Pick<
  DonationEntity,
  "ar" | "en" | "taglineAr" | "taglineEn" | "descriptionAr" | "descriptionEn" | "benefitsAr" | "benefitsEn" | "image" | "categoryAr" | "categoryEn" | "priceFrom" | "donationType"
> & {
  id: string;
  slug: string;
  path: string;
  category: "ongoing" | "seasonal" | "sustainability" | "education";
};

const LANDING_SLUGS: Record<string, string> = {
  zell: "dhill",
  sitr: "setr",
  markoon: "markoun",
  "arboun-kheir": "arboun",
  food: "food-box",
};

const LANDING_PATHS: Record<string, string> = {
  dhill: "/dhill",
  setr: "/setr",
  markoun: "/markoun",
  arboun: "/arboun",
  athar: "/athar",
  ramadan: "/ramadan",
  "food-box": "/food-box",
};

function categoryFor(slug: string, categorySlug: string): PublicCampaignCard["category"] {
  if (slug === "markoon") return "sustainability";
  if (slug === "athar" || categorySlug === "education") return "education";
  if (categorySlug === "seasonal" || categorySlug === "relief-housing") return "seasonal";
  return "ongoing";
}

/** Build the public listing from API records only; static content never supplies card copy or images. */
export function mapPublicCampaignCards(records: ApiRecord[]): PublicCampaignCard[] {
  return records
    .filter(isPublicRecord)
    .sort((a, b) => Number(a.sort_order ?? a.display_order ?? 0) - Number(b.sort_order ?? b.display_order ?? 0))
    .map((record) => {
      const campaign = mapApiEntity(record, "campaign");
      const slug = normalizeSlug(campaign.slug) || String(record.id ?? campaign.id);
      const landingSlug = LANDING_SLUGS[slug] ?? slug;
      const category = record.category && typeof record.category === "object" ? record.category as ApiRecord : {};

      return {
        id: campaign.apiId ? String(campaign.apiId) : slug,
        slug,
        path: LANDING_PATHS[landingSlug] ?? `/campaigns/${encodeURIComponent(slug)}`,
        ar: campaign.ar,
        en: campaign.en,
        taglineAr: campaign.taglineAr,
        taglineEn: campaign.taglineEn,
        descriptionAr: campaign.descriptionAr,
        descriptionEn: campaign.descriptionEn,
        benefitsAr: campaign.benefitsAr,
        benefitsEn: campaign.benefitsEn,
        image: campaign.image,
        categoryAr: campaign.categoryAr,
        categoryEn: campaign.categoryEn,
        priceFrom: campaign.priceFrom,
        donationType: campaign.donationType,
        category: categoryFor(slug, normalizeSlug(category.slug)),
      };
    });
}
