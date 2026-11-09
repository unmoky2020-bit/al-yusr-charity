import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Camera, CheckCircle2, Gift, HandHeart, Heart, Home, Search, ShieldCheck, Sparkles, Truck, type LucideIcon,
} from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { HadithBlock, type Hadith } from "@/components/campaigns/HadithBlock";
import { amountHref } from "@/components/campaigns/shared";
import { useProgramDetail } from "@/data/sources/programs";
import { useProgramFaqs } from "@/data/programFaqs";
import { JOURNEY, JOURNEY_LABEL } from "@/lib/deliveryJourney";
import { useLang } from "@/i18n/LangContext";

type Copy = { ar: string; en: string };

/** What a program landing page needs besides the program record from the dashboard. */
export type ProgramLandingConfig = {
  /** Backend program slug (dashboard → البرامج). */
  slug: string;
  path: string;
  fallbackImage: string;
  heroAlt: string;
  badge: Copy;
  /** Used when the dashboard has no hero title / subtitle. */
  title: Copy;
  subtitle: Copy;
  metaDesc: Copy;
  seoTitle: Copy;
  hadith: Hadith;
  whyTitle: Copy;
  /** Shown when the program has no "details" text yet. */
  whyFallback: { ar: string[]; en: string[] };
  stepsTitle: Copy;
  related: { href: string; ar: string; en: string }[];
  bottomCta: Copy;
  /** A bespoke block placed after the donation options (e.g. the bride trousseau section). */
  extra?: ReactNode;
};

const BENEFIT_ICONS: LucideIcon[] = [Home, Search, Camera, Heart, Gift, ShieldCheck];
const STEP_ICONS: LucideIcon[] = [Search, HandHeart, Truck, Camera, CheckCircle2, BookOpen];

/**
 * A program's own landing page (9 Nov 2026: جواز عروسة, كفالة يتيم). Texts, benefits, steps,
 * shares and FAQ come from the program in the dashboard (البرامج ← أقسام الصفحة / الباقات), so the
 * team edits them there; the config only holds the fixed parts (hadith, fallbacks, links).
 */
export function ProgramLanding({ config }: { config: ProgramLandingConfig }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { program, isLoading } = useProgramDetail(config.slug);
  const faqs = useProgramFaqs(program, isAr, []);
  if (isLoading) return <PageLayout><PageLoadingState /></PageLayout>;

  const c = program?.[lang];
  const pick = (x?: { ar: string[]; en: string[] }) => (x ? (isAr ? x.ar : x.en.length ? x.en : x.ar) : []);
  const benefits = pick(program?.sections?.benefits).length ? pick(program?.sections?.benefits) : c?.benefits ?? [];
  const stepsRaw = program?.sections?.steps;
  const steps = stepsRaw ? (isAr ? stepsRaw.ar : stepsRaw.en.length ? stepsRaw.en : stepsRaw.ar) : [];
  const why = pick(program?.sections?.details).length
    ? pick(program?.sections?.details)
    : c?.longContent?.length
      ? c.longContent
      : isAr ? config.whyFallback.ar : config.whyFallback.en;
  const packages = (program?.packages ?? []).filter((p) => p.amount > 0);
  const donate = `/donate?program=${config.slug}`;
  const heroImage = program?.hero?.image || (program?.image && program.image !== "/placeholder.svg" ? program.image : config.fallbackImage);
  const title = program?.hero?.[lang]?.title || c?.name || (isAr ? config.title.ar : config.title.en);
  const subtitle = program?.hero?.[lang]?.subtitle || c?.tagline || (isAr ? config.subtitle.ar : config.subtitle.en);
  const faq = faqs.length ? faqs : [];

  const main = (
    <>
      {/* Why */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? config.whyTitle.ar : config.whyTitle.en}</h2>
          <div className="mt-6 space-y-4 text-sm leading-loose text-foreground/85 sm:text-base">
            {why.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </section>

      {/* What the donation does */}
      {benefits.length > 0 && (
        <section className="bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "تبرعك بيعمل إيه" : "What your gift does"}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b, i) => {
                const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
                return (
                  <article key={i} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/20 text-primary"><Icon className="h-5 w-5" /></span>
                    <p className="mt-3 text-sm font-bold leading-relaxed text-primary">{b}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Shares from the dashboard */}
      <section id="options" className="scroll-mt-24 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-black text-primary md:text-3xl">{isAr ? "اختار مساهمتك" : "Choose your gift"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {isAr ? "كل مبلغ بيفرق، وبتوصلك صور التسليم ومتابعة تبرعك خطوة بخطوة." : "Every amount counts; you get delivery photos and follow your gift step by step."}
          </p>
          {packages.length > 0 ? (
            <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pk, i) => (
                <Link
                  key={pk.id}
                  to={amountHref(donate, pk.amount, pk.id)}
                  className={`group flex flex-col items-center gap-2 rounded-3xl border p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-cta ${i === 0 ? "border-secondary bg-secondary/10" : "border-border bg-card"}`}
                >
                  <span className="text-sm font-extrabold text-primary">{isAr ? pk.nameAr : pk.nameEn || pk.nameAr}</span>
                  <span className="text-3xl font-black text-accent">{pk.amount.toLocaleString(isAr ? "ar-EG" : "en-US")}</span>
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-grad px-4 py-1.5 text-xs font-black text-accent-foreground shadow-cta">
                    <Heart className="h-3.5 w-3.5" /> {isAr ? "ساهم بالمبلغ ده" : "Give this"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Link to={donate} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-orange-grad px-6 py-3 text-sm font-black text-accent-foreground shadow-cta">
              <Heart className="h-4 w-4" /> {isAr ? "تبرع بأي مبلغ" : "Give any amount"}
            </Link>
          )}
        </div>
      </section>

      {config.extra}

      {/* How it works */}
      {steps.length > 0 && (
        <section className="bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? config.stepsTitle.ar : config.stepsTitle.en}</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => {
                const Icon = STEP_ICONS[i % STEP_ICONS.length];
                return (
                  <li key={i} className="relative rounded-3xl border border-border bg-card p-6 shadow-soft">
                    <span className="absolute -top-3 start-5 grid h-7 w-7 place-items-center rounded-full bg-orange-grad text-xs font-black text-accent-foreground shadow-cta">{i + 1}</span>
                    <Icon className="h-6 w-6 text-secondary" />
                    <h3 className="mt-3 text-base font-black text-primary">{s.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {/* The donor follows every step */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-card md:p-10">
            <div className="flex items-center gap-2 text-sm font-black text-secondary"><Sparkles className="h-4 w-4" /> {isAr ? "شفافية كاملة" : "Full transparency"}</div>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">{isAr ? "هتتابع تبرعك لحد ما يوصل" : "Follow your gift until it arrives"}</h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-5">
              {JOURNEY.map((step, i) => (
                <li key={step} className="rounded-2xl bg-primary-foreground/10 p-3 text-center ring-1 ring-secondary/20">
                  <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-black text-secondary-foreground">{i + 1}</span>
                  <span className="mt-2 block text-xs font-extrabold">{isAr ? JOURNEY_LABEL[step].ar : JOURNEY_LABEL[step].en}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-primary-foreground/75">
              {isAr ? "كل خطوة بتوصلك إشعار في حسابك، وتقدر تتابعها برقم التبرع من صفحة «تتبع تبرعك»." : "Each step reaches you as a notification; you can also follow it with your donation number."}
            </p>
          </div>
        </div>
      </section>

      <HadithBlock hadith={config.hadith} tone="dark" />
    </>
  );

  return (
    <CampaignLandingShell
      slug={config.slug}
      path={config.path}
      crumbParent={{ ar: "برامجنا", en: "Our programs", href: "/programs" }}
      badgeAr={program?.hero?.ar?.badge || config.badge.ar}
      badgeEn={program?.hero?.en?.badge || config.badge.en}
      titleAr={isAr ? title : program?.ar.name || config.title.ar}
      titleEn={!isAr ? title : program?.en.name || config.title.en}
      taglineAr={isAr ? subtitle : program?.ar.tagline || config.subtitle.ar}
      taglineEn={!isAr ? subtitle : program?.en.tagline || config.subtitle.en}
      metaDescAr={program?.seo?.ar?.description || config.metaDesc.ar}
      metaDescEn={program?.seo?.en?.description || config.metaDesc.en}
      seo={{ title: { ar: program?.seo?.ar?.title || config.seoTitle.ar, en: program?.seo?.en?.title || config.seoTitle.en } }}
      heroImage={heroImage}
      heroAlt={config.heroAlt}
      heroFrame="photo"
      main={main}
      relatedLinks={config.related}
      faq={{ ar: isAr ? faq : [], en: !isAr ? faq : [] }}
      faqCategorySlug={program?.faqCategory}
      donateHref={donate}
      donateLabelAr="ساهم دلوقتي"
      donateLabelEn="Give now"
      bottomCtaAr={config.bottomCta.ar}
      bottomCtaEn={config.bottomCta.en}
    />
  );
}
