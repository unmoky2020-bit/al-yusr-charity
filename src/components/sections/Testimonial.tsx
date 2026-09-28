import { useEffect, useState } from "react";
import { Quote, ChevronLeft, ChevronRight, Star, ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { listFeaturedStories, STATIC_STORIES, type StoryCard } from "@/data/storiesApi";
import { Link } from "react-router-dom";

// Static fallback shown immediately — replaced once async resolves
const INITIAL_ITEMS = STATIC_STORIES.filter((s) => s.is_featured && s.is_published);

export const Testimonial = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const [items, setItems] = useState<StoryCard[]>(INITIAL_ITEMS);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadStories = async () => {
      try {
        const stories = await listFeaturedStories(5);
        if (cancelled) return;
        if (stories.length > 0) setItems(stories);
      } catch {
        // keep initial static fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStories();
    return () => { cancelled = true; };
  }, []);

  const next = () => setI((p) => (p + 1) % Math.max(1, items.length));
  const prev = () => setI((p) => (p - 1 + Math.max(1, items.length)) % Math.max(1, items.length));

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [items.length]);

  const Prev = isAR ? ChevronRight : ChevronLeft;
  const Next = isAR ? ChevronLeft : ChevronRight;
  const Arrow = isAR ? ArrowLeft : ArrowRight;

  const it = items[i];
  if (!it) return null;

  const title  = isAR ? it.title_ar  : (it.title_en  || it.title_ar);
  const role   = isAR ? it.role_ar   : (it.role_en   || it.role_ar);
  const quote  = isAR ? it.quote_ar  : (it.quote_en  || it.quote_ar);

  return (
    <section className="relative overflow-hidden bg-muted/40 pattern-hero-soft py-16 md:py-24">
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-secondary/15 px-4 py-1 text-[11px] font-extrabold text-primary">
            {isAR ? "شهادات الميدان" : "Field testimonials"}
          </span>
          <h2 className="mt-3 text-2xl font-black leading-[1.3] text-primary md:text-4xl">
            {isAR ? "قصص حقيقية... تغيير حقيقي" : "Real stories… real change"}
          </h2>
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-card p-5 shadow-card ring-1 ring-border md:p-10">
            <div key={i} className="animate-fade-in-up flex flex-col items-center gap-6 md:flex-row md:items-start">
              {/* Avatar / image */}
              <div className="relative shrink-0">
                {it.image_url ? (
                  <img
                    src={it.image_url}
                    alt={title}
                    width={160} height={160}
                    loading="lazy" decoding="async"
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-secondary/40 md:h-32 md:w-32"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary/15 ring-4 ring-secondary/40 md:h-32 md:w-32">
                    <Quote className="h-8 w-8 text-secondary" />
                  </div>
                )}
                <span className="absolute -bottom-1 end-1 grid h-7 w-7 place-items-center rounded-full bg-secondary text-secondary-foreground shadow">
                  <Quote className="h-3.5 w-3.5" />
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-start">
                <div className="flex items-center justify-center gap-0.5 md:justify-start">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="mt-3 text-base leading-relaxed text-foreground md:text-xl">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="mt-4">
                  <div className="font-extrabold text-primary">{title}</div>
                  {role && <div className="text-xs text-muted-foreground md:text-sm">{role}</div>}
                </div>
                {/* Link to full story */}
                <Link
                  to={`/stories/${it.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-accent hover:underline"
                >
                  {isAR ? "اقرأ القصة كاملة" : "Read full story"} <Arrow className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Controls */}
          {items.length > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={prev}
                aria-label="prev"
                className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary shadow ring-1 ring-border transition hover:bg-secondary hover:text-secondary-foreground"
              >
                <Prev className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-1.5">
                {items.map((_, k) => (
                  <button
                    key={k}
                    onClick={() => setI(k)}
                    aria-label={`slide ${k + 1}`}
                    className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-primary" : "w-2 bg-primary/30"}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                aria-label="next"
                className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary shadow ring-1 ring-border transition hover:bg-secondary hover:text-secondary-foreground"
              >
                <Next className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* CTA to stories page */}
          <div className="mt-6 text-center">
            <Link
              to="/stories"
              className="inline-flex items-center gap-1.5 text-sm font-extrabold text-primary hover:text-secondary transition-colors"
            >
              {isAR ? "شاهد كل قصصنا" : "View all our stories"} <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
