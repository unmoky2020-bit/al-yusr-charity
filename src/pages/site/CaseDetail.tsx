import { Link, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Heart, MapPin, AlertCircle, Calendar, User, CheckCircle2, Package, Truck, FileCheck,
  Image as ImageIcon, Play, FileText, ChevronLeft, ChevronRight, Maximize2, Download, X,
  ShieldCheck, Building, Clock, HandCoins, ArrowLeft, ArrowRight, Hash, Paperclip, ExternalLink,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { BreadcrumbSchema } from "@/components/common/Schemas";
import { Helmet } from "react-helmet-async";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import {
  getCaseByRef, listCaseUpdates, listCaseMedia, listCaseJourney, listCaseDocuments,
  type Urgency, type CaseMediaRow, type CaseDocumentRow, type JourneyStepRow, type CaseRow, type CaseMediaKind,
} from "@/data/casesApi";
import { caseFunding, daysLeft, suggestedAmounts } from "@/lib/caseFunding";
import { formatNumberEN } from "@/lib/utils";
import { track } from "@/lib/track";
import { CaseShare } from "@/components/cases/CaseShare";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import { caseOwnerLabel } from "@/components/cases/CaseCard";

const PAGE_SIZE = 9;
const STORY_CLAMP = 700;

const URG: Record<Urgency, { ar: string; en: string; tone: string }> = {
  low: { ar: "أولوية عادية", en: "Normal", tone: "bg-white/15 text-white" },
  medium: { ar: "أولوية متوسطة", en: "Medium", tone: "bg-amber-400/90 text-amber-950" },
  high: { ar: "عاجلة", en: "Urgent", tone: "bg-destructive text-destructive-foreground" },
  critical: { ar: "حرجة", en: "Critical", tone: "bg-destructive text-destructive-foreground" },
};

type StepKey = JourneyStepRow["step_key"];
const STEP_META: Record<StepKey, { ar: string; en: string; Icon: typeof CheckCircle2 }> = {
  created: { ar: "سُجّلت الحالة", en: "Case created", Icon: FileText },
  paid: { ar: "وصل تبرع", en: "Payment received", Icon: CheckCircle2 },
  received: { ar: "استلمنا التبرع", en: "Donation received", Icon: CheckCircle2 },
  in_processing: { ar: "قيد التجهيز", en: "In processing", Icon: Package },
  executing: { ar: "جارٍ التنفيذ", en: "Executing", Icon: Package },
  delivered: { ar: "سُلّمت", en: "Delivered", Icon: Truck },
  documented: { ar: "وُثّقت", en: "Documented", Icon: FileCheck },
  completed: { ar: "اكتملت", en: "Completed", Icon: CheckCircle2 },
  failed: { ar: "متعثّرة", en: "Failed", Icon: AlertCircle },
  refunded: { ar: "رُدّ المبلغ", en: "Refunded", Icon: AlertCircle },
};

const KIND_LABEL: Record<CaseMediaKind, { ar: string; en: string }> = {
  before: { ar: "قبل", en: "Before" },
  during: { ar: "أثناء التنفيذ", en: "During" },
  after: { ar: "بعد", en: "After" },
  report: { ar: "تقرير", en: "Report" },
  other: { ar: "صورة", en: "Photo" },
};

const DOC_LABEL: Record<string, { ar: string; en: string }> = {
  medical_report: { ar: "تقرير طبي", en: "Medical report" },
  id: { ar: "إثبات شخصية", en: "ID proof" },
  field_research: { ar: "بحث اجتماعي / ميداني", en: "Field research" },
  invoice: { ar: "فاتورة / عرض سعر", en: "Invoice / quote" },
  receipt: { ar: "إيصال صرف", en: "Payment receipt" },
  other: { ar: "مستند", en: "Document" },
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
  const [c, setC] = useState<CaseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<Awaited<ReturnType<typeof listCaseUpdates>>>([]);
  const [media, setMedia] = useState<CaseMediaRow[]>([]);
  const [docs, setDocs] = useState<CaseDocumentRow[]>([]);
  const [journey, setJourney] = useState<Awaited<ReturnType<typeof listCaseJourney>>>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [storyOpen, setStoryOpen] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const lightboxFigRef = useRef<HTMLDivElement | null>(null);
  const lightboxDialogRef = useRef<HTMLDivElement | null>(null);
  const lightboxOpenerRef = useRef<HTMLElement | null>(null);
  const donateBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    let alive = true;
    setLoading(true);
    setStoryOpen(false);
    setVisibleCount(PAGE_SIZE);
    let onVisible: (() => void) | null = null;
    getCaseByRef(ref)
      .then(async (row) => {
        if (!alive) return;
        setC(row as CaseRow | null);
        if (!row) return;
        const load = () =>
          Promise.all([
            listCaseUpdates(row.id).catch(() => []),
            listCaseMedia(row.id).catch(() => []),
            listCaseJourney(row.id).catch(() => []),
            listCaseDocuments(row.id).catch(() => []),
          ]).then(([u, m, j, d]) => {
            if (!alive) return;
            setUpdates(u);
            setMedia(m);
            setJourney(j);
            setDocs(d.filter((x) => x.is_public && x.storage_path));
          });
        await load();
        track("view_case", {
          fbEvent: "ViewContent",
          payload: { content_ids: [row.ref_code], content_type: "product", content_name: row.title, content_category: "case" },
        });
        // Refresh the updates when the visitor comes back to the tab.
        onVisible = () => {
          if (document.visibilityState === "visible") void load();
        };
        document.addEventListener("visibilitychange", onVisible);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ref]);

  // Mobile: a slim donate bar once the donate box has scrolled away.
  useEffect(() => {
    const el = donateBoxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [c, loading]);

  const lightbox = lightboxIdx !== null ? media[lightboxIdx] ?? null : null;
  const closeLightbox = useCallback(() => {
    setLightboxIdx(null);
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
  const stepLightbox = useCallback(
    (dir: 1 | -1) => {
      setLightboxIdx((i) => (i === null || media.length === 0 ? i : (i + dir + media.length) % media.length));
    },
    [media.length],
  );
  const goFullscreen = useCallback(() => {
    const el = lightboxFigRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const dialog = lightboxDialogRef.current;
    const focusables = () =>
      dialog
        ? Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),video[controls],[tabindex]:not([tabindex="-1"])')).filter(
            (el) => !el.hasAttribute("inert") && el.offsetParent !== null,
          )
        : [];
    requestAnimationFrame(() => (focusables()[0] ?? dialog)?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); stepLightbox(isRTL ? -1 : 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stepLightbox(isRTL ? 1 : -1); }
      else if (e.key.toLowerCase() === "f") { e.preventDefault(); goFullscreen(); }
      else if (e.key === "Tab") {
        const list = focusables();
        if (list.length === 0) { e.preventDefault(); dialog?.focus(); return; }
        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && (active === first || !dialog?.contains(active))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (active === last || !dialog?.contains(active))) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIdx, isRTL, closeLightbox, stepLightbox, goFullscreen]);

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];
    for (const j of journey) {
      const meta = STEP_META[j.step_key as StepKey];
      items.push({
        id: `j-${j.id}`,
        kind: "journey",
        title: (isRTL ? j.title_ar || meta?.ar : j.title_en || meta?.en) || j.step_key,
        body: isRTL ? j.note_ar : j.note_en,
        media_url: j.media_url,
        occurred_at: j.occurred_at,
        step_key: j.step_key as StepKey,
      });
    }
    for (const u of updates) {
      items.push({ id: `u-${u.id}`, kind: "update", title: isRTL ? "تحديث من الفريق" : "Team update", body: u.body, media_url: u.image_url, occurred_at: u.created_at });
    }
    return items.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }, [journey, updates, isRTL]);

  // Related cases: same program when there is one, else same category; never this case.
  const currentId = c?.id;
  const notThis = useCallback((x: CaseRow) => x.id !== currentId && !caseFunding(x).done, [currentId]);

  if (loading) return <PageLayout><DetailSkeleton /></PageLayout>;

  if (!c) {
    return (
      <PageLayout>
        <SEOHelmet title={isRTL ? "الحالة غير موجودة | مؤسسة اليسر" : "Case not found | Al-Yusr"} description="" path={`/cases/${ref ?? ""}`} noindex />
        <div className="container mx-auto max-w-xl px-4 py-20 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-secondary/15 text-primary"><Heart className="h-7 w-7" /></div>
          <h1 className="text-2xl font-black text-primary">{isRTL ? "هذه الحالة غير متاحة" : "This case isn't available"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRTL ? "ربما أُغلقت أو ما زالت قيد المراجعة. تصفّح الحالات التي تحتاج إلى دعم الآن." : "It may be closed or still under review. See the cases that need support now."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild className="rounded-xl bg-orange-grad font-black text-accent-foreground"><Link to="/cases">{isRTL ? "كل الحالات" : "All cases"}</Link></Button>
            <Button asChild variant="outline" className="rounded-xl font-black"><Link to="/donate">{isRTL ? "تبرع للصندوق العام" : "General fund"}</Link></Button>
          </div>
        </div>
        <LinkedCasesSection filter={{ urgent: true }} limit={8} include={notThis} variant="carousel" isRTL={isRTL} title={isRTL ? "حالات عاجلة" : "Urgent cases"} className="bg-muted/30" />
      </PageLayout>
    );
  }

  const f = caseFunding(c);
  const days = daysLeft(c.deadline);
  const u = URG[c.urgency as Urgency] ?? URG.medium;
  const cat = (c as unknown as { case_categories?: { name_ar: string; name_en: string; slug: string } | null }).case_categories;
  const owner = caseOwnerLabel(c, isRTL);
  const ownerLink = c.program_slug
    ? `/programs/${c.program_slug}`
    : c.project_slug
      ? `/donate?project=${encodeURIComponent(c.project_slug)}`
      : c.donation_campaign_slug
        ? `/donate?campaign=${encodeURIComponent(c.donation_campaign_slug)}`
        : null;
  const place = [c.city, c.governorate].filter(Boolean).join("، ");
  const coverImg = c.cover_image_url || "/images/cases/case-placeholder.svg";
  const story = c.story || (isRTL ? "جارٍ تحديث تفاصيل الحالة." : "Story is being updated.");
  const longStory = story.length > STORY_CLAMP;
  const egp = isRTL ? "ج.م" : "EGP";
  const caseUrl = `${base}/cases/${c.ref_code}`;
  const shareText = isRTL
    ? f.done
      ? `اكتملت هذه الحالة بفضل الله ❤️ «${c.title}»، شاهد التوثيق:`
      : `«${c.title}» يتبقى لها ${formatNumberEN(f.remaining)} ج لتكتمل. شارك بأي مبلغ أو أرسلها لمن يستطيع المساعدة:`
    : f.done
      ? `This case is fully funded ❤️ "${c.title}" — see the proof:`
      : `"${c.title}" needs ${formatNumberEN(f.remaining)} EGP more. Give or pass it on:`;

  const visibleMedia = media.slice(0, visibleCount);
  const mediaImages = media.filter((m) => !isVideo(m.url));
  const mediaVideos = media.filter((m) => isVideo(m.url));
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: story.slice(0, 200),
    image: [c.cover_image_url, ...mediaImages.map((m) => m.url)].filter(Boolean),
    datePublished: c.created_at,
    dateModified: c.updated_at || c.created_at,
    inLanguage: isRTL ? "ar-EG" : "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": caseUrl },
    publisher: { "@id": `${base}/#org` },
    locationCreated: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: c.city ?? c.governorate, addressRegion: c.governorate, addressCountry: "EG" } },
  };
  const galleryJsonLd = media.length
    ? {
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
            creator: { "@type": "Organization", name: "Al-Yusr Charity Foundation", url: `${base}/` },
            license: `${base}/terms`,
            acquireLicensePage: `${base}/contact`,
          })),
          ...mediaVideos.map((m) => ({
            "@type": "VideoObject",
            "@id": `${caseUrl}#media-${m.id}`,
            name: (isRTL ? m.caption_ar : m.caption_en) || c.title,
            description: (isRTL ? m.caption_ar : m.caption_en) || story.slice(0, 200),
            contentUrl: m.url,
            url: `${caseUrl}#media-${m.id}`,
            thumbnailUrl: c.cover_image_url || undefined,
            uploadDate: m.created_at,
          })),
        ],
      }
    : null;

  return (
    <PageLayout>
      <SEOHelmet
        title={`${c.title} — ${isRTL ? "حالة" : "Case"} ${c.ref_code} | ${isRTL ? "اليسر" : "Al-Yusr"}`}
        description={(f.done ? (isRTL ? "اكتملت بفضل الله. " : "Fully funded. ") : isRTL ? `المتبقي ${formatNumberEN(f.remaining)} ج. ` : `${formatNumberEN(f.remaining)} EGP to go. `) + story.slice(0, 130)}
        path={`/cases/${c.ref_code}`}
        image={c.cover_image_url ?? undefined}
      />
      <BreadcrumbSchema
        items={[
          { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
          { name: isRTL ? "الحالات" : "Cases", url: `${base}/cases` },
          { name: c.title, url: caseUrl },
        ]}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        {galleryJsonLd && <script type="application/ld+json">{JSON.stringify(galleryJsonLd)}</script>}
      </Helmet>

      {/* Hero: the photo carries the page, the facts sit on it */}
      <section className="relative isolate overflow-hidden bg-[#06301c] text-white">
        <img src={coverImg} alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-[#06301c]/70 via-[#06301c]/85 to-[#06301c]" />
        <div className="container mx-auto max-w-6xl px-4 pb-8 pt-6 md:pb-12 md:pt-8">
          <div className="text-white/80">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "الحالات" : "Cases", href: "/cases" }, { name: c.title.length > 38 ? `${c.title.slice(0, 36).trim()}…` : c.title }]} />
          </div>
          <div className="mt-4 grid items-center gap-6 md:gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-black/30 shadow-2xl ring-1 ring-white/10">
              <img src={coverImg} alt={c.title} className="aspect-[4/3] max-h-[70vh] w-full object-cover sm:aspect-[16/10] lg:aspect-[4/3]" fetchPriority="high" />
              {f.done && (
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent p-4 pt-10 text-sm font-black">
                  <CheckCircle2 className="h-5 w-5 text-[#a3e635]" /> {isRTL ? "اكتملت بفضل الله ثم بفضلكم" : "Fully funded — thank you"}
                </div>
              )}
            </div>
            <div className="min-w-0 text-center lg:text-start">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {!f.done && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${u.tone}`}>
                    <AlertCircle className="h-3.5 w-3.5" /> {isRTL ? u.ar : u.en}
                  </span>
                )}
                {cat && <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black">{isRTL ? cat.name_ar : cat.name_en || cat.name_ar}</span>}
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] font-bold text-white/80" dir="ltr">
                  <Hash className="h-3 w-3" />{c.ref_code}
                </span>
              </div>
              <h1 className="mt-3 text-balance break-words text-[1.6rem] font-black leading-snug sm:text-3xl lg:text-4xl lg:leading-tight">{c.title}</h1>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-sm font-bold text-white/80 lg:justify-start">
                {place && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-[#a3e635]" /> {place}</span>}
                {c.beneficiary_name && <span className="inline-flex items-center gap-1"><User className="h-4 w-4 text-[#a3e635]" /> {c.beneficiary_name}</span>}
                {c.created_at && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-[#a3e635]" />
                    {isRTL ? "نُشرت " : "Posted "}
                    {new Date(c.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
              {owner && ownerLink && (
                <Link to={ownerLink} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-black hover:bg-white/25">
                  {isRTL ? `ضمن ${owner}` : owner}
                </Link>
              )}
              {/* funding at a glance + jump to the donate box */}
              <div className="mx-auto mt-6 max-w-md rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 lg:mx-0">
                <div className="flex items-end justify-between gap-3 text-start">
                  <span>
                    <span className="block text-[11px] font-bold text-white/70">{f.done ? (isRTL ? "جُمع" : "Raised") : isRTL ? "المتبقي" : "To go"}</span>
                    <span className="text-2xl font-black tabular-nums">{formatNumberEN(f.done ? f.raised : f.remaining)} <span className="text-sm">{egp}</span></span>
                  </span>
                  <span className="text-3xl font-black tabular-nums text-[#a3e635]">{f.pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#a3e635]" style={{ width: `${f.pct}%` }} /></div>
                <p className="mt-2 text-start text-xs font-bold text-white/70">
                  {isRTL ? `جُمع ${formatNumberEN(f.raised)} من ${formatNumberEN(f.need)} ${egp}` : `${formatNumberEN(f.raised)} of ${formatNumberEN(f.need)} ${egp} raised`}
                </p>
                {!f.done && (
                  <a href="#donate-box" className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-grad text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95">
                    <Heart className="h-4 w-4" /> {isRTL ? "تبرع للحالة" : "Donate to this case"}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* bottom room: the footer's newsletter card floats ~80px over the last section */}
      <section className="bg-background pb-24 pt-8 md:pb-20 md:pt-12">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <aside className="lg:order-2">
            <div ref={donateBoxRef} id="donate-box" className="scroll-mt-28 lg:sticky lg:top-24">
              <DonateBox c={c} isRTL={isRTL} days={days} />
              <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
                <p className="mb-3 text-sm font-black text-primary">
                  {isRTL ? (f.done ? "شارك الخبر السعيد" : "لا تستطيع التبرع؟ شاركها") : f.done ? "Share the good news" : "Can't give? Share it"}
                </p>
                <CaseShare url={caseUrl} title={c.title} text={shareText} refCode={c.ref_code} isRTL={isRTL} />
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {isRTL ? "مشاركة واحدة في مجموعة العائلة قد تكون سببًا في اكتمال الحالة." : "One share in a family group can close a case."}
                </p>
              </div>
            </div>
          </aside>

          <article className="min-w-0 space-y-10 lg:order-1">
            <section aria-labelledby="story-h">
              <h2 id="story-h" className="mb-3 text-xl font-black text-primary">{isRTL ? "قصة الحالة" : "The story"}</h2>
              <div className="relative">
                <div className={`whitespace-pre-line text-[15px] leading-8 text-foreground/90 ${longStory && !storyOpen ? "max-h-72 overflow-hidden" : ""}`}>{story}</div>
                {longStory && !storyOpen && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />}
              </div>
              {longStory && (
                <button type="button" onClick={() => setStoryOpen((v) => !v)} className="mt-2 text-sm font-black text-accent hover:underline">
                  {storyOpen ? (isRTL ? "اقرأ أقل" : "Show less") : isRTL ? "اقرأ القصة كاملة" : "Read the full story"}
                </button>
              )}
            </section>

            {/* What makes this case trustworthy */}
            <section aria-label={isRTL ? "ضمانات الحالة" : "Assurances"} className="grid gap-3 sm:grid-cols-3">
              {[
                { Icon: ShieldCheck, ar: ["بحث ميداني", "باحث زار الحالة وراجع أوراقها"], en: ["Field verified", "A researcher visited and checked papers"] },
                { Icon: Building, ar: ["دفع مباشر", "للمستشفى أو المورد، لا نقدًا"], en: ["Paid directly", "To the hospital or supplier"] },
                { Icon: FileCheck, ar: ["توثيق بالصور", "تُنشر كل خطوة هنا"], en: ["Photo proof", "Every step is posted here"] },
              ].map(({ Icon, ar, en }) => (
                <div key={ar[0]} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/20 text-primary"><Icon className="h-[18px] w-[18px]" /></span>
                  <span>
                    <b className="block text-sm font-black text-primary">{isRTL ? ar[0] : en[0]}</b>
                    <span className="text-xs text-muted-foreground">{isRTL ? ar[1] : en[1]}</span>
                  </span>
                </div>
              ))}
            </section>

            {docs.length > 0 && (
              <section aria-labelledby="docs-h">
                <h2 id="docs-h" className="mb-3 inline-flex items-center gap-2 text-xl font-black text-primary">
                  <Paperclip className="h-5 w-5" /> {isRTL ? "مستندات الحالة" : "Case documents"}
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {docs.map((d) => {
                    const label = DOC_LABEL[d.doc_type] ?? DOC_LABEL.other;
                    return (
                      <li key={d.id}>
                        <a href={d.storage_path} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition hover:border-secondary/60 hover:shadow-soft">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
                          <span className="min-w-0 flex-1">
                            <b className="block truncate text-sm font-black text-primary">{d.caption || (isRTL ? label.ar : label.en)}</b>
                            <span className="text-[11px] font-bold text-muted-foreground">
                              {isRTL ? label.ar : label.en} · {new Date(d.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-GB")}
                            </span>
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {media.length > 0 && (
              <section aria-labelledby="case-media-heading">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 id="case-media-heading" className="inline-flex items-center gap-2 text-xl font-black text-primary">
                    <ImageIcon className="h-5 w-5" /> {isRTL ? "صور وفيديوهات التوثيق" : "Photos & videos"}
                  </h2>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-black text-muted-foreground">{media.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visibleMedia.map((m, i) => {
                    const cap = isRTL ? m.caption_ar || m.caption_en : m.caption_en || m.caption_ar;
                    const video = isVideo(m.url);
                    const kind = KIND_LABEL[m.kind] ?? KIND_LABEL.other;
                    return (
                      <button key={m.id} id={`media-${m.id}`} type="button" onClick={(e) => openLightbox(i, e.currentTarget)}
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={cap || (isRTL ? "افتح الصورة" : "Open media")}>
                        {video ? (
                          <>
                            <video src={m.url} className="h-full w-full object-cover" preload="metadata" muted />
                            <div className="absolute inset-0 grid place-items-center bg-black/30 text-white"><Play className="h-8 w-8" /></div>
                          </>
                        ) : (
                          <img src={m.url} alt={cap || ""} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                        )}
                        <span className={`absolute start-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black ${m.kind === "after" ? "bg-[#a3e635] text-[#06301c]" : "bg-black/60 text-white"}`}>
                          {isRTL ? kind.ar : kind.en}
                        </span>
                        {cap && <span className="absolute inset-x-0 bottom-0 line-clamp-1 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] font-bold text-white">{cap}</span>}
                      </button>
                    );
                  })}
                </div>
                {visibleCount < media.length && (
                  <div className="mt-4 grid place-items-center">
                    <Button variant="outline" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)} className="rounded-xl font-black">
                      {isRTL ? `اعرض المزيد (${media.length - visibleCount})` : `Load more (${media.length - visibleCount})`}
                    </Button>
                  </div>
                )}
              </section>
            )}

            <section aria-labelledby="case-timeline-heading">
              <h2 id="case-timeline-heading" className="mb-4 inline-flex items-center gap-2 text-xl font-black text-primary">
                <Clock className="h-5 w-5" /> {isRTL ? "رحلة الحالة والتحديثات" : "Timeline & updates"}
              </h2>
              {timeline.length > 0 ? (
                <ol className="relative space-y-4 ps-7 before:absolute before:bottom-2 before:start-[11px] before:top-2 before:w-px before:bg-border">
                  {timeline.map((item) => {
                    const Icon = item.step_key ? STEP_META[item.step_key]?.Icon ?? CheckCircle2 : CheckCircle2;
                    return (
                      <li key={item.id} id={`timeline-${item.id}`} className="relative">
                        <span className={`absolute -start-7 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-background ${item.kind === "journey" ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"}`}>
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-primary">{item.title}</p>
                            <time className="text-[11px] font-bold text-muted-foreground" dateTime={item.occurred_at}>
                              {new Date(item.occurred_at).toLocaleString(isRTL ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
                            </time>
                          </div>
                          {item.body && <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground/90">{item.body}</p>}
                          {item.media_url &&
                            (isVideo(item.media_url) ? (
                              <video src={item.media_url} controls className="mt-3 max-h-72 w-full rounded-xl bg-black object-contain" />
                            ) : (
                              <img src={item.media_url} alt="" loading="lazy" className="mt-3 max-h-72 w-full rounded-xl object-cover" />
                            ))}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                  <p className="text-sm font-bold text-muted-foreground">
                    {isRTL ? "فور بدء التنفيذ سننشر هنا كل خطوة بالتاريخ والصور." : "As soon as work starts, every step is posted here with dates and photos."}
                  </p>
                </div>
              )}
            </section>
          </article>
        </div>
      </section>

      <LinkedCasesSection
        filter={c.program_id ? { programId: c.program_id } : c.category_slug ? { categorySlug: c.category_slug } : { urgent: true }}
        limit={9}
        include={notThis}
        variant="carousel"
        isRTL={isRTL}
        title={isRTL ? "حالات أخرى تحتاج إلى دعمك" : "Other cases that need you"}
        className="bg-muted/30"
      />

      {/* Mobile donate bar */}
      {!f.done && (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 lg:hidden ${showBar ? "translate-y-0" : "translate-y-full"}`}
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          aria-hidden={!showBar}
        >
          <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl border border-secondary/30 bg-[#06301c]/95 px-3 py-2.5 text-white shadow-cta backdrop-blur">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[11px] font-black"
              style={{ background: `conic-gradient(#a3e635 ${f.pct * 3.6}deg, rgba(255,255,255,.2) 0)` }}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#06301c]">{f.pct}%</span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-bold text-white/75">{isRTL ? "المتبقي للاكتمال" : "Still needed"}</div>
              <div className="truncate text-sm font-black">{formatNumberEN(f.remaining)} {egp}</div>
            </div>
            <Link to={`/donate?case=${encodeURIComponent(c.ref_code)}`} tabIndex={showBar ? 0 : -1} data-source="case-detail-bar" data-label={`case-${c.ref_code}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-grad px-4 py-2.5 text-sm font-black text-accent-foreground shadow-cta">
              <Heart className="h-4 w-4" /> {isRTL ? "تبرع" : "Donate"}
            </Link>
          </div>
        </div>
      )}

      {lightbox && (
        <div ref={lightboxDialogRef} role="dialog" aria-modal="true" aria-label={isRTL ? "معرض الصور" : "Media viewer"} tabIndex={-1}
          className="fixed inset-0 z-[150] grid place-items-center bg-black/85 p-4" onClick={closeLightbox}>
          <button type="button" onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label={isRTL ? "إغلاق" : "Close"}>
            <X className="h-5 w-5" />
          </button>
          {media.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); stepLightbox(isRTL ? 1 : -1); }}
                className="absolute start-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label={isRTL ? "السابق" : "Previous"}>
                {isRTL ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); stepLightbox(isRTL ? -1 : 1); }}
                className="absolute end-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label={isRTL ? "التالي" : "Next"}>
                {isRTL ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
              </button>
            </>
          )}
          <div ref={lightboxFigRef} className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {isVideo(lightbox.url) ? (
              <video src={lightbox.url} controls autoPlay className="max-h-[80vh] w-full rounded-xl bg-black object-contain" />
            ) : (
              <img src={lightbox.url} alt={(isRTL ? lightbox.caption_ar : lightbox.caption_en) || ""} className="max-h-[80vh] w-auto rounded-xl object-contain" />
            )}
            {(lightbox.caption_ar || lightbox.caption_en) && (
              <p className="mt-3 text-center text-sm font-bold text-white">{isRTL ? lightbox.caption_ar || lightbox.caption_en : lightbox.caption_en || lightbox.caption_ar}</p>
            )}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button type="button" onClick={goFullscreen} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white hover:bg-white/25">
                <Maximize2 className="h-4 w-4" /> {isRTL ? "ملء الشاشة" : "Fullscreen"}
              </button>
              <a href={lightbox.url} target="_blank" rel="noopener noreferrer" download onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white hover:bg-white/25">
                <Download className="h-4 w-4" /> {isRTL ? "تحميل" : "Download"}
              </a>
              <span className="text-xs font-bold text-white/70">{(lightboxIdx ?? 0) + 1} / {media.length}</span>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

/** Funding, amount picker and the donate button. */
function DonateBox({ c, isRTL, days }: { c: CaseRow; isRTL: boolean; days: number | null }) {
  const navigate = useNavigate();
  const f = caseFunding(c);
  const { amounts, closing } = suggestedAmounts(f.remaining);
  const [amount, setAmount] = useState<number>(amounts[1] ?? amounts[0] ?? closing ?? 100);
  const [custom, setCustom] = useState("");
  const egp = isRTL ? "ج.م" : "EGP";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const chosen = custom ? Number(custom) : amount;
  const valid = Number.isFinite(chosen) && chosen >= 10;

  const go = () => {
    if (!valid) return;
    track("case_donate_click", { payload: { case: c.ref_code, amount: chosen }, fbCustom: false });
    navigate(`/donate?case=${encodeURIComponent(c.ref_code)}&amount=${Math.round(chosen)}`);
  };

  if (f.done) {
    return (
      <div className="rounded-3xl border border-secondary/40 bg-gradient-to-b from-[#f3fae6] to-card p-6 text-center shadow-soft">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-secondary/25 text-primary"><CheckCircle2 className="h-7 w-7" /></div>
        <h2 className="text-lg font-black text-primary">{isRTL ? "الحالة اكتملت بفضل الله" : "This case is fully funded"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRTL ? `جُمع ${formatNumberEN(f.raised)} ${egp}. جزاكم الله خيرًا، والتوثيق منشور بالأسفل.` : `${formatNumberEN(f.raised)} ${egp} raised. Thank you — the proof is posted below.`}
        </p>
        <Button asChild className="mt-5 h-12 w-full rounded-2xl bg-orange-grad font-black text-accent-foreground shadow-cta">
          <Link to="/cases" data-source="case-detail" data-label="case-done-next">{isRTL ? "ساعد في حالة أخرى" : "Help another case"} <Arrow className="h-4 w-4" /></Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(hsl(var(--primary)) ${f.pct * 3.6}deg, hsl(var(--muted)) 0)` }}
          role="progressbar" aria-valuenow={f.pct} aria-valuemin={0} aria-valuemax={100} aria-label={isRTL ? "نسبة التمويل" : "Funded"}>
          <span className="grid h-16 w-16 place-items-center rounded-full bg-card text-lg font-black text-primary">{f.pct}%</span>
        </span>
        <div className="min-w-0">
          <div className="text-xs font-bold text-muted-foreground">{isRTL ? "المتبقي لاكتمال الحالة" : "Still needed"}</div>
          <div className="text-2xl font-black tabular-nums text-primary">{formatNumberEN(f.remaining)} <span className="text-sm">{egp}</span></div>
          <div className="text-xs font-bold text-muted-foreground">
            {isRTL ? `جُمع ${formatNumberEN(f.raised)} من ${formatNumberEN(f.need)}` : `${formatNumberEN(f.raised)} of ${formatNumberEN(f.need)} raised`}
          </div>
        </div>
      </div>

      {days !== null && days >= 0 && (
        <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${days <= 7 ? "bg-destructive/10 text-destructive" : "bg-muted text-primary"}`}>
          <Clock className="h-4 w-4" />
          {days === 0 ? (isRTL ? "اليوم آخر يوم للحالة" : "Today is the last day") : isRTL ? `المتبقي على الموعد المطلوب: ${days} يوم` : `${days} days to the deadline`}
        </div>
      )}

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-black text-primary">{isRTL ? "اختر مبلغًا" : "Choose an amount"}</legend>
        <div className="grid grid-cols-3 gap-2">
          {amounts.map((a) => (
            <button key={a} type="button" aria-pressed={!custom && amount === a} onClick={() => { setAmount(a); setCustom(""); }}
              className={`h-11 rounded-xl border text-sm font-black tabular-nums transition ${!custom && amount === a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-primary hover:border-secondary"}`}>
              {formatNumberEN(a)}
            </button>
          ))}
        </div>
        {closing && (
          <button type="button" aria-pressed={!custom && amount === closing} onClick={() => { setAmount(closing); setCustom(""); }}
            className={`mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border text-sm font-black transition ${!custom && amount === closing ? "border-accent bg-accent text-accent-foreground" : "border-dashed border-accent/60 text-accent hover:bg-accent/10"}`}>
            <HandCoins className="h-4 w-4" /> {isRTL ? `أكمل الحالة كلها — ${formatNumberEN(closing)} ${egp}` : `Complete the case — ${formatNumberEN(closing)} ${egp}`}
          </button>
        )}
        <label className="relative mt-2 block">
          <span className="sr-only">{isRTL ? "مبلغ آخر" : "Other amount"}</span>
          <input inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, "").slice(0, 7))}
            placeholder={isRTL ? "أو اكتب مبلغًا آخر" : "Or type another amount"}
            className="h-11 w-full rounded-xl border border-border bg-background pe-12 ps-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-secondary/40" />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{egp}</span>
        </label>
        {custom && !valid && <p className="mt-1 text-xs font-bold text-destructive">{isRTL ? "أقل مبلغ 10 جنيهات" : "Minimum is 10 EGP"}</p>}
      </fieldset>

      <Button type="button" onClick={go} disabled={!valid}
        className="mt-4 h-[52px] w-full gap-2 rounded-2xl bg-orange-grad text-base font-black text-accent-foreground shadow-cta hover:opacity-95">
        <Heart className="h-5 w-5" /> {isRTL ? `تبرع بـ ${valid ? formatNumberEN(Math.round(chosen)) : "…"} ${egp}` : `Donate ${valid ? formatNumberEN(Math.round(chosen)) : "…"} ${egp}`}
      </Button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
        {isRTL ? "دفع آمن · يُسجَّل تبرعك باسم الحالة" : "Secure payment · recorded against this case"}
      </p>
    </div>
  );
}

/** Same grid as the real hero (photo first, facts centred beside it), so nothing jumps when data arrives. */
function DetailSkeleton() {
  const glass = "bg-white/10";
  return (
    <div aria-busy="true" aria-label="جارٍ التحميل">
      <div className="bg-[#06301c]">
        <div className="container mx-auto max-w-6xl px-4 pb-8 pt-6 md:pb-12 md:pt-8">
          <Skeleton className={`mx-auto h-9 w-72 max-w-full rounded-full lg:mx-0 ${glass}`} />
          <div className="mt-4 grid items-center gap-6 md:gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
            <Skeleton className={`aspect-[4/3] w-full rounded-[1.75rem] sm:aspect-[16/10] lg:aspect-[4/3] ${glass}`} />
            <div className="flex min-w-0 flex-col items-center lg:items-start">
              <div className="flex gap-2">
                <Skeleton className={`h-6 w-16 rounded-full ${glass}`} />
                <Skeleton className={`h-6 w-20 rounded-full ${glass}`} />
                <Skeleton className={`h-6 w-24 rounded-full ${glass}`} />
              </div>
              <Skeleton className={`mt-4 h-10 w-4/5 ${glass}`} />
              <Skeleton className={`mt-3 h-5 w-3/5 ${glass}`} />
              <Skeleton className={`mt-4 h-8 w-48 rounded-full ${glass}`} />
              <div className="mt-6 w-full max-w-md space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-end justify-between">
                  <Skeleton className={`h-8 w-32 ${glass}`} />
                  <Skeleton className={`h-8 w-14 ${glass}`} />
                </div>
                <Skeleton className={`h-2 w-full rounded-full ${glass}`} />
                <Skeleton className={`h-4 w-40 ${glass}`} />
                <Skeleton className="h-11 w-full rounded-xl bg-white/15" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <Skeleton className="h-7 w-40" />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />)}
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    </div>
  );
}

export default CaseDetail;
