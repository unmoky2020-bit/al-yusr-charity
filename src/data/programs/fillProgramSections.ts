import type { PageSectionInput, ProgramPageSection } from "@/data/api/programsAdminApi";

/** One suggested section as stored in defaultPageSections.json (keyed by program slug, then section key). */
export type DefaultSection = {
  title_ar: string;
  title_en: string;
  sort_order: number;
  content_ar: unknown[];
  content_en: unknown[];
};
export type DefaultSections = Record<string, Record<string, DefaultSection>>;

/**
 * The key a program's suggested copy is filed under: its slug, cleaned of a pasted URL
 * ("https://elyusr.org/water" → "water", "/programs/zakat/" → "zakat").
 */
export function programSlugKey(slug: unknown): string {
  const s = String(slug ?? "").trim().toLowerCase().split(/[?#]/)[0].replace(/\/+$/, "");
  return s.split("/").filter(Boolean).pop() ?? "";
}

const hasItems = (v: unknown) => Array.isArray(v) && v.length > 0;

export type SectionFillPlan = {
  create: PageSectionInput[];
  update: { id: number; body: PageSectionInput }[];
};

/**
 * What to write so every suggested section of a program has content. A section that already has
 * items is never touched (the dashboard wins); an existing empty one keeps its title, subtitle,
 * settings, order and visibility and only receives the suggested items; a missing one is created.
 */
export function planSectionFill(existing: ProgramPageSection[], suggested: Record<string, DefaultSection> | undefined): SectionFillPlan {
  const plan: SectionFillPlan = { create: [], update: [] };
  if (!suggested) return plan;
  const byKey = new Map(existing.map((s) => [s.section_key, s]));
  for (const [key, d] of Object.entries(suggested)) {
    const cur = byKey.get(key);
    if (!cur) {
      plan.create.push({
        section_key: key, title_ar: d.title_ar, title_en: d.title_en, subtitle_ar: null, subtitle_en: null,
        content_ar: d.content_ar, content_en: d.content_en, settings: {}, is_enabled: true, sort_order: d.sort_order,
      });
    } else if (!hasItems(cur.content_ar)) {
      plan.update.push({
        id: cur.id,
        body: {
          section_key: key,
          title_ar: cur.title_ar || d.title_ar,
          title_en: cur.title_en || d.title_en,
          subtitle_ar: cur.subtitle_ar ?? null,
          subtitle_en: cur.subtitle_en ?? null,
          content_ar: d.content_ar,
          content_en: hasItems(cur.content_en) ? cur.content_en : d.content_en,
          settings: cur.settings && typeof cur.settings === "object" && !Array.isArray(cur.settings) ? cur.settings : {},
          is_enabled: cur.is_enabled ?? true,
          sort_order: cur.sort_order ?? d.sort_order,
        },
      });
    }
  }
  return plan;
}

/** Loads the suggested copy only when an admin asks for it (keeps it out of the public bundles). */
export async function loadDefaultSections(): Promise<DefaultSections> {
  const mod = await import("./defaultPageSections.json");
  return (mod.default ?? mod) as unknown as DefaultSections;
}

type SectionsApi = {
  listSections(programId: number | string): Promise<ProgramPageSection[]>;
  createSection(programId: number | string, body: PageSectionInput): Promise<ProgramPageSection>;
  updateSection(programId: number | string, sectionId: number, body: PageSectionInput): Promise<ProgramPageSection>;
};

const isBlank = (v: unknown) =>
  v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0);

const textsOf = (section: DefaultSection | undefined, l: "ar" | "en") =>
  ((section?.[`content_${l}`] ?? []) as Record<string, unknown>[]).map((x) => String(x.text ?? "")).filter(Boolean);

/** Shortens to a search-result description (about 155 characters) at a word boundary. */
export function clip(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 30)).trim()}…`;
}

/**
 * The program record's own fields that are still empty, filled from the same suggested copy:
 * description, long content, benefits, SEO title/description/keywords, AI summary and AI FAQ.
 * Anything already typed in the dashboard is left as it is.
 */
export function planRecordFill(record: Record<string, unknown>, suggested: Record<string, DefaultSection> | undefined): Record<string, unknown> {
  if (!suggested) return {};
  const nameAr = String(record.name_ar ?? record.name ?? "").trim();
  const nameEn = String(record.name_en ?? "").trim() || nameAr;
  const out: Record<string, unknown> = {};
  for (const l of ["ar", "en"] as const) {
    const details = textsOf(suggested.details, l);
    const benefits = textsOf(suggested.benefits, l);
    const name = l === "ar" ? nameAr : nameEn;
    const faq = ((suggested.faq?.[`content_${l}`] ?? []) as Record<string, unknown>[])
      .map((x) => ({ question: String(x.question ?? ""), answer: String(x.answer ?? "") }))
      .filter((x) => x.question && x.answer);
    const want: Record<string, unknown> = {
      [`description_${l}`]: details[0],
      [`content_${l}`]: details.join("\n\n"),
      [`benefits_${l}`]: benefits,
      [`meta_title_${l}`]: name ? (l === "ar" ? `${name} | مؤسسة اليسر الخيرية` : `${name} | Al-Yusr Charity Foundation`) : undefined,
      [`meta_description_${l}`]: details[0] ? clip(details[0]) : undefined,
      [`keywords_${l}`]: name
        ? (l === "ar"
          ? `${name}، التبرع ل${name}، مؤسسة اليسر الخيرية، تبرع في المنصورة، جمعية خيرية في الدقهلية`
          : `${name}, donate to ${name}, Al-Yusr Charity Foundation, charity in Mansoura, Egypt charity`)
        : undefined,
      [`ai_summary_${l}`]: details.slice(0, 2).join(" "),
      [`ai_faq_${l}`]: faq.length ? faq : undefined,
    };
    for (const [k, v] of Object.entries(want)) {
      if (!isBlank(v) && isBlank(record[k])) out[k] = v;
    }
  }
  return out;
}

type ProgramsApi = SectionsApi & {
  get(id: number | string): Promise<Record<string, unknown>>;
  update(id: number | string, payload: Record<string, unknown>): Promise<unknown>;
};

/**
 * Fills one program through the normal dashboard endpoints: empty page sections, then the record's
 * empty fields. Returns how many sections and fields were written.
 */
export async function fillProgramSections(api: ProgramsApi, program: { id: number; slug?: unknown }, defaults: DefaultSections): Promise<number> {
  const suggested = defaults[programSlugKey(program.slug)];
  if (!suggested) return 0;
  const plan = planSectionFill(await api.listSections(program.id), suggested);
  for (const body of plan.create) await api.createSection(program.id, body);
  for (const u of plan.update) await api.updateSection(program.id, u.id, u.body);
  const fields = planRecordFill(await api.get(program.id), suggested);
  if (Object.keys(fields).length) await api.update(program.id, fields);
  return plan.create.length + plan.update.length + Object.keys(fields).length;
}
