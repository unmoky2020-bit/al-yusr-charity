/**
 * storiesApi.ts
 * Unified Stories API — supports three providers in priority order:
 *   1. "laravel":   reads from Laravel API /stories (primary source)
 *   2. "supabase":  reads/writes Supabase `stories` table (fallback)
 *   3. "static":    static fallback data when both are unavailable
 *
 * If the `stories` table does not exist or returns 404, gracefully falls back
 * to static data. localStorage is used for local overrides & deletes so the
 * admin panel works 100% locally even without Supabase.
 */
import { supabase } from "@/integrations/supabase/client";
import { storiesApi as laravelStoriesApi, type LaravelStory } from "@/data/laravelApi";
import family from "@/assets/family-hope.jpg";
import hands from "@/assets/hands-sprout.jpg";
import edu from "@/assets/program-education.jpg";
import orph from "@/assets/program-orphans.jpg";
import food from "@/assets/program-food.jpg";
import health from "@/assets/program-health.jpg";
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
  program_node_id?: string | null;
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

// ─── localStorage keys ───────────────────────────────────────────────────────
const OVERRIDES_KEY = "alyusr_stories_overrides";
const DELETED_KEY   = "alyusr_stories_deleted";
const SUPABASE_KEY  = "alyusr_stories_supabase_available";

function isSupabaseAvailable(): boolean {
  try { return localStorage.getItem(SUPABASE_KEY) !== "false"; } catch { return true; }
}
function markSupabaseUnavailable() {
  try { localStorage.setItem(SUPABASE_KEY, "false"); } catch {}
}
function getOverrides(): Record<string, Partial<StoryCard>> {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}"); } catch { return {}; }
}
function getDeleted(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || "[]")); } catch { return new Set(); }
}
function saveOverrides(o: Record<string, Partial<StoryCard>>) {
  try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o)); } catch {}
}
function saveDeleted(d: Set<string>) {
  try { localStorage.setItem(DELETED_KEY, JSON.stringify([...d])); } catch {}
}

// ─── Apply overrides + deleted onto static list ──────────────────────────────
function applyLocal(base: StoryCard[]): StoryCard[] {
  const deleted  = getDeleted();
  const overrides = getOverrides();
  const extras = Object.values(overrides).filter((o): o is StoryCard => !!o.id && !base.find((b) => b.id === o.id));
  return [...base, ...extras]
    .filter((s) => !deleted.has(s.slug) && !deleted.has(s.id))
    .map((s) => ({ ...s, ...(overrides[s.slug] || overrides[s.id] || {}) }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Map a LaravelStory to a StoryCard */
function mapLaravelStory(s: LaravelStory): StoryCard {
  return {
    id: String(s.id),
    slug: s.slug,
    title_ar: s.title_ar,
    title_en: s.title_en || s.title_ar,
    role_ar: s.category_ar || "",
    role_en: s.category_en || s.category_ar || "",
    quote_ar: s.description_ar || "",
    quote_en: s.description_en || s.description_ar || "",
    body_ar: s.description_ar,
    body_en: s.description_en || undefined,
    beneficiary_name: s.beneficiary_name || null,
    location_ar: s.location_ar || null,
    location_en: s.location_en || null,
    image_url: s.cover_image_url || s.cover_image || null,
    is_published: s.status === "published",
    is_featured: Boolean(s.is_featured),
    sort_order: Number(s.sort_order ?? 99),
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}

/** List all published stories (featured first) */
export async function listPublishedStories(): Promise<StoryCard[]> {
  // 1. Try Laravel API first (primary source)
  try {
    const laravelData = await laravelStoriesApi.listPublished();
    if (Array.isArray(laravelData) && laravelData.length > 0) {
      return laravelData
        .filter((s: LaravelStory) => s.status === "published")
        .map(mapLaravelStory)
        .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || a.sort_order - b.sort_order);
    }
  } catch {}

  // 2. Try Supabase as fallback
  try {
    const { data, error } = await (supabase.from("stories" as any) as any)
      .select("id,slug,title_ar,title_en,role_ar,role_en,quote_ar,quote_en,image_url,is_featured,location_ar,location_en,sort_order,pillar_slug")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as StoryCard[];
    }
  } catch {}

  // 3. Static fallback
  return applyLocal(STATIC_STORIES).filter((s) => s.is_published);
}


/** List featured stories for Testimonial carousel */
export async function listFeaturedStories(limit = 5): Promise<StoryCard[]> {
  const all = await listPublishedStories();
  const featured = all.filter((s) => s.is_featured);
  return featured.length > 0 ? featured.slice(0, limit) : all.slice(0, limit);
}

/** Get a single story by slug */
export async function getStoryBySlug(slug: string): Promise<StoryCard | null> {
  // 1. Try Laravel API first
  try {
    const allLaravel = await laravelStoriesApi.listPublished();
    if (Array.isArray(allLaravel) && allLaravel.length > 0) {
      const found = allLaravel.find((s: LaravelStory) => s.slug === slug && s.status === "published");
      if (found) return mapLaravelStory(found);
    }
  } catch {}

  // 2. Try Supabase
  try {
    const { data, error } = await (supabase.from("stories" as any) as any)
      .select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
    if (!error && data) {
      return data as StoryCard;
    }
  } catch {}

  // 3. Static fallback
  return applyLocal(STATIC_STORIES).find((s) => s.slug === slug && s.is_published) || null;
}

/** List ALL stories for admin (including drafts) */
export async function listAllStories(): Promise<StoryCard[]> {
  try {
    const lStories = await laravelStoriesApi.listAll();
    if (Array.isArray(lStories) && lStories.length > 0) {
      return lStories.map(mapLaravelStory);
    }
  } catch (err) {
    console.warn("Could not fetch stories from Laravel API:", err);
  }

  try {
    const { data, error } = await (supabase.from("stories" as any) as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as StoryCard[];
    }
  } catch {}
  return applyLocal(STATIC_STORIES);
}

/** Upsert (create or update) a story */
export async function upsertStory(story: Partial<StoryCard> & { slug: string }): Promise<{ error?: string }> {
  try {
    const payload = {
      slug: story.slug,
      title_ar: story.title_ar || "قصة نجاح",
      title_en: story.title_en || story.title_ar || "Success Story",
      description_ar: story.body_ar || story.quote_ar || "تفاصيل القصة",
      description_en: story.body_en || story.quote_en || "Story details",
      beneficiary_name: story.beneficiary_name || "مستفيد",
      category_ar: story.role_ar || "عام",
      category_en: story.role_en || "General",
      status: story.is_published ? "published" : "draft",
      is_featured: Boolean(story.is_featured),
      sort_order: Number(story.sort_order ?? 0),
    };

    if (story.id && !story.id.startsWith("static-")) {
      await laravelStoriesApi.update(story.id, payload as any);
      return {};
    } else {
      const created = await laravelStoriesApi.create(payload as any);
      if (created) return {};
    }
  } catch (err: any) {
    console.warn("Could not upsert story on Laravel API:", err);
  }

  if (isSupabaseAvailable()) {
    const { error } = story.id && !story.id.startsWith("static-")
      ? await (supabase.from("stories" as any) as any).update(story).eq("id", story.id)
      : await (supabase.from("stories" as any) as any).insert(story);

    if (error?.code === "42P01" || (error as any)?.status === 404) {
      markSupabaseUnavailable();
    } else if (error) {
      return { error: error.message };
    } else {
      return {};
    }
  }
  // local override
  const overrides = getOverrides();
  const key = story.id || story.slug;
  overrides[key] = { ...(overrides[key] || {}), ...story };
  saveOverrides(overrides);
  return {};
}

/** Delete a story */
export async function deleteStory(id: string, slug: string): Promise<{ error?: string }> {
  try {
    if (id && !id.startsWith("static-")) {
      await laravelStoriesApi.remove(id);
    }
  } catch (err) {
    console.warn("Could not delete story on Laravel API:", err);
  }

  if (isSupabaseAvailable() && !id.startsWith("static-")) {
    const { error } = await (supabase.from("stories" as any) as any).delete().eq("id", id);
    if (error?.code === "42P01" || (error as any)?.status === 404) {
      markSupabaseUnavailable();
    } else if (error) {
      return { error: error.message };
    } else {
      return {};
    }
  }
  // mark as deleted locally
  const deleted = getDeleted();
  deleted.add(id);
  deleted.add(slug);
  saveDeleted(deleted);
  const overrides = getOverrides();
  delete overrides[id];
  delete overrides[slug];
  saveOverrides(overrides);
  return {};
}

/** Toggle a boolean field (is_published, is_featured, pending_review) */
export async function toggleStoryField(
  id: string,
  slug: string,
  field: "is_published" | "is_featured" | "pending_review",
  value: boolean
): Promise<{ error?: string }> {
  try {
    if (id && !id.startsWith("static-")) {
      const payload: Record<string, unknown> = {};
      if (field === "is_published") payload.status = value ? "published" : "draft";
      if (field === "is_featured") payload.is_featured = value;
      await laravelStoriesApi.update(id, payload as any);
    }
  } catch (err) {
    console.warn("Could not toggle story field on Laravel API:", err);
  }

  if (isSupabaseAvailable() && !id.startsWith("static-")) {
    const { error } = await (supabase.from("stories" as any) as any).update({ [field]: value }).eq("id", id);
    if (error?.code === "42P01" || (error as any)?.status === 404) {
      markSupabaseUnavailable();
    } else if (error) {
      return { error: error.message };
    } else {
      return {};
    }
  }
  const overrides = getOverrides();
  const key = id || slug;
  overrides[key] = { ...(overrides[key] || {}), [field]: value };
  saveOverrides(overrides);
  return {};
}

/** Reset local overrides (used in admin "sync") */
export function resetLocalStories() {
  try {
    localStorage.removeItem(OVERRIDES_KEY);
    localStorage.removeItem(DELETED_KEY);
    localStorage.removeItem(SUPABASE_KEY);
  } catch {}
}
