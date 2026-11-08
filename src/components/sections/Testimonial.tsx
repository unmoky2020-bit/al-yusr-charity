import { useCallback, useEffect, useRef, useState } from "react";
import { Quote, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, MapPin, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LangContext";
import { listFeaturedStories, type StoryCard } from "@/data/storiesApi";

/**
 * «قصص الأثر» on the home page: real stories from the dashboard (the ones marked «مميزة», else the
 * latest). One story at a time — photo, a short quote, who and where — rotating every 7s, paused while
 * the visitor hovers, focuses or swipes. Hidden when there is no story.
 */
export const Testimonial = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const [items, setItems] = useState<StoryCard[]>([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    listFeaturedStories(6)
      .then((s) => alive && setItems(s))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const count = items.length;
  const go = useCallback((step: number) => setI((p) => (p + step + count) % Math.max(1, count)), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = window.setInterval(() => go(1), 7000);
    return () => window.clearInterval(id);
  }, [count, paused, go]);

  if (!loading && count === 0) return null;

  const PrevIcon = isAR ? ChevronRight : ChevronLeft;
  const NextIcon = isAR ? ChevronLeft : ChevronRight;
  const Arrow = isAR ? ArrowLeft : ArrowRight;
  const it = items[i];
  const name = it ? it.beneficiary_name || (isAR ? it.title_ar : it.title_en || it.title_ar) : "";
  const role = it ? (isAR ? it.role_ar : it.role_en || it.role_ar) : "";
  const quote = it ? (isAR ? it.quote_ar : it.quote_en || it.quote_ar) : "";
  const place = it ? (isAR ? it.location_ar : it.location_en || it.location_ar) : "";
  const program = it?.program ? (isAR ? it.program.name_ar : it.program.name_en || it.program.name_ar) : "";

  return (
    <section className="relative overflow-hidden bg-muted/40 pattern-hero-soft py-16 md:py-24" aria-labelledby="impact-stories-title">
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-secondary/15 px-4 py-1 text-[11px] font-extrabold text-primary">
            {isAR ? "قصص الأثر" : "Impact stories"}
          </span>
          <h2 id="impact-stories-title" className="mt-3 text-2xl font-black leading-[1.3] text-primary md:text-4xl">
            {isAR ? "بيوت تغيّرت بخيركم" : "Homes your giving changed"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            {isAR
              ? "حكايات حقيقية من أسر وصلها تبرعكم — بأسمائهم وأماكنهم وبموافقتهم."
              : "Real stories from families your gifts reached — shared with their consent."}
          </p>
        </div>

        <div
          className="mx-auto mt-10 max-w-5xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            touchX.current = null;
            setPaused(false);
            if (start === null) return;
            const dx = e.changedTouches[0].clientX - start;
            if (Math.abs(dx) > 40) go((dx < 0) === isAR ? -1 : 1);
          }}
        >
          <div className="relative overflow-hidden rounded-[2rem] bg-card shadow-card ring-1 ring-border" aria-live="polite">
            {!it ? (
              <div className="grid animate-pulse gap-0 md:grid-cols-[0.9fr_1.1fr]" aria-busy="true">
                <div className="aspect-[4/3] bg-muted md:aspect-auto md:min-h-[340px]" />
                <div className="space-y-3 p-6 md:p-10">
                  <div className="h-5 w-24 rounded-full bg-muted" />
                  <div className="h-5 w-full rounded bg-muted" /><div className="h-5 w-4/5 rounded bg-muted" />
                  <div className="h-4 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ) : (
              <article key={it.slug} className="grid animate-fade-in-up md:min-h-[340px] md:grid-cols-[0.9fr_1.1fr]">
                <Link to={`/stories/${it.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-muted md:aspect-auto" tabIndex={-1} aria-hidden>
                  {it.image_url ? (
                    <img src={it.image_url} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center bg-secondary/10"><Quote className="h-12 w-12 text-secondary" /></div>
                  )}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent md:bg-gradient-to-l md:from-transparent md:via-transparent md:to-black/10" />
                </Link>
                <div className="flex flex-col justify-center p-6 text-center md:p-10 md:text-start">
                  <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    {(program || role) && (
                      <span className="rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-black text-primary">{program || role}</span>
                    )}
                    {place && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-secondary" /> {place}
                      </span>
                    )}
                  </div>
                  <blockquote className="relative mt-4">
                    <Quote aria-hidden className="absolute -top-2 start-0 hidden h-8 w-8 text-secondary/30 md:block" />
                    <p className="line-clamp-4 text-lg font-bold leading-relaxed text-foreground md:ps-10 md:text-2xl md:leading-[1.6]">{quote}</p>
                  </blockquote>
                  <div className="mt-5 md:ps-10">
                    <div className="font-black text-primary">{name}</div>
                    {role && program && <div className="text-xs text-muted-foreground md:text-sm">{role}</div>}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-start md:ps-10">
                    <Link to={`/stories/${it.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary/90">
                      {isAR ? "اقرأ القصة كاملة" : "Read the full story"} <Arrow className="h-3.5 w-3.5" />
                    </Link>
                    <Link to="/donate" data-source="home-stories" data-label="stories-donate" className="inline-flex items-center gap-1.5 text-xs font-black text-accent hover:underline">
                      <Heart className="h-3.5 w-3.5" /> {isAR ? "اكتب قصة جديدة بتبرعك" : "Write the next story"}
                    </Link>
                  </div>
                </div>
              </article>
            )}
          </div>

          {count > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button type="button" onClick={() => go(-1)} aria-label={isAR ? "القصة السابقة" : "Previous story"}
                className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary shadow ring-1 ring-border transition hover:bg-secondary hover:text-secondary-foreground">
                <PrevIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-1.5" role="tablist" aria-label={isAR ? "القصص" : "Stories"}>
                {items.map((s, k) => (
                  <button key={s.slug} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)}
                    aria-label={isAR ? `القصة ${k + 1}` : `Story ${k + 1}`}
                    className={`h-2 rounded-full transition-all ${k === i ? "w-7 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/50"}`} />
                ))}
              </div>
              <button type="button" onClick={() => go(1)} aria-label={isAR ? "القصة التالية" : "Next story"}
                className="grid h-10 w-10 place-items-center rounded-full bg-card text-primary shadow ring-1 ring-border transition hover:bg-secondary hover:text-secondary-foreground">
                <NextIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/stories" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-primary transition-colors hover:text-secondary">
              {isAR ? "كل قصص الأثر" : "All impact stories"} <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
