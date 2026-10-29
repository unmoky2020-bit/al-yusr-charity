/**
 * export-seed-data.ts
 *
 * Exports every piece of static content that lives in the frontend code into JSON seed files
 * (one file per backend table) using the Laravel backend's real column names.
 * Output: backend-handoff/seeders/data/*.json  (consumed by backend-handoff/seeders/laravel/*.php)
 *
 * Run (re-runnable, overwrites the output folder):
 *   npx vite-node scripts/export-seed-data.ts
 *
 * vite-node resolves the `@/` alias and Vite asset imports through vite.config.ts. Asset imports resolve to
 * "/src/assets/<file>" in Node; they are normalised to "src/assets/<file>" so the developer knows which file to upload.
 *
 * Conventions in the output:
 *   - Columns that exist on the live API (backend-handoff/_live_api_field_shapes.md) are top-level keys.
 *   - Static fields with no backend column go under `extra` (and are listed as "new column needed" in 03-seeders.md).
 *   - Children reference parents by slug (`program_slug`, `donation_campaign_slug`, `project_slug`, `faq_category_slug`);
 *     the PHP seeders resolve them to ids.
 *   - Image fields hold a repo-relative FILE PATH (e.g. "src/assets/poster-meat.png"), never a URL.
 */
import fs from "node:fs";
import path from "node:path";

import { programs } from "@/data/programs";
import { DONATION_ENTITIES, type DonationEntity } from "@/data/donationEntities";
import { SERVICE_PAGES } from "@/data/servicePagesConfig";
import { DONATE_SECTORS, SERVICES_AXES_AR, RESOURCES_AR } from "@/data/servicesMap";
import { SEASONS } from "@/data/seasons";
import { DEFAULT_CAMPAIGNS_SETTINGS } from "@/data/campaignsSettings";
import { CAMPAIGN_PAGES } from "@/data/campaignPages";
import type { CampaignPageContent, L } from "@/data/campaignPages/types";
import setr from "@/data/campaignPages/setr";
import dhill from "@/data/campaignPages/dhill";
import athar from "@/data/campaignPages/athar";
import ramadan from "@/data/campaignPages/ramadan";
import markoun from "@/data/campaignPages/markoun";
import arboun from "@/data/campaignPages/arboun";
import food from "@/data/campaignPages/food";
import { OFFICIAL_CAMPAIGN_SEO_PRESETS } from "@/data/campaignSeoStore";
import { blogPosts } from "@/data/blog";
import { axes as blogAxes, authors as blogAuthors, axisOfPost, authorOfPost, readingTime } from "@/data/blogTaxonomy";
import { GALLERY_STATIC_IMAGES } from "@/data/galleryImages";
import { FAQ_AR as QURBANI_FAQ_AR, FAQ_EN as QURBANI_FAQ_EN } from "@/data/qurbaniFaq";
import { FAQ_PAGE_CATEGORIES, DEFAULT_STATIC_FAQS } from "@/data/faqsApi";
import { GEO_GOVERNORATES } from "@/data/geoPages";
import { DAKAHLIA_CITIES, DISTRICTS_BY_CITY } from "@/data/dakahliaCities";
import { STATIC_STORIES } from "@/data/storiesApi";

const OUT_DIR = path.resolve(process.cwd(), "backend-handoff/seeders/data");

// ─── helpers ────────────────────────────────────────────────────────────────

const imageUses = new Map<string, Set<string>>();

/** Vite asset import -> repo-relative file path. Records which table uses it (for the upload list). */
function img(value: unknown, table: string): string | null {
  if (typeof value !== "string" || !value) return null;
  let v = value.split("?")[0];
  if (v.startsWith("data:")) return null;
  if (v.startsWith("/src/")) v = v.slice(1);
  else if (v.startsWith("/@fs/")) v = path.relative(process.cwd(), v.slice(4)).replace(/\\/g, "/");
  else if (v.startsWith("/") && !v.startsWith("//")) v = `public${v}`;
  if (!imageUses.has(v)) imageUses.set(v, new Set());
  imageUses.get(v)!.add(table);
  return v;
}

/** Lucide icon component -> its name (e.g. "Snowflake"). */
function iconName(icon: unknown): string | null {
  if (!icon) return null;
  if (typeof icon === "string") return icon;
  const c = icon as { displayName?: string; name?: string; render?: { displayName?: string } };
  return c.displayName || c.render?.displayName || c.name || null;
}

const paras = (arr?: string[]) => (arr && arr.length ? arr.join("\n\n") : null);
const nonEmpty = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)));
const money = (n: number | null | undefined) => (typeof n === "number" ? n.toFixed(2) : null);
const strip = (L?: L) => (L ? { ar: L.ar, en: L.en } : undefined);

function write(name: string, rows: unknown) {
  fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(rows, null, 2) + "\n", "utf8");
  const n = Array.isArray(rows) ? rows.length : 1;
  counts[name] = n;
}
const counts: Record<string, number> = {};

// ─── slug maps (frontend -> backend) ────────────────────────────────────────

/** Campaign landing slug (frontend) -> backend donation_campaigns.slug (live API, 2026-10). */
const CAMPAIGN_BACKEND_SLUG: Record<string, string> = {
  setr: "sitr",
  dhill: "zell",
  athar: "athar",
  ramadan: "ramadan",
  markoun: "markoon",
  arboun: "arboun-kheir",
  food: "food",
};

/** Program slug (frontend) -> backend programs.slug where they differ. */
const PROGRAM_BACKEND_SLUG: Record<string, string> = {
  general: "general-donation",
};

/**
 * How each DONATION_ENTITIES id maps to a backend record.
 * entityType in the frontend is kept in `entity_type`; `target_table` is where the record lives in the DB.
 */
const ENTITY_TARGET: Record<string, { table: "programs" | "projects" | "donation_campaigns"; slug: string; note?: string }> = {
  general: { table: "programs", slug: "general-donation" },
  inqadh: { table: "programs", slug: "inqadh", note: "غير موجود في الباك حالياً" },
  orphans: { table: "programs", slug: "orphans" },
  "monthly-sponsorship": { table: "programs", slug: "monthly-sponsorship", note: "غير موجود في الباك حالياً" },
  mosques: { table: "programs", slug: "mosques", note: "غير موجود في الباك حالياً؛ له أيضاً صفحة خدمة /services/mosques" },
  water: { table: "programs", slug: "water" },
  "monthly-meat": { table: "programs", slug: "monthly-meat", note: "غير موجود في الباك حالياً" },
  quran: { table: "programs", slug: "quran", note: "غير موجود في الباك حالياً" },
  takrim: { table: "programs", slug: "takrim", note: "غير موجود في الباك حالياً" },
  waqf: { table: "projects", slug: "waqf", note: "غير موجود في الباك حالياً" },
  medical: { table: "projects", slug: "medical", note: "غير موجود في الباك حالياً" },
  markoun: { table: "donation_campaigns", slug: "markoon" },
  dhill: { table: "donation_campaigns", slug: "zell" },
  shelter: { table: "donation_campaigns", slug: "sitr", note: "entity id = shelter، صفحة الهبوط = /setr" },
  athar: { table: "donation_campaigns", slug: "athar" },
  ramadan: { table: "donation_campaigns", slug: "ramadan" },
  odhya: { table: "programs", slug: "odhya", note: "entityType=campaign في الفرونت لكنه program (id 35) في الباك" },
};

// ─── programs ───────────────────────────────────────────────────────────────

const META_SUFFIX_AR = "مؤسسة اليسر الخيرية | المنصورة - الدقهلية";
const META_SUFFIX_EN = "Al-Yusr Charity | Mansoura - Dakahlia";
const entityById = new Map(DONATION_ENTITIES.map((e) => [e.id, e]));

function entityExtra(e: DonationEntity | undefined) {
  if (!e) return {};
  return nonEmpty({
    donation_entity_id: e.id,
    entity_type: e.entityType,
    donation_type: e.donationType,
    category_ar: e.categoryAr,
    category_en: e.categoryEn,
    color: e.color,
    is_seasonal: e.isSeasonal,
    is_markoun: e.isMarkoun,
    entity_image: img(e.image, "programs"),
  });
}

function topSection(name: { ar: string; en: string }, sub: { ar: string; en: string }, desc: { ar: string; en: string }, min: number) {
  return {
    badge_ar: "برنامج معتمد",
    title_ar: name.ar,
    title_en: name.en,
    subtitle_ar: sub.ar,
    subtitle_en: sub.en,
    description_ar: desc.ar,
    description_en: desc.en,
    image: null,
    primary_button_ar: "تبرع لهذا البرنامج",
    whatsapp_button_ar: "WhatsApp",
    minimum_amount: money(min),
    currency_ar: "ج",
    donation_available: true,
  };
}

const programRows: Record<string, unknown>[] = [];
const programSlugsDone = new Set<string>();

programs.forEach((p, i) => {
  const slug = PROGRAM_BACKEND_SLUG[p.slug] ?? p.slug;
  const e = ENTITY_TARGET[p.slug]?.table === "programs" ? entityById.get(p.slug) : undefined;
  programSlugsDone.add(slug);
  programRows.push({
    slug,
    name_ar: p.ar.name,
    name_en: p.en.name,
    title_ar: p.ar.name,
    title_en: p.en.name,
    tagline_ar: p.ar.tagline,
    tagline_en: p.en.tagline,
    description_ar: p.ar.desc,
    description_en: p.en.desc,
    content_ar: paras(p.ar.longContent),
    content_en: paras(p.en.longContent),
    benefits_ar: p.ar.benefits,
    benefits_en: p.en.benefits,
    period_ar: p.season?.ar ?? null,
    period_en: p.season?.en ?? null,
    image: img(p.image, "programs"),
    minimum_amount: money(p.priceFrom),
    donation_available: true,
    top_section: topSection(
      { ar: p.ar.name, en: p.en.name },
      { ar: p.ar.tagline, en: p.en.tagline },
      { ar: p.ar.desc, en: p.en.desc },
      p.priceFrom,
    ),
    meta_title_ar: `${p.ar.name} — ${META_SUFFIX_AR}`,
    meta_title_en: `${p.en.name} — ${META_SUFFIX_EN}`,
    meta_description_ar: p.ar.desc,
    meta_description_en: p.en.desc,
    status: "published",
    is_active: true,
    sort_order: i + 1,
    extra: nonEmpty({
      source: "src/data/programs.ts",
      aliases: p.slug !== slug ? [p.slug] : undefined,
      gallery: (p.gallery ?? []).map((g) => img(g, "programs")),
      ...entityExtra(e),
    }),
  });
});

// programs that only exist in DONATION_ENTITIES (donation form)
DONATION_ENTITIES.forEach((e) => {
  const t = ENTITY_TARGET[e.id];
  if (!t || t.table !== "programs" || programSlugsDone.has(t.slug)) return;
  programSlugsDone.add(t.slug);
  programRows.push({
    slug: t.slug,
    name_ar: e.ar,
    name_en: e.en,
    title_ar: e.ar,
    title_en: e.en,
    tagline_ar: e.taglineAr,
    tagline_en: e.taglineEn,
    description_ar: e.taglineAr,
    description_en: e.taglineEn,
    image: img(e.image, "programs"),
    minimum_amount: money(e.priceFrom),
    donation_available: true,
    top_section: topSection({ ar: e.ar, en: e.en }, { ar: e.taglineAr, en: e.taglineEn }, { ar: e.taglineAr, en: e.taglineEn }, e.priceFrom),
    meta_title_ar: `${e.ar} — ${META_SUFFIX_AR}`,
    meta_title_en: `${e.en} — ${META_SUFFIX_EN}`,
    meta_description_ar: e.taglineAr,
    meta_description_en: e.taglineEn,
    status: "published",
    is_active: true,
    sort_order: programRows.length + 1,
    extra: nonEmpty({ source: "src/data/donationEntities.ts", aliases: e.id !== t.slug ? [e.id] : undefined, ...entityExtra(e) }),
  });
});

// ─── program page sections (ProgramDetail.tsx layout, per program) ──────────

const STEPS = [
  { icon: "hand-heart", ar: ["اختيار الحالة", "بحث ميداني للأسر الأكثر استحقاقاً في الدقهلية ومحافظات مصر."], en: ["Case selection", "Field research to identify the most deserving families in Dakahlia and across Egypt."] },
  { icon: "shield-check", ar: ["التحقق والاعتماد", "مراجعة شرعية ومحاسبية لكل عملية لضمان الشفافية الكاملة."], en: ["Verification", "Shariah and accounting review of every operation for full transparency."] },
  { icon: "truck", ar: ["التنفيذ والتسليم", "تسليم بكرامة لباب البيت بواسطة فريق متطوعينا المعتمدين."], en: ["Delivery", "Dignified doorstep delivery by our certified volunteer team."] },
  { icon: "camera", ar: ["التوثيق", "تقرير مصوّر وفيديوهات تصلك بعد التنفيذ مباشرة."], en: ["Documentation", "Photo and video reports sent to you right after execution."] },
];
const IMPACT = [
  { icon: "hand-heart", ar: ["تبرعك", "اختر مبلغ ودفع آمن عبر فيزا أو محفظة أو إنستا باي."], en: ["Your donation", "Pick an amount, pay securely via card, wallet or InstaPay."] },
  { icon: "search", ar: ["بحث ميداني", "زيارة بيت الأسرة وتحقق من الاستحقاق."], en: ["Field assessment", "Home visit and eligibility verification."] },
  { icon: "package-check", ar: ["تجهيز وتنفيذ", "تجهيز الاحتياج بجودة سوبر ماركت."], en: ["Prepare & execute", "Prepared at supermarket-grade quality."] },
  { icon: "clipboard-check", ar: ["تسليم وتقرير", "تسليم لباب البيت + تقرير مصوّر وإيصال."], en: ["Deliver & report", "Doorstep delivery + photo report and e-receipt."] },
];
const PROGRAM_FAQ = {
  ar: [
    ["هل تبرعي يصل فعلاً للمستحقين؟", "نعم — كل تبرع موثّق بالصور والفيديو، ومراجع من فريقنا المحاسبي المستقل."],
    ["هل أحصل على إيصال رسمي؟", "بمجرد إتمام الدفع يصلك إيصال إلكتروني فوري على بريدك ورقم تتبع للحالة."],
    ["هل يمكنني تخصيص محافظة معينة؟", "نعم، يمكنك تخصيص تبرعك لمحافظة الدقهلية أو أي محافظة أخرى نعمل بها."],
    ["ما طرق الدفع المتاحة؟", "فيزا/ماستر كارد، Vodafone Cash، InstaPay، وتحويل بنكي على CIB."],
  ],
  en: [
    ["Does my donation really reach the beneficiaries?", "Yes — every donation is documented with photos and videos, and reviewed by our independent accounting team."],
    ["Will I receive an official receipt?", "An electronic receipt and a tracking reference are emailed to you instantly after payment."],
    ["Can I designate a specific governorate?", "Yes, you can designate your donation to Dakahlia or any governorate we operate in."],
    ["What payment methods are supported?", "Visa/Mastercard, Vodafone Cash, InstaPay, and bank transfer to CIB."],
  ],
};
const TOC = [
  ["benefits", "المزايا", "Benefits", "#benefits"],
  ["how_it_works", "كيف يعمل البرنامج", "How It Works", "#how-it-works"],
  ["details", "التفاصيل", "Details", "#details"],
  ["impact", "الأثر", "Impact", "#impact"],
  ["testimonials", "آراء المتبرعين", "Testimonials", "#testimonials"],
  ["faq", "أسئلة شائعة", "FAQ", "#faq"],
  ["related", "برامج مشابهة", "Related Programs", "#related"],
];
const steps = (list: typeof STEPS, lang: "ar" | "en") =>
  list.map((s, i) => ({ title: s[lang][0], description: s[lang][1], icon: s.icon, step: i + 1 }));

const pageSectionRows: Record<string, unknown>[] = [];
programs.forEach((p) => {
  const program_slug = PROGRAM_BACKEND_SLUG[p.slug] ?? p.slug;
  const sec = (section_key: string, sort_order: number, o: Record<string, unknown>) =>
    pageSectionRows.push({
      program_slug,
      section_key,
      title_ar: null, title_en: null, subtitle_ar: null, subtitle_en: null, content_ar: [], content_en: [], settings: [],
      ...o,
      is_enabled: true,
      sort_order,
    });
  sec("top_section", 0, {
    title_ar: "روابط الأقسام", title_en: "Section Navigation",
    settings: { top_section: TOC.map(([key, ar, en, url], i) => ({ key, title_ar: ar, title_en: en, url, is_enabled: true, sort_order: i + 1 })) },
  });
  sec("benefits", 1, {
    title_ar: "مزايا البرنامج", title_en: "Program Benefits", subtitle_ar: "ليه البرنامج ده", subtitle_en: "Why this program",
    content_ar: p.ar.benefits.map((text) => ({ text, icon: "check-circle" })),
    content_en: p.en.benefits.map((text) => ({ text, icon: "check-circle" })),
  });
  sec("how_it_works", 2, {
    title_ar: "كيف يعمل البرنامج؟", title_en: "How does it work?",
    subtitle_ar: "كل خطوة موثقة وكل قرش يصل لمن يستحق", subtitle_en: "Every step is documented.",
    content_ar: steps(STEPS, "ar"), content_en: steps(STEPS, "en"),
  });
  sec("details", 3, {
    title_ar: "كل ما تحتاج معرفته", title_en: "Everything You Need to Know",
    content_ar: p.ar.longContent.map((text) => ({ text })), content_en: p.en.longContent.map((text) => ({ text })),
  });
  sec("impact", 4, {
    title_ar: "٤ مراحل من تبرعك لباب البيت", title_en: "4 stages from your donation to the family's door",
    subtitle_ar: "كل مرحلة موثّقة بتقرير ميداني وصور قبل ما ندفع لباب البيت.",
    subtitle_en: "Every stage is logged in a field report with photos before we move to delivery.",
    content_ar: steps(IMPACT, "ar"), content_en: steps(IMPACT, "en"),
  });
  sec("donor_testimonials", 5, { title_ar: "آراء المتبرعين", title_en: "Donor Testimonials" });
  sec("faq", 6, {
    title_ar: "أسئلة شائعة", title_en: "Frequently Asked Questions",
    content_ar: PROGRAM_FAQ.ar.map(([question, answer]) => ({ question, answer })),
    content_en: PROGRAM_FAQ.en.map(([question, answer]) => ({ question, answer })),
  });
  sec("related_programs", 7, { title_ar: "برامج مشابهة", title_en: "Related Programs" });
});

// ─── donation packages for programs / projects (entity shares) ──────────────

const programPackages: Record<string, unknown>[] = [];
const projectPackages: Record<string, unknown>[] = [];
const sharePkg = (s: DonationEntity["shares"][number], i: number) => ({
  key: s.id,
  name_ar: s.nameAr,
  name_en: s.nameEn,
  amount: money(s.price),
  sort_order: i + 1,
  is_active: true,
  extra: nonEmpty({ description_ar: s.descAr, description_en: s.descEn, is_popular: s.popular }),
});
DONATION_ENTITIES.forEach((e) => {
  const t = ENTITY_TARGET[e.id];
  if (!t) return;
  if (t.table === "programs") e.shares.forEach((s, i) => programPackages.push({ program_slug: t.slug, ...sharePkg(s, i) }));
  if (t.table === "projects") e.shares.forEach((s, i) => projectPackages.push({ project_slug: t.slug, ...sharePkg(s, i) }));
});

// ─── projects ───────────────────────────────────────────────────────────────

const projectRows = DONATION_ENTITIES.filter((e) => ENTITY_TARGET[e.id]?.table === "projects").map((e, i) => ({
  slug: ENTITY_TARGET[e.id].slug,
  name: e.ar,
  name_en: e.en,
  description: e.taglineAr,
  short_description: e.taglineAr,
  short_description_en: e.taglineEn,
  target_amount: null,
  starting_price: money(e.priceFrom),
  display_order: i + 1,
  cover_image: img(e.image, "projects"),
  is_active: true,
  extra: nonEmpty({ source: "src/data/donationEntities.ts", description_en: e.taglineEn, ...entityExtra(e) }),
}));

// ─── donation campaigns (+ page_content, seo, faqs) and their packages ──────

const PAGE_DEFAULTS: Record<string, CampaignPageContent> = { setr, dhill, athar, ramadan, markoun, arboun, food };
const campaignEntityId: Record<string, string> = { setr: "shelter", dhill: "dhill", athar: "athar", ramadan: "ramadan", markoun: "markoun" };

const campaignRows: Record<string, unknown>[] = [];
const campaignPackages: Record<string, unknown>[] = [];

CAMPAIGN_PAGES.forEach((meta, i) => {
  const content = PAGE_DEFAULTS[meta.slug];
  const slug = CAMPAIGN_BACKEND_SLUG[meta.slug] ?? meta.slug;
  const e = campaignEntityId[meta.slug] ? entityById.get(campaignEntityId[meta.slug]) : undefined;
  const preset = OFFICIAL_CAMPAIGN_SEO_PRESETS[slug];
  const minPrice = content.prices.length ? Math.min(...content.prices.map((p) => p.amount)) : e?.priceFrom ?? null;

  // page_content = everything except prices (-> donation_packages) and faq (-> faqs column); seo -> seo column.
  const { prices, faq, seo: pageSeo, ...pageContent } = content;
  const seo = pageSeo
    ? pageSeo
    : preset
      ? {
          title: { ar: preset.meta_title_ar, en: preset.meta_title_en },
          description: { ar: preset.meta_description_ar, en: preset.meta_description_en },
          keywords: { ar: preset.focus_keywords_ar, en: preset.focus_keywords_en },
          canonical: preset.canonical_url,
          noindex: preset.noindex ?? false,
          nofollow: preset.nofollow ?? false,
        }
      : null;

  campaignRows.push({
    slug,
    name_ar: meta.name.ar,
    name_en: meta.name.en,
    description_ar: e?.taglineAr ?? content.hero.lead.ar,
    description_en: e?.taglineEn ?? content.hero.lead.en,
    image: img(e?.image, "donation_campaigns"),
    minimum_amount: money(minPrice),
    donation_available: true,
    is_active: true,
    sort_order: i + 1,
    page_content: pageContent,
    seo,
    faqs: faq.map((f) => ({ question_ar: f.q.ar, answer_ar: f.a.ar, question_en: f.q.en, answer_en: f.a.en })),
    landing_slug: meta.slug,
    extra: nonEmpty({
      landing_path: meta.path,
      aliases: Array.from(new Set([meta.slug, ...meta.apiSlugs, ...(e ? [e.id] : [])])).filter((s) => s !== slug),
      seo_preset_extra: preset
        ? nonEmpty({
            impact_regions_ar: preset.impact_regions_ar,
            impact_regions_en: preset.impact_regions_en,
            impact_stats_ar: preset.impact_stats_ar,
            impact_stats_en: preset.impact_stats_en,
            suggested_articles: preset.suggested_articles,
          })
        : undefined,
      ...entityExtra(e),
    }),
  });

  prices.forEach((p, j) =>
    campaignPackages.push({
      donation_campaign_slug: slug,
      key: p.id,
      name_ar: p.label.ar,
      name_en: p.label.en,
      amount: money(p.amount),
      sort_order: j + 1,
      is_active: true,
      extra: nonEmpty({ note: strip(p.note) }),
    }),
  );
});

// ─── donation entities map ──────────────────────────────────────────────────

const entityMap = DONATION_ENTITIES.map((e) => {
  const t = ENTITY_TARGET[e.id];
  return {
    donation_entity_id: e.id,
    frontend_entity_type: e.entityType,
    target_table: t?.table ?? null,
    target_slug: t?.slug ?? null,
    note: t?.note ?? null,
    name_ar: e.ar,
    name_en: e.en,
    tagline_ar: e.taglineAr,
    tagline_en: e.taglineEn,
    image: img(e.image, "donation_entities"),
    donation_type: e.donationType,
    category_ar: e.categoryAr,
    category_en: e.categoryEn,
    price_from: e.priceFrom,
    color: e.color ?? null,
    is_seasonal: !!e.isSeasonal,
    is_markoun: !!e.isMarkoun,
    shares: e.shares.map((s) => ({ key: s.id, name_ar: s.nameAr, name_en: s.nameEn, amount: s.price, popular: !!s.popular })),
    shares_seeded_into: t?.table === "donation_campaigns" ? "NOT seeded (campaign packages come from the landing-page prices)" : t ? `donation_packages (${t.table})` : null,
    demo_cases_count: e.cases.length,
  };
});

// ─── seasons ────────────────────────────────────────────────────────────────

const seasonRows = SEASONS.map((s, i) => ({
  slug: s.slug,
  name_ar: s.titleAr,
  name_en: s.titleEn,
  period_ar: s.monthsAr,
  period_en: s.monthsEn,
  tagline_ar: s.taglineAr,
  tagline_en: s.taglineEn,
  description_ar: s.descriptionAr,
  description_en: s.descriptionEn,
  is_active: s.defaultEnabled,
  donation_available: s.defaultEnabled,
  sort_order: i + 1,
  extra: nonEmpty({
    icon: iconName(s.icon),
    badge_ar: s.tagAr,
    badge_en: s.tagEn,
    current_months: s.currentMonths,
    donate_url: s.donateHref,
    hero_image: img(s.heroImage, "seasons"),
    gallery: (s.gallery ?? []).map((g) => img(g, "seasons")),
    items: s.items.map((it) => nonEmpty({ ar: it.ar, en: it.en, description_ar: it.arD, description_en: it.enD })),
    pricing: (s.pricing ?? []).map((p) => nonEmpty({ label_ar: p.labelAr, label_en: p.labelEn, amount: p.amount, tag_ar: p.tagAr, tag_en: p.tagEn })),
    meta_title_ar: s.metaTitleAr,
    meta_title_en: s.metaTitleEn,
    meta_description_ar: s.metaDescAr,
    meta_description_en: s.metaDescEn,
    keywords_ar: s.keywordsAr,
    keywords_en: s.keywordsEn,
  }),
}));

// ─── services (new tables) ──────────────────────────────────────────────────

const serviceRows = Object.values(SERVICE_PAGES).map((s, i) => ({
  slug: s.slug,
  program_slug: s.programSlug,
  sector: (s as { sector?: string }).sector ?? "general",
  hero_image: img(s.hero, "services"),
  badge_ar: s.badge_ar,
  badge_en: s.badge_en,
  title_ar: s.title_ar,
  title_en: s.title_en,
  intro_ar: s.intro_ar,
  intro_en: s.intro_en,
  meta_title_ar: s.seo_title_ar,
  meta_title_en: s.seo_title_en,
  meta_description_ar: s.seo_desc_ar,
  meta_description_en: s.seo_desc_en,
  bullets_ar: s.bullets_ar,
  bullets_en: s.bullets_en,
  stats: s.stats.map((x) => ({ value_ar: x.ar, value_en: x.en, label_ar: x.arL, label_en: x.enL })),
  features: s.features.map((f) => ({ icon: iconName(f.Icon), title_ar: f.t_ar, title_en: f.t_en, description_ar: f.d_ar, description_en: f.d_en })),
  tiers: s.tiers,
  related: s.related ?? [],
  faqs: (s.faqs ?? []).map((f) => ({ question_ar: f.q_ar, answer_ar: f.a_ar, question_en: f.q_en, answer_en: f.a_en })),
  is_active: true,
  sort_order: i + 1,
  has_custom_jsx_block: !!s.extra,
}));

const serviceCategoryRows = DONATE_SECTORS.map((s, i) => ({
  slug: s.id,
  donate_key: s.donate,
  title_ar: s.title_ar,
  title_en: s.title_en,
  summary_ar: s.summary_ar,
  summary_en: s.summary_en,
  intro_ar: s.intro_ar,
  intro_en: s.intro_en,
  programs: s.programs.map((p) => nonEmpty({ slug: p.slug, title_ar: p.title_ar, title_en: p.title_en, description_ar: p.desc_ar, description_en: p.desc_en, href: p.href })),
  is_active: true,
  sort_order: i + 1,
}));

const servicesMapAxes = [...SERVICES_AXES_AR, RESOURCES_AR].map((a, i) => ({
  slug: a.id,
  title_ar: a.title,
  subtitle_ar: a.subtitle ?? null,
  is_resources: a.id === RESOURCES_AR.id,
  groups: a.groups.map((g) =>
    nonEmpty({
      key: g.id,
      title_ar: g.title,
      intro_ar: g.intro,
      href: g.href,
      cta_ar: g.cta_ar,
      cta_en: g.cta_en,
      items: g.items.map((it) => nonEmpty({ title_ar: it.t, description_ar: it.d })),
    }),
  ),
  sort_order: i + 1,
}));

// ─── blog (blog-seo) ────────────────────────────────────────────────────────

const blogRows = blogPosts.map((p) => {
  const axis = blogAxes.find((a) => a.slug === axisOfPost(p))!;
  const author = authorOfPost(p);
  const cover = img(p.image, "blog_posts");
  return {
    slug: p.slug,
    title_ar: p.ar.title,
    title_en: p.en.title,
    summary_ar: p.ar.excerpt,
    summary_en: p.en.excerpt,
    content_ar: paras(p.ar.body),
    content_en: paras(p.en.body),
    cover_image: cover,
    primary_keyword: axis.ar.keyword,
    category_ar: p.category.ar,
    category_en: p.category.en,
    tags_ar: p.ar.tags,
    tags_en: p.en.tags,
    og_image_url: null,
    schema_type: "Article",
    workflow_status: "published",
    extra: {
      published_at: p.date,
      category_slug: axis.slug,
      author_slug: author.slug,
      reading_minutes_ar: readingTime(p, "ar").minutes,
      reading_minutes_en: readingTime(p, "en").minutes,
    },
  };
});

const blogCategoryRows = blogAxes.map((a, i) => ({
  slug: a.slug,
  name_ar: a.ar.name,
  name_en: a.en.name,
  description_ar: a.ar.description,
  description_en: a.en.description,
  keyword_ar: a.ar.keyword,
  keyword_en: a.en.keyword,
  sort_order: i + 1,
  is_active: true,
}));

const blogAuthorRows = blogAuthors.map((a) => ({
  slug: a.slug,
  name_ar: a.ar.name,
  name_en: a.en.name,
  role_ar: a.ar.role,
  role_en: a.en.role,
  bio_ar: a.ar.bio,
  bio_en: a.en.bio,
  avatar: img(a.avatar, "blog_authors"),
  twitter: a.twitter ?? null,
  linkedin: a.linkedin ?? null,
}));

// ─── FAQs ───────────────────────────────────────────────────────────────────

const faqCategoryRows: Record<string, unknown>[] = FAQ_PAGE_CATEGORIES.map((c) => ({
  slug: c.slug,
  name_ar: c.name_ar,
  name_en: c.name_en,
  is_active: true,
  sort_order: c.sort_order,
  extra: { description_ar: c.description_ar, description_en: c.description_en, icon: c.iconName },
}));
// categories referenced by static FAQs but not declared in FAQ_PAGE_CATEGORIES
const SYNTH_CATS: Record<string, [string, string]> = {
  volunteer: ["التطوع", "Volunteering"],
  services: ["الخدمات", "Services"],
  general: ["أسئلة عامة", "General"],
};
const declared = new Set(FAQ_PAGE_CATEGORIES.map((c) => c.slug));
const usedCats = Array.from(new Set(DEFAULT_STATIC_FAQS.map((f) => f.pageCategory).filter(Boolean) as string[]));
usedCats.filter((s) => !declared.has(s)).forEach((s, i) =>
  faqCategoryRows.push({
    slug: s,
    name_ar: SYNTH_CATS[s]?.[0] ?? s,
    name_en: SYNTH_CATS[s]?.[1] ?? s,
    is_active: true,
    sort_order: 100 + i,
    extra: { synthesized: true },
  }),
);

const faqRows: Record<string, unknown>[] = [];
const seenQ = new Set<string>();
DEFAULT_STATIC_FAQS.forEach((f) => {
  const k = `${f.pageCategory}|${f.question_ar.trim()}`;
  if (seenQ.has(k)) return;
  seenQ.add(k);
  faqRows.push({
    faq_category_slug: f.pageCategory ?? null,
    question_ar: f.question_ar,
    question_en: f.question_en ?? null,
    answer_ar: f.answer_ar,
    answer_en: f.answer_en ?? null,
    sort_order: f.sort_order ?? 1,
    is_active: f.is_active ?? true,
    extra: { source: "src/data/faqsApi.ts" },
  });
});
QURBANI_FAQ_AR.forEach((f, i) => {
  const k = `qurbani|${f.q.trim()}`;
  if (seenQ.has(k)) return;
  seenQ.add(k);
  faqRows.push({
    faq_category_slug: "qurbani",
    question_ar: f.q,
    question_en: QURBANI_FAQ_EN[i]?.q ?? null,
    answer_ar: f.a,
    answer_en: QURBANI_FAQ_EN[i]?.a ?? null,
    sort_order: 100 + i,
    is_active: true,
    extra: { source: "src/data/qurbaniFaq.ts" },
  });
});

// ─── gallery ────────────────────────────────────────────────────────────────

const galleryRows = GALLERY_STATIC_IMAGES.map((g, i) => ({
  image: img(g.src, "gallery"),
  external_url: null,
  title_ar: g.altAr,
  title_en: g.alt,
  alt_ar: g.altAr,
  alt_en: g.alt,
  description_ar: null,
  description_en: null,
  city: g.city ?? null,
  program: g.category,
  donation_program: g.donateProgram ?? null,
  sort_order: i + 1,
  is_featured: false,
  is_public: true,
  extra: nonEmpty({ static_id: g.id, program_slug: g.programSlug }),
}));

// ─── stories ────────────────────────────────────────────────────────────────

const storyRows = STATIC_STORIES.map((s) => ({
  slug: s.slug,
  title_ar: s.title_ar,
  title_en: s.title_en,
  category_ar: s.role_ar,
  category_en: s.role_en,
  beneficiary_name: s.beneficiary_name ?? s.title_ar.split(" — ")[0],
  location_ar: s.location_ar ?? null,
  location_en: s.location_en ?? null,
  description_ar: s.body_ar ?? s.quote_ar,
  description_en: s.body_en ?? s.quote_en,
  cover_image: img(s.image_url, "stories"),
  sort_order: s.sort_order,
  status: s.is_published ? "published" : "draft",
  is_featured: s.is_featured,
  extra: nonEmpty({ quote_ar: s.quote_ar, quote_en: s.quote_en, pillar_slug: s.pillar_slug, program_node_id: s.program_node_id, case_id: s.case_id }),
}));

// ─── homepage campaigns section ─────────────────────────────────────────────

const disabled = new Set(DEFAULT_CAMPAIGNS_SETTINGS.disabledSlugs ?? []);
const homepageCampaigns = {
  is_active: DEFAULT_CAMPAIGNS_SETTINGS.enabled,
  scroll_speed: DEFAULT_CAMPAIGNS_SETTINGS.scrollSpeed,
  show_final_cta: DEFAULT_CAMPAIGNS_SETTINGS.showFinalCta,
  enable_scroll_trigger: DEFAULT_CAMPAIGNS_SETTINGS.enableScrollTrigger ?? true,
  show_skip_button: DEFAULT_CAMPAIGNS_SETTINGS.showSkipButton ?? true,
  title_ar: DEFAULT_CAMPAIGNS_SETTINGS.title?.ar ?? null,
  title_en: DEFAULT_CAMPAIGNS_SETTINGS.title?.en ?? null,
  subtitle_ar: DEFAULT_CAMPAIGNS_SETTINGS.subtitle?.ar ?? null,
  subtitle_en: DEFAULT_CAMPAIGNS_SETTINGS.subtitle?.en ?? null,
  enabled_slugs: DEFAULT_CAMPAIGNS_SETTINGS.enabledSlugs,
  disabled_slugs: DEFAULT_CAMPAIGNS_SETTINGS.disabledSlugs ?? [],
  /** What the strip shows today when no cards are configured: every program in programs.ts order, minus disabled slugs. */
  cards: programs
    .filter((p) => !disabled.has(p.slug))
    .map((p, i) => ({
      source_type: "program",
      slug: PROGRAM_BACKEND_SLUG[p.slug] ?? p.slug,
      name_ar: p.ar.name,
      name_en: p.en.name,
      tagline_ar: p.ar.tagline,
      tagline_en: p.en.tagline,
      image: img(p.image, "homepage_campaigns_section"),
      price_from: p.priceFrom,
      details_url: `/programs/${p.slug}`,
      donate_url: `/donate?program=${encodeURIComponent(p.slug)}${p.priceFrom > 0 ? `&amount=${p.priceFrom}` : ""}`,
      is_active: true,
      sort_order: i + 1,
    })),
};

// ─── geo pages + Dakahlia cities ────────────────────────────────────────────

const geoRows = GEO_GOVERNORATES.flatMap((g) =>
  Object.entries(g.programs).map(([program, c]) => ({
    governorate_slug: g.slug,
    program_slug: program,
    governorate_ar: g.ar,
    governorate_en: g.en,
    region_ar: g.region,
    lat: g.lat,
    lon: g.lon,
    headline_ar: c.ar.headline,
    headline_en: c.en.headline,
    intro_ar: c.ar.intro,
    intro_en: c.en.intro,
    why_here_ar: c.ar.whyHere,
    why_here_en: c.en.whyHere,
    coverage_ar: c.ar.coverage,
    coverage_en: c.en.coverage,
    faqs: c.ar.faq.map((f, i) => ({ question_ar: f.q, answer_ar: f.a, question_en: c.en.faq[i]?.q ?? null, answer_en: c.en.faq[i]?.a ?? null })),
    is_active: true,
  })),
);

const cityRows = DAKAHLIA_CITIES.map((c, i) => ({
  slug: c.slug,
  name_ar: c.ar,
  name_en: c.en,
  lat: c.lat,
  lon: c.lon,
  families_count: c.families,
  programs: c.programs,
  highlight_ar: c.highlight.ar,
  highlight_en: c.highlight.en,
  intro_ar: c.copy.ar.intro,
  intro_en: c.copy.en.intro,
  local_note_ar: c.copy.ar.localNote,
  local_note_en: c.copy.en.localNote,
  coverage_ar: c.copy.ar.coverage,
  coverage_en: c.copy.en.coverage,
  districts: DISTRICTS_BY_CITY[c.slug] ?? [],
  sort_order: i + 1,
  is_active: true,
}));

// ─── write ──────────────────────────────────────────────────────────────────

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

write("programs", programRows);
write("program_page_sections", pageSectionRows);
write("program_donation_packages", programPackages);
write("projects", projectRows);
write("project_donation_packages", projectPackages);
write("donation_campaigns", campaignRows);
write("donation_campaign_packages", campaignPackages);
write("donation_entities_map", entityMap);
write("seasons", seasonRows);
write("services", serviceRows);
write("service_categories", serviceCategoryRows);
write("services_map_axes", servicesMapAxes);
write("blog_posts", blogRows);
write("blog_categories", blogCategoryRows);
write("blog_authors", blogAuthorRows);
write("faq_categories", faqCategoryRows);
write("faqs", faqRows);
write("gallery", galleryRows);
write("stories", storyRows);
write("homepage_campaigns_section", homepageCampaigns);
write("geo_pages", geoRows);
write("dakahlia_cities", cityRows);

const images = Array.from(imageUses.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, tables]) => ({ file, exists: fs.existsSync(path.resolve(process.cwd(), file)), used_by: Array.from(tables).sort() }));
write("_images_to_upload", images);

fs.writeFileSync(
  path.join(OUT_DIR, "_manifest.json"),
  JSON.stringify({ generated_by: "scripts/export-seed-data.ts", counts }, null, 2) + "\n",
  "utf8",
);

console.log("Seed data written to", path.relative(process.cwd(), OUT_DIR));
console.table(counts);
const missing = images.filter((i) => !i.exists);
if (missing.length) console.warn("Missing image files:", missing.map((m) => m.file));
