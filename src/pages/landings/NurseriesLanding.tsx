import { Baby, BookOpen, Trophy, Layers, ClipboardCheck, Users, Sparkles, HeartHandshake, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { HadithBlock } from "@/components/campaigns/HadithBlock";
import { ProjectKindNote } from "@/components/campaigns/ProjectKind";
import { BentoGallery } from "@/components/campaigns/shared";
import { DonationPicker } from "@/components/campaigns/DonationPicker";
import { entityDonateHref, useEntityShares, type Share } from "@/data/entityShares";
import { useProjectPage } from "@/hooks/useProjectPage";
import type { L } from "@/data/campaignPages/types";
import NURSERIES_DEFAULTS from "@/data/projectPages/nurseries";
import heroChild from "@/assets/hero-child.jpg";
import programEducation from "@/assets/program-education.jpg";
import posterEducation from "@/assets/poster-education.png";
import axisEducation from "@/assets/axis-education.jpg";

/**
 * /nurseries — an introduction to Al-Yusr's education project (not an enrolment page):
 * learning nurseries for ages 4–6, Qur'an houses for ages 4–16, Qur'an competitions,
 * curricula the foundation builds and supervises, and its educational team.
 *
 * Linked to the backend project `nurseries` (dashboard → المشاريع → حضانات اليسر):
 *  - every text: the project's «محتوى صفحة» tab (`page_content`, defaults in data/projectPages/nurseries.ts);
 *    the title and intro fall back to the project's name and short description;
 *  - hero image: the project's cover image; shares: its donation packages; FAQ: its linked FAQ category.
 */
const PROJECT_SLUG = "nurseries";
const SOURCE = { kind: "project" as const, slug: PROJECT_SLUG };
const DONATE = entityDonateHref(SOURCE.kind, SOURCE.slug);
/** Shown only until the backend project answers (offline / static mode). */
const DEFAULT_SHARES: Share[] = [
  { id: "qr-student", nameAr: "سهم تحفيظ طفل", nameEn: "Sponsor a child's memorisation", amount: 150 },
  { id: "qr-teacher", nameAr: "سهم في مرتب معلم", nameEn: "A share of a teacher's salary", amount: 500 },
  { id: "qr-teacher-full", nameAr: "مرتب معلم كامل", nameEn: "A teacher's full salary", amount: 4000 },
  { id: "qr-full", nameAr: "سهم التحفيظ بالكامل", nameEn: "Sponsor the whole memorisation programme", amount: 25000 },
];

const AGE_MIN = 4;
const AGE_MAX = 16;
const AGES = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i);
/** "من ٤ لـ ٦ سنين" / "Ages 4–6" (Arabic: سنين for 3–10, سنة above). */
const ageRange = (from: number, to: number, isAr: boolean) =>
  isAr ? `من ${from.toLocaleString("ar-EG")} لـ ${to.toLocaleString("ar-EG")} ${to <= 10 ? "سنين" : "سنة"}` : `Ages ${from}–${to}`;
/** Position (0–100%) of an age on the ruler; a track spans from the start of `from` to the end of `to`. */
const at = (age: number) => ((age - AGE_MIN) / (AGE_MAX - AGE_MIN + 1)) * 100;

/** Layout of each part of the project, by item id in the `tracks` section (its words come from the content). */
const TRACK_LAYOUT: Record<string, { icon: LucideIcon; from: number; to: number; bar: string; pointsKey: string }> = {
  nursery: { icon: Baby, from: 4, to: 6, bar: "bg-secondary", pointsKey: "nursery_points" },
  quran: { icon: BookOpen, from: 4, to: 16, bar: "bg-primary", pointsKey: "quran_points" },
};
const PILLAR_ICONS: Record<string, LucideIcon> = { curricula: Layers, supervision: ClipboardCheck, team: Users, contests: Trophy };

const GALLERY = [
  { src: programEducation, altAr: "أطفال في فصل تعليمي بحضانات اليسر", altEn: "Children in an Al-Yusr nursery classroom" },
  { src: axisEducation, altAr: "حلقة تحفيظ قرآن للأطفال في دور اليسر", altEn: "A children's Qur'an circle" },
  { src: posterEducation, altAr: "تعليم الأطفال في مؤسسة اليسر", altEn: "Children's education at Al-Yusr" },
  { src: heroChild, altAr: "طفل من أطفال حضانات اليسر", altEn: "A child at an Al-Yusr nursery" },
];

type PageCtx = ReturnType<typeof useProjectPage>;

/** Age ruler 4 → 16 with one bar per track: shows at a glance which ages each part of the project serves. */
const AgeJourney = ({ ctx }: { ctx: PageCtx }) => {
  const { t, isAr, section } = ctx;
  const journey = section("journey");
  const tracks = (section("tracks")?.items ?? []).filter((it) => TRACK_LAYOUT[it.id]);
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
      <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{t(journey?.title)}</h2>
      {t(journey?.lead) && <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">{t(journey?.lead)}</p>}
      <div className="mt-8 space-y-4" dir="ltr">
        {tracks.map((it) => {
          const { from, to, bar } = TRACK_LAYOUT[it.id];
          return (
            <div key={it.id}>
              <p className="mb-1.5 text-sm font-black text-primary" dir={isAr ? "rtl" : "ltr"}>
                {t(it.title)} <span className="font-bold text-muted-foreground">· {ageRange(from, to, isAr)}</span>
              </p>
              <div className="relative h-4 rounded-full bg-muted">
                <div className={`absolute inset-y-0 rounded-full ${bar}`} style={{ left: `${at(from)}%`, width: `${at(to + 1) - at(from)}%` }} />
              </div>
            </div>
          );
        })}
        <div className="relative mt-2 h-6">
          {AGES.map((a) => (
            <span key={a} className="absolute -translate-x-1/2 text-[11px] font-bold text-muted-foreground" style={{ left: `${(at(a) + at(a + 1)) / 2}%` }}>
              {isAr ? a.toLocaleString("ar-EG") : a}
            </span>
          ))}
        </div>
        <p className="text-center text-xs font-bold text-muted-foreground" dir={isAr ? "rtl" : "ltr"}>{isAr ? "السن بالسنين" : "Age in years"}</p>
      </div>
    </div>
  );
};

const NurseriesMain = ({ ctx }: { ctx: PageCtx }) => {
  const { c, t, isAr, section } = ctx;
  const shares = useEntityShares(SOURCE.kind, SOURCE.slug, DEFAULT_SHARES);
  const facts = section("facts");
  const tracks = section("tracks");
  const pillars = section("pillars");
  const shareSec = section("shares");
  return (
    <>
      {/* Key facts */}
      {facts && facts.items.length > 0 && (
        <section aria-label={t(facts.title)} className="border-y border-border bg-card">
          <div className="container mx-auto max-w-6xl px-4 py-5">
            <ul className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
              {facts.items.map((f) => (
                <li key={f.id} className="rounded-2xl bg-muted/40 px-3 py-3">
                  <p className="text-lg font-black text-primary sm:text-xl">{t(f.title)}</p>
                  <p className="mt-0.5 text-xs font-bold text-muted-foreground">{t(f.desc)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* The two parts of the project */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{t(tracks?.title)}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {(tracks?.items ?? []).filter((it) => TRACK_LAYOUT[it.id]).map((it) => {
              const { icon: Icon, from, to, pointsKey } = TRACK_LAYOUT[it.id];
              const points = section(pointsKey)?.items ?? [];
              return (
                <article key={it.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><Icon className="h-7 w-7" /></span>
                    <span className="rounded-full bg-secondary/15 px-3 py-1 text-sm font-black text-primary">{ageRange(from, to, isAr)}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-primary">{t(it.title)}</h3>
                  <p className="mt-2 text-sm leading-loose text-muted-foreground sm:text-base">{t(it.desc)}</p>
                  {points.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {points.map((pt) => (
                        <li key={pt.id} className="flex items-start gap-2 text-sm font-bold text-foreground/85">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /> {t(pt.title)}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
          <div className="mt-8">
            <AgeJourney ctx={ctx} />
          </div>
        </div>
      </section>

      {/* What makes it different */}
      {pillars && pillars.items.length > 0 && (
        <section className="bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{t(pillars.title)}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {pillars.items.map((it) => {
                const Icon = PILLAR_ICONS[it.id] ?? Sparkles;
                return (
                  <article key={it.id} className="flex items-start gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-primary"><Icon className="h-6 w-6" /></span>
                    <div>
                      <h3 className="text-lg font-black text-primary">{t(it.title)}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(it.desc)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {t(c.hadith.text) && (
        <HadithBlock
          hadith={{ ar: c.hadith.text.ar, en: c.hadith.text.en || c.hadith.text.ar, sourceAr: c.hadith.source.ar, sourceEn: c.hadith.source.en || c.hadith.source.ar }}
          tone="dark"
          label={t(section("hadith_label")?.title)}
        />
      )}

      {/* Project type + how donors help */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl space-y-6 px-4">
          {t(section("kind")?.lead) && (
            <ProjectKindNote kinds={["service", "impact"]} noteAr={section("kind")!.lead!.ar} noteEn={section("kind")!.lead!.en} />
          )}
          {t(section("give")?.lead) && (
            <div className="flex items-start gap-3 rounded-3xl bg-primary p-6 text-primary-foreground">
              <HeartHandshake className="mt-1 h-6 w-6 shrink-0 text-secondary" />
              <p className="text-sm leading-loose sm:text-base">{t(section("give")?.lead)}</p>
            </div>
          )}
        </div>
      </section>

      {/* Donation packages (from the backend project) */}
      <section id="nurseries-shares" className="scroll-mt-24 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{t(shareSec?.title)}</h2>
          {t(shareSec?.lead) && <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-loose text-muted-foreground sm:text-base">{t(shareSec?.lead)}</p>}
          <DonationPicker source={SOURCE} shares={shares} title={isAr ? "أسهم المشروع" : "Project shares"} />
        </div>
      </section>

      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">{t(section("gallery")?.title)}</h2>
          <BentoGallery items={GALLERY} isAr={isAr} />
        </div>
      </section>
    </>
  );
};

/** A saved page-content field wins; otherwise the project's own field; otherwise the code default. */
const pickText = (saved: unknown, projectAr: string | undefined, projectEn: string | undefined, merged: L): L => {
  const s = saved && typeof saved === "object" ? (saved as Partial<L>) : null;
  return {
    ar: s?.ar || projectAr || merged.ar,
    en: s?.en || projectEn || merged.en,
  };
};

const NurseriesLanding = () => {
  const ctx = useProjectPage(PROJECT_SLUG, NURSERIES_DEFAULTS);
  const { c, project } = ctx;
  const savedHero = (project?.pageContent?.hero ?? null) as Record<string, unknown> | null;
  const title = pickText(savedHero?.title, project?.ar, project?.en, c.hero.title);
  const lead = pickText(savedHero?.lead, project?.descAr, project?.descEn, c.hero.lead);
  const heroImage = project?.image && project.image !== "/placeholder.svg" ? project.image : heroChild;

  return (
    <CampaignLandingShell
      slug="nurseries"
      path="/nurseries"
      crumbParent={{ ar: "مشاريعنا", en: "Our projects", href: "/projects" }}
      badgeAr={c.hero.eyebrow.ar}
      badgeEn={c.hero.eyebrow.en}
      titleAr={title.ar}
      titleEn={title.en}
      taglineAr={lead.ar}
      taglineEn={lead.en}
      metaDescAr="حضانات اليسر التعليمية للأطفال من 4 إلى 6 سنوات ودور تحفيظ القرآن من 4 إلى 16 سنة: مناهج متخصصة تبنيها مؤسسة اليسر وتشرف عليها، فريق تربوي، ومسابقات قرآن."
      metaDescEn="Al-Yusr learning nurseries for ages 4–6 and Qur'an houses for ages 4–16: specialised curricula built and supervised by Al-Yusr, an educational team, and Qur'an competitions."
      seo={{ title: { ar: "حضانات اليسر التعليمية ودور تحفيظ القرآن للأطفال | مؤسسة اليسر", en: "Al-Yusr learning nurseries & Qur'an houses" } }}
      heroImage={heroImage}
      heroAlt={title.ar}
      main={<NurseriesMain ctx={ctx} />}
      relatedLinks={[
        { href: "/projects", ar: "كل مشاريع اليسر", en: "All projects" },
        { href: "/athar", ar: "حملة أثر (التعليم)", en: "Athar (education)" },
        { href: "/takrim", ar: "تكريم الإنسان", en: "Takrim" },
        { href: "/water", ar: "سقيا الماء", en: "Clean water" },
      ]}
      faq={{
        ar: c.faq.map((f) => ({ q: f.q.ar, a: f.a.ar })),
        en: c.faq.map((f) => ({ q: f.q.en || f.q.ar, a: f.a.en || f.a.ar })),
      }}
      faqCategorySlug={project?.faqCategorySlug}
      donateHref={DONATE}
      donateLabelAr={c.hero.donateLabel.ar}
      donateLabelEn={c.hero.donateLabel.en}
      bottomCtaAr={c.cta.title.ar}
      bottomCtaEn={c.cta.title.en}
      bottomSubAr={c.cta.sub.ar || undefined}
      bottomSubEn={c.cta.sub.en || undefined}
    />
  );
};

export default NurseriesLanding;
