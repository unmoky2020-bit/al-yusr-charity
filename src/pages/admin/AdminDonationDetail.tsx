import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Copy } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LangContext";

import { toast } from "@/hooks/use-toast";
import { DONATION_STATUS_TRANSITIONS, updateDonationStatus, type DonationStatus } from "@/data/casesApi";

export default function AdminDonationDetail() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [tx, setTx] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Use Laravel donations API
      const { listAllDonations } = await import("@/data/casesApi");
      const all = await listAllDonations();
      const d = (all as any[]).find((x) => String(x.id) === String(id));
      if (!d) { toast({ title: isAr ? "غير موجود" : "Not found", variant: "destructive" }); nav("/admin/donations"); return; }
      setRow(d);
      setCampaign(null); // ad_campaigns removed
      setTx([]);         // payment_transactions removed (Supabase)
      setWebhooks([]);   // payment_webhooks removed (Supabase)
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [id]);


  const transition = async (next: DonationStatus) => {
    if (!row) return;
    try { await updateDonationStatus(row.id, next); toast({ title: isAr ? "تم التحديث" : "Updated" }); void reload(); }
    catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
  };

  const copy = async (s: string) => { try { await navigator.clipboard.writeText(s); toast({ title: isAr ? "نسخ" : "Copied" }); } catch {} };

  if (loading || !row) return <AdminLayout><div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AdminLayout>;

  const allowed = DONATION_STATUS_TRANSITIONS[row.payment_status as DonationStatus] || [];
  const publicHref = row.cases?.ref_code ? `/cases/${row.cases.ref_code}` : (row.case_categories?.slug ? `/programs/${row.case_categories.slug}` : null);
  const hasUtm = !!(row.utm_source || row.utm_medium || row.utm_campaign || row.utm_term || row.utm_content);

  return (
    <AdminLayout>
      <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin/donations" className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/80"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{row.ref_code}</span>
                <button onClick={() => copy(row.ref_code)} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
              </div>
              <h1 className="text-lg font-black text-primary">{Number(row.amount).toLocaleString()} {row.currency}</h1>
            </div>
          </div>
          {publicHref && (
            <a href={publicHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-secondary/20 px-3 py-1.5 text-xs font-extrabold text-primary hover:bg-secondary/30">
              <ExternalLink className="h-3.5 w-3.5" />{isAr ? "معاينة عامة" : "Public preview"}
            </a>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={isAr ? "الحالة" : "Status"} value={row.payment_status} />
          <StatCard label={isAr ? "الطريقة" : "Method"} value={row.payment_method || "—"} />
          <StatCard label={isAr ? "العملة" : "Currency"} value={row.currency} />
          <StatCard label={isAr ? "التاريخ" : "Date"} value={new Date(row.created_at).toLocaleDateString()} />
        </div>

        {allowed.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-soft">
            <span className="text-xs font-bold text-muted-foreground">{isAr ? "تغيير الحالة:" : "Transition to:"}</span>
            {allowed.map(next => (
              <button key={next} onClick={() => transition(next)} className="rounded-md bg-secondary/20 px-3 py-1 text-xs font-extrabold text-primary hover:bg-secondary/30">→ {next}</button>
            ))}
          </div>
        )}

        {(campaign || hasUtm) && (
          <section className="rounded-2xl bg-card p-4 shadow-soft">
            <h2 className="mb-3 text-sm font-black text-primary">{isAr ? "الحملة وتتبّع UTM" : "Campaign & UTM"}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {campaign ? (
                <div className="rounded-xl bg-muted/30 p-3 text-sm">
                  <p className="text-[11px] font-bold text-muted-foreground">{isAr ? "حملة إعلانية" : "Ad campaign"}</p>
                  <Link to="/admin/ad-campaigns" className="font-extrabold text-primary hover:underline">{campaign.name}</Link>
                  <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">/{campaign.slug} · {campaign.channel} · {campaign.status}</p>
                  {campaign.program_slug && (
                    <a href={`/programs/${campaign.program_slug}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-accent hover:underline">
                      <ExternalLink className="h-3 w-3" />{isAr ? "البرنامج المرتبط" : "Linked program"}
                    </a>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">{isAr ? "لا توجد حملة مرتبطة" : "No linked campaign"}</div>
              )}
              <div className="rounded-xl bg-muted/30 p-3 text-xs" dir="ltr">
                <Row label="utm_source" value={row.utm_source || "—"} ltr />
                <Row label="utm_medium" value={row.utm_medium || "—"} ltr />
                <Row label="utm_campaign" value={row.utm_campaign || "—"} ltr />
                <Row label="utm_term" value={row.utm_term || "—"} ltr />
                <Row label="utm_content" value={row.utm_content || "—"} ltr />
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl bg-card p-4 shadow-soft">
            <h2 className="mb-3 text-sm font-black text-primary">{isAr ? "بيانات المتبرع" : "Donor"}</h2>
            <dl className="space-y-1.5 text-sm">
              <Row label={isAr ? "الاسم" : "Name"} value={row.donor_name || "—"} />
              <Row label={isAr ? "البريد" : "Email"} value={row.donor_email || "—"} ltr />
              <Row label={isAr ? "الهاتف" : "Phone"} value={row.donor_phone || "—"} ltr />
              {row.donor_id && <Row label="ID" value={<Link to={`/admin/donors/${row.donor_id}`} className="font-mono text-primary hover:underline">{row.donor_id.slice(0,8)}…</Link>} />}
              {row.message && <div className="mt-2 rounded-xl bg-muted/30 p-2.5 text-xs">{row.message}</div>}
            </dl>
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-soft">
            <h2 className="mb-3 text-sm font-black text-primary">{isAr ? "الوجهة" : "Destination"}</h2>
            {row.cases ? (
              <div className="flex items-center gap-3">
                {row.cases.cover_image_url && <img src={row.cases.cover_image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-muted-foreground">{row.cases.ref_code}</p>
                  <Link to={`/admin/cases/${row.cases.id}`} className="truncate font-extrabold text-primary hover:underline">{row.cases.title}</Link>
                </div>
              </div>
            ) : row.case_categories ? (
              <div>
                <p className="text-[11px] font-bold text-muted-foreground">{isAr ? "فئة" : "Category"}</p>
                <p className="font-extrabold text-primary">{isAr ? row.case_categories.name_ar : row.case_categories.name_en}</p>
              </div>
            ) : <p className="text-xs text-muted-foreground">{isAr ? "تبرع عام" : "General"}</p>}
          </section>
        </div>

        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <h2 className="mb-3 text-sm font-black text-primary">{isAr ? `معاملات الدفع (${tx.length})` : `Payment transactions (${tx.length})`}</h2>
          {tx.length === 0 ? <p className="py-3 text-center text-xs text-muted-foreground">{isAr ? "لا معاملات" : "No transactions"}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] font-extrabold uppercase text-muted-foreground"><tr>{["Ref","Provider","Method","Status","Order","Txn","Date"].map(h => <th key={h} className="px-2 py-1.5 text-start">{h}</th>)}</tr></thead>
              <tbody>
                {tx.map(t => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="px-2 py-1.5 font-mono">{t.ref_code}</td>
                    <td className="px-2 py-1.5">{t.provider}</td>
                    <td className="px-2 py-1.5">{t.method || "—"}</td>
                    <td className="px-2 py-1.5"><span className="rounded-full bg-muted px-2 py-0.5 font-bold">{t.status}</span></td>
                    <td className="px-2 py-1.5 font-mono">{t.provider_order_id || "—"}</td>
                    <td className="px-2 py-1.5 font-mono">{t.provider_txn_id || "—"}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>)}
        </section>

        {webhooks.length > 0 && (
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <h2 className="mb-3 text-sm font-black text-primary">{isAr ? `سجل الويبهوكس (${webhooks.length})` : `Webhook log (${webhooks.length})`}</h2>
          <div className="space-y-1.5">
            {webhooks.map(w => (
              <div key={w.id} className="rounded-md bg-muted/30 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{w.event_type || "event"}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{w.signature_valid ? "✓ valid" : "✗ invalid"} · {w.processed ? "processed" : "pending"}</div>
              </div>
            ))}
          </div>
        </section>
        )}
      </div>
    </AdminLayout>
  );
}

const Row = ({ label, value, ltr }: { label: string; value: React.ReactNode; ltr?: boolean }) => (
  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-end font-bold" dir={ltr ? "ltr" : undefined}>{value}</span>
  </div>
);