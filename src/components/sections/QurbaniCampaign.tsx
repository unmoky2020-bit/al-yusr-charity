import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, Beef, Users, Sparkles, ShieldCheck, MapPin, Truck, Stethoscope, Eye, BookOpen, BadgeCheck, Clock, Target } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { Button } from "@/components/ui/button";
import qurbaniTrustedSource from "@/assets/qurbani-meat-quality-flyer.jpg";
import qurbaniMeatQuality from "@/assets/qurbani-meat-quality.webp";
// Fallback tiny transparent PNG to avoid failing the build if the
// original `qurbani-pricing-2026.png` asset is missing during CI/build.
// This keeps the ImageMarquee runnable and will be replaced at runtime
// if the real image exists in the assets folder or public path.
const qurbaniPricing = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQImWNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
import iconCowCard from "@/assets/poster-meat.webp";
import iconSheepCard from "@/assets/poster-meat.webp";
import iconSharesCard from "@/assets/brand-can.png";
import qurbaniCowSheep from "@/assets/qurbani-cow-sheep.webp";
import qurbaniMeatTrays from "@/assets/qurbani-meat-trays.jpg";
import qurbaniHeroTrays from "@/assets/qurbani-hero-trays.webp";
import qurbaniTrustedSrc from "@/assets/qurbani-trusted-source.webp";
import farmHero from "@/assets/farm-hero.jpg";
import meatFlyer from "@/assets/meat-flyer.webp";
import odhyaFlyer from "@/assets/odhya-flyer.png";
import yusrQurbaniBanner from "@/assets/yusr-qurbani-banner.webp";
import { ImageMarquee } from "@/components/ui/image-marquee";

import { QURBANI_SEASON, EID_TIME as EID } from "@/data/qurbaniSeason";

/** Qurbani campaign — goal trackers + countdown. Season dates live in src/data/qurbaniSeason.ts. */

const GOALS = [
  { id: "cows",    img: iconCowCard,    ar: "عجول كاملة",   en: "Whole cows",     current: 14, target: 30,  unit: { ar: "عجل", en: "cow" } },
  { id: "sheep",   img: iconSheepCard,  ar: "خراف",         en: "Sheep",          current: 86, target: 200, unit: { ar: "خروف", en: "sheep" } },
  { id: "shares",  img: iconSharesCard, ar: "صكوك أضحية",   en: "Qurbani shares", current: 312, target: 800,unit: { ar: "صك", en: "share" } },
] as const;

const useCountdown = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, EID - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
};

export const QurbaniCampaign = () => {
  const { lang } = useLang();
  const { d, h, m, s } = useCountdown();
  const isRTL = lang === "ar";
  const sectionRef = useRef<HTMLElement | null>(null);

  // Unified analytics helper for Qurbani CTAs
  const track = useCallback(
    (
      event: string,
      payload: { source: string; target?: string; label?: string; fbEvent?: string }
    ) => {
      const w = window as any;
      w.dataLayer?.push?.({ event, ...payload });
      w.gtag?.("event", event, payload);
      // Map our internal event to Meta's standard events for richer attribution
      const fb = payload.fbEvent ?? "Lead";
      w.fbq?.("track", fb, { content_name: payload.label ?? payload.source, content_category: "qurbani" });
      w.fbq?.("trackCustom", event, payload);
    },
    []
  );

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e.isIntersecting || fired) return;
        fired = true;
        const w = window as any;
        const rect = node.getBoundingClientRect();
        const payload = {
          source: "qurbani-campaign",
          program: "odhya",
          position: Math.round(rect.top + window.scrollY),
          dir: isRTL ? "rtl" : "ltr",
          path: window.location.pathname,
        };
        w.dataLayer?.push?.({ event: "qurbani_campaign_view", ...payload });
        w.gtag?.("event", "qurbani_campaign_view", payload);
        w.fbq?.("track", "PageView", { content_name: "qurbani-campaign", content_category: "qurbani" });
        w.fbq?.("trackCustom", "QurbaniCampaignView", payload);
        io.disconnect();
      },
      { threshold: 0.35 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [isRTL]);

  return (
    <section
      ref={sectionRef}
      id="qurbani"
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-gradient-to-b from-secondary/15 via-background to-background py-12 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-gradient-to-r from-secondary/15 via-accent/10 to-secondary/15 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-accent shadow-soft backdrop-blur">
            <Sparkles className="h-3 w-3" /> {isRTL ? `حملة العيد الكبير ${QURBANI_SEASON.year}` : `Eid al-Adha ${QURBANI_SEASON.year} campaign`}
          </span>
          <h2 className="mt-3 text-2xl font-black leading-tight text-primary sm:text-3xl md:text-5xl">
            {isRTL ? "صك أضحيتك معانا قبل ما يخلص الوقت" : "Reserve your Qurbani before time runs out"}
          </h2>
          <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground md:mt-3 md:text-base">
            {isRTL
              ? "هدفنا نوصل لحوم العيد لـ 800 أسرة في الدقهلية. كل صك بيتعاين قبل الذبح ويتوثّق بالصور والفيديو."
              : "Our goal: deliver Eid meat to 800 families in Dakahlia. Every share is inspected pre-slaughter & documented."}
          </p>
        </div>

        {/* Premium countdown — gold-bordered tiles with separator dots, urgency pill */}
        <div className="mx-auto mt-6 max-w-md sm:max-w-lg">
          <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-extrabold text-accent">
            <Clock className="h-3.5 w-3.5 animate-pulse" />
            <span>{isRTL ? "الوقت بيجري… العدد محدود" : "Time is running — limited spots"}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center sm:gap-2.5" dir="ltr">
            {[
              { v: d, ar: "يوم",   en: "days" },
              { v: h, ar: "ساعة",  en: "hrs" },
              { v: m, ar: "دقيقة", en: "min" },
              { v: s, ar: "ثانية", en: "sec" },
            ].map((u, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-secondary/40 bg-gradient-to-br from-primary via-primary to-[hsl(152_65%_8%)] p-2.5 shadow-cta sm:p-3.5"
              >
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />
                <span aria-hidden className="pointer-events-none absolute -top-6 -end-6 h-12 w-12 rounded-full bg-secondary/15 blur-xl" />
                <div className="relative text-2xl font-black tabular-nums text-secondary drop-shadow sm:text-3xl md:text-4xl">
                  {String(u.v).padStart(2, "0")}
                </div>
                <div className="relative mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-primary-foreground/80 sm:text-[10px]">
                  {u[lang]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 md:mt-10 md:mx-auto md:max-w-xl">
          <Button
            asChild
            size="lg"
            className="h-12 w-full bg-orange-grad text-base font-black text-accent-foreground shadow-cta transition-transform duration-150 hover:opacity-95 active:scale-[.98]"
          >
            <Link
              to="/donate?program=odhya"
              data-cta="qurbani-reserve"
              onClick={() =>
                track("qurbani_reserve_click", {
                  source: "qurbani-campaign-top",
                  target: "/donate?program=odhya",
                  label: isRTL ? "احجز صك أضحية" : "Reserve Qurbani share",
                  fbEvent: "InitiateCheckout",
                })
              }
            >
              <Heart className="h-5 w-5" />
              {isRTL ? "احجز صك أضحية الآن" : "Reserve a Qurbani share"}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 w-full border-2 border-secondary/50 bg-card text-base font-black text-primary transition-transform duration-150 hover:bg-secondary/10 active:scale-[.98]"
          >
            <Link
              to="/qurbani"
              data-cta="qurbani-details"
              onClick={() =>
                track("qurbani_details_click", {
                  source: "qurbani-campaign-top",
                  target: "/qurbani",
                  label: isRTL ? "تفاصيل صك الأضحية" : "Qurbani details",
                  fbEvent: "ViewContent",
                })
              }
            >
              {isRTL ? "تفاصيل صك الأضحية" : "Qurbani details"}
            </Link>
          </Button>
        </div>

        {/* Trust strip — premium pill badges with gold ring */}
        <ul className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-2 text-[11px] font-extrabold text-primary md:mt-8 md:grid-cols-4 md:text-xs">
          {[
            { icon: ShieldCheck, ar: "معاينة قبل الذبح",  en: "Pre-slaughter check" },
            { icon: Beef,        ar: "جودة لحم مضمونة",   en: "Guaranteed quality" },
            { icon: MapPin,      ar: "توزيع داخل الدقهلية", en: "Delivered in Dakahlia" },
            { icon: Truck,       ar: "توثيق صور وفيديو",   en: "Photo & video proof" },
          ].map(({ icon: Icon, ar, en }) => (
            <li
              key={en}
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-secondary/40 bg-gradient-to-r from-secondary/10 via-secondary/15 to-accent/10 px-3 py-2 text-center shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary hover:shadow-cta"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-secondary ring-1 ring-secondary/50 transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span>{isRTL ? ar : en}</span>
            </li>
          ))}
        </ul>

        {/* Why Al-Yusr Qurbani — quality pillars */}
        <div className="mx-auto mt-10 max-w-5xl rounded-3xl border border-secondary/30 bg-card p-5 shadow-card sm:rounded-[2rem] md:mt-14 md:p-10">
          <div className="grid items-center gap-6 md:grid-cols-[0.9fr_1.1fr] md:gap-10">
            <div className="order-2 md:order-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary">
                <BadgeCheck className="h-3 w-3" /> {isRTL ? "ليه أضحيتك عندنا غير" : "Why our Qurbani is different"}
              </span>
              <h3 className="mt-3 text-xl font-black leading-tight text-primary sm:text-2xl md:text-4xl">
                {isRTL ? "قبل ما تحجز صك أضحيتك… لازم تتأكد إنها صحيحة" : "Before you book — be sure your Qurbani is right"}
              </h3>
              <p className="mt-3 text-sm font-bold leading-relaxed text-muted-foreground md:text-base">
                {isRTL
                  ? "أكبر مشكلة هتقابلك كمضحي هي جودة اللحمة. عشان كده في مؤسسة اليسر بنشتغل طول السنة في مزارعنا بفريق طبي متخصص عشان نوفّرلك أضحية:"
                  : "The hardest part for any Mudahhi is meat quality. That's why Al-Yusr works year-round in its own farms with a specialised veterinary team to bring you a Qurbani that is:"}
              </p>
              <ul className="mt-4 space-y-2 text-sm font-extrabold text-primary md:text-base">
                {[
                  { ar: "مطابقة للشريعة الإسلامية", en: "Sharia-compliant" },
                  { ar: "مضمونة 100% من مزارعنا", en: "100% from our own farms" },
                  { ar: "جودة لحم ممتازة", en: "Premium meat quality" },
                  { ar: "بصحة ممتازة وجميع التحصينات", en: "Fully vaccinated, top health" },
                  { ar: "أعلى نسبة تصفية وضمان جودة اللحم", en: "Highest yield ratio & guaranteed meat" },
                ].map((it) => (
                  <li key={it.en} className="flex items-start gap-2">
                    <span className="mt-1.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                      <BadgeCheck className="h-3 w-3" />
                    </span>
                    <span>{isRTL ? it.ar : it.en}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs font-bold text-muted-foreground sm:text-sm">
                {isRTL
                  ? "احجز صك أضحيتك عندنا دلوقتي — اليوم الأول بأسبقية الحجز والعدد محدود فعلاً."
                  : "Reserve your share now — first-day priority booking, quantities are truly limited."}
              </p>
            </div>
            <div className="order-1 md:order-2 min-w-0">
              {/* Hero shot — anchors the visual story */}
              <div className="relative w-full overflow-hidden rounded-3xl shadow-card ring-1 ring-secondary/20 aspect-[4/3] sm:aspect-[16/10] md:aspect-[5/4]">
                <img decoding="async"
                  src={qurbaniTrustedSource}
                  alt={isRTL ? "أضحيتك من مكان موثوق — مزرعة اليسر مع الطبيب البيطري" : "Your Qurbani from a trusted source — Al-Yusr farm with vet"}
                  width={1080} height={1440}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Caption chip */}
                <div className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-primary/85 px-3 py-1 text-[10.5px] font-extrabold text-primary-foreground backdrop-blur-sm">
                  <Eye className="h-3 w-3 text-secondary" />
                  {isRTL ? "من مزارعنا · مرحب بحضورك" : "From our farms · you're welcome to visit"}
                </div>
              </div>

              {/* Two-row image marquee — opposing directions */}
              <div className="mt-4 w-full max-w-full space-y-3 overflow-hidden rounded-2xl border border-secondary/15 bg-background/60 p-3">
                <ImageMarquee
                  duration={46}
                  size={132}
                  sizeSm={104}
                  gap={12}
                  rounded="2xl"
                  ring="gold"
                  shadow="soft"
                  ease="linear"
                  images={[
                    { src: qurbaniMeatQuality, alt: isRTL ? "جودة لحم ممتازة" : "Premium meat quality" },
                    { src: qurbaniCowSheep, alt: isRTL ? "عجول وخراف اليسر" : "Al-Yusr cows & sheep" },
                    { src: qurbaniMeatTrays, alt: isRTL ? "صواني لحوم جاهزة للتوزيع" : "Meat trays ready to distribute" },
                    { src: farmHero, alt: isRTL ? "مزرعة اليسر" : "Al-Yusr farm" },
                    { src: yusrQurbaniBanner, alt: isRTL ? "صكوك أضحية اليسر" : "Al-Yusr Qurbani shares" },
                  ]}
                />
                <ImageMarquee
                  reverse
                  duration={54}
                  size={132}
                  sizeSm={104}
                  gap={12}
                  rounded="2xl"
                  ring="gold"
                  shadow="soft"
                  ease="linear"
                  images={[
                    { src: qurbaniPricing, alt: isRTL ? "أسعار صكوك أضحية اليسر" : "Al-Yusr Qurbani prices" },
                    { src: qurbaniHeroTrays, alt: isRTL ? "توزيع لحوم العيد" : "Eid meat distribution" },
                    { src: qurbaniTrustedSrc, alt: isRTL ? "مصدر موثوق" : "Trusted source" },
                    { src: meatFlyer, alt: isRTL ? "بوستر لحوم" : "Meat poster" },
                    { src: odhyaFlyer, alt: isRTL ? "بوستر أضحية" : "Qurbani poster" },
                  ]}
                />
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[10.5px] font-extrabold text-muted-foreground">
                  <BadgeCheck className="h-3 w-3 text-secondary" />
                  {isRTL ? "كل الصور من ميدان العمل · من مزارع اليسر مباشرة" : "Every photo from the field · straight from Al-Yusr farms"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {[
              { icon: BookOpen,    ar: "مطابقة للشريعة الإسلامية", en: "Sharia-compliant",   d_ar: "ذبح شرعي بحضور علماء وتوثيق كامل لكل صك.", d_en: "Halal slaughter under scholar supervision with full documentation per share." },
              { icon: Beef,        ar: "جودة لحم ممتازة",          en: "Premium meat quality", d_ar: "نفس اللحمة اللي بتشتريها لبيتك — تربية حديثة وأعلى نسبة تصفية.", d_en: "Same quality you'd buy for your own family — modern breeding & top yield ratio." },
              { icon: Stethoscope, ar: "فريق طبي وتحصينات كاملة",  en: "Full veterinary care", d_ar: "أطباء بيتابعوا التغذية والتحصينات على مدار السنة.", d_en: "Vets follow nutrition and vaccination all year round." },
              { icon: Eye,         ar: "تشوف الذبح بنفسك",         en: "Witness the slaughter", d_ar: "مرحب بحضورك يوم العيد لمتابعة أضحيتك خطوة بخطوة.", d_en: "You're welcome to attend on Eid day and follow your share step by step." },
              { icon: ShieldCheck, ar: "ضمان 100% من مزارعنا",     en: "100% farm-to-family",  d_ar: "كل عجل وخروف من مزارع اليسر — مصدر واحد، جودة واحدة.", d_en: "Every cow and sheep is from Al-Yusr's own farms — one source, one standard." },
              { icon: Sparkles,    ar: "أسبقية الحجز",              en: "First-day priority",   d_ar: "اليوم الأول بأسبقية الحجز — العدد محدود فعلاً.", d_en: "First-day bookings get priority — quantities are truly limited." },
            ].map(({ icon: Icon, ar, en, d_ar, d_en }) => (
              <div key={en} className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-soft sm:p-5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary/20 text-primary sm:h-11 sm:w-11">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-3 text-sm font-black text-primary sm:text-base">{isRTL ? ar : en}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {isRTL ? d_ar : d_en}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3 sm:mx-auto sm:max-w-xl">
            <Button
              asChild
              size="lg"
              className="h-12 w-full bg-orange-grad text-base font-black text-accent-foreground shadow-cta transition-transform duration-150 hover:opacity-95 active:scale-[.98]"
            >
              <Link
                to="/donate?program=odhya"
                data-cta="qurbani-reserve-quality"
                onClick={() =>
                  track("qurbani_reserve_click", {
                    source: "qurbani-campaign-quality",
                    target: "/donate?program=odhya",
                    label: isRTL ? "احجز صك أضحيتك دلوقتي" : "Reserve your share now",
                    fbEvent: "InitiateCheckout",
                  })
                }
              >
                <Heart className="h-5 w-5" />
                {isRTL ? "احجز صك أضحيتك دلوقتي" : "Reserve your share now"}
              </Link>
            </Button>
            <a
              href="https://wa.me/201097000137?text=عايز%20احجز%20صك%20أضحية"
              target="_blank"
              rel="noopener"
              data-cta="qurbani-whatsapp-quality"
              onClick={() =>
                track("qurbani_whatsapp_click", {
                  source: "qurbani-campaign-quality",
                  target: "wa.me",
                  label: isRTL ? "تواصل واتساب" : "Chat on WhatsApp",
                  fbEvent: "Contact",
                })
              }
              className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-md border-2 border-secondary/50 bg-card px-5 text-base font-black text-primary transition-transform duration-150 hover:bg-secondary/10 active:scale-[.98]"
            >
              <Users className="h-4 w-4" />
              {isRTL ? "تواصل واتساب" : "Chat on WhatsApp"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QurbaniCampaign;