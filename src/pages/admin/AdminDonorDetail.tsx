import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Heart,
  MessageCircle,
  ExternalLink,
  User,
  RefreshCw,
  FileText,
  X,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { donorsApi, donationsApiV1 } from "@/data/laravelApi";
import { DonationReceipt } from "@/components/common/DonationReceipt";


type DonorRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  [k: string]: any;
};

type DonationRow = {
  id: string;
  ref_code: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  notes: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  failed: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  refunded: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

export default function AdminDonorDetail() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { id } = useParams<{ id: string }>();

  const [donor, setDonor] = useState<DonorRow | null>(null);
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptRecord, setReceiptRecord] = useState<any | null>(null);

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch donor profile from Laravel
      let donorData: any = null;
      try {
        const res = await (donorsApi as any).get(id);
        donorData = (res as any)?.data ?? res;
      } catch {
        // Fallback: synthesize from donations list
      }

      // Fetch all donations and filter by donor_id
      const allDonations = await donationsApiV1.listAll().catch(() => [] as any[]);
      const donorDonations = (allDonations || []).filter(
        (d: any) => String(d.donor_id || d.donor?.id || "") === String(id)
      );

      // If donor profile fetch failed, synthesize from donation data
      if (!donorData || !donorData.id) {
        const firstDon = donorDonations[0];
        donorData = firstDon
          ? {
              id: String(id),
              name: firstDon.donor_name || firstDon.name || firstDon.donor?.name || `متبرع #${id}`,
              email: firstDon.donor_email || firstDon.email || firstDon.donor?.email || null,
              phone: firstDon.donor_phone || firstDon.phone || firstDon.donor?.phone || null,
              address: null,
              created_at: firstDon.created_at || new Date().toISOString(),
            }
          : { id: String(id), name: `متبرع #${id}`, email: null, phone: null, address: null, created_at: new Date().toISOString() };
      }

      setDonor({
        id: String(donorData.id || id),
        name: donorData.name || donorData.full_name || `متبرع #${id}`,
        email: donorData.email || null,
        phone: donorData.phone || null,
        address: donorData.address || donorData.city || null,
        created_at: donorData.created_at || new Date().toISOString(),
        ...donorData,
      });

      setDonations(
        donorDonations.map((d: any) => {
          const pm = d.payment_method;
          const methodName =
            (typeof pm === "object" ? pm?.name_ar || pm?.name_en || pm?.slug : pm) ||
            d.method || "—";
          return {
            id: String(d.id),
            ref_code: d.transaction_reference || d.reference_code || d.ref_code || d.code || `DON-${d.id}`,
            amount: Number(d.amount || 0),
            currency: d.currency || "EGP",
            payment_method: methodName,
            payment_status: (d.payment_status || d.status || "pending").toLowerCase(),
            created_at: d.created_at || new Date().toISOString(),
            notes: d.notes || d.message || null,
          };
        })
      );
    } catch (e: any) {
      toast({ title: isAr ? "خطأ في تحميل بيانات المتبرع" : "Failed to load donor", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="grid place-items-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground">
              {isAr ? "جاري تحميل بيانات المتبرع..." : "Loading donor profile..."}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!donor) {
    return (
      <AdminLayout>
        <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-soft">
          {isAr ? "المتبرع غير موجود" : "Donor not found"}
        </div>
      </AdminLayout>
    );
  }

  const totalPaid = donations
    .filter((d) => d.payment_status === "paid" || d.payment_status === "completed")
    .reduce((s, d) => s + Number(d.amount || 0), 0);
  const totalAll = donations.reduce((s, d) => s + Number(d.amount || 0), 0);
  const lastDate = donations[0]?.created_at;
  const cleanPhone = String(donor.phone || "").replace(/[^0-9]/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("01") ? "2" + cleanPhone : cleanPhone}?text=${encodeURIComponent(
        isAr
          ? `السلام عليكم أ/ ${donor.name}، نتواصل معكم من مؤسسة اليسر الخيرية. شكراً لدعمكم الكريم.`
          : `Hello ${donor.name}, we're reaching out from Al-Yusr Charity. Thank you for your generous support.`
      )}`
    : null;

  return (
    <AdminLayout>
      <div className="w-full space-y-5" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin/donors" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition">
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-2xl font-black text-secondary shadow-md">
                {(donor.name || "?").charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-black text-primary">{donor.name || "—"}</h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{isAr ? "رقم المتبرع" : "Donor ID"}: #{donor.id}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {whatsappUrl && (
              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  <span>{isAr ? "واتساب" : "WhatsApp"}</span>
                </a>
              </Button>
            )}
            {donor.phone && (
              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs font-bold">
                <a href={`tel:${donor.phone}`}><Phone className="h-4 w-4" /><span dir="ltr">{donor.phone}</span></a>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={reload} className="gap-1.5 text-xs font-bold">
              <RefreshCw className="h-3.5 w-3.5" />{isAr ? "تحديث" : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard accent label={isAr ? "إجمالي مدفوع" : "Total Paid"} value={`${totalPaid.toLocaleString()} EGP`} />
          <StatCard label={isAr ? "إجمالي التبرعات" : "All Donations"} value={`${totalAll.toLocaleString()} EGP`} />
          <StatCard label={isAr ? "عدد التبرعات" : "Count"} value={donations.length} />
          <StatCard label={isAr ? "آخر تبرع" : "Last Donation"} value={lastDate ? new Date(lastDate).toLocaleDateString(isAr ? "ar-EG" : "en-US") : "—"} />
        </div>

        {/* Content Grid */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Profile Card */}
          <aside className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-black text-primary">{isAr ? "بيانات التواصل" : "Contact Info"}</h2>
            </div>
            <ul className="space-y-3 text-sm">
              {donor.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a href={`tel:${donor.phone}`} className="font-bold text-foreground hover:text-primary hover:underline" dir="ltr">{donor.phone}</a>
                </li>
              )}
              {donor.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a href={`mailto:${donor.email}`} className="font-medium text-foreground hover:text-primary hover:underline truncate" dir="ltr">{donor.email}</a>
                </li>
              )}
              {donor.address && (
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{donor.address}</span>
                </li>
              )}
              {!donor.phone && !donor.email && !donor.address && (
                <li className="text-xs text-muted-foreground italic">{isAr ? "لا توجد بيانات تواصل مسجلة" : "No contact details on file"}</li>
              )}
            </ul>
            <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 mb-1">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                <span className="font-bold text-foreground">{isAr ? "تاريخ الانضمام" : "Member Since"}</span>
              </div>
              <span>{new Date(donor.created_at || new Date()).toLocaleDateString(isAr ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </aside>

          {/* Donations Table */}
          <section className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h2 className="text-sm font-black text-primary">
                {isAr ? `سجل التبرعات (${donations.length})` : `Donation History (${donations.length})`}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    {[isAr?"كود":"Ref", isAr?"المبلغ":"Amount", isAr?"الطريقة":"Method", isAr?"الحالة":"Status", isAr?"التاريخ":"Date", ""].map((h, i) => (
                      <th key={i} className="px-2 py-2 text-start">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id} className="border-t border-border/60 hover:bg-muted/20 transition">
                      <td className="px-2 py-2.5 font-mono text-[11px]">{d.ref_code}</td>
                      <td className="px-2 py-2.5 font-extrabold whitespace-nowrap">{Number(d.amount).toLocaleString()} {d.currency}</td>
                      <td className="px-2 py-2.5 capitalize text-muted-foreground">{d.payment_method || "—"}</td>
                      <td className="px-2 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${STATUS_COLORS[d.payment_status] || "bg-muted text-muted-foreground"}`}>
                          {isAr
                            ? d.payment_status === "paid" || d.payment_status === "completed" ? "مدفوع"
                              : d.payment_status === "pending" ? "معلق"
                              : d.payment_status === "failed" ? "فشل"
                              : d.payment_status === "refunded" ? "مسترد" : d.payment_status
                            : d.payment_status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground whitespace-nowrap">{new Date(d.created_at).toLocaleDateString(isAr?"ar-EG":"en-US")}</td>
                      <td className="px-2 py-2.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const prog = (d as any).program_name_ar || (d as any).project_name_ar || (isAr ? "كفالة ومساعدات خيرية" : "Charity Support");
                              setReceiptRecord({
                                ref: d.ref_code,
                                amount: Number(d.amount),
                                program: prog,
                                programLabel: prog,
                                method: d.payment_method || "بطاقة بنكية",
                                status: d.payment_status,
                                createdAt: d.created_at,
                                updatedAt: (d as any).updated_at || d.created_at,
                                donor: {
                                  name: donor.name,
                                  phone: donor.phone || "",
                                  email: donor.email || "",
                                },
                                targetType: isAr ? "تبرع عام" : "Donation",
                                items: (d as any).items || [
                                  {
                                    title: prog,
                                    category: isAr ? "تبرع نقدي" : "Donation",
                                    quantity: 1,
                                    amount: Number(d.amount),
                                  },
                                ],
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-600/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition"
                            title={isAr ? "تحميل إيصال PDF" : "Download PDF"}
                          >
                            <FileText className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{isAr ? "إيصال PDF" : "PDF"}</span>
                          </button>
                          <Link to={`/admin/donations/${d.id}`} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-black text-primary hover:bg-primary/20 transition">
                            <ExternalLink className="h-3 w-3" />{isAr ? "تفاصيل" : "Details"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {donations.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                      {isAr ? "لا توجد تبرعات مسجلة لهذا المتبرع" : "No donations found for this donor"}
                    </td></tr>
                  )}
                </tbody>
                {donations.length > 0 && (
                  <tfoot className="border-t-2 border-border bg-muted/30 text-xs font-black text-primary">
                    <tr>
                      <td className="px-2 py-2" colSpan={2}>
                        {isAr ? `${donations.length} تبرع — مدفوع: ${totalPaid.toLocaleString()} EGP` : `${donations.length} donations — Paid: ${totalPaid.toLocaleString()} EGP`}
                      </td>
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </div>

        {/* Modal for PDF Receipt Preview */}
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
      </div>
    </AdminLayout>
  );
}
