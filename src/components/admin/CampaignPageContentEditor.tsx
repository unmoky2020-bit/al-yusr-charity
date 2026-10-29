import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CampaignPageContent, L } from "@/data/campaignPages/types";

/**
 * Panels for editing a campaign landing page's content. Each panel is a plain controlled
 * component so the donation-campaign screen can mount them as its own top-level tabs
 * (الهيرو / الحديث / الأرقام / one tab per section / الختام) next to the backend-driven tabs.
 * Prices are NOT edited here: the landing page reads them from the campaign's donation packages.
 * FAQ and SEO are NOT here either: the screen already has tabs for them.
 */
type PanelProps = { value: CampaignPageContent; onChange: (next: CampaignPageContent) => void; isAr: boolean };

/**
 * Section keys that belong to another tab of the screen instead of a tab of their own:
 *   seo      → «السيو والـ Meta» (page title / description the landing uses when the meta is empty)
 *   hadith*  → «الحديث» (a second hadith next to the main one)
 *   faq_*    → «الأسئلة الشائعة» (the intro above the FAQ list)
 */
export const sectionHomeTab = (key: string): "seo" | "hadith" | "faqs" | null =>
  key === "seo" ? "seo" : /^hadith/.test(key) ? "hadith" : /^faq_/.test(key) ? "faqs" : null;

export type SectionTab = { id: string; keys: string[]; label: L };

/**
 * The section tabs of one landing page, in content order. Keys of one family share a tab:
 * `areas_now` / `areas_before` go with `areas`, `pillar_details` with `pillars`.
 */
export function campaignSectionTabs(content: CampaignPageContent): SectionTab[] {
  const keys = Object.keys(content.sections).filter((k) => !sectionHomeTab(k));
  const parentOf = (k: string) =>
    keys.find((g) => g !== k && (k.startsWith(`${g}_`) || (g.endsWith("s") && k.startsWith(`${g.slice(0, -1)}_`))));
  const tabs: SectionTab[] = [];
  for (const k of keys) {
    const parent = parentOf(k);
    if (parent) continue;
    tabs.push({ id: k, keys: [k, ...keys.filter((c) => parentOf(c) === k)], label: content.sections[k].title });
  }
  return tabs;
}

/** Keys of the sections that live in the given screen tab (see sectionHomeTab). */
export const sectionKeysFor = (content: CampaignPageContent, tab: "seo" | "hadith" | "faqs"): string[] =>
  Object.keys(content.sections).filter((k) => sectionHomeTab(k) === tab);

const usePatch = ({ value, onChange }: PanelProps) => (fn: (f: CampaignPageContent) => void) => {
  const next = structuredClone(value);
  fn(next);
  onChange(next);
};

export const LField = ({ label, value, onChange, multiline, hint }: { label: string; value: L; onChange: (v: L) => void; multiline?: boolean; hint?: string }) => {
  const Cmp = multiline ? Textarea : Input;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="sm:col-span-2 flex items-baseline justify-between gap-3">
        <span className="text-xs font-black text-foreground">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
        عربي
        <Cmp dir="rtl" value={value.ar} onChange={(e) => onChange({ ...value, ar: e.target.value })} className={multiline ? "min-h-[80px] text-xs" : "h-9 text-xs"} />
      </label>
      <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
        English
        <Cmp dir="ltr" value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} className={multiline ? "min-h-[80px] text-xs" : "h-9 text-xs"} />
      </label>
    </div>
  );
};

const Box = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-background/60 p-4">
    {title && <h4 className="mb-4 text-sm font-black text-foreground">{title}</h4>}
    <div className="space-y-4">{children}</div>
  </div>
);

export const HeroPanel = (p: PanelProps) => {
  const patch = usePatch(p); const { value, isAr } = p;
  return (
    <Box title={isAr ? "الجزء العلوي من صفحة الحملة" : "Landing page hero"}>
      <LField label={isAr ? "السطر الصغير فوق العنوان" : "Eyebrow"} value={value.hero.eyebrow} onChange={(v) => patch((f) => { f.hero.eyebrow = v; })} />
      <LField label={isAr ? "العنوان (السطر الأول)" : "Title (line 1)"} value={value.hero.title} onChange={(v) => patch((f) => { f.hero.title = v; })} />
      <LField label={isAr ? "العنوان (السطر الثاني)" : "Title (line 2)"} value={value.hero.title2} onChange={(v) => patch((f) => { f.hero.title2 = v; })} />
      <LField label={isAr ? "النص التعريفي" : "Lead paragraph"} value={value.hero.lead} onChange={(v) => patch((f) => { f.hero.lead = v; })} multiline />
      <LField label={isAr ? "نص زر التبرع" : "Donate button label"} value={value.hero.donateLabel} onChange={(v) => patch((f) => { f.hero.donateLabel = v; })} />
    </Box>
  );
};

export const HadithPanel = (p: PanelProps) => {
  const patch = usePatch(p); const { value, isAr } = p;
  return (
    <Box title={isAr ? "الحديث الشريف المعروض في الصفحة" : "Hadith shown on the page"}>
      <LField label={isAr ? "نص الحديث (بدون «قال رسول الله ﷺ»، تُضاف تلقائياً)" : "Hadith text (attribution is added automatically)"} value={value.hadith.text} onChange={(v) => patch((f) => { f.hadith.text = v; })} multiline />
      <LField label={isAr ? "المصدر (مثال: رواه مسلم)" : "Source"} value={value.hadith.source} onChange={(v) => patch((f) => { f.hadith.source = v; })} />
    </Box>
  );
};

export const StatsPanel = (p: PanelProps) => {
  const patch = usePatch(p); const { value, isAr } = p;
  return (
    <Box title={isAr ? "الأرقام والإنجازات المعروضة في الصفحة" : "Figures shown on the page"}>
      {value.stats.map((st, i) => (
        <div key={st.id} className="rounded-xl border border-border p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">#{st.id}</span>
            <label className="flex items-center gap-2 text-xs font-black text-foreground">
              {isAr ? "الرقم" : "Value"}
              <Input type="number" min={0} dir="ltr" value={st.value ?? ""} placeholder={isAr ? "بدون رقم" : "none"}
                onChange={(e) => patch((f) => { f.stats[i].value = e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0); })} className="h-9 w-28 font-mono text-xs font-black" />
            </label>
          </div>
          <LField label={isAr ? "الاسم" : "Label"} value={st.label} onChange={(v) => patch((f) => { f.stats[i].label = v; })} />
          {st.unit && <div className="mt-3"><LField label={isAr ? "الوحدة (مثال: كرتونة)" : "Unit"} value={st.unit} onChange={(v) => patch((f) => { f.stats[i].unit = v; })} /></div>}
          {st.note && <div className="mt-3"><LField label={isAr ? "تفاصيل (تُفصل بـ · )" : "Details (separated by · )"} value={st.note} onChange={(v) => patch((f) => { f.stats[i].note = v; })} multiline /></div>}
        </div>
      ))}
    </Box>
  );
};

/** Edits the given section keys (all sections when `keys` is omitted). */
export const SectionsPanel = (p: PanelProps & { keys?: string[] }) => {
  const patch = usePatch(p); const { value, isAr } = p;
  const keys = (p.keys ?? Object.keys(value.sections)).filter((k) => value.sections[k]);
  return (
    <div className="space-y-4">
      {keys.map((key) => {
        const sec = value.sections[key];
        const dynamic = !!sec.dynamic;
        const extraLabel = sec.extraLabel ? (isAr ? sec.extraLabel.ar : sec.extraLabel.en) : (isAr ? "نص إضافي" : "Extra");
        const move = (i: number, dir: -1 | 1) => patch((f) => {
          const items = f.sections[key].items;
          const j = i + dir;
          if (j < 0 || j >= items.length) return;
          [items[i], items[j]] = [items[j], items[i]];
        });
        return (
          <Box key={key} title={`${isAr ? sec.title.ar || key : sec.title.en || key}  ·  ${key}`}>
            <LField label={isAr ? "عنوان القسم" : "Section title"} value={sec.title} onChange={(v) => patch((f) => { f.sections[key].title = v; })} />
            {sec.lead && <LField label={isAr ? "مقدمة القسم" : "Section lead"} value={sec.lead} onChange={(v) => patch((f) => { f.sections[key].lead = v; })} multiline />}
            {dynamic && (
              <p className="text-[11px] text-muted-foreground">
                {isAr ? "قائمة حرة: أضف عناصر أو احذفها أو رتّبها، ثم اضغط حفظ." : "Free list: add, remove or reorder items, then save."}
              </p>
            )}
            {sec.items.map((it, i) => (
              <div key={it.id} className="rounded-xl border border-border p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">#{it.id}</span>
                  {dynamic && (
                    <span className="flex items-center gap-1">
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)} title={isAr ? "أعلى" : "Up"}><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === sec.items.length - 1} onClick={() => move(i, 1)} title={isAr ? "أسفل" : "Down"}><ArrowDown className="h-3.5 w-3.5" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => patch((f) => { f.sections[key].items.splice(i, 1); })} title={isAr ? "حذف" : "Remove"}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </span>
                  )}
                </div>
                <LField label={isAr ? "العنوان" : "Title"} value={it.title} onChange={(v) => patch((f) => { f.sections[key].items[i].title = v; })} />
                <div className="mt-3"><LField label={isAr ? "الوصف" : "Description"} value={it.desc} onChange={(v) => patch((f) => { f.sections[key].items[i].desc = v; })} multiline={!dynamic} /></div>
                {(it.extra || dynamic) && (
                  <div className="mt-3">
                    <LField label={extraLabel} value={it.extra ?? { ar: "", en: "" }} onChange={(v) => patch((f) => { f.sections[key].items[i].extra = v; })} />
                  </div>
                )}
              </div>
            ))}
            {dynamic && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 font-black"
                onClick={() => patch((f) => {
                  const items = f.sections[key].items;
                  let n = items.length + 1;
                  while (items.some((x) => x.id === `item_${n}`)) n += 1;
                  items.push({ id: `item_${n}`, title: { ar: "", en: "" }, desc: { ar: "", en: "" }, extra: { ar: "", en: "" } });
                })}
              >
                <Plus className="h-4 w-4" /> {isAr ? "إضافة عنصر" : "Add item"}
              </Button>
            )}
          </Box>
        );
      })}
    </div>
  );
};

export const CtaPanel = (p: PanelProps) => {
  const patch = usePatch(p); const { value, isAr } = p;
  return (
    <Box title={isAr ? "قسم التبرع الختامي في الصفحة" : "Closing donate section"}>
      <LField label={isAr ? "العنوان" : "Title"} value={value.cta.title} onChange={(v) => patch((f) => { f.cta.title = v; })} />
      <LField label={isAr ? "السطر التوضيحي" : "Subtitle"} value={value.cta.sub} onChange={(v) => patch((f) => { f.cta.sub = v; })} />
    </Box>
  );
};
