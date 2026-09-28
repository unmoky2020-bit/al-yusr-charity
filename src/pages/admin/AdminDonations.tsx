import { useEffect, useMemo, useState } from "react";
import { Download, ChevronLeft, ChevronRight, CheckCircle2, XCircle, FileImage, ExternalLink, Filter, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { donationsStore, subscribeDonations, type DonationRecord } from "@/data/donationsStore";
import { toast } from "@/hooks/use-toast";
import { LazyImage } from "@/components/common/LazyImage";
import { listAllDonations, updateDonationStatus, DONATION_STATUS_TRANSITIONS, type DonationStatus } from "@/data/casesApi";
import { classifyDonationSource, type DonationSource } from "@/lib/donationSource";

const PAGE_SIZE = 15;
const STATUS_TONE: Record<string, string> = {
  paid: "bg-secondary/25 text-primary",
  pending: "bg-accent/15 text-accent",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

/** Compact-but-accurate currency formatting.
 *  - < 100,000: full thousands-separated number (e.g. 15,900) so users never lose pounds.
 *  - ≥ 100,000: short form (105K, 1.2M).
 */
const fmtEGP = (n: number) => {
  const v = Math.round(Number(n) || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 ? 2 : 0)}M`;
  if (v >= 100_000)   return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString("en-US");
};

const AdminDonations = () => {
  const { lang } = useLang();
  const [pending, setPending] = useState<DonationRecord[]>([]);
  const [preview, setPreview] = useState<DonationRecord | null>(null);

  // Live Cloud donations
  const [live, setLive] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [liveStatus, setLiveStatus] = useState<DonationStatus | "all">("all");
  const [liveMethod, setLiveMethod] = useState<string>("all");
  const [campaignId, setCampaignId] = useState<string>("all");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [liveQ, setLiveQ] = useState("");
  const [loadingLive, setLoadingLive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<DonationSource | "all">("all");
  const reloadLive = async () => {
    setLoadingLive(true);
    try {
      setLive(await listAllDonations({
        status: liveStatus, method: liveMethod, q: liveQ,
        campaignId, utmSource: utmSource.trim(), utmMedium: utmMedium.trim(),
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate + "T23:59:59").toISOString() : undefined,
      }));
    }
    catch (e: any) { toast({ title: "Cloud error", description: e.message, variant: "destructive" }); }
    finally { setLoadingLive(false); }
  };
  useEffect(() => { reloadLive(); /* eslint-disable-next-line */ }, [liveStatus, liveMethod, campaignId, fromDate, toDate]);
  // Debounce text inputs
  useEffect(() => {
    const t = setTimeout(() => { reloadLive(); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveQ, utmSource, utmMedium]);

  // Campaigns filter — disabled (Supabase removed)
  useEffect(() => {
    setCampaigns([]);
  }, []);

  // Note: Realtime updates removed (Supabase removed). Manual refresh available.

  const transition = async (id: string, current: DonationStatus, next: DonationStatus) => {
    try {
      await updateDonationStatus(id, next);
      toast({ title: lang === "ar" ? "تم تحديث الحالة" : "Status updated" });
      reloadLive();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    const load = () => setPending(donationsStore.all().filter((d) => d.status === "pending" || d.status === "processing"));
    load();
    return subscribeDonations(load);
  }, []);

  const approve = (ref: string) => {
    donationsStore.update(ref, { status: "completed" });
    toast({ title: lang === "ar" ? " تم اعتماد التبرع" : "Donation approved" });
  };
  const reject = (ref: string) => {
    donationsStore.update(ref, { status: "failed" });
    toast({ title: lang === "ar" ? " تم رفض التبرع" : "Donation rejected" });
  };

  // Apply Paid vs Organic classification on top of the loaded rows
  const safeLive = Array.isArray(live) ? live : [];
  const filteredLive = useMemo(() => {
    if (sourceFilter === "all") return safeLive;
    return safeLive.filter((d) => classifyDonationSource(d) === sourceFilter);
  }, [safeLive, sourceFilter]);

  const sourceCounts = useMemo(() => {
    let paid = 0, organic = 0;
    for (const d of safeLive) {
      if (classifyDonationSource(d) === "paid") paid++; else organic++;
    }
    return { paid, organic };
  }, [safeLive]);

  const [page, setPage] = useState(1);
  const totals = useMemo(() => {
    const paidRows = filteredLive.filter((d) => d.payment_status === "paid");
    const refundedRows = filteredLive.filter((d) => d.payment_status === "refunded");
    const total = paidRows.reduce((s, d) => s + Number(d.amount || 0), 0);
    const refundedAmt = refundedRows.reduce((s, d) => s + Number(d.amount || 0), 0);
    const grossAmt = total + refundedAmt;
    return {
      total, refundedAmt, grossAmt,
      paid: paidRows.length,
      pending: filteredLive.filter((d) => d.payment_status === "pending").length,
      failed: filteredLive.filter((d) => d.payment_status === "failed").length,
      refunded: refundedRows.length,
      avg: paidRows.length ? total / paidRows.length : 0,
    };
  }, [filteredLive]);
  const totalPages = Math.max(1, Math.ceil(filteredLive.length / PAGE_SIZE));
  const pageItems = filteredLive.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [liveStatus, liveMethod, liveQ, campaignId, utmSource, utmMedium, fromDate, toDate, sourceFilter]);

  const resetFilters = () => {
    setLiveStatus("all"); setLiveMethod("all"); setCampaignId("all");
    setUtmSource(""); setUtmMedium(""); setFromDate(""); setToDate(""); setLiveQ("");
    setSourceFilter("all");
  };

  const exportCSV = () => {
    const rows = [
      ["Ref", "Donor", "Email", "Phone", "Amount", "Currency", "Method", "Status", "Source", "Campaign", "utm_source", "utm_medium", "utm_campaign", "Date"],
      ...filteredLive.map((d) => [d.ref_code, d.donor_name || "", d.donor_email || "", d.donor_phone || "", d.amount, d.currency, d.payment_method || "", d.payment_status, classifyDonationSource(d), d.ad_campaigns?.name || "", d.utm_source || "", d.utm_medium || "", d.utm_campaign || "", d.created_at]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `alyusr-donations-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-4">
        {/* Stats first */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          <StatCard accent label={lang === "ar" ? "المجموع المدفوع" : "Paid total"} value={fmtEGP(totals.total)} sub="EGP" />
          <StatCard label={lang === "ar" ? "إجمالي قبل الاسترجاع" : "Gross (incl. refunded)"} value={fmtEGP(totals.grossAmt)} sub="EGP" />
          <StatCard label={lang === "ar" ? "متوسط التبرع" : "Avg donation"} value={fmtEGP(totals.avg)} sub="EGP" />
          <StatCard label={lang === "ar" ? "العمليات" : "Operations"} value={filteredLive.length} sub={lang === "ar" ? "ضمن الفلتر" : "within filter"} />
          <StatCard label={lang === "ar" ? "مدفوعة" : "Paid"} value={totals.paid} />
          <StatCard label={lang === "ar" ? "مرتجعة / معلقة / فاشلة" : "Refunded / Pending / Failed"} value={`${totals.refunded} / ${totals.pending} / ${totals.failed}`} />
        </div>

        {/* Live Cloud donations */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-black text-primary">
              {lang === "ar" ? `تبرعات Cloud الحية (${filteredLive.length}/${live.length})` : `Live cloud donations (${filteredLive.length}/${live.length})`}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Input placeholder={lang === "ar" ? "بحث: كود/اسم/إيميل/جوال" : "Search: ref/name/email/phone"} value={liveQ}
                onChange={(e) => setLiveQ(e.target.value)}
                className="h-8 w-40 text-xs" />
              <select value={liveStatus} onChange={(e) => setLiveStatus(e.target.value as any)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs font-bold">
                <option value="all">{lang === "ar" ? "كل الحالات" : "All statuses"}</option>
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="failed">failed</option>
                <option value="refunded">refunded</option>
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as any)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs font-bold"
                title={lang === "ar" ? "تصنيف المصدر بناءً على UTM/الحملة" : "Source classification based on UTM/campaign"}>
                <option value="all">{lang === "ar" ? `كل المصادر (${live.length})` : `All sources (${live.length})`}</option>
                <option value="paid">{lang === "ar" ? `إعلان مدفوع (${sourceCounts.paid})` : `Paid ad (${sourceCounts.paid})`}</option>
                <option value="organic">{lang === "ar" ? `Organic (${sourceCounts.organic})` : `Organic (${sourceCounts.organic})`}</option>
              </select>
              <select value={liveMethod} onChange={(e) => setLiveMethod(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs font-bold">
                <option value="all">{lang === "ar" ? "كل الطرق" : "All methods"}</option>
                <option value="paymob">Paymob</option>
                <option value="vodafone">Vodafone</option>
                <option value="instapay">InstaPay</option>
                <option value="bank">Bank</option>
              </select>
              <Button size="sm" variant="outline" onClick={() => setShowFilters((v) => !v)}>
                <Filter className="h-3.5 w-3.5" /> {lang === "ar" ? "فلاتر" : "Filters"}
              </Button>
              <Link to="/admin/donations/audit"
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-secondary/15 px-2 text-xs font-black text-primary hover:bg-secondary/25">
                {lang === "ar" ? "تدقيق UTM" : "UTM audit"}
              </Link>
              <Button size="sm" variant="outline" onClick={reloadLive} disabled={loadingLive}>
                {loadingLive ? "…" : (lang === "ar" ? "تحديث" : "Refresh")}
              </Button>
              <Button size="sm" variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-3.5 w-3.5" /> {lang === "ar" ? "تصفير" : "Reset"}
              </Button>
              <Button size="sm" variant="outline" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </div>
          {showFilters && (
            <div className="mb-3 grid gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
              <label className="space-y-1">
                <span className="font-bold text-muted-foreground">{lang === "ar" ? "الحملة" : "Campaign"}</span>
                <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="h-8 w-full rounded-md border border-border bg-background px-2 font-bold">
                  <option value="all">{lang === "ar" ? "كل الحملات" : "All campaigns"}</option>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-bold text-muted-foreground">utm_source</span>
                <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} className="h-8" placeholder="facebook, google…" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-muted-foreground">utm_medium</span>
                <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} className="h-8" placeholder="cpc, social…" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-muted-foreground">{lang === "ar" ? "من تاريخ" : "From"}</span>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-muted-foreground">{lang === "ar" ? "إلى تاريخ" : "To"}</span>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8" />
              </label>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <tr>
                  {[
                    lang === "ar" ? "كود" : "Ref",
                    lang === "ar" ? "متبرع" : "Donor",
                    lang === "ar" ? "المبلغ" : "Amount",
                    lang === "ar" ? "طريقة" : "Method",
                    lang === "ar" ? "الحملة / UTM" : "Campaign / UTM",
                    lang === "ar" ? "الحالة" : "Status",
                    lang === "ar" ? "التاريخ" : "Date",
                    "",
                  ].map((h, i) => (
                    <th key={i} className="px-2 py-2 text-start">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((d) => {
                  const allowed = DONATION_STATUS_TRANSITIONS[d.payment_status as DonationStatus] || [];
                  const camp = d.ad_campaigns;
                  return (
                    <tr key={d.id} className="border-t border-border/60">
                      <td className="px-2 py-2 font-mono">{d.ref_code}</td>
                      <td className="px-2 py-2 font-bold">{d.donor_name || "—"}<div className="text-[10px] font-normal text-muted-foreground" dir="ltr">{d.donor_email || d.donor_phone || "—"}</div></td>
                      <td className="px-2 py-2 font-extrabold whitespace-nowrap">{Number(d.amount).toLocaleString()} {d.currency}</td>
                      <td className="px-2 py-2 capitalize">{d.payment_method || "—"}</td>
                      <td className="px-2 py-2">
                        {camp ? (
                          <div className="font-bold text-primary">{camp.name}</div>
                        ) : (d.utm_campaign || d.utm_source) ? (
                          <div className="font-bold">{d.utm_campaign || "—"}</div>
                        ) : <span className="text-muted-foreground">—</span>}
                        {(d.utm_source || d.utm_medium) && (
                          <div className="text-[10px] font-normal text-muted-foreground" dir="ltr">
                            {d.utm_source || "?"} / {d.utm_medium || "?"}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-0.5 font-bold ${STATUS_TONE[d.payment_status] || "bg-muted"}`}>{d.payment_status}</span>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="px-2 py-2 text-end">
                        <div className="flex flex-wrap justify-end gap-1">
                          {allowed.map((next) => (
                            <button key={next} onClick={() => transition(d.id, d.payment_status, next)}
                              className="rounded-md bg-secondary/20 px-2 py-1 text-[10px] font-black text-primary hover:bg-secondary/30">
                              → {next}
                            </button>
                          ))}
                          <Link to={`/admin/donations/${d.id}`} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-black text-primary hover:bg-primary/20" title="Details">
                            <ExternalLink className="h-3 w-3" />{lang === "ar" ? "تفاصيل" : "Details"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLive.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">{loadingLive ? "…" : (lang === "ar" ? "لا توجد تبرعات بهذه الفلاتر" : "No donations match filters")}</td></tr>
                )}
              </tbody>
              {filteredLive.length > 0 && (
                <tfoot className="border-t-2 border-border bg-muted/30 text-xs font-black text-primary">
                  <tr>
                    <td className="px-2 py-2" colSpan={2}>
                      {lang === "ar" ? `إجمالي ${filteredLive.length} عملية` : `Total ${filteredLive.length} ops`}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap" title={lang === "ar" ? "مجموع المدفوع فقط" : "Paid only"}>
                      {totals.total.toLocaleString("en-US")} EGP
                    </td>
                    <td className="px-2 py-2 text-muted-foreground" colSpan={5}>
                      {lang === "ar"
                        ? `مرتجع: ${totals.refundedAmt.toLocaleString("en-US")} EGP · إجمالي قبل الاسترجاع: ${totals.grossAmt.toLocaleString("en-US")} EGP`
                        : `Refunded: ${totals.refundedAmt.toLocaleString("en-US")} EGP · Gross: ${totals.grossAmt.toLocaleString("en-US")} EGP`}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Manual transfers awaiting confirmation */}
        {pending.length > 0 && (
          <div className="rounded-2xl border-2 border-secondary/40 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-primary">
                {lang === "ar" ? `تحويلات بانتظار الاعتماد (${pending.length})` : `Manual transfers awaiting approval (${pending.length})`}
              </h2>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    {[lang === "ar" ? "كود" : "Ref", lang === "ar" ? "متبرع" : "Donor",
                      lang === "ar" ? "مبلغ" : "Amount", lang === "ar" ? "طريقة" : "Method",
                      lang === "ar" ? "إيصال" : "Receipt", ""].map((h) => (
                      <th key={h} className="px-2 py-2 text-start">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((d) => (
                    <tr key={d.ref} className="border-t border-border/60">
                      <td className="px-2 py-2 font-mono">{d.ref}</td>
                      <td className="px-2 py-2 font-bold">
                        {d.donor.name}
                        <div className="text-[10px] font-normal text-muted-foreground">{d.donor.phone}</div>
                      </td>
                      <td className="px-2 py-2 font-extrabold">{d.amount} EGP</td>
                      <td className="px-2 py-2 capitalize">{d.method}</td>
                      <td className="px-2 py-2">
                        {d.receiptDataUrl ? (
                          <button onClick={() => setPreview(d)}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary/15 px-2 py-1 font-extrabold text-primary hover:bg-secondary/25">
                            <FileImage className="h-3.5 w-3.5" />{lang === "ar" ? "عرض" : "View"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">{lang === "ar" ? "لا يوجد" : "—"}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-end">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => approve(d.ref)}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[10px] font-black text-secondary-foreground hover:opacity-90">
                            <CheckCircle2 className="h-3 w-3" />{lang === "ar" ? "اعتماد" : "Approve"}
                          </button>
                          <button onClick={() => reject(d.ref)}
                            className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-1 text-[10px] font-black text-destructive hover:bg-destructive/25">
                            <XCircle className="h-3 w-3" />{lang === "ar" ? "رفض" : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Receipt preview modal */}
        {preview && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPreview(null)}>
            <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-card p-4 shadow-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-primary">{preview.ref} — {preview.donor.name}</h3>
                <button onClick={() => setPreview(null)} className="rounded-md bg-muted px-2 py-1 text-xs font-bold">✕</button>
              </div>
              {preview.receiptDataUrl?.startsWith("data:application/pdf") ? (
                <iframe src={preview.receiptDataUrl} title="receipt" className="mt-3 h-[70vh] w-full rounded-lg border" />
              ) : (
                <LazyImage src={preview.receiptDataUrl} alt="receipt" wrapperClassName="mt-3 w-full rounded-lg" />
              )}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { reject(preview.ref); setPreview(null); }}>
                  <XCircle className="h-4 w-4" />{lang === "ar" ? "رفض" : "Reject"}
                </Button>
                <Button size="sm" className="bg-orange-grad text-accent-foreground" onClick={() => { approve(preview.ref); setPreview(null); }}>
                  <CheckCircle2 className="h-4 w-4" />{lang === "ar" ? "اعتماد التبرع" : "Approve donation"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* pagination */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-card px-4 py-2.5 text-xs shadow-soft">
          <span className="text-muted-foreground">
            {lang === "ar" ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4" /> CSV
            </Button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="grid h-8 w-8 place-items-center rounded-md border border-border disabled:opacity-40">
              <ChevronLeft className="h-4 w-4 rtl:hidden" /><ChevronRight className="h-4 w-4 ltr:hidden" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="grid h-8 w-8 place-items-center rounded-md border border-border disabled:opacity-40">
              <ChevronRight className="h-4 w-4 rtl:hidden" /><ChevronLeft className="h-4 w-4 ltr:hidden" />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDonations;