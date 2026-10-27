import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Pillar = { t: string; d: string; checks: string[] };

const CONTENT = {
  ar: {
    eyebrow: "لماذا اليسر؟",
    title: "لسنا مجرد مؤسسة مشهرة رسمياً",
    lead: "الإشهار الرسمي هو نقطة البداية فقط. ما يميز اليسر منظومة عمل متكاملة تضمن أن تصل كل صدقة إلى من يستحقها، وأن ترى بنفسك أين ذهب تبرعك.",
    pillars: [
      {
        t: "منظومة صرف بأعلى كفاءة",
        d: "كل جنيه يُصرف وفق نظام واضح يضمن وصوله لمستحقه دون هدر.",
        checks: ["دراسة ميدانية لكل حالة قبل الصرف", "أولوية للأشد احتياجاً وفق معايير معتمدة", "متابعة الأثر بعد التسليم"],
      },
      {
        t: "مشاريع خيرية تُنمّي الخير",
        d: "نستثمر في مشاريع وقفية وإنتاجية تعود أرباحها على الصدقات، فيتضاعف أثر تبرعك.",
        checks: ["أرباح المشاريع تُصرف على الصدقات", "موارد مستدامة لا تعتمد على التبرعات وحدها", "استمرار العطاء على مدار العام"],
      },
      {
        t: "شفافية كاملة من الإيصال إلى الاستلام",
        d: "تتابع تبرعك خطوة بخطوة منذ لحظة الدفع حتى وصوله إلى يد المستحق.",
        checks: ["إيصال رسمي برقم تتبع فور التبرع", "تحديث بكل مرحلة من مراحل التنفيذ", "توثيق التسليم بالصور والفيديو"],
      },
    ] as Pillar[],
    trackerLabel: "مثال توضيحي لتتبع تبرع",
    trackerRef: "قيمة التبرع",
    stages: ["استلام التبرع وإصدار الإيصال", "التحقق الميداني من الحالة", "تنفيذ التبرع", "التسليم موثقاً بالصور"],
    statusDone: "مكتمل",
    statusNow: "جارٍ",
    cta: "تتبع تبرعك الآن",
  },
  en: {
    eyebrow: "Why Al-Yusr?",
    title: "More than an officially registered NGO",
    lead: "Registration is only the starting point. What sets Al-Yusr apart is a complete system that makes sure every gift reaches the person who needs it, and lets you see exactly where it went.",
    pillars: [
      {
        t: "Spending at maximum efficiency",
        d: "Every pound follows a clear process that gets it to the right person without waste.",
        checks: ["A field assessment of every case before spending", "Priority for the most in need, by set criteria", "Impact follow-up after delivery"],
      },
      {
        t: "Charitable projects that grow the good",
        d: "We invest in endowment and productive projects whose profits fund charity, multiplying your impact.",
        checks: ["Project profits are spent on charity", "Sustainable income beyond donations alone", "Giving that continues all year"],
      },
      {
        t: "Full transparency, receipt to delivery",
        d: "Follow your gift step by step, from payment to the family's hands.",
        checks: ["An official receipt with a tracking number", "An update at every stage", "Delivery documented with photo and video"],
      },
    ] as Pillar[],
    trackerLabel: "Example donation tracker",
    trackerRef: "Amount",
    stages: ["Gift received, receipt issued", "Case verified in the field", "Gift carried out", "Delivery documented with photos"],
    statusDone: "Done",
    statusNow: "In progress",
    cta: "Track your donation",
  },
};

/** Animated check: the tick draws itself once the list is in view. */
const Tick = ({ delay }: { delay: number }) => (
  <svg viewBox="0 0 24 24" className="whyus-tick h-6 w-6 shrink-0" aria-hidden style={{ ["--d" as string]: `${delay}ms` }}>
    <circle cx="12" cy="12" r="11" className="whyus-tick-bg" />
    <path d="M7 12.5l3.2 3.2L17 9" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="whyus-tick-path" />
  </svg>
);

export const WhyUsChecklist = ({ isRTL }: { isRTL: boolean }) => {
  const c = isRTL ? CONTENT.ar : CONTENT.en;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const fmt = (n: number) => n.toLocaleString(isRTL ? "ar-EG" : "en-US");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let tickIndex = 0;

  return (
    <section ref={ref} id="why-us" data-in={inView || undefined} className="whyus pattern-programs relative scroll-mt-24 py-16 md:py-24">
      <div className="container relative mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black text-accent">{c.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-primary md:text-4xl lg:text-5xl">{c.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 md:text-lg">{c.lead}</p>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          {/* Checklist */}
          <ol className="space-y-5">
            {c.pillars.map((p, i) => (
              <li key={p.t} className="rounded-2xl border border-border bg-card p-5 sm:p-7">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm font-black tabular-nums text-accent">{fmt(i + 1).padStart(2, isRTL ? "٠" : "0")}</span>
                  <h3 className="text-xl font-black text-primary sm:text-2xl">{p.t}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base">{p.d}</p>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-1">
                  {p.checks.map((ck) => {
                    const d = 150 + tickIndex++ * 110;
                    return (
                      <li key={ck} className="flex items-center gap-3 text-sm font-bold text-primary sm:text-base">
                        <Tick delay={d} />
                        <span>{ck}</span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>

          {/* Tracker visual: what "transparency" actually looks like */}
          <div className="lg:sticky lg:top-28">
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-card sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-primary-foreground/15 pb-4">
                <span className="text-xs font-bold text-primary-foreground/70">{c.trackerLabel}</span>
                <span className="font-mono text-xs font-black text-secondary" dir="ltr">YSR-2026-0148</span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-xs text-primary-foreground/70">{c.trackerRef}</div>
                  <div className="mt-1 text-2xl font-black tabular-nums">{fmt(1000)} {isRTL ? "جنيه" : "EGP"}</div>
                </div>
                <div className="text-end text-xs text-primary-foreground/70">{isRTL ? "كفالة أسرة · الدقهلية" : "Family support · Dakahlia"}</div>
              </div>

              <ol className="relative mt-6">
                <span aria-hidden className="absolute bottom-3 start-[11px] top-3 w-[2px] bg-primary-foreground/15" />
                <span aria-hidden className="whyus-track-fill absolute start-[11px] top-3 w-[2px] origin-top bg-secondary" style={{ height: "calc(66% - 12px)" }} />
                {c.stages.map((s, i) => {
                  const state = i < 2 ? "done" : i === 2 ? "now" : "todo";
                  return (
                    <li key={s} className="whyus-stage relative flex items-center gap-4 pb-5 last:pb-0" style={{ ["--d" as string]: `${300 + i * 260}ms` }}>
                      <span
                        aria-hidden
                        className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                          state === "done" ? "border-secondary bg-secondary" : state === "now" ? "border-secondary bg-primary" : "border-primary-foreground/30 bg-primary"
                        }`}
                      >
                        {state === "done" && (
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-secondary-foreground"><path d="M6 12.5l4 4L18 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                        {state === "now" && <span className="h-2 w-2 rounded-full bg-secondary" />}
                      </span>
                      <span className={`flex-1 text-sm font-bold ${state === "todo" ? "text-primary-foreground/55" : ""}`}>{s}</span>
                      {state !== "todo" && (
                        <span className={`text-[11px] font-black ${state === "done" ? "text-secondary" : "text-primary-foreground/80"}`}>
                          {state === "done" ? c.statusDone : c.statusNow}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            <Link
              to="/donate/track"
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary text-sm font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {c.cta}
              <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
