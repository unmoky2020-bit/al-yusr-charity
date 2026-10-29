import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, MessageCircle, CheckCircle2, ShieldCheck, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { useSeasons, useSeasonEnabled, SEASONS, type SeasonSlug } from "@/data/seasons";
import { HomeSeasons } from "@/components/sections/HomeSeasons";

/** Per-season landing page — SEO-tuned, with enable/disable awareness. */
const SeasonDetail = () => {
  const { slug = "" } = useParams();
  const { lang } = useLang();
  const isAr = lang === "ar";
  // Hooks run before the early return (rules of hooks). Static by default; /seasons values on top in api mode.
  const season = useSeasons().find((s) => s.slug === slug);
  const enabled = useSeasonEnabled(slug as SeasonSlug);
  if (!season) return <Navigate to="/programs" replace />;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const wa = `https://wa.me/201097000137?text=${encodeURIComponent(
    isAr ? `أرغب بالتبرع/الاستفسار عن: ${season.titleAr}` : `I want to donate / ask about: ${season.titleEn}`,
  )}`;

  const url = `https://elyusr.org/seasons/${season.slug}`;
  const Icon = season.icon;

  return (
    <PageLayout>
      <SEOHelmet
        title={isAr ? season.metaTitleAr : season.metaTitleEn}
        description={isAr ? season.metaDescAr : season.metaDescEn}
        path={`/seasons/${season.slug}`}
        ogType="article"
      />
      <Helmet>
        <meta name="keywords" content={(isAr ? season.keywordsAr : season.keywordsEn).join(", ")} />
        <link rel="alternate" hrefLang="ar-EG" href={`https://elyusr.org/seasons/${season.slug}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://elyusr.org/seasons/${season.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "DonateAction",
          name: isAr ? season.titleAr : season.titleEn,
          description: isAr ? season.descriptionAr : season.descriptionEn,
          recipient: { "@type": "NGO", name: "مؤسسة اليسر للتنمية", url: "https://elyusr.org/", areaServed: ["Dakahlia", "Mansoura"] },
          target: `https://elyusr.org${season.donateHref}`,
          actionStatus: enabled ? "https://schema.org/ActiveActionStatus" : "https://schema.org/CompletedActionStatus",
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: "https://elyusr.org/" },
            { "@type": "ListItem", position: 2, name: isAr ? "البرامج" : "Programs", item: "https://elyusr.org/programs" },
            { "@type": "ListItem", position: 3, name: isAr ? season.titleAr : season.titleEn, item: url },
          ],
        })}</script>
      </Helmet>

      {/* HERO */}
      <section className="relative overflow-hidden pattern-programs">
        <div className="container relative mx-auto max-w-6xl px-4 py-10 md:py-14">
          <Breadcrumbs items={[
            { name: isAr ? "الرئيسية" : "Home", href: "/" },
            { name: isAr ? "البرامج" : "Programs", href: "/programs" },
            { name: isAr ? season.titleAr : season.titleEn },
          ]} />
          <div className="mt-5 grid items-center gap-8 md:grid-cols-[1.2fr,1fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary">
                <Icon className="h-3.5 w-3.5" />
                {isAr ? season.tagAr : season.tagEn}
              </span>
              <h1 className="mt-3 text-2xl font-black leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
                {isAr ? season.titleAr : season.titleEn}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground md:text-lg">
                {isAr ? season.taglineAr : season.taglineEn}
              </p>
              <div className="mt-2 text-xs font-bold text-primary/80">
                {isAr ? "موعد الحملة: " : "Campaign window: "}{isAr ? season.monthsAr : season.monthsEn}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {enabled ? (
                  <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                    <Link to={season.donateHref}><Heart className="h-5 w-5" />{isAr ? "تبرع الآن" : "Donate now"}</Link>
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-border bg-muted/50 px-4 py-2.5 text-sm font-extrabold text-muted-foreground">
                    <Lock className="h-4 w-4" /> {isAr ? "الحملة مغلقة حالياً — قريباً بإذن الله" : "Campaign currently closed — coming soon"}
                  </span>
                )}
                <Button asChild size="lg" variant="outline">
                  <a href={wa} target="_blank" rel="noopener"><MessageCircle className="h-5 w-5" />{isAr ? "استفسر واتساب" : "Ask on WhatsApp"}</a>
                </Button>
              </div>
            </div>
            <div className="grid place-items-center">
              <div className="grid h-40 w-40 place-items-center rounded-[2rem] bg-card text-primary shadow-soft ring-8 ring-primary/5 md:h-56 md:w-56">
                <Icon className="h-20 w-20 md:h-28 md:w-28" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIPTION */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">
            {isAr ? "عن الحملة" : "About the campaign"}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[15px] leading-loose text-foreground/85 md:text-base">
            {isAr ? season.descriptionAr : season.descriptionEn}
          </p>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">
            {isAr ? "بنود الحملة" : "What's included"}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {season.items.map((it, i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <div>
                  <div className="text-sm font-extrabold text-primary md:text-base">{isAr ? it.ar : it.en}</div>
                  {(it.arD || it.enD) && (
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{isAr ? it.arD : it.enD}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING / DONATION TIERS */}
      {season.pricing && season.pricing.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-black text-primary md:text-3xl">
              {isAr ? "اختر تبرعك" : "Choose your donation"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
              {isAr ? "كل مبلغ يصل لمستحقه — موثّق بالصور والفيديو وتوصيل مجاني." : "Every amount reaches the right hands — documented with proof & free delivery."}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {season.pricing.map((pr, i) => (
                <div
                  key={i}
                  className={`group rounded-2xl border bg-card p-4 shadow-soft transition ${enabled ? "border-border hover:-translate-y-0.5 hover:shadow-cta" : "border-dashed border-muted opacity-70"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{isAr ? pr.labelAr : pr.labelEn}</span>
                    {(pr.tagAr || pr.tagEn) && (
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-bold text-secondary">
                        {isAr ? pr.tagAr : pr.tagEn}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-black text-accent">
                    {pr.amount.toLocaleString("en-EG")} <span className="text-xs font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span>
                  </div>
                  {enabled ? (
                    <Link
                      to={`${season.donateHref}${season.donateHref.includes("?") ? "&" : "?"}amount=${pr.amount}`}
                      className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-accent group-hover:underline"
                    >
                      {isAr ? "تبرع بهذا المبلغ" : "Donate this amount"} <Arrow className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-muted-foreground">
                      <Lock className="h-3 w-3" /> {isAr ? "غير متاح حالياً" : "Currently unavailable"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW TO DONATE */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">
            {isAr ? "طرق التبرع" : "How to donate"}
          </h2>
          <ol className="mx-auto mt-8 grid max-w-3xl gap-4">
            {[
              { ar: "تبرع أونلاين بالفيزا أو المحفظة الإلكترونية — استلام فوري.", en: "Donate online via card or e-wallet — instant receipt." },
              { ar: "تحويل بنكي على حسابات اليسر الرسمية المرخّصة.", en: "Bank transfer to Al-Yusr official licensed accounts." },
              { ar: "تواصل واتساب لخدمة التبرع الميداني (استلام من البيت).", en: "WhatsApp our team for on-site collection from your home." },
            ].map((s, i) => (
              <li key={i} className="relative rounded-2xl border border-border bg-card p-5 shadow-soft">
                <span className="absolute -top-3 start-5 rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">{i + 1}</span>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{isAr ? s.ar : s.en}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <ul className="grid grid-cols-2 gap-2 text-[11px] font-extrabold text-primary md:grid-cols-4 md:text-xs">
            {[
              { ar: "ترخيص ٢٦٦٥/٢٠١٩", en: "License 2665/2019" },
              { ar: "توثيق صور وفيديو", en: "Photo & video proof" },
              { ar: "توصيل مجاني للباب", en: "Free doorstep delivery" },
              { ar: "مصاريف إدارية أقل من ٨٪", en: "Admin costs under 8%" },
            ].map((t) => (
              <li key={t.en} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-center">
                <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                <span>{isAr ? t.ar : t.en}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* OTHER SEASONS */}
      <section className="pt-4">
        <div className="container mx-auto max-w-6xl px-4 pt-6 text-center">
          <h2 className="text-xl font-black text-primary md:text-2xl">
            {isAr ? "اكتشف باقي المواسم" : "Explore the other seasons"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{SEASONS.length} {isAr ? "مواسم" : "seasons"}</p>
        </div>
        <HomeSeasons />
      </section>
    </PageLayout>
  );
};

export default SeasonDetail;