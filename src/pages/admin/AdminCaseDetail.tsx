import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, ExternalLink, Loader2, Trash2, MessageSquarePlus, Image as ImageIcon, Upload, Pencil, X,
  FileText, HandCoins, Link2, MapPin, ClipboardList, Route as RouteIcon,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { formatNumberEN } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  getCaseById, createCase, updateCase, setCaseStatus, deleteCase,
  listCategories, listCaseUpdates, addCaseUpdate, listCaseDocuments, addCaseDocument, deleteCaseDocument,
  listCaseJourney, listCaseMediaAdmin, listDonationsForCase, STATUS_LABELS, getCaseStatusLabel,
  updateCaseUpdate, deleteCaseUpdate, uploadCaseMediaFile, type CaseStatus, type Urgency, type CategoryRow,
} from "@/data/casesApi";
import { CaseMediaManager } from "@/components/admin/CaseMediaManager";
import { CaseShareBox } from "@/components/admin/cases/CaseShareBox";
import { CaseSeoPanel } from "@/components/admin/cases/CaseSeoPanel";
import { compressImage } from "@/lib/image-compress";
import { ChoiceSelect, Field, ImageUrlField, SectionCard } from "@/components/admin/programs/FormKit";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { DAKAHLIA_CITIES } from "@/data/dakahliaCities";
import { axesApi, programsApiV1, projectsApi, donationCampaignsApi, type LaravelAxis, type LaravelProgram, type LaravelProject, type LaravelDonationCampaign } from "@/data/laravelApi";
import { publicUrls } from "@/lib/publicUrls";

type CaseRow = NonNullable<Awaited<ReturnType<typeof getCaseById>>>;
type Relation = "none" | "program" | "project" | "campaign";

const URGENCIES: { v: Urgency; ar: string }[] = [
  { v: "low", ar: "عادية" },
  { v: "medium", ar: "متوسطة" },
  { v: "high", ar: "عاجلة" },
];

/** The backend's case statuses, in workflow order. */
const STATUSES: CaseStatus[] = ["pending_review", "approved", "completed", "closed", "rejected"];

const DOC_TYPES = [
  { value: "medical_report", label: "تقرير طبي" },
  { value: "id", label: "إثبات شخصية" },
  { value: "field_research", label: "بحث اجتماعي / ميداني" },
  { value: "invoice", label: "فاتورة / عرض سعر" },
  { value: "receipt", label: "إيصال صرف" },
  { value: "other", label: "أخرى" },
];

const EMPTY_FORM = {
  code: "",
  title: "", story: "", category_id: "" as string | number,
  beneficiary_name: "", beneficiary_age: "",
  governorate: "الدقهلية", city: "",
  needed_amount: 0, raised_amount: 0,
  deadline: "", urgency: "medium" as Urgency,
  cover_image_url: "", status: "pending_review" as CaseStatus,
  rejection_reason: "",
  relationType: "none" as Relation,
  axis_id: "" as string | number,
  program_id: "" as string | number,
  project_id: "" as string | number,
  donation_campaign_id: "" as string | number,
};
type CaseForm = typeof EMPTY_FORM;

const relationOf = (r: Record<string, unknown>): Relation =>
  r.program_id ? "program" : r.project_id ? "project" : r.donation_campaign_id ? "campaign" : "none";

const formFromRow = (r: CaseRow): CaseForm => {
  const raw = r as unknown as Record<string, unknown>;
  return {
    code: r.ref_code || "",
    title: r.title || "",
    story: r.story || "",
    category_id: r.category_id || "",
    beneficiary_name: r.beneficiary_name || "",
    beneficiary_age: r.beneficiary_age != null ? String(r.beneficiary_age) : "",
    governorate: r.governorate || "الدقهلية",
    city: r.city || "",
    needed_amount: Number(r.needed_amount) || 0,
    raised_amount: Number(r.raised_amount) || 0,
    deadline: r.deadline || "",
    urgency: (r.urgency as Urgency) || "medium",
    // The stored cover (not the placeholder the site shows when there is none).
    cover_image_url: r.cover_image || "",
    status: r.status as CaseStatus,
    rejection_reason: r.rejection_reason || "",
    relationType: relationOf(raw),
    axis_id: (raw.axis_id as number) || "",
    program_id: (raw.program_id as number) || "",
    project_id: (raw.project_id as number) || "",
    donation_campaign_id: (raw.donation_campaign_id as number) || "",
  };
};

/**
 * Case details page: create (/admin/cases/new) and edit (/admin/cases/:id). Data, impact updates,
 * media, documents, donations and sharing/SEO each have their own tab.
 */
export default function AdminCaseDetail() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  const [row, setRow] = useState<CaseRow | null>(null);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [programsList, setProgramsList] = useState<LaravelProgram[]>([]);
  const [projectsList, setProjectsList] = useState<LaravelProject[]>([]);
  const [campaignsList, setCampaignsList] = useState<LaravelDonationCampaign[]>([]);
  const [axesList, setAxesList] = useState<LaravelAxis[]>([]);

  const [donations, setDonations] = useState<Awaited<ReturnType<typeof listDonationsForCase>>>([]);
  const [updates, setUpdates] = useState<Awaited<ReturnType<typeof listCaseUpdates>>>([]);
  const [docs, setDocs] = useState<Awaited<ReturnType<typeof listCaseDocuments>>>([]);
  const [journey, setJourney] = useState<Awaited<ReturnType<typeof listCaseJourney>>>([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [tab, setTab] = useState("data");

  const [form, setForm] = useState<CaseForm>(EMPTY_FORM);
  const patch = (p: Partial<CaseForm>) => setForm((f) => ({ ...f, ...p }));

  // updates form
  const [updBody, setUpdBody] = useState("");
  const [updImg, setUpdImg] = useState("");
  const [postingUpd, setPostingUpd] = useState(false);
  const [uploadingUpdImg, setUploadingUpdImg] = useState(false);
  const updFileInput = useRef<HTMLInputElement | null>(null);
  const [editingUpd, setEditingUpd] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ body: string; image_url: string }>({ body: "", image_url: "" });

  // documents form
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("medical_report");
  const [docCaption, setDocCaption] = useState("");
  const [docPublic, setDocPublic] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docFileInput = useRef<HTMLInputElement | null>(null);

  const loadLists = async () => {
    const [c, progs, projs, camps, axes] = await Promise.all([
      listCategories(),
      programsApiV1.listAll().catch(() => [] as LaravelProgram[]),
      projectsApi.listAll().catch(() => [] as LaravelProject[]),
      donationCampaignsApi.listAll().catch(() => [] as LaravelDonationCampaign[]),
      axesApi.list().catch(() => [] as LaravelAxis[]),
    ]);
    setCats(c);
    setProgramsList(Array.isArray(progs) ? progs : []);
    setProjectsList(Array.isArray(projs) ? projs : []);
    setCampaignsList(Array.isArray(camps) ? camps : []);
    setAxesList(Array.isArray(axes) ? axes : []);
  };

  const reload = async () => {
    setLoading(true);
    try {
      if (isNew) {
        await loadLists();
        setRow(null);
        setForm(EMPTY_FORM);
        return;
      }
      const [r, d, u, ds, j, m] = await Promise.all([
        getCaseById(id!),
        listDonationsForCase(id!).catch(() => []),
        listCaseUpdates(id!),
        listCaseDocuments(id!),
        listCaseJourney(id!).catch(() => []),
        listCaseMediaAdmin(id!).catch(() => []),
        loadLists(),
      ]);
      if (!r) {
        toast({ title: isAr ? "الحالة غير موجودة" : "Case not found", variant: "destructive" });
        nav("/admin/cases");
        return;
      }
      setRow(r as CaseRow);
      setForm(formFromRow(r as CaseRow));
      setDonations(d);
      setUpdates(u);
      setDocs(ds);
      setJourney(j);
      setMediaCount(m.length);
    } catch (e) {
      toast({ title: apiErrorMessage(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setTab("data");
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const paid = useMemo(() => donations.filter((d) => d.payment_status === "paid"), [donations]);
  const paidTotal = paid.reduce((s, d) => s + Number(d.amount || 0), 0);
  // The case record's raised amount is the source of truth; paid donations are shown next to it.
  const raised = Math.max(form.raised_amount, paidTotal);
  const pct = form.needed_amount > 0 ? Math.min(100, Math.round((raised / form.needed_amount) * 100)) : 0;

  const linkPayload = () => ({
    axis_id: form.axis_id ? Number(form.axis_id) : null,
    program_id: form.relationType === "program" && form.program_id ? Number(form.program_id) : null,
    project_id: form.relationType === "project" && form.project_id ? Number(form.project_id) : null,
    donation_campaign_id: form.relationType === "campaign" && form.donation_campaign_id ? Number(form.donation_campaign_id) : null,
  });

  const save = async () => {
    if (!form.title.trim() || !form.beneficiary_name.trim() || !form.category_id || form.needed_amount <= 0) {
      toast({ title: "أكمل الحقول المطلوبة: العنوان، اسم المستفيد، التصنيف، والمبلغ المطلوب", variant: "destructive" });
      setTab("data");
      return;
    }
    const common = {
      code: form.code.trim() || undefined,
      title: form.title.trim(),
      story: form.story.trim() || form.title.trim(),
      category_id: form.category_id,
      beneficiary_name: form.beneficiary_name.trim(),
      beneficiary_age: form.beneficiary_age ? Number(form.beneficiary_age) : null,
      governorate: form.governorate.trim() || "الدقهلية",
      city: form.city.trim() || null,
      cover_image: form.cover_image_url.trim() || null,
      needed_amount: Number(form.needed_amount),
      deadline: form.deadline || null,
      urgency: form.urgency,
      ...linkPayload(),
    };
    setSaving(true);
    try {
      if (isNew) {
        // Empty code → the server generates CASE-xxxxx.
        const created = await createCase({ ...common, status: form.status });
        toast({ title: "تم إنشاء الحالة — كمّل الصور والمستندات والتحديثات من التبويبات" });
        nav(`/admin/cases/${created.id}`, { replace: true });
        return;
      }
      await updateCase(row!.id, { ...common, target_amount: Number(form.needed_amount) });
      toast({ title: "تم الحفظ بنجاح" });
      void reload();
    } catch (e) {
      toast({ title: "لم يتم الحفظ", description: apiErrorMessage(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (next: CaseStatus) => {
    if (!row) return;
    let reason: string | undefined;
    if (next === "rejected") {
      reason = prompt("سبب الرفض") || "";
    }
    try {
      await setCaseStatus(row.id, next, reason);
      toast({ title: next === "approved" ? "تم اعتماد الحالة — بقت ظاهرة للزوار ومحركات البحث" : "تم تحديث الحالة" });
      void reload();
    } catch (e) {
      toast({ title: apiErrorMessage(e), variant: "destructive" });
    }
  };

  const remove = async () => {
    if (!row) return;
    if (!confirm("حذف الحالة نهائياً؟ هتتحذف معاها صورها وتحديثاتها.")) return;
    try {
      await deleteCase(row.id);
      toast({ title: "تم الحذف" });
      nav("/admin/cases");
    } catch (e) {
      toast({ title: apiErrorMessage(e), variant: "destructive" });
    }
  };

  /* ── impact updates ── */
  const postUpdate = async () => {
    if (!row || !updBody.trim()) return;
    setPostingUpd(true);
    try {
      await addCaseUpdate(row.id, updBody.trim(), updImg.trim() || null);
      setUpdBody("");
      setUpdImg("");
      toast({ title: "تم نشر التحديث" });
      setUpdates(await listCaseUpdates(row.id));
      setJourney(await listCaseJourney(row.id).catch(() => []));
    } catch (e) {
      toast({ title: apiErrorMessage(e), variant: "destructive" });
    } finally {
      setPostingUpd(false);
    }
  };

  const onPickUpdateImage = async (file: File | null) => {
    if (!row || !file) return;
    setUploadingUpdImg(true);
    try {
      const f = file.type.startsWith("image/") ? await compressImage(file, { maxEdge: 1600, quality: 0.8 }) : file;
      const { url } = await uploadCaseMediaFile(f, row.id);
      setUpdImg(url);
      toast({ title: "تم رفع الصورة" });
    } catch (e) {
      toast({ title: apiErrorMessage(e), variant: "destructive" });
    } finally {
      setUploadingUpdImg(false);
      if (updFileInput.current) updFileInput.current.value = "";
    }
  };

  const saveEditUpd = async () => {
    if (!editingUpd || !row) return;
    try {
      await updateCaseUpdate(editingUpd, { body: editDraft.body.trim(), image_url: editDraft.image_url.trim() || null });
      setEditingUpd(null);
      toast({ title: "تم التعديل" });
      setUpdates(await listCaseUpdates(row.id));
    } catch (e) {
      toast({ title: apiErrorMessage(e), variant: "destructive" });
    }
  };

  const removeUpd = async (uid: string) => {
    if (!row || !confirm("حذف هذا التحديث؟")) return;
    try {
      await deleteCaseUpdate(uid);
      toast({ title: "تم الحذف" });
      setUpdates(await listCaseUpdates(row.id));
    } catch (e) {
      toast({ title: apiErrorMessage(e), variant: "destructive" });
    }
  };

  /* ── documents ── */
  const uploadDoc = async () => {
    if (!row || !docFile) return;
    if (docFile.size > 10 * 1024 * 1024) {
      toast({ title: "الملف أكبر من 10 ميجا", variant: "destructive" });
      return;
    }
    setUploadingDoc(true);
    try {
      await addCaseDocument(row.id, { file: docFile, doc_type: docType, caption: docCaption.trim() || null, is_public: docPublic });
      setDocFile(null);
      setDocCaption("");
      if (docFileInput.current) docFileInput.current.value = "";
      toast({ title: "تم رفع المستند" });
      setDocs(await listCaseDocuments(row.id));
    } catch (e) {
      toast({ title: "لم يتم رفع المستند", description: apiErrorMessage(e), variant: "destructive" });
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDoc = async (docId: string) => {
    if (!row || !confirm("حذف المستند نهائياً؟")) return;
    try {
      await deleteCaseDocument(docId);
      toast({ title: "تم حذف المستند" });
      setDocs(await listCaseDocuments(row.id));
    } catch (e) {
      toast({ title: apiErrorMessage(e), variant: "destructive" });
    }
  };

  /* ── location ── */
  const detectCity = () => {
    if (!navigator.geolocation) {
      toast({ title: "المتصفح مش بيدعم تحديد الموقع", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let best = DAKAHLIA_CITIES[0];
        let bestD = Infinity;
        for (const c of DAKAHLIA_CITIES) {
          const d = Math.hypot(c.lat - latitude, c.lon - longitude);
          if (d < bestD) {
            bestD = d;
            best = c;
          }
        }
        patch({ city: best.ar, governorate: "الدقهلية" });
        toast({ title: `أقرب مدينة: ${best.ar} — اضغط «حفظ» لتثبيتها` });
        setLocating(false);
      },
      (err) => {
        toast({ title: err.message, variant: "destructive" });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </AdminLayout>
    );
  }

  const st = getCaseStatusLabel(form.status);
  const code = row?.ref_code || form.code;
  const isPublic = ["approved", "completed"].includes(String(form.status));

  /* ── tab: data ── */
  const dataTab = (
    <div className="space-y-4">
      <SectionCard icon={<ClipboardList className="h-4 w-4 text-primary" />} title="البيانات الأساسية">
        <div className="space-y-3">
          <Field label="عنوان الحالة *" hint="اكتب الاحتياج نفسه، ده اللي بيظهر في جوجل وفي المشاركة.">
            <Input value={form.title} onChange={(e) => patch({ title: e.target.value })} className="h-10 rounded-xl" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="كود الحالة" hint={isNew ? "سيبه فاضي والسيستم يعمله تلقائياً (CASE-xxxx)." : "بيظهر في رابط الحالة."}>
              <Input dir="ltr" value={form.code} placeholder="CASE-1234" onChange={(e) => patch({ code: e.target.value.toUpperCase() })} className="h-10 rounded-xl font-mono text-xs" />
            </Field>
            <Field label="التصنيف *">
              <ChoiceSelect value={String(form.category_id || "")} onChange={(v) => patch({ category_id: v })}
                placeholder="اختر التصنيف" ariaLabel="التصنيف"
                options={cats.map((c) => ({ value: String(c.id), label: isAr ? c.name_ar : c.name_en }))} />
            </Field>
            <Field label="درجة الأولوية">
              <ChoiceSelect value={form.urgency} onChange={(v) => patch({ urgency: v as Urgency })} ariaLabel="الأولوية"
                options={URGENCIES.map((u) => ({ value: u.v, label: u.ar }))} />
            </Field>
          </div>
          {isNew && (
            <Field label="حالة النشر" hint="«قيد المراجعة» مش بتظهر للزوار لحد ما تعتمدها.">
              <ChoiceSelect value={form.status} onChange={(v) => patch({ status: v as CaseStatus })} ariaLabel="حالة النشر"
                options={(["pending_review", "approved"] as CaseStatus[]).map((s) => ({ value: s, label: STATUS_LABELS[s].ar }))} />
            </Field>
          )}
          <Field label="قصة الحالة" hint={`${form.story.length} حرف — يفضّل 300 حرف أو أكتر: الاحتياج، المبلغ، المكان، وإزاي التبرع هيتصرف.`}>
            <Textarea rows={8} value={form.story} onChange={(e) => patch({ story: e.target.value })} className="rounded-xl text-sm leading-relaxed" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={<Link2 className="h-4 w-4 text-primary" />} title="ربط الحالة" description="الحالة بتظهر في صفحة البرنامج أو المشروع أو الحملة اللي مربوطة بيها، وفي صفحة المحور.">
        <div className="space-y-3">
          <Field label="المحور">
            <ChoiceSelect value={form.axis_id ? String(form.axis_id) : ""} onChange={(v) => patch({ axis_id: v ? Number(v) : "" })}
              noneLabel="بدون محور" ariaLabel="المحور"
              options={axesList.map((a) => ({ value: String(a.id), label: a.name_ar || a.slug }))} />
          </Field>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              { id: "none", label: "حالة عامة" },
              { id: "program", label: "برنامج" },
              { id: "project", label: "مشروع" },
              { id: "campaign", label: "حملة" },
            ] as { id: Relation; label: string }[]).map((r) => (
              <button key={r.id} type="button" onClick={() => patch({ relationType: r.id })}
                className={`rounded-xl border p-2 text-xs font-bold transition ${form.relationType === r.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
                {r.label}
              </button>
            ))}
          </div>
          {form.relationType === "program" && (
            <ChoiceSelect value={form.program_id ? String(form.program_id) : ""} onChange={(v) => patch({ program_id: v ? Number(v) : "" })}
              placeholder="— اختر البرنامج —" ariaLabel="البرنامج"
              options={programsList.map((p) => ({ value: String(p.id), label: p.name_ar || p.name }))} />
          )}
          {form.relationType === "project" && (
            <ChoiceSelect value={form.project_id ? String(form.project_id) : ""} onChange={(v) => patch({ project_id: v ? Number(v) : "" })}
              placeholder="— اختر المشروع —" ariaLabel="المشروع"
              options={projectsList.map((p) => ({ value: String(p.id), label: p.name_ar || p.name }))} />
          )}
          {form.relationType === "campaign" && (
            <ChoiceSelect value={form.donation_campaign_id ? String(form.donation_campaign_id) : ""} onChange={(v) => patch({ donation_campaign_id: v ? Number(v) : "" })}
              placeholder="— اختر الحملة —" ariaLabel="الحملة"
              options={campaignsList.map((c) => ({ value: String(c.id), label: c.name_ar || c.name }))} />
          )}
        </div>
      </SectionCard>

      <SectionCard icon={<MapPin className="h-4 w-4 text-primary" />} title="المستفيد والمكان" description="اسم المستفيد بيتخفي جزئياً في الصفحة العامة لحماية خصوصيته.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="اسم المستفيد *">
            <Input value={form.beneficiary_name} onChange={(e) => patch({ beneficiary_name: e.target.value })} className="h-10 rounded-xl" />
          </Field>
          <Field label="السن">
            <Input type="number" min={0} value={form.beneficiary_age} onChange={(e) => patch({ beneficiary_age: e.target.value })} className="h-10 rounded-xl" />
          </Field>
          <Field label="المحافظة">
            <Input value={form.governorate} onChange={(e) => patch({ governorate: e.target.value })} className="h-10 rounded-xl" />
          </Field>
          <Field label="المدينة / المركز">
            <div className="flex gap-1.5">
              <Input value={form.city} onChange={(e) => patch({ city: e.target.value })} list="case-cities" className="h-10 flex-1 rounded-xl" />
              <datalist id="case-cities">
                {DAKAHLIA_CITIES.map((c) => <option key={c.slug} value={c.ar} />)}
              </datalist>
              <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={detectCity} title="أقرب مدينة لموقعي">
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              </Button>
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon={<HandCoins className="h-4 w-4 text-primary" />} title="التمويل">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="المبلغ المطلوب (ج.م) *">
            <Input type="number" min={0} value={form.needed_amount} onChange={(e) => patch({ needed_amount: Number(e.target.value) })} className="h-10 rounded-xl" />
          </Field>
          <Field label="تم جمعه" hint="بيتحسب تلقائياً من التبرعات المدفوعة.">
            <Input value={formatNumberEN(raised)} disabled className="h-10 rounded-xl" />
          </Field>
          <Field label="آخر موعد">
            <Input type="date" value={form.deadline} onChange={(e) => patch({ deadline: e.target.value })} className="h-10 rounded-xl" />
          </Field>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>تقدم التمويل</span>
            <span className="text-primary">{pct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<ImageIcon className="h-4 w-4 text-primary" />} title="الصورة الرئيسية">
        <ImageUrlField label="صورة الحالة" value={form.cover_image_url} aspect="wide" collection="cases"
          onChange={(v) => patch({ cover_image_url: v })}
          hint="بتظهر في كارت الحالة وصفحتها وفي معاينة واتساب وفيسبوك. لو فاضية بتظهر صورة عامة حسب التصنيف." />
      </SectionCard>

      {form.status === "rejected" && form.rejection_reason && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs">
          <h3 className="mb-1 font-black text-destructive">سبب الرفض</h3>
          <p>{form.rejection_reason}</p>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin/cases" className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/80" aria-label="رجوع لكل الحالات">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <div className="min-w-0">
              {!isNew && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{code}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold ${st.tone}`}>{isAr ? st.ar : st.en}</span>
                </div>
              )}
              <h1 className="truncate text-lg font-black text-primary">{isNew ? "حالة جديدة" : form.title || row?.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isNew && code && (
              <a href={publicUrls.case(code)} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-secondary/20 px-3 py-1.5 text-xs font-extrabold text-primary hover:bg-secondary/30">
                <ExternalLink className="h-3.5 w-3.5" />{isPublic ? "الصفحة العامة" : "معاينة (غير منشورة)"}
              </a>
            )}
            <Button onClick={save} disabled={saving} className="bg-orange-grad text-accent-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isNew ? "إنشاء الحالة" : "حفظ"}
            </Button>
          </div>
        </div>

        {isNew ? (
          dataTab
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard accent label="نسبة التمويل" value={`${pct}%`} sub={`${formatNumberEN(raised)} / ${formatNumberEN(form.needed_amount)} ج.م`} />
              <StatCard label="تبرعات مدفوعة" value={paid.length} sub={`${formatNumberEN(paidTotal)} ج.م`} />
              <StatCard label="كل محاولات التبرع" value={donations.length} />
              <StatCard label="تحديثات وصور" value={updates.length + mediaCount} />
            </div>

            {/* Status actions */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-soft">
              <span className="text-xs font-bold text-muted-foreground">حالة النشر:</span>
              {STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => void changeStatus(s)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${form.status === s ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                  {STATUS_LABELS[s].ar}
                </button>
              ))}
              <div className="ms-auto">
                <button type="button" onClick={() => void remove()} className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/20">
                  <Trash2 className="h-3.5 w-3.5" />حذف
                </button>
              </div>
            </div>

            <Tabs value={tab} onValueChange={setTab} dir="rtl">
              <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-2xl bg-muted/60 p-1">
                <TabsTrigger value="data" className="text-xs font-bold">البيانات</TabsTrigger>
                <TabsTrigger value="updates" className="text-xs font-bold">تحديثات الأثر ({updates.length})</TabsTrigger>
                <TabsTrigger value="media" className="text-xs font-bold">الصور والفيديو ({mediaCount})</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs font-bold">المستندات ({docs.length})</TabsTrigger>
                <TabsTrigger value="donations" className="text-xs font-bold">التبرعات ({donations.length})</TabsTrigger>
                <TabsTrigger value="share" className="text-xs font-bold">المشاركة والسيو</TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="mt-4">{dataTab}</TabsContent>

              <TabsContent value="updates" className="mt-4 space-y-4">
                <SectionCard icon={<MessageSquarePlus className="h-4 w-4 text-primary" />} title="تحديثات الأثر"
                  description="كل تحديث بيظهر فوراً في صفحة الحالة وفي مسارها. صور التحديثات بتتضغط تلقائياً.">
                  <div className="space-y-2 rounded-xl bg-muted/30 p-3">
                    <Textarea value={updBody} onChange={(e) => setUpdBody(e.target.value)} rows={3} placeholder="اكتب اللي حصل في الحالة…" className="rounded-xl text-sm" />
                    <div className="flex flex-wrap items-center gap-2">
                      <input ref={updFileInput} type="file" accept="image/*" className="hidden" onChange={(e) => void onPickUpdateImage(e.target.files?.[0] ?? null)} />
                      <Button type="button" variant="outline" size="sm" onClick={() => updFileInput.current?.click()} disabled={uploadingUpdImg} className="h-9 gap-1 rounded-xl text-xs">
                        {uploadingUpdImg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} رفع صورة
                      </Button>
                      <Input value={updImg} onChange={(e) => setUpdImg(e.target.value)} placeholder="أو الصق رابط صورة" dir="ltr" className="h-9 min-w-[12rem] flex-1 rounded-xl text-xs" />
                      {updImg && (
                        <button type="button" onClick={() => setUpdImg("")} className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-bold text-destructive">
                          <X className="h-3.5 w-3.5" />إزالة
                        </button>
                      )}
                    </div>
                    {updImg && <img src={updImg} alt="" loading="lazy" className="max-h-40 w-full rounded-md object-cover" />}
                    <Button onClick={() => void postUpdate()} disabled={postingUpd || !updBody.trim()} className="bg-orange-grad text-accent-foreground">
                      {postingUpd && <Loader2 className="h-4 w-4 animate-spin" />}نشر التحديث
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {updates.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">لسه مفيش تحديثات. أول تحديث بيظهر فوراً في صفحة الحالة.</p>
                    ) : updates.map((u) => (
                      <div key={u.id} className="rounded-xl border border-border bg-background p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold text-muted-foreground">{new Date(u.created_at).toLocaleString("ar-EG")}</p>
                          {editingUpd !== u.id && (
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => { setEditingUpd(u.id); setEditDraft({ body: u.body, image_url: u.image_url || "" }); }}
                                className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-muted/70" aria-label="تعديل"><Pencil className="h-3.5 w-3.5" /></button>
                              <button type="button" onClick={() => void removeUpd(u.id)}
                                className="grid h-7 w-7 place-items-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20" aria-label="حذف"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          )}
                        </div>
                        {editingUpd === u.id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea value={editDraft.body} rows={3} onChange={(e) => setEditDraft({ ...editDraft, body: e.target.value })} className="rounded-xl text-sm" />
                            <Input value={editDraft.image_url} dir="ltr" onChange={(e) => setEditDraft({ ...editDraft, image_url: e.target.value })} placeholder="رابط صورة" className="rounded-xl" />
                            <div className="flex gap-2">
                              <Button onClick={() => void saveEditUpd()} className="h-8 bg-orange-grad text-xs text-accent-foreground"><Save className="h-3.5 w-3.5" />حفظ</Button>
                              <Button variant="outline" onClick={() => setEditingUpd(null)} className="h-8 text-xs">إلغاء</Button>
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
                </SectionCard>

                <SectionCard icon={<RouteIcon className="h-4 w-4 text-primary" />} title="مسار الحالة كما يراه المتبرع"
                  description="بيتبني تلقائياً من حالة النشر والتحديثات: تسجيل → اعتماد → تحديثات الميدان → اكتمال.">
                  {journey.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground">المسار هيظهر بعد اعتماد الحالة.</p>
                  ) : (
                    <ol className="space-y-2 border-s-2 border-primary/20 ps-4">
                      {journey.map((s) => (
                        <li key={s.id} className="text-xs">
                          <b className="text-primary">{s.title_ar}</b>
                          <span className="ms-2 text-muted-foreground">{s.occurred_at ? new Date(s.occurred_at).toLocaleDateString("ar-EG") : ""}</span>
                          {s.note_ar && <p className="mt-0.5 line-clamp-2 text-muted-foreground">{s.note_ar}</p>}
                        </li>
                      ))}
                    </ol>
                  )}
                </SectionCard>
              </TabsContent>

              <TabsContent value="media" className="mt-4">
                {row && <CaseMediaManager caseId={row.id} />}
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <SectionCard icon={<FileText className="h-4 w-4 text-primary" />} title="المستندات"
                  description="تقارير طبية، بحث اجتماعي، فواتير وإيصالات صرف (PDF أو صورة، حتى 10 ميجا). المستند الخاص بيشوفه فريق العمل بس؛ العام بيظهر في صفحة الحالة كدليل ثقة.">
                  <div className="space-y-3 rounded-xl bg-muted/30 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="الملف">
                        <input ref={docFileInput} type="file" accept="application/pdf,image/jpeg,image/png,image/webp"
                          onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                          className="block w-full text-xs file:me-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary-foreground" />
                      </Field>
                      <Field label="نوع المستند">
                        <ChoiceSelect value={docType} onChange={setDocType} ariaLabel="نوع المستند" options={DOC_TYPES} />
                      </Field>
                    </div>
                    <Field label="وصف مختصر">
                      <Input value={docCaption} onChange={(e) => setDocCaption(e.target.value)} placeholder="مثلاً: تقرير مستشفى المنصورة الجامعي" className="h-10 rounded-xl" />
                    </Field>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-xs font-bold">
                        <Switch checked={docPublic} onCheckedChange={setDocPublic} />
                        يظهر للزوار (اتأكد إنه مفيهوش بيانات شخصية)
                      </label>
                      <Button onClick={() => void uploadDoc()} disabled={!docFile || uploadingDoc} className="gap-1 rounded-xl">
                        {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} رفع المستند
                      </Button>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs">
                    {docs.length === 0 ? (
                      <li className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">لا توجد مستندات.</li>
                    ) : docs.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-2.5">
                        <a href={d.storage_path} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-bold hover:text-primary">
                          {d.caption || DOC_TYPES.find((t) => t.value === d.doc_type)?.label || d.doc_type}
                        </a>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.is_public ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                          {d.is_public ? "عام" : "خاص"}
                        </span>
                        <button type="button" onClick={() => void removeDoc(d.id)} className="grid h-7 w-7 place-items-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20" aria-label="حذف المستند">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </TabsContent>

              <TabsContent value="donations" className="mt-4">
                <SectionCard icon={<HandCoins className="h-4 w-4 text-primary" />} title={`التبرعات (${donations.length})`}
                  description="كل محاولات التبرع للحالة دي. «مدفوع» بس هو اللي بيتحسب في المبلغ المجموع.">
                  <div className="space-y-2">
                    {donations.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">لا تبرعات بعد — شارك الحالة من تبويب «المشاركة والسيو».</p>
                    ) : donations.map((d) => (
                      <Link key={d.id} to={`/admin/donations/${d.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-2.5 text-xs hover:border-primary/40">
                        <div className="min-w-0">
                          <div className="font-bold">{d.donor_name || "فاعل خير"}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{d.ref_code} · {new Date(d.created_at).toLocaleDateString("ar-EG")}</div>
                        </div>
                        <span className="font-extrabold text-primary">{formatNumberEN(Number(d.amount))} {d.currency}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          d.payment_status === "paid" ? "bg-primary/15 text-primary" : d.payment_status === "pending" ? "bg-amber-500/15 text-amber-700" : "bg-destructive/10 text-destructive"
                        }`}>{d.payment_status === "paid" ? "مدفوع" : d.payment_status === "pending" ? "معلق" : d.payment_status}</span>
                      </Link>
                    ))}
                  </div>
                </SectionCard>
              </TabsContent>

              <TabsContent value="share" className="mt-4 space-y-4">
                {code ? (
                  <>
                    <CaseShareBox code={code} title={form.title} status={String(form.status)} neededAmount={form.needed_amount} raisedAmount={raised} />
                    <CaseSeoPanel code={code} title={form.title} story={form.story} coverImage={form.cover_image_url}
                      status={String(form.status)} categoryId={form.category_id} hasLocation={!!(form.governorate && form.city)}
                      updatesCount={updates.length} mediaCount={mediaCount} />
                  </>
                ) : (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">احفظ الحالة الأول عشان يتعملها رابط.</p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
