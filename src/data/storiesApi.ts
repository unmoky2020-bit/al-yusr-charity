/**
 * storiesApi.ts
 * Stories — Laravel `/stories` is the only source of truth.
 *   - Public pages: read published stories from Laravel; fall back to STATIC_STORIES when the API
 *     has none (unchanged public look).
 *   - Admin: list / get / create / update / delete through Laravel only. Failures are returned as
 *     `{ error }` (or thrown for reads) — there is NO localStorage fallback any more.
 */
import { apiFetch, formatServerImageUrl, invalidateApiCache, type LaravelStory } from "@/data/laravelApi";
import { apiErrorMessage, fetchItem, fetchList, sendJson } from "@/data/api/adminApiHelpers";
import family from "@/assets/family-hope.webp";
import hands from "@/assets/hands-sprout.jpg";
import edu from "@/assets/program-education.jpg";
import orph from "@/assets/program-orphans.jpg";
import food from "@/assets/program-food.jpg";
import health from "@/assets/program-health.webp";
import bride from "@/assets/yusr-bride.png";
import heroChild from "@/assets/hero-child.jpg";

export type StoryCard = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  role_ar: string;
  role_en: string;
  quote_ar: string;
  quote_en: string;
  body_ar?: string;
  body_en?: string;
  beneficiary_name?: string | null;
  location_ar?: string | null;
  location_en?: string | null;
  image_url: string | null;
  /** Program the story belongs to (backend program id) and its public slug/name for the page link. */
  program_id?: string | null;
  program?: { slug: string; name_ar: string; name_en: string } | null;
  pillar_slug?: string | null;
  case_id?: string | null;
  is_published: boolean;
  is_featured: boolean;
  pending_review?: boolean;
  sort_order: number;
  seo?: any;
  created_at?: string;
  updated_at?: string;
};

// ─── Static / Fallback stories ─────────────────────────────────────────────
export const STATIC_STORIES: StoryCard[] = [
  {
    id: "static-1",
    slug: "umm-soad-mansoura",
    title_ar: "أم سعاد — المنصورة",
    title_en: "Umm Soad — Mansoura",
    role_ar: "كرتونة العزومة",
    role_en: "Family Food Box",
    quote_ar: "أول مرة من سنين تكفي العزومة شهر كامل، ربنا يكرمكم زي ما كرمتونا.",
    quote_en: "For the first time in years, the box lasts a full month. May God bless you as you blessed us.",
    body_ar: "أم سعاد أم لأربعة أطفال في المنصورة، كانت تعاني لتأمين الطعام لأسرتها. بعد حصولها على كرتونة العزومة من اليسر، استطاعت توفير الأكل لأكثر من شهر كامل.",
    body_en: "Umm Soad is a mother of four in Mansoura, struggling to provide food for her family. After receiving the food box from Al-Yusr, she managed to feed her family for over a full month.",
    location_ar: "المنصورة",
    location_en: "Mansoura",
    pillar_slug: "food",
    image_url: family,
    is_published: true,
    is_featured: true,
    sort_order: 1,
  },
  {
    id: "static-2",
    slug: "umm-mohamed-bride",
    title_ar: "أم محمد — المنصورة",
    title_en: "Umm Mohamed — Mansoura",
    role_ar: "مستفيدة من جهاز العروسة اليتيمة",
    role_en: "Orphan-bride trousseau program",
    quote_ar: "كنت بحلم بجهاز يستر بناتي.. اليُسر خلّتني عريسة ومعايا بيت كامل. ربنا يجزيكم خير.",
    quote_en: "I dreamt of a simple trousseau. Al-Yusr gave me a full home. May God reward you.",
    body_ar: "أم محمد يتيمة فقدت والدها وهي صغيرة، وكانت تحلم بجهاز يليق بها عند زواجها. قدّمت لها مؤسسة اليسر جهازاً كاملاً أسعدها وأسعد عائلتها.",
    body_en: "Umm Mohamed lost her father as a child and dreamed of a proper trousseau for her wedding. Al-Yusr provided her with a complete set that brought joy to her and her family.",
    location_ar: "المنصورة",
    location_en: "Mansoura",
    image_url: bride,
    is_published: true,
    is_featured: true,
    sort_order: 2,
  },
  {
    id: "static-3",
    slug: "ahmed-mit-ghamr",
    title_ar: "أحمد، 12 سنة — ميت غمر",
    title_en: "Ahmed, 12 — Mit Ghamr",
    role_ar: "تعليم",
    role_en: "Education",
    quote_ar: "كنت هخرج من المدرسة، النهارده الأول على فصلي.",
    quote_en: "I was about to leave school. Today I'm top of my class.",
    body_ar: "أحمد طفل موهوب كان على وشك ترك المدرسة بسبب ضائقة أسرته المالية. تكفّل اليسر بمصاريفه الدراسية، فأصبح الأول على فصله.",
    body_en: "Ahmed was a talented child about to drop out of school due to his family's financial hardship. Al-Yusr covered his education expenses and he became top of his class.",
    location_ar: "ميت غمر",
    location_en: "Mit Ghamr",
    pillar_slug: "education",
    image_url: edu,
    is_published: true,
    is_featured: false,
    sort_order: 3,
  },
  {
    id: "static-4",
    slug: "khaled-belqas",
    title_ar: "خالد، 8 سنين — بلقاس",
    title_en: "Khaled, 8 — Belqas",
    role_ar: "شفاء ودواء",
    role_en: "Healing & Medicine",
    quote_ar: "العملية اتعملت وأنا دلوقتي بلعب كورة مع أصحابي.",
    quote_en: "The surgery was done; today I play football with my friends.",
    body_ar: "خالد طفل عمره 8 سنوات كان يعاني من مشكلة صحية تمنعه من اللعب. أجرى اليسر له عملية جراحية ناجحة وعاد يلعب مع أصدقائه.",
    body_en: "Khaled, 8 years old, suffered from a health condition that prevented him from playing. Al-Yusr arranged a successful surgery and he returned to playing with his friends.",
    location_ar: "بلقاس",
    location_en: "Belqas",
    pillar_slug: "health",
    image_url: health,
    is_published: true,
    is_featured: false,
    sort_order: 4,
  },
  {
    id: "static-5",
    slug: "nour-sinbillawayn",
    title_ar: "نور — السنبلاوين",
    title_en: "Nour — Sinbillawayn",
    role_ar: "كفالة يتيم",
    role_en: "Orphan sponsorship",
    quote_ar: "كل شهر بحس إن في ناس فاكراني، مش لوحدي.",
    quote_en: "Every month I feel someone remembers me — I'm not alone.",
    body_ar: "نور طفلة يتيمة في السنبلاوين تعيش مع والدتها. توفر لها مؤسسة اليسر كفالة شهرية منتظمة تعين الأسرة على متطلبات الحياة والدراسة.",
    body_en: "Nour is an orphan girl in Sinbillawayn living with her mother. Al-Yusr provides her with regular monthly sponsorship that supports her education and family needs.",
    location_ar: "السنبلاوين",
    location_en: "Sinbillawayn",
    image_url: orph,
    is_published: true,
    is_featured: false,
    sort_order: 5,
  },
  {
    id: "static-6",
    slug: "umm-mohamed-dikirnis",
    title_ar: "بيت أم محمد — دكرنس",
    title_en: "Umm Mohamed's home — Dikirnis",
    role_ar: "وصلة مياه",
    role_en: "Water connection",
    quote_ar: "ولادي بقوا يشربوا مياه نضيفة من غير ما يمشوا كيلومترات.",
    quote_en: "My kids now drink clean water without walking kilometers.",
    body_ar: "عائلة أم محمد في دكرنس كانت تعاني من غياب المياه الصالحة للشرب في منزلها. قامت المؤسسة بتوصيل خط مياه نقية إلى المنزل مباشرة.",
    body_en: "Umm Mohamed's family in Dikirnis suffered from a lack of clean drinking water. Al-Yusr installed a direct clean water connection to their home.",
    location_ar: "دكرنس",
    location_en: "Dikirnis",
    image_url: hands,
    is_published: true,
    is_featured: false,
    sort_order: 6,
  },
  {
    id: "static-7",
    slug: "ramadan-family-sherbin",
    title_ar: "عائلة رمضان — شربين",
    title_en: "Ramadan family — Sherbin",
    role_ar: "كيلو لحمة",
    role_en: "Kilo of Meat",
    quote_ar: "ولادي عرفوا طعم اللحمة في غير الأعياد.",
    quote_en: "My kids tasted meat outside of Eid.",
    body_ar: "عائلة مستفيدة في شربين تم توفير السلال الغذائية ولحوم الأضاحي والصدقات لها دورياً من خلال قافلة الخير التابعة لمؤسسة اليسر.",
    body_en: "A beneficiary family in Sherbin received regular food baskets, Qurbani meat, and support through Al-Yusr convoy.",
    location_ar: "شربين",
    location_en: "Sherbin",
    pillar_slug: "food",
    image_url: food,
    is_published: true,
    is_featured: false,
    sort_order: 7,
  },
  {
    id: "static-8",
    slug: "khaled-donor-ramadan",
    title_ar: "خالد، 34 سنة",
    title_en: "Khaled, 34",
    role_ar: "متبرّع شهري — كرتونة رمضان",
    role_en: "Monthly donor — Ramadan box",
    quote_ar: "بدأت أتبرع بـ50 جنيه شهريًا.. اليوم بشوف صور الكرتونة بتوصل بيوت الناس. ده أحلى شعور.",
    quote_en: "I started donating 50 EGP/month. Today I see the boxes reaching real homes. The best feeling.",
    body_ar: "قصة ملهمة لمتبرع بدأ باستقطاع بسيط شهرياً، واستطاع متابعة أثر تبرعه بالصور والتوصيل المباشر للأسر الأكثر احتياجاً.",
    body_en: "An inspiring story of a monthly donor who tracked his impact through transparent photos and direct distribution to needy families.",
    image_url: heroChild,
    is_published: true,
    is_featured: false,
    sort_order: 8,
  },
];


// ─── Laravel mapping ─────────────────────────────────────────────────────────

type LaravelStoryExtended = LaravelStory & {
  quote_ar?: string | null;
  quote_en?: string | null;
  program_id?: number | string | null;
  program?: { slug?: string; name_ar?: string; name_en?: string | null } | null;
  pillar_slug?: string | null;
  case_id?: number | string | null;
  pending_review?: boolean | number | null;
  seo?: Record<string, unknown> | null;
};

/** Map a LaravelStory to a StoryCard */
function mapLaravelStory(raw: LaravelStory): StoryCard {
  const s = raw as LaravelStoryExtended;
  return {
    id: String(s.id),
    slug: s.slug,
    title_ar: s.title_ar,
    title_en: s.title_en || s.title_ar,
    role_ar: s.category_ar || "",
    role_en: s.category_en || s.category_ar || "",
    quote_ar: s.quote_ar || s.description_ar || "",
    quote_en: s.quote_en || s.description_en || s.description_ar || "",
    body_ar: s.description_ar,
    body_en: s.description_en || undefined,
    beneficiary_name: s.beneficiary_name || null,
    location_ar: s.location_ar || null,
    location_en: s.location_en || null,
    image_url: formatServerImageUrl(s.cover_image_url || s.cover_image || "") || null,
    program_id: s.program_id != null ? String(s.program_id) : null,
    program: s.program?.slug ? { slug: s.program.slug, name_ar: s.program.name_ar || "", name_en: s.program.name_en || "" } : null,
    pillar_slug: s.pillar_slug || null,
    case_id: s.case_id != null ? String(s.case_id) : null,
    is_published: s.status === "published",
    is_featured: Boolean(s.is_featured),
    pending_review: Boolean(s.pending_review),
    sort_order: Number(s.sort_order ?? 99),
    seo: s.seo || {},
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}

/**
 * StoryCard → Laravel `/stories` body. Columns that exist today (Postman): slug, title_ar/en,
 * category_ar/en, beneficiary_name, location_ar/en, description_ar/en, cover_image, sort_order,
 * status, is_featured. NEW columns (see backend-handoff/02-replace-supabase-admin.md):
 * quote_ar/en, cover_image_url, program_id (live), pillar_slug, case_id, pending_review, seo.
 */
function toLaravelPayload(story: Partial<StoryCard>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (story.slug !== undefined) p.slug = story.slug;
  if (story.title_ar !== undefined) p.title_ar = story.title_ar;
  if (story.title_en !== undefined) p.title_en = story.title_en || story.title_ar || "";
  if (story.role_ar !== undefined) p.category_ar = story.role_ar;
  if (story.role_en !== undefined) p.category_en = story.role_en;
  if (story.quote_ar !== undefined) p.quote_ar = story.quote_ar;
  if (story.quote_en !== undefined) p.quote_en = story.quote_en;
  if (story.body_ar !== undefined || story.quote_ar !== undefined) p.description_ar = story.body_ar || story.quote_ar || "";
  if (story.body_en !== undefined || story.quote_en !== undefined) p.description_en = story.body_en || story.quote_en || "";
  if (story.beneficiary_name !== undefined) p.beneficiary_name = story.beneficiary_name || "";
  if (story.location_ar !== undefined) p.location_ar = story.location_ar;
  if (story.location_en !== undefined) p.location_en = story.location_en;
  // Plain URL string (uploaded via the gallery/media picker). `cover_image` is reserved for multipart files.
  if (story.image_url !== undefined) p.cover_image_url = story.image_url && !story.image_url.startsWith("blob:") ? story.image_url : null;
  if (story.program_id !== undefined) p.program_id = story.program_id ? Number(story.program_id) : null;
  if (story.pillar_slug !== undefined) p.pillar_slug = story.pillar_slug || null;
  if (story.case_id !== undefined) p.case_id = story.case_id || null;
  if (story.is_published !== undefined) p.status = story.is_published ? "published" : "draft";
  if (story.is_featured !== undefined) p.is_featured = Boolean(story.is_featured);
  if (story.pending_review !== undefined) p.pending_review = Boolean(story.pending_review);
  if (story.sort_order !== undefined) p.sort_order = Number(story.sort_order ?? 0);
  if (story.seo !== undefined) p.seo = story.seo || {};
  return p;
}

const isStaticId = (id?: string | null) => !id || id.startsWith("static-");

// ─── Public API (public pages keep the static fallback) ──────────────────────

const byFeatured = (a: StoryCard, b: StoryCard) =>
  (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || a.sort_order - b.sort_order || String(b.created_at || "").localeCompare(String(a.created_at || ""));

/**
 * Published stories (featured first). Only real stories from the dashboard: the sample stories are used
 * ONLY when the API is unreachable — an empty list stays empty (the sections hide themselves).
 */
export async function listPublishedStories(): Promise<StoryCard[]> {
  try {
    const rows = await fetchList<LaravelStory>("/stories", { status: "published", per_page: 100 });
    return rows.filter((s) => !s.status || s.status === "published").map(mapLaravelStory).sort(byFeatured);
  } catch {
    return [...STATIC_STORIES].filter((s) => s.is_published).sort((a, b) => a.sort_order - b.sort_order);
  }
}

/** Stories for the home carousel: the featured ones, else the latest. */
export async function listFeaturedStories(limit = 5): Promise<StoryCard[]> {
  const all = await listPublishedStories();
  const featured = all.filter((s) => s.is_featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

/** One published story by slug (GET /stories/{slug}, else from the list). */
export async function getStoryBySlug(slug: string): Promise<StoryCard | null> {
  try {
    const res = await apiFetch<{ data?: LaravelStory } | LaravelStory>(`/stories/${encodeURIComponent(slug)}`, { method: "GET" });
    const row = ((res as { data?: LaravelStory })?.data ?? res) as LaravelStory | null;
    if (row?.slug === slug && (!row.status || row.status === "published")) return mapLaravelStory(row);
  } catch {
    /* fall through to the list */
  }
  const all = await listPublishedStories();
  return all.find((s) => s.slug === slug) || null;
}

// ─── Admin API (Laravel only — failures are reported, never faked) ────────────

/** List ALL stories for admin (including drafts). Throws on failure; [] when the DB has none. */
export async function listAllStories(): Promise<StoryCard[]> {
  // No status filter = every status (the API treats "status" as an exact value; "all" matched nothing).
  const rows = await fetchList<LaravelStory>("/stories", { per_page: 100 });
  return rows.map(mapLaravelStory).sort((a, b) => a.sort_order - b.sort_order);
}

/** GET /stories/{id} for the admin editor. Throws on failure. */
export async function getStoryById(id: string): Promise<StoryCard> {
  return mapLaravelStory(await fetchItem<LaravelStory>(`/stories/${id}`));
}

/** Upsert (create or update) a story. Returns the saved story, or `error` with the server message. */
export async function upsertStory(
  story: Partial<StoryCard> & { slug: string },
): Promise<{ error?: string; story?: StoryCard }> {
  try {
    const payload = toLaravelPayload({
      title_en: story.title_en || story.title_ar,
      beneficiary_name: story.beneficiary_name || "",
      role_ar: story.role_ar || "عام",
      role_en: story.role_en || "General",
      ...story,
    });
    const saved = !isStaticId(story.id)
      ? await sendJson<LaravelStory>(`/stories/${story.id}`, "PUT", payload)
      : await sendJson<LaravelStory>("/stories", "POST", payload);
    invalidateApiCache("/stories");
    return { story: saved && (saved as LaravelStory).id !== undefined ? mapLaravelStory(saved) : undefined };
  } catch (err) {
    return { error: apiErrorMessage(err, "فشل حفظ القصة") };
  }
}

/** Delete a story (DELETE /stories/{id}). */
export async function deleteStory(id: string, _slug?: string): Promise<{ error?: string }> {
  if (isStaticId(id)) return { error: "هذه قصة افتراضية غير محفوظة في قاعدة البيانات" };
  try {
    await sendJson(`/stories/${id}`, "DELETE");
    invalidateApiCache("/stories");
    return {};
  } catch (err) {
    return { error: apiErrorMessage(err, "فشل حذف القصة") };
  }
}

/** Toggle a boolean field (is_published, is_featured, pending_review) via PUT /stories/{id}. */
export async function toggleStoryField(
  id: string,
  _slug: string,
  field: "is_published" | "is_featured" | "pending_review",
  value: boolean
): Promise<{ error?: string }> {
  if (isStaticId(id)) return { error: "احفظ القصة في قاعدة البيانات أولًا (زر المزامنة)" };
  try {
    await sendJson(`/stories/${id}`, "PUT", toLaravelPayload({ [field]: value }));
    invalidateApiCache("/stories");
    return {};
  } catch (err) {
    return { error: apiErrorMessage(err, "فشل التحديث") };
  }
}
