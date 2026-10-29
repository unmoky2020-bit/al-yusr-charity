import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Phone,
  Mail,
  CreditCard,
  HeartHandshake,
  FileText,
  User,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LangContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { DonationReceipt } from "@/components/common/DonationReceipt";
import {
  DONATION_STATUS_TRANSITIONS,
  type DonationStatus,
} from "@/data/casesApi";
import { donationsAdminApi } from "@/data/api/donationsAdminApi";
import { donationsApiV1 } from "@/data/laravelApi";

const STATUS_CONFIG: Record<
  string,
  { labelAr: string; labelEn: string; bg: string; text: string; border: string; icon: any }
> = {
  paid: {
    labelAr: "مدفوع ومكتمل",
    labelEn: "Paid & Completed",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  completed: {
    labelAr: "مدفوع ومكتمل",
    labelEn: "Paid & Completed",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  pending: {
    labelAr: "قيد الانتظار",
    labelEn: "Pending Approval",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
    icon: Clock,
  },
  failed: {
    labelAr: "فشل السداد",
    labelEn: "Payment Failed",
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-500/30",
    icon: XCircle,
  },
  refunded: {
    labelAr: "مسترد للمتبرع",
    labelEn: "Refunded",
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-400",
    border: "border-slate-500/30",
    icon: RotateCcw,
  },
};

const TRANSITION_CONFIG: Record<
  string,
  { labelAr: string; labelEn: string; variant: "default" | "outline" | "destructive" | "secondary" }
> = {
  paid: { labelAr: "اعتماد الدفع (مدفوع)", labelEn: "Approve Payment", variant: "default" },
  completed: { labelAr: "اعتماد كـ مكتمل", labelEn: "Mark Completed", variant: "default" },
  pending: { labelAr: "إرجاع لقيد الانتظار", labelEn: "Set Pending", variant: "outline" },
  failed: { labelAr: "تعليم كفاشل", labelEn: "Mark as Failed", variant: "destructive" },
  refunded: { labelAr: "تسجيل استرداد", labelEn: "Issue Refund", variant: "secondary" },
};

function formatMethod(method: string | null | undefined, isAr: boolean): string {
  if (!method) return isAr ? "غير محدد" : "Not specified";
  const m = String(method).toLowerCase();
  if (m.includes("kashier") || m.includes("card") || m.includes("visa") || m.includes("master")) {
    return isAr ? "بطاقة دفع بنكية (كاشير)" : "Credit Card (Kashier)";
  }
  if (m.includes("voda") || m.includes("wallet")) {
    return isAr ? "محفظة فودافون كاش" : "Vodafone Cash Wallet";
  }
  if (m.includes("insta")) {
    return isAr ? "شبكة المدفوعات اللحظية (InstaPay)" : "InstaPay Transfer";
  }
  if (m.includes("delegate") || m.includes("pickup")) {
    return isAr ? "مندوب تحصيل منزلي" : "Delegate Home Pickup";
  }
  if (m.includes("cash") || m.includes("manual")) {
    return isAr ? "نقدي بمقر الجمعية" : "Cash at Office";
  }
  if (m.includes("bank")) {
    return isAr ? "تحويل بنكي مباشر" : "Bank Transfer";
  }
  return method;
}

export default function AdminDonationDetail() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const cleanId = String(id).trim();

      // 1. First try single get by ID from Laravel Sanctum API
      let d: any = null;
      try {
        const direct = await donationsApiV1.get(cleanId);
        d = (direct as any)?.data ?? direct;
      } catch {
        // Fallback to tracking or list
      }

      // 2. If not found by direct GET, try track by reference
      if (!d || !d.id) {
        try {
          const trackRes = await donationsApiV1.track(cleanId);
          d = (trackRes as any)?.data ?? trackRes;
        } catch {
          // ignore
        }
      }

      // 3. Fallback to listAll
      if (!d || !d.id) {
        const { listAllDonations } = await import("@/data/casesApi");
        const all = await listAllDonations();
        d = (all as any[]).find(
          (x) =>
            String(x.id) === cleanId ||
            String(x.ref_code) === cleanId ||
            String(x.ref) === cleanId ||
            String(x.id) === cleanId.replace("DON-", "") ||
            String(x.ref_code).toLowerCase() === cleanId.toLowerCase()
        );
      }

      if (!d) {
        toast({ title: isAr ? "التبرع غير موجود" : "Donation not found", variant: "destructive" });
        nav("/admin/donations");
        return;
      }

      // Normalize row structure for consistent display
      const normalizedStatus = (d.payment_status || d.status || "pending").toLowerCase();
      const refCode = d.transaction_reference || d.reference_code || d.ref_code || d.code || `DON-${d.id}`;
      const donorName = d.donor_name || d.name || d.donor?.name || (isAr ? "متبرع فاعل خير" : "Generous Donor");
      const donorPhone = d.donor_phone || d.phone || d.donor?.phone || "";
      const donorEmail = d.donor_email || d.email || d.donor?.email || "";

      setRow({
        ...d,
        id: String(d.id),
        ref_code: refCode,
        amount: Number(d.amount || 0),
        currency: d.currency || "EGP",
        payment_status: normalizedStatus,
        payment_method: d.payment_method?.name_ar || d.payment_method?.name_en || d.payment_method?.slug || d.payment_method || d.method || "kashier",
        donor_name: donorName,
        donor_phone: donorPhone,
        donor_email: donorEmail,
        created_at: d.created_at || new Date().toISOString(),
        notes: d.notes || d.message || "",
        case: d.case,
        program: d.program,
        project: d.project,
        donation_campaign: d.donation_campaign,
        donation_package: d.donation_package,
      });
    } catch (e: any) {
      toast({ title: isAr ? "خطأ في التحميل" : "Load error", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const transition = async (next: DonationStatus) => {
    if (!row) return;
    const online = !!row.is_gateway;
    if (next === "paid" && online &&
      !window.confirm(isAr
        ? "ده دفع أونلاين — بيتأكد لوحده من بوابة الدفع. علّمه «مدفوع» يدوي بس لو اتأكدت من وصول المبلغ في حساب كاشير. متأكد؟"
        : "Online payment — the gateway confirms it. Mark it paid only if you verified the money in the gateway account. Continue?")) {
      return;
    }
    setUpdating(true);
    try {
      await donationsAdminApi.setStatus(row.id, next, { confirmGateway: next === "paid" && online });
      toast({
        title: isAr ? "تم تحديث حالة التبرع" : "Status updated successfully",
        description: isAr ? `أصبحت الحالة: ${STATUS_CONFIG[next]?.labelAr || next}` : `Status is now: ${next}`,
      });
      await reload();
    } catch (e: any) {
      toast({ title: isAr ? "تعذر التحديث" : "Update failed", description: e?.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const copy = async (text: string, labelAr = "تم النسخ") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: isAr ? labelAr : "Copied to clipboard", description: text });
    } catch {}
  };

  if (loading || !row) {
    return (
      <AdminLayout>
        <div className="grid place-items-center py-32">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
            <p className="text-sm font-bold text-muted-foreground">
              {isAr ? "جاري تحميل تفاصيل التبرع..." : "Loading donation details..."}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const currentStatus = STATUS_CONFIG[row.payment_status] || STATUS_CONFIG.pending;
  const StatusIcon = currentStatus.icon;
  const allowedTransitions = DONATION_STATUS_TRANSITIONS[row.payment_status as DonationStatus] || [];
  const publicTrackHref = `/donate/track/${row.ref_code}`;

  // Target Destination Resolution
  const targetType = row.case
    ? isAr ? "حالة إنسانية" : "Humanitarian Case"
    : row.project
    ? isAr ? "مشروع تنموي" : "Development Project"
    : row.program
    ? isAr ? "برنامج رئيسي" : "Charity Program"
    : row.donation_campaign
    ? isAr ? "حملة خيرية" : "Donation Campaign"
    : row.donation_package
    ? isAr ? "باقة تبرع" : "Donation Package"
    : isAr ? "تبرع عام للجمعية" : "General Donation";

  const targetTitle =
    row.case?.title ||
    row.case?.title_ar ||
    row.project?.name_ar ||
    row.project?.name ||
    row.program?.name_ar ||
    row.program?.name ||
    row.program?.title_ar ||
    row.donation_campaign?.name_ar ||
    row.donation_campaign?.title_ar ||
    row.donation_package?.name_ar ||
    (isAr ? "كفالة البرامج العامة والمساعدات" : "General Charitable Programs");

  const cleanPhone = String(row.donor_phone || "").replace(/[^0-9]/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("01") ? "2" + cleanPhone : cleanPhone}?text=${encodeURIComponent(
        isAr
          ? `السلام عليكم أ/ ${row.donor_name}، نتواصل معكم من مؤسسة اليسر الخيرية بخصوص تبرعكم الكريم رقم (${row.ref_code}) بمبلغ ${Number(row.amount).toLocaleString("ar-EG")} ج.م. تقبل الله منكم صالح الأعمال.`
          : `Hello ${row.donor_name}, contacting you from Al-Yusr Charity regarding donation ${row.ref_code}. Thank you for your generosity.`
      )}`
    : null;

  return (
    <AdminLayout>
      <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Top Header Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-soft flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to="/admin/donations"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title={isAr ? "العودة لقائمة التبرعات" : "Back to donations"}
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs sm:text-sm font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                  {row.ref_code}
                </span>
                <button
                  type="button"
                  onClick={() => copy(row.ref_code, "تم نسخ كود التبرع")}
                  className="text-muted-foreground hover:text-primary transition cursor-pointer p-1"
                  title={isAr ? "نسخ الكود" : "Copy code"}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  <span>{isAr ? currentStatus.labelAr : currentStatus.labelEn}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-primary mt-1">
                {Number(row.amount).toLocaleString(isAr ? "ar-EG" : "en-US")} {row.currency === "EGP" ? (isAr ? "ج.م" : "EGP") : row.currency}
              </h1>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReceiptPreview(true)}
              className="gap-1.5 text-xs font-bold"
            >
              <FileText className="h-4 w-4" />
              <span>{isAr ? "معاينة وتحميل الإيصال" : "View Receipt"}</span>
            </Button>

            <Button
              asChild
              size="sm"
              variant="secondary"
              className="gap-1.5 text-xs font-bold"
            >
              <Link to={publicTrackHref} target="_blank">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{isAr ? "تتبع التبرع العام" : "Public View"}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Status Transition Control Card */}
        {allowedTransitions.length > 0 && (
          <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary/20 text-secondary-foreground">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  {isAr ? "إجراءات اعتماد وتعديل الحالة" : "Status Workflow Actions"}
                </p>
                <p className="text-xs sm:text-sm font-black text-foreground">
                  {isAr ? "انقر على أحد الإجراءات لتحديث حالة التبرع في قاعدة البيانات فوراً:" : "Choose a workflow action to update the donation:"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {allowedTransitions.map((next) => {
                const conf = TRANSITION_CONFIG[next] || { labelAr: next, labelEn: next, variant: "default" };
                return (
                  <Button
                    key={next}
                    size="sm"
                    variant={conf.variant}
                    disabled={updating}
                    onClick={() => transition(next)}
                    className="font-bold text-xs h-8 px-3 shadow-xs cursor-pointer gap-1.5"
                  >
                    {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    <span>{isAr ? conf.labelAr : conf.labelEn}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4 Stat Overview Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
            <p className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "حالة الدفع" : "Payment Status"}</span>
              <StatusIcon className={`h-4 w-4 ${currentStatus.text}`} />
            </p>
            <p className={`mt-2 text-base font-black ${currentStatus.text}`}>
              {isAr ? currentStatus.labelAr : currentStatus.labelEn}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              {isAr ? "محدثة عبر السيرفر" : "Synchronized"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
            <p className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "طريقة الدفع" : "Method"}</span>
              <CreditCard className="h-4 w-4 text-primary" />
            </p>
            <p className="mt-2 text-sm sm:text-base font-black text-foreground truncate">
              {formatMethod(row.payment_method, isAr)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              {row.payment_method || "Online"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
            <p className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "المبلغ المالي" : "Amount"}</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </p>
            <p className="mt-2 text-base font-black text-foreground">
              {Number(row.amount).toLocaleString(isAr ? "ar-EG" : "en-US")} {isAr ? "ج.م" : "EGP"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              {isAr ? "صحيح ومعتمد" : "Verified Amount"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
            <p className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>{isAr ? "تاريخ العملية" : "Date & Time"}</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </p>
            <p className="mt-2 text-sm font-black text-foreground">
              {new Date(row.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              {new Date(row.created_at).toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* 2 Main Columns: Donor Details & Destination Allocation */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Donor Card */}
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-primary">
                    {isAr ? "بيانات المتبرع" : "Donor Information"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? "معلومات التواصل والمسجل لدى الجمعية" : "Contact details and donor record"}
                  </p>
                </div>
              </div>
            </div>

            <dl className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-semibold">{isAr ? "الاسم الكريم:" : "Full Name:"}</span>
                <span className="font-black text-foreground">{row.donor_name}</span>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-semibold">{isAr ? "رقم الهاتف:" : "Phone:"}</span>
                <div className="flex items-center gap-2">
                  <span dir="ltr" className="font-mono font-bold text-foreground">
                    {row.donor_phone || "—"}
                  </span>
                  {cleanPhone && (
                    <>
                      <button
                        type="button"
                        onClick={() => copy(row.donor_phone, "تم نسخ رقم الهاتف")}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        title={isAr ? "نسخ" : "Copy"}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="text-primary hover:underline p-0.5"
                        title={isAr ? "اتصال" : "Call"}
                      >
                        <Phone className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-semibold">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>
                <div className="flex items-center gap-2">
                  <span dir="ltr" className="font-mono text-xs text-foreground">
                    {row.donor_email || "—"}
                  </span>
                  {row.donor_email && (
                    <a
                      href={`mailto:${row.donor_email}`}
                      className="text-primary hover:underline"
                      title={isAr ? "مراسلة" : "Email"}
                    >
                      <Mail className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {row.donor_id && (
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-semibold">{isAr ? "معرف المتبرع (ID):" : "Donor ID:"}</span>
                  <Link
                    to={`/admin/donors/${row.donor_id}`}
                    className="font-mono text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>#{row.donor_id}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {row.notes && (
                <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
                  <p className="font-bold text-muted-foreground">{isAr ? "رسالة أو ملاحظات المتبرع:" : "Donor message / Notes:"}</p>
                  <p className="text-foreground leading-relaxed font-medium">{row.notes}</p>
                </div>
              )}
            </dl>

            {/* WhatsApp Contact Button - bottom of donor card */}
            {whatsappUrl && (
              <div className="pt-2 border-t border-border/40 mt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#22c55e] active:scale-95 text-white font-bold text-xs px-3 py-1.5 shadow-sm transition-all duration-150 select-none"
                >
                  <WhatsAppIcon size={16} className="h-4 w-4 shrink-0 fill-current text-white" />
                  <span>{isAr ? "تواصل عبر واتساب" : "WhatsApp"}</span>
                </a>
              </div>
            )}
          </section>

          {/* Allocation & Destination Card */}
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-primary">
                    {isAr ? "وجهة وتخصيص التبرع" : "Donation Allocation"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? "البرنامج أو الحالة المستفيدة من المبلغ" : "Program, case, or project target"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  {targetType}
                </span>
                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5">
                  {isAr ? "مخصص" : "Allocated"}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-foreground">
                {targetTitle}
              </h3>

              {row.case && (
                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">
                    {row.case.code || `CASE-${row.case.id}`}
                  </span>
                  <Link
                    to={`/admin/cases/${row.case.id}`}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{isAr ? "فتح إدارة الحالة" : "Manage Case"}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {row.project && (
                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {isAr ? "مشروع مؤسسي" : "Project"}
                  </span>
                  <Link
                    to={`/admin/projects/${row.project.id}`}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{isAr ? "فتح صفحة المشروع" : "Manage Project"}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {row.program && (
                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {isAr ? "برنامج رئيسي" : "Main Program"}
                  </span>
                  <Link
                    to="/admin/programs"
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{isAr ? "إدارة البرامج" : "Manage Programs"}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded-xl border border-border/40">
              💡 {isAr
                ? "يتم توجيه 100% من صافي قيمة التبرع مباشرة إلى المصرف المحدد مع التوثيق المالي وإصدار التقارير للمتبرع."
                : "100% of the donation net proceeds are directed to the designated charity initiative."}
            </div>
          </section>
        </div>

        {/* Payment Transaction Audit & Technical Details */}
        <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-primary">
                  {isAr ? "تفاصيل المعاملة والربط التقني" : "Transaction Audit & Gateway Info"}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {isAr ? "المعرفات الرقمية وربط بوابات الدفع الإلكتروني" : "Identifiers, gateway response, and timestamps"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div className="rounded-xl bg-muted/20 p-3 border border-border/40">
              <span className="text-muted-foreground font-semibold block">{isAr ? "المرجع الداخلي:" : "Internal Reference:"}</span>
              <span className="font-mono font-bold text-foreground mt-1 block select-all">{row.ref_code}</span>
            </div>

            <div className="rounded-xl bg-muted/20 p-3 border border-border/40">
              <span className="text-muted-foreground font-semibold block">{isAr ? "رقم السجل في قاعدة البيانات (ID):" : "Database ID:"}</span>
              <span className="font-mono font-bold text-foreground mt-1 block">#{row.id}</span>
            </div>

            <div className="rounded-xl bg-muted/20 p-3 border border-border/40">
              <span className="text-muted-foreground font-semibold block">{isAr ? "مزود بوابة الدفع:" : "Gateway Provider:"}</span>
              <span className="font-bold text-foreground mt-1 block">{formatMethod(row.payment_method, isAr)}</span>
            </div>

            <div className="rounded-xl bg-muted/20 p-3 border border-border/40">
              <span className="text-muted-foreground font-semibold block">{isAr ? "المبلغ والعملة:" : "Amount & Currency:"}</span>
              <span className="font-black text-foreground mt-1 block">{Number(row.amount).toLocaleString(isAr ? "ar-EG" : "en-US")} {row.currency}</span>
            </div>

            <div className="rounded-xl bg-muted/20 p-3 border border-border/40">
              <span className="text-muted-foreground font-semibold block">{isAr ? "توقيت الإنشاء (Created At):" : "Created At:"}</span>
              <span className="font-mono text-muted-foreground mt-1 block">{new Date(row.created_at).toISOString()}</span>
            </div>

            <div className="rounded-xl bg-muted/20 p-3 border border-border/40">
              <span className="text-muted-foreground font-semibold block mb-2">{isAr ? "رابط تتبع التبرع:" : "Donation Tracking:"}</span>
              <a
                href={publicTrackHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span dir="ltr" className="font-mono truncate">/donate/track/{row.ref_code}</span>
              </a>
            </div>
          </div>
        </section>

        {/* Modal for Receipt Preview / PDF Download */}
        {showReceiptPreview && (
          <div
            onClick={() => setShowReceiptPreview(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl p-5 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-black text-base text-emerald-950 dark:text-emerald-100">
                    {isAr ? "إيصال التبرع الرسمي (PDF)" : "Official Donation Receipt"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReceiptPreview(false)}
                  className="rounded-lg h-8 w-8 grid place-items-center text-muted-foreground hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              <div className="p-1">
                <DonationReceipt
                  d={{
                    ref: row.ref_code,
                    amount: row.amount,
                    program: row.program?.name_ar || targetTitle,
                    programLabel: targetTitle,
                    method: row.payment_method,
                    status: row.payment_status === "paid" || row.payment_status === "completed" ? "completed" : "pending",
                    createdAt: row.created_at,
                    updatedAt: row.updated_at || row.created_at,
                    donor: {
                      name: row.donor_name,
                      phone: row.donor_phone,
                      email: row.donor_email,
                    },
                    notes: row.notes,
                    targetType,
                    items: Array.isArray(row.items) && row.items.length > 0
                      ? row.items.map((it: any) => ({
                          title: it.title || it.title_ar || it.name || it.name_ar || it.program_name || it.item_name || it.description || targetTitle,
                          category: it.category || it.type || targetType,
                          quantity: Number(it.quantity || it.qty || 1),
                          amount: Number(it.amount || it.total || it.price || row.amount),
                        }))
                      : [
                          {
                            title: targetTitle,
                            category: targetType,
                            quantity: 1,
                            amount: row.amount,
                          },
                        ],
                  } as any}
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReceiptPreview(false)}
                  className="text-xs font-bold"
                >
                  {isAr ? "إغلاق" : "Close"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}