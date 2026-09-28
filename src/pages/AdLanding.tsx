import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, ShieldCheck, MapPin, MessageCircle } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import {
  persistAttribution,
  readUtmFromUrl,
  trackAdEvent,
  appendUtm,
} from "@/lib/adCampaignTracker";

type AdCampaign = {
  id: string;
  slug: string;
  name: string;
  status: string;
  channel: string;
  program_slug: string | null;
  target_url: string | null;
  hero_image_url: string | null;
  headline_ar: string;
  headline_en: string;
  subheadline_ar: string;
  subheadline_en: string;
  cta_label_ar: string;
  cta_label_en: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string | null;
  utm_content: string | null;
};

const AdLanding = () => {
  const { slug = "" } = useParams();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [c, setC] = useState<AdCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setC(null);
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <PageLayout>
        <div className="grid min-h-[50vh] place-items-center text-muted-foreground">…</div>
      </PageLayout>
    );
  }

  if (!c) {
    return (
      <PageLayout>
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-black text-primary">
            {isAr ? "هذه الحملة غير متاحة الآن" : "This campaign is not available"}
          </h1>
          <Link to="/programs" className="mt-4 inline-flex text-sm font-bold text-accent">
            {isAr ? "تصفّح برامجنا" : "Browse our programs"}
          </Link>
        </div>
      </PageLayout>
    );
  }

  const headline = isAr ? c.headline_ar || c.name : c.headline_en || c.name;
  const sub = isAr ? c.subheadline_ar : c.subheadline_en;
  const cta = isAr ? c.cta_label_ar : c.cta_label_en;
  const baseDonate =
    c.target_url ||
    (c.program_slug ? `/donate?program=${encodeURIComponent(c.program_slug)}` : "/donate");
  const donateHref = appendUtm(baseDonate);
  const wa = `https://wa.me/201097000137?text=${encodeURIComponent(
    isAr ? `استفسار عن: ${headline}` : `Ask about: ${headline}`,
  )}`;

  const onCta = () => {
    trackAdEvent("cta_click", {
      campaignId: c.id,
      metadata: { cta: "donate", href: donateHref },
    });
    trackAdEvent("donation_started", { campaignId: c.id });
  };
  const onWa = () => {
    trackAdEvent("cta_click", {
      campaignId: c.id,
      metadata: { cta: "whatsapp" },
    });
  };

  return (
    <PageLayout>
      <SEOHelmet
        title={`${headline} | ${isAr ? "مؤسسة اليسر" : "Al-Yusr"}`}
        description={sub || headline}
        path={`/c/${c.slug}`}
        image={c.hero_image_url || undefined}
      />
      <Helmet>
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <section className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container relative mx-auto max-w-5xl px-4 py-12 md:py-20">
          <div className="grid items-center gap-8 md:grid-cols-[1.1fr,1fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-extrabold text-accent">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isAr ? "حملة موثّقة • الدقهلية والمنصورة" : "Verified campaign • Dakahlia"}
              </span>
              <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">{headline}</h1>
              {sub && (
                <p className="mt-4 text-base leading-8 text-primary-foreground/85 md:text-lg">{sub}</p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="h-12 bg-orange-grad px-7 font-extrabold text-accent-foreground">
                  <Link to={donateHref} onClick={onCta}>
                    <Heart className="h-4 w-4" /> {cta}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 border-primary-foreground/30 bg-transparent px-5 font-bold text-primary-foreground hover:bg-primary-foreground/10">
                  <a href={wa} target="_blank" rel="noopener noreferrer" onClick={onWa}>
                    <MessageCircle className="h-4 w-4" /> {isAr ? "واتساب فوري" : "WhatsApp"}
                  </a>
                </Button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-primary-foreground/75">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {isAr ? "المنصورة • الدقهلية" : "Mansoura • Dakahlia"}</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> {isAr ? "توثيق بالصوت والصورة" : "Photo & video documented"}</span>
              </div>
            </div>
            {c.hero_image_url && (
              <div className="overflow-hidden rounded-3xl shadow-luxe">
                <img src={c.hero_image_url} alt={headline} className="h-full w-full object-cover" loading="eager" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-background py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-xl font-black text-primary md:text-2xl">
            {isAr ? "تبرعك يصل خلال أيام، موثّق بالاسم والصورة" : "Your donation lands in days — documented"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            {isAr
              ? "نحوّل تبرعك إلى أثر فعلي: غذاء، علاج، تعليم وكساء. كل خطوة موثّقة في تقاريرنا الميدانية."
              : "We convert your gift into real impact: food, treatment, education, and clothing — every step documented."}
          </p>
          <div className="mt-6">
            <Button asChild className="h-12 bg-orange-grad px-7 font-extrabold text-accent-foreground">
              <Link to={donateHref} onClick={onCta}>
                <Heart className="h-4 w-4" /> {cta}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AdLanding;