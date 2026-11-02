import { useLang } from "@/i18n/LangContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Package, Truck, Smile, HandHeart, ArrowLeft, ArrowRight } from "lucide-react";
import { StickyStack, StickyStackItem } from "@/components/ui/sticky-stack";
import imgCarton from "@/assets/hero-carton-opened.webp";
import imgVan from "@/assets/brand-van.jpg";
import imgOrphans from "@/assets/yusr-orphans-meals.webp";
import imgFamily from "@/assets/hero-happy-family-new.png";

/**
 * Carton story — 4 stations rendered as a Framer-style sticky stack.
 * Each card sticks at the top while the next one slides over it,
 * RTL-safe (pure CSS sticky, no GSAP pin).
 */
export const StackedPanels = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const Arrow = isAR ? ArrowLeft : ArrowRight;

  const stations = isAR
    ? [
        { tag: "البداية", title: "كرتونة خير", text: "كل تبرع يبدأ بكرتونة: طعام وكساء ودواء — نجمعها بجودة، نوثّقها بالصور، ونوصّلها لباب البيت بأمانة.", img: imgCarton, icon: Package, accent: "from-secondary/30 to-primary/10" },
        { tag: "في الطريق", title: "قافلة على الدرب", text: "قافلة اليسر تتحرّك من المنصورة لكل قرى الدقهلية ومحافظات مصر — توثيق بالصوت والصورة في كل محطة.", img: imgVan, icon: Truck, accent: "from-sky-400/20 to-indigo-500/10" },
        { tag: "بسمة يتيم", title: "كفالة كاملة", text: "كفالة، علاج، تعليم وكساء — رعاية متكاملة لكل طفل يستحق الفرصة.", img: imgOrphans, icon: HandHeart, accent: "from-rose-400/25 to-amber-400/10" },
        { tag: "النهاية", title: "عيلة في أمان", text: "وصلت الكرتونة. وصلت البسمة. شكرًا إنّك جزء من القصة.", img: imgFamily, icon: Smile, accent: "from-emerald-400/25 to-teal-400/10" },
      ]
    : [
        { tag: "Start", title: "An Aid Carton", text: "Every gift starts with a carton — food, clothing, medicine — packed with care, documented with photos, delivered to the doorstep.", img: imgCarton, icon: Package, accent: "from-secondary/30 to-primary/10" },
        { tag: "On the Road", title: "A Convoy in Motion", text: "Al-Yusr convoys travel from Mansoura to every village in Dakahlia and across Egypt — fully documented at every stop.", img: imgVan, icon: Truck, accent: "from-sky-400/20 to-indigo-500/10" },
        { tag: "An Orphan's Smile", title: "Full Sponsorship", text: "Sponsorship, treatment, schooling, and clothing — full care for every child who deserves a chance.", img: imgOrphans, icon: HandHeart, accent: "from-rose-400/25 to-amber-400/10" },
        { tag: "The End", title: "A Family at Peace", text: "The carton arrived. The smile arrived. Thank you for being part of the story.", img: imgFamily, icon: Smile, accent: "from-emerald-400/25 to-teal-400/10" },
      ];

  return (
    <section
      aria-label={isAR ? "محطات قصة الكرتونة" : "The Carton Story stations"}
      className="bg-background py-14 md:py-20"
      dir={isAR ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary">
            {isAR ? "قصة الكرتونة" : "The Carton Story"}
          </span>
          <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">
            {isAR ? "أربع محطات.. رحلة خير واحدة" : "Four stations.. one journey of goodness"}
          </h2>
          <p className="mx-auto mt-3 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {isAR
              ? "مرّر للأسفل لتعيش كل محطة من رحلة تبرعك — من الكرتونة الأولى إلى بسمة عيلة في أمان."
              : "Scroll down to live every station of your gift — from the first carton to a family's smile."}
          </p>
        </header>

        <StickyStack className="mt-10">
          {stations.map((s, i) => (
            <StickyStackItem key={s.title} index={i}>
              <article
                className="group relative mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-primary/10 bg-card shadow-card ring-1 ring-primary/5 transition-all duration-500"
              >
                {/* Image */}
                <div className="relative m-2.5 aspect-[4/5] overflow-hidden rounded-[20px] bg-muted sm:aspect-[4/3] md:m-3 md:aspect-[16/9]">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <span aria-hidden className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.accent} mix-blend-multiply opacity-60`} />
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

                  {/* Tag — top start */}
                  <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-extrabold text-primary-foreground shadow-cta ring-2 ring-card">
                    <s.icon className="h-3.5 w-3.5" />
                    {s.tag}
                  </span>
                  {/* Number — top end */}
                  <span
                    aria-hidden
                    className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-secondary text-[14px] font-black text-secondary-foreground shadow-cta ring-2 ring-card"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col px-5 pb-6 pt-1 md:px-6">
                  <h3 className="text-2xl font-black leading-tight text-primary md:text-[28px]">{s.title}</h3>
                  <p className="mt-2 text-[13.5px] font-semibold leading-7 text-muted-foreground sm:text-sm">{s.text}</p>

                  {i === stations.length - 1 ? (
                    <Button asChild size="lg" className="mt-5 w-fit bg-orange-grad px-6 text-accent-foreground shadow-cta">
                      <Link to="/donate" aria-label={isAR ? "تبرع الآن" : "Donate now"}>
                        <Heart className="h-4 w-4" />
                        {isAR ? "تبرّع الآن" : "Donate Now"}
                      </Link>
                    </Button>
                  ) : (
                    <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-[12.5px] font-extrabold text-accent ring-1 ring-accent/20">
                      {isAR ? `المحطة التالية` : `Next station`}
                      <Arrow className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </article>
            </StickyStackItem>
          ))}
          <div aria-hidden className="h-2" />
        </StickyStack>
      </div>
    </section>
  );
};

export default StackedPanels;
