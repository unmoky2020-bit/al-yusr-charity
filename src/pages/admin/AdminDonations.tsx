import { UiSelect } from "@/components/common/UiSelect";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Loader2, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DonationReceipt } from "@/components/common/DonationReceipt";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { DONATION_STATUS_TRANSITIONS, type DonationStatus } from "@/data/casesApi";
import { donationCampaignsApi, programsApiV1, projectsApi } from "@/data/laravelApi";
import {
  donationsAdminApi,
  filtersFromSearch,
  filtersToParams,
  type AdminDonation,
  type DonationFilters,
  type DonationStatusKey,
} from "@/data/api/donationsAdminApi";
import {
  donationMethodLabel,
  donationStatusLabel,
  donationStatusTone,
  donationTargetLabel,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/lib/donationDisplay";
import type { DonationRecord } from "@/data/donationsStore";

const PER_PAGE_OPTIONS = [25, 50, 100];
const REFRESH_MS = 30_000;
const selectCls = "h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-bold";

/** The specific-record filter that goes with each target kind. */
const TARGET_ID_KEY = { program: "program_id", project: "project_id", campaign: "donation_campaign_id" } as const;

const AdminDonations = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const [sp, setSp] = useSearchParams();

  // URL is the single source of truth for filters / page, so a view can be reloaded or shared.
  const filters = useMemo(() => filtersFromSearch(sp), [sp]);
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const perPage = PER_PAGE_OPTIONS.includes(Number(sp.get("per_page"))) ? Number(sp.get("per_page")) : PER_PAGE_OPTIONS[0];

  const writeUrl = (next: DonationFilters, opts: { page?: number; perPage?: number } = {}) => {
    const params = filtersToParams(next);
    const p = opts.page ?? 1;
    const pp = opts.perPage ?? perPage;
    if (p > 1) params.page = String(p);
    if (pp !== PER_PAGE_OPTIONS[0]) params.per_page = String(pp);
    setSp(params, { replace: true });
  };
  const setFilter = (patch: Partial<DonationFilters>) => writeUrl({ ...filters, ...patch });

  // Search box: local text, written to the URL after a short pause.
  const [qInput, setQInput] = useState(filters.q ?? "");
  useEffect(() => setQInput(filters.q ?? ""), [filters.q]);
  useEffect(() => {
    if ((filters.q ?? "") === qInput.trim()) return;
    const t = setTimeout(() => setFilter({ q: qInput }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const listQuery = useQuery({
    queryKey: ["admin-donations", "list", filters, page, perPage],
    queryFn: () => donationsAdminApi.list(filters, page, perPage),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS, // gateway confirmations arrive after creation; paused while the tab is hidden
  });
  const statsQuery = useQuery({
    queryKey: ["admin-donations", "stats", filters],
    queryFn: () => donationsAdminApi.stats(filters),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });
  const methodsQuery = useQuery({ queryKey: ["admin-payment-methods"], queryFn: donationsAdminApi.paymentMethods, staleTime: 5 * 60_000 });
  const targetOptions = useQuery({
    queryKey: ["admin-donations", "target-options", filters.target],
    enabled: filters.target === "program" || filters.target === "project" || filters.target === "campaign",
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<{ id: number | string; name: string }[]> => {
      if (filters.target === "program") return (await programsApiV1.listAll()).map((p) => ({ id: p.id, name: p.name_ar || p.name }));
      if (filters.target === "project") return (await projectsApi.listAll()).map((p) => ({ id: p.id, name: p.name }));
      return (await donationCampaignsApi.listAll()).map((c) => ({ id: c.id, name: c.name_ar || c.name }));
    },
  });

  const rows = listQuery.data?.rows ?? [];
  const meta = listQuery.data?.meta;
  const stats = statsQuery.data;
  const loading = listQuery.isLoading;
  const [receipt, setReceipt] = useState<DonationRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-donations"] });

  const transition = async (d: AdminDonation, next: DonationStatusKey) => {
    if (next === "paid" && d.is_gateway &&
      !window.confirm(isAr
        ? "ده دفع أونلاين — بيتأكد لوحده من بوابة الدفع أول ما المتبرع يدفع. علّمه «مدفوع» يدوي بس لو اتأكدت من وصول المبلغ في حساب كاشير. متأكد؟"
        : "Online payment — the gateway confirms it automatically. Mark it paid only if you verified the money in the Kashier account. Continue?")) {
      return;
    }
    setBusyId(d.id);
    try {
      // The confirm above is the admin's explicit check for online payments.
      const stored = await donationsAdminApi.setStatus(d.id, next, { confirmGateway: next === "paid" && d.is_gateway });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated", description: donationStatusLabel(stored || next, d.is_gateway, lang) });
    } catch (e) {
      toast({ variant: "destructive", title: isAr ? "تعذر تحديث الحالة" : "Could not update status", description: (e as Error)?.message });
    } finally {
      setBusyId(null);
      void refresh();
    }
  };

  const openReceipt = (d: AdminDonation) => {
    const target = donationTargetLabel(d, lang);
    setReceipt({
      ref: d.transaction_reference,
      donor: { name: d.donor?.name || (isAr ? "فاعل خير" : "Anonymous"), email: d.donor?.email || "", phone: d.donor?.phone || "" },
      amount: Number(d.amount),
      program: target,
      programLabel: target,
      method: donationMethodLabel(d, lang),
      status: "completed",
      createdAt: d.created_at,
      updatedAt: d.created_at,
      notes: d.notes || undefined,
      items: [{ title: d.donation_package ? (isAr ? d.donation_package.name_ar : d.donation_package.name_en) || target : target, quantity: 1, amount: Number(d.amount) }],
    });
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await donationsAdminApi.listAllMatching(filters);
      const header = ["Reference", "Donor", "Phone", "Email", "Amount (EGP)", "Method", "Status", "For", "Date"];
      const lines = all.map((d) => [
        d.transaction_reference,
        d.donor?.name || "",
        d.donor?.phone || "",
        d.donor?.email || "",
        String(d.amount),
        donationMethodLabel(d, lang),
        donationStatusLabel(d.status, d.is_gateway, lang),
        donationTargetLabel(d, lang),
        d.created_at,
      ]);
      const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `alyusr-donations-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: isAr ? `تم تصدير ${formatNumber(all.length, lang)} تبرع (كل نتائج الفلتر)` : `Exported ${all.length} donations (all filter results)` });
    } catch (e) {
      toast({ variant: "destructive", title: isAr ? "تعذر التصدير" : "Export failed", description: (e as Error)?.message });
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Object.keys(filtersToParams(filters)).length > 0;
  const statusCount = (k: string) => stats?.by_status?.[k]?.count ?? 0;
  const dash = "—";

  return (
    <AdminLayout>
      <div dir={isAr ? "rtl" : "ltr"} className="space-y-4">
        {/* Totals over ALL donations matching the filters (computed by the server, not the current page) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard accent label={isAr ? "المبلغ المستلم (مدفوع فقط)" : "Received (paid only)"}
            value={stats ? formatMoney(stats.paid.amount, lang) : dash}
            sub={stats ? (isAr ? `${formatNumber(stats.paid.count, lang)} تبرع مدفوع` : `${stats.paid.count} paid donations`) : undefined} />
          <StatCard label={isAr ? "متوسط التبرع المدفوع" : "Average paid donation"}
            value={stats ? formatMoney(stats.paid.average, lang) : dash}
            sub={stats ? (isAr ? `${formatNumber(stats.paid.donors, lang)} متبرع دفع` : `${stats.paid.donors} paying donors`) : undefined} />
          <StatCard label={isAr ? "كل العمليات في الفلتر" : "All operations in filter"}
            value={stats ? formatNumber(stats.total_count, lang) : dash}
            sub={isAr ? "بكل حالاتها" : "any status"} />
          <StatCard label={isAr ? "معلق / فاشل / مسترد" : "Pending / Failed / Refunded"}
            value={stats ? `${formatNumber(statusCount("pending"), lang)} / ${formatNumber(statusCount("failed"), lang)} / ${formatNumber(statusCount("refunded"), lang)}` : dash}
            sub={stats?.by_status?.pending ? (isAr ? `معلق بقيمة ${formatMoney(stats.by_status.pending.amount, lang)} (مش محسوب في المستلم)` : `pending worth ${formatMoney(stats.by_status.pending.amount, lang)} (not counted as received)`) : undefined} />
          <StatCard label={isAr ? "نسبة نجاح الدفع" : "Payment success rate"}
            value={stats ? (stats.success_rate == null ? dash : `${formatNumber(stats.success_rate, lang)}%`) : dash}
            sub={isAr ? "مدفوع ÷ (مدفوع + فاشل)" : "paid ÷ (paid + failed)"} />
        </div>
        {statsQuery.isError && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-bold text-destructive">
            {isAr ? "تعذر تحميل الإجماليات من السيرفر." : "Could not load totals from the server."}
          </p>
        )}

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          {/* Filters — every one is applied by the server */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-black text-primary">
              {isAr ? "سجل التبرعات" : "Donations"}
              {meta && <span className="text-xs font-bold text-muted-foreground">({formatNumber(meta.total, lang)})</span>}
              {listQuery.isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void refresh()} className="h-9 gap-1 text-xs font-bold">
                <RefreshCw className="h-3.5 w-3.5" /> {isAr ? "تحديث" : "Refresh"}
              </Button>
              {hasFilters && (
                <Button size="sm" variant="outline" onClick={() => writeUrl({})} className="h-9 gap-1 text-xs font-bold">
                  <RotateCcw className="h-3.5 w-3.5" /> {isAr ? "مسح الفلاتر" : "Clear filters"}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => void exportCsv()} disabled={exporting || !meta?.total} className="h-9 gap-1 text-xs font-bold"
                title={isAr ? "بيصدّر كل التبرعات المطابقة للفلتر (مش الصفحة الحالية بس)" : "Exports every donation matching the filters"}>
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} CSV
              </Button>
            </div>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={qInput} onChange={(e) => setQInput(e.target.value)} className="h-9 ps-8 text-xs"
                placeholder={isAr ? "بحث: رقم العملية / الاسم / الموبايل / الإيميل" : "Search: reference / name / phone / email"} />
            </div>
            <UiSelect aria-label={isAr ? "الحالة" : "Status"} className={selectCls} value={filters.status ?? ""} onChange={(e) => setFilter({ status: e.target.value })}>
              <option value="">{isAr ? "كل الحالات" : "All statuses"}</option>
              <option value="paid">{isAr ? "مدفوع" : "Paid"}</option>
              <option value="pending">{isAr ? "معلق" : "Pending"}</option>
              <option value="failed">{isAr ? "فشل" : "Failed"}</option>
              <option value="refunded">{isAr ? "مسترد" : "Refunded"}</option>
            </UiSelect>
            <UiSelect aria-label={isAr ? "القناة" : "Channel"} className={selectCls} value={filters.channel ?? ""} onChange={(e) => setFilter({ channel: (e.target.value || undefined) as DonationFilters["channel"] })}>
              <option value="">{isAr ? "أونلاين ويدوي" : "Online & manual"}</option>
              <option value="gateway">{isAr ? "أونلاين (بوابة دفع)" : "Online (gateway)"}</option>
              <option value="manual">{isAr ? "يدوي (تحويل/محفظة/مندوب)" : "Manual"}</option>
            </UiSelect>
            <UiSelect aria-label={isAr ? "طريقة الدفع" : "Method"} className={selectCls} value={filters.payment_method_id ?? ""} onChange={(e) => setFilter({ payment_method_id: e.target.value })}>
              <option value="">{isAr ? "كل طرق الدفع" : "All methods"}</option>
              {(methodsQuery.data ?? []).map((m) => (
                <option key={m.id} value={String(m.id)}>{isAr ? m.name_ar : m.name_en || m.name_ar}</option>
              ))}
            </UiSelect>
            <UiSelect aria-label={isAr ? "نوع الجهة" : "Target kind"} className={selectCls} value={filters.target ?? ""}
              onChange={(e) => writeUrl({ ...filters, target: (e.target.value || undefined) as DonationFilters["target"], program_id: "", project_id: "", donation_campaign_id: "" })}>
              <option value="">{isAr ? "كل الجهات" : "Any target"}</option>
              <option value="program">{isAr ? "برامج" : "Programs"}</option>
              <option value="project">{isAr ? "مشاريع" : "Projects"}</option>
              <option value="campaign">{isAr ? "حملات" : "Campaigns"}</option>
              <option value="case">{isAr ? "حالات" : "Cases"}</option>
            </UiSelect>
            {filters.target && filters.target !== "case" ? (
              <UiSelect aria-label={isAr ? "الجهة" : "Target"} className={selectCls}
                value={filters[TARGET_ID_KEY[filters.target]] ?? ""}
                onChange={(e) => setFilter({ [TARGET_ID_KEY[filters.target as keyof typeof TARGET_ID_KEY]]: e.target.value })}>
                <option value="">{isAr ? "الكل" : "All"}</option>
                {(targetOptions.data ?? []).map((o) => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
              </UiSelect>
            ) : (
              <UiSelect aria-label={isAr ? "الترتيب" : "Sort"} className={selectCls} value={filters.sort ?? "-created_at"} onChange={(e) => setFilter({ sort: e.target.value as DonationFilters["sort"] })}>
                <option value="-created_at">{isAr ? "الأحدث أولاً" : "Newest first"}</option>
                <option value="created_at">{isAr ? "الأقدم أولاً" : "Oldest first"}</option>
                <option value="-amount">{isAr ? "الأعلى مبلغاً" : "Highest amount"}</option>
                <option value="amount">{isAr ? "الأقل مبلغاً" : "Lowest amount"}</option>
              </UiSelect>
            )}
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              {isAr ? "من" : "From"}
              <Input type="date" value={filters.from ?? ""} onChange={(e) => setFilter({ from: e.target.value })} className="h-9 text-xs" />
            </label>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              {isAr ? "إلى" : "To"}
              <Input type="date" value={filters.to ?? ""} onChange={(e) => setFilter({ to: e.target.value })} className="h-9 text-xs" />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 text-[11px] font-extrabold text-muted-foreground">
                <tr>
                  {[isAr ? "رقم العملية" : "Reference", isAr ? "المتبرع" : "Donor", isAr ? "المبلغ" : "Amount", isAr ? "طريقة الدفع" : "Method",
                    isAr ? "التبرع لـ" : "For", isAr ? "الحالة" : "Status", isAr ? "التاريخ" : "Date", ""].map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-start font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td colSpan={8} className="px-3 py-3"><div className="h-4 w-full animate-pulse rounded bg-muted" /></td>
                    </tr>
                  ))}
                {listQuery.isError && !rows.length && (
                  <tr><td colSpan={8} className="p-8 text-center font-bold text-destructive">{isAr ? "تعذر تحميل التبرعات من السيرفر." : "Could not load donations."}</td></tr>
                )}
                {!loading && !listQuery.isError && rows.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center font-bold text-muted-foreground">{isAr ? "مفيش تبرعات مطابقة للفلتر" : "No donations match the filters"}</td></tr>
                )}
                {rows.map((d) => {
                  const allowed = DONATION_STATUS_TRANSITIONS[d.status as DonationStatus] ?? [];
                  const target = donationTargetLabel(d, lang);
                  return (
                    <tr key={d.id} className="border-t border-border/60 transition-colors hover:bg-muted/15">
                      <td className="px-3 py-2.5 font-mono font-bold">{d.transaction_reference}</td>
                      <td className="px-3 py-2.5">
                        {d.donor ? (
                          <Link to={`/admin/donors/${d.donor.id}`} className="font-extrabold hover:text-primary hover:underline">{d.donor.name || (isAr ? "فاعل خير" : "Anonymous")}</Link>
                        ) : (
                          <span className="font-extrabold">{isAr ? "فاعل خير" : "Anonymous"}</span>
                        )}
                        <div className="text-[10px] text-muted-foreground" dir="ltr">{d.donor?.phone || d.donor?.email || ""}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-black text-emerald-700 dark:text-emerald-400">{formatMoney(Number(d.amount), lang)}</td>
                      <td className="px-3 py-2.5 font-semibold">{donationMethodLabel(d, lang)}</td>
                      <td className="max-w-[220px] truncate px-3 py-2.5" title={target}>{target}</td>
                      <td className="px-3 py-2.5">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-black ${donationStatusTone(d.status, d.is_gateway)}`}>
                          {donationStatusLabel(d.status, d.is_gateway, lang)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{formatDateTime(d.created_at, lang)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap justify-end gap-1">
                          {allowed.map((next) => (
                            <button key={next} type="button" disabled={busyId === d.id} onClick={() => void transition(d, next as DonationStatusKey)}
                              className="rounded-md bg-secondary/20 px-2 py-1 text-[10px] font-black text-primary hover:bg-secondary/30 disabled:opacity-50">
                              → {donationStatusLabel(next, false, lang)}
                            </button>
                          ))}
                          {d.status === "paid" && (
                            <button type="button" onClick={() => openReceipt(d)}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-600/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300">
                              <FileText className="h-3 w-3" /> {isAr ? "إيصال" : "Receipt"}
                            </button>
                          )}
                          <Link to={`/admin/donations/${d.id}`} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-black text-primary hover:bg-primary/20">
                            <ExternalLink className="h-3 w-3" /> {isAr ? "تفاصيل" : "Details"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server pagination */}
          {meta && meta.total > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-muted-foreground">
                {isAr
                  ? `عرض ${formatNumber(meta.from ?? 0, lang)}–${formatNumber(meta.to ?? 0, lang)} من ${formatNumber(meta.total, lang)}`
                  : `Showing ${meta.from}–${meta.to} of ${meta.total}`}
              </span>
              <div className="flex items-center gap-2">
                <UiSelect aria-label={isAr ? "عدد الصفوف" : "Rows per page"} className={selectCls} value={perPage}
                  onChange={(e) => writeUrl(filters, { perPage: Number(e.target.value) })}>
                  {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{isAr ? `${n} في الصفحة` : `${n} / page`}</option>)}
                </UiSelect>
                <button type="button" aria-label={isAr ? "الصفحة السابقة" : "Previous page"} disabled={page <= 1}
                  onClick={() => writeUrl(filters, { page: page - 1 })} className="grid h-9 w-9 place-items-center rounded-lg border border-border disabled:opacity-40">
                  {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
                <span className="font-bold">{isAr ? `صفحة ${formatNumber(page, lang)} من ${formatNumber(meta.last_page, lang)}` : `Page ${page} of ${meta.last_page}`}</span>
                <button type="button" aria-label={isAr ? "الصفحة التالية" : "Next page"} disabled={page >= meta.last_page}
                  onClick={() => writeUrl(filters, { page: page + 1 })} className="grid h-9 w-9 place-items-center rounded-lg border border-border disabled:opacity-40">
                  {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {receipt && (
          <div onClick={() => setReceipt(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-xs">
            <div onClick={(e) => e.stopPropagation()} className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <h3 className="flex items-center gap-2 text-base font-black"><FileText className="h-5 w-5 text-emerald-600" />{isAr ? "إيصال التبرع" : "Donation receipt"}</h3>
                <button type="button" aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setReceipt(null)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <DonationReceipt d={receipt} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDonations;
