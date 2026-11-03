import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Heart, Quote, ArrowLeft, ArrowRight, MapPin, Sparkles, HandHeart } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { listPublishedStories, type StoryCard } from "@/data/storiesApi";
import family from "@/assets/family-hope.webp";

const BASE = "https://elyusr.org";

/** The topic a story is filed under: its program, else its category from the dashboard. */
const topicOf = (s: StoryCard, isRTL: boolean) =>
  (s.program ? (isRTL ? s.program.name_ar : s.program.name_en || s.program.name_ar) : "") || (isRTL ? s.role_ar : s.role_en || s.role_ar) || "";

/**
 * «قصص الأثر»: every published story from the dashboard. A lead story, topic filters (from the
 * stories' programs / categories, kept in ?topic=), cards, and ways to give. Real stories only.
 */
const Stories = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [params, setParams] = useSearchParams();
  const topic = params.get("topic") || "";

  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    listPublishedStories()
      .then((d) => alive && setStories(d))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const topics = useMemo(() => {
    const m = new Map<string, number>();
    stories.forEach((s) => { const t = topicOf(s, isRTL); if (t) m.set(t, (m.get(t) || 0) + 1); });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [stories, isRTL]);

  const shown = useMemo(() => (topic ? stories.filter((s) => topicOf(s, isRTL) === topic) : stories), [stories, topic, isRTL]);
  const lead = !topic ? shown.find((s) => s.is_featured) || shown[0] : undefined;
  const rest = lead ? shown.filter((s) => s !== lead) : shown;
  const places = useMemo(() => new Set(stories.map((s) => (isRTL ? s.location_ar : s.location_en || s.location_ar)).filter(Boolean)).size, [stories, isRTL]);

  const setTopic = (t: string) => {
    const next = new URLSearchParams(params);
    if (t) next.set("topic", t); else next.delete("topic");
    setParams(next, { replace: true });
  };

  const itemList = stories.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: isRTL ? "قصص الأثر — مؤسسة اليسر الخيرية" : "Impact stories — Al-Yusr Charity",
        itemListElement: stories.slice(0, 30).map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${BASE}/stories/${s.slug}`,
          name: isRTL ? s.title_ar : s.title_en || s.title_ar,
        })),
      }
    : null;

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "قصص الأثر — حكايات حقيقية من أسر وصلها خيركم | مؤسسة اليسر" : "Impact stories — real families your giving reached | Al-Yusr"}
        description={
          isRTL
            ? "قصص حقيقية موثّقة لأسر وأطفال في الدقهلية ومحافظات مصر اتغيّرت حياتهم بتبرعاتكم: إطعام، علاج، تعليم، سكن وجهاز عرائس — اقرأ واتبرع لقصة جديدة."
            : "Documented, real stories of families and children across Egypt whose lives changed thanks to your donations — read them and help write the next one."
        }
        path={topic ? `/stories?topic=${encodeURIComponent(topic)}` : "/stories"}
        image={lead?.image_url || family}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${BASE}/` },
        { name: isRTL ? "قصص الأثر" : "Impact stories", url: `${BASE}/stories` },
      ]} />
      {itemList && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(itemList)}</script>
        </Helmet>
      )}

      {/* Hero */}
      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto px-4 py-12 text-center md:py-16">
          <div className="flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "قصص الأثر" : "Impact stories" }]} />
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-secondary">
            <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "قصص الأثر" : "Impact stories"}
          </span>
          <h1 className="mt-3 text-balance text-3xl font-black md:text-5xl">{isRTL ? "بيوت اتغيّرت بخيركم" : "Homes your giving changed"}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/85 md:text-lg">
            {isRTL
              ? "كل قصة هنا حقيقية وموثّقة، اتكتبت بموافقة أصحابها — ووراها متبرع زيّك."
              : "Every story here is real and documented, shared with consent — and behind each one is a donor like you."}
          </p>
          {!loading && stories.length > 0 && (
            <div className="mx-auto mt-6 flex max-w-md justify-center gap-3">
              <span className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black"><span className="text-2xl text-secondary">{stories.length}</span> {isRTL ? "قصة" : "stories"}</span>
              {places > 0 && <span className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black"><span className="text-2xl text-secondary">{places}</span> {isRTL ? "مكان" : "places"}</span>}
              {topics.length > 0 && <span className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black"><span className="text-2xl text-secondary">{topics.length}</span> {isRTL ? "مجال" : "areas"}</span>}
            </div>
          )}
        </div>
      </section>

      <section className="bg-background pb-24 pt-10 md:pb-20 md:pt-14">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Topic filters */}
          {topics.length > 1 && (
            <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label={isRTL ? "المجالات" : "Areas"}>
              {[["", stories.length] as [string, number], ...topics].map(([t, n]) => (
                <button key={t || "all"} type="button" role="tab" aria-selected={topic === t} onClick={() => setTopic(t)}
                  className={`rounded-full border px-4 py-2 text-sm font-black transition ${topic === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-primary hover:border-secondary"}`}>
                  {t || (isRTL ? "كل القصص" : "All")} <span className="ms-1 text-xs opacity-70">{n}</span>
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="space-y-6" aria-busy="true">
              <div className="grid overflow-hidden rounded-[2rem] border border-border md:grid-cols-2">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="space-y-3 p-8"><Skeleton className="h-5 w-24 rounded-full" /><Skeleton className="h-8 w-4/5" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, k) => (
                  <div key={k} className="overflow-hidden rounded-3xl border border-border"><Skeleton className="aspect-[4/3] rounded-none" /><div className="space-y-2 p-5"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /></div></div>
                ))}
              </div>
            </div>
          ) : shown.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center">
              <Quote className="mx-auto h-10 w-10 text-secondary" />
              <p className="mt-3 font-black text-primary">{isRTL ? "القصص الجديدة بتتكتب دلوقتي" : "New stories are on their way"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{isRTL ? "تابع الحالات المفتوحة — كل حالة بتكتمل بتبقى قصة هنا." : "Follow the open cases — each one completed becomes a story here."}</p>
              <Button asChild className="mt-5"><Link to="/cases">{isRTL ? "شوف الحالات المفتوحة" : "See open cases"}</Link></Button>
            </div>
          ) : (
            <>
              {lead && <LeadStory s={lead} isRTL={isRTL} Arrow={Arrow} />}
              {rest.length > 0 && (
                <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${lead ? "mt-8" : ""}`}>
                  {rest.map((s) => <StoryTile key={s.slug} s={s} isRTL={isRTL} Arrow={Arrow} />)}
                </div>
              )}
            </>
          )}

          {/* Give */}
          <div className="mt-14 overflow-hidden rounded-[2rem] bg-[#06301c] p-6 text-center text-white md:p-10">
            <HandHeart className="mx-auto h-10 w-10 text-secondary" />
            <h2 className="mt-3 text-2xl font-black md:text-3xl">{isRTL ? "القصة الجاية ممكن تبدأ بتبرعك" : "The next story can start with your gift"}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/75 md:text-base">
              {isRTL ? "اختار حالة مفتوحة أو برنامج، وتابع أثر تبرعك لحد ما يوصل." : "Pick an open case or a program and follow your gift until it arrives."}
            </p>
            <div className="mt-6 grid gap-2.5 sm:flex sm:justify-center">
              <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to="/donate" data-source="stories" data-label="stories-donate-cta"><Heart className="h-5 w-5" />{isRTL ? "تبرع الآن" : "Donate now"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/cases" data-source="stories" data-label="stories-cases">{isRTL ? "الحالات المفتوحة" : "Open cases"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/projects" data-source="stories" data-label="stories-projects">{isRTL ? "البرامج الخيرية" : "Programs"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

function LeadStory({ s, isRTL, Arrow }: { s: StoryCard; isRTL: boolean; Arrow: typeof ArrowLeft }) {
  const title = isRTL ? s.title_ar : s.title_en || s.title_ar;
  const quote = isRTL ? s.quote_ar : s.quote_en || s.quote_ar;
  const place = isRTL ? s.location_ar : s.location_en || s.location_ar;
  const t = topicOf(s, isRTL);
  return (
    <Link to={`/stories/${s.slug}`} className="group grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft transition hover:shadow-card md:grid-cols-2">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted md:aspect-auto md:min-h-[360px]">
        {s.image_url ? (
          <img src={s.image_url} alt={title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center"><Quote className="h-12 w-12 text-secondary" /></div>
        )}
        {s.is_featured && <span className="absolute start-4 top-4 rounded-full bg-accent px-3 py-1 text-[11px] font-black text-accent-foreground shadow">{isRTL ? "قصة مميزة" : "Featured"}</span>}
      </div>
      <div className="flex flex-col justify-center p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-2">
          {t && <span className="rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-black text-primary">{t}</span>}
          {place && <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-secondary" />{place}</span>}
        </div>
        <h2 className="mt-3 text-2xl font-black leading-snug text-primary md:text-3xl">{title}</h2>
        {quote && <p className="mt-3 line-clamp-4 text-base leading-8 text-foreground/80 md:text-lg">«{quote}»</p>}
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-accent group-hover:underline">{isRTL ? "اقرأ القصة كاملة" : "Read the full story"} <Arrow className="h-4 w-4" /></span>
      </div>
    </Link>
  );
}

function StoryTile({ s, isRTL, Arrow }: { s: StoryCard; isRTL: boolean; Arrow: typeof ArrowLeft }) {
  const title = isRTL ? s.title_ar : s.title_en || s.title_ar;
  const quote = isRTL ? s.quote_ar : s.quote_en || s.quote_ar;
  const place = isRTL ? s.location_ar : s.location_en || s.location_ar;
  const t = topicOf(s, isRTL);
  return (
    <Link to={`/stories/${s.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {s.image_url ? (
          <img src={s.image_url} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground"><Quote className="h-10 w-10" /></div>
        )}
        {t && <span className="absolute start-3 top-3 max-w-[80%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-black text-primary shadow-sm">{t}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-black leading-snug text-primary">{title}</h3>
        {place && <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-secondary" />{place}</span>}
        {quote && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">«{quote}»</p>}
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-extrabold text-accent group-hover:underline">{isRTL ? "اقرأ القصة كاملة" : "Read the full story"} <Arrow className="h-3 w-3" /></span>
      </div>
    </Link>
  );
}

export default Stories;
