import { CheckCircle2, Search, XCircle } from "lucide-react";
import { SectionCard } from "@/components/admin/programs/FormKit";
import { caseShareUrl } from "./caseShareUrl";

/** Same title / description the public case page sends (src/pages/site/CaseDetail.tsx). */
const seoTitle = (title: string, code: string) => `${title} — حالة ${code} | اليسر`;
const seoDescription = (story: string, title: string) => (story || title).slice(0, 158);

const clamp = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);

/**
 * How the case looks in Google / social previews, and a checklist of what makes an urgent case
 * spread and get indexed quickly. All derived from the case fields (cases have no separate SEO columns).
 */
export function CaseSeoPanel({
  code,
  title,
  story,
  coverImage,
  status,
  categoryId,
  hasLocation,
  updatesCount,
  mediaCount,
}: {
  code: string;
  title: string;
  story: string;
  coverImage: string;
  status: string;
  categoryId: string | number;
  hasLocation: boolean;
  updatesCount: number;
  mediaCount: number;
}) {
  const fullTitle = seoTitle(title, code);
  const description = seoDescription(story, title);
  const checks: { ok: boolean; label: string; tip: string }[] = [
    { ok: ["approved", "completed"].includes(status), label: "الحالة معتمدة", tip: "الصفحة مش بتظهر للزوار ولا لجوجل غير بعد الاعتماد." },
    { ok: title.length >= 15 && fullTitle.length <= 70, label: "عنوان واضح ومش طويل", tip: "اكتب الاحتياج نفسه في العنوان (مثلاً: «عملية قلب مفتوح لطفل عنده 6 سنين»)." },
    { ok: story.length >= 300, label: "قصة 300 حرف على الأقل", tip: "جوجل وبوتات الذكاء الاصطناعي بتعتمد على النص؛ اذكر الاحتياج والمبلغ والمكان وإزاي التبرع هيتصرف." },
    { ok: !!coverImage, label: "صورة رئيسية", tip: "الصورة هي اللي بتظهر في واتساب وفيسبوك؛ من غيرها المشاركة بتجيب تفاعل أقل." },
    { ok: !!categoryId, label: "تصنيف", tip: "التصنيف بيربط الحالة بصفحات المحاور والبرامج." },
    { ok: hasLocation, label: "المحافظة والمدينة", tip: "المكان بيظهر في البحث المحلي (مثلاً «حالات عاجلة المنصورة»)." },
    { ok: updatesCount + mediaCount > 0, label: "صور أو تحديثات من الميدان", tip: "التحديثات بتزوّد الثقة وبتخلي جوجل يرجع للصفحة أسرع." },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <SectionCard
      icon={<Search className="h-4 w-4 text-primary" />}
      title="الظهور في جوجل والسوشيال"
      description="الحالة بتدخل خريطة الموقع وبيتبعت إشعار لمحركات البحث تلقائياً أول ما تتعتمد. العنوان والوصف بيتاخدوا من بيانات الحالة نفسها."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background p-4" dir="rtl">
          <p className="truncate text-xs text-emerald-700 dark:text-emerald-400" dir="ltr">{caseShareUrl(code)}</p>
          <p className="mt-1 text-base font-bold leading-snug text-[#1a0dab] dark:text-blue-300">{clamp(fullTitle, 60)}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{clamp(description, 158) || "—"}</p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-bold">
            <span>جاهزية الصفحة</span>
            <span className={score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-destructive"}>{score}%</span>
          </div>
          <ul className="space-y-1.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2 rounded-lg bg-muted/30 p-2 text-xs">
                {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                <span>
                  <b>{c.label}</b>
                  {!c.ok && <span className="block text-muted-foreground">{c.tip}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}
