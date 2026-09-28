import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Phone, Mail, MapPin, Heart } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LangContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Profile = {
  id: string; full_name: string; phone: string | null; city: string | null;
  avatar_url: string | null; bio: string | null;
  preferred_program: string | null;
  donations_count: number; total_donated: number;
  created_at: string;
};
type Donation = {
  id: string; ref_code: string; amount: number; currency: string;
  payment_method: string | null; payment_status: string;
  case_id: string | null; created_at: string; message: string | null;
};

export default function AdminDonorDetail() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          const { data: p, error: pe } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
          if (pe) throw pe;
          setProfile(p as any);
          const { data: d, error: de } = await supabase.from("donations")
            .select("id,ref_code,amount,currency,payment_method,payment_status,case_id,created_at,message")
            .eq("donor_id", id).order("created_at", { ascending: false });
          if (de) throw de;
          setDonations((d as any) || []);
          const withEmail = (d as any[])?.find(x => (x as any).donor_email);
          if (withEmail) setEmail((withEmail as any).donor_email);
        } else {
          // Laravel numeric user ID
          try {
            const res = await apiFetch<{ data?: any }>(`/users/${id}`);
            if (res?.data) {
              setProfile({
                id: String(res.data.id),
                full_name: res.data.name || res.data.full_name || "متبرع",
                phone: res.data.phone || "",
                city: res.data.city || "",
                avatar_url: res.data.avatar || null,
                role: res.data.role || "donor",
              } as any);
              setEmail(res.data.email || "");
            }
          } catch {
            // fallback profile object for numeric ID
            setProfile({
              id: String(id),
              full_name: `متبرع #${id}`,
              role: "donor",
            } as any);
          }
        }
      } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <AdminLayout><div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AdminLayout>;
  if (!profile) return <AdminLayout><div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground">{isAr ? "غير موجود" : "Not found"}</div></AdminLayout>;

  const totalPaid = donations.filter(d => d.payment_status === "paid").reduce((s, d) => s + Number(d.amount || 0), 0);
  const lastDate = donations[0]?.created_at;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <Link to="/admin/donors" className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/80"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-lg font-black text-secondary">
                {(profile.full_name || "?").charAt(0)}
              </div>
              <div>
                <h1 className="text-lg font-black text-primary">{profile.full_name || "—"}</h1>
                <p className="font-mono text-[11px] text-muted-foreground">{profile.id.slice(0, 8)}…</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={isAr ? "إجمالي مدفوع" : "Total paid"} value={`${totalPaid.toLocaleString()} EGP`} />
          <StatCard label={isAr ? "إجمالي محصور" : "Profile total"} value={`${(profile.total_donated || 0).toLocaleString()} EGP`} />
          <StatCard label={isAr ? "عدد التبرعات" : "Donations"} value={donations.length} sub={`${profile.donations_count || 0} ${isAr ? "محصور" : "tracked"}`} />
          <StatCard label={isAr ? "آخر تبرع" : "Last donation"} value={lastDate ? new Date(lastDate).toLocaleDateString() : "—"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <aside className="rounded-2xl bg-card p-4 shadow-soft">
            <h2 className="mb-3 text-sm font-black text-primary">{isAr ? "بيانات التواصل" : "Contact"}</h2>
            <ul className="space-y-2 text-sm">
              {profile.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${profile.phone}`} className="font-bold" dir="ltr">{profile.phone}</a></li>}
              {email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span dir="ltr">{email}</span></li>}
              {profile.city && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{profile.city}</span></li>}
              {profile.preferred_program && <li className="flex items-center gap-2"><Heart className="h-4 w-4 text-muted-foreground" /><span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-bold text-primary">{profile.preferred_program}</span></li>}
            </ul>
            {profile.bio && <p className="mt-3 rounded-xl bg-muted/30 p-2.5 text-xs leading-relaxed">{profile.bio}</p>}
            <p className="mt-3 text-[10px] text-muted-foreground">{isAr ? "انضم في" : "Joined"} {new Date(profile.created_at).toLocaleDateString()}</p>
          </aside>

          <section className="lg:col-span-2 rounded-2xl bg-card p-4 shadow-soft">
            <h2 className="mb-3 text-sm font-black text-primary">{isAr ? `تبرعات (${donations.length})` : `Donations (${donations.length})`}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <tr>{["Ref", isAr?"المبلغ":"Amount", isAr?"الطريقة":"Method", isAr?"الحالة":"Status", isAr?"التاريخ":"Date", ""].map(h => <th key={h} className="px-2 py-2 text-start">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {donations.map(d => (
                    <tr key={d.id} className="border-t border-border/60">
                      <td className="px-2 py-2 font-mono">{d.ref_code}</td>
                      <td className="px-2 py-2 font-extrabold">{Number(d.amount).toLocaleString()} {d.currency}</td>
                      <td className="px-2 py-2 capitalize">{d.payment_method || "—"}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          d.payment_status === "paid" ? "bg-primary/15 text-primary" :
                          d.payment_status === "pending" ? "bg-accent/15 text-accent" :
                          "bg-destructive/10 text-destructive"
                        }`}>{d.payment_status}</span>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="px-2 py-2 text-end">
                        <Link to={`/admin/donations/${d.id}`} className="rounded bg-muted px-2 py-1 text-[10px] font-bold hover:bg-muted/70">{isAr ? "تفاصيل" : "Details"}</Link>
                      </td>
                    </tr>
                  ))}
                  {donations.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{isAr ? "لا تبرعات" : "No donations"}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}