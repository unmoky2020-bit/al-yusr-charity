import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BellRing, CheckCircle2, Globe2, Loader2, PackageCheck, Search, TriangleAlert } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ChoiceSelect, Field } from "@/components/admin/programs/FormKit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EvidencePhotos } from "@/components/impact/EvidencePhotos";
import {
  distributionsApi, newClientKey, type DistributionCandidate, type DistributionResult, type ImpactKind, type SkipReason,
} from "@/data/api/impactApi";
import { useImpactTargets } from "@/data/api/impactTargets";
import { DAKAHLIA_CITIES } from "@/data/dakahliaCities";
import type { DeliveryLineStage } from "@/lib/deliveryJourney";
import { DISTRIBUTION_STAGE, KIND_LABEL, formatDay, todayISO, egp } from "@/lib/impactLabels";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;
const STEPS: { n: Step; ar: string }[] = [
  { n: 1, ar: "إيه اللي اتعمل" },
  { n: 2, ar: "التبرعات" },
  { n: 3, ar: "التفاصيل" },
  { n: 4, ar: "مراجعة" },
];
const STAGES: DeliveryLineStage[] = ["family_identified", "preparing", "delivered", "on_hold"];
const SKIP: Record<SkipReason, string> = { not_paid: "مش مدفوع", already_there: "عدّى الخطوة دي", not_found: "مش موجود" };
const stageName = (s: string | null) => (s && s in DISTRIBUTION_STAGE ? DISTRIBUTION_STAGE[s as DeliveryLineStage].doneAr : "لسه مفيش خطوات");

/**
 * «تسجيل يوم توزيع»: one entry moves many paid donations a step at once (every donor sees the day,
 * its place and photos in their own log, and gets a notification). Four short steps; saving twice
 * by mistake is harmless (the same key returns the first result).
 */
export default function AdminDistributionNew() {
  const nav = useNavigate();
  const targets = useImpactTargets();
  const [step, setStep] = useState<Step>(1);
  // 1 — what happened
  const [kind, setKind] = useState<ImpactKind | "all">("program");
  const [targetId, setTargetId] = useState("");
  const [stage, setStage] = useState<DeliveryLineStage>("delivered");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  // 2 — donations
  // Every eligible donation is chosen unless the person unticks it.
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  // 3 — details
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(todayISO());
  const [governorate, setGovernorate] = useState("الدقهلية");
  const [city, setCity] = useState("");
  const [families, setFamilies] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photosBusy, setPhotosBusy] = useState(false);
  const [notify, setNotify] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  // 4 — save
  const clientKey = useRef(newClientKey());
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<DistributionResult | null>(null);
  const [error, setError] = useState("");

  const options = kind === "all" ? [] : targets.data?.[kind] ?? [];
  const target = options.find((o) => String(o.id) === targetId);
  const ready1 = kind === "all" || !!targetId;

  const candidates = useQuery({
    queryKey: ["dist-candidates", kind, targetId, stage, from, to],
    queryFn: () => distributionsApi.candidates({
      ...(kind !== "all" ? { target_kind: kind, target_id: Number(targetId) } : {}),
      stage, from: from || undefined, to: to || undefined,
    }),
    enabled: step >= 2 && ready1,
  });

  const rows = useMemo(() => candidates.data?.rows ?? [], [candidates.data]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => `${r.reference ?? ""} ${r.donor ?? ""} ${r.amount}`.toLowerCase().includes(q)) : rows;
  }, [rows, search]);
  const eligible = rows.filter((r) => r.eligible);
  const chosen = eligible.filter((r) => !excluded.has(r.id));
  const total = chosen.reduce((s, r) => s + r.amount, 0);

  const toggle = (id: number) => setExcluded((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  const suggestTitle = () => {
    if (title.trim()) return;
    const what = target?.name ?? "تبرعات";
    setTitle(`${DISTRIBUTION_STAGE[stage].ar} — ${what}${city ? ` — ${city}` : ""}`);
  };

  const can = (s: Step) =>
    s === 2 ? ready1
      : s === 3 ? ready1 && chosen.length > 0
      : s === 4 ? ready1 && chosen.length > 0 && !!title.trim() && !!day && (stage !== "on_hold" || !!note.trim()) && !photosBusy
      : true;

  const go = (s: Step) => {
    if (s === 3) suggestTitle();
    setError("");
    setStep(s);
    window.scrollTo({ top: 0 });
    document.querySelector("main")?.scrollTo({ top: 0 });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await distributionsApi.create({
        client_key: clientKey.current,
        title: title.trim(),
        happened_on: day,
        governorate: governorate.trim() || undefined,
        city: city.trim() || undefined,
        stage,
        note: note.trim() || undefined,
        families_count: families ? Math.max(0, Math.round(Number(families))) : undefined,
        ...(kind !== "all" ? { target_kind: kind, target_id: Number(targetId) } : {}),
        donation_ids: chosen.map((r) => r.id),
        photos,
        notify,
        is_public: isPublic,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ما اتسجلش");
      notifyError(err, "يوم التوزيع ما اتسجلش");
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    clientKey.current = newClientKey();
    setResult(null);
    setExcluded(new Set());
    setTitle("");
    setNote("");
    setPhotos([]);
    setFamilies("");
    setStep(1);
  };

  if (result) {
    return (
      <AdminLayout title={{ ar: "يوم توزيع جديد", en: "New distribution day" }}>
        <div className="mx-auto max-w-xl space-y-4" dir="rtl">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="mt-2 text-lg font-black text-emerald-900">{result.repeated ? "اليوم ده اتسجل قبل كده" : "اتسجل يوم التوزيع"}</h1>
            <p className="mt-1 text-sm font-bold text-emerald-800">
              {result.repeated ? "المحاولة الأولى كانت وصلت — ما اتكررش حاجة." : `${result.applied} تبرع اتسجلت لهم خطوة «${DISTRIBUTION_STAGE[stage].doneAr}»${notify ? " ووصل لأصحابها إشعار" : ""}.`}
            </p>
          </div>
          {result.skipped.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-black text-amber-900"><TriangleAlert className="h-4 w-4" />{result.skipped.length} تبرع ما اتسجلش</p>
              <ul className="mt-2 space-y-1 text-[11.5px] text-amber-900">
                {result.skipped.slice(0, 30).map((s) => (
                  <li key={s.id}>تبرع #{s.id}: {SKIP[s.reason] ?? s.reason}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            <Button asChild className="rounded-xl bg-orange-grad font-bold text-accent-foreground"><Link to={`/admin/distributions/${result.row.id}`}>افتح اليوم</Link></Button>
            <Button type="button" variant="outline" onClick={restart} className="rounded-xl font-bold">سجّل يوم تاني</Button>
            <Button asChild variant="ghost" className="rounded-xl font-bold"><Link to="/admin/distributions">كل الأيام</Link></Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={{ ar: "يوم توزيع جديد", en: "New distribution day" }}>
      <div className="mx-auto max-w-3xl space-y-4 pb-24" dir="rtl">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
          <Link to="/admin/distributions" className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/80" aria-label="رجوع"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
          <div className="min-w-0">
            <h1 className="text-base font-black text-primary">تسجيل يوم توزيع</h1>
            <p className="text-[11px] text-muted-foreground">خطوة واحدة لكل التبرعات اللي اتوزعت مع بعض — كل متبرع بيشوفها في سجل تبرعه.</p>
          </div>
        </div>

        {/* steps */}
        <ol className="grid grid-cols-4 gap-1.5" aria-label="الخطوات">
          {STEPS.map((s) => (
            <li key={s.n}>
              <button type="button" disabled={s.n > step && !can(s.n)} onClick={() => s.n < step && go(s.n)}
                className={cn("w-full rounded-xl px-1 py-2 text-center text-[11px] font-bold transition",
                  s.n === step ? "bg-primary text-primary-foreground" : s.n < step ? "bg-secondary/15 text-primary" : "bg-muted text-muted-foreground")}
                aria-current={s.n === step ? "step" : undefined}>
                <span className="block text-[10px] opacity-70">{s.n}</span>{s.ar}
              </button>
            </li>
          ))}
        </ol>

        {step === 1 && (
          <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-4 shadow-card sm:p-5">
            <Field label="الخطوة اللي اتعملت">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STAGES.map((s) => (
                  <button key={s} type="button" onClick={() => setStage(s)} aria-pressed={stage === s}
                    className={cn("rounded-2xl border p-2.5 text-start transition", stage === s ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50")}>
                    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-black", DISTRIBUTION_STAGE[s].tone)}>{DISTRIBUTION_STAGE[s].ar}</span>
                    <span className="mt-1 block text-[10.5px] leading-snug text-muted-foreground">{DISTRIBUTION_STAGE[s].descAr}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="لتبرعات إيه؟">
              <div className="flex flex-wrap gap-1.5">
                {(["program", "project", "campaign", "case", "all"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => { setKind(k); setTargetId(""); }} aria-pressed={kind === k}
                    className={cn("rounded-full border px-3 py-1.5 text-xs font-bold transition", kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>
                    {k === "all" ? "كل التبرعات المدفوعة" : KIND_LABEL[k].ar}
                  </button>
                ))}
              </div>
            </Field>
            {kind !== "all" && (
              <Field label={`اختار ال${KIND_LABEL[kind].ar}`}>
                <ChoiceSelect value={targetId} onChange={setTargetId} ariaLabel={KIND_LABEL[kind].ar}
                  placeholder={targets.isLoading ? "بنحمّل…" : "اختار"} disabled={targets.isLoading}
                  options={options.map((o) => ({ value: String(o.id), label: o.name }))} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="تبرعات من تاريخ (اختياري)"><Input type="date" value={from} max={to || todayISO()} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-xl" /></Field>
              <Field label="لحد تاريخ (اختياري)"><Input type="date" value={to} min={from || undefined} max={todayISO()} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-xl" /></Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 rounded-3xl border border-border/80 bg-card p-4 shadow-card sm:p-5">
            {candidates.isLoading ? (
              <div className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />)}</div>
            ) : candidates.error ? (
              <p className="rounded-2xl bg-destructive/5 p-4 text-center text-xs font-bold text-destructive">التبرعات ما اتحملتش. جرّب تاني.</p>
            ) : rows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs font-bold text-muted-foreground">مفيش تبرعات مدفوعة هنا. غيّر الاختيار من الخطوة الأولى.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold">
                    {eligible.length} من {rows.length} تبرع ينفع ياخد «{DISTRIBUTION_STAGE[stage].ar}» · مختار <b className="text-primary">{chosen.length}</b> ({egp(total, "ar")})
                  </p>
                  <div className="flex gap-1.5">
                    <Button type="button" size="sm" variant="outline" onClick={() => setExcluded(new Set())} className="h-8 rounded-lg text-[11px] font-bold">اختار الكل</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setExcluded(new Set(eligible.map((r) => r.id)))} className="h-8 rounded-lg text-[11px] font-bold">ولا واحد</Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="دوّر برقم التبرع أو اسم المتبرع" className="h-10 rounded-xl ps-9" />
                </div>
                <ul className="max-h-[55dvh] space-y-1.5 overflow-y-auto pe-1">
                  {shown.map((r) => <CandidateRow key={r.id} r={r} checked={r.eligible && !excluded.has(r.id)} onToggle={() => toggle(r.id)} />)}
                </ul>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-4 shadow-card sm:p-5">
            <Field label="اسم اليوم" hint="بيظهر للمتبرعين في سجل تبرعهم.">
              <Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: توزيع كراتين الخير — بلقاس" className="h-10 rounded-xl" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="التاريخ"><Input type="date" value={day} max={todayISO()} onChange={(e) => setDay(e.target.value)} className="h-10 rounded-xl" /></Field>
              <Field label="عدد الأسر (اختياري)"><Input type="number" inputMode="numeric" min={0} value={families} onChange={(e) => setFamilies(e.target.value)} placeholder="مثلاً 40" className="h-10 rounded-xl" /></Field>
              <Field label="المحافظة"><Input value={governorate} maxLength={80} onChange={(e) => setGovernorate(e.target.value)} className="h-10 rounded-xl" /></Field>
              <Field label="المركز / القرية">
                <Input value={city} maxLength={80} list="dist-cities" onChange={(e) => setCity(e.target.value)} placeholder="مثلاً بلقاس" className="h-10 rounded-xl" />
                <datalist id="dist-cities">{DAKAHLIA_CITIES.map((c) => <option key={c.slug} value={c.ar} />)}</datalist>
              </Field>
            </div>
            <Field label={stage === "on_hold" ? "سبب التأجيل (لازم)" : "كلمة للمتبرعين (اختياري)"}>
              <Textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder={stage === "on_hold" ? "مثلاً: الطريق مقفول بسبب الأمطار، التسليم هيكون الأسبوع الجاي." : "مثلاً: اتوزعت 40 كرتونة على أسر القرية بحضور متطوعين."}
                className="rounded-xl" aria-invalid={stage === "on_hold" && !note.trim()} />
            </Field>
            <Field label="صور اليوم">
              <EvidencePhotos value={photos} onChange={setPhotos} lang="ar" onBusyChange={setPhotosBusy} />
            </Field>
            <div className="space-y-2 rounded-2xl bg-muted/40 p-3">
              <label className="flex items-center gap-2 text-xs font-bold"><Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} /><BellRing className="h-3.5 w-3.5" />ابعت إشعار لكل متبرع</label>
              <label className="flex items-center gap-2 text-xs font-bold"><Checkbox checked={isPublic} onCheckedChange={(v) => setIsPublic(v === true)} /><Globe2 className="h-3.5 w-3.5" />يظهر في تقرير الأثر العام (من غير أي أسماء)</label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 rounded-3xl border border-border/80 bg-card p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-black"><PackageCheck className="h-4 w-4 text-secondary" />راجع قبل التسجيل</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <Row k="الخطوة" v={<span className={cn("rounded-full px-2 py-0.5 text-[11px] font-black", DISTRIBUTION_STAGE[stage].tone)}>{DISTRIBUTION_STAGE[stage].ar}</span>} />
              <Row k="لـ" v={kind === "all" ? "كل التبرعات المدفوعة" : `${KIND_LABEL[kind].ar}: ${target?.name ?? ""}`} />
              <Row k="التبرعات" v={`${chosen.length} تبرع · ${egp(total, "ar")}`} />
              <Row k="اليوم" v={`${title} — ${formatDay(day, "ar")}`} />
              <Row k="المكان" v={[city, governorate].filter(Boolean).join("، ") || "—"} />
              <Row k="الأسر" v={families || "—"} />
              <Row k="الصور" v={`${photos.length}`} />
              <Row k="إشعار" v={notify ? `هيوصل لـ ${chosen.length} متبرع` : "من غير إشعار"} />
            </dl>
            {note && <p className="rounded-xl bg-muted/50 p-3 text-xs leading-relaxed">{note}</p>}
            <p className="text-[11px] text-muted-foreground">لو حصل غلط: تقدر تلغي اليوم من صفحته، وكل التبرعات بترجع لخطوتها اللي قبلها.</p>
            {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">{error}</p>}
          </div>
        )}

        {/* bottom bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:static md:z-auto md:border-0 md:bg-transparent md:p-0">
          <div className="mx-auto flex max-w-3xl gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => go((step - 1) as Step)} disabled={saving} className="h-11 rounded-xl font-bold">
                <ArrowRight className="h-4 w-4" />رجوع
              </Button>
            )}
            {step < 4 ? (
              <Button type="button" onClick={() => go((step + 1) as Step)} disabled={!can((step + 1) as Step)} className="h-11 flex-1 rounded-xl bg-primary font-bold">
                {step === 3 && photosBusy ? "استنى الصور تترفع…" : "التالي"}<ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={() => void save()} disabled={saving || !can(4)} className="h-11 flex-1 rounded-xl bg-orange-grad font-black text-accent-foreground shadow-cta">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}سجّل يوم التوزيع ({chosen.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
      <dt className="text-[11px] font-bold text-muted-foreground">{k}</dt>
      <dd className="min-w-0 truncate text-end text-xs font-extrabold">{v}</dd>
    </div>
  );
}

function CandidateRow({ r, checked, onToggle }: { r: DistributionCandidate; checked: boolean; onToggle: () => void }) {
  return (
    <li>
      <label className={cn("flex items-center gap-3 rounded-2xl border p-2.5 transition", !r.eligible ? "cursor-not-allowed border-border/50 bg-muted/30 opacity-60" : checked ? "cursor-pointer border-primary/40 bg-primary/5" : "cursor-pointer border-border hover:bg-muted/40")}>
        <Checkbox checked={checked} disabled={!r.eligible} onCheckedChange={onToggle} aria-label={`تبرع ${r.reference ?? r.id}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-extrabold">{r.donor || "فاعل خير"}</span>
          <span className="block truncate text-[10.5px] text-muted-foreground">
            <span dir="ltr" className="font-mono">{r.reference ?? `#${r.id}`}</span>
            {r.created_at && <> · {formatDay(r.created_at, "ar", false)}</>} · {r.eligible ? stageName(r.stage) : `عدّاها (${stageName(r.stage)})`}
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-black tabular-nums text-emerald-700">{egp(r.amount, "ar")}</span>
      </label>
    </li>
  );
}
