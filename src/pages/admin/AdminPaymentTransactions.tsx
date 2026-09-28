import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, ExternalLink, Save } from "lucide-react";

type Tx = {
  id: string;
  ref_code: string;
  status: string;
  amount: number;
  currency: string;
  method: string | null;
  provider: string;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  redirect_url: string | null;
  internal_notes: string | null;
  retry_count: number;
  last_error: string | null;
  created_at: string;
};

const STATUSES = ["all", "pending", "processing", "paid", "failed", "refunded"];
const CHANNELS = ["all", "card", "wallet", "instapay", "bank"];

export default function AdminPaymentTransactions() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    let query = (supabase.from("payment_transactions" as any) as any)
      .select("*").order("created_at", { ascending: false }).limit(200);
    if (status !== "all") query = query.eq("status", status);
    if (channel !== "all") query = query.eq("method", channel);
    if (q) query = query.or(`ref_code.ilike.%${q}%,donor_phone.ilike.%${q}%,donor_email.ilike.%${q}%`);
    const { data } = await query;
    setRows(((data as any) || []) as Tx[]);
    setLoading(false);
  };
  useEffect(() => { void reload(); }, [status, channel]);

  const saveNotes = async (tx: Tx) => {
    const value = editing[tx.id] ?? tx.internal_notes ?? "";
    const { error } = await (supabase.from("payment_transactions" as any) as any)
      .update({ internal_notes: value }).eq("id", tx.id);
    toast({ title: error ? "فشل الحفظ" : "تم حفظ الملاحظة" });
    if (!error) reload();
  };

  const retry = async (tx: Tx) => {
    const { data, error } = await supabase.functions.invoke("paymob-create-payment", {
      body: {
        amount: tx.amount,
        method: tx.method === "wallet" ? "wallet" : "card",
        donor: { name: tx.donor_name, email: tx.donor_email, phone: tx.donor_phone },
        wallet_phone: tx.donor_phone,
      },
    });
    if (error || !data?.redirect_url) {
      toast({ title: "فشلت إعادة المحاولة", description: error?.message || "حاول لاحقًا" });
      return;
    }
    await (supabase.from("payment_transactions" as any) as any)
      .update({ retry_count: (tx.retry_count || 0) + 1 }).eq("id", tx.id);
    window.open(data.redirect_url, "_blank");
    reload();
  };

  const statusColor = (s: string) =>
    s === "paid" ? "bg-secondary/30 text-primary"
    : s === "failed" ? "bg-destructive/20 text-destructive"
    : s === "refunded" ? "bg-muted text-muted-foreground"
    : "bg-accent/20 text-accent";

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-primary">معاملات الدفع</h1>
        <Button onClick={reload} variant="outline" size="sm"><RefreshCw className="h-4 w-4" /> تحديث</Button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>الحالة: {s}</option>)}
        </select>
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
          {CHANNELS.map((c) => <option key={c} value={c}>القناة: {c}</option>)}
        </select>
        <Input placeholder="بحث: مرجع/هاتف/إيميل" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && reload()} className="sm:col-span-2" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">لا توجد معاملات</div>
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="bg-muted/40 text-xs font-bold text-muted-foreground">
              <tr>
                <th className="p-3 text-start">المرجع</th>
                <th className="p-3 text-start">المتبرع</th>
                <th className="p-3 text-start">المبلغ</th>
                <th className="p-3 text-start">القناة</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-start">محاولات</th>
                <th className="p-3 text-start">ملاحظات داخلية</th>
                <th className="p-3 text-start">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((tx) => (
                <tr key={tx.id} className="align-top">
                  <td className="p-3">
                    <Link to={`/donate/status/${tx.ref_code}`} className="font-extrabold text-primary hover:underline" dir="ltr">{tx.ref_code}</Link>
                    <div className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-primary">{tx.donor_name || "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{tx.donor_phone}</div>
                  </td>
                  <td className="p-3 font-extrabold">{Number(tx.amount).toLocaleString()} {tx.currency}</td>
                  <td className="p-3 text-xs">{tx.provider}<br /><span className="text-muted-foreground">{tx.method || "—"}</span></td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${statusColor(tx.status)}`}>{tx.status}</span>
                    {tx.last_error && <div className="mt-1 line-clamp-2 text-[10px] text-destructive">{tx.last_error}</div>}
                  </td>
                  <td className="p-3 text-center">{tx.retry_count}</td>
                  <td className="p-3 min-w-[200px]">
                    <Textarea
                      defaultValue={tx.internal_notes || ""}
                      onChange={(e) => setEditing((s) => ({ ...s, [tx.id]: e.target.value }))}
                      className="min-h-[60px] text-xs"
                      placeholder="…"
                    />
                    <Button size="sm" variant="outline" className="mt-1" onClick={() => saveNotes(tx)}><Save className="h-3 w-3" /> حفظ</Button>
                  </td>
                  <td className="p-3 space-y-1">
                    {(tx.status === "failed" || tx.status === "pending") && (
                      <Button size="sm" onClick={() => retry(tx)}><RefreshCw className="h-3 w-3" /> إعادة محاولة</Button>
                    )}
                    {tx.redirect_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={tx.redirect_url} target="_blank" rel="noopener"><ExternalLink className="h-3 w-3" /> فتح</a>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}