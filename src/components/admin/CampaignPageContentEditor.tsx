import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CampaignPageContent, L } from "@/data/campaignPages/types";

/**
 * Panels for editing a campaign landing page's content. Each panel is a plain controlled
 * component so the donation-campaign screen can mount them as its own top-level tabs
 * (الهيرو / الحديث / الأرقام / الأقسام / الختام) next to the backend-driven tabs.
 * Prices are NOT edited here: the landing page reads them from the campaign's donation packages.
 * FAQ and SEO are NOT here either: the screen already has tabs for them.
 */
type PanelProps = { value: CampaignPageContent; onChange: (next: CampaignPageContent) => void; isAr: boolean };

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

export const SectionsPanel = (p: PanelProps) => {
  const patch = usePatch(p); const { value, isAr } = p;
  return (
    <div className="space-y-4">
      {Object.keys(value.sections).map((key) => {
        const sec = value.sections[key];
        return (
          <Box key={key} title={`${isAr ? sec.title.ar || key : sec.title.en || key}  ·  ${key}`}>
            <LField label={isAr ? "عنوان القسم" : "Section title"} value={sec.title} onChange={(v) => patch((f) => { f.sections[key].title = v; })} />
            {sec.lead && <LField label={isAr ? "مقدمة القسم" : "Section lead"} value={sec.lead} onChange={(v) => patch((f) => { f.sections[key].lead = v; })} multiline />}
            {sec.items.map((it, i) => (
              <div key={it.id} className="rounded-xl border border-border p-3">
                <span className="mb-3 block font-mono text-[11px] text-muted-foreground" dir="ltr">#{it.id}</span>
                <LField label={isAr ? "العنوان" : "Title"} value={it.title} onChange={(v) => patch((f) => { f.sections[key].items[i].title = v; })} />
                <div className="mt-3"><LField label={isAr ? "الوصف" : "Description"} value={it.desc} onChange={(v) => patch((f) => { f.sections[key].items[i].desc = v; })} multiline /></div>
                {it.extra && <div className="mt-3"><LField label={isAr ? "نص إضافي" : "Extra"} value={it.extra} onChange={(v) => patch((f) => { f.sections[key].items[i].extra = v; })} /></div>}
              </div>
            ))}
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
