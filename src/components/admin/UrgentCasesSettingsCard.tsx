import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import type { LaravelCase } from "@/data/laravelApi";
import { DEFAULT_URGENT_SETTINGS, urgentCasesApi, type UrgentCasesSettings } from "@/data/api/urgentCasesApi";
import { describeWriteError } from "@/data/api/backendPending";
import { ChoiceSelect, Field, SectionCard } from "@/components/admin/programs/FormKit";

/**
 * Settings for the homepage «حالات عاجلة» carousel: on/off, automatic (cases marked «عاجلة») or a
 * hand-picked ordered list, how many, and the heading.
 */
export function UrgentCasesSettingsCard({ cases }: { cases: LaravelCase[] }) {
  const [form, setForm] = useState<UrgentCasesSettings>(DEFAULT_URGENT_SETTINGS);
  const [shown, setShown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    urgentCasesApi
      .get({ fresh: true })
      .then((r) => { setForm(r.settings); setShown(r.cases.length); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const approved = useMemo(() => cases.filter((c) => c.status === "approved"), [cases]);
  const urgentCount = approved.filter((c) => c.priority === "high").length;
  const picked = form.case_ids.map((id) => approved.find((c) => Number(c.id) === id)).filter(Boolean) as LaravelCase[];

  const toggle = (id: number) =>
    setForm((f) => ({ ...f, case_ids: f.case_ids.includes(id) ? f.case_ids.filter((x) => x !== id) : [...f.case_ids, id] }));
  const move = (i: number, d: -1 | 1) =>
    setForm((f) => {
      const ids = [...f.case_ids];
      [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
      return { ...f, case_ids: ids };
    });

  const save = async () => {
    setSaving(true);
    try {
      const r = await urgentCasesApi.put({ ...form, limit: Math.max(1, Math.min(24, Number(form.limit) || 8)) });
      setForm(r.settings);
      setShown(r.cases.length);
      toast({ title: "تم حفظ كاروسيل الحالات العاجلة", description: `${r.cases.length} حالة هتظهر في الرئيسية` });
    } catch (e) {
      toast({ variant: "destructive", title: "لم يتم الحفظ", description: describeWriteError(e, "PUT /homepage/urgent-cases") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      icon={<AlertCircle className="h-4 w-4 text-destructive" />}
      title="كاروسيل «حالات عاجلة» في الرئيسية"
      description={loading ? "جاري التحميل…" : `ظاهر حالياً: ${shown} حالة. التلقائي بيعرض الحالات المعتمدة اللي أولويتها «عاجلة» (${urgentCount} حالة دلوقتي).`}
      actions={
        <Button type="button" size="sm" className="gap-1 rounded-xl" disabled={saving || loading} onClick={() => void save()}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Field label="الظهور">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold">
            <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
            {form.is_active ? "ظاهر في الرئيسية" : "مخفي"}
          </label>
        </Field>
        <Field label="طريقة الاختيار">
          <ChoiceSelect value={form.mode} onChange={(v) => setForm({ ...form, mode: v as UrgentCasesSettings["mode"] })}
            options={[{ value: "auto", label: "تلقائي — الحالات العاجلة" }, { value: "manual", label: "يدوي — أنا أختار" }]} />
        </Field>
        <Field label="عدد الحالات">
          <Input type="number" min={1} max={24} dir="ltr" value={form.limit} className="h-10 rounded-xl"
            onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })} />
        </Field>
        <Field label="العنوان">
          <Input value={form.title_ar ?? ""} className="h-10 rounded-xl" placeholder="حالات عاجلة محتاجة دعمك"
            onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
        </Field>
      </div>
      <Field label="سطر تحت العنوان (اختياري)">
        <Input value={form.subtitle_ar ?? ""} className="h-10 rounded-xl" onChange={(e) => setForm({ ...form, subtitle_ar: e.target.value })} />
      </Field>

      {form.mode === "manual" && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-border p-3">
            <p className="mb-2 text-xs font-black text-muted-foreground">الحالات المعتمدة — اختار اللي يظهر</p>
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {approved.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted">
                    <Switch checked={form.case_ids.includes(Number(c.id))} onCheckedChange={() => toggle(Number(c.id))} />
                    <span className="flex-1 truncate font-bold">{c.title}</span>
                    {c.priority === "high" && <span className="rounded-full bg-destructive/15 px-2 text-[10px] font-black text-destructive">عاجلة</span>}
                    <span className="font-mono text-[10px] text-muted-foreground">{c.code}</span>
                  </label>
                </li>
              ))}
              {approved.length === 0 && <li className="text-xs text-muted-foreground">مفيش حالات معتمدة.</li>}
            </ul>
          </div>
          <div className="rounded-2xl border border-border p-3">
            <p className="mb-2 text-xs font-black text-muted-foreground">ترتيب الظهور ({picked.length})</p>
            <ol className="space-y-1">
              {picked.map((c, i) => (
                <li key={c.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5 text-xs">
                  <span className="w-5 text-center font-black text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 truncate font-bold">{c.title}</span>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)} aria-label="لأعلى">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === picked.length - 1} onClick={() => move(i, 1)} aria-label="لأسفل">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
              {picked.length === 0 && <li className="text-xs text-muted-foreground">اختار حالات من القائمة.</li>}
            </ol>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
