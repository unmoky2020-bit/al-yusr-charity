import { Link } from "react-router-dom";
import { HandCoins, Sprout, type LucideIcon } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

/**
 * Al-Yusr projects come in two kinds:
 *  - service: the project offers a paid service and its income is spent on the foundation's work;
 *  - impact:  the project exists for its effect on the community (no income expected).
 * Some projects are both (e.g. nurseries: modest fees + raising a generation).
 */
export type ProjectKindId = "service" | "impact";

export const PROJECT_KINDS: Record<ProjectKindId, { icon: LucideIcon; ar: string; en: string; descAr: string; descEn: string; examplesAr: string; examplesEn: string }> = {
  service: {
    icon: HandCoins,
    ar: "مشاريع خدمية تُدرّ موارد",
    en: "Service projects that generate income",
    descAr: "مشاريع تقدّم خدمة حقيقية للناس بمقابل مناسب، ودخلها يرجع يتصرف على أنشطة المؤسسة وبرامجها الخيرية. يعني تبرعك فيها بيفضل يشتغل ويرجع بخير أكتر كل سنة.",
    descEn: "Projects that offer a real service at a fair price; their income is spent back on the foundation's charitable programmes, so your gift keeps working year after year.",
    examplesAr: "مثل: حضانات اليسر، المزرعة الوقفية",
    examplesEn: "e.g. Al-Yusr nurseries, the Waqf farm",
  },
  impact: {
    icon: Sprout,
    ar: "مشاريع أثرها على المجتمع",
    en: "Projects built for community impact",
    descAr: "مشاريع هدفها الأول الأثر: تيسير نقل الموتى وتكريمهم، مساندة الناس وقت الاحتياج، مياه نظيفة لكل بيت، وتربية جيل متعلّم حافظ للقرآن.",
    descEn: "Projects whose first aim is impact: dignified transport of the deceased, standing with people in need, clean water for every home, and raising an educated generation that memorises the Qur'an.",
    examplesAr: "مثل: تكريم الإنسان، سقيا الماء، دور التحفيظ",
    examplesEn: "e.g. Takrim, clean water, Qur'an houses",
  },
};

/** Small note on a project landing page saying which kind the project is. */
export const ProjectKindNote = ({ kinds, noteAr, noteEn }: { kinds: ProjectKindId[]; noteAr?: string; noteEn?: string }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <aside className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6" aria-label={isAr ? "نوع المشروع" : "Project type"}>
      <p className="text-xs font-black text-secondary">{isAr ? "نوع المشروع" : "Project type"}</p>
      <div className={`mt-3 grid gap-3 ${kinds.length > 1 ? "md:grid-cols-2" : ""}`}>
        {kinds.map((k) => {
          const kind = PROJECT_KINDS[k];
          const Icon = kind.icon;
          return (
            <div key={k} className="flex items-start gap-3 rounded-2xl bg-muted/40 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span>
              <div>
                <h3 className="text-sm font-black text-primary sm:text-base">{isAr ? kind.ar : kind.en}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{isAr ? kind.descAr : kind.descEn}</p>
              </div>
            </div>
          );
        })}
      </div>
      {(noteAr || noteEn) && <p className="mt-3 text-sm leading-relaxed text-foreground/80">{isAr ? noteAr : noteEn}</p>}
      <Link to="/projects#project-kinds" className="mt-3 inline-block text-xs font-bold text-secondary hover:underline">
        {isAr ? "اعرف أكتر عن أنواع مشاريع اليسر" : "More about Al-Yusr project types"}
      </Link>
    </aside>
  );
};
