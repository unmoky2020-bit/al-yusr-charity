import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, Filter as FilterIcon } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { formatNumberEN } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useLang } from "@/i18n/LangContext";
import { donationsApiV1 } from "@/data/laravelApi";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type Campaign = {
  id: string; slug: string; name: string; status: string; channel: string;
  utm_source: string; utm_medium: string; utm_campaign: string;
  budget_egp: number; spend_egp: number;
};
type Donation = {
  id: string; ref_code: string; amount: number; payment_status: string;
  donor_name: string | null; donor_email: string | null; donor_phone: string | null;
  campaign_id: string | null; created_at: string;
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
  utm_term: string | null; utm_content: string | null;
};

const PAGE_SIZE = 25;

const ChartCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-2xl bg-card p-3 shadow-soft">
    <p className="mb-2 text-[11px] font-extrabold uppercase text-muted-foreground">{title}</p>
    {children}
  </div>
);

export default function AdminCampaignResults() {
  const { lang } = useLang(); const isAr = lang === "ar";
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rows, setRows] = useState<Donation[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [campaignId, setCampaignId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  const loadCampaigns = async () => {
    setCampaigns([]);
  };

  const reload = async () => {
    setLoading(true);
    try {
      const lDonations = await donationsApiV1.listAll();
      let mapped: Donation[] = (lDonations || []).map((d: any) => ({
        id: String(d.id),
        ref_code: d.reference_code || d.code || `DON-${d.id}`,
        amount: Number(d.amount || 0),
        payment_status: d.status || d.payment_status || "paid",
        donor_name: d.donor_name || d.donor?.name || "متبرع",
        donor_email: d.donor_email || d.donor?.email || null,
        donor_phone: d.donor_phone || d.donor?.phone || null,
        campaign_id: null,
        created_at: d.created_at || new Date().toISOString(),
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
      }));

      if (status !== "all") mapped = mapped.filter(r => r.payment_status === status);
      if (utmSource.trim()) mapped = mapped.filter(r => (r.utm_source || "").toLowerCase().includes(utmSource.trim().toLowerCase()));
      if (utmMedium.trim()) mapped = mapped.filter(r => (r.utm_medium || "").toLowerCase().includes(utmMedium.trim().toLowerCase()));
      if (utmCampaign.trim()) mapped = mapped.filter(r => (r.utm_campaign || "").toLowerCase().includes(utmCampaign.trim().toLowerCase()));

      setCount(mapped.length);
      const from = page * PAGE_SIZE;
      setRows(mapped.slice(from, from + PAGE_SIZE));
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadCampaigns(); }, []);
  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [campaignId, status, page]);

  const totals = useMemo(() => {
    const paid = rows.filter(r => r.payment_status === "paid");
    const sumPaid = paid.reduce((s, r) => s + Number(r.amount || 0), 0);
    return { count, paid: paid.length, raised: sumPaid };
  }, [rows, count]);

  const campMap = useMemo(() => {
    const m = new Map<string, Campaign>(); campaigns.forEach(c => m.set(c.id, c)); return m;
  }, [campaigns]);

  const charts = useMemo(() => {
    const byStatus = new Map<string, number>();
    const bySource = new Map<string, number>();
    const byMedium = new Map<string, number>();
    const byCampaign = new Map<string, number>();
    rows.forEach(r => {
      const amt = r.payment_status === "paid" ? Number(r.amount || 0) : 0;
      byStatus.set(r.payment_status, (byStatus.get(r.payment_status) || 0) + Number(r.amount || 0));
      if (amt > 0) {
        bySource.set(r.utm_source || "(none)", (bySource.get(r.utm_source || "(none)") || 0) + amt);
        byMedium.set(r.utm_medium || "(none)", (byMedium.get(r.utm_medium || "(none)") || 0) + amt);
        const k = r.campaign_id ? (campMap.get(r.campaign_id)?.name || r.campaign_id.slice(0, 8)) : "(direct)";
        byCampaign.set(k, (byCampaign.get(k) || 0) + amt);
      }
    });
    const toArr = (m: Map<string, number>) => Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    return { status: toArr(byStatus), source: toArr(bySource), medium: toArr(byMedium), campaign: toArr(byCampaign) };
  }, [rows, campMap]);

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  const exportCsv = () => {
    const headers = ["ref","amount","status","donor","campaign","utm_source","utm_medium","utm_campaign","utm_term","utm_content","created_at"];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")].concat(rows.map(r => [
      r.ref_code, r.amount, r.payment_status, r.donor_name || r.donor_email || r.donor_phone || "",
      r.campaign_id ? (campMap.get(r.campaign_id)?.name || r.campaign_id) : "",
      r.utm_source || "", r.utm_medium || "", r.utm_campaign || "", r.utm_term || "", r.utm_content || "",
      r.created_at,
    ].map(esc).join(",")));
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `campaign-results-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <AdminLayout>
      <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/ad-campaigns"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
            </Button>
            <div>
              <h1 className="text-base font-extrabold text-primary md:text-lg">{isAr ? "نتائج الحملات الإعلانية" : "Ad campaign results"}</h1>
              <p className="text-[11px] text-muted-foreground">{isAr ? "تبرعات حسب utm_* وcampaign_id" : "Donations by utm_* and campaign_id"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setPage(0); void reload(); }} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />{isAr ? "تحديث" : "Refresh"}
            </Button>
            <Button onClick={exportCsv} size="sm" className="bg-orange-grad text-accent-foreground">CSV</Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard accent label={isAr ? "إجمالي التبرعات (مطابقة)" : "Donations (matching)"} value={formatNumberEN(totals.count)} />
          <StatCard label={isAr ? "تبرعات مدفوعة (في الصفحة)" : "Paid (this page)"} value={formatNumberEN(totals.paid)} />
          <StatCard label={isAr ? "تم جمعه (في الصفحة)" : "Raised (this page)"} value={`${formatNumberEN(totals.raised)} EGP`} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ChartCard title={isAr ? "حسب الحملة (المدفوع)" : "By campaign (paid)"}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.campaign} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `${formatNumberEN(Number(v))} EGP`} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={isAr ? "حسب حالة الدفع (الإجمالي)" : "By payment status (total)"}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={charts.status} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {charts.status.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${formatNumberEN(Number(v))} EGP`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="utm_source (paid)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.source}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => `${formatNumberEN(Number(v))} EGP`} />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="utm_medium (paid)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.medium}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} EGP`} />
                <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-primary"><FilterIcon className="h-3.5 w-3.5" />{isAr ? "تصفية" : "Filters"}</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-[11px]">{isAr ? "الحملة" : "Campaign"}</Label>
              <Select value={campaignId} onValueChange={(v) => { setPage(0); setCampaignId(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل الحملات" : "All campaigns"}</SelectItem>
                  {campaigns.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">{isAr ? "حالة الدفع" : "Status"}</Label>
              <Select value={status} onValueChange={(v) => { setPage(0); setStatus(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="paid">paid</SelectItem>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="failed">failed</SelectItem>
                  <SelectItem value="refunded">refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-[11px]">utm_source</Label><Input dir="ltr" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} /></div>
            <div><Label className="text-[11px]">utm_medium</Label><Input dir="ltr" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} /></div>
            <div><Label className="text-[11px]">utm_campaign</Label><Input dir="ltr" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} /></div>
            <div><Label className="text-[11px]">utm_term</Label><Input dir="ltr" value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} /></div>
            <div><Label className="text-[11px]">utm_content</Label><Input dir="ltr" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} /></div>
            <div className="flex items-end">
              <Button size="sm" className="w-full" onClick={() => { setPage(0); void reload(); }}>
                {isAr ? "تطبيق" : "Apply"}
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{isAr ? "الكود" : "Ref"}</TableHead>
                  <TableHead className="text-start">{isAr ? "المبلغ" : "Amount"}</TableHead>
                  <TableHead className="text-start">{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-start">{isAr ? "المتبرع" : "Donor"}</TableHead>
                  <TableHead className="text-start">{isAr ? "الحملة" : "Campaign"}</TableHead>
                  <TableHead className="text-start">utm</TableHead>
                  <TableHead className="text-start">{isAr ? "التاريخ" : "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-[11px]">{r.ref_code}</TableCell>
                    <TableCell className="font-bold" dir="ltr">{Number(r.amount).toLocaleString()} EGP</TableCell>
                    <TableCell><span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${r.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : r.payment_status === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{r.payment_status}</span></TableCell>
                    <TableCell className="text-xs">{r.donor_name || r.donor_email || r.donor_phone || "—"}</TableCell>
                    <TableCell className="text-xs">{r.campaign_id ? (campMap.get(r.campaign_id)?.name || <span className="font-mono text-[10px] text-muted-foreground">{r.campaign_id.slice(0, 8)}</span>) : "—"}</TableCell>
                    <TableCell className="text-[11px]" dir="ltr">
                      {[r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(" / ") || "—"}
                      {(r.utm_term || r.utm_content) && (
                        <div className="text-[10px] text-muted-foreground">{[r.utm_term, r.utm_content].filter(Boolean).join(" · ")}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground" dir="ltr">{new Date(r.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-between border-t border-border/60 p-3 text-xs">
            <span className="text-muted-foreground">{isAr ? `صفحة ${page + 1} من ${totalPages} · ${count} نتيجة` : `Page ${page + 1} of ${totalPages} · ${count} results`}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>{isAr ? "السابق" : "Prev"}</Button>
              <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>{isAr ? "التالي" : "Next"}</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}