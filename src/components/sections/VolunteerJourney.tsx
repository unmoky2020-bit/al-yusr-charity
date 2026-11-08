import { useState } from "react";
import { ClipboardList, ShieldCheck, Megaphone, MapPin, Award, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

type Step = { I: typeof ClipboardList; ar: { t: string; d: string }; en: { t: string; d: string } };

const STEPS: Step[] = [
  { I: ClipboardList, ar: { t: "سجّل بياناتك", d: "املأ نموذج التطوع: مهاراتك، مدينتك، وأوقاتك المتاحة." },
                       en: { t: "Sign up", d: "Fill the volunteer form: skills, city, availability." } },
  { I: ShieldCheck,   ar: { t: "مراجعة الفريق", d: "نراجع طلبك خلال 48 ساعة ونعتمدك في قاعدة المتطوعين." },
                       en: { t: "Team review", d: "We review and approve you within 48h." } },
  { I: Megaphone,     ar: { t: "اختر حملة", d: "تابع الحملات المفتوحة (عيد، رمضان، قوافل) وقدّم على ما يناسبك." },
                       en: { t: "Pick a campaign", d: "Browse open drives (Eid, Ramadan, convoys) and apply." } },
  { I: MapPin,        ar: { t: "تأكيد المناوبة", d: "نحدّد لك دورك وموعد مناوبتك ومكانها، ونرسل إليك شرحًا كاملًا قبل يوم العمل." },
                       en: { t: "Get your shift", d: "We assign your role, shift, and location with a full briefing." } },
  { I: Award,         ar: { t: "نفّذ واترك أثرًا", d: "احضر وساعد ووثّق، ونحن نسجّل ساعاتك ونمنحك شهادة تقدير." },
                       en: { t: "Show up & impact", d: "Attend, help, and we log your hours + a certificate." } },
];

export const VolunteerJourney = () => {
  const { lang } = useLang();
  const [active, setActive] = useState(0);
  const isRTL = lang === "ar";

  return (
    <section className="bg-card py-12 md:py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <header className="text-center">
          <span className="inline-block rounded-full bg-secondary/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary">
            {isRTL ? "رحلة المتطوع" : "Volunteer journey"}
          </span>
          <h2 className="mt-3 text-3xl font-black text-primary md:text-4xl">
            {isRTL ? "خمس خطوات تفصلك عن الميدان" : "Five steps to the field"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {isRTL
              ? "من لحظة التسجيل حتى استلام شهادتك — كل خطوة واضحة، والفريق معك فيها."
              : "From signup to certificate — every step is clear and supported."}
          </p>
        </header>

        {/* Timeline */}
        <ol className="relative mt-10 grid gap-4 md:grid-cols-5">
          <div className="absolute start-6 top-6 hidden h-1 w-[calc(100%-3rem)] rounded-full bg-secondary/30 md:block" aria-hidden />
          <div
            className="absolute start-6 top-6 hidden h-1 rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all md:block"
            style={{ width: `calc((100% - 3rem) * ${active / (STEPS.length - 1)})` }}
            aria-hidden
          />
          {STEPS.map((s, i) => {
            const Icon = s.I;
            const on = i <= active;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative z-10 flex w-full flex-row items-center gap-3 rounded-2xl border p-3 text-start transition md:flex-col md:items-stretch md:gap-2 md:p-4 ${
                    i === active
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border bg-muted/30 hover:border-secondary"
                  }`}
                  aria-current={i === active}
                >
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-base font-black md:mx-auto ${
                      on ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 md:text-center">
                    <div className={`text-[10px] font-extrabold uppercase tracking-wider ${on ? "text-accent" : "text-muted-foreground"}`}>
                      {isRTL ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                    </div>
                    <div className="mt-0.5 truncate text-sm font-extrabold text-primary md:whitespace-normal">
                      {s[lang].t}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Active step detail */}
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-primary/5 to-secondary/10 p-6 md:p-8">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-accent">
                {isRTL ? `الخطوة ${active + 1} من ${STEPS.length}` : `Step ${active + 1} of ${STEPS.length}`}
              </div>
              <h3 className="mt-1 text-2xl font-black text-primary">{STEPS[active][lang].t}</h3>
              <p className="mt-2 text-sm leading-7 text-foreground/80">{STEPS[active][lang].d}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setActive(Math.max(0, active - 1))}
                disabled={active === 0}
                className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary shadow-soft transition disabled:opacity-40"
                aria-label="prev"
              >
                <ArrowRight className={isRTL ? "h-4 w-4" : "h-4 w-4 rotate-180"} />
              </button>
              <button
                onClick={() => setActive(Math.min(STEPS.length - 1, active + 1))}
                disabled={active === STEPS.length - 1}
                className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition disabled:opacity-40"
                aria-label="next"
              >
                <ArrowRight className={isRTL ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
