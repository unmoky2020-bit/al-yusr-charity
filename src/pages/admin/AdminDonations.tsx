import { useEffect, useMemo, useState } from "react";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  RotateCcw,
  FileText,
  Printer,
  X,
  CreditCard,
  RefreshCw,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { listAllDonations, updateDonationStatus, DONATION_STATUS_TRANSITIONS, type DonationStatus } from "@/data/casesApi";
import { DonationReceipt } from "@/components/common/DonationReceipt";

const PAGE_SIZE = 15;

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30",
  completed: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30",
  failed: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30",
  refunded: "bg-muted text-muted-foreground border border-border",
};

const fmtEGP = (n: number) => {
  const v = Math.round(Number(n) || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 ? 2 : 0)}M`;
  if (v >= 100_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString("en-US");
};

const AdminDonations = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";

  // Live Cloud donations from Laravel Backend
  const [live, setLive] = useState<any[]>([]);
  const [liveStatus, setLiveStatus] = useState<DonationStatus | "all">("all");
  const [liveMethod, setLiveMethod] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [liveQ, setLiveQ] = useState("");
  const [loadingLive, setLoadingLive] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Modal for Official PDF Receipt Preview
  const [receiptRecord, setReceiptRecord] = useState<any | null>(null);

  const reloadLive = async () => {
    setLoadingLive(true);
    try {
      const data = await listAllDonations({
        status: liveStatus,
        method: liveMethod,
        q: liveQ,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate + "T23:59:59").toISOString() : undefined,
      });
      setLive(data);
    } catch (e: any) {
      toast({
        title: isAr ? "خطأ في جلب بيانات التبرعات" : "Error loading donations",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => {
    reloadLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStatus, liveMethod, fromDate, toDate]);

  // Debounce search text input
  useEffect(() => {
    const t = setTimeout(() => {
      reloadLive();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveQ]);

  const transition = async (id: string, current: DonationStatus, next: DonationStatus) => {
    try {
      await updateDonationStatus(id, next);
      toast({ title: isAr ? "تم تحديث الحالة بنجاح" : "Status updated" });
      reloadLive();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const safeLive = Array.isArray(live) ? live : [];

  const [page, setPage] = useState(1);

  const totals = useMemo(() => {
    const isPaid = (status: string) => status === "paid" || status === "completed";
    const paidRows = safeLive.filter((d) => isPaid(d.payment_status));
    const refundedRows = safeLive.filter((d) => d.payment_status === "refunded");
    const pendingRows = safeLive.filter((d) => d.payment_status === "pending");
    const failedRows = safeLive.filter((d) => d.payment_status === "failed");

    const total = paidRows.reduce((s, d) => s + Number(d.amount || 0), 0);
    const refundedAmt = refundedRows.reduce((s, d) => s + Number(d.amount || 0), 0);
    const grossAmt = total + refundedAmt;

    return {
      total,
      refundedAmt,
      grossAmt,
      paid: paidRows.length,
      pending: pendingRows.length,
      failed: failedRows.length,
      refunded: refundedRows.length,
      avg: paidRows.length ? Math.round(total / paidRows.length) : 0,
    };
  }, [safeLive]);

  const totalPages = Math.max(1, Math.ceil(safeLive.length / PAGE_SIZE));
  const pageItems = safeLive.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [liveStatus, liveMethod, liveQ, fromDate, toDate]);

  const resetFilters = () => {
    setLiveStatus("all");
    setLiveMethod("all");
    setFromDate("");
    setToDate("");
    setLiveQ("");
  };

  const exportCSV = () => {
    const rows = [
      ["Ref", "Donor", "Email", "Phone", "Amount", "Currency", "Method", "Status", "Program", "Date"],
      ...safeLive.map((d) => [
        d.ref_code,
        d.donor_name || "",
        d.donor_email || "",
        d.donor_phone || "",
        d.amount,
        d.currency,
        d.payment_method || "",
        d.payment_status,
        d.program?.name_ar || d.project?.name_ar || "",
        d.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alyusr-donations-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusLabel = (status: string) => {
    const s = String(status || "").toLowerCase();
    if (s === "paid" || s === "completed") return isAr ? "مدفوع (Paid)" : "Paid";
    if (s === "pending") return isAr ? "معلق (Pending)" : "Pending";
    if (s === "failed") return isAr ? "فشل (Failed)" : "Failed";
    if (s === "refunded") return isAr ? "مسترد (Refunded)" : "Refunded";
    return status;
  };

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"} className="space-y-4">
        {/* KPI Stat Cards (No zero-flashing on load) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          <StatCard
            accent
            label={isAr ? "المجموع المدفوع" : "Paid total"}
            value={loadingLive && !safeLive.length ? "—" : fmtEGP(totals.total)}
            sub={isAr ? "العمليات المكتملة" : "Completed ops"}
          />
          <StatCard
            label={isAr ? "إجمالي العمليات" : "Gross total"}
            value={loadingLive && !safeLive.length ? "—" : fmtEGP(totals.grossAmt)}
            sub="EGP"
          />
          <StatCard
            label={isAr ? "متوسط التبرع" : "Avg donation"}
            value={loadingLive && !safeLive.length ? "—" : fmtEGP(totals.avg)}
            sub="EGP"
          />
          <StatCard
            label={isAr ? "عدد المعاملات" : "Operations"}
            value={loadingLive && !safeLive.length ? "—" : safeLive.length}
            sub={isAr ? "ضمن الفلتر" : "within filter"}
          />
          <StatCard
            label={isAr ? "مدفوعة ومكتملة" : "Paid"}
            value={loadingLive && !safeLive.length ? "—" : totals.paid}
            sub={isAr ? "عملية ناجحة" : "successful"}
          />
          <StatCard
            label={isAr ? "مرتجعة / معلقة / فاشلة" : "Refunded / Pending / Failed"}
            value={loadingLive && !safeLive.length ? "—" : `${totals.refunded} / ${totals.pending} / ${totals.failed}`}
          />
        </div>

        {/* Live Cloud donations from Laravel backend */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-primary">
                {isAr
                  ? `تبرعات النظام المالي (${safeLive.length})`
                  : `Backend Donations (${safeLive.length})`}
              </h2>
              {loadingLive && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                  {isAr ? "تحديث مباشر..." : "Syncing..."}
                </span>
              )}
            </div>

            {/* Direct, clean filters aligned strictly with Laravel API */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground rtl:right-2.5 rtl:left-auto ltr:left-2.5 ltr:right-auto" />
                <Input
                  placeholder={isAr ? "بحث: كود/اسم/جوال/إيميل" : "Search: ref/name/phone/email"}
                  value={liveQ}
                  onChange={(e) => setLiveQ(e.target.value)}
                  className="h-8 w-44 text-xs font-medium px-8"
                />
              </div>

              {/* Status Filter */}
              <select
                value={liveStatus}
                onChange={(e) => setLiveStatus(e.target.value as any)}
                className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-bold"
              >
                <option value="all">{isAr ? "كل الحالات" : "All statuses"}</option>
                <option value="paid">{isAr ? "مدفوع ومكتمل (Paid)" : "Paid"}</option>
                <option value="pending">{isAr ? "معلق (Pending)" : "Pending"}</option>
                <option value="failed">{isAr ? "فشل (Failed)" : "Failed"}</option>
                <option value="refunded">{isAr ? "مسترد (Refunded)" : "Refunded"}</option>
              </select>

              {/* Payment Method Filter */}
              <select
                value={liveMethod}
                onChange={(e) => setLiveMethod(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-bold"
              >
                <option value="all">{isAr ? "كل طرق الدفع" : "All methods"}</option>
                <option value="kashier">كاشير (Kashier)</option>
                <option value="paymob">باي موب (Paymob)</option>
                <option value="visa">فيزا / ماستركارد (Card)</option>
                <option value="vodafone">فودافون كاش (Vodafone)</option>
                <option value="instapay">إنستا باي (InstaPay)</option>
                <option value="bank">{isAr ? "تحويل بنكي" : "Bank Transfer"}</option>
                <option value="cash">{isAr ? "نقدي" : "Cash"}</option>
                <option value="delegate">{isAr ? "مندوب تحصيل" : "Delegate"}</option>
              </select>

              <Button
                size="sm"
                variant={showFilters ? "secondary" : "outline"}
                onClick={() => setShowFilters((v) => !v)}
                className="h-8 gap-1.5 text-xs font-bold"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>{isAr ? "تاريخ" : "Dates"}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={reloadLive}
                disabled={loadingLive}
                className="h-8 gap-1 text-xs font-bold"
              >
                <RefreshCw className={`h-3 w-3 ${loadingLive ? "animate-spin" : ""}`} />
                <span>{isAr ? "تحديث" : "Refresh"}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={resetFilters}
                className="h-8 gap-1 text-xs font-bold"
                title={isAr ? "إعادة ضبط الفلاتر" : "Reset filters"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={exportCSV}
                className="h-8 gap-1 text-xs font-bold"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </div>

          {/* Expandable Date Filters */}
          {showFilters && (
            <div className="mb-4 grid gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 text-xs sm:grid-cols-2">
              <label className="space-y-1">
                <span className="font-bold text-muted-foreground">{isAr ? "من تاريخ" : "From date"}</span>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-muted-foreground">{isAr ? "إلى تاريخ" : "To date"}</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8"
                />
              </label>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground bg-muted/30">
                <tr>
                  {[
                    isAr ? "كود العملية" : "Ref",
                    isAr ? "المتبرع" : "Donor",
                    isAr ? "المبلغ" : "Amount",
                    isAr ? "طريقة الدفع" : "Method",
                    isAr ? "البرنامج / المبادرة" : "Program",
                    isAr ? "الحالة" : "Status",
                    isAr ? "التاريخ" : "Date",
                    isAr ? "الإيصال المعتمد" : "Receipt",
                    "",
                  ].map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-start font-black">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingLive && !safeLive.length ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-xs font-bold">
                          {isAr ? "جاري تحميل سجل التبرعات من الخادم..." : "Loading donations from server..."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((d) => {
                    const allowed = DONATION_STATUS_TRANSITIONS[d.payment_status as DonationStatus] || [];
                    const programLabel =
                      d.program?.name_ar ||
                      d.program?.name ||
                      d.project?.name_ar ||
                      d.project?.name ||
                      d.donation_campaign?.name_ar ||
                      d.donation_campaign?.name ||
                      (d.cases?.title ? `حالة: ${d.cases.title}` : "صدقة عامة");

                    return (
                      <tr key={d.id} className="border-t border-border/60 hover:bg-muted/15 transition-colors">
                        <td className="px-3 py-2.5 font-mono font-bold text-foreground">{d.ref_code}</td>
                        <td className="px-3 py-2.5 font-bold">
                          {d.donor_id ? (
                            <Link
                              to={`/admin/donors/${d.donor_id}`}
                              className="hover:text-primary hover:underline font-extrabold text-foreground"
                            >
                              {d.donor_name || (isAr ? "متبرع كريم" : "Kind Donor")}
                            </Link>
                          ) : (
                            <span className="text-foreground">{d.donor_name || (isAr ? "متبرع كريم" : "Kind Donor")}</span>
                          )}
                          <div className="text-[10px] font-normal text-muted-foreground" dir="ltr">
                            {d.donor_phone || d.donor_email || "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-black whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                          {Number(d.amount).toLocaleString()} {d.currency || "EGP"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground/90">
                            <CreditCard className="h-3 w-3 text-muted-foreground" />
                            {d.payment_method || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium max-w-xs truncate" title={programLabel}>
                          {programLabel}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${STATUS_TONE[d.payment_status] || "bg-muted text-muted-foreground"
                              }`}
                          >
                            {getStatusLabel(d.payment_status)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                          {new Date(d.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                        </td>
                        <td className="px-3 py-2.5">
                          {/* Official PDF Receipt Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const targetType = d.cases
                                ? (isAr ? "حالة إنسانية عاجلة" : "Urgent Humanitarian Case")
                                : d.project
                                  ? (isAr ? "مشروع تنموي" : "Development Project")
                                  : d.program
                                    ? (isAr ? "برنامج خيري رئيسي" : "Charity Program")
                                    : d.donation_campaign
                                      ? (isAr ? "حملة إغاثية / تطوعية" : "Relief / Volunteer Campaign")
                                      : d.donation_package
                                        ? (isAr ? "باقة خيرية معتمدة" : "Verified Charity Package")
                                        : (isAr ? "كفالة البرامج العامة والمساعدات" : "General Charity Programs");

                              const items = Array.isArray(d.items) && d.items.length > 0
                                ? d.items.map((it: any) => ({
                                  title: it.title || it.title_ar || it.name || it.name_ar || it.program_name || it.item_name || it.description || programLabel,
                                  category: it.category || it.type || targetType,
                                  quantity: Number(it.quantity || it.qty || 1),
                                  amount: Number(it.amount || it.total || it.price || d.amount),
                                }))
                                : [
                                  {
                                    title: programLabel,
                                    category: targetType,
                                    quantity: 1,
                                    amount: d.amount,
                                  },
                                ];

                              setReceiptRecord({
                                ref: d.ref_code,
                                amount: d.amount,
                                program: programLabel,
                                programLabel: programLabel,
                                method: d.payment_method,
                                status: d.payment_status,
                                createdAt: d.created_at,
                                updatedAt: d.updated_at || d.created_at,
                                donor: {
                                  name: d.donor_name,
                                  phone: d.donor_phone,
                                  email: d.donor_email,
                                },
                                notes: d.notes,
                                targetType,
                                items,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-extrabold text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300 transition-colors"
                            title={isAr ? "تحميل إيصال PDF رسمي" : "Official PDF Receipt"}
                          >
                            <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{isAr ? "إيصال PDF" : "PDF"}</span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-end">
                          <div className="flex flex-wrap justify-end gap-1">
                            {allowed.map((next) => (
                              <button
                                key={next}
                                onClick={() => transition(d.id, d.payment_status, next)}
                                className="rounded-md bg-secondary/20 px-2 py-1 text-[10px] font-black text-primary hover:bg-secondary/30"
                              >
                                → {next}
                              </button>
                            ))}
                            <Link
                              to={`/admin/donations/${d.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary hover:bg-primary/20"
                              title="Details"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>{isAr ? "تفاصيل" : "Details"}</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {!loadingLive && safeLive.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold">
                      {isAr ? "لا توجد تبرعات مطابقة للبحث أو الفلتر" : "No donations match your filters"}
                    </td>
                  </tr>
                )}
              </tbody>

              {safeLive.length > 0 && (
                <tfoot className="border-t-2 border-border bg-muted/30 text-xs font-black text-primary">
                  <tr>
                    <td className="px-3 py-2.5" colSpan={2}>
                      {isAr ? `إجمالي العمليات: ${safeLive.length}` : `Total ${safeLive.length} records`}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-emerald-700 dark:text-emerald-400 font-black">
                      {totals.total.toLocaleString("en-US")} EGP
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground font-semibold" colSpan={6}>
                      {isAr
                        ? `المدفوع فقط: ${totals.total.toLocaleString("en-US")} EGP · إجمالي شامل المسترد: ${totals.grossAmt.toLocaleString("en-US")} EGP`
                        : `Paid only: ${totals.total.toLocaleString("en-US")} EGP · Gross: ${totals.grossAmt.toLocaleString("en-US")} EGP`}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Modal for Official PDF Receipt Preview & Download */}
        {receiptRecord && (
          <div
            onClick={() => setReceiptRecord(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-card rounded-3xl border border-border shadow-2xl p-5 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-black text-base text-foreground">
                    {isAr ? "إيصال التبرع المعتمد إلكترونياً (PDF)" : "Official Certified Receipt"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptRecord(null)}
                  className="rounded-lg h-8 w-8 grid place-items-center text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <DonationReceipt d={receiptRecord} />
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-card px-4 py-2.5 text-xs shadow-soft">
          <span className="text-muted-foreground font-medium">
            {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="h-8 gap-1 font-bold">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid h-8 w-8 place-items-center rounded-md border border-border disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4 rtl:hidden" />
              <ChevronRight className="h-4 w-4 ltr:hidden" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="grid h-8 w-8 place-items-center rounded-md border border-border disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4 rtl:hidden" />
              <ChevronLeft className="h-4 w-4 ltr:hidden" />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDonations;