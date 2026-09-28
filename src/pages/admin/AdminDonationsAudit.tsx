import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";

import { toast } from "@/hooks/use-toast";
import { classifyDonationSource, normalizeUtm, isMeaningfulUtm } from "@/lib/donationSource";

type Row = {
  id: string;
  ref_code: string;
  created_at: string;
  amount: number;
  currency: string;
  payment_status: string;
  donor_name: string | null;
  campaign_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  ad_campaigns: { id: string; name: string; slug: string; utm_source: string | null; utm_campaign: string | null; channel: string } | null;
};

type Camp = { id: string; name: string; slug: string; utm_source: string | null; utm_campaign: string | null };

const AdminDonationsAudit = () => {
  const { lang } = useLang();
  const [rows, setRows] = useState<Row[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { listAllDonations } = await import("@/data/casesApi");
      const donations = await listAllDonations();
      setRows((donations || []) as any);
      setCamps([]); // ad_campaigns removed (Supabase removed)
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Try to match a donation's UTM to an ad_campaign by utm_campaign or slug
  const matchCampaign = (r: Row): Camp | null => {
    const uc = normalizeUtm(r.utm_campaign);
    const us = normalizeUtm(r.utm_source);
    if (!uc && !us) return null;
    return (
      camps.find((c) => uc && normalizeUtm(c.utm_campaign) === uc) ||
      camps.find((c) => uc && normalizeUtm(c.slug) === uc) ||
      camps.find((c) => us && normalizeUtm(c.utm_source) === us && uc && normalizeUtm(c.utm_campaign) === uc) ||
      null
    );
  };

  const audited = useMemo(() => {
    return rows.map((r) => {
      const source = classifyDonationSource(r);
      const matched = matchCampaign(r);
      const issues: string[] = [];
      // 1) UTM looks like paid traffic but no campaign_id linked
      if (!r.campaign_id && (isMeaningfulUtm(r.utm_campaign) || isMeaningfulUtm(r.utm_source))) {
        issues.push(lang === "ar" ? "UTM موجود بدون ربط بحملة" : "UTM present but campaign_id is NULL");
      }
      // 2) Linked campaign but UTM doesn't match the campaign's UTM
      if (r.ad_campaigns && r.utm_campaign && normalizeUtm(r.ad_campaigns.utm_campaign) && normalizeUtm(r.ad_campaigns.utm_campaign) !== normalizeUtm(r.utm_campaign)) {
        issues.push(lang === "ar" ? "utm_campaign لا يطابق الحملة المربوطة" : "utm_campaign mismatch with linked campaign");
      }
      // 3) Donation has UTM that matches a campaign by value, but campaign_id is NULL
      if (!r.campaign_id && matched) {
        issues.push(lang === "ar" ? `قابل للربط بحملة "${matched.name}"` : `Could be linked to "${matched.name}"`);
      }
      return { row: r, source, matched, issues };
    });
  }, [rows, camps, lang]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return audited.filter((a) => {
      if (onlyIssues && a.issues.length === 0) return false;
      if (!qn) return true;
      const hay = [
        a.row.ref_code, a.row.donor_name, a.row.utm_source, a.row.utm_medium,
        a.row.utm_campaign, a.row.utm_term, a.row.utm_content, a.row.ad_campaigns?.name,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(qn);
    });
  }, [audited, q, onlyIssues]);

  const stats = useMemo(() => {
    const total = audited.length;
    const paid = audited.filter((a) => a.source === "paid").length;
    const organic = total - paid;
    const issues = audited.filter((a) => a.issues.length > 0).length;
    const linked = audited.filter((a) => a.row.campaign_id).length;
    return { total, paid, organic, issues, linked };
  }, [audited]);

  return (
    <AdminLayout>
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link to="/admin/donations" className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs font-bold hover:bg-muted">
              <ArrowLeft className="h-3.5 w-3.5" />{lang === "ar" ? "رجوع للتبرعات" : "Back to donations"}
            </Link>
            <h1 className="text-lg font-black text-primary">
              {lang === "ar" ? "تدقيق UTM والحملات" : "UTM & campaign audit"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input placeholder={lang === "ar" ? "بحث UTM/كود/متبرع" : "Search UTM/ref/donor"} value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-52 text-xs" />
            <label className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs font-bold">
              <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
              {lang === "ar" ? "إظهار المشاكل فقط" : "Issues only"}
            </label>
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              {loading ? "…" : (lang === "ar" ? "تحديث" : "Refresh")}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard accent label={lang === "ar" ? "إجمالي" : "Total"} value={stats.total} />
          <StatCard label={lang === "ar" ? "إعلان مدفوع" : "Paid ad"} value={stats.paid} />
          <StatCard label="Organic" value={stats.organic} />
          <StatCard label={lang === "ar" ? "مرتبط بحملة" : "Linked to campaign"} value={stats.linked} />
          <StatCard label={lang === "ar" ? "تحتاج مراجعة" : "Need review"} value={stats.issues} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <tr>
                  {[
                    lang === "ar" ? "كود" : "Ref",
                    lang === "ar" ? "تصنيف" : "Source",
                    lang === "ar" ? "حملة مربوطة" : "Linked campaign",
                    "utm_source",
                    "utm_medium",
                    "utm_campaign",
                    "utm_term / content",
                    lang === "ar" ? "ملاحظات التدقيق" : "Audit",
                    "",
                  ].map((h, i) => <th key={i} className="px-2 py-2 text-start whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ row: d, source, matched, issues }) => (
                  <tr key={d.id} className="border-t border-border/60 align-top">
                    <td className="px-2 py-2">
                      <div className="font-mono">{d.ref_code}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
                      <div className="text-[10px] font-bold">{d.donor_name || "—"} · {Number(d.amount).toLocaleString()} {d.currency}</div>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`rounded-full px-2 py-0.5 font-black ${source === "paid" ? "bg-secondary/25 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {source}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {d.ad_campaigns ? (
                        <div className="font-bold text-primary">
                          {d.ad_campaigns.name}
                          <div className="text-[10px] font-normal text-muted-foreground" dir="ltr">{d.ad_campaigns.slug} · {d.ad_campaigns.channel}</div>
                        </div>
                      ) : matched ? (
                        <div className="font-bold text-accent">
                          ⚠ {matched.name}
                          <div className="text-[10px] font-normal text-muted-foreground" dir="ltr">{matched.slug}</div>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-2 py-2 font-mono text-[11px]" dir="ltr">{d.utm_source || "—"}</td>
                    <td className="px-2 py-2 font-mono text-[11px]" dir="ltr">{d.utm_medium || "—"}</td>
                    <td className="px-2 py-2 font-mono text-[11px]" dir="ltr">{d.utm_campaign || "—"}</td>
                    <td className="px-2 py-2 font-mono text-[11px]" dir="ltr">{[d.utm_term, d.utm_content].filter(Boolean).join(" / ") || "—"}</td>
                    <td className="px-2 py-2">
                      {issues.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {lang === "ar" ? "سليم" : "OK"}
                        </span>
                      ) : (
                        <ul className="space-y-1">
                          {issues.map((m, i) => (
                            <li key={i} className="inline-flex items-start gap-1 text-[11px] font-bold text-destructive">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {m}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-2 py-2 text-end">
                      <Link to={`/admin/donations/${d.id}`} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-black text-primary hover:bg-primary/20">
                        <ExternalLink className="h-3 w-3" />{lang === "ar" ? "تفاصيل" : "Details"}
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">{loading ? "…" : (lang === "ar" ? "لا توجد بيانات" : "No data")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDonationsAudit;