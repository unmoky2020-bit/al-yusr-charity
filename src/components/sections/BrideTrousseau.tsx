import { Heart, Home, Sparkles, ShieldCheck, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import bride from "@/assets/yusr-bride.png";

gsap.registerPlugin(ScrollTrigger);

/**
 * "تجارة رابحة" — bride trousseau (jihaz) call to action on the programs page:
 * help buy a fridge / stove for an orphan bride after a field visit.
 */
export const BrideTrousseau = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !root.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const el = root.current;
    const ctx = gsap.context(() => {
      const img = el.querySelector("[data-bt='img']");
      if (img) gsap.from(img, {
        x: isAR ? 60 : -60, opacity: 0, scale: 0.96, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 75%" },
      });
      const copyItems = el.querySelectorAll("[data-bt='copy'] > *");
      if (copyItems.length) gsap.from(copyItems, {
        y: 30, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 70%" },
      });
      const cards = el.querySelectorAll("[data-bt='card']");
      const grid = el.querySelector("[data-bt='grid']");
      if (cards.length) gsap.from(cards, {
        y: 24, opacity: 0, duration: 0.5, stagger: 0.08, ease: "back.out(1.4)",
        scrollTrigger: { trigger: grid || el, start: "top 85%" },
      });
    }, el);
    return () => ctx.revert();
  }, [isAR]);

  const wa = "https://wa.me/201097000137?text=" + encodeURIComponent(
    isAR ? "السلام عليكم، أرغب في معرفة تكلفة أجهزة جهاز العروس (ثلاجة/بوتاجاز)" : "Hi, I'd like to know the cost of bride trousseau appliances",
  );

  const points = [
    { icon: Home,       t: isAR ? "بيت مسلم يُبنى" : "Building a Muslim home", d: isAR ? "تساهم في بداية أسرة كاملة" : "You help start a whole family" },
    { icon: Heart,      t: isAR ? "أثر يبقى سنين" : "A lasting gift",          d: isAR ? "في كل لقمة تُطبخ في بيتها" : "In every meal cooked in her home" },
    { icon: ShieldCheck,t: isAR ? "ستر يتيمة" : "Sheltering an orphan",      d: isAR ? "«ومن ستر مسلمًا ستره الله» متفق عليه" : "“Whoever shelters a Muslim, Allah shelters him”" },
    { icon: Gift,       t: isAR ? "تسليم موثّق" : "Documented delivery",     d: isAR ? "بعد بحث ميداني، ونرسل إليك صور التسليم" : "After a field visit, with delivery photos" },
  ];

  return (
    <section ref={root} id="bride-trousseau" className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden py-14 md:py-20 text-primary-foreground">
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
                ? "ساهم في شراء أجهزة (ثلاجة/بوتاجاز) لعروس يتيمة في الدقهلية بعد بحث ميداني وتسليم موثّق."
                : "Sponsor appliances for an orphan bride in Dakahlia after a field visit, with documented delivery.",
              url: "https://elyusr.org/programs#bride-trousseau",
            },
            {
              "@type": "DonateAction",
              name: isAR ? "تبرع لجهاز عروسة يتيمة" : "Donate for orphan bride trousseau",
              recipient: { "@type": "NGO", name: "Al-Yusr Charity Foundation" },
              target: "https://elyusr.org/donate",
            },
          ],
        })}</script>
      </Helmet>
      <div className="container relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:gap-12 md:grid-cols-2 md:items-center lg:px-8">
        <div data-bt="img" className="relative order-2 md:order-1">
          <div className="absolute -inset-3 rounded-[2.5rem] bg-secondary/15 blur-2xl" aria-hidden />
          <img
            src={bride}
            alt={isAR ? "عروس يتيمة في يوم زفافها" : "Orphan bride on her wedding day"}
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
              ? "تخيّل أن تساهم في شراء ثلاجة أو بوتاجاز لعروس يتيمة؛ فكل لقمة تطبخها، وحياة أولادها في المستقبل، أرباح تُضاف إلى رصيدك. أنت لا تشتري أجهزة، بل تستثمر في بناء أسرة مسلمة بفضل الله ثم بفضل تبرعك."
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
              <a href={wa} target="_blank" rel="noopener noreferrer" data-source="programs" data-label="bride-trousseau-whatsapp" className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                <span>{isAR ? "تكلفة الأجهزة" : "Appliance cost"}</span>
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-2.5 sm:px-4 border-secondary/40 bg-primary-foreground/5 text-xs font-black text-primary-foreground hover:bg-secondary/20 hover:text-primary-foreground sm:text-sm md:h-12">
              <Link to="/donate" data-source="programs" data-label="bride-trousseau-donate" className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <Heart className="h-4 w-4 shrink-0" />
                <span>{isAR ? "ساهم في جهاز عروسة" : "Help a bride"}</span>
              </Link>
            </Button>
          </div>

          <p className="mt-3 text-[11px] font-bold text-secondary/90">
            {isAR ? "يُسلَّم كل جهاز للعروس بعد بحث ميداني، وتصلك صور التسليم." : "Every appliance is delivered after a field visit, with photos sent to you."}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BrideTrousseau;