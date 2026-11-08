/**
 * Takrim landing-page content.
 *
 * The top section (title, description, image) and the donation shares are edited in the dashboard on the
 * program record with slug "takrim" (`/programs`). This module maps that record to the page's shape and
 * keeps bilingual static fallbacks so the page renders the same when the API is unreachable or the
 * content source is "static".
 */
import takrimVan from "@/assets/takrim-van.jpg";
import { fetchProgramRecords, programSlugOf } from "@/data/sources/programs";
import { type ApiRecord, image, pick, useSourced } from "@/data/sources/_shared";
import { mapShares, type Share } from "@/data/entityShares";

export type TakrimText = { ar: string; en: string };
export type TakrimShare = Share;

export type TakrimContent = {
  title: TakrimText;
  desc: TakrimText;
  image: string;
  shares: TakrimShare[];
};

export const TAKRIM_DEFAULT_TITLE: TakrimText = {
  ar: "اطلب خدمة الغسل والتكفين ونقل المتوفى الآن، مجانًا",
  en: "Request washing, shrouding and funeral transport now — free",
};

export const TAKRIM_DEFAULT_DESC: TakrimText = {
  ar: "يصل إليك فريق اليسر وسيارة تكريم الإنسان داخل مدينة المنصورة، فنتولى غسل المتوفى وتكفينه على السنة، ونقله إلى المسجد ثم إلى المقابر في هدوء ووقار. الخدمة مجانية تمامًا لكل الناس.",
  en: "Al-Yusr's team and the Takrim van come to you inside Mansoura: we wash and shroud the deceased per the Sunnah and carry them to the mosque and then the cemetery, calmly and with dignity. The service is completely free for everyone.",
};

export const TAKRIM_DEFAULT_IMAGE = takrimVan;

/** Four shares used whenever the program record has no active packages yet. */
export const TAKRIM_DEFAULT_SHARES: TakrimShare[] = [
  { id: "tkr-shroud", nameAr: "كفن شرعي", nameEn: "An Islamic shroud", amount: 500 },
  { id: "tkr-running", nameAr: "مصاريف تشغيل السيارة (وقود وصيانة)", nameEn: "Van running costs (fuel & maintenance)", amount: 1000 },
  { id: "tkr-washer", nameAr: "مصاريف المغسّل والمكفّن", nameEn: "Washer & shrouder costs", amount: 500 },
  { id: "tkr-new-car", nameAr: "مساهمة في شراء سيارة جديدة", nameEn: "Contribution to a new van", amount: 10000 },
];

const defaultShares = (): TakrimShare[] => TAKRIM_DEFAULT_SHARES.map((s) => ({ ...s }));

/**
 * Map a /programs record to the landing page content.
 * Every field falls back independently: hero_h1* → name_* → static default, hero_h3* → description_* →
 * static default, hero_image → image → static default.
 */
export function resolveTakrimContent(record?: ApiRecord): TakrimContent {
  const r = record ?? {};
  const shares = mapShares(r.donation_packages);
  return {
    title: {
      ar: pick(r.hero_h1_ar, r.name_ar) ?? TAKRIM_DEFAULT_TITLE.ar,
      en: pick(r.hero_h1_en, r.name_en) ?? TAKRIM_DEFAULT_TITLE.en,
    },
    desc: {
      ar: pick(r.hero_h3_ar, r.description_ar) ?? TAKRIM_DEFAULT_DESC.ar,
      en: pick(r.hero_h3_en, r.description_en) ?? TAKRIM_DEFAULT_DESC.en,
    },
    image: image(r.hero_image, r.image) ?? TAKRIM_DEFAULT_IMAGE,
    shares: shares.length ? shares : defaultShares(),
  };
}

const DEFAULT_CONTENT: TakrimContent = resolveTakrimContent();

/** The public /programs records, read through the same content-source switch as the programs adapter. */
export function findTakrimRecord(records: ApiRecord[] | undefined): ApiRecord | undefined {
  return records?.find((r) => programSlugOf(r) === "takrim");
}

/** Top section + shares of the Takrim landing page. */
export function useTakrimContentState(): { content: TakrimContent; isLoading: boolean } {
  const { data, isLoading } = useSourced<ApiRecord[], TakrimContent>(
    ["programs"],
    fetchProgramRecords,
    DEFAULT_CONTENT,
    (records) => resolveTakrimContent(findTakrimRecord(records)),
  );
  return { content: data, isLoading };
}

export function useTakrimContent(): TakrimContent {
  return useTakrimContentState().content;
}
