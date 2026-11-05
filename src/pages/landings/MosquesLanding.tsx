import { Building2, Hammer, Sparkles, HeartHandshake, MapPin, Calculator, HardHat, Camera, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { HadithBlock } from "@/components/campaigns/HadithBlock";
import { ProjectKindNote } from "@/components/campaigns/ProjectKind";
import { DonationPicker } from "@/components/campaigns/DonationPicker";
import { BentoGallery } from "@/components/campaigns/shared";
import { entityDonateHref, useEntityShares, type Share } from "@/data/entityShares";
import { useProjectPage } from "@/hooks/useProjectPage";
import type { L } from "@/data/campaignPages/types";
import MOSQUES_DEFAULTS from "@/data/projectPages/mosques";

/**
 * /mosques — «عمارة وبناء بيوت الله», in two parts:
 *  - building a new mosque (foundations → minaret);
 *  - restoring a standing one (repairs, or carpeting and equipping it).
 *
 * Linked to the backend project `mosques` (dashboard → المشاريع → عمارة وبناء بيوت الله):
 *  - every text: the project's «محتوى صفحة» tab (`page_content`, defaults in data/projectPages/mosques.ts);
 *    the title and intro fall back to the project's name and short description;
 *  - hero image: the project's cover image;
 *  - shares: the project's donation packages, split between the two parts by their names (TRACK_WORDS);
 *  - FAQ: the FAQ category linked to the project;
 *  - gallery: the «الصور» tab of the page (`images.gallery`), hidden while empty.
 */
const PROJECT_SLUG = "mosques";
const SOURCE = { kind: "project" as const, slug: PROJECT_SLUG };
const DONATE = entityDonateHref(SOURCE.kind, SOURCE.slug);
const NO_SHARES: Share[] = [];

/** Words that put a project package under one of the two parts (matched against its key and names). */
const TRACK_WORDS = {
  build: ["بناء", "أسمنت", "اسمنت", "إنشائ", "انشائ", "مئذن", "أساس", "طوب", "build", "cement", "construct", "minaret", "foundation"],
  rebuild: ["ترميم", "إعمار", "اعمار", "فرش", "سجاد", "تجهيز", "تكييف", "إضاءة", "renov", "restor", "carpet", "furnish", "equip"],
};

/** Shown only until the project has packages for that part (they open the form on the project with that amount). */
const BUILD_DEFAULTS: Share[] = [
  { id: "msq-cement", nameAr: "سهم مواد بناء وأسمنت", nameEn: "Building materials share", amount: 500 },
  { id: "msq-meter", nameAr: "سهم متر مربع في مسجد جديد", nameEn: "One square metre of a new mosque", amount: 1000 },
];
const REBUILD_DEFAULTS: Share[] = [
  { id: "msq-carpet", nameAr: "سهم فرش وسجاد مسجد", nameEn: "Mosque carpet share", amount: 250 },
  { id: "msq-restore", nameAr: "سهم ترميم مسجد", nameEn: "Mosque restoration share", amount: 1000 },
];

const TRACKS: Record<string, { icon: LucideIcon; pointsKey: string; sharesKey: string; anchor: string }> = {
  build: { icon: Building2, pointsKey: "build_points", sharesKey: "build_shares", anchor: "mosques-build" },
  rebuild: { icon: Hammer, pointsKey: "rebuild_points", sharesKey: "rebuild_shares", anchor: "mosques-rebuild" },
};
const STEP_ICONS: Record<string, LucideIcon> = { s1: MapPin, s2: Calculator, s3: HardHat, s4: Camera };

const matches = (s: Share, words: string[]) => {
  const text = `${s.id} ${s.nameAr} ${s.nameEn}`.toLowerCase();
  return words.some((w) => text.includes(w.toLowerCase()));
};

/**
 * Split the project's packages between the two parts. Each package goes to one part only: «build» when
 * its name matches a build word (so «إعمار مئذنة» stays with building), else «rebuild» when it matches a
 * restoration word. A part with no package shows its defaults.
 */
export function splitMosqueShares(all: Share[]): Record<"build" | "rebuild", Share[]> {
  const build = all.filter((s) => matches(s, TRACK_WORDS.build));
  const rebuild = all.filter((s) => !build.includes(s) && matches(s, TRACK_WORDS.rebuild));
  return { build: build.length ? build : BUILD_DEFAULTS, rebuild: rebuild.length ? rebuild : REBUILD_DEFAULTS };
}

type PageCtx = ReturnType<typeof useProjectPage>;

const MosquesMain = ({ ctx }: { ctx: PageCtx }) => {
  const { c, t, isAr, section, images } = ctx;
  const gallery = images("gallery");
  const split = splitMosqueShares(useEntityShares(SOURCE.kind, SOURCE.slug, NO_SHARES));
  const facts = section("facts");
  const tracks = (section("tracks")?.items ?? []).filter((it) => TRACKS[it.id]);
  const steps = section("steps");

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

      {/* The two parts, side by side, each jumping to its own shares */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{t(section("tracks")?.title)}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {tracks.map((it, i) => {
              const { icon: Icon, pointsKey, anchor } = TRACKS[it.id];
              const points = section(pointsKey)?.items ?? [];
              return (
                <article key={it.id} className={`flex flex-col rounded-3xl border p-6 shadow-soft sm:p-8 ${i === 0 ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`grid h-14 w-14 place-items-center rounded-2xl ${i === 0 ? "bg-secondary text-primary" : "bg-primary text-primary-foreground"}`}><Icon className="h-7 w-7" /></span>
                    <span className={`rounded-full px-3 py-1 text-sm font-black ${i === 0 ? "bg-primary-foreground/10 text-secondary" : "bg-secondary/15 text-primary"}`}>
                      {isAr ? `القسم ${i === 0 ? "الأول" : "الثاني"}` : `Part ${i + 1}`}
                    </span>
                  </div>
                  <h3 className={`mt-4 text-2xl font-black ${i === 0 ? "" : "text-primary"}`}>{t(it.title)}</h3>
                  <p className={`mt-2 text-sm leading-loose sm:text-base ${i === 0 ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{t(it.desc)}</p>
                  {points.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {points.map((pt) => (
                        <li key={pt.id} className={`flex items-start gap-2 text-sm font-bold ${i === 0 ? "text-primary-foreground/90" : "text-foreground/85"}`}>
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /> {t(pt.title)}
                        </li>
                      ))}
                    </ul>
                  )}
                  <a
                    href={`#${anchor}`}
                    className={`mt-6 inline-flex w-fit items-center rounded-full px-5 py-2.5 text-sm font-black transition-opacity hover:opacity-90 ${i === 0 ? "bg-secondary text-primary" : "bg-primary text-primary-foreground"}`}
                  >
                    {isAr ? "اختر سهمك" : "Choose a share"}
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {t(c.hadith.text) && (
        <HadithBlock
          hadith={{ ar: c.hadith.text.ar, en: c.hadith.text.en || c.hadith.text.ar, sourceAr: c.hadith.source.ar, sourceEn: c.hadith.source.en || c.hadith.source.ar }}
          tone="dark"
          label={t(section("hadith_label")?.title)}
        />
      )}

      {/* Shares of each part (from the backend project's packages) */}
      {tracks.map((it, i) => {
        const tr = TRACKS[it.id];
        const sec = section(tr.sharesKey);
        const shares = split[it.id as "build" | "rebuild"];
        return (
          <section key={it.id} id={tr.anchor} className={`scroll-mt-24 py-12 md:py-16 ${i % 2 ? "bg-muted/30" : ""}`}>
            <div className="container mx-auto max-w-5xl px-4">
              <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{t(sec?.title) || t(it.title)}</h2>
              {t(sec?.lead) && <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-loose text-muted-foreground sm:text-base">{t(sec?.lead)}</p>}
              <DonationPicker source={SOURCE} shares={shares} title={t(it.title)} />
            </div>
          </section>
        );
      })}

      {/* How we work */}
      {steps && steps.items.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{t(steps.title)}</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.items.map((it, i) => {
                const Icon = STEP_ICONS[it.id] ?? Sparkles;
                return (
                  <li key={it.id} className="relative rounded-3xl border border-border bg-card p-6 shadow-soft">
                    <span className="absolute end-5 top-5 text-3xl font-black text-secondary/40">{isAr ? (i + 1).toLocaleString("ar-EG") : i + 1}</span>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><Icon className="h-6 w-6" /></span>
                    <h3 className="mt-4 text-lg font-black text-primary">{t(it.title)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(it.desc)}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {/* Project type + where the gift goes */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl space-y-6 px-4">
          {t(section("kind")?.lead) && (
            <ProjectKindNote kinds={["impact"]} noteAr={section("kind")!.lead!.ar} noteEn={section("kind")!.lead!.en} />
          )}
          {t(section("give")?.lead) && (
            <div className="flex items-start gap-3 rounded-3xl bg-primary p-6 text-primary-foreground">
              <HeartHandshake className="mt-1 h-6 w-6 shrink-0 text-secondary" />
              <p className="text-sm leading-loose sm:text-base">{t(section("give")?.lead)}</p>
            </div>
          )}
        </div>
      </section>

      {/* Gallery (dashboard → الصور); hidden until pictures are chosen */}
      {gallery.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">{t(section("gallery")?.title)}</h2>
            <BentoGallery items={gallery} isAr={isAr} />
          </div>
        </section>
      )}
    </>
  );
};

/** A saved page-content field wins; otherwise the project's own field; otherwise the code default. */
const pickText = (saved: unknown, projectAr: string | undefined, projectEn: string | undefined, merged: L): L => {
  const s = saved && typeof saved === "object" ? (saved as Partial<L>) : null;
  return { ar: s?.ar || projectAr || merged.ar, en: s?.en || projectEn || merged.en };
};

const MosquesLanding = () => {
  const ctx = useProjectPage(PROJECT_SLUG, MOSQUES_DEFAULTS);
  const { c, project } = ctx;
  const savedHero = (project?.pageContent?.hero ?? null) as Record<string, unknown> | null;
  const title = pickText(savedHero?.title, undefined, undefined, c.hero.title);
  const lead = pickText(savedHero?.lead, undefined, undefined, c.hero.lead);
  const heroImage = project?.image && project.image !== "/placeholder.svg" ? project.image : "/og-image.jpg";

  return (
    <CampaignLandingShell
      slug="mosques"
      path="/mosques"
      crumbParent={{ ar: "مشاريعنا", en: "Our projects", href: "/projects" }}
      badgeAr={c.hero.eyebrow.ar}
      badgeEn={c.hero.eyebrow.en}
      titleAr={title.ar}
      titleEn={title.en}
      taglineAr={lead.ar}
      taglineEn={lead.en}
      metaDescAr="ساهم مع مؤسسة اليسر في بناء مسجد جديد في القرى المحرومة، أو في إعادة إعمار مسجد قائم بترميمه وفرشه وتجهيزه. صدقة جارية بأجر كل صلاة."
      metaDescEn="Help Al-Yusr build new mosques in underserved villages, or restore, carpet and equip standing ones. Ongoing charity with the reward of every prayer."
      seo={{ title: { ar: "التبرع لبناء مسجد في مصر وإعمار المساجد | مؤسسة اليسر", en: "Build or restore a mosque | Al-Yusr" } }}
      heroImage={heroImage}
      heroAlt={title.ar}
      main={<MosquesMain ctx={ctx} />}
      relatedLinks={[
        { href: "/projects", ar: "كل مشاريع اليسر", en: "All projects" },
        { href: "/water", ar: "سقيا الماء", en: "Clean water" },
        { href: "/nurseries", ar: "حضانات اليسر ودور التحفيظ", en: "Nurseries & Qur'an houses" },
        { href: "/takrim", ar: "تكريم الإنسان", en: "Takrim" },
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

export default MosquesLanding;
