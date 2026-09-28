/**
 * Blog taxonomy — categories (axes) and authors.
 * Auto-derives axis from each post's existing category, so existing data
 * doesn't need to change. Provides clean URL slugs and SEO metadata for
 * archive pages: /blog/category/:slug and /blog/author/:slug.
 */
import type { BlogPost } from "./blog";

export type AxisSlug =
  | "odhya"
  | "zakat"
  | "ramadan"
  | "orphans"
  | "health"
  | "food"
  | "education"
  | "shelter"
  | "marriage"
  | "water"
  | "transparency"
  | "guides"
  | "stories";

export type Axis = {
  slug: AxisSlug;
  ar: { name: string; description: string; keyword: string };
  en: { name: string; description: string; keyword: string };
};

export const axes: Axis[] = [
  { slug: "odhya",        ar: { name: "صك الأضحية", description: "كل ما يخص صك الأضحية في المنصورة والدقهلية: السعر، التوثيق، التوزيع.", keyword: "صك الأضحية" }, en: { name: "Sacrifice", description: "Everything about the sacrifice voucher in Mansoura & Dakahlia.", keyword: "Sacrifice voucher" } },
  { slug: "zakat",        ar: { name: "زكاة المال والفطر", description: "أدلة شرعية وعملية لحساب زكاة المال وزكاة الفطر 2026.", keyword: "زكاة المال" }, en: { name: "Zakat", description: "Practical Shariah guides for Zakat and Fitr 2026.", keyword: "Zakat" } },
  { slug: "ramadan",      ar: { name: "رمضان وإفطار صائم", description: "كرتونة رمضان، إفطار الصائمين، ومشاريع شهر الخير.", keyword: "كرتونة رمضان" }, en: { name: "Ramadan & Iftar", description: "Ramadan boxes, iftar meals, and the month's projects.", keyword: "Ramadan box" } },
  { slug: "orphans",      ar: { name: "كفالة يتيم", description: "كفالة الأيتام في الدقهلية بمبلغ شهري ثابت.", keyword: "كفالة يتيم" }, en: { name: "Orphan Sponsorship", description: "Sponsoring orphans in Dakahlia.", keyword: "Orphan sponsorship" } },
  { slug: "health",       ar: { name: "صحة وعلاج", description: "علاج، أدوية، قوافل طبية، وأطراف صناعية لذوي الهمم.", keyword: "علاج وأدوية" }, en: { name: "Health", description: "Treatment, medication, medical convoys, and prosthetics.", keyword: "Treatment" } },
  { slug: "food",         ar: { name: "غذاء ومطبخ", description: "كرتونة العزومة، مطبخ اليسر، 1500 وجبة يوميًا.", keyword: "كرتونة العزومة" }, en: { name: "Food & Kitchen", description: "Family Box and Al-Yusr Kitchen — 1,500 daily meals.", keyword: "Family box" } },
  { slug: "education",    ar: { name: "تعليم ووقفية", description: "ادفع مصروفه، 354 طالب، ووقفية التعليم المستدامة.", keyword: "كفالة تعليمية" }, en: { name: "Education & Endowment", description: "Pay His Tuition + sustainable education endowment.", keyword: "Education endowment" } },
  { slug: "shelter",      ar: { name: "ستر وتسقيف", description: "ترميم وتسقيف بيوت الأشد فقرًا في قرى الدقهلية.", keyword: "ستر وتسقيف" }, en: { name: "Shelter", description: "Repair and roofing for the poorest Dakahlia homes.", keyword: "Shelter" } },
  { slug: "marriage",     ar: { name: "تيسير زواج", description: "جواز عروسة بكرامة للأيتام والمتعففين.", keyword: "تيسير زواج" }, en: { name: "Marriage Aid", description: "Dignified bridal trousseau for orphans.", keyword: "Marriage aid" } },
  { slug: "water",        ar: { name: "سقيا الماء", description: "وصلات مياه نظيفة لقرى الدقهلية المحرومة.", keyword: "وصلة مياه" }, en: { name: "Water", description: "Clean water connections for underserved villages.", keyword: "Water connection" } },
  { slug: "transparency", ar: { name: "شفافية ومقارنات", description: "تقارير الشفافية، الأرقام السنوية، ومقارنات مع المؤسسات.", keyword: "شفافية الجمعيات" }, en: { name: "Transparency", description: "Annual transparency reports and NGO comparisons.", keyword: "NGO transparency" } },
  { slug: "guides",       ar: { name: "أدلة ومؤشرات", description: "أدلة عملية للتبرع، اختيار الجمعية، وطرق الدفع الآمنة.", keyword: "دليل التبرع" }, en: { name: "Guides", description: "Practical donation, NGO selection, and secure payment guides.", keyword: "Donation guide" } },
  { slug: "stories",      ar: { name: "قصص نجاح", description: "قصص حقيقية من قرى الدقهلية بعد تبرعك.", keyword: "قصص نجاح" }, en: { name: "Success Stories", description: "Real stories from Dakahlia villages after your donation.", keyword: "Success stories" } },
];

const axisBySlug = (slug: AxisSlug) => axes.find((a) => a.slug === slug)!;
export const getAxis = axisBySlug;

/**
 * Maps a post's existing Arabic category string to one of our taxonomy axes.
 * Keeps existing data intact and lets us evolve taxonomy independently.
 */
export function axisOfPost(post: BlogPost): AxisSlug {
  const c = post.category.ar;
  if (c.includes("أضحية"))                                  return "odhya";
  if (c.includes("زكاة الفطر"))                             return "ramadan";
  if (c.includes("زكاة"))                                   return "zakat";
  if (c.includes("رمضان") || c.includes("إفطار"))           return "ramadan";
  if (c.includes("كفالة يتيم"))                             return "orphans";
  if (c.includes("صحة") || c.includes("قوافل") || c.includes("علاج") || c.includes("أطراف")) return "health";
  if (c.includes("مطبخ") || c.includes("غذاء") || c.includes("كرتونة"))                       return "food";
  if (c.includes("تعليم") || c.includes("وقفية"))           return "education";
  if (c.includes("ستر") || c.includes("تسقيف"))             return "shelter";
  if (c.includes("زواج"))                                   return "marriage";
  if (c.includes("سقيا") || c.includes("ماء"))              return "water";
  if (c.includes("شفافية") || c.includes("مقارنة"))         return "transparency";
  if (c.includes("قصص"))                                    return "stories";
  if (c.includes("دليل") || c.includes("أدوات"))            return "guides";
  return "guides";
}

export type Author = {
  slug: string;
  ar: { name: string; role: string; bio: string };
  en: { name: string; role: string; bio: string };
  avatar?: string;
  twitter?: string;
  linkedin?: string;
};

export const authors: Author[] = [
  {
    slug: "alyusr-team",
    ar: { name: "فريق تحرير اليسر", role: "فريق المحتوى الميداني", bio: "فريق متخصص من اليسر بيوثق رحلة كل تبرع من المنصورة لقرى الدقهلية، بصور وفيديوهات وقصص حقيقية من الميدان." },
    en: { name: "Al-Yusr Editorial Team", role: "Field Content Team", bio: "A specialized Al-Yusr team documenting every donation's journey from Mansoura to Dakahlia villages with real photos, videos, and stories." },
  },
  {
    slug: "shariah-desk",
    ar: { name: "مكتب الاستشارات الشرعية", role: "إفتاء وتأصيل شرعي", bio: "مكتب مراجعة شرعية في اليسر بيغطي مقالات الزكاة والأضحية والوقف، بإشراف علماء معتمدين." },
    en: { name: "Shariah Desk", role: "Fatwa & Sharia Review", bio: "Al-Yusr's Shariah review desk covering Zakat, Sacrifice, and Endowment articles under certified scholars." },
  },
];

export const getAuthor = (slug: string) => authors.find((a) => a.slug === slug);

/** Default author for posts that don't yet declare one. */
export function authorOfPost(post: BlogPost): Author {
  const axis = axisOfPost(post);
  if (axis === "zakat" || axis === "odhya" || axis === "ramadan") return authors[1];
  return authors[0];
}

/** Reading time in minutes (Arabic ~ 200 wpm). */
export function readingTime(post: BlogPost, lang: "ar" | "en" = "ar") {
  const text = post[lang].body.join(" ");
  const words = text.trim().split(/\s+/).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}