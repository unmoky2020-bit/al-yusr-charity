import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, X, Heart, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Helmet } from "react-helmet-async";
import { DAKAHLIA_CITIES, type DakahliaCity } from "@/data/dakahliaCities";

type Region = DakahliaCity;
const REGIONS: Region[] = DAKAHLIA_CITIES;

const PROGRAM_LABEL: Record<string, { ar: string; en: string }> = {
  odhya: { ar: "صك أضحية", en: "Qurbani" },
  box: { ar: "كرتونة عزومة", en: "Food box" },
  meat: { ar: "كيلو لحم", en: "Kilo of meat" },
  education: { ar: "كفالة تعليمية", en: "Education" },
  water: { ar: "وصلة مياه", en: "Water" },
  bride: { ar: "تجهيز عروس", en: "Bride" },
  zakat: { ar: "زكاة مال", en: "Zakat" },
};

/** Google Maps embed centered on a Dakahlia city — no API key, RTL/LTR aware. */
const gmapsEmbed = (lat: number, lon: number, name: string, lang: string) =>
  `https://www.google.com/maps?q=${lat},${lon}(${encodeURIComponent(name)})&z=11&hl=${lang}&output=embed`;

export const ImpactMap = () => {
  const { lang } = useLang();
  const [active, setActive] = useState<Region | null>(null);
  const [focused, setFocused] = useState<Region>(REGIONS[0]);

  const focusCity = (r: Region) => {
    setFocused(r);
    setActive(r);
  };
  return (
    <section id="impact" className="relative overflow-hidden bg-primary pattern-programs py-20 text-primary-foreground md:py-24">
      {/* Place schema for Dakahlia coverage — local SEO */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: lang === "ar" ? "مدن الدقهلية التي تخدمها مؤسسة اليسر" : "Dakahlia cities served by Al-Yusr",
            itemListElement: REGIONS.map((r, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Place",
                name: r[lang],
                geo: { "@type": "GeoCoordinates", latitude: r.lat, longitude: r.lon },
                containedInPlace: { "@type": "AdministrativeArea", name: lang === "ar" ? "محافظة الدقهلية" : "Dakahlia Governorate" },
                url: `https://elyusr.org/#impact-${r.slug}`,
              },
            })),
          })}
        </script>
        <meta
          name="keywords"
          content={lang === "ar"
            ? "المنصورة, ميت غمر, بلقاس, دكرنس, شربين, أجا, السنبلاوين, المطرية, طلخا, نبروه, الجمالية, ميت سلسيل, بني عبيد, المنزلة, صك أضحية, كرتونة خير, وصلات مياه, كفالة أيتام, زكاة"
            : "Mansoura, Mit Ghamr, Belqas, Dikirnis, Sherbin, Aga, Sinbillawayn, Matareya, Talkha, Nabaroh, Gamalia, Mit Salsil, Bani Ubaid, Manzala, Qurbani, food box, water connections, orphan sponsorship, zakat"
          }
        />
      </Helmet>
      {/* Top blender — picks up where BrandValues fades out for a seamless brand band */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[hsl(152_65%_11%)] to-transparent" aria-hidden />
      {/* Lime divider line — same accent used on values block */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" aria-hidden />
      {/* Same dense leaf tile as BrandValues — unified pattern, no gaps */}
      <div className="pointer-events-none absolute inset-0 brand-leaf-tile opacity-60" aria-hidden />
      <div className="container relative mx-auto px-4">
        <div className="mb-6">
          <Breadcrumbs items={[
            { name: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
            { name: lang === "ar" ? "محافظة الدقهلية" : "Dakahlia Governorate" },
            { name: lang === "ar" ? "خريطة الأثر" : "Impact map" },
          ]} />
        </div>
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-extrabold text-secondary">
              {lang === "ar" ? "خريطة الأثر" : "Impact map"}
            </span>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              {lang === "ar"
                ? "تواجد دائم في الدقهلية"
                : "Permanent presence across Dakahlia"}
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              {lang === "ar" ? "نركّز جهودنا حيث الحاجة أكبر. كل نقطة على الخريطة تمثّل أسرًا حقيقية تغيّرت حياتها بفضل تبرعك." : "We focus our work where the need is greatest. Every dot represents real families whose lives changed thanks to your donation."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              {REGIONS.map((r, i) => (
                <button
                  key={i}
                  id={`impact-${r.slug}`}
                  onClick={() => focusCity(r)}
                  className="group flex items-center justify-between rounded-xl bg-primary-foreground/10 px-3 py-2 text-sm transition hover:bg-primary-foreground/20"
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5 font-bold">
                    <MapPin className="h-3 w-3 shrink-0 text-secondary" />
                    <span className="min-w-0 truncate text-start">
                      <span className="block font-extrabold">{r[lang]}</span>
                      <span className="block truncate text-[10px] font-bold text-primary-foreground/60">
                        {(r.programs.slice(0, 2).map((p) => PROGRAM_LABEL[p]?.[lang] || p).join(" · "))}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold text-accent-foreground">
                    {lang === "ar"
                      ? `${r.families.toLocaleString("ar-EG")} أسرة`
                      : `${r.families.toLocaleString("en-US")} families`}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs font-bold text-primary-foreground/70">
              {lang === "ar"
                ? "نخدم كل مدينة ببرامج تناسب احتياجها: من صكوك الأضحية وكرتونة العزومة، إلى وصلات المياه وكفالة الأيتام، وتجهيز العرائس وزكاة المال."
                : "We serve each city with different programs by need: Qurbani vouchers, food boxes, water connections, orphan sponsorship, brides preparation and Zakat distribution."}
            </p>
          </div>

          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-primary-foreground/10 bg-primary-foreground/5 p-1.5 backdrop-blur md:mx-auto">
            <iframe
              key={focused.slug}
              title={lang === "ar" ? `خريطة ${focused.ar}` : `${focused.en} map`}
              src={gmapsEmbed(focused.lat, focused.lon, focused[lang], lang)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full rounded-[1.4rem] border-0"
              allowFullScreen
            />
            <div className="pointer-events-none absolute bottom-2 start-2 z-[2] rounded-full bg-accent/90 px-3 py-1 text-[10px] font-bold text-accent-foreground/95 backdrop-blur-sm">
              {lang === "ar"
                ? `الموقع الحالي: ${focused.ar} — ${focused.families.toLocaleString("ar-EG")} أسرة`
                : `Centered on: ${focused.en} — ${focused.families.toLocaleString("en-US")} families`}
            </div>
          </div>
        </div>
      </div>

      {/* City modal */}
      {active && (
        <div
          className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-card text-foreground shadow-card sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-2.5 py-0.5 text-[11px] font-extrabold text-primary">
                  <MapPin className="h-3 w-3" /> {lang === "ar" ? "الدقهلية" : "Dakahlia"}
                </span>
                <h3 className="mt-1.5 text-2xl font-black text-primary">{active[lang]}</h3>
                <p className="text-xs font-bold text-muted-foreground">{active.highlight[lang]}</p>
              </div>
              <button
                onClick={() => setActive(null)}
                aria-label="close"
                className="grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5">
              <div className="rounded-2xl bg-secondary/10 p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div className="text-xs font-bold text-muted-foreground">
                    {lang === "ar" ? "برامج نشطة في هذه المدينة" : "Active programs in this city"}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 pb-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                {lang === "ar" ? "البرامج المتاحة هنا" : "Programs available here"}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {active.programs.map((p) => (
                  <Link
                    key={p}
                    to={`/programs/${p}`}
                    onClick={() => setActive(null)}
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-extrabold text-primary hover:bg-secondary/30"
                  >
                    {PROGRAM_LABEL[p]?.[lang] || p}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
              <Button asChild className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to={`/qurbani/${active.slug}`} onClick={() => setActive(null)}>
                  <Heart className="h-4 w-4" />
                  {lang === "ar" ? `صك أضحية ${active.ar}` : `Qurbani in ${active.en}`}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/donate?program=${active.programs[0] || "odhya"}&city=${active.slug}`} onClick={() => setActive(null)}>
                  {lang === "ar" ? "تبرع مباشر" : "Donate now"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
