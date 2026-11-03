import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart, ShieldCheck, CheckCircle2, Clock, Search, X, FileText, Building, HandCoins,
  ArrowLeft, ArrowRight, Sparkles, SlidersHorizontal,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CardGridSkeleton } from "@/components/common/ContentSkeletons";
import { Button } from "@/components/ui/button";
import { CaseCard } from "@/components/cases/CaseCard";
import { NiceSelect } from "@/components/common/NiceSelect";
import { useLang } from "@/i18n/LangContext";
import { listPublicCases, listCategories, type CaseRow, type CategoryRow } from "@/data/casesApi";
import { caseFunding, filterCases, sortCases, type CaseSort, type CaseStatusFilter } from "@/lib/caseFunding";
import { formatNumberEN } from "@/lib/utils";
import { track } from "@/lib/track";

const PAGE = 12;
const SORTS: { key: CaseSort; ar: string; en: string }[] = [
  { key: "urgent", ar: "الأكثر احتياجاً", en: "Most urgent" },
  { key: "closest", ar: "الأقرب للاكتمال", en: "Closest to goal" },
  { key: "newest", ar: "الأحدث", en: "Newest" },
  { key: "remaining", ar: "الأكبر متبقياً", en: "Largest gap" },
];
const STATUSES: { key: CaseStatusFilter; ar: string; en: string }[] = [
  { key: "open", ar: "محتاجة دعم", en: "Need support" },
  { key: "done", ar: "اكتملت", en: "Funded" },
  { key: "all", ar: "الكل", en: "All" },
];

const Cases = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const base = "https://elyusr.org";
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") || "";
  const q = params.get("q") || "";
  const status = (STATUSES.find((s) => s.key === params.get("status"))?.key ?? "open") as CaseStatusFilter;
  const sort = (SORTS.find((s) => s.key === params.get("sort"))?.key ?? "urgent") as CaseSort;

  const [all, setAll] = useState<CaseRow[] | null>(null);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [shown, setShown] = useState(PAGE);
  const [qDraft, setQDraft] = useState(q);
  const gridTop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([listPublicCases(), listCategories()])
      .then(([cs, ks]) => {
        if (!alive) return;
        setAll(Array.isArray(cs) ? cs : []);
        setCats(Array.isArray(ks) ? ks : []);
      })
      .catch(() => alive && setAll([]));
    return () => {
      alive = false;
    };
  }, []);

  // Typing filters as you go, but the URL (and analytics) only after a short pause.
  useEffect(() => setQDraft(q), [q]);
  useEffect(() => {
    if (qDraft === q) return;
    const t = setTimeout(() => {
      update({ q: qDraft.trim() || null });
      if (qDraft.trim()) track("case_search", { payload: { q: qDraft.trim() }, fbCustom: false });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDraft]);

  useEffect(() => setShown(PAGE), [cat, q, status, sort]);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => all ?? [], [all]);
  const open = useMemo(() => rows.filter((c) => !caseFunding(c).done), [rows]);
  const stats = useMemo(
    () => ({
      open: open.length,
      remaining: open.reduce((s, c) => s + caseFunding(c).remaining, 0),
      done: rows.length - open.length,
    }),
    [rows, open],
  );

  /** Categories that actually have cases (for the current status), with counts. */
  const catChips = useMemo(() => {
    const pool = filterCases(rows, { status, q });
    const counts = new Map<string, { name: string; n: number; order: number }>();
    for (const c of pool) {
      if (!c.category_slug) continue;
      const known = cats.find((k) => k.slug === c.category_slug);
      const prev = counts.get(c.category_slug);
      counts.set(c.category_slug, {
        name: (known ? (isRTL ? known.name_ar : known.name_en || known.name_ar) : c.category_name_ar) || c.category_slug,
        n: (prev?.n ?? 0) + 1,
        order: known?.sort_order ?? 999,
      });
    }
    return { total: pool.length, list: [...counts.entries()].sort((a, b) => a[1].order - b[1].order || b[1].n - a[1].n) };
  }, [rows, cats, status, q, isRTL]);

  const list = useMemo(() => sortCases(filterCases(rows, { cat, q, status }), sort), [rows, cat, q, status, sort]);

  /** One open case that a few donors can finish today — the strongest nudge on the page. */
  const nearlyThere = useMemo(() => {
    if (cat || q || status === "done") return null;
    return (
      [...open]
        .map((c) => ({ c, f: caseFunding(c) }))
        .filter(({ f }) => f.pct >= 60 && f.remaining > 0)
        .sort((a, b) => a.f.remaining - b.f.remaining)[0] ?? null
    );
  }, [open, cat, q, status]);

  const filtered = !!(cat || q || status !== "open");
  const resetFilters = () => {
    setQDraft("");
    setParams(new URLSearchParams(), { replace: true });
  };

  const egp = isRTL ? "ج.م" : "EGP";
  const loading = all === null;

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "حالات إنسانية موثّقة — تبرع لحالة محددة | مؤسسة اليسر" : "Verified Cases — Donate to a Specific Case | Al-Yusr Charity"}
        description={
          isRTL
            ? "اختار حالة بعينها من حالات العلاج والسكن والزواج والأيتام في الدقهلية. كل حالة ببحث ميداني، وتشوف المتجمع والمتبقي والتحديثات بالصور لحد ما تتقفل."
            : "Fund a specific verified case in Dakahlia, Egypt — medical, housing, marriage and orphan care. Field-researched, with live progress and photo updates until closed."
        }
        path="/cases"
      />
      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
          { name: isRTL ? "الحالات" : "Cases", url: `${base}/cases` },
        ]}
      />

      {/* Hero: what this page is, the live numbers, and search */}
      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95" />
        <div className="container relative z-10 mx-auto max-w-5xl px-4 pb-10 pt-10 text-center md:pb-14 md:pt-14">
          <div className="mb-3 flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "الحالات" : "Cases" }]} />
          </div>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            {isRTL ? "اختار حالة… وتابع أثرك بعينك" : "Pick a case — and watch your impact"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/90 md:text-base">
            {isRTL
              ? "كل حالة هنا اتعمل لها بحث ميداني واتراجعت أوراقها. بندفع للمستشفى أو المورد مباشرة، ونحدّث الصفحة بالصور لحد ما الحالة تتقفل."
              : "Every case is field-researched and document-checked. We pay the hospital or supplier directly and post photo updates until the case is closed."}
          </p>

          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2 sm:gap-3">
            {[
              { v: loading ? "—" : formatNumberEN(stats.open), l: isRTL ? "حالة محتاجة دعم" : "cases need support", Icon: Heart },
              { v: loading ? "—" : formatNumberEN(Math.round(stats.remaining)), l: isRTL ? `${egp} متبقي لاكتمالها` : `${egp} still needed`, Icon: HandCoins },
              { v: loading ? "—" : formatNumberEN(stats.done), l: isRTL ? "حالة اكتملت" : "cases funded", Icon: CheckCircle2 },
            ].map(({ v, l, Icon }) => (
              <div key={l} className="rounded-2xl border border-white/15 bg-white/10 px-2 py-3 backdrop-blur-md">
                <Icon className="mx-auto h-4 w-4 text-secondary" />
                <div className="mt-1 text-lg font-black tabular-nums sm:text-2xl">{v}</div>
                <div className="text-[10.5px] font-bold leading-tight text-primary-foreground/80 sm:text-xs">{l}</div>
              </div>
            ))}
          </div>

          <label className="relative mx-auto mt-6 block max-w-xl">
            <span className="sr-only">{isRTL ? "ابحث في الحالات" : "Search cases"}</span>
            <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/60" />
            <input
              type="search"
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              placeholder={isRTL ? "ابحث باسم الحالة، المدينة، أو رقم الحالة…" : "Search by title, city or case code…"}
              className="h-[52px] w-full rounded-2xl border-0 bg-white py-3.5 pe-11 ps-12 text-sm font-bold text-primary shadow-card outline-none ring-2 ring-transparent placeholder:text-primary/45 focus:ring-secondary"
            />
            {qDraft && (
              <button type="button" onClick={() => setQDraft("")} aria-label={isRTL ? "مسح البحث" : "Clear search"}
                className="absolute end-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-muted text-primary hover:bg-secondary/30">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>
      </section>

      <section className="bg-background pb-14 pt-6 md:pb-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          {/* Filters bar */}
          <div ref={gridTop} className="sticky top-20 z-30 -mx-4 mb-6 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" role="tablist" aria-label={isRTL ? "نوع الحالة" : "Case type"}>
                <Chip active={!cat} onClick={() => update({ cat: null })} label={isRTL ? "كل الحالات" : "All cases"} n={catChips.total} />
                {catChips.list.map(([slug, v]) => (
                  <Chip key={slug} active={cat === slug} onClick={() => update({ cat: cat === slug ? null : slug })} label={v.name} n={v.n} />
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 rounded-xl bg-muted p-1" role="radiogroup" aria-label={isRTL ? "حالة التمويل" : "Funding status"}>
                  {STATUSES.map((s) => (
                    <button key={s.key} type="button" role="radio" aria-checked={status === s.key}
                      onClick={() => update({ status: s.key === "open" ? null : s.key })}
                      className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-black transition sm:px-3 ${status === s.key ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-primary"}`}>
                      {isRTL ? s.ar : s.en}
                    </button>
                  ))}
                </div>
                <div className="flex w-36 shrink-0 items-center gap-1.5 sm:w-44">
                  <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <NiceSelect size="sm" value={sort} onChange={(v) => update({ sort: v === "urgent" ? null : v })} ariaLabel={isRTL ? "ترتيب الحالات" : "Sort cases"} dir={isRTL ? "rtl" : "ltr"}
                    options={SORTS.map((s) => ({ value: s.key, label: isRTL ? s.ar : s.en }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Nearly-funded highlight */}
          {nearlyThere && (
            <Link
              to={`/cases/${nearlyThere.c.ref_code}`}
              className="group mb-8 flex flex-col overflow-hidden rounded-[1.75rem] border border-secondary/40 bg-gradient-to-l from-[#f3fae6] to-card shadow-soft transition hover:shadow-card sm:flex-row"
            >
              <img src={nearlyThere.c.cover_image_url || "/images/cases/case-placeholder.svg"} alt="" loading="lazy"
                className="h-40 w-full object-cover sm:h-auto sm:w-64" />
              <div className="flex flex-1 flex-col justify-center gap-2 p-5">
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-secondary/25 px-2.5 py-1 text-[11px] font-black text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "قربت تكتمل" : "Almost there"}
                </span>
                <h2 className="text-lg font-black leading-snug text-primary group-hover:text-accent md:text-xl">{nearlyThere.c.title}</h2>
                <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${nearlyThere.f.pct}%` }} />
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  {isRTL
                    ? <>اتجمع {nearlyThere.f.pct}% — باقي <b className="text-primary">{formatNumberEN(nearlyThere.f.remaining)} {egp}</b> بس وتتقفل الحالة.</>
                    : <>{nearlyThere.f.pct}% raised — only <b className="text-primary">{formatNumberEN(nearlyThere.f.remaining)} {egp}</b> to close it.</>}
                </p>
              </div>
              <span className="flex items-center justify-center gap-1.5 bg-orange-grad px-6 py-3 text-sm font-black text-accent-foreground sm:w-44">
                {isRTL ? "كمّلها" : "Finish it"} <Arrow className="h-4 w-4" />
              </span>
            </Link>
          )}

          {loading && <CardGridSkeleton count={6} />}

          {!loading && list.length === 0 && (
            <div className="mx-auto max-w-md rounded-3xl border border-border bg-muted/30 px-5 py-14 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-secondary/15 text-secondary">
                {rows.length ? <Search className="h-6 w-6" /> : <Heart className="h-6 w-6" />}
              </div>
              <h2 className="text-lg font-black text-primary">
                {rows.length
                  ? isRTL ? "مفيش حالات بالاختيار ده" : "No cases match these filters"
                  : isRTL ? "مفيش حالات منشورة دلوقتي" : "No published cases right now"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isRTL
                  ? "تقدر تتبرع للصندوق العام، وفريقنا بيوجهه لأشد الحالات احتياجاً أول ما تتراجع."
                  : "You can give to the general fund — our team directs it to the most urgent verified cases."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {filtered && rows.length > 0 && (
                  <Button variant="outline" onClick={resetFilters} className="rounded-xl font-black">{isRTL ? "اعرض كل الحالات" : "Show all cases"}</Button>
                )}
                <Button asChild className="rounded-xl bg-orange-grad font-black text-accent-foreground">
                  <Link to="/donate" data-source="cases" data-label="cases-empty-general">{isRTL ? "تبرع للصندوق العام" : "Give to the general fund"}</Link>
                </Button>
              </div>
            </div>
          )}

          {!loading && list.length > 0 && (
            <>
              <p className="mb-4 text-xs font-bold text-muted-foreground" aria-live="polite">
                {isRTL ? `${formatNumberEN(list.length)} حالة` : `${formatNumberEN(list.length)} cases`}
                {filtered && (
                  <button type="button" onClick={resetFilters} className="ms-2 font-black text-accent hover:underline">
                    {isRTL ? "مسح الفلاتر" : "Clear filters"}
                  </button>
                )}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.slice(0, shown).map((c) => <CaseCard key={c.id || c.ref_code} c={c} isRTL={isRTL} showOwner />)}
              </div>
              {shown < list.length && (
                <div className="mt-8 grid place-items-center">
                  <Button variant="outline" onClick={() => setShown((n) => n + PAGE)} className="h-11 rounded-xl px-6 font-black">
                    {isRTL ? `اعرض حالات أكتر (${formatNumberEN(list.length - shown)})` : `Show more (${formatNumberEN(list.length - shown)})`}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* How a case works */}
          <div className="mt-16 rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-soft md:p-10">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <span className="mb-2 inline-block rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
                {isRTL ? "إزاي تبرعك بيوصل" : "How your gift arrives"}
              </span>
              <h2 className="text-xl font-black text-primary md:text-3xl">{isRTL ? "من البحث لحد التوثيق" : "From field visit to proof"}</h2>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { Icon: FileText, ar: ["بحث ميداني", "باحث بيزور البيت ويراجع التقارير والأوراق قبل نشر أي حالة."], en: ["Field research", "A researcher visits and checks every document before a case is published."] },
                { Icon: Building, ar: ["دفع مباشر", "بندفع للمستشفى أو المورد مباشرة، مش كاش لإيد حد."], en: ["Direct payment", "We pay the hospital or supplier directly, never loose cash."] },
                { Icon: Clock, ar: ["تحديثات أول بأول", "كل خطوة بتتنشر في صفحة الحالة بالتاريخ والصور."], en: ["Live updates", "Each step is posted on the case page with dates and photos."] },
                { Icon: ShieldCheck, ar: ["توثيق الإغلاق", "لما الحالة تكتمل بننشر التوثيق في صفحتها عشان تتطمن."], en: ["Closing proof", "When a case is funded we publish the proof on its page."] },
              ].map(({ Icon, ar, en }, i) => (
                <li key={i} className="relative rounded-2xl border border-border/50 bg-muted/40 p-5">
                  <span className="absolute end-4 top-4 text-3xl font-black text-primary/10">{i + 1}</span>
                  <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-secondary/20 text-primary"><Icon className="h-5 w-5" /></div>
                  <h3 className="mb-1 text-base font-black text-primary">{isRTL ? ar[0] : en[0]}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{isRTL ? ar[1] : en[1]}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mx-auto mt-12 max-w-3xl px-4 py-6 text-center">
            <h2 className="text-xl font-black text-primary md:text-2xl">{isRTL ? "تعرف حد محتاج؟" : "Know someone in need?"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isRTL ? "ابعتلنا بياناته، وفريق البحث هيتواصل ويزوره قبل أي نشر." : "Send us their details — our team will reach out and visit before anything is published."}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="outline" className="h-12 rounded-2xl border-primary/20 px-6 font-black">
                <Link to="/contact" data-source="cases" data-label="cases-submit-case">{isRTL ? "رشّح حالة" : "Refer a case"}</Link>
              </Button>
              <Button asChild size="lg" className="h-12 rounded-2xl bg-orange-grad px-6 font-black text-accent-foreground shadow-cta hover:opacity-95">
                <Link to="/donate" data-source="cases" data-label="cases-donate-cta"><Heart className="h-5 w-5" /> {isRTL ? "تبرع للصندوق العام" : "Give to the general fund"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

function Chip({ active, onClick, label, n }: { active: boolean; onClick: () => void; label: string; n: number }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-black transition ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "border border-border/70 bg-card text-foreground/80 hover:border-secondary/60 hover:text-primary"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-white/20" : "bg-muted text-muted-foreground"}`}>{n}</span>
    </button>
  );
}

export default Cases;
