import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Trash2, X, CheckCircle2, XCircle, Loader2, MessageSquarePlus, Pencil, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  listAllCasesForStaff, listCategories, createCase, setCaseStatus, deleteCase,
  STATUS_LABELS, type CaseStatus, type CategoryRow,
  listCaseUpdates, addCaseUpdate,
} from "@/data/casesApi";

type CaseWithCat = Awaited<ReturnType<typeof listAllCasesForStaff>>[number];

const STATUS_FILTERS: { v: "all" | CaseStatus; ar: string; en: string }[] = [
  { v: "all", ar: "الكل", en: "All" },
  { v: "pending", ar: "قيد المراجعة", en: "Pending" },
  { v: "approved", ar: "معتمدة", en: "Approved" },
  { v: "funded", ar: "مكتملة", en: "Funded" },
  { v: "closed", ar: "مغلقة", en: "Closed" },
  { v: "rejected", ar: "مرفوضة", en: "Rejected" },
];

const AdminCases = () => {
  const { lang } = useLang();
  const [rows, setRows] = useState<CaseWithCat[]>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [updatesFor, setUpdatesFor] = useState<CaseWithCat | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [c, k] = await Promise.all([listAllCasesForStaff(), listCategories()]);
      setRows(c as CaseWithCat[]);
      setCats(k);
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => rows.filter((c) => {
    const sm = !search || c.title.includes(search) || c.beneficiary_name.includes(search) || c.ref_code.includes(search);
    const st = statusFilter === "all" || c.status === statusFilter;
    return sm && st;
  }), [rows, search, statusFilter]);

  const counts = useMemo(() => ({
    total: rows.length,
    pending: rows.filter(r => r.status === "pending").length,
    approved: rows.filter(r => r.status === "approved").length,
    funded: rows.filter(r => r.status === "funded").length,
  }), [rows]);

  const transition = async (id: string, next: CaseStatus, reason?: string) => {
    try {
      await setCaseStatus(id, next, reason);
      toast({ title: lang === "ar" ? "تم تحديث الحالة" : "Status updated" });
      void reload();
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
  };

  const remove = async (id: string) => {
    if (!confirm(lang === "ar" ? "حذف الحالة؟" : "Delete case?")) return;
    try { await deleteCase(id); toast({ title: lang === "ar" ? "تم الحذف" : "Deleted" }); void reload(); }
    catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard accent label={lang === "ar" ? "إجمالي الحالات" : "Total cases"} value={counts.total} />
          <StatCard label={lang === "ar" ? "قيد المراجعة" : "Pending"} value={counts.pending} />
          <StatCard label={lang === "ar" ? "معتمدة" : "Approved"} value={counts.approved} />
          <StatCard label={lang === "ar" ? "مكتملة" : "Funded"} value={counts.funded} />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-soft sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={lang === "ar" ? "بحث بالعنوان أو الكود…" : "Search title or ref…"} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button key={f.v} onClick={() => setStatusFilter(f.v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  statusFilter === f.v ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}>{lang === "ar" ? f.ar : f.en}</button>
            ))}
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-orange-grad text-accent-foreground">
            <Plus className="h-4 w-4" />{lang === "ar" ? "حالة جديدة" : "New case"}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-card shadow-soft">
          {loading ? (
            <div className="grid place-items-center p-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                {[lang === "ar" ? "الكود" : "Ref", lang === "ar" ? "العنوان" : "Title", lang === "ar" ? "الفئة" : "Category",
                  lang === "ar" ? "المستفيد" : "Beneficiary", lang === "ar" ? "المدينة" : "City",
                  lang === "ar" ? "المطلوب/المُجمّع" : "Needed/Raised",
                  lang === "ar" ? "الحالة" : "Status", lang === "ar" ? "إجراءات" : "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-start">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const st = (c.status && STATUS_LABELS[c.status as CaseStatus]) || {
                  ar: c.status || "معتمدة",
                  en: c.status || "Approved",
                  tone: "bg-secondary/20 text-primary",
                };
                const cat = (c as unknown as { case_categories?: { name_ar: string; name_en: string } }).case_categories;
                return (
                  <tr key={c.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-mono text-xs">{c.ref_code}</td>
                    <td className="px-3 py-2.5 font-bold">{c.title}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{cat ? (lang === "ar" ? cat.name_ar : cat.name_en) : "—"}</td>
                    <td className="px-3 py-2.5">{c.beneficiary_name}</td>
                    <td className="px-3 py-2.5">{c.city ?? c.governorate}</td>
                    <td className="px-3 py-2.5 font-mono text-xs" dir="ltr">{Number(c.raised_amount).toLocaleString()} / {Number(c.needed_amount).toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold ${st.tone}`}>
                        {lang === "ar" ? st.ar : st.en}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        <Link to={`/admin/cases/${c.id}`} className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary hover:bg-primary/20" title="Edit/Details"><Pencil className="h-3.5 w-3.5" /></Link>
                        {(c.status === "approved" || c.status === "funded" || c.status === "closed") && (
                          <a href={`/cases/${c.ref_code}`} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-md bg-secondary/15 text-primary hover:bg-secondary/30" title="Public preview"><ExternalLink className="h-3.5 w-3.5" /></a>
                        )}
                        {c.status === "pending" && (
                          <>
                            <button onClick={() => transition(c.id, "approved")} className="grid h-7 w-7 place-items-center rounded-md bg-secondary/20 text-primary hover:bg-secondary/40" title="Approve"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { const r = prompt(lang === "ar" ? "سبب الرفض" : "Rejection reason") || ""; transition(c.id, "rejected", r); }} className="grid h-7 w-7 place-items-center rounded-md bg-destructive/15 text-destructive hover:bg-destructive/25" title="Reject"><XCircle className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                        {c.status === "approved" && (
                          <button onClick={() => transition(c.id, "funded")} className="rounded-md bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/25">{lang === "ar" ? "تم التمويل" : "Mark funded"}</button>
                        )}
                        {(c.status === "funded" || c.status === "approved") && (
                          <button onClick={() => transition(c.id, "closed")} className="rounded-md bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted/80">{lang === "ar" ? "إغلاق" : "Close"}</button>
                        )}
                        <button onClick={() => remove(c.id)} className="grid h-7 w-7 place-items-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20" aria-label="delete"><Trash2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setUpdatesFor(c)} className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent hover:bg-accent/25" title="Updates"><MessageSquarePlus className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد حالات" : "No cases"}</td></tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {showAdd && <AddCaseModal cats={cats} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); void reload(); }} lang={lang} />}
      {updatesFor && <UpdatesModal caseRow={updatesFor} onClose={() => setUpdatesFor(null)} lang={lang} />}
    </AdminLayout>
  );
};

const UpdatesModal = ({ caseRow, onClose, lang }: { caseRow: CaseWithCat; onClose: () => void; lang: "ar" | "en" }) => {
  const [items, setItems] = useState<Awaited<ReturnType<typeof listCaseUpdates>>>([]);
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await listCaseUpdates(caseRow.id)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [caseRow.id]);

  const post = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await addCaseUpdate(caseRow.id, body.trim(), imageUrl.trim() || null);
      setBody(""); setImageUrl("");
      toast({ title: lang === "ar" ? " تم نشر التحديث" : " Update posted" });
      void load();
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-primary">{lang === "ar" ? "تحديثات الأثر" : "Impact updates"}</h2>
            <p className="text-xs text-muted-foreground">{caseRow.ref_code} — {caseRow.title}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-2 rounded-xl bg-muted/30 p-3">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
            placeholder={lang === "ar" ? "اكتب تحديث الأثر… (مثال: تم تسليم الجهاز للمستفيد)" : "Write impact update…"}
            className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={lang === "ar" ? "رابط صورة (اختياري)" : "Image URL (optional)"} />
          <Button onClick={post} disabled={saving || !body.trim()} className="bg-orange-grad text-accent-foreground">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}{lang === "ar" ? "نشر التحديث" : "Post update"}
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            : items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد تحديثات بعد" : "No updates yet"}</p>
            : items.map((u) => (
              <div key={u.id} className="rounded-xl border border-border bg-background p-3 text-sm">
                <p className="text-[10px] font-bold text-muted-foreground">{new Date(u.created_at).toLocaleString()}</p>
                <p className="mt-1 whitespace-pre-line">{u.body}</p>
                {u.image_url && <img src={u.image_url} alt="" loading="lazy" className="mt-2 max-h-48 w-full rounded-md object-cover" />}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const AddCaseModal = ({ cats, onClose, onSaved, lang }: { cats: CategoryRow[]; onClose: () => void; onSaved: () => void; lang: "ar" | "en" }) => {
  const [form, setForm] = useState({
    title: "", story: "", category_id: cats[0]?.id ?? "",
    beneficiary_name: "", beneficiary_age: "" as string,
    governorate: "الدقهلية", city: "",
    needed_amount: 5000, deadline: "", urgency: "medium" as "low"|"medium"|"high"|"critical",
    cover_image_url: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title || !form.beneficiary_name || !form.category_id || form.needed_amount <= 0) {
      toast({ title: lang === "ar" ? "أكمل الحقول المطلوبة" : "Fill required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createCase({
        title: form.title.trim(),
        story: form.story.trim(),
        category_id: form.category_id,
        beneficiary_name: form.beneficiary_name.trim(),
        beneficiary_age: form.beneficiary_age ? Number(form.beneficiary_age) : null,
        governorate: form.governorate.trim() || "الدقهلية",
        city: form.city.trim() || null,
        needed_amount: Number(form.needed_amount),
        deadline: form.deadline || null,
        urgency: form.urgency,
        cover_image_url: form.cover_image_url.trim() || null,
      });
      toast({ title: lang === "ar" ? " تم إنشاء الحالة (قيد المراجعة)" : " Case created (pending)" });
      onSaved();
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-primary">{lang === "ar" ? "حالة جديدة" : "New case"}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label={lang === "ar" ? "عنوان الحالة *" : "Title *"}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label={lang === "ar" ? "الفئة *" : "Category *"}>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-background px-2.5 text-sm font-bold">
              {cats.map(c => <option key={c.id} value={c.id}>{lang === "ar" ? c.name_ar : c.name_en}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "ar" ? "اسم المستفيد *" : "Beneficiary *"}><Input value={form.beneficiary_name} onChange={(e) => setForm({ ...form, beneficiary_name: e.target.value })} /></Field>
            <Field label={lang === "ar" ? "السن" : "Age"}><Input type="number" value={form.beneficiary_age} onChange={(e) => setForm({ ...form, beneficiary_age: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "ar" ? "المحافظة" : "Governorate"}><Input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} /></Field>
            <Field label={lang === "ar" ? "المدينة" : "City"}><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "ar" ? "المبلغ المطلوب (ج.م) *" : "Needed (EGP) *"}><Input type="number" value={form.needed_amount} onChange={(e) => setForm({ ...form, needed_amount: Number(e.target.value) })} /></Field>
            <Field label={lang === "ar" ? "Deadline" : "Deadline"}><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
          </div>
          <Field label={lang === "ar" ? "درجة الأولوية" : "Urgency"}>
            <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as typeof form.urgency })}
              className="h-10 w-full rounded-md border border-border bg-background px-2.5 text-sm font-bold">
              <option value="low">{lang === "ar" ? "منخفضة" : "Low"}</option>
              <option value="medium">{lang === "ar" ? "متوسطة" : "Medium"}</option>
              <option value="high">{lang === "ar" ? "عالية" : "High"}</option>
              <option value="critical">{lang === "ar" ? "حرجة" : "Critical"}</option>
            </select>
          </Field>
          <Field label={lang === "ar" ? "رابط صورة الغلاف" : "Cover image URL"}>
            <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://…" />
          </Field>
          <Field label={lang === "ar" ? "قصة الحالة" : "Story"}>
            <textarea value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} rows={4}
              className="w-full rounded-md border border-border bg-background p-2 text-sm" />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={submit} disabled={saving} className="flex-1 bg-orange-grad text-accent-foreground">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}{lang === "ar" ? "إنشاء" : "Create"}
          </Button>
          <Button variant="outline" onClick={onClose}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1 block text-xs font-bold text-muted-foreground">{label}</label>
    {children}
  </div>
);

export default AdminCases;