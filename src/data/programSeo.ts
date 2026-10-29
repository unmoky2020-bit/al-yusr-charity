/**
 * Search titles/descriptions for program pages. Order: the dashboard's SEO tab (meta_title_* /
 * meta_description_*) → these keyword-led defaults → "<name> — مؤسسة اليسر".
 * Titles stay ≤ 60 characters and lead with the phrase people actually search for.
 */
import type { ProgramContent } from "@/data/programs";

type SeoText = { title: string; description: string };

export const PROGRAM_SEO_DEFAULTS: Record<string, SeoText> = {
  odhya: {
    title: "صك أضحية 2026 بالمنصورة — السعر والضمان | اليسر",
    description: "احجز صك أضحية 2026 من مؤسسة اليسر بالمنصورة: معاينة بيطرية قبل الذبح، توزيع على أسر الدقهلية، وتوثيق بالصور والفيديو لكل متبرع.",
  },
  zakat: {
    title: "زكاة المال 2026 — احسب وادفع زكاتك أونلاين | اليسر",
    description: "ادفع زكاة مالك وزكاة التجارة أونلاين لمؤسسة مشهرة بالمنصورة، وتوصل لمستحقيها في الدقهلية بإيصال رسمي وتقرير بالصرف.",
  },
  orphans: {
    title: "كفالة يتيم شهرية بالمنصورة — ابدأ كفالتك | اليسر",
    description: "اكفل يتيمًا شهريًا في المنصورة والدقهلية: مصروف وتعليم وعلاج، مع تقرير دوري عن الطفل وإيصال إلكتروني لكل دفعة.",
  },
  box: {
    title: "كرتونة رمضان والغذاء الشهري 2026 للأسر | اليسر",
    description: "تبرع بكرتونة غذاء شهرية أو كرتونة رمضان لأسرة محتاجة في الدقهلية، تسليم لحد البيت بكرامة وتوثيق بالصور.",
  },
  water: {
    title: "تبرع بوصلة مياه لبيت محتاج — صدقة جارية | اليسر",
    description: "صدقة جارية: وصّل مياه نظيفة لبيت في قرى الدقهلية. نحدد البيت، ننفّذ الوصلة، ونبعتلك صور قبل وبعد.",
  },
  bride: {
    title: "تجهيز عروسة يتيمة ومحتاجة بالمنصورة | اليسر",
    description: "ساهم في تجهيز عروسة من أسرة محتاجة في الدقهلية: أجهزة وأثاث ومفروشات، مع توثيق التسليم.",
  },
  education: {
    title: "كفالة طالب ومصاريف مدرسة للأسر المحتاجة | اليسر",
    description: "ادفع مصروفات مدرسة أو أدوات أو دروس لطالب من أسرة محتاجة في الدقهلية، وتابع أثر تبرعك بتقرير.",
  },
  treatment: {
    title: "تبرع لعلاج المرضى غير القادرين بالدقهلية | اليسر",
    description: "ساهم في علاج حالات مرضية حقيقية بالدقهلية: أدوية وتحاليل وعمليات، بعد بحث ميداني وتوثيق كل حالة.",
  },
  shelter: {
    title: "تسقيف وترميم بيوت الأسر المحتاجة | حملة ستر",
    description: "ساهم في تسقيف وترميم بيوت الأسر الأكثر احتياجًا في قرى الدقهلية، مع صور قبل وبعد التنفيذ.",
  },
  markoun: {
    title: "التبرع بالأثاث المستعمل بالمنصورة — استلام مجاني",
    description: "عندك أثاث أو أجهزة أو ملابس مش مستخدمة؟ مندوب اليسر يستلمها من بيتك مجانًا في الدقهلية ويوصلها لأسرة محتاجة.",
  },
  kitchen: {
    title: "إطعام الطعام — وجبات ساخنة للأسر المحتاجة | اليسر",
    description: "تبرع بوجبات ساخنة من مطبخ اليسر للأسر والصائمين في الدقهلية، بتوزيع موثّق يوميًا.",
  },
  prosthetics: {
    title: "تبرع بطرف صناعي لمريض غير قادر | اليسر",
    description: "ساهم في تركيب أطراف صناعية لمرضى غير قادرين في الدقهلية، بعد تقييم طبي ومتابعة حتى الحركة.",
  },
};

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…");

export function programSeo(program: ProgramContent, lang: "ar" | "en"): SeoText {
  const c = program[lang];
  const fromDashboard = program.seo?.[lang];
  const preset = lang === "ar" ? PROGRAM_SEO_DEFAULTS[program.slug] : undefined;
  const brand = lang === "ar" ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity";
  return {
    title: fromDashboard?.title || preset?.title || `${c.name} — ${brand}`,
    description: clip(fromDashboard?.description || preset?.description || c.desc, 160),
  };
}
