import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Globe2, Loader2, MapPin, Save, Trash2, Undo2, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Field, SectionCard } from "@/components/admin/programs/FormKit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { confirmAction } from "@/components/common/confirm";
import { EvidencePhotos } from "@/components/impact/EvidencePhotos";
import { distributionsApi } from "@/data/api/impactApi";
import type { DeliveryLineStage } from "@/lib/deliveryJourney";
import { DISTRIBUTION_STAGE, KIND_LABEL, formatDay, egp } from "@/lib/impactLabels";
import { notifyError, toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

/** One distribution day: what it was, its donations, editing its details, and undoing it. */
export default function AdminDistributionDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const key = ["distribution", Number(id)];
  const { data: d, isLoading, error } = useQuery({ queryKey: key, queryFn: () => distributionsApi.show(Number(id)), enabled: !!id });

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [city, setCity] = useState("");
  const [families, setFamilies] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!d) return;
    setTitle(d.title);
    setNote(d.note ?? "");
    setGovernorate(d.governorate ?? "");
    setCity(d.city ?? "");
    setFamilies(d.families_count ? String(d.families_count) : "");
    setPhotos(d.photos);
    setIsPublic(d.is_public);
  }, [d]);

  const save = async () => {
    if (!title.trim()) return toast.error("اكتب اسم اليوم");
    setSaving(true);
    try {
      await distributionsApi.update(Number(id), {
        title: title.trim(), note: note.trim() || null, governorate: governorate.trim() || null, city: city.trim() || null,
        families_count: families ? Math.max(0, Math.round(Number(families))) : 0, photos, is_public: isPublic,
      });
      toast.success("اتحفظ", { description: "التعديل بيظهر في التقرير العام. سجل المتبرعين بيفضل زي ما اتسجل يومها." });
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ["distributions"] });
    } catch (err) {
      notifyError(err, "ما اتحفظش");
    } finally {
      setSaving(false);
    }
  };

  const undo = async () => {
    if (!d) return;
    await confirmAction({
      tone: "danger",
      title: "نلغي يوم التوزيع ده؟",
      description: `الخطوة اللي اتسجلت لـ ${d.donations_count} تبرع هتتشال من سجلهم، وكل تبرع يرجع لخطوته اللي قبلها. الإشعارات اللي اتبعتت مش بترجع.`,
      subject: d.title,
      confirmLabel: "إلغاء اليوم",
      onConfirm: async () => {
        const msg = await distributionsApi.remove(d.id);
        toast.success(msg || "اتلغى يوم التوزيع");
        void qc.invalidateQueries({ queryKey: ["distributions"] });
        nav("/admin/distributions");
      },
    });
  };

  const st = d ? DISTRIBUTION_STAGE[d.stage] : null;

  return (
    <AdminLayout title={{ ar: "يوم توزيع", en: "Distribution day" }}>
      <div className="space-y-4" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin/distributions" className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted hover:bg-muted/80" aria-label="رجوع"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
            <div className="min-w-0">
              {st && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", st.tone)}>{st.ar}</span>}
              <h1 className="mt-0.5 truncate text-base font-black text-primary">{d?.title ?? "…"}</h1>
            </div>
          </div>
          {d && (
            <Button type="button" variant="outline" onClick={() => void undo()} className="h-9 gap-1 rounded-xl border-destructive/40 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Undo2 className="h-4 w-4" />إلغاء اليوم
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-muted" aria-busy="true" />
        ) : error || !d ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center text-xs font-bold text-destructive">اليوم ده مش موجود أو ما اتحملش.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Info icon={CalendarDays} label="التاريخ" value={formatDay(d.happened_on, "ar")} />
                <Info icon={MapPin} label="المكان" value={d.place || "—"} />
                <Info icon={Users} label="الأسر" value={d.families_count ? String(d.families_count) : "—"} />
                <Info icon={Globe2} label="للزوار" value={d.is_public ? "ظاهر" : "مخفي"} />
              </div>
              {d.target?.name && <p className="rounded-2xl bg-muted/40 px-3 py-2 text-xs font-bold">{KIND_LABEL[d.target.kind]?.ar}: {d.target.name}</p>}
              <SectionCard title="تعديل التفاصيل" description="الاسم والمكان والصور والملاحظة بتتعدل في التقرير العام. الخطوة نفسها والتبرعات مش بتتغير — لو التبرعات غلط، ألغي اليوم وسجّله تاني.">
                <div className="space-y-3">
                  <Field label="اسم اليوم"><Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="المحافظة"><Input value={governorate} maxLength={80} onChange={(e) => setGovernorate(e.target.value)} className="h-10 rounded-xl" /></Field>
                    <Field label="المركز / القرية"><Input value={city} maxLength={80} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-xl" /></Field>
                    <Field label="عدد الأسر"><Input type="number" inputMode="numeric" min={0} value={families} onChange={(e) => setFamilies(e.target.value)} className="h-10 rounded-xl" /></Field>
                  </div>
                  <Field label="الملاحظة"><Textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl" /></Field>
                  <Field label="الصور"><EvidencePhotos value={photos} onChange={setPhotos} lang="ar" onBusyChange={setPhotosBusy} /></Field>
                  <label className="flex items-center gap-2 text-xs font-bold"><Checkbox checked={isPublic} onCheckedChange={(v) => setIsPublic(v === true)} />يظهر في تقرير الأثر العام</label>
                  <Button type="button" onClick={() => void save()} disabled={saving || photosBusy} className="rounded-xl bg-orange-grad font-bold text-accent-foreground">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{photosBusy ? "استنى الصور…" : "حفظ"}
                  </Button>
                </div>
              </SectionCard>
            </div>
            <SectionCard title={`التبرعات (${d.donations.length})`} description="التبرعات اللي اتسجلت لها الخطوة دي. اضغط على أي تبرع تفتحه.">
              <ul className="max-h-[70dvh] space-y-1.5 overflow-y-auto">
                {d.donations.map((x) => (
                  <li key={x.id}>
                    <Link to={`/admin/donations/${x.id}`} className="flex items-center gap-3 rounded-2xl border border-border p-2.5 hover:border-primary/40">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-extrabold">{x.donor || "فاعل خير"}</span>
                        <span className="block truncate text-[10.5px] text-muted-foreground"><span dir="ltr" className="font-mono">{x.reference ?? `#${x.id}`}</span> · دلوقتي: {x.stage && x.stage in DISTRIBUTION_STAGE ? DISTRIBUTION_STAGE[x.stage as DeliveryLineStage].doneAr : "—"}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-black tabular-nums text-emerald-700">{egp(x.amount, "ar")}</span>
                    </Link>
                  </li>
                ))}
                {d.donations.length === 0 && <li className="flex items-center gap-2 rounded-2xl border border-dashed p-4 text-xs text-muted-foreground"><Trash2 className="h-4 w-4" />مفيش تبرعات مربوطة.</li>}
              </ul>
            </SectionCard>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-soft ring-1 ring-border/60">
      <p className="flex items-center gap-1 text-[10.5px] font-bold text-muted-foreground"><Icon className="h-3 w-3" />{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-black">{value}</p>
    </div>
  );
}
