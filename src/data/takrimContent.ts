/**
 * Takrim landing-page content.
 *
 * The top section (title, description, image) and the donation shares are edited in the dashboard on the
 * backend project "takrim" (`/projects`, or a program "takrim" if one is added). This module maps that record to the page's shape and
 * keeps bilingual static fallbacks so the page renders the same when the API is unreachable or the
 * content source is "static".
 */
import takrimVan from "@/assets/takrim-van.jpg";
import { fetchProgramRecords, programSlugOf } from "@/data/sources/programs";
import { type ApiRecord, fetchPublicList, image, normalizeSlug, num, pick, useSourced } from "@/data/sources/_shared";

export type TakrimText = { ar: string; en: string };

export type TakrimShare = {
  /** Stable public id: the backend package key, or `pkg-<id>`, or the static share id. */
  id: string;
  /** Backend donation_packages[].id, sent to the donate page as `package`. */
  apiId?: number;
  nameAr: string;
  nameEn: string;
  amount: number;
};

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

/** Active packages in dashboard order; inactive / id-less rows are dropped. */
function mapShares(raw: unknown): TakrimShare[] {
  if (!Array.isArray(raw)) return [];
  return (raw as ApiRecord[])
    .filter((p) => p && typeof p === "object" && p.is_active !== false && p.is_active !== 0)
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0))
    .map((p) => {
      const apiId = num(p.id);
      const id = pick(p.key) ?? (apiId !== undefined ? `pkg-${apiId}` : "");
      const share: TakrimShare = {
        id,
        nameAr: pick(p.name_ar, p.name) ?? "",
        nameEn: pick(p.name_en, p.name_ar, p.name) ?? "",
        amount: num(p.amount) ?? 0,
      };
      if (apiId !== undefined) share.apiId = apiId;
      return share;
    })
    .filter((s) => !!s.id);
}

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

/** The program record "takrim", if the dashboard ever gets one (it takes precedence over the project). */
export function findTakrimRecord(records: ApiRecord[] | undefined): ApiRecord | undefined {
  return records?.find((r) => programSlugOf(r) === "takrim");
}

/** The backend project "takrim" (المشاريع → سيارات تكريم الإنسان): the live source of the donation shares. */
export function findTakrimProject(records: ApiRecord[] | undefined): ApiRecord | undefined {
  return records?.find((r) => normalizeSlug(r.slug) === "takrim");
}

type TakrimRecords = { programs: ApiRecord[]; projects: ApiRecord[] };

async function fetchTakrimRecords(): Promise<TakrimRecords> {
  const settle = (p: Promise<ApiRecord[]>) => p.catch((): ApiRecord[] => []);
  const [programs, projects] = await Promise.all([
    settle(fetchProgramRecords()),
    settle(fetchPublicList("/projects", { per_page: 100 })),
  ]);
  return { programs, projects };
}

/**
 * Pick the record that drives the page: the "takrim" program when one exists, otherwise the "takrim"
 * project. The project's name/description are not page copy, so only its packages and cover image
 * (= the hero image, dashboard → المشاريع → الصورة) are used; the title and description keep their defaults.
 */
export function resolveTakrimFromRecords(raw: TakrimRecords): TakrimContent {
  const program = findTakrimRecord(raw.programs);
  if (program) return resolveTakrimContent(program);
  const project = findTakrimProject(raw.projects);
  return resolveTakrimContent(project ? { donation_packages: project.donation_packages, image: project.cover_image } : undefined);
}

/** Top section + shares of the Takrim landing page (static defaults in "static" mode / on error). */
export function useTakrimContent(): TakrimContent {
  const { data } = useSourced<TakrimRecords, TakrimContent>(
    ["takrim-records"],
    fetchTakrimRecords,
    DEFAULT_CONTENT,
    resolveTakrimFromRecords,
  );
  return data;
}
