/**
 * Picture galleries of pages whose content is not edited elsewhere in the dashboard: the field gallery at
 * the end of /farm, /qurbani and the program pages, «من الميدان» on /medical, the photo scroll on /zakat.
 * Dashboard → «معارض صور الصفحات» (/admin/page-galleries).
 *
 * Stored as one unified-content item per gallery (`/content`, type "page", slug `page-gallery-<key>`,
 * JSON `{ "items": PageImage[] }` in `content_ar`), the route the site already reads and writes.
 * No item / an empty list → the page keeps its built-in pictures (the `defaults` below).
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, invalidateApiCache, pagesApi, type LaravelUnifiedContent } from "@/data/laravelApi";
import { img, resolveImages, type ResolvedImage } from "@/data/pageImages";
import { FIELD_CONVOYS } from "@/data/fieldConvoys";
import type { PageImage } from "@/data/campaignPages/types";

export type PageGalleryKey = "farm" | "qurbani" | "programs" | "medical" | "zakat";

export type PageGalleryMeta = {
  titleAr: string;
  /** Where it shows. */
  pages: { path: string; labelAr: string }[];
  hintAr?: string;
  /** Pictures shown while nothing is saved. */
  defaults: PageImage[];
  /** The page shows a short title on each picture. */
  captions?: boolean;
};

const convoy = (tag?: "qurbani"): PageImage[] =>
  FIELD_CONVOYS.filter((i) => !tag || i.tag === tag).map((i) => ({ src: i.src, alt: { ar: i.ar, en: i.en } }));

export const PAGE_GALLERIES: Record<PageGalleryKey, PageGalleryMeta> = {
  farm: {
    titleAr: "معرض الصور في آخر صفحة المزرعة الوقفية",
    pages: [{ path: "/farm", labelAr: "المزرعة الوقفية" }],
    defaults: convoy(),
  },
  qurbani: {
    titleAr: "معرض صور الأضحية",
    pages: [
      { path: "/qurbani", labelAr: "صفحة الأضحية" },
      { path: "/programs/odhya", labelAr: "برنامج الأضاحي" },
    ],
    defaults: convoy("qurbani"),
  },
  programs: {
    titleAr: "معرض صور الميدان في صفحات البرامج",
    pages: [{ path: "/programs/box", labelAr: "كل صفحات البرامج (ما عدا الأضاحي)" }],
    defaults: convoy(),
  },
  medical: {
    titleAr: "معرض «من الميدان» في المشروع الطبي",
    pages: [{ path: "/medical", labelAr: "المشروع الطبي" }],
    defaults: [
      img("program-health.webp", "طبيب من فريق اليسر يطمئن على مريض أثناء صرف العلاج", "An Al-Yusr doctor checking on a patient while medicine is handed out"),
      img("Prosthetics.jpg", "شاب بطرف صناعي من مشروع تحدّي الإعاقة مع الطبيب المعالج", "A young man with a prosthetic limb from the Overcoming Disability programme"),
      img("axis-health.jpg", "تسليم كرتونة أدوية لمريضة كبيرة في السن", "Handing a box of medicines to an elderly patient"),
    ],
  },
  zakat: {
    titleAr: "معرض الصور المتحرك في صفحة الزكاة",
    pages: [{ path: "/zakat", labelAr: "الزكاة" }],
    hintAr: "أول 5 صور بتظهر في المعرض المتحرك والباقي تحته. العنوان القصير بيظهر كاسم المجال (مثلاً: الغذاء).",
    captions: true,
    defaults: [
      img("program-food.jpg", "كرتونة العزومة في بيت أسرة بالدقهلية", "Family Box delivered in Dakahlia", { ar: "الغذاء", en: "Food" }),
      img("program-health.webp", "قافلة طبية مجانية لقرى الدقهلية", "Free medical convoy in Dakahlia villages", { ar: "الصحة", en: "Health" }),
      img("program-orphans.jpg", "كفالة يتيم — ابتسامة من قلب الميدان", "Orphan sponsorship — smiles from the field", { ar: "الأيتام", en: "Orphans" }),
      img("brand-truck.jpg", "شاحنة اليسر بتوزّع الخير من المنصورة", "Al-Yusr truck distributing aid from Mansoura", { ar: "المطبخ", en: "Kitchen" }),
      img("family-hope.webp", "أسرة استلمت تبرعك… ودعت لك", "A family that received your gift — and prayed for you", { ar: "الأثر", en: "Impact" }),
      img("brand-poster-classroom.webp", "ادفع مصروفه — فصل في مدرسة بطلخا", "Pay His Tuition — a class in Talkha", { ar: "التعليم", en: "Education" }),
      img("brand-bags.jpg", "تجهيز شُنط الغذاء قبل التوزيع", "Food bags prepared before distribution", { ar: "الغذاء", en: "Food" }),
      img("brand-girl-orange.jpg", "بنت يتيمة استلمت كفالتها الشهرية", "An orphan girl received her monthly sponsorship", { ar: "الأيتام", en: "Orphans" }),
      img("farm-hero.jpg", "مزرعة الأضاحي — كشف بيطري قبل الذبح", "Sacrifice farm — vet check before slaughter", { ar: "الأضحية", en: "Qurbani" }),
      img("poster-volunteer-field.webp", "متطوعو اليسر في قرى الدقهلية", "Al-Yusr volunteers in Dakahlia villages", { ar: "التطوع", en: "Volunteer" }),
    ],
  },
};

export const PAGE_GALLERY_KEYS = Object.keys(PAGE_GALLERIES) as PageGalleryKey[];

const slugOf = (key: PageGalleryKey) => `page-gallery-${key}`;

async function findItem(key: PageGalleryKey, fresh: boolean): Promise<LaravelUnifiedContent | null> {
  const slug = slugOf(key);
  const res = await apiFetch<unknown>(`/content?type=page&slug=${encodeURIComponent(slug)}`, {
    method: "GET",
    useCache: !fresh,
    ttlMs: fresh ? 0 : 60_000,
    skipAuthClear: true,
  });
  const raw = res as { data?: unknown };
  const list: unknown[] = Array.isArray(res) ? res : Array.isArray(raw?.data) ? raw.data : raw?.data ? [raw.data] : [];
  return (list as LaravelUnifiedContent[]).find((i) => i && i.slug === slug && i.type === "page") || null;
}

/** Valid pictures of a saved JSON (pictures without a link are dropped). Pure, exported for tests. */
export function parseGalleryItems(json: string | null | undefined): PageImage[] {
  try {
    const o = JSON.parse(json || "{}");
    const items: unknown[] = Array.isArray(o?.items) ? o.items : [];
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    return items
      .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
      .map((it) => {
        const alt = (it.alt ?? {}) as Record<string, unknown>;
        const cap = it.caption as Record<string, unknown> | undefined;
        return {
          src: str(it.src).trim(),
          alt: { ar: str(alt.ar), en: str(alt.en) },
          ...(cap && typeof cap === "object" ? { caption: { ar: str(cap.ar), en: str(cap.en) } } : {}),
        };
      })
      .filter((it) => !!it.src);
  } catch {
    return [];
  }
}

export const pageGalleriesApi = {
  /** Saved pictures ([] when none). Never throws. */
  async load(key: PageGalleryKey, opts?: { fresh?: boolean }): Promise<PageImage[]> {
    try {
      return parseGalleryItems((await findItem(key, !!opts?.fresh))?.content_ar);
    } catch {
      return [];
    }
  },

  /** Save the pictures ([] = back to the page's own pictures). Throws on failure. */
  async save(key: PageGalleryKey, items: PageImage[]): Promise<void> {
    const clean = items.filter((it) => it.src.trim());
    const content_ar = JSON.stringify({ items: clean });
    const existing = await findItem(key, true);
    if (existing) {
      await pagesApi.update(existing.id, { content_ar } as Partial<LaravelUnifiedContent>);
    } else {
      await pagesApi.create({
        slug: slugOf(key),
        title_ar: PAGE_GALLERIES[key].titleAr,
        status: "published",
        content_ar,
      } as Parameters<typeof pagesApi.create>[0]);
    }
    invalidateApiCache("/content");
  },
};

const queryKey = (key: PageGalleryKey) => ["page-gallery", key] as const;

/**
 * Pictures chosen in the dashboard for this gallery, ready for <img>; `null` while nothing is saved (or
 * the request failed), so the page keeps its own pictures and layout details.
 */
export function usePageGallery(key: PageGalleryKey | undefined): ResolvedImage[] | null {
  const { data } = useQuery({
    queryKey: queryKey(key ?? "farm"),
    queryFn: () => pageGalleriesApi.load(key!),
    enabled: !!key,
    staleTime: 5 * 60_000,
  });
  if (!key || !data || !data.length) return null;
  const resolved = resolveImages(data);
  return resolved.length ? resolved : null;
}

export function useInvalidatePageGallery() {
  const qc = useQueryClient();
  return (key: PageGalleryKey) => qc.invalidateQueries({ queryKey: queryKey(key) });
}
