import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Heart, Quote, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { listPublishedStories, type StoryCard } from "@/data/storiesApi";
import family from "@/assets/family-hope.webp";

const Stories = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const base = "https://elyusr.org";

  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    listPublishedStories().then((data) => {
      setStories(data);
      setLoading(false);
    });
  }, []);

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "قصصنا — أثر حقيقي على أرض الواقع | مؤسسة اليسر" : "Our Stories — Real impact on the ground | Al-Yusr"}
        description={isRTL ? "قصص حقيقية لأسر وأطفال تأثرت حياتهم بفضل تبرعاتكم في الدقهلية ومحافظات مصر." : "Real stories of families and children whose lives changed thanks to your donations across Egypt."}
        path="/stories"
        image={family}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "قصصنا" : "Stories", url: `${base}/stories` },
      ]} />

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <div className="flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "قصصنا" : "Stories" }]} />
          </div>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">{isRTL ? "قصصنا — من الألم إلى الأمل" : "Our stories — from pain to hope"}</h1>
          <p className="mt-3 mx-auto max-w-2xl text-primary-foreground/85">{isRTL ? "كل قصة هنا حقيقية، وكل اسم وراءه أسرة بتقول شكراً ليك." : "Every story here is real, and every name represents a family thanking you."}</p>
        </div>
      </section>

      <section className="bg-background py-14 md:py-20">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
        <div className="container mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => {
            const title = isRTL ? s.title_ar : (s.title_en || s.title_ar);
            const role = isRTL ? s.role_ar : (s.role_en || s.role_ar);
            const quote = isRTL ? s.quote_ar : (s.quote_en || s.quote_ar);
            const Arrow = isRTL ? ArrowLeft : ArrowRight;
            return (
              <Link key={s.slug} to={`/stories/${s.slug}`} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {s.image_url ? (
                    <img src={s.image_url} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground"><Quote className="h-10 w-10" /></div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    {role && <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-extrabold text-primary">{role}</span>}
                    {s.is_featured && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-extrabold text-accent">★</span>}
                  </div>
                  <h3 className="mt-2 text-lg font-black text-primary">{title}</h3>
                  {quote && (
                    <p className="mt-2 flex gap-2 text-sm leading-relaxed text-muted-foreground">
                      <Quote className="h-4 w-4 shrink-0 text-secondary" />
                      <span className="line-clamp-3">{quote}</span>
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-accent group-hover:underline">
                    {isRTL ? "اقرأ القصة كاملة" : "Read full story"} <Arrow className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        )}
        <div className="mt-12 grid grid-cols-2 gap-2.5 text-center sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
          <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
            <Link to="/donate" data-source="stories" data-label="stories-donate-cta"><Heart className="h-5 w-5" />{isRTL ? "اكتب قصة جديدة لأسرة في الدقهلية" : "Write a new story for a Dakahlia family"}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/cases" data-source="stories" data-label="stories-cases">{isRTL ? "شاهد الحالات النشطة دلوقتي" : "See active cases now"}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/projects" data-source="stories" data-label="stories-projects">{isRTL ? "كل البرامج الخيرية" : "All charity programs"}</Link>
          </Button>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
          {isRTL ? (
            <>اعرف <Link to="/about" className="font-extrabold text-primary hover:text-secondary" data-source="stories-inline" data-label="inline-about">قصة مؤسسة اليسر</Link> أو ابدأ <Link to="/donate?program=odhya" className="font-extrabold text-primary hover:text-secondary" data-source="stories-inline" data-label="inline-qurbani">صك أضحية في الدقهلية</Link>.</>
          ) : (
            <>Learn <Link to="/about" className="font-extrabold text-primary hover:text-secondary" data-source="stories-inline" data-label="inline-about">Al-Yusr's story</Link> or start a <Link to="/donate?program=odhya" className="font-extrabold text-primary hover:text-secondary" data-source="stories-inline" data-label="inline-qurbani">Qurbani share in Dakahlia</Link>.</>
          )}
        </p>
      </section>
    </PageLayout>
  );
};
export default Stories;
