/**
 * SEO & social / Geo / AI summary + FAQ blocks. Same column names on programs (existing)
 * and projects (proposed), so both editors share these components.
 */
import { UiSelect } from "@/components/common/UiSelect";
import type { ReactNode } from "react";
import { Globe2, MapPin, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatServerImageUrl } from "@/data/laravelApi";
import { BilingualField, FaqListEditor, Field, SectionCard } from "./FormKit";
import {
  isValidGeoPosition,
  isValidGeoRegion,
  isValidUrlOrEmpty,
  normalizeGeoPosition,
  normalizeGeoRegion,
  type SeoFormState,
} from "./formUtils";

type Patch = (p: Partial<SeoFormState>) => void;

const selectCls = "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm";

export function SeoFields({
  value,
  onChange,
  badge,
  previewImage,
  previewTitleAr,
  previewDescAr,
  previewPath,
}: {
  value: SeoFormState;
  onChange: Patch;
  badge?: ReactNode;
  previewImage?: string;
  previewTitleAr?: string;
  previewDescAr?: string;
  previewPath: string;
}) {
  const title = value.meta_title_ar || previewTitleAr || "بدون عنوان";
  const desc = value.meta_description_ar || previewDescAr || "أضف وصف الميتا لرؤيته هنا.";
  const canonical = value.canonical_url || `https://elyusr.org${previewPath}`;
  let host = "elyusr.org";
  try { host = new URL(canonical).host; } catch { /* keep default */ }
  const img = previewImage ? formatServerImageUrl(previewImage) || previewImage : "/placeholder.svg";

  return (
    <SectionCard
      icon={<Globe2 className="h-4 w-4 text-primary" />}
      title="SEO والمشاركة على وسائل التواصل"
      description="العناوين والأوصاف تظهر في نتائج البحث وبطاقات المشاركة. صورة المشاركة = الصورة الرئيسية."
      actions={badge}
    >
      <BilingualField label="عنوان الميتا (Meta title)" maxLength={70}
        valueAr={value.meta_title_ar} valueEn={value.meta_title_en}
        onAr={(v) => onChange({ meta_title_ar: v })} onEn={(v) => onChange({ meta_title_en: v })} />
      <BilingualField label="وصف الميتا (Meta description)" multiline rows={2} maxLength={170}
        valueAr={value.meta_description_ar} valueEn={value.meta_description_en}
        onAr={(v) => onChange({ meta_description_ar: v })} onEn={(v) => onChange({ meta_description_en: v })} />
      <BilingualField label="الكلمات المفتاحية (مفصولة بفاصلة)"
        valueAr={value.keywords_ar} valueEn={value.keywords_en}
        onAr={(v) => onChange({ keywords_ar: v })} onEn={(v) => onChange({ keywords_en: v })} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="الرابط الأساسي (Canonical URL)" className="sm:col-span-3"
          hint={!isValidUrlOrEmpty(value.canonical_url) ? <span className="text-destructive">يجب أن يبدأ بـ https://</span> : "اتركه فارغاً لاستخدام رابط الصفحة نفسها"}>
          <Input dir="ltr" value={value.canonical_url} placeholder="https://elyusr.org/programs/odhya" className="h-10 rounded-xl"
            onChange={(e) => onChange({ canonical_url: e.target.value.trim() })} />
        </Field>
        <Field label="نوع البيانات المنظمة (Schema)">
          <UiSelect className={selectCls} value={value.schema_type} onChange={(e) => onChange({ schema_type: e.target.value })}>
            <option value="">افتراضي (Service)</option>
            <option value="Service">Service</option>
            <option value="Product">Product</option>
            <option value="DonateAction">DonateAction</option>
            <option value="Event">Event</option>
          </UiSelect>
        </Field>
        <Field label="بطاقة تويتر / X">
          <UiSelect className={selectCls} value={value.twitter_card} onChange={(e) => onChange({ twitter_card: e.target.value })}>
            <option value="">افتراضي (summary_large_image)</option>
            <option value="summary_large_image">summary_large_image</option>
            <option value="summary">summary</option>
          </UiSelect>
        </Field>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5 text-xs font-bold">
            <span>noindex — منع الفهرسة</span>
            <Switch checked={value.noindex} onCheckedChange={(c) => onChange({ noindex: c })} />
          </label>
          <label className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5 text-xs font-bold">
            <span>nofollow — عدم تتبع الروابط</span>
            <Switch checked={value.nofollow} onCheckedChange={(c) => onChange({ nofollow: c })} />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-muted/20 sm:max-w-md">
        <div className="aspect-[1.91/1] w-full overflow-hidden bg-muted">
          <img src={img} alt="" className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} />
        </div>
        <div className="p-3" dir="rtl">
          <div className="text-[10px] uppercase text-muted-foreground" dir="ltr">{host}</div>
          <div className="mt-1 line-clamp-2 text-sm font-extrabold text-primary">{title}</div>
          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
    </SectionCard>
  );
}

export function GeoFields({ value, onChange, badge }: { value: SeoFormState; onChange: Patch; badge?: ReactNode }) {
  return (
    <SectionCard
      icon={<MapPin className="h-4 w-4 text-primary" />}
      title="الاستهداف الجغرافي (GEO)"
      description="وسوم geo.* لنتائج البحث المحلية."
      actions={badge}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="geo.region" hint={!isValidGeoRegion(value.geo_region) ? <span className="text-destructive">صيغة غير صحيحة. مثال: EG أو EG-DK</span> : "مثال: EG-DK"}>
          <Input dir="ltr" value={value.geo_region} placeholder="EG-DK" className="h-10 rounded-xl"
            onChange={(e) => onChange({ geo_region: normalizeGeoRegion(e.target.value) })} />
        </Field>
        <Field label="geo.placename">
          <Input value={value.geo_placename} placeholder="Mansoura, Dakahlia, Egypt" className="h-10 rounded-xl"
            onChange={(e) => onChange({ geo_placename: e.target.value })} />
        </Field>
        <Field label="geo.position (خط العرض;خط الطول)" hint={!isValidGeoPosition(value.geo_position) ? <span className="text-destructive">صيغة غير صحيحة. مثال: 31.0409;31.3785</span> : undefined}>
          <Input dir="ltr" value={value.geo_position} placeholder="31.0409;31.3785" className="h-10 rounded-xl"
            onChange={(e) => onChange({ geo_position: normalizeGeoPosition(e.target.value) })} />
        </Field>
        <Field label="اسم الموقع المعروض (geo_position_label)">
          <Input value={value.geo_position_label} placeholder="المنصورة، الدقهلية" className="h-10 rounded-xl"
            onChange={(e) => onChange({ geo_position_label: e.target.value })} />
        </Field>
      </div>
    </SectionCard>
  );
}

export function AiFields({
  value,
  onChange,
  badge,
  nameAr,
  nameEn,
  descAr,
  showFaq = true,
}: {
  value: SeoFormState;
  onChange: Patch;
  badge?: ReactNode;
  nameAr: string;
  nameEn: string;
  descAr: string;
  /** false where the page FAQ comes from the FAQ screen (programs): only the AI summary is edited here. */
  showFaq?: boolean;
}) {
  /** Local template suggestion (no AI call): fills only the empty fields. */
  const suggest = () => {
    const p: Partial<SeoFormState> = {};
    if (!value.ai_summary_ar && nameAr) {
      p.ai_summary_ar = `${nameAr} من مؤسسة اليسر الخيرية: ${descAr || "مبادرة خيرية موثقة لدعم الأسر الأكثر احتياجاً في الدقهلية ومحافظات مصر."}`.slice(0, 320);
    }
    if (!value.ai_summary_en && (nameEn || nameAr)) {
      p.ai_summary_en = `${nameEn || nameAr} by Al-Yusr Charity Foundation: a documented charitable initiative supporting families in need in Dakahlia and across Egypt.`;
    }
    if (showFaq && value.ai_faq_ar.length === 0 && nameAr) {
      p.ai_faq_ar = [
        { question: `ما هو هدف ${nameAr}؟`, answer: descAr || "" },
        { question: "كيف أضمن وصول تبرعي؟", answer: "توثق مؤسسة اليسر التنفيذ بالصور والفيديو وتصلك التقارير بعد التنفيذ." },
      ];
    }
    onChange(p);
  };
  return (
    <SectionCard
      icon={<Sparkles className="h-4 w-4 text-primary" />}
      title={showFaq ? "ملخص وأسئلة لمحركات الذكاء الاصطناعي (AEO)" : "ملخص لمحركات الذكاء الاصطناعي (AEO)"}
      description={showFaq ? "ملخص قصير وأسئلة شائعة تُقرأ من ChatGPT وGoogle AI. الأسئلة تُحفظ كقائمة {question, answer}." : "ملخص قصير بيقراه ChatGPT وGoogle AI عن البرنامج."}
      actions={
        <div className="flex items-center gap-2">
          {badge}
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1 rounded-xl text-xs" onClick={suggest} disabled={!nameAr}>
            <Wand2 className="h-3.5 w-3.5" /> اقتراح تلقائي للحقول الفارغة
          </Button>
        </div>
      }
    >
      <BilingualField label="ملخص AI" multiline rows={3} maxLength={320}
        valueAr={value.ai_summary_ar} valueEn={value.ai_summary_en}
        onAr={(v) => onChange({ ai_summary_ar: v })} onEn={(v) => onChange({ ai_summary_en: v })} />
      {showFaq && <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Field label="أسئلة شائعة (عربي)">
          <FaqListEditor dir="rtl" value={value.ai_faq_ar} onChange={(v) => onChange({ ai_faq_ar: v })} />
        </Field>
        <Field label="FAQ (English)">
          <FaqListEditor dir="ltr" value={value.ai_faq_en} onChange={(v) => onChange({ ai_faq_en: v })} />
        </Field>
      </div>}
    </SectionCard>
  );
}
