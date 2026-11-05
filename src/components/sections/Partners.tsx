import { Building2, Heart, ShieldCheck, Sprout, Users, BadgeCheck } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

export const Partners = () => {
  const { lang } = useLang();
  const partners = [
    { icon: Building2, ar: "وزارة التضامن", en: "Ministry of Solidarity" },
    { icon: ShieldCheck, ar: "نقابة المحامين", en: "Bar Association" },
    { icon: Sprout, ar: "مديرية الزراعة", en: "Agriculture Directorate" },
    { icon: Users, ar: "جامعة المنصورة", en: "Mansoura University" },
    { icon: Heart, ar: "مستشفى المنصورة", en: "Mansoura Hospital" },
    { icon: BadgeCheck, ar: "بنك الطعام المصري", en: "Egyptian Food Bank" },
  ];
  return (
    <section className="bg-muted/40 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-extrabold text-primary">
            {lang === "ar" ? "شركاء النجاح" : "Our partners"}
          </span>
          <h2 className="mt-3 text-3xl font-black text-primary md:text-4xl">
            {lang === "ar" ? "نبني الأثر مع شركاء نثق بهم" : "We build impact with trusted partners"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            {lang === "ar" ? "تعاوننا مع جهات حكومية وأكاديمية ومدنية يضمن وصول كل تبرع إلى مستحقه." : "Our partnerships with government, academic and civic bodies ensure every donation reaches its rightful recipient."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {partners.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-soft">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary/15 text-primary transition group-hover:bg-secondary group-hover:text-secondary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-extrabold text-primary md:text-sm">{p[lang]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
