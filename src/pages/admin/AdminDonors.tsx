import { useEffect, useMemo, useState } from "react";
import { Search, Phone, Loader2, ExternalLink, Plus, Trash2, X, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "@/hooks/use-toast";
import { donorsApi, donationsApiV1, LaravelDonor, LaravelDonation } from "@/data/laravelApi";

export interface DonorViewItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_donated: number;
  donations_count: number;
  address?: string | null;
}

const Inner = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [donors, setDonors] = useState<DonorViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDonor, setNewDonor] = useState({ name: "", email: "", phone: "" });
  const [adding, setAdding] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [lDonors, lDonations] = await Promise.all([
        donorsApi.listAll().catch(() => [] as LaravelDonor[]),
        donationsApiV1.listAll().catch(() => [] as LaravelDonation[]),
      ]);

      const donationsByDonor = new Map<string, { total: number; count: number }>();
      (lDonations || []).forEach((d: any) => {
        const donorId = String(d.donor_id || d.donor?.id || "");
        if (donorId) {
          const current = donationsByDonor.get(donorId) || { total: 0, count: 0 };
          current.total += Number(d.amount || 0);
          current.count += 1;
          donationsByDonor.set(donorId, current);
        }
      });

      const items: DonorViewItem[] = (lDonors || []).map((d: any) => {
        const dId = String(d.id);
        const stats = donationsByDonor.get(dId) || { total: 0, count: 0 };
        return {
          id: dId,
          name: d.name || "متبرع كريم",
          email: d.email || null,
          phone: d.phone || null,
          total_donated: stats.total,
          donations_count: stats.count,
          address: d.address || null,
        };
      });

      setDonors(items);
    } catch (e: any) {
      toast({ title: isAr ? "خطأ في تحميل المتبرعين" : "Failed to load donors", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => donors.filter((u) =>
    !q || u.name.toLowerCase().includes(q.toLowerCase()) ||
    (u.phone || "").includes(q) ||
    (u.email || "").toLowerCase().includes(q.toLowerCase())
  ), [donors, q]);

  const total = donors.reduce((s, u) => s + (u.total_donated || 0), 0);
  const count = donors.reduce((s, u) => s + (u.donations_count || 0), 0);
  const avg = donors.length ? Math.round(total / donors.length) : 0;

  const handleCreateDonor = async () => {
    if (!newDonor.name.trim()) {
      toast({ title: isAr ? "يرجى كتابة اسم المتبرع" : "Donor name is required", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      await donorsApi.create({
        name: newDonor.name.trim(),
        email: newDonor.email.trim() || undefined,
        phone: newDonor.phone.trim() || undefined,
      } as any);
      toast({ title: isAr ? " تم إضافة المتبرع بنجاح" : " Donor added successfully" });
      setShowAddModal(false);
      setNewDonor({ name: "", email: "", phone: "" });
      void reload();
    } catch (err: any) {
      toast({ title: isAr ? "فشل إضافة المتبرع" : "Failed to add donor", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDonor = async (id: string, name: string) => {
    if (!confirm(isAr ? `هل أنت متأكد من حذف المتبرع "${name}"؟` : `Delete donor "${name}"?`)) return;
    try {
      await donorsApi.remove(id);
      toast({ title: isAr ? " تم حذف المتبرع" : " Donor deleted" });
      void reload();
    } catch (err: any) {
      toast({ title: isAr ? "فشل الحذف" : "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout title={{ ar: "المتبرعون", en: "Donors" }}>
      <div className="space-y-4 text-start [&_input]:text-start" dir={isAr ? "rtl" : "ltr"}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard accent label={isAr ? "إجمالي المتبرعين" : "Total donors"} value={loading && !donors.length ? "—" : donors.length} />
          <StatCard label={isAr ? "إجمالي التبرعات" : "Total donated"} value={loading && !donors.length ? "—" : `${total.toLocaleString()} EGP`} />
          <StatCard label={isAr ? "عدد التبرعات" : "Donations count"} value={loading && !donors.length ? "—" : count} />
          <StatCard label={isAr ? "متوسط التبرع" : "Avg per donor"} value={loading && !donors.length ? "—" : `${avg.toLocaleString()} EGP`} />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-soft sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9 h-9" placeholder={isAr ? "بحث بالاسم أو الهاتف أو البريد…" : "Search name, phone, or email…"} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => void reload()} variant="outline" size="sm" disabled={loading} className="h-9 gap-1 font-bold">
              <Loader2 className={`h-3.5 w-3.5 ${loading ? "animate-spin" : "hidden"}`} />
              <span>{isAr ? "تحديث" : "Refresh"}</span>
            </Button>
            <Button onClick={() => setShowAddModal(true)} size="sm" className="h-9 bg-orange-grad text-accent-foreground font-bold">
              <Plus className="h-4 w-4 me-1.5" />
              {isAr ? "متبرع جديد" : "New donor"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="col-span-full rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground">
              <Loader2 className="me-2 inline h-4 w-4 animate-spin" />
              {isAr ? "جاري التحميل…" : "Loading…"}
            </div>
          )}
          {filtered.map((d) => (
            <article key={d.id} className="rounded-2xl bg-card p-4 shadow-soft border border-border/40 hover:border-primary/30 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-lg font-black text-secondary">
                    {(d.name || "?").charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold text-primary text-base">{d.name || "—"}</div>
                    {d.email && <div className="truncate text-xs text-muted-foreground flex items-center gap-1" dir="ltr"><Mail className="h-3 w-3" /> {d.email}</div>}
                  </div>
                  <button
                    onClick={() => handleDeleteDonor(d.id, d.name)}
                    className="h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    title={isAr ? "حذف المتبرع" : "Delete donor"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2.5 text-center">
                  <div>
                    <div className="text-base font-black text-primary">{(d.total_donated || 0).toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-muted-foreground">{isAr ? "ج.م مُتبرع بها" : "EGP Donated"}</div>
                  </div>
                  <div>
                    <div className="text-base font-black text-primary">{d.donations_count || 0}</div>
                    <div className="text-[10px] font-bold text-muted-foreground">{isAr ? "عملية تبرع" : "Donations"}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-border/40 text-xs">
                {d.phone ? (
                  <a href={`tel:${d.phone}`} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-bold text-foreground hover:bg-secondary/30">
                    <Phone className="h-3 w-3" /> {d.phone}
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground">{isAr ? "لا يوجد هاتف" : "No phone"}</span>
                )}
                <Link to={`/admin/donors/${d.id}`} className="inline-flex items-center gap-1 rounded-md bg-secondary/15 px-2 py-1 font-extrabold text-primary hover:bg-secondary/30">
                  <ExternalLink className="h-3 w-3" />
                  {isAr ? "تفاصيل" : "Details"}
                </Link>
              </div>
            </article>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground">
              {isAr ? "لا توجد نتائج" : "No results"}
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowAddModal(false)}>
            <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-primary">{isAr ? "إضافة متبرع جديد" : "Add New Donor"}</h3>
                <button onClick={() => setShowAddModal(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "اسم المتبرع *" : "Donor Name *"}</label>
                  <Input value={newDonor.name} onChange={(e) => setNewDonor({ ...newDonor, name: e.target.value })} placeholder={isAr ? "مثال: فاعل خير" : "e.g. Test Donor"} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "البريد الإلكتروني" : "Email Address"}</label>
                  <Input type="email" value={newDonor.email} onChange={(e) => setNewDonor({ ...newDonor, email: e.target.value })} placeholder="donor@example.com" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "رقم الهاتف" : "Phone Number"}</label>
                  <Input value={newDonor.phone} onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })} placeholder="010XXXXXXXX" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateDonor} disabled={adding} className="flex-1 bg-orange-grad text-accent-foreground font-bold">
                  {adding && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {isAr ? "حفظ وإضافة" : "Save & Add"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const AdminDonors = () => (
  <RequireAuth roles={["admin"]}><Inner /></RequireAuth>
);

export default AdminDonors;