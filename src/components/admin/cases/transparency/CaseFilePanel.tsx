import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, BadgeCheck, ClipboardList, History, Loader2, ReceiptText, Save, ShieldCheck, Trash2, UserRound, UserRoundCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { askConfirm } from "@/components/common/confirm";
import { ChoiceSelect, Field, SectionCard } from "@/components/admin/programs/FormKit";
import { EvidencePhotos } from "@/components/impact/EvidencePhotos";
import { PhotoStrip } from "@/components/impact/PhotoViewer";
import { caseFileApi, fetchCaseFile, type CaseFile, type CaseResult } from "@/data/api/impactApi";
import { formatServerImageUrl } from "@/data/laravelApi";
import { CASE_RESULT, formatDay, todayISO, egp } from "@/lib/impactLabels";
import { notifyError, toast } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { CaseItems } from "./CaseItems";

const money = (n: number) => egp(n, "ar");

/**
 * «ملف الشفافية» of a case on the dashboard: the money (collected / planned / spent / left), who
 * follows the case, every spending line with receipts and photos, how it ended, and the change log.
 * The same file (without staff details) is what visitors see on the case page.
 */
export function CaseFilePanel({ caseId, publicUrl }: { caseId: number; publicUrl?: string }) {
  const qc = useQueryClient();
  const key = ["case-file", caseId];
  const { data: file, isLoading, error } = useQuery({ queryKey: key, queryFn: () => fetchCaseFile(caseId, { fresh: true }) });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ["case-history", caseId] });
  };
  const put = (f: CaseFile) => {
    qc.setQueryData(key, f);
    void qc.invalidateQueries({ queryKey: ["case-history", caseId] });
  };

  if (isLoading) {
    return <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted" />)}</div>;
  }
  if (error || !file) {
    return <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center text-xs font-bold text-destructive">ملف الشفافية ما اتحملش. اتأكد إن السيرفر متحدث وجرّب تاني.</p>;
  }

  return (
    <div className="space-y-4">
      <MoneySummary file={file} publicUrl={publicUrl} />
      <SectionCard icon={<UserRoundCheck className="h-4 w-4 text-primary" />} title="مسؤول المتابعة"
        description="عضو من الفريق مسؤول عن الحالة لحد ما تخلص: بيسجّل البنود والإيصالات والصور. بيوصله إشعار لما يتعيّن، والزوار بيشوفوا اسمه الأول وصورته بس.">
        <FollowerEditor caseId={caseId} file={file} onSaved={put} />
      </SectionCard>
      <SectionCard icon={<ReceiptText className="h-4 w-4 text-primary" />} title={`بنود الصرف (${file.items.length})`}
        description="كل بند بتكلفته المتوقعة، وبعد الشراء بالمدفوع فعلاً وصورة الإيصال، وبعد التسليم بصورة التسليم. ده اللي بيظهر للمتبرعين في صفحة الحالة.">
        <CaseItems caseId={caseId} items={file.items} onChanged={refresh} />
      </SectionCard>
      <SectionCard icon={<BadgeCheck className="h-4 w-4 text-primary" />} title="نتيجة الحالة"
        description="لما الحالة تخلص (أو تتلغي أو فلوسها تتحول): اكتب حصل إيه، وحط صورة قبل وبعد. بتظهر في صفحة الحالة وتقرير الأثر.">
        <OutcomeEditor caseId={caseId} file={file} onSaved={put} />
      </SectionCard>
      <CaseHistory caseId={caseId} />
    </div>
  );
}

/* ── money ────────────────────────────────────────────────────────────────── */

function MoneySummary({ file, publicUrl }: { file: CaseFile; publicUrl?: string }) {
  const t = file.totals;
  const spentPct = t.collected > 0 ? Math.min(100, Math.round((t.spent / t.collected) * 100)) : 0;
  const warnings: string[] = [];
  if (!file.follower) warnings.push("الحالة ملهاش مسؤول متابعة لسه.");
  if (t.spent > t.collected) warnings.push(`المصروف أكبر من المتجمع بـ ${money(t.spent - t.collected)} — اتأكد من الأرقام أو اكتب في ملاحظة البند مين غطّى الفرق.`);
  if (t.target > 0 && t.budget > t.target) warnings.push(`مجموع البنود (${money(t.budget)}) أكبر من المبلغ المطلوب للحالة (${money(t.target)}).`);
  if (t.items.purchased + t.items.delivered > 0 && file.items.some((i) => (i.status === "purchased" || i.status === "delivered") && !i.receipt_url)) {
    warnings.push("فيه بنود اتشترت من غير صورة إيصال.");
  }

  const cells = [
    { label: "المطلوب", value: money(t.target) },
    { label: "اتجمع", value: money(t.collected), sub: t.funded_pct !== null ? `${t.funded_pct}%` : undefined, tone: "text-primary" },
    { label: "اتصرف", value: money(t.spent), sub: `${t.items.purchased + t.items.delivered} من ${t.items.all} بند`, tone: "text-emerald-700" },
    { label: "الرصيد", value: money(t.balance), tone: t.balance < 0 ? "text-destructive" : "text-foreground" },
  ];

  return (
    <div className="space-y-3 rounded-3xl border border-border/80 bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-black"><ShieldCheck className="h-4 w-4 text-secondary" />ملف الشفافية</h2>
        {publicUrl && <a href={publicUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-primary hover:underline">شوفه زي المتبرع ↗</a>}
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label} className="rounded-2xl bg-muted/50 p-3">
            <p className="text-[11px] font-bold text-muted-foreground">{c.label}</p>
            <p className={cn("mt-0.5 text-[15px] font-black tabular-nums", c.tone)}>{c.value}</p>
            {c.sub && <p className="text-[10.5px] font-semibold text-muted-foreground">{c.sub}</p>}
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-[10.5px] font-bold text-muted-foreground">
          <span>اتصرف {spentPct}% من اللي اتجمع</span>
          {t.budget > 0 && <span>البنود: {money(t.budget)}</span>}
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={spentPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-secondary transition-all" style={{ width: `${spentPct}%` }} />
        </div>
      </div>
      {warnings.length > 0 && (
        <ul className="space-y-1">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] font-bold text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── follower ─────────────────────────────────────────────────────────────── */

function Avatar({ name, url, size = 40 }: { name: string; url?: string; size?: number }) {
  return url ? (
    <img src={formatServerImageUrl(url) || url} alt="" className="shrink-0 rounded-full object-cover ring-2 ring-secondary/30" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-secondary/15 font-black text-primary" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {name.trim().charAt(0) || <UserRound className="h-4 w-4" />}
    </span>
  );
}

function FollowerEditor({ caseId, file, onSaved }: { caseId: number; file: CaseFile; onSaved: (f: CaseFile) => void }) {
  const team = useQuery({ queryKey: ["impact-team"], queryFn: () => caseFileApi.team(), staleTime: 60_000 });
  const current = file.follower?.user ?? null;
  const [userId, setUserId] = useState(current?.id ? String(current.id) : "");
  const [note, setNote] = useState(file.follower?.note ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setUserId(current?.id ? String(current.id) : "");
    setNote(file.follower?.note ?? "");
  }, [current?.id, file.follower?.note]);

  const save = async (id: number | null) => {
    setSaving(true);
    try {
      onSaved(await caseFileApi.setFollower(caseId, id, note));
      toast.success(id ? "اتعيّن مسؤول المتابعة" : "اتشال مسؤول المتابعة", id ? { description: "وصله إشعار برابط الحالة." } : undefined);
    } catch (err) {
      notifyError(err, "ما اتحفظش");
    } finally {
      setSaving(false);
    }
  };

  const changed = userId !== (current?.id ? String(current.id) : "") || note !== (file.follower?.note ?? "");

  return (
    <div className="space-y-3">
      {current ? (
        <div className="flex items-center gap-3 rounded-2xl bg-secondary/10 p-3">
          <Avatar name={current.name} url={current.avatar_url} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{current.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{file.follower?.since ? `بيتابع من ${formatDay(file.follower.since, "ar")}` : ""}{current.email ? ` · ${current.email}` : ""}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" disabled={saving}
            onClick={async () => { if (await askConfirm(`نشيل ${current.name} من متابعة الحالة؟`)) void save(null); }}
            className="h-8 text-[11px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />شيل
          </Button>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-3 text-[11.5px] font-bold text-amber-900">مفيش حد مسؤول عن الحالة دي. اختار عضو من الفريق.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label={current ? "غيّر المسؤول" : "المسؤول"}>
          <ChoiceSelect
            value={userId}
            onChange={setUserId}
            ariaLabel="مسؤول المتابعة"
            placeholder={team.isLoading ? "بنحمّل الفريق…" : "اختار عضو"}
            disabled={team.isLoading || saving}
            options={(team.data ?? []).map((m) => ({ value: String(m.id), label: `${m.name}${m.following ? ` · بيتابع ${m.following}` : ""}` }))}
          />
        </Field>
        <Field label="ملاحظة له (اختياري)">
          <Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: زيارة البيت قبل الشراء" className="h-10 rounded-xl" />
        </Field>
        <Button type="button" disabled={!userId || !changed || saving} onClick={() => void save(Number(userId))} className="h-10 rounded-xl bg-orange-grad font-bold text-accent-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}حفظ
        </Button>
      </div>
      {team.error && <p className="text-[11px] font-bold text-destructive">قائمة الفريق ما اتحملتش (محتاجة صلاحية تعديل الحالات).</p>}
    </div>
  );
}

/* ── outcome ──────────────────────────────────────────────────────────────── */

function OutcomeEditor({ caseId, file, onSaved }: { caseId: number; file: CaseFile; onSaved: (f: CaseFile) => void }) {
  const o = file.outcome;
  const [editing, setEditing] = useState(!o);
  const [result, setResult] = useState<CaseResult>(o?.result ?? "completed");
  const [summary, setSummary] = useState(o?.summary ?? "");
  const [before, setBefore] = useState<string[]>(o?.before_url ? [o.before_url] : []);
  const [after, setAfter] = useState<string[]>(o?.after_url ? [o.after_url] : []);
  const [transfer, setTransfer] = useState(o?.transfer_note ?? "");
  const [day, setDay] = useState(o?.completed_on ?? todayISO());
  const [markDone, setMarkDone] = useState(true);
  const [busyBefore, setBusyBefore] = useState(false);
  const [busyAfter, setBusyAfter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Re-sync only when the saved outcome really changes (not on every refetch of the file).
  const savedKey = o ? JSON.stringify(o) : "";
  useEffect(() => setEditing(!savedKey), [savedKey]);

  const save = async () => {
    if (!summary.trim()) return setError("اكتب ملخص النتيجة.");
    if (result !== "completed" && !transfer.trim()) return setError("اكتب الفلوس راحت فين (لحالة تانية / برنامج / اترجعت للمتبرعين).");
    setError("");
    setSaving(true);
    try {
      onSaved(await caseFileApi.saveOutcome(caseId, {
        result, summary, before_url: before[0], after_url: after[0], transfer_note: transfer, completed_on: day, mark_case_completed: result === "completed" && markDone,
      }));
      toast.success("اتسجلت نتيجة الحالة");
      setEditing(false);
    } catch (err) {
      notifyError(err, "النتيجة ما اتحفظتش");
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!(await askConfirm("نشيل نتيجة الحالة؟\nحالة النشر مش بتتغير — غيّرها بنفسك لو محتاج."))) return;
    try {
      onSaved(await caseFileApi.clearOutcome(caseId));
      toast.success("اتشالت النتيجة");
    } catch (err) {
      notifyError(err, "ما اتشالتش");
    }
  };

  if (o && !editing) {
    const r = CASE_RESULT[o.result];
    const photos = [o.before_url, o.after_url].filter(Boolean) as string[];
    return (
      <div className="space-y-2 rounded-2xl bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-black", r.tone)}>{r.ar}</span>
          {o.completed_on && <span className="text-[11px] font-bold text-muted-foreground">{formatDay(o.completed_on, "ar")}</span>}
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed">{o.summary}</p>
        {o.transfer_note && <p className="rounded-xl bg-sky-50 px-3 py-2 text-[11.5px] font-bold text-sky-900">الفلوس راحت فين: {o.transfer_note}</p>}
        {photos.length > 0 && <PhotoStrip photos={photos} lang="ar" caption="قبل وبعد" />}
        <div className="flex gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8 rounded-lg text-[11px] font-bold">تعديل</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => void clear()} className="h-8 rounded-lg text-[11px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive">شيل النتيجة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5 sm:grid-cols-3">
        {(Object.keys(CASE_RESULT) as CaseResult[]).map((k) => (
          <button key={k} type="button" onClick={() => setResult(k)} aria-pressed={result === k}
            className={cn("rounded-2xl border p-2.5 text-start transition", result === k ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50")}>
            <span className="block text-xs font-black">{CASE_RESULT[k].ar}</span>
            <span className="block text-[10.5px] text-muted-foreground">{CASE_RESULT[k].descAr}</span>
          </button>
        ))}
      </div>
      <Field label="حصل إيه؟">
        <Textarea rows={3} maxLength={2000} value={summary} onChange={(e) => setSummary(e.target.value)}
          placeholder={result === "completed" ? "مثلاً: اتشترت الأجهزة كلها واتسلّمت للعروسة يوم 12 نوفمبر، وفاضل 300 ج.م اتحولوا لحالة تانية." : "اكتب السبب باختصار."}
          className="rounded-xl" />
      </Field>
      {result !== "completed" && (
        <Field label="الفلوس راحت فين؟">
          <Input value={transfer} maxLength={500} onChange={(e) => setTransfer(e.target.value)} placeholder="مثلاً: اتحولت لحالة CASE-4471 (نفس القرية)" className="h-10 rounded-xl" />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="صورة قبل"><EvidencePhotos value={before} onChange={setBefore} max={1} lang="ar" onBusyChange={setBusyBefore} addLabel="قبل" /></Field>
        <Field label="صورة بعد"><EvidencePhotos value={after} onChange={setAfter} max={1} lang="ar" onBusyChange={setBusyAfter} addLabel="بعد" /></Field>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="التاريخ" className="w-44">
          <Input type="date" value={day} max={todayISO()} onChange={(e) => setDay(e.target.value)} className="h-10 rounded-xl" />
        </Field>
        {result === "completed" && (
          <label className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Checkbox checked={markDone} onCheckedChange={(v) => setMarkDone(v === true)} />علّم الحالة «مكتملة» في الموقع
          </label>
        )}
      </div>
      {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" onClick={() => void save()} disabled={saving || busyBefore || busyAfter} className="rounded-xl bg-orange-grad font-bold text-accent-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{busyBefore || busyAfter ? "استنى الصور…" : "حفظ النتيجة"}
        </Button>
        {o && <Button type="button" variant="outline" onClick={() => setEditing(false)} className="rounded-xl">إلغاء</Button>}
      </div>
    </div>
  );
}

/* ── history ──────────────────────────────────────────────────────────────── */

function CaseHistory({ caseId }: { caseId: number }) {
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["case-history", caseId], queryFn: () => caseFileApi.history(caseId), enabled: open });
  return (
    <SectionCard icon={<History className="h-4 w-4 text-primary" />} title="سجل التعديلات"
      description="كل تعديل في البنود والمسؤول والنتيجة: مين عمله وإمتى. ما بيتمسحش."
      actions={<Button type="button" size="sm" variant="outline" onClick={() => setOpen((v) => !v)} className="h-8 rounded-lg text-[11px] font-bold">{open ? "اخفي" : "اعرض"}</Button>}>
      {open && (
        q.isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          : q.error ? <p className="text-center text-xs font-bold text-destructive">السجل ما اتحملش.</p>
          : !q.data?.length ? <p className="text-center text-xs text-muted-foreground">لسه مفيش تعديلات.</p>
          : (
            <ol className="space-y-2 border-s-2 border-primary/15 ps-3">
              {q.data.map((h) => (
                <li key={h.id} className="text-xs">
                  <p className="font-bold leading-relaxed">{h.summary || h.action}</p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {h.by ? `${h.by} · ` : ""}{h.at ? new Date(h.at).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : ""}
                  </p>
                </li>
              ))}
            </ol>
          )
      )}
      {!open && <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><ClipboardList className="h-3.5 w-3.5" />اضغط «اعرض» علشان تشوف السجل.</p>}
    </SectionCard>
  );
}
