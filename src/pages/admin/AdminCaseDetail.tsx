import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, ExternalLink, Loader2, Trash2,
  MessageSquarePlus, Share2, Image as ImageIcon, Copy, Upload, Pencil, X,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { formatNumberEN } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  getCaseById, updateCase, setCaseStatus, deleteCase,
  listCategories, listCaseUpdates, addCaseUpdate, listCaseDocuments,
  listDonationsForCase, STATUS_LABELS, updateCaseUpdate, deleteCaseUpdate,
  uploadCaseMediaFile, type CaseStatus, type Urgency, type CategoryRow,
} from "@/data/casesApi";
import { CaseMediaManager } from "@/components/admin/CaseMediaManager";
import { compressImage } from "@/lib/image-compress";
import { supabase } from "@/integrations/supabase/client";
import { DAKAHLIA_CITIES, DISTRICTS_BY_CITY, cityToSlug } from "@/data/dakahliaCities";
import { MapPin, Loader2 as Spin } from "lucide-react";

type CaseRow = NonNullable<Awaited<ReturnType<typeof getCaseById>>>;

const URGENCIES: { v: Urgency; ar: string; en: string }[] = [
  { v: "low", ar: "منخفضة", en: "Low" },
  { v: "medium", ar: "متوسطة", en: "Medium" },
  { v: "high", ar: "عالية", en: "High" },
  { v: "critical", ar: "حرجة", en: "Critical" },
];

const STATUSES: CaseStatus[] = ["draft","pending","approved","funded","closed","rejected"];

export default function AdminCaseDetail() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [row, setRow] = useState<CaseRow | null>(null);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [donations, setDonations] = useState<Awaited<ReturnType<typeof listDonationsForCase>>>([]);
  const [updates, setUpdates] = useState<Awaited<ReturnType<typeof listCaseUpdates>>>([]);
  const [docs, setDocs] = useState<Awaited<ReturnType<typeof listCaseDocuments>>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // editable fields
  const [form, setForm] = useState({
    title: "", story: "", category_id: "",
    beneficiary_name: "", beneficiary_age: "" as string,
    governorate: "الدقهلية", city: "",
    area: "" as string,
    needed_amount: 0, raised_amount: 0,
    deadline: "", urgency: "medium" as Urgency,
    cover_image_url: "", status: "pending" as CaseStatus,
    rejection_reason: "",
  });

  // updates form
  const [updBody, setUpdBody] = useState("");
  const [updImg, setUpdImg] = useState("");
  const [postingUpd, setPostingUpd] = useState(false);
  const [uploadingUpdImg, setUploadingUpdImg] = useState(false);
  const updFileInput = useRef<HTMLInputElement | null>(null);
  const [editingUpd, setEditingUpd] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ body: string; image_url: string }>({ body: "", image_url: "" });

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [r, c, d, u, ds] = await Promise.all([
        getCaseById(id), listCategories(),
        listDonationsForCase(id), listCaseUpdates(id), listCaseDocuments(id),
      ]);
      if (!r) { toast({ title: isAr ? "الحالة غير موجودة" : "Case not found", variant: "destructive" }); nav("/admin/cases"); return; }
      setRow(r as CaseRow);
      setCats(c);
      setDonations(d);
      setUpdates(u);
      setDocs(ds);
      setForm({
        title: r.title || "",
        story: r.story || "",
        category_id: r.category_id || "",
        beneficiary_name: r.beneficiary_name || "",
        beneficiary_age: r.beneficiary_age != null ? String(r.beneficiary_age) : "",
        governorate: r.governorate || "الدقهلية",
        city: r.city || "",
        area: (r as any).area || "",
        needed_amount: Number(r.needed_amount) || 0,
        raised_amount: Number(r.raised_amount) || 0,
        deadline: r.deadline || "",
        urgency: (r.urgency as Urgency) || "medium",
        cover_image_url: r.cover_image_url || "",
        status: r.status as CaseStatus,
        rejection_reason: r.rejection_reason || "",
      });
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [id]);

  // Realtime sync for case_updates
  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`admin-case-updates-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "case_updates", filter: `case_id=eq.${id}` },
        async () => { try { setUpdates(await listCaseUpdates(id)); } catch { /* noop */ } })
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch { /* noop */ } };
  }, [id]);

  const pct = useMemo(() => {
    const n = form.needed_amount || 0; const r = form.raised_amount || 0;
    return n > 0 ? Math.min(100, Math.round((r / n) * 100)) : 0;
  }, [form.needed_amount, form.raised_amount]);

  const save = async () => {
    if (!row) return;
    if (!form.title.trim() || !form.beneficiary_name.trim() || !form.category_id || form.needed_amount <= 0) {
      toast({ title: isAr ? "أكمل الحقول المطلوبة" : "Fill required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateCase(row.id, {
        title: form.title.trim(),
        story: form.story.trim(),
        category_id: form.category_id,
        beneficiary_name: form.beneficiary_name.trim(),
        beneficiary_age: form.beneficiary_age ? Number(form.beneficiary_age) : null,
        governorate: form.governorate.trim() || "الدقهلية",
        city: form.city.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
        needed_amount: Number(form.needed_amount),
        deadline: form.deadline || null,
        urgency: form.urgency,
        ...( { area: form.area.trim() || null } as any ),
      });
      toast({ title: isAr ? " تم الحفظ" : " Saved" });
      void reload();
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const changeStatus = async (next: CaseStatus, reason?: string) => {
    if (!row) return;
    try {
      await setCaseStatus(row.id, next, reason);
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
      void reload();
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
  };

  const remove = async () => {
    if (!row) return;
    if (!confirm(isAr ? "حذف الحالة نهائياً؟" : "Delete case permanently?")) return;
    try { await deleteCase(row.id); toast({ title: isAr ? "تم الحذف" : "Deleted" }); nav("/admin/cases"); }
    catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
  };

  const postUpdate = async () => {
    if (!row || !updBody.trim()) return;
    setPostingUpd(true);
    try {
      await addCaseUpdate(row.id, updBody.trim(), updImg.trim() || null);
      setUpdBody(""); setUpdImg("");
      toast({ title: isAr ? " تم نشر التحديث" : " Update posted" });
      setUpdates(await listCaseUpdates(row.id));
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
    finally { setPostingUpd(false); }
  };

  const onPickUpdateImage = async (file: File | null) => {
    if (!row || !file) return;
    setUploadingUpdImg(true);
    try {
      const f = file.type.startsWith("image/") ? await compressImage(file, { maxEdge: 1600, quality: 0.8 }) : file;
      const { url } = await uploadCaseMediaFile(f, row.id);
      setUpdImg(url);
      toast({ title: isAr ? " تم رفع الصورة" : " Image uploaded" });
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
    finally { setUploadingUpdImg(false); if (updFileInput.current) updFileInput.current.value = ""; }
  };

  const startEditUpd = (u: typeof updates[number]) => {
    setEditingUpd(u.id);
    setEditDraft({ body: u.body, image_url: u.image_url || "" });
  };
  const saveEditUpd = async () => {
    if (!editingUpd) return;
    try {
      await updateCaseUpdate(editingUpd, { body: editDraft.body.trim(), image_url: editDraft.image_url.trim() || null });
      setEditingUpd(null);
      toast({ title: isAr ? " تم التعديل" : " Updated" });
      if (row) setUpdates(await listCaseUpdates(row.id));
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
  };
  const removeUpd = async (uid: string) => {
    if (!confirm(isAr ? "حذف هذا التحديث؟" : "Delete this update?")) return;
    try {
      await deleteCaseUpdate(uid);
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
      if (row) setUpdates(await listCaseUpdates(row.id));
    } catch (e) { toast({ title: (e as Error).message, variant: "destructive" }); }
  };

  const publicHref = row ? `/cases/${row.ref_code}` : "#";
  const fullPublicUrl = typeof window !== "undefined" && row ? `${window.location.origin}${publicHref}` : "";

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(fullPublicUrl); toast({ title: isAr ? "تم نسخ الرابط" : "Link copied" }); }
    catch { /* noop */ }
  };

  if (loading || !row) {
    return <AdminLayout><div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AdminLayout>;
  }

  const st = STATUS_LABELS[form.status];
  const totalRaised = donations.filter(d => d.payment_status === "paid").reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin/cases" className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/80" aria-label="back">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{row.ref_code}</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold ${st.tone}`}>{isAr ? st.ar : st.en}</span>
              </div>
              <h1 className="truncate text-lg font-black text-primary">{form.title || row.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={publicHref} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-secondary/20 px-3 py-1.5 text-xs font-extrabold text-primary hover:bg-secondary/30">
              <ExternalLink className="h-3.5 w-3.5" />{isAr ? "معاينة عامة" : "Public preview"}
            </a>
            <button onClick={copyLink} className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-bold hover:bg-muted/80">
              <Copy className="h-3.5 w-3.5" />{isAr ? "نسخ الرابط" : "Copy link"}
            </button>
            {navigator.share && (
              <button onClick={() => navigator.share?.({ title: form.title, url: fullPublicUrl }).catch(()=>{})} className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-bold hover:bg-muted/80">
                <Share2 className="h-3.5 w-3.5" />{isAr ? "مشاركة" : "Share"}
              </button>
            )}
            <Button onClick={save} disabled={saving} className="bg-orange-grad text-accent-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={isAr ? "نسبة التمويل" : "Funding %"} value={`${pct}%`} sub={`${formatNumberEN(form.raised_amount)} / ${formatNumberEN(form.needed_amount)} EGP`} />
          <StatCard label={isAr ? "تبرعات مدفوعة" : "Paid donations"} value={donations.filter(d => d.payment_status === "paid").length} sub={`${formatNumberEN(totalRaised)} EGP`} />
          <StatCard label={isAr ? "إجمالي التبرعات" : "All donations"} value={donations.length} />
          <StatCard label={isAr ? "تحديثات الأثر" : "Impact updates"} value={updates.length} />
        </div>

        {/* Status actions */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-soft">
          <span className="text-xs font-bold text-muted-foreground">{isAr ? "تغيير الحالة:" : "Status:"}</span>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => {
              if (s === "rejected") {
                const r = prompt(isAr ? "سبب الرفض" : "Rejection reason") || "";
                changeStatus(s, r);
              } else changeStatus(s);
            }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${form.status === s ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
              {isAr ? STATUS_LABELS[s].ar : STATUS_LABELS[s].en}
            </button>
          ))}
          <div className="ms-auto">
            <button onClick={remove} className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/20">
              <Trash2 className="h-3.5 w-3.5" />{isAr ? "حذف" : "Delete"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Edit form (2 cols) */}
          <div className="space-y-4 lg:col-span-2">
            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="mb-3 text-sm font-black text-primary">{isAr ? "البيانات الأساسية" : "Basic info"}</h2>
              <div className="space-y-3">
                <Field label={isAr ? "عنوان الحالة *" : "Title *"}>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </Field>
                <Field label={isAr ? "القصة" : "Story"}>
                  <textarea value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} rows={6}
                    className="w-full rounded-md border border-border bg-background p-2 text-sm" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={isAr ? "الفئة *" : "Category *"}>
                    <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="h-10 w-full rounded-md border border-border bg-background px-2.5 text-sm font-bold">
                      {cats.map(c => <option key={c.id} value={c.id}>{isAr ? c.name_ar : c.name_en}</option>)}
                    </select>
                  </Field>
                  <Field label={isAr ? "درجة الأولوية" : "Urgency"}>
                    <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as Urgency })}
                      className="h-10 w-full rounded-md border border-border bg-background px-2.5 text-sm font-bold">
                      {URGENCIES.map(u => <option key={u.v} value={u.v}>{isAr ? u.ar : u.en}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="mb-3 text-sm font-black text-primary">{isAr ? "المستفيد والموقع" : "Beneficiary & location"}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={isAr ? "اسم المستفيد *" : "Beneficiary *"}>
                  <Input value={form.beneficiary_name} onChange={(e) => setForm({ ...form, beneficiary_name: e.target.value })} />
                </Field>
                <Field label={isAr ? "السن" : "Age"}>
                  <Input type="number" value={form.beneficiary_age} onChange={(e) => setForm({ ...form, beneficiary_age: e.target.value })} />
                </Field>
                <Field label={isAr ? "المحافظة" : "Governorate"}>
                  <Input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} />
                </Field>
                <Field label={isAr ? "المدينة" : "City"}>
                  <div className="flex gap-1.5">
                    <select
                      dir={isAr ? "rtl" : "ltr"}
                      value={DAKAHLIA_CITIES.some(c => (isAr ? c.ar : c.en) === form.city || c.slug === form.city) ? form.city : "__other__"}
                      onChange={(e) => {
                        if (e.target.value === "__other__") setForm({ ...form, city: "", area: "" });
                        else setForm({ ...form, city: e.target.value, area: "" });
                      }}
                      className="h-10 flex-1 rounded-md border border-border bg-background px-2.5 text-sm font-bold"
                    >
                      <option value="">{isAr ? "— اختر مدينة —" : "— Select city —"}</option>
                      {DAKAHLIA_CITIES.map(c => (
                        <option key={c.slug} value={isAr ? c.ar : c.en}>{isAr ? c.ar : c.en}</option>
                      ))}
                      <option value="__other__">{isAr ? "أخرى…" : "Other…"}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          toast({ title: isAr ? "الموقع غير مدعوم" : "Geolocation unavailable", variant: "destructive" });
                          return;
                        }
                        setLocating(true);
                        navigator.geolocation.getCurrentPosition(
                          async (pos) => {
                            const { latitude, longitude } = pos.coords;
                            let best = DAKAHLIA_CITIES[0]; let bestD = Infinity;
                            for (const c of DAKAHLIA_CITIES) {
                              const d = Math.hypot(c.lat - latitude, c.lon - longitude);
                              if (d < bestD) { bestD = d; best = c; }
                            }
                            const cityLabel = isAr ? best.ar : best.en;
                            setForm(f => ({ ...f, city: cityLabel, governorate: "الدقهلية", area: "" }));
                            // Auto-persist the detected location immediately
                            if (row) {
                              try {
                                await supabase.from("cases").update({
                                  city: cityLabel,
                                  governorate: "الدقهلية",
                                  ...( { area: null } as any ),
                                } as any).eq("id", row.id);
                                toast({ title: isAr ? ` تم حفظ الموقع: ${best.ar}` : `✅ Location saved: ${best.en}`,
                                  description: isAr ? "تم تحديث المدينة والمحافظة في قاعدة البيانات." : "City & governorate updated in DB.",
                                });
                              } catch (e) {
                                toast({ title: (e as Error).message, variant: "destructive" });
                              }
                            } else {
                              toast({ title: isAr ? ` ${best.ar}` : `📍 ${best.en}` });
                            }
                            setLocating(false);
                          },
                          (err) => { toast({ title: err.message, variant: "destructive" }); setLocating(false); },
                          { enableHighAccuracy: true, timeout: 8000 }
                        );
                      }}
                      title={isAr ? "اكتشف موقعي" : "Detect my location"}
                      className="grid h-10 w-10 place-items-center rounded-md bg-secondary/20 text-primary hover:bg-secondary/30"
                    >
                      {locating ? <Spin className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    </button>
                  </div>
                  {!DAKAHLIA_CITIES.some(c => (isAr ? c.ar : c.en) === form.city) && (
                    <Input className="mt-1.5" placeholder={isAr ? "أو اكتب اسم المدينة/المنطقة" : "Or type city/area name"}
                      value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  )}
                  {/* District / area dropdown (depends on selected city) */}
                  {(() => {
                    const slug = cityToSlug(form.city);
                    const list = (slug && DISTRICTS_BY_CITY[slug]) || [];
                    if (!slug || list.length === 0) {
                      return (
                        <Input
                          className="mt-1.5"
                          placeholder={isAr ? "المنطقة / الحي (اختياري)" : "District / area (optional)"}
                          value={form.area}
                          onChange={(e) => setForm({ ...form, area: e.target.value })}
                        />
                      );
                    }
                    const isKnown = list.some((d) => (isAr ? d.ar : d.en) === form.area);
                    return (
                      <div className="mt-1.5 space-y-1.5">
                        <select
                          dir={isAr ? "rtl" : "ltr"}
                          value={isKnown ? form.area : (form.area ? "__other__" : "")}
                          onChange={(e) => {
                            if (e.target.value === "__other__") setForm({ ...form, area: "" });
                            else setForm({ ...form, area: e.target.value });
                          }}
                          className="h-10 w-full rounded-md border border-border bg-background px-2.5 text-sm font-bold"
                        >
                          <option value="">{isAr ? "— المنطقة / الحي —" : "— District / area —"}</option>
                          {list.map((d) => (
                            <option key={d.en} value={isAr ? d.ar : d.en}>{isAr ? d.ar : d.en}</option>
                          ))}
                          <option value="__other__">{isAr ? "أخرى…" : "Other…"}</option>
                        </select>
                        {!isKnown && (
                          <Input
                            placeholder={isAr ? "اكتب اسم المنطقة" : "Type area name"}
                            value={form.area}
                            onChange={(e) => setForm({ ...form, area: e.target.value })}
                          />
                        )}
                      </div>
                    );
                  })()}
                </Field>
              </div>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="mb-3 text-sm font-black text-primary">{isAr ? "التمويل" : "Funding"}</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={isAr ? "المبلغ المطلوب (ج.م) *" : "Needed (EGP) *"}>
                  <Input type="number" min={0} value={form.needed_amount} onChange={(e) => setForm({ ...form, needed_amount: Number(e.target.value) })} />
                </Field>
                <Field label={isAr ? "تم جمعه (تلقائي)" : "Raised (auto)"}>
                  <Input type="number" value={form.raised_amount} disabled />
                </Field>
                <Field label={isAr ? "تاريخ نهائي" : "Deadline"}>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </Field>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{isAr ? "تقدم التمويل" : "Progress"}</span>
                  <span className="text-primary">{pct}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-primary">
                <ImageIcon className="h-4 w-4" />{isAr ? "الصورة الرئيسية" : "Cover image"}
              </h2>
              <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                placeholder="https://…" dir="ltr" />
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt="" loading="lazy" className="mt-3 max-h-56 w-full rounded-xl object-cover" />
              )}
            </section>

            {/* Updates */}
            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-primary">
                <MessageSquarePlus className="h-4 w-4" />{isAr ? "تحديثات الأثر" : "Impact updates"}
                <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{updates.length}</span>
              </h2>
              <div className="space-y-2 rounded-xl bg-muted/30 p-3">
                <textarea value={updBody} onChange={(e) => setUpdBody(e.target.value)} rows={3}
                  placeholder={isAr ? "اكتب تحديث الأثر…" : "Write impact update…"}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm" />
                <div className="flex flex-wrap items-center gap-2">
                  <input ref={updFileInput} type="file" accept="image/*" className="hidden"
                    onChange={(e) => onPickUpdateImage(e.target.files?.[0] ?? null)} />
                  <Button type="button" onClick={() => updFileInput.current?.click()} disabled={uploadingUpdImg}
                    className="h-9 bg-secondary/20 text-xs text-primary hover:bg-secondary/30">
                    {uploadingUpdImg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isAr ? "رفع صورة (ضغط تلقائي)" : "Upload image (auto-compress)"}
                  </Button>
                  {updImg && (
                    <button type="button" onClick={() => setUpdImg("")}
                      className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/20">
                      <X className="h-3.5 w-3.5" />{isAr ? "إزالة الصورة" : "Remove image"}
                    </button>
                  )}
                </div>
                <Input value={updImg} onChange={(e) => setUpdImg(e.target.value)} placeholder={isAr ? "أو الصق رابط صورة" : "Or paste image URL"} dir="ltr" />
                {updImg && (
                  <img src={updImg} alt="" loading="lazy" className="max-h-40 w-full rounded-md object-cover" />
                )}
                <Button onClick={postUpdate} disabled={postingUpd || !updBody.trim()} className="bg-orange-grad text-accent-foreground">
                  {postingUpd && <Loader2 className="h-4 w-4 animate-spin" />}{isAr ? "نشر التحديث" : "Post update"}
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {updates.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                    <MessageSquarePlus className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{isAr ? "لا توجد تحديثات بعد. أضف أول تحديث ليظهر فورًا في صفحة الحالة العامة." : "No updates yet. Post the first one to show on the public case page."}</p>
                  </div>
                ) : updates.map((u) => (
                  <div key={u.id} className="rounded-xl border border-border bg-background p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold text-muted-foreground">{new Date(u.created_at).toLocaleString()}</p>
                      {editingUpd !== u.id && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEditUpd(u)}
                            className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-muted/70" aria-label="edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => removeUpd(u.id)}
                            className="grid h-7 w-7 place-items-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20" aria-label="delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingUpd === u.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea value={editDraft.body} rows={3}
                          onChange={(e) => setEditDraft({ ...editDraft, body: e.target.value })}
                          className="w-full rounded-md border border-border bg-background p-2 text-sm" />
                        <Input value={editDraft.image_url} dir="ltr"
                          onChange={(e) => setEditDraft({ ...editDraft, image_url: e.target.value })}
                          placeholder={isAr ? "رابط صورة" : "Image URL"} />
                        <div className="flex gap-2">
                          <Button onClick={saveEditUpd} className="h-8 bg-orange-grad text-xs text-accent-foreground">
                            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ" : "Save"}
                          </Button>
                          <Button onClick={() => setEditingUpd(null)} className="h-8 bg-muted text-xs">
                            {isAr ? "إلغاء" : "Cancel"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-1 whitespace-pre-line">{u.body}</p>
                        {u.image_url && <img src={u.image_url} alt="" loading="lazy" className="mt-2 max-h-48 w-full rounded-md object-cover" />}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Media gallery — live syncs with /cases/:ref */}
            <CaseMediaManager caseId={row.id} />
          </div>

          {/* Side: donations + docs */}
          <aside className="space-y-4">
            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="mb-3 text-sm font-black text-primary">{isAr ? `التبرعات (${donations.length})` : `Donations (${donations.length})`}</h2>
              <div className="max-h-[420px] space-y-2 overflow-auto">
                {donations.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">{isAr ? "لا تبرعات بعد" : "No donations yet"}</p>
                ) : donations.map((d) => (
                  <div key={d.id} className="rounded-xl border border-border bg-background p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground">{d.ref_code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        d.payment_status === "paid" ? "bg-primary/15 text-primary" :
                        d.payment_status === "pending" ? "bg-accent/15 text-accent" :
                        "bg-destructive/10 text-destructive"
                      }`}>{d.payment_status}</span>
                    </div>
                    <div className="mt-1 font-bold">{d.donor_name || (isAr ? "متبرع غير معروف" : "Anonymous")}</div>
                    <div className="text-[10px] text-muted-foreground">{d.donor_email || d.donor_phone || ""}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-extrabold text-primary">{Number(d.amount).toLocaleString()} {d.currency}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="mb-3 text-sm font-black text-primary">{isAr ? `المستندات (${docs.length})` : `Documents (${docs.length})`}</h2>
              {docs.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">{isAr ? "لا مستندات" : "No documents"}</p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 p-2">
                      <span className="truncate font-bold">{d.caption || d.doc_type}</span>
                      <span className="text-[10px] text-muted-foreground">{d.is_public ? (isAr ? "عام" : "public") : (isAr ? "خاص" : "private")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {form.status === "rejected" && form.rejection_reason && (
              <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs">
                <h3 className="mb-1 font-black text-destructive">{isAr ? "سبب الرفض" : "Rejection reason"}</h3>
                <p>{form.rejection_reason}</p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-bold text-muted-foreground">{label}</span>
    {children}
  </label>
);