import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Heart, MapPin, AlertCircle, Loader2, Calendar, User,
  CheckCircle2, Package, Truck, FileCheck, Image as ImageIcon, Play, FileText,
  ChevronLeft, ChevronRight, Maximize2, Download, X,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { BreadcrumbSchema } from "@/components/common/Schemas";
import { Helmet } from "react-helmet-async";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import {
  getCaseByRef, listCaseUpdates, listCaseMedia, listCaseJourney,
  getCaseImageUrl,
  type Urgency, type CaseMediaRow, type JourneyStepRow,
} from "@/data/casesApi";

const PAGE_SIZE = 9;

const URG: Record<Urgency, { ar: string; en: string; tone: string }> = {
  low:      { ar: "منخفض",  en: "Low",      tone: "bg-secondary/20 text-primary" },
  medium:   { ar: "متوسط",  en: "Medium",   tone: "bg-accent/15 text-accent" },
  high:     { ar: "عاجل",   en: "Urgent",   tone: "bg-destructive/15 text-destructive" },
  critical: { ar: "حرج",    en: "Critical", tone: "bg-destructive/20 text-destructive" },
};

type StepKey = JourneyStepRow["step_key"];
const STEP_META: Record<StepKey, { ar: string; en: string; Icon: typeof CheckCircle2 }> = {
  created:       { ar: "تم إنشاء الحالة",  en: "Case created",       Icon: FileText },
  paid:          { ar: "تم الدفع",         en: "Payment received",   Icon: CheckCircle2 },
  received:      { ar: "تم استلام التبرع", en: "Donation received",  Icon: CheckCircle2 },
  in_processing: { ar: "قيد المعالجة",     en: "In processing",      Icon: Package },
  executing:     { ar: "جارِ التنفيذ",      en: "Executing",          Icon: Package },
  delivered:     { ar: "تم التسليم",       en: "Delivered",          Icon: Truck },
  documented:    { ar: "تم التوثيق",       en: "Documented",         Icon: FileCheck },
  completed:     { ar: "اكتمل",           en: "Completed",          Icon: CheckCircle2 },
  failed:        { ar: "فشل",             en: "Failed",             Icon: AlertCircle },
  refunded:      { ar: "مُستردّ",          en: "Refunded",           Icon: AlertCircle },
};

const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

type TimelineItem = {
  id: string;
  kind: "journey" | "update";
  title: string;
  body?: string | null;
  media_url?: string | null;
  occurred_at: string;
  step_key?: StepKey;
};

const CaseDetail = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const { ref } = useParams();
  const base = "https://elyusr.org";
  const [c, setC] = useState<Awaited<ReturnType<typeof getCaseByRef>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<Awaited<ReturnType<typeof listCaseUpdates>>>([]);
  const [media, setMedia] = useState<CaseMediaRow[]>([]);
  const [journey, setJourney] = useState<Awaited<ReturnType<typeof listCaseJourney>>>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const lightboxFigRef = useRef<HTMLDivElement | null>(null);
  const lightboxDialogRef = useRef<HTMLDivElement | null>(null);
  const lightboxOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    setLoading(true);
    let onVisible: (() => void) | null = null;
    getCaseByRef(ref).then(async (row) => {
      setC(row);
      if (!row) return;
      const [u, m, j] = await Promise.all([
        listCaseUpdates(row.id).catch(() => []),
        listCaseMedia(row.id).catch(() => []),
        listCaseJourney(row.id).catch(() => []),
      ]);
      setUpdates(u); setMedia(m); setJourney(j);

      // Refresh updates / media / journey when the visitor comes back to the tab
      // (replaces the old Supabase realtime channel).
      const reload = async () => {
        const [u2, m2, j2] = await Promise.all([
          listCaseUpdates(row.id).catch(() => []),
          listCaseMedia(row.id).catch(() => []),
          listCaseJourney(row.id).catch(() => []),
        ]);
        setUpdates(u2); setMedia(m2); setJourney(j2);
      };
      onVisible = () => { if (document.visibilityState === "visible") void reload(); };
      document.addEventListener("visibilitychange", onVisible);
    }).finally(() => { setLoading(false); });
    return () => { if (onVisible) document.removeEventListener("visibilitychange", onVisible); };
  }, [ref]);

  const lightbox = lightboxIdx !== null ? media[lightboxIdx] ?? null : null;
  const closeLightbox = useCallback(() => {
    setLightboxIdx(null);
    // Restore focus to the thumbnail that opened the lightbox.
    requestAnimationFrame(() => {
      const target = lightboxOpenerRef.current;
      lightboxOpenerRef.current = null;
      if (target && typeof target.focus === "function") target.focus();
    });
  }, []);
  const openLightbox = useCallback((idx: number, opener: HTMLElement | null) => {
    lightboxOpenerRef.current = opener;
    setLightboxIdx(idx);
  }, []);
  const stepLightbox = useCallback((dir: 1 | -1) => {
    setLightboxIdx((i) => {
      if (i === null || media.length === 0) return i;
      return (i + dir + media.length) % media.length;
    });
  }, [media.length]);
  const goFullscreen = useCallback(() => {
    const el = lightboxFigRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (lightboxIdx === null) return;
    // Move focus into the dialog (close button) when opened.
    const dialog = lightboxDialogRef.current;
    const focusables = () => dialog
      ? Array.from(dialog.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),video[controls],[tabindex]:not([tabindex="-1"])'
        )).filter((el) => !el.hasAttribute("inert") && el.offsetParent !== null)
      : [];
    requestAnimationFrame(() => {
      const list = focusables();
      (list[0] ?? dialog)?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); stepLightbox(isRTL ? -1 : 1); }
      else if (e.key === "ArrowLeft")  { e.preventDefault(); stepLightbox(isRTL ? 1 : -1); }
      else if (e.key.toLowerCase() === "f") { e.preventDefault(); goFullscreen(); }
      else if (e.key === "Tab") {
        // Focus trap: cycle within dialog only.
        const list = focusables();
        if (list.length === 0) { e.preventDefault(); dialog?.focus(); return; }
        const first = list[0]; const last = list[list.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && (active === first || !dialog?.contains(active))) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && (active === last || !dialog?.contains(active))) {
          e.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [lightboxIdx, isRTL, closeLightbox, stepLightbox, goFullscreen]);

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];
    for (const j of journey) {
      const meta = STEP_META[j.step_key as StepKey];
      items.push({
        id: `j-${j.id}`,
        kind: "journey",
        title: (isRTL ? (j.title_ar || meta?.ar) : (j.title_en || meta?.en)) || j.step_key,
        body: isRTL ? j.note_ar : j.note_en,
        media_url: j.media_url,
        occurred_at: j.occurred_at,
        step_key: j.step_key as StepKey,
      });
    }
    for (const u of updates) {
      items.push({
        id: `u-${u.id}`,
        kind: "update",
        title: isRTL ? "تحديث الحالة" : "Case update",
        body: u.body,
        media_url: u.image_url,
        occurred_at: u.created_at,
      });
    }
    return items.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }, [journey, updates, isRTL]);

  if (loading) return (
    <PageLayout><div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></PageLayout>
  );
  if (!c) return (
    <PageLayout>
      <div className="container mx-auto py-24 text-center">
        <p className="text-lg font-bold">{isRTL ? "الحالة غير موجودة" : "Case not found"}</p>
        <Button asChild className="mt-4"><Link to="/cases">{isRTL ? "كل الحالات" : "All cases"}</Link></Button>
      </div>
    </PageLayout>
  );

  const need = Number(c.needed_amount) || 0;
  const raised = Number(c.raised_amount) || 0;
  const pct = need > 0 ? Math.min(100, Math.round((raised / need) * 100)) : 0;
  const u = URG[c.urgency as Urgency] ?? URG.medium;
  const cat = (c as unknown as { case_categories?: { name_ar: string; name_en: string; slug: string } }).case_categories;

  const visibleMedia = media.slice(0, visibleCount);
  const caseUrl = `${base}/cases/${c.ref_code}`;
  const mediaImages = media.filter((m) => !isVideo(m.url));
  const mediaVideos = media.filter((m) => isVideo(m.url));
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: (c.story || c.title).slice(0, 200),
    image: [c.cover_image_url, ...mediaImages.map((m) => m.url)].filter(Boolean),
    datePublished: c.created_at,
    dateModified: c.updated_at || c.created_at,
    inLanguage: isRTL ? "ar-EG" : "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": caseUrl },
    publisher: { "@id": `${base}/#org` },
    locationCreated: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: c.city ?? c.governorate, addressRegion: c.governorate, addressCountry: "EG" } },
  };
  const galleryJsonLd = media.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: `${c.title} — ${isRTL ? "معرض التوثيق" : "Documentation"}`,
    url: `${caseUrl}#case-media-heading`,
    associatedMedia: [
      ...mediaImages.map((m) => ({
        "@type": "ImageObject",
        "@id": `${caseUrl}#media-${m.id}`,
        contentUrl: m.url,
        url: `${caseUrl}#media-${m.id}`,
        caption: (isRTL ? m.caption_ar : m.caption_en) || (isRTL ? m.caption_en : m.caption_ar) || c.title,
        uploadDate: m.created_at,
        creditText: "Al-Yusr Charity Foundation",
        copyrightNotice: "© Al-Yusr Charity Foundation",
        creator: { "@type": "Organization", name: "Al-Yusr Charity Foundation", url: "https://elyusr.org/" },
        license: "https://elyusr.org/terms",
        acquireLicensePage: "https://elyusr.org/contact",
      })),
      ...mediaVideos.map((m) => ({
        "@type": "VideoObject",
        "@id": `${caseUrl}#media-${m.id}`,
        name: (isRTL ? m.caption_ar : m.caption_en) || c.title,
        description: (isRTL ? m.caption_ar : m.caption_en) || (c.story || c.title).slice(0, 200),
        contentUrl: m.url,
        url: `${caseUrl}#media-${m.id}`,
        thumbnailUrl: c.cover_image_url || undefined,
        uploadDate: m.created_at,
      })),
    ],
  } : null;
  const timelineJsonLd = timeline.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${c.title} — ${isRTL ? "الجدول الزمني" : "Timeline"}`,
    url: `${caseUrl}#case-timeline-heading`,
    itemListElement: timeline.slice(0, 50).map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.title,
      url: `${caseUrl}#timeline-${t.id}`,
      ...(t.body ? { description: t.body } : {}),
    })),
  } : null;

  return (
    <PageLayout>
      <SEOHelmet
        title={`${c.title} — ${isRTL ? "حالة" : "Case"} ${c.ref_code} | ${isRTL ? "اليسر" : "Al-Yusr"}`}
        description={(c.story || c.title).slice(0, 158)}
        path={`/cases/${c.ref_code}`}
        image={c.cover_image_url ?? undefined}
      />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "الحالات" : "Cases", url: `${base}/cases` },
        { name: c.title, url: `${base}/cases/${c.ref_code}` },
      ]} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        {galleryJsonLd && <script type="application/ld+json">{JSON.stringify(galleryJsonLd)}</script>}
        {timelineJsonLd && <script type="application/ld+json">{JSON.stringify(timelineJsonLd)}</script>}
      </Helmet>

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="text-primary-foreground/85">
            <Breadcrumbs items={[
              { name: isRTL ? "الرئيسية" : "Home", href: "/" },
              { name: isRTL ? "الحالات" : "Cases", href: "/cases" },
              { name: c.title },
            ]} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${u.tone}`}>
              <AlertCircle className="h-3 w-3" />{isRTL ? u.ar : u.en}
            </span>
            {cat && <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold">{isRTL ? cat.name_ar : cat.name_en}</span>}
            <span className="font-mono text-[10px] opacity-80">{c.ref_code}</span>
          </div>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">{c.title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-primary-foreground/85">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {c.city ?? c.governorate}</span>
            <span className="inline-flex items-center gap-1"><User className="h-4 w-4" /> {c.beneficiary_name}</span>
            {c.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {isRTL ? "آخر موعد: " : "Deadline: "}{c.deadline}</span>}
          </div>
          {/* What this case belongs to: a program, a project or a donation campaign. */}
          {(() => {
            const link = c.program_slug
              ? { to: `/programs/${c.program_slug}`, ar: `ضمن برنامج: ${c.program_name ?? ""}`, en: `Part of program: ${c.program_name ?? ""}` }
              : c.project_slug
                ? { to: `/donate?project=${encodeURIComponent(c.project_slug)}`, ar: `ضمن مشروع: ${c.project_name ?? ""}`, en: `Part of project: ${c.project_name ?? ""}` }
                : c.donation_campaign_slug
                  ? { to: `/donate?campaign=${encodeURIComponent(c.donation_campaign_slug)}`, ar: `ضمن حملة: ${c.donation_campaign_name ?? ""}`, en: `Part of campaign: ${c.donation_campaign_name ?? ""}` }
                  : null;
            return link ? (
              <Link to={link.to} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold hover:bg-white/25">
                {isRTL ? link.ar : link.en}
              </Link>
            ) : null;
          })()}
        </div>
      </section>

      <section className="bg-background py-10 md:py-14">
        <div className="container mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[2fr_1fr]">
          <article className="space-y-4">
            {(() => {
              const coverImg = c.cover_image_url || getCaseImageUrl(c);
              return coverImg ? (
                <div className="aspect-video overflow-hidden rounded-3xl bg-muted shadow-soft">
                  <img src={coverImg} alt={c.title} className="h-full w-full object-cover" />
                </div>
              ) : null;
            })()}
            <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground/90">{c.story || (isRTL ? "تفاصيل الحالة قيد التحديث." : "Story is being updated.")}</div>

            {media.length > 0 && (
              <section className="mt-8" aria-labelledby="case-media-heading">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 id="case-media-heading" className="text-lg font-extrabold text-primary inline-flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" /> {isRTL ? "معرض التوثيق" : "Documentation gallery"}
                  </h2>
                  <span className="text-xs font-bold text-muted-foreground">{media.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visibleMedia.map((m, i) => {
                    const cap = isRTL ? (m.caption_ar || m.caption_en) : (m.caption_en || m.caption_ar);
                    const video = isVideo(m.url);
                    return (
                      <button
                        key={m.id}
                        id={`media-${m.id}`}
                        type="button"
                        onClick={(e) => openLightbox(i, e.currentTarget)}
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={cap || (isRTL ? "وسائط الحالة" : "Case media")}
                      >
                        {video ? (
                          <>
                            <video src={m.url} className="h-full w-full object-cover" preload="metadata" muted />
                            <div className="absolute inset-0 grid place-items-center bg-black/30 text-white"><Play className="h-8 w-8" /></div>
                          </>
                        ) : (
                          <img src={m.url} alt={cap || ""} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                        )}
                        <span className="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-extrabold text-white">{m.kind}</span>
                        {cap && <span className="absolute inset-x-0 bottom-0 line-clamp-1 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] font-bold text-white">{cap}</span>}
                      </button>
                    );
                  })}
                </div>
                {visibleCount < media.length && (
                  <div className="mt-4 grid place-items-center">
                    <Button variant="outline" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} className="font-extrabold">
                      {isRTL ? `عرض المزيد (${media.length - visibleCount})` : `Load more (${media.length - visibleCount})`}
                    </Button>
                  </div>
                )}
              </section>
            )}

            {timeline.length > 0 && (
              <section className="mt-10" aria-labelledby="case-timeline-heading">
                <h2 id="case-timeline-heading" className="mb-4 text-lg font-extrabold text-primary">
                  {isRTL ? "الجدول الزمني والتحديثات" : "Timeline & updates"}
                </h2>
                <ol className="relative space-y-4 ps-6 before:absolute before:bottom-2 before:start-2 before:top-2 before:w-px before:bg-border">
                  {timeline.map((item) => {
                    const Icon = item.step_key ? STEP_META[item.step_key]?.Icon ?? CheckCircle2 : CheckCircle2;
                    return (
                      <li key={item.id} id={`timeline-${item.id}`} className="relative">
                        <span className={`absolute -start-[27px] top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-background ${item.kind === "journey" ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"}`}>
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-primary">{item.title}</p>
                            <time className="text-[11px] font-bold text-muted-foreground" dateTime={item.occurred_at}>
                              {new Date(item.occurred_at).toLocaleString(isRTL ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                            </time>
                          </div>
                          {item.body && <p className="mt-2 whitespace-pre-line text-sm text-foreground/90">{item.body}</p>}
                          {item.media_url && (
                            isVideo(item.media_url)
                              ? <video src={item.media_url} controls className="mt-3 max-h-72 w-full rounded-xl bg-black object-contain" />
                              : <img src={item.media_url} alt="" loading="lazy" className="mt-3 max-h-72 w-full rounded-xl object-cover" />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {timeline.length === 0 && media.length === 0 && (
              <p className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm font-bold text-muted-foreground">
                {isRTL ? "لا توجد تحديثات أو توثيق منشور لهذه الحالة بعد." : "No published updates or media yet for this case."}
              </p>
            )}
          </article>

          <aside className="rounded-3xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24 lg:self-start">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-orange-grad" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-extrabold">
              <span dir="ltr" className="text-primary">{raised.toLocaleString()} / {need.toLocaleString()} EGP</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <Button asChild className="mt-4 h-12 w-full bg-orange-grad text-base font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
              <Link to={`/donate?case=${c.ref_code}`} data-source="case-detail" data-label={`case-${c.ref_code}`}>
                <Heart className="h-5 w-5" />{isRTL ? "تبرع الآن" : "Donate now"}
              </Link>
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground">{isRTL ? "كل تبرع موثّق ومتابع حتى الإغلاق." : "Every donation is documented and tracked until closed."}</p>
          </aside>
        </div>
      </section>

      {lightbox && (
        <div
          ref={lightboxDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={isRTL ? "معرض الصور" : "Media viewer"}
          tabIndex={-1}
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label={isRTL ? "إغلاق" : "Close"}
          ><X className="h-5 w-5" /></button>
          {media.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); stepLightbox(isRTL ? 1 : -1); }}
                className="absolute start-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label={isRTL ? "السابق" : "Previous"}
              >{isRTL ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}</button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); stepLightbox(isRTL ? -1 : 1); }}
                className="absolute end-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label={isRTL ? "التالي" : "Next"}
              >{isRTL ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}</button>
            </>
          )}
          <div ref={lightboxFigRef} className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {isVideo(lightbox.url)
              ? <video src={lightbox.url} controls autoPlay className="max-h-[80vh] w-full rounded-xl bg-black object-contain" />
              : <img src={lightbox.url} alt={(isRTL ? lightbox.caption_ar : lightbox.caption_en) || ""} className="max-h-[80vh] w-auto rounded-xl object-contain" />}
            {(lightbox.caption_ar || lightbox.caption_en) && (
              <p className="mt-3 text-center text-sm font-bold text-white">
                {isRTL ? (lightbox.caption_ar || lightbox.caption_en) : (lightbox.caption_en || lightbox.caption_ar)}
              </p>
            )}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={goFullscreen}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-white/25"
              ><Maximize2 className="h-4 w-4" />{isRTL ? "ملء الشاشة" : "Fullscreen"}</button>
              <a
                href={lightbox.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-white/25"
                onClick={(e) => e.stopPropagation()}
              ><Download className="h-4 w-4" />{isRTL ? "تحميل" : "Download"}</a>
              <span className="text-xs font-bold text-white/70">{(lightboxIdx ?? 0) + 1} / {media.length}</span>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
export default CaseDetail;