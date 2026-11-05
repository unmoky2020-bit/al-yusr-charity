import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, Loader2, Search, Copy, MessageCircle, Calendar, Wallet, User, Sparkles, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { DonationReceipt } from "@/components/common/DonationReceipt";
import { useLang } from "@/i18n/LangContext";
import { donationsStore, type DonationRecord, type DonationStatus } from "@/data/donationsStore";
import { donationsApiV1 } from "@/data/laravelApi";
import { fromLaravelRow } from "@/data/donationRecordMapper";

const STEPS: DonationStatus[] = ["pending", "processing", "completed"];
const WHATSAPP_NUMBER = "201097000137";
const POLL_INTERVAL_MS = 30_000; // poll every 30 seconds instead of realtime

const statusLabel = (s: string, lang: "ar" | "en") => {
  const map: Record<string, { ar: string; en: string }> = {
    created:    { ar: "تم الإنشاء",       en: "Created" },
    pending:    { ar: "بانتظار الدفع",    en: "Pending" },
    processing: { ar: "قيد المعالجة",     en: "Processing" },
    paid:       { ar: "تم الدفع",         en: "Paid" },
    completed:  { ar: "مكتمل",            en: "Completed" },
    failed:     { ar: "فشل",              en: "Failed" },
    refunded:   { ar: "مُستردّ",           en: "Refunded" },
  };
  return map[s]?.[lang] || s;
};

/** Map Laravel payment_status → internal tracking step */
/** Find a donation by ref code from the Laravel API */
async function loadFromLaravel(ref: string): Promise<DonationRecord | null> {
  const cleanRef = ref.trim();
  if (!cleanRef) return null;

  try {
    // 1. Primary: Query the dedicated live tracking endpoint /donations/track/:ref
    const trackRes = await donationsApiV1.track(cleanRef);
    const data = (trackRes as any)?.data || trackRes;
    if (data && (data.transaction_reference || data.id || data.amount !== undefined)) {
      return fromLaravelRow(data);
    }
  } catch (_err) {
    // Graceful fallback to local store if not yet found on backend
  }

  // 2. Secondary fallback: this browser's own local record.
  //    (No admin list lookup here — this is a public page.)
  const local = donationsStore.byRef(cleanRef);
  if (local) return local;

  return null;
}

const DonationTracking = () => {
  const { lang, t } = useLang();
  const { ref: routeRef } = useParams();
  const [search, setSearch]   = useState(routeRef || "");
  const [record, setRecord]   = useState<DonationRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading]  = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((ref: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const remote = await loadFromLaravel(ref);
      if (remote) setRecord(remote);
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const fetchAndShow = useCallback(async (ref: string) => {
    setLoading(true);
    // Immediately show local record if available
    const local = donationsStore.byRef(ref);
    if (local) { setRecord(local); setNotFound(false); }

    const remote = await loadFromLaravel(ref);
    setLoading(false);

    if (remote) {
      setRecord(remote);
      setNotFound(false);
      startPolling(ref);
    } else if (!local) {
      setRecord(null);
      setNotFound(true);
    }
  }, [startPolling]);

  useEffect(() => {
    if (!routeRef) return;
    fetchAndShow(routeRef);
    return () => stopPolling();
  }, [routeRef]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = search.trim();
    if (!ref) return;
    setNotFound(false);
    stopPolling();
    await fetchAndShow(ref);
  };

  return (
    <PageLayout>
      <SEOHelmet
        title={lang === "ar" ? "تتبع التبرع | مؤسسة اليسر" : "Track Donation | Al-Yusr Charity"}
        description={lang === "ar" ? "تتبع حالة تبرعك خطوة بخطوة من خلال رقم العملية." : "Track your donation status step by step using your reference."}
        path={`/donate/track/${routeRef || ""}`}
      />
      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground py-14 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center text-primary-foreground/85">
            <Breadcrumbs items={[
              { name: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
              { name: lang === "ar" ? "تتبع التبرع" : "Track donation" },
            ]} />
          </div>
          <h1 className="mt-4 text-3xl font-black md:text-5xl lg:text-6xl text-center">
            {lang === "ar" ? "تتبع حالة تبرعك" : "Track your donation"}
          </h1>
          <p className="mt-3 text-primary-foreground/85 text-sm sm:text-base md:text-lg max-w-3xl mx-auto text-center">
            {lang === "ar" ? "أدخل رقم العملية لمتابعة حالة الدفع وتحميل الإيصال." : "Enter your reference number to follow status and download receipt."}
          </p>
        </div>
      </section>

      <section className="bg-muted/30 pt-10 pb-36 sm:pb-44 md:pt-16 md:pb-52">
        <div className="container mx-auto max-w-5xl lg:max-w-6xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={onSearch} className="flex flex-col gap-2.5 rounded-3xl bg-card p-3.5 sm:p-4 shadow-card sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              placeholder="YSR-XXXXXXXX-XXXX"
              className="h-12 sm:h-14 font-mono text-center sm:text-start rounded-2xl text-base"
              aria-label={lang === "ar" ? "رقم العملية" : "Reference number"}
            />
            <Button type="submit" disabled={loading} className="h-12 sm:h-14 bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95 px-8 font-black rounded-2xl text-sm sm:text-base">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {" "}{lang === "ar" ? "بحث" : "Search"}
            </Button>
          </form>

          {notFound && (
            <div className="mt-8 rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6 sm:p-8 text-center">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <p className="mt-3 font-bold text-destructive text-base">
                {lang === "ar" ? "لم نجد عملية بهذا الرقم. تأكد من رقم العملية أو" : "No donation found with this reference."}{" "}
                <Link to="/donate" className="underline font-black">{lang === "ar" ? "ابدأ تبرعًا جديدًا" : "Start a new donation"}</Link>
              </p>
            </div>
          )}

          {!record && !notFound && !routeRef && (
            <div className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft md:grid-cols-3">
              {[
                { icon: Search,      ar: "أدخل رقم العملية",   en: "Enter the reference",   subAr: "تجده في رسالة التأكيد أو الإيصال",      subEn: "You will find it in the confirmation message or receipt" },
                { icon: ShieldCheck, ar: "متابعة دورية",        en: "Periodic updates",      subAr: "نحدّث الحالة تلقائيًا كل 30 ثانية",        subEn: "Status auto-refreshes every 30 seconds" },
                { icon: Mail,        ar: "إيصال رسمي",          en: "Official receipt",      subAr: "يظهر بعد اعتماد الدفع",                     subEn: "Available once payment is confirmed" },
              ].map((it) => (
                <div key={it.ar} className="rounded-2xl border border-border/70 bg-muted/30 p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary/20 text-primary">
                    <it.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <p className="mt-3 text-base font-black text-primary">{lang === "ar" ? it.ar : it.en}</p>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">{lang === "ar" ? it.subAr : it.subEn}</p>
                </div>
              ))}
            </div>
          )}

          {record && (
            <>
              <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{lang === "ar" ? "حالة العملية" : "Status"}</p>
                    <h2 className="mt-1 text-2xl font-black text-primary md:text-3xl">
                      {record.status === "completed"  && (lang === "ar" ? "مكتمل ✓" : "Completed ✓")}
                      {record.status === "failed"     && (lang === "ar" ? "فشلت العملية" : "Failed")}
                      {record.status === "pending"    && (lang === "ar" ? "بانتظار تأكيد الدفع" : "Awaiting payment confirmation")}
                      {record.status === "processing" && (lang === "ar" ? "جارٍ المعالجة..." : "Processing...")}
                    </h2>
                    {record.status === "pending" && (
                      <p className="mt-2 max-w-prose text-xs text-muted-foreground">
                        {lang === "ar"
                          ? "تم تسجيل طلب تبرعك، وستُؤكَّد الحالة فور وصول الحوالة (Vodafone Cash / تحويل بنكي) أو إتمام دفعك إلكترونيًا. للاستفسار، راسلنا على واتساب."
                          : "Your donation request was recorded. The status will update once we receive your transfer (Vodafone Cash / bank) or your online payment clears. Contact us on WhatsApp for help."}
                      </p>
                    )}
                  </div>
                  {record.status === "processing" && <Loader2 className="h-8 w-8 animate-spin text-secondary" />}
                </div>

                {/* Donation summary */}
                <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Search className="h-3.5 w-3.5" /> {lang === "ar" ? "رقم العملية" : "Reference"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span dir="ltr" className="font-mono text-sm font-black text-primary">{record.ref}</span>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard?.writeText(record.ref); toast.success(lang === "ar" ? "تم نسخ الرقم" : "Copied"); }}
                        className="rounded-md p-1 text-muted-foreground hover:text-primary"
                        aria-label={lang === "ar" ? "نسخ" : "Copy"}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5" /> {lang === "ar" ? "المبلغ" : "Amount"}
                    </span>
                    <span className="text-sm font-black text-primary" dir="ltr">{record.amount.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} EGP</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> {lang === "ar" ? "التاريخ" : "Date"}
                    </span>
                    <time className="text-sm font-bold text-foreground" dateTime={record.createdAt}>
                      {new Date(record.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </div>
                  {record.donor?.name && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <User className="h-3.5 w-3.5" /> {lang === "ar" ? "المتبرع" : "Donor"}
                      </span>
                      <span className="truncate text-sm font-bold text-foreground">{record.donor.name}</span>
                    </div>
                  )}
                  {record.method && (
                    <div className="flex items-center justify-between gap-3 sm:col-span-2">
                      <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        {lang === "ar" ? "طريقة الدفع" : "Payment method"}
                      </span>
                      <span dir="ltr" className="font-mono text-xs font-bold text-foreground">{String(record.method)}</span>
                    </div>
                  )}
                </div>

                {record.status !== "failed" && (
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {STEPS.map((s, i) => {
                      const idx = STEPS.indexOf(record.status as DonationStatus);
                      const reached = idx >= i;
                      return (
                        <div key={s} className="flex flex-col items-center text-center">
                          <div className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black transition ${
                            reached ? "bg-secondary text-secondary-foreground shadow-cta" : "bg-muted text-muted-foreground"
                          }`}>
                            {reached ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                          </div>
                          <span className={`mt-2 text-xs font-bold ${reached ? "text-primary" : "text-muted-foreground"}`}>
                            {s === "pending"    && (lang === "ar" ? "تم الاستلام"    : "Received")}
                            {s === "processing" && (lang === "ar" ? "قيد المعالجة"   : "Processing")}
                            {s === "completed"  && (lang === "ar" ? "تم التأكيد"     : "Confirmed")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(record.status === "pending" || record.status === "failed") && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                        (lang === "ar" ? "استفسار عن تبرع رقم: " : "Inquiry about donation: ") + record.ref
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-black text-secondary-foreground shadow-soft hover:opacity-95"
                    >
                      <MessageCircle className="h-4 w-4" /> {lang === "ar" ? "تواصل عبر واتساب" : "WhatsApp us"}
                    </a>
                    {record.status === "failed" && (
                      <Link to="/donate" className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-grad px-4 text-sm font-black text-accent-foreground shadow-cta hover:opacity-95">
                        {lang === "ar" ? "حاول مرة أخرى" : "Try again"}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {record && (
                <div className="mt-6">
                  <DonationReceipt d={record} />
                  {record.status !== "completed" && (
                    <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-900 dark:text-amber-200">
                      {lang === "ar"
                        ? "ملاحظة: هذا إيصال مبدئي برقم مرجعي معتمد، وتعمل الإدارة المالية لمؤسسة اليسر على مطابقة الدفع وتأكيده نهائيًا."
                        : "Note: This is a preliminary verified receipt. Final confirmation is being processed by Al-Yusr Financial Admin."}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default DonationTracking;
