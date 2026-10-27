import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  MapPin, AlertCircle, Heart, Loader2, ShieldCheck, CheckCircle2,
  Clock, ArrowLeft, ArrowRight, Share2, Sparkles, HelpCircle,
  TrendingUp, Users, Building, FileText
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import {
  listPublicCases,
  listCategories,
  getCaseImageUrl,
  type CategoryRow,
  type Urgency,
} from "@/data/casesApi";
import { toast } from "sonner";

const URGENCY_LABEL: Record<Urgency, { ar: string; en: string; badgeCls: string; dotCls: string }> = {
  low: {
    ar: "أولوية مستقرة",
    en: "Low",
    badgeCls: "bg-emerald-600/90 text-white border-emerald-400/30",
    dotCls: "bg-emerald-300",
  },
  medium: {
    ar: "متوسطة الأهمية",
    en: "Medium",
    badgeCls: "bg-amber-600/90 text-white border-amber-400/30",
    dotCls: "bg-amber-300",
  },
  high: {
    ar: "عاجل",
    en: "Urgent",
    badgeCls: "bg-rose-600/95 text-white border-rose-400/30",
    dotCls: "bg-rose-300 animate-ping",
  },
  critical: {
    ar: "حرج للغاية",
    en: "Critical",
    badgeCls: "bg-red-700 text-white border-red-500/40",
    dotCls: "bg-white animate-ping",
  },
};

const QUICK_AMOUNTS = [50, 100, 250, 500];

const Cases = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const base = "https://elyusr.org";
  const [params, setParams] = useSearchParams();
  const activeCat = params.get("cat") || "";
  const [cases, setCases] = useState<Awaited<ReturnType<typeof listPublicCases>>>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([listPublicCases({ categorySlug: activeCat || undefined }), listCategories()])
      .then(([cs, ks]) => {
        if (alive) {
          setCases(Array.isArray(cs) ? cs : []);
          setCats(Array.isArray(ks) ? ks : []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [activeCat]);

  const setCat = (slug: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set("cat", slug);
    else next.delete("cat");
    setParams(next, { replace: true });
  };

  const copyShareLink = (refCode: string, title: string) => {
    const url = `${window.location.origin}/cases/${refCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success(isRTL ? `تم نسخ رابط الحالة: ${title}` : `Link copied: ${title}`);
    }
  };

  const empty = !loading && !cases.length;
  const seoTitle = useMemo(
    () =>
      isRTL
        ? "الحالات الإنسانية العاجلة — تبرع لحالة محددة | مؤسسة اليسر الخيرية"
        : "Active Humanitarian Cases — Donate Directly | Al-Yusr Charity",
    [isRTL]
  );

  return (
    <PageLayout>
      <SEOHelmet
        title={seoTitle}
        description={
          isRTL
            ? "اختر حالة محددة من حالات العلاج والعمليات وتسقيف المنازل وتيسير الزواج وكفالة الأيتام بالدقهلية. كل حالة موثقة ببحث ميداني وأرقام شفافة."
            : "Directly fund verified medical surgeries, roofing, orphan care, and emergency aid in Dakahlia, Egypt. 100% field-researched with full transparency."
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

      {/* Hero Header */}
      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95 pointer-events-none" />
        <div className="container relative z-10 mx-auto px-4 py-12 md:py-16 text-center">
          <div className="flex justify-center text-primary-foreground/80 mb-3">
            <Breadcrumbs
              items={[
                { name: isRTL ? "الرئيسية" : "Home", href: "/" },
                { name: isRTL ? "الحالات الموثّقة" : "Verified Cases" },
              ]}
            />
          </div>

          <h1 className="text-3xl font-black md:text-5xl leading-tight">
            {isRTL ? "حالات بحاجة لدعمك اليوم" : "Cases That Need Your Support Today"}
          </h1>
          <p className="mt-3.5 mx-auto max-w-2xl text-sm md:text-base text-primary-foreground/90 leading-relaxed">
            {isRTL
              ? "كل حالة تخضع لبحث اجتماعي وميداني دقيق مع توثيق الأوراق الرسمية، ونسدد التبرعات مباشرة للمستشفيات والموردين مع متابعة دورية حتى إغلاق الحالة."
              : "Every case undergoes thorough field research and document verification. We pay directly to medical centers and suppliers, following through to completion."}
          </p>

          {/* Trust stats pills - exactly 2 pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm font-bold text-primary-foreground/90">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/15 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              {isRTL ? "بحث ميداني 100%" : "100% Field Verified"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/15 shadow-sm">
              <Building className="h-4 w-4 text-secondary" />
              {isRTL ? "مشهرة برقم 2665" : "Licensed NGO 2665"}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="bg-background py-10 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          {/* Centered Categories Filter for Mobile & Desktop */}
          <div className="mb-10">
            <div className="text-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isRTL ? "تصفية حسب نوع الحالة" : "Filter by program"}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-2.5 max-w-4xl mx-auto">
              <button
                type="button"
                onClick={() => setCat("")}
                className={`rounded-full px-4 py-2 text-xs md:text-sm font-black transition-all duration-200 shadow-sm ${
                  !activeCat
                    ? "bg-secondary text-secondary-foreground shadow-md scale-105 ring-2 ring-secondary/50"
                    : "bg-card border border-border/70 text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
              >
                {isRTL ? "كل البرامج" : "All Programs"}
              </button>
              {cats.map((k) => {
                const isActive = activeCat === k.slug;
                return (
                  <button
                    key={k.slug}
                    type="button"
                    onClick={() => setCat(k.slug)}
                    className={`rounded-full px-4 py-2 text-xs md:text-sm font-black transition-all duration-200 shadow-sm ${
                      isActive
                        ? "bg-secondary text-secondary-foreground shadow-md scale-105 ring-2 ring-secondary/50"
                        : "bg-card border border-border/70 text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {isRTL ? k.name_ar : k.name_en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
              <p className="text-sm font-bold">{isRTL ? "جارٍ تحميل الحالات الموثّقة..." : "Loading verified cases..."}</p>
            </div>
          )}

          {/* Empty State */}
          {empty && (
            <div className="mx-auto max-w-md text-center py-16 px-4 bg-muted/30 rounded-3xl border border-border">
              <div className="mx-auto h-12 w-12 rounded-full bg-secondary/15 flex items-center justify-center mb-3 text-secondary">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-primary">
                {isRTL ? "لا توجد حالات منشورة في هذا القسم حالياً" : "No active cases in this category right now"}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {isRTL
                  ? "يمكنك تصفح باقي الأقسام أو المساهمة في الصدقة الجارية لدعم الحالات العاجلة فور نشرها."
                  : "Explore other categories or make a general ongoing donation to support urgent cases as they arrive."}
              </p>
              <Button
                variant="outline"
                onClick={() => setCat("")}
                className="mt-4 rounded-xl font-bold text-xs"
              >
                {isRTL ? "عرض جميع الحالات" : "View all cases"}
              </Button>
            </div>
          )}

          {/* Cases Grid */}
          {!loading && cases.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cases.map((c) => {
                const need = Number(c.needed_amount) || 0;
                const raised = Number(c.raised_amount) || 0;
                const remaining = Math.max(0, need - raised);
                const pct = need > 0 ? Math.min(100, Math.round((raised / need) * 100)) : 0;
                const u = URGENCY_LABEL[c.urgency as Urgency] ?? URGENCY_LABEL.medium;
                const imgUrl = getCaseImageUrl({
                  cover_image_url: c.cover_image_url,
                  title: c.title,
                  category_id: c.category_id,
                  ref_code: c.ref_code,
                });
                const catName =
                  (c as any).case_categories?.name_ar ||
                  (c.category_id && c.category_id !== "general" ? c.category_id : isRTL ? "حالة إنسانية" : "Humanitarian Case");

                return (
                  <article
                    key={c.id || c.ref_code}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_35px_rgba(14,58,47,0.12)] hover:-translate-y-1.5 transition-all duration-300"
                  >
                    {/* Top Media Section with Badges */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                      <Link to={`/cases/${c.ref_code}`} className="block h-full w-full">
                        <img
                          src={imgUrl}
                          alt={c.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          onError={(e) => {
                            // Fallback to medical or family image if error
                            (e.target as HTMLImageElement).src = "/images/cases/case-medical.jpg";
                          }}
                        />
                      </Link>

                      {/* Subtle Dark Vignette for Badges */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/50 pointer-events-none" />

                      {/* Top Badges Header */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                        {/* Urgency Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black backdrop-blur-md shadow-md border ${u.badgeCls}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${u.dotCls}`} />
                          {isRTL ? u.ar : u.en}
                        </span>

                        {/* Reference Code Pill */}
                        <div className="flex items-center gap-1.5 pointer-events-auto">
                          <span className="font-mono text-[11px] font-black text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 tracking-wider">
                            {c.ref_code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              copyShareLink(c.ref_code, c.title);
                            }}
                            title={isRTL ? "مشاركة الحالة" : "Share case"}
                            className="h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center border border-white/20 transition-colors"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Image Overlay Badges */}
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs pointer-events-none">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 dark:bg-card/95 text-primary px-3 py-1 text-[11px] font-black shadow-sm backdrop-blur-sm">
                          {catName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-300 drop-shadow-md">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          {isRTL ? "بحث ميداني معتمد" : "Verified Field Study"}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 md:p-6 flex flex-col flex-1 justify-between">
                      <div>
                        {/* Location & Beneficiary */}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-2">
                          <MapPin className="h-3.5 w-3.5 text-secondary shrink-0" />
                          <span>
                            {c.city ? `${c.city}، ${c.governorate || "الدقهلية"}` : c.governorate || "المنصورة، الدقهلية"}
                          </span>
                          {c.beneficiary_name && (
                            <>
                              <span className="opacity-40">•</span>
                              <span className="truncate">{c.beneficiary_name}</span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="text-lg md:text-xl font-black text-primary leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
                          <Link to={`/cases/${c.ref_code}`}>{c.title}</Link>
                        </h2>

                        {/* Story Summary */}
                        {c.story && (
                          <p className="mt-2.5 text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {c.story}
                          </p>
                        )}
                      </div>

                      {/* Progress & Target Section */}
                      <div className="mt-5 pt-4 border-t border-border/60">
                        {/* Raised vs Needed Breakdown */}
                        <div className="flex items-end justify-between text-xs font-black mb-2">
                          <div>
                            <span className="text-muted-foreground text-[10px] block font-semibold">
                              {isRTL ? "تم جمع" : "Raised"}
                            </span>
                            <span className="text-primary text-base md:text-lg">
                              {raised.toLocaleString()}
                              <span className="text-xs font-bold text-muted-foreground me-1"> ج.م</span>
                            </span>
                          </div>

                          <div className="text-end">
                            <span className="text-muted-foreground text-[10px] block font-semibold">
                              {isRTL ? "المبلغ المطلوب" : "Target"}
                            </span>
                            <span className="text-foreground text-sm font-bold">
                              {need.toLocaleString()}
                              <span className="text-xs font-normal text-muted-foreground me-1"> ج.م</span>
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar with Gradient and Glow */}
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/80 shadow-inner">
                          <div
                            className="h-full rounded-full bg-orange-grad transition-all duration-700 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Percentage and Remaining Footer */}
                        <div className="mt-2 flex items-center justify-between text-[11px] font-extrabold text-muted-foreground">
                          <span className="text-secondary font-black">
                            {pct}% {isRTL ? "مكتمل" : "Funded"}
                          </span>
                          <span>
                            {isRTL
                              ? `متبقي: ${remaining.toLocaleString()} ج.م`
                              : `${remaining.toLocaleString()} EGP remaining`}
                          </span>
                        </div>

                        {/* Quick preset amount chips */}
                        <div className="mt-3.5 flex items-center justify-between gap-1.5">
                          {QUICK_AMOUNTS.map((amt) => (
                            <Link
                              key={amt}
                              to={`/donate?case=${c.ref_code}&amount=${amt}`}
                              className="flex-1 py-1 text-center rounded-lg bg-muted/60 hover:bg-secondary/15 hover:text-primary text-[11px] font-black text-muted-foreground transition-all duration-150 border border-border/50 hover:border-secondary/40"
                              title={isRTL ? `تبرع بـ ${amt} ج.م` : `Donate ${amt} EGP`}
                            >
                              +{amt}
                            </Link>
                          ))}
                        </div>

                        {/* Primary Donate Button */}
                        <Button
                          asChild
                          className="mt-3 h-12 w-full bg-orange-grad hover:opacity-95 text-white font-black text-sm md:text-base rounded-2xl shadow-cta transition-transform active:scale-[0.98]"
                        >
                          <Link
                            to={`/donate?case=${c.ref_code}`}
                            data-source="cases"
                            data-label={`case-${c.ref_code}`}
                          >
                            <Heart className="h-4 w-4 fill-white" />
                            {isRTL ? "تبرع للحالة الآن" : "Donate to this case"}
                          </Link>
                        </Button>

                        {/* View Details Link */}
                        <div className="mt-2 text-center">
                          <Link
                            to={`/cases/${c.ref_code}`}
                            className="inline-flex items-center gap-1 text-xs font-black text-primary hover:text-secondary transition-colors py-1"
                          >
                            <span>{isRTL ? "عرض تفاصيل وبحث الحالة" : "View case study & details"}</span>
                            <Arrow className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Trust Pillars Section (لماذا تتبرع لحالات مؤسسة اليسر؟) */}
          <div className="mt-16 rounded-3xl bg-card border border-border/80 p-6 md:p-10 shadow-soft">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="inline-block rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary mb-2">
                {isRTL ? "معايير الأمانة والشفافية" : "Our Trust Standards"}
              </span>
              <h2 className="text-xl md:text-3xl font-black text-primary">
                {isRTL ? "كيف تصل تبرعاتك لمستحقيها في اليسر؟" : "How Your Donations Reach Beneficiaries"}
              </h2>
              <p className="mt-2 text-xs md:text-sm text-muted-foreground">
                {isRTL
                  ? "نتبع في مؤسسة اليسر دورة تدقيق صارمة من أول زيارة للأسرة وحتى تسليم المساعدة وتوثيقها."
                  : "We follow strict auditing from the initial family field visit through execution and documentation."}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl bg-muted/40 p-5 border border-border/50 text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-black text-base text-primary mb-1.5">
                  {isRTL ? "1. بحث ميداني واجتماعي" : "1. Field Research"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRTL
                    ? "باحث اجتماعي معتمد يزور الحالة على أرض الواقع بالدقهلية للتحقق من الاستحقاق والتقارير الطبية والمستندات."
                    : "Social researchers conduct in-person home visits and audit official medical and financial documents."}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/40 p-5 border border-border/50 text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-black text-base text-primary mb-1.5">
                  {isRTL ? "2. دفع مباشر للموردين والمستشفيات" : "2. Direct Disbursements"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRTL
                    ? "لا نسلم مبالغ نقدية عشوائية؛ بل نسدد فواتير العمليات للمستشفيات والأجهزة من المصانع لضمان الأمانة الكاملة."
                    : "We pay directly to university hospitals, doctors, and hardware suppliers to prevent misuse."}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/40 p-5 border border-border/50 text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="font-black text-base text-primary mb-1.5">
                  {isRTL ? "3. توثيق مستمر حتى الإغلاق" : "3. Ongoing Follow-up"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRTL
                    ? "يتلقى المتبرع تقارير مصورة وفيديوهات توثيقية عن سير العملية أو تسليم الأجهزة فور إتمام الحالة وإغلاقها."
                    : "Donors receive documented reports and media updates when the surgery or delivery is completed."}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Call to Action and Submit Case */}
          <div className="mt-12 text-center max-w-3xl mx-auto py-8 px-4">
            <h2 className="text-xl md:text-2xl font-black text-primary">
              {isRTL ? "كل مساهمة تصنع فرقاً حقيقياً في حياة إنسان" : "Every Contribution Makes a Real Difference"}
            </h2>
            <p className="mt-2 text-xs md:text-sm text-muted-foreground">
              {isRTL
                ? "يمكنك التبرع بأي مبلغ، أو كفالة حالة بالكامل، أو توجيه زكاة مالك وصدقتك الجارية للمحتاجين."
                : "Donate any amount, sponsor a full case, or direct your Zakat to those who need it most."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-orange-grad hover:opacity-95 text-white font-black px-6 h-12 rounded-2xl shadow-cta"
              >
                <Link to="/donate" data-source="cases" data-label="cases-donate-cta">
                  <Heart className="h-5 w-5 fill-white" />
                  {isRTL ? "تبرع الآن للمؤسسة" : "Donate Now"}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-6 rounded-2xl font-bold border-primary/20 hover:bg-muted"
              >
                <Link to="/contact" data-source="cases" data-label="cases-submit-case">
                  {isRTL ? "هل لديك حالة ترغب في تسجيلها؟" : "Submit a Case in Need"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Cases;
