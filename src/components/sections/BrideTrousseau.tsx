import { Heart, Home, Sparkles, ShieldCheck, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import bride from "@/assets/yusr-bride.png";
import { useReveal } from "@/hooks/useReveal";

type BrideTrousseauProps = {
  image?: string;
  title?: string;
  description?: string;
  benefits?: string[];
  donateHref?: string;
};

/**
 * "تجارة رابحة" — bride trousseau (jihaz) call to action on the programs page:
 * help buy a fridge / stove for an orphan bride after a field visit.
 */
export const BrideTrousseau = ({ image, title, description, benefits, donateHref }: BrideTrousseauProps = {}) => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  // Fade-and-rise on scroll (IntersectionObserver): nothing to recalculate when the programs above
  // finish loading, so nothing stays hidden or jumps on phones or large screens.
  const root = useReveal<HTMLElement>();
  const imageSrc = image ?? bride;
  // The poster keeps its own shape (1080×1440 = 3:4) so none of its text is cut.
  const [ratio, setRatio] = useState(3 / 4);
  const delay = (i: number) => ({ transitionDelay: `${i * 70}ms` });

  const wa = "https://wa.me/201097000137?text=" + encodeURIComponent(
    isAR ? "السلام عليكم، أرغب في معرفة تكلفة أجهزة جهاز العروس (ثلاجة/بوتاجاز)" : "Hi, I'd like to know the cost of bride trousseau appliances",
  );

  const defaultPoints = [
    { icon: Home,       t: isAR ? "بيت مسلم يُبنى" : "Building a Muslim home", d: isAR ? "تساهم في بداية أسرة كاملة" : "You help start a whole family" },
    { icon: Heart,      t: isAR ? "أثر يبقى سنين" : "A lasting gift",          d: isAR ? "في كل لقمة تُطبخ في بيتها" : "In every meal cooked in her home" },
    { icon: ShieldCheck,t: isAR ? "ستر يتيمة" : "Sheltering an orphan",      d: isAR ? "«ومن ستر مسلمًا ستره الله» متفق عليه" : "“Whoever shelters a Muslim, Allah shelters him”" },
    { icon: Gift,       t: isAR ? "تسليم موثّق" : "Documented delivery",     d: isAR ? "بعد بحث ميداني، ونرسل إليك صور التسليم" : "After a field visit, with delivery photos" },
  ];
  const icons = [Home, Heart, ShieldCheck, Gift];
  const points = benefits
    ? benefits.slice(0, 4).map((text, index) => ({ icon: icons[index], t: text, d: "" }))
    : defaultPoints;

  return (
    <section ref={root} id="bride-trousseau" className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-24 text-primary-foreground">
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
      <div className="container relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-12 lg:gap-16 lg:px-8">
        <div className="text-center md:text-start">
          <span data-reveal className="reveal-up inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/15 px-3 py-1 text-[11px] font-extrabold text-secondary">
            <Sparkles className="h-3.5 w-3.5" />
            {isAR ? "حملة جهاز العرائس" : "Bride trousseau campaign"}
          </span>
          <h2 data-reveal style={delay(1)} className="reveal-up mt-3 text-2xl font-black leading-[1.3] md:text-4xl lg:text-[2.6rem]">
            {title || (isAR ? (<>تجارة رابحة — تدفع ثمن جهاز اليوم،<br className="hidden sm:block" /> وتجني <span className="text-gradient-lime">حسنات</span> لسنين</>) : (
              <>A winning trade — pay for a trousseau today, reap <span className="text-gradient-lime">rewards</span> for years</>
            ))}
          </h2>
          <p data-reveal style={delay(2)} className="reveal-up mx-auto mt-3 max-w-xl text-[13.5px] font-semibold leading-relaxed text-primary-foreground/85 md:mx-0 md:text-base">
            {description || (isAR
              ? "تخيّل أن تساهم في شراء ثلاجة أو بوتاجاز لعروس يتيمة؛ فكل لقمة تطبخها، وحياة أولادها في المستقبل، أرباح تُضاف إلى رصيدك. أنت لا تشتري أجهزة، بل تستثمر في بناء أسرة مسلمة بفضل الله ثم بفضل تبرعك."
              : "Help buy a fridge or stove for an orphan bride — every meal she cooks and every life of her future children becomes a credit in your record. You're not buying appliances, you're investing in a Muslim family.")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2.5 md:gap-3">
            {points.map(({ icon: Icon, t, d }, i) => (
              <div data-reveal style={delay(3 + i)} key={t} className="reveal-up flex flex-col items-center rounded-2xl bg-primary-foreground/[0.07] p-3 text-center ring-1 ring-secondary/15 md:items-start md:p-4 md:text-start">
                <div className="flex flex-col items-center gap-1.5 md:flex-row md:items-center md:gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground md:h-9 md:w-9">
                    <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </span>
                  <h3 className="text-[12.5px] font-extrabold md:text-sm">{t}</h3>
                </div>
                {d && <p className="mt-1.5 text-[11px] font-semibold leading-5 text-primary-foreground/75 md:mt-2 md:text-xs">{d}</p>}
              </div>
            ))}
          </div>

          <div data-reveal style={delay(7)} className="reveal-up mt-6 grid grid-cols-2 gap-2 sm:gap-3">
            <Button asChild size="lg" className="h-11 px-2.5 sm:px-4 bg-orange-grad text-xs font-black text-accent-foreground shadow-cta hover:opacity-95 sm:text-sm md:h-12">
              <a href={wa} target="_blank" rel="noopener noreferrer" data-source="programs" data-label="bride-trousseau-whatsapp" className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                <span>{isAR ? "تكلفة الأجهزة" : "Appliance cost"}</span>
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-2.5 sm:px-4 border-secondary/40 bg-primary-foreground/5 text-xs font-black text-primary-foreground hover:bg-secondary/20 hover:text-primary-foreground sm:text-sm md:h-12">
              <Link to={donateHref ?? "/donate"} data-source="programs" data-label="bride-trousseau-donate" className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <Heart className="h-4 w-4 shrink-0" />
                <span>{isAR ? "ساهم في جهاز عروسة" : "Help a bride"}</span>
              </Link>
            </Button>
          </div>

          {!description && (
            <p className="mt-3 text-[11.5px] font-bold text-secondary/90">
              {isAR ? "يُسلَّم كل جهاز للعروس بعد بحث ميداني، وتصلك صور التسليم." : "Every appliance is delivered after a field visit, with photos sent to you."}
            </p>
          )}
        </div>

        {imageSrc && (
          <div data-reveal style={delay(2)} className="reveal-up relative mx-auto w-full max-w-[400px] sm:max-w-[440px] md:max-w-none">
            <div aria-hidden className="absolute -inset-5 rounded-[3rem] bg-secondary/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] bg-primary/30 shadow-card ring-1 ring-secondary/30 md:rounded-[2.5rem]" style={{ aspectRatio: String(ratio) }}>
              <img
                src={imageSrc}
                alt={isAR ? "برنامج تجهيز العرائس" : "Bride trousseau program"}
                loading="lazy"
                decoding="async"
                onLoad={(e) => {
                  const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                  if (w && h) setRatio(w / h);
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BrideTrousseau;