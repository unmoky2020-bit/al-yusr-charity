import { Droplets, Home, Filter, Gauge, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { HadithBlock } from "@/components/campaigns/HadithBlock";
import { ProjectKindNote } from "@/components/campaigns/ProjectKind";
import { WaterTap } from "@/components/campaigns/WaterTap";
import { BentoGallery } from "@/components/campaigns/shared";
import { useProjectPage } from "@/hooks/useProjectPage";
import WATER_DEFAULTS from "@/data/projectPages/water";
import waterHero from "@/assets/program-water-new.jpg";

/**
 * /water — «سقيا الماء». Linked to the backend project `water` (dashboard → المشاريع → سقيا الماء):
 *  - hero image: the project's cover image (bundled photo until one is set);
 *  - texts and gallery: the project's «محتوى صفحة» tab (`page_content`, defaults in data/projectPages/water.ts);
 *  - FAQ: the FAQ category linked to the project (the defaults' list as fallback).
 */
const PROJECT_SLUG = "water";
const DONATE = "/donate?project=water";

const WHAT_ICONS: Record<string, LucideIcon> = { home: Home, meter: Gauge, filter: Filter };

type PageCtx = ReturnType<typeof useProjectPage>;

const WaterMain = ({ ctx }: { ctx: PageCtx }) => {
  const { c, t, isAr, section, images } = ctx;
  const what = section("what");
  const gallery = images("gallery");
  const paragraphs = [section("why")?.lead, section("why_more")?.lead].map((p) => t(p)).filter(Boolean);
  return (
    <>
      {/* Interactive tap */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <WaterTap />
        </div>
      </section>

      {/* Why clean water */}
      {paragraphs.length > 0 && (
        <section className="bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{t(section("why")?.title)}</h2>
            <div className="mt-6 space-y-4 text-sm leading-loose text-foreground/85 sm:text-base">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </section>
      )}

      {/* What your donation does */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{t(what?.title)}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {(what?.items ?? []).map((it) => {
              const Icon = WHAT_ICONS[it.id] ?? Droplets;
              return (
                <article key={it.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-600 text-white"><Icon className="h-6 w-6" /></span>
                  <h3 className="mt-4 text-lg font-black text-primary">{t(it.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(it.desc)}</p>
                </article>
              );
            })}
          </div>
          {t(section("kind")?.lead) && (
            <div className="mt-10">
              <ProjectKindNote kinds={["impact"]} noteAr={section("kind")!.lead!.ar} noteEn={section("kind")!.lead!.en} />
            </div>
          )}
        </div>
      </section>

      {t(c.hadith.text) && (
        <HadithBlock
          hadith={{ ar: c.hadith.text.ar, en: c.hadith.text.en || c.hadith.text.ar, sourceAr: c.hadith.source.ar, sourceEn: c.hadith.source.en || c.hadith.source.ar }}
          tone="dark"
        />
      )}

      {gallery.length > 0 && (
        <section className="bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">{t(section("gallery")?.title)}</h2>
            <BentoGallery items={gallery} isAr={isAr} />
          </div>
        </section>
      )}
    </>
  );
};

const WaterLanding = () => {
  const ctx = useProjectPage(PROJECT_SLUG, WATER_DEFAULTS);
  const { c, project } = ctx;
  const heroImage = project?.image && project.image !== "/placeholder.svg" ? project.image : waterHero;

  return (
    <CampaignLandingShell
      slug="water"
      path="/water"
      crumbParent={{ ar: "مشاريعنا", en: "Our projects", href: "/projects" }}
      badgeAr={c.hero.eyebrow.ar}
      badgeEn={c.hero.eyebrow.en}
      titleAr={c.hero.title.ar}
      titleEn={c.hero.title.en}
      taglineAr={c.hero.lead.ar}
      taglineEn={c.hero.lead.en}
      metaDescAr="تبرع لمشروع سقيا الماء من مؤسسة اليسر: توصيل مياه شرب نظيفة للبيوت وفلاتر للقرى في الدقهلية. أمان لصحة الأطفال وكبار السن وصدقة جارية."
      metaDescEn="Support Al-Yusr's clean water project: home water connections and filters for villages in Dakahlia. Safety for children and elders, and ongoing charity."
      seo={{ title: { ar: "توصيل مياه نظيفة للبيوت في مصر | وصلة مياه صدقة جارية — اليسر", en: "Clean water connections in Egypt | Ongoing charity — Al-Yusr" } }}
      heroImage={heroImage}
      heroAlt="توصيل مياه شرب نظيفة لبيت أسرة مستحقة من مؤسسة اليسر"
      main={<WaterMain ctx={ctx} />}
      relatedLinks={[
        { href: "/projects", ar: "كل مشاريع اليسر", en: "All projects" },
        { href: "/dhill", ar: "حملة ظِلّ (سقيا وأسقف)", en: "Dhill campaign" },
        { href: "/takrim", ar: "تكريم الإنسان", en: "Takrim" },
        { href: "/nurseries", ar: "حضانات اليسر ودور التحفيظ", en: "Nurseries & Qur'an houses" },
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

export default WaterLanding;
