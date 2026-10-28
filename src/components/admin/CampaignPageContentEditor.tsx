import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CampaignPageContent, L } from "@/data/campaignPages/types";

/**
 * Controlled editor for a campaign landing page's content (hero, hadith, prices, figures,
 * sections, closing CTA). Embedded in the donation-campaign screen as the "محتوى الصفحة" tab.
 * FAQ and SEO are deliberately NOT here: that screen already has tabs for them, and they are
 * written into the same content object on save.
 */
type TabKey = "hero" | "hadith" | "prices" | "stats" | "sections" | "cta";
const TABS: { key: TabKey; ar: string; en: string }[] = [
  { key: "hero", ar: "الهيرو", en: "Hero" },
  { key: "hadith", ar: "الحديث", en: "Hadith" },
  { key: "prices", ar: "أسعار بنود الصفحة", en: "Page prices" },
  { key: "stats", ar: "الأرقام", en: "Figures" },
  { key: "sections", ar: "الأقسام", en: "Sections" },
  { key: "cta", ar: "الختام", en: "Closing CTA" },
];

const LField = ({ label, value, onChange, multiline, hint }: { label: string; value: L; onChange: (v: L) => void; multiline?: boolean; hint?: string }) => {
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

export const CampaignPageContentEditor = ({ value, onChange, isAr }: { value: CampaignPageContent; onChange: (next: CampaignPageContent) => void; isAr: boolean }) => {
  const [tab, setTab] = useState<TabKey>("hero");
  const sectionKeys = useMemo(() => Object.keys(value.sections), [value.sections]);
  const patch = (fn: (f: CampaignPageContent) => void) => {
    const next = structuredClone(value);
    fn(next);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1">
        {TABS.map((tb) => {
          const count = tb.key === "prices" ? value.prices.length : tb.key === "stats" ? value.stats.length : tb.key === "sections" ? sectionKeys.length : 0;
          if ((tb.key === "prices" || tb.key === "stats" || tb.key === "sections") && count === 0) return null;
          return (
            <button key={tb.key} type="button" role="tab" aria-selected={tab === tb.key} onClick={() => setTab(tb.key)}
              className={`min-h-[36px] rounded-lg px-3 text-xs font-black transition-colors ${tab === tb.key ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-background"}`}>
              {isAr ? tb.ar : tb.en}{count > 0 && <span className="ms-1 font-mono opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {tab === "hero" && (
        <Box title={isAr ? "الجزء العلوي من صفحة الحملة" : "Landing page hero"}>
          <LField label={isAr ? "السطر الصغير فوق العنوان" : "Eyebrow"} value={value.hero.eyebrow} onChange={(v) => patch((f) => { f.hero.eyebrow = v; })} />
          <LField label={isAr ? "العنوان (السطر الأول)" : "Title (line 1)"} value={value.hero.title} onChange={(v) => patch((f) => { f.hero.title = v; })} />
          <LField label={isAr ? "العنوان (السطر الثاني)" : "Title (line 2)"} value={value.hero.title2} onChange={(v) => patch((f) => { f.hero.title2 = v; })} />
          <LField label={isAr ? "النص التعريفي" : "Lead paragraph"} value={value.hero.lead} onChange={(v) => patch((f) => { f.hero.lead = v; })} multiline />
          <LField label={isAr ? "نص زر التبرع" : "Donate button label"} value={value.hero.donateLabel} onChange={(v) => patch((f) => { f.hero.donateLabel = v; })} />
        </Box>
      )}

      {tab === "hadith" && (
        <Box title={isAr ? "الحديث الشريف المعروض في الصفحة" : "Hadith shown on the page"}>
          <LField label={isAr ? "نص الحديث (بدون «قال رسول الله ﷺ»، تُضاف تلقائياً)" : "Hadith text (attribution is added automatically)"} value={value.hadith.text} onChange={(v) => patch((f) => { f.hadith.text = v; })} multiline />
          <LField label={isAr ? "المصدر (مثال: رواه مسلم)" : "Source"} value={value.hadith.source} onChange={(v) => patch((f) => { f.hadith.source = v; })} />
        </Box>
      )}

      {tab === "prices" && (
        <Box title={isAr ? "أسعار بنود صفحة الحملة (الحاسبات والكروت). باقات التبرع في تبويبها الخاص" : "Prices used by the landing page (builders and cards). Donation packages live in their own tab"}>
          {value.prices.map((p, i) => (
            <div key={p.id} className="rounded-xl border border-border p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">#{p.id}</span>
                <label className="flex items-center gap-2 text-xs font-black text-foreground">
                  {isAr ? "المبلغ" : "Amount"}
                  <Input type="number" min={0} dir="ltr" value={p.amount} onChange={(e) => patch((f) => { f.prices[i].amount = Math.max(0, Number(e.target.value) || 0); })} className="h-9 w-28 font-mono text-xs font-black" />
                </label>
              </div>
              <LField label={isAr ? "الاسم" : "Label"} value={p.label} onChange={(v) => patch((f) => { f.prices[i].label = v; })} />
              {p.note && <div className="mt-3"><LField label={isAr ? "ملاحظة صغيرة" : "Note"} value={p.note} onChange={(v) => patch((f) => { f.prices[i].note = v; })} /></div>}
            </div>
          ))}
        </Box>
      )}

      {tab === "stats" && (
        <Box title={isAr ? "الأرقام والإنجازات" : "Figures"}>
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
      )}

      {tab === "sections" && sectionKeys.map((key) => {
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

      {tab === "cta" && (
        <Box title={isAr ? "قسم التبرع الختامي" : "Closing donate section"}>
          <LField label={isAr ? "العنوان" : "Title"} value={value.cta.title} onChange={(v) => patch((f) => { f.cta.title = v; })} />
          <LField label={isAr ? "السطر التوضيحي" : "Subtitle"} value={value.cta.sub} onChange={(v) => patch((f) => { f.cta.sub = v; })} />
        </Box>
      )}
    </div>
  );
};

export default CampaignPageContentEditor;
