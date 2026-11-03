import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Quote, MapPin, Heart, Loader2,
  Calendar, Share2, Check, User, Sparkles, Building2, Tag
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { getStoryBySlug, listPublishedStories, type StoryCard } from "@/data/storiesApi";
import { toast } from "@/hooks/use-toast";

export default function StoryDetail() {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const { slug } = useParams();
  const [story, setStory] = useState<StoryCard | null>(null);
  const [program, setProgram] = useState<any>(null);
  const [relatedStories, setRelatedStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!slug) return;
    (async () => {
      setLoading(true);
      const data = await getStoryBySlug(slug);
      if (cancelled) return;
      setStory(data || null);

      // The program the story belongs to comes with the story (stories.program_id → `program`).
      setProgram(data?.program ? { slug: data.program.slug, title_ar: data.program.name_ar, title_en: data.program.name_en } : null);

      // Fetch related stories (excluding current)
      const all = await listPublishedStories();
      if (!cancelled) {
        // same program / category first, then the rest
        const others = all.filter((s) => s.slug !== slug);
        const same = (s: StoryCard) => (data?.program_id && s.program_id === data.program_id) || (!!data?.role_ar && s.role_ar === data.role_ar);
        setRelatedStories([...others.filter(same), ...others.filter((s) => !same(s))].slice(0, 3));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <PageLayout>
        <div aria-busy="true" aria-label="جاري التحميل">
          <div className="bg-primary/90 py-14">
            <div className="container mx-auto max-w-3xl space-y-4 px-4 text-center">
              <div className="mx-auto h-4 w-40 animate-pulse rounded bg-white/20" />
              <div className="mx-auto h-10 w-4/5 animate-pulse rounded bg-white/25" />
              <div className="mx-auto h-5 w-2/3 animate-pulse rounded bg-white/20" />
            </div>
          </div>
          <div className="container mx-auto max-w-3xl space-y-4 px-4 py-12">
            <div className="aspect-[16/9] w-full animate-pulse rounded-3xl bg-muted" />
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className={`h-4 animate-pulse rounded bg-muted ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />)}
          </div>
        </div>
      </PageLayout>
    );
  }
  if (!story) return <Navigate to="/stories" replace />;

  const title = isAR ? story.title_ar : (story.title_en || story.title_ar);
  const role = isAR ? story.role_ar : (story.role_en || story.role_ar);
  const location = isAR ? story.location_ar : (story.location_en || story.location_ar);
  const quote = isAR ? story.quote_ar : (story.quote_en || story.quote_ar);
  const body = isAR ? (story.body_ar || story.quote_ar) : (story.body_en || story.quote_en || story.quote_ar);
  const beneficiary = story.beneficiary_name || "";
  const Arrow = isAR ? ArrowLeft : ArrowRight;

  const seo = story.seo || {};
  const metaTitle = (isAR ? seo.meta_title_ar : seo.meta_title_en) || title;
  const metaDesc = (isAR ? seo.meta_desc_ar : seo.meta_desc_en) || (quote || "").slice(0, 160);

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: isAR ? "تم نسخ رابط القصة بنجاح!" : "Story link copied!" });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <PageLayout>
      <SEOHelmet
        title={`${metaTitle} | ${isAR ? "قصص الأثر — مؤسسة اليسر" : "Al-Yusr Stories"}`}
        description={metaDesc}
        path={`/stories/${slug}`}
        image={seo.og_image_url || story.image_url || undefined}
      />

      <article dir={isAR ? "rtl" : "ltr"} className="min-h-screen bg-background pb-16">
        {/* Header Hero Banner */}
        <header className="relative overflow-hidden bg-primary text-primary-foreground">
          {story.image_url && (
            <div className="absolute inset-0">
              <img src={story.image_url} alt={title} className="h-full w-full object-cover opacity-20 filter blur-sm scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/90 to-primary/60" />
            </div>
          )}
          <div className="container relative mx-auto max-w-4xl px-4 py-12 md:py-16">
            <div className="text-primary-foreground/80">
              <Breadcrumbs items={[
                { name: isAR ? "الرئيسية" : "Home", href: "/" },
                { name: isAR ? "قصصنا" : "Stories", href: "/stories" },
                { name: title },
              ]} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-extrabold">
              {role && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1 text-secondary-foreground shadow-sm">
                  <Tag className="h-3.5 w-3.5" />
                  {role}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3.5 py-1 text-white backdrop-blur-sm">
                  <MapPin className="h-3.5 w-3.5 text-secondary" />
                  {location}
                </span>
              )}
              {story.is_featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3.5 py-1 text-accent-foreground shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isAR ? "قصة مميّزة" : "Featured"}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-black leading-tight text-white sm:text-4xl md:text-5xl">{title}</h1>

            {quote && (
              <blockquote className="mt-5 flex max-w-3xl gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-base italic leading-relaxed text-primary-foreground/95 backdrop-blur-md md:p-6 md:text-xl">
                <Quote className="h-7 w-7 shrink-0 text-secondary" />
                <span>&ldquo;{quote}&rdquo;</span>
              </blockquote>
            )}
          </div>
        </header>

        {/* Content & Details Section */}
        <section className="py-10 md:py-14">
          <div className="container mx-auto max-w-3xl px-4 space-y-8">

            {/* Quick Metadata Box */}
            <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-3 text-xs font-bold">
              {beneficiary && (
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-3">
                  <User className="h-4 w-4 text-secondary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isAR ? "المستفيد" : "Beneficiary"}</p>
                    <p className="text-primary truncate">{beneficiary}</p>
                  </div>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-3">
                  <MapPin className="h-4 w-4 text-secondary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isAR ? "الموقع" : "Location"}</p>
                    <p className="text-primary truncate">{location}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-3">
                <Calendar className="h-4 w-4 text-secondary shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">{isAR ? "التوثيق" : "Verification"}</p>
                  <p className="text-primary">{isAR ? "موثّق بالصور والميدان" : "Field Verified"}</p>
                </div>
              </div>
            </div>

            {/* Main Cover Image */}
            {story.image_url && (
              <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
                <img
                  src={story.image_url}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  className="h-auto max-h-[460px] w-full object-cover"
                />
              </div>
            )}

            {/* Full Story Body Text */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-10">
              <div className="prose prose-lg max-w-none whitespace-pre-line leading-relaxed text-foreground/90 md:text-lg">
                {body}
              </div>

              {/* Share & Verification bar */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {isAR ? "قصة حقيقية من أنشطة مؤسسة اليسر في الدقهلية" : "Real story from Al-Yusr activities in Dakahlia"}
                </div>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 text-xs font-extrabold">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
                  {copied ? (isAR ? "تم نسخ الرابط!" : "Copied!") : (isAR ? "مشاركة القصة" : "Share story")}
                </Button>
              </div>
            </div>

            {/* Responsive Donate CTA Box */}
            <div className="rounded-3xl bg-orange-grad p-6 shadow-cta text-accent-foreground md:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-start">
                <div className="space-y-1">
                  <span className="inline-block rounded-full bg-black/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider">
                    {isAR ? "ساهم في صنع أثر جديد" : "Create a new impact"}
                  </span>
                  <h3 className="text-xl font-black md:text-2xl text-accent-foreground">
                    {isAR ? "تبرّع الآن وادعم أسرة محتاجة" : "Donate now & support a family"}
                  </h3>
                  <p className="text-xs font-bold text-accent-foreground/90 max-w-md">
                    {isAR
                      ? "كل تبرع منك بيغير حياة أسرة ثانية وبيوصلهم الأمل والخير بأمانة."
                      : "Every donation changes another family's life and brings them hope with trust."}
                  </p>
                </div>
                <Button asChild size="lg" className="h-12 px-7 bg-primary text-primary-foreground font-black hover:bg-primary/90 shadow-lg shrink-0">
                  <Link to="/donate" className="inline-flex items-center gap-2 no-underline">
                    <Heart className="h-5 w-5 fill-current text-secondary" />
                    <span>{isAR ? "تبرّع الآن" : "Donate Now"}</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Linked Program Card if exists */}
            {program && (
              <Link
                to={`/programs/${program.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:border-primary hover:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/15 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase text-muted-foreground">{isAR ? "البرنامج المرتبط بهذه القصة" : "Program linked to this story"}</p>
                    <p className="font-black text-primary text-base group-hover:text-secondary transition-colors">{isAR ? program.title_ar : (program.title_en || program.title_ar)}</p>
                  </div>
                </div>
                <Arrow className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
              </Link>
            )}

            {/* Related Stories Section */}
            {relatedStories.length > 0 && (
              <div className="pt-8 border-t border-border space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-primary md:text-xl">
                    {isAR ? "قصص أخرى من أثر الخير" : "Other impact stories"}
                  </h3>
                  <Link to="/stories" className="text-xs font-extrabold text-secondary hover:underline">
                    {isAR ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {relatedStories.map((rel) => (
                    <Link
                      key={rel.slug}
                      to={`/stories/${rel.slug}`}
                      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        {rel.image_url ? (
                          <img
                            src={rel.image_url}
                            alt={isAR ? rel.title_ar : rel.title_en}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-muted-foreground"><Quote className="h-8 w-8" /></div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="line-clamp-1 font-black text-sm text-primary group-hover:text-secondary transition-colors">
                          {isAR ? rel.title_ar : (rel.title_en || rel.title_ar)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                          "{isAR ? rel.quote_ar : (rel.quote_en || rel.quote_ar)}"
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation back */}
            <div className="pt-6 text-center">
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 font-extrabold">
                <Link to="/stories">
                  <Arrow className="me-2 h-4 w-4" /> {isAR ? "عرض جميع القصص" : "View all stories"}
                </Link>
              </Button>
            </div>

          </div>
        </section>
      </article>
    </PageLayout>
  );
}
