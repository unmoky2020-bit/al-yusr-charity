import { Heart, TrendingUp, Home, Sparkles, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import bride from "@/assets/yusr-bride.png";

gsap.registerPlugin(ScrollTrigger);

/**
 * "تجارة رابحة" — bride trousseau (jihaz) campaign.
 * Frames donation toward fridge/stove for an orphan bride as an investment
 * with multiplied reward in Ramadan.
 */
export const BrideTrousseau = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !root.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-bt='img']", {
        x: isAR ? 60 : -60, opacity: 0, scale: 0.96, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: root.current!, start: "top 75%" },
      });
      gsap.from("[data-bt='copy'] > *", {
        y: 30, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power2.out",
        scrollTrigger: { trigger: root.current!, start: "top 70%" },
      });
      gsap.from("[data-bt='card']", {
        y: 24, opacity: 0, duration: 0.5, stagger: 0.08, ease: "back.out(1.4)",
        scrollTrigger: { trigger: "[data-bt='grid']", start: "top 85%" },
      });
    }, root);
    return () => ctx.revert();
  }, [isAR]);

  const wa = "https://wa.me/201097000137?text=" + encodeURIComponent(
    isAR ? "السلام عليكم، حابب أعرف تكلفة أجهزة جهاز عروسة (تلاجة/بوتاجاز)" : "Hi, I'd like to know the cost of bride trousseau appliances",
  );

  const points = [
    { icon: TrendingUp, t: isAR ? "الحسنة × 70 ضعف" : "Reward × 70",        d: isAR ? "في رمضان كل عمل صالح يتضاعف" : "Every good deed is multiplied in Ramadan" },
    { icon: Home,       t: isAR ? "بيت مسلم بيتبني" : "Building a Muslim home", d: isAR ? "أنت بتساهم في تكوين أسرة كاملة" : "You help start a whole family" },
    { icon: Heart,      t: isAR ? "صدقة جارية" : "Continuous charity",       d: isAR ? "كل لقمة تُطبخ في رصيدك لسنين" : "Every meal cooked counts for years" },
    { icon: ShieldCheck,t: isAR ? "ستر يتيمة" : "Sheltering an orphan",      d: isAR ? "ومن ستر مسلمًا ستره الله" : "Whoever shelters a Muslim, Allah shelters them" },
  ];

  return (
    <section ref={root} id="bride-trousseau" className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden pt-12 md:pt-16 pb-24 sm:pb-28 md:pb-36 lg:pb-44 text-primary-foreground">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              "@id": "https://elyusr.org/#bride-trousseau",
              name: isAR ? "تجهيز عرائس أيتام — مؤسسة اليسر" : "Orphan Bride Trousseau — Al-Yusr",
              serviceType: isAR ? "تجهيز عرائس وستر" : "Bride trousseau & sheltering",
              areaServed: { "@type": "AdministrativeArea", name: "Dakahlia, Egypt" },
              provider: { "@type": "NGO", name: "Al-Yusr Charity Foundation", url: "https://elyusr.org" },
              description: isAR
                ? "ساهم في شراء أجهزة (تلاجة/بوتاجاز) لعروسة يتيمة في الدقهلية — صدقة جارية بثواب مضاعف في رمضان."
                : "Sponsor appliances for an orphan bride in Dakahlia — continuous charity, multiplied reward in Ramadan.",
              url: "https://elyusr.org/#bride-trousseau",
            },
            {
              "@type": "DonateAction",
              name: isAR ? "تبرع لجهاز عروسة يتيمة" : "Donate for orphan bride trousseau",
              recipient: { "@type": "NGO", name: "Al-Yusr Charity Foundation" },
              target: "https://elyusr.org/donate?cause=bride-trousseau",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: isAR ? "الرئيسية" : "Home", item: "https://elyusr.org/" },
                { "@type": "ListItem", position: 2, name: isAR ? "البرامج" : "Programs", item: "https://elyusr.org/#programs" },
                { "@type": "ListItem", position: 3, name: isAR ? "تجهيز عرائس" : "Bride trousseau", item: "https://elyusr.org/#bride-trousseau" },
              ],
            },
          ],
        })}</script>
      </Helmet>
      <div className="container relative mx-auto px-4 [&_a]:text-secondary [&_a:hover]:text-secondary [&_span]:text-primary-foreground [&_nav]:text-primary-foreground/80 [&_nav]:justify-center flex justify-center">
        <Breadcrumbs items={[
          { name: isAR ? "الرئيسية" : "Home", href: "/" },
          { name: isAR ? "البرامج" : "Programs", href: "/projects" },
          { name: isAR ? "تجهيز عرائس" : "Bride trousseau", href: "/programs/bride" },
          { name: isAR ? "حملة جهاز العرائس" : "Trousseau campaign" },
        ]} />
      </div>
      <div className="container relative mx-auto mt-5 grid gap-8 px-4 md:mt-6 md:gap-10 md:grid-cols-2 md:items-center">
        <div data-bt="img" className="relative order-2 md:order-1">
          <div className="absolute -inset-3 rounded-[2.5rem] bg-secondary/15 blur-2xl" aria-hidden />
          <img
            src={bride}
            alt={isAR ? "عروسة يتيمة في يوم زفافها" : "Orphan bride on her wedding day"}
            loading="lazy"
            decoding="async"
            width={900}
            height={1200}
            className="relative w-full rounded-[2rem] object-cover shadow-card ring-1 ring-secondary/30"
          />
        </div>

        <div data-bt="copy" className="order-1 text-center md:order-2 md:text-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/15 px-3 py-1 text-[11px] font-extrabold text-secondary">
            <Sparkles className="h-3.5 w-3.5" />
            {isAR ? "حملة جهاز العرائس" : "Bride trousseau campaign"}
          </span>
          <h2 className="mt-3 text-xl font-black leading-[1.25] md:text-4xl lg:text-[2.6rem]">
            {isAR ? (<>تجارة رابحة — تدفع ثمن جهاز اليوم،<br className="hidden sm:block" /> وتجني <span className="text-gradient-lime">حسنات</span> لسنين</>) : (
              <>A winning trade — pay for a trousseau today, reap <span className="text-gradient-lime">rewards</span> for years</>
            )}
          </h2>
          <p className="mt-3 text-[13px] font-semibold leading-relaxed text-primary-foreground/85 md:text-base">
            {isAR
              ? "تخيّل لما تساهم في شراء (تلاجة أو بوتاجاز) لعروسة يتيمة؛ كل لقمة بتطبخها، وكل حياة أولادها في المستقبل، هي أرباح بتنزل في رصيدك. أنت مش بتشتري أجهزة، أنت بتستثمر في بناء أسرة مسلمة بفضل الله ثم بفضل تبرعك."
              : "Help buy a fridge or stove for an orphan bride — every meal she cooks and every life of her future children becomes a credit in your record. You're not buying appliances, you're investing in a Muslim family."}
          </p>

          <div data-bt="grid" className="mt-5 grid grid-cols-2 gap-2.5 md:gap-3">
            {points.map(({ icon: Icon, t, d }) => (
              <div data-bt="card" key={t} className="flex flex-col items-center rounded-2xl bg-primary-foreground/8 p-3 text-center backdrop-blur ring-1 ring-secondary/15 md:items-start md:p-3.5 md:text-start">
                <div className="flex flex-col items-center gap-1.5 md:flex-row md:items-center md:gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-secondary text-secondary-foreground md:h-9 md:w-9">
                    <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </span>
                  <h3 className="text-[12.5px] font-extrabold md:text-sm">{t}</h3>
                </div>
                <p className="mt-1.5 text-[11px] font-semibold text-primary-foreground/75 md:mt-2 md:text-xs">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3">
            <Button asChild size="lg" className="h-11 px-2.5 sm:px-4 bg-orange-grad text-xs font-black text-accent-foreground shadow-cta hover:opacity-95 sm:text-sm md:h-12">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                <span>{isAR ? "تكلفة الأجهزة" : "Appliance cost"}</span>
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-2.5 sm:px-4 border-secondary/40 bg-primary-foreground/5 text-xs font-black text-primary-foreground hover:bg-secondary/20 hover:text-primary-foreground sm:text-sm md:h-12">
              <a href="/donate?cause=bride-trousseau" className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <Heart className="h-4 w-4 shrink-0" />
                <span>{isAR ? "ابدأ استثمارك الآن" : "Start investing"}</span>
              </a>
            </Button>
          </div>

          <p className="mt-3 text-[11px] font-bold text-secondary/90">
            {isAR ? "خلّي الأبواب الخيرية مفتوحة قبل ما تتقفل — العدد محدود" : "Doors of charity won't stay open forever — limited spots"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BrideTrousseau;