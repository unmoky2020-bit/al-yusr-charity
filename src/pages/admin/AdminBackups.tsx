import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Cloud, CloudOff, Database, Download, HardDrive, Images, Loader2, RefreshCcw, RotateCcw, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notify";
import { askConfirm } from "@/components/common/confirm";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { backupsApi, type BackupRun } from "@/data/api/backupsApi";
import { cn } from "@/lib/utils";

const size = (n?: number | null) => {
  if (!n) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0, v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
};
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("ar-EG", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—");
const STATUS: Record<BackupRun["status"], { label: string; cls: string }> = {
  requested: { label: "مستنية", cls: "bg-amber-100 text-amber-800" },
  running: { label: "شغالة", cls: "bg-sky-100 text-sky-800" },
  done: { label: "جاهزة", cls: "bg-emerald-100 text-emerald-800" },
  failed: { label: "فشلت", cls: "bg-red-100 text-red-700" },
  pruned: { label: "اتمسحت من السيرفر", cls: "bg-zinc-100 text-zinc-600" },
};
const TRIGGER = { schedule: "تلقائي", dashboard: "من اللوحة", deploy: "قبل نشر" } as const;

/**
 * «النسخ الاحتياطية»: database every night, database + uploaded photos every Friday, a copy of each
 * to Google Drive, and the exact command to restore any of them. Super admin only.
 */
export default function AdminBackups() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-backups"],
    queryFn: backupsApi.overview,
    refetchInterval: (query) => (query.state.data?.runs.some((r) => r.status === "requested" || r.status === "running") ? 5000 : 30000),
  });
  const o = q.data;
  const make = useMutation({
    mutationFn: (kind: "db" | "full") => backupsApi.create(kind),
    onSuccess: (r) => { toast.success(r?.message || "تمام"); qc.invalidateQueries({ queryKey: ["admin-backups"] }); },
    onError: (e) => toast.error("تعذر", { description: apiErrorMessage(e) }),
  });
  const remove = async (r: BackupRun) => {
    if (!(await askConfirm(`تمسح نسخة ${r.file ?? "#" + r.id} من السيرفر؟ النسخة اللي على جوجل درايف هتفضل.`))) return;
    try { await backupsApi.remove(r.id); toast.success("اتمسحت"); qc.invalidateQueries({ queryKey: ["admin-backups"] }); }
    catch (e) { toast.error("تعذر", { description: apiErrorMessage(e) }); }
  };
  const dl = async (r: BackupRun, part: "database" | "uploads") => {
    try { await backupsApi.download(r, part); } catch (e) { toast.error("تعذر التنزيل", { description: apiErrorMessage(e) }); }
  };

  const lastDone = o?.runs.find((r) => r.status === "done");
  const busy = o?.runs.some((r) => r.status === "requested" || r.status === "running");
  const ageH = lastDone?.finished_at ? (Date.now() - new Date(lastDone.finished_at).getTime()) / 3_600_000 : Infinity;

  return (
    <AdminLayout title={{ ar: "النسخ الاحتياطية", en: "Backups" }} loading={q.isLoading}>
      <Helmet><title>النسخ الاحتياطية | لوحة اليسر</title></Helmet>
      <div className="mx-auto max-w-5xl space-y-5 p-1" dir="rtl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary">النسخ الاحتياطية</h1>
            <p className="mt-1 text-sm text-muted-foreground">لو حصل أي حاجة للموقع، ترجع البيانات والصور من هنا. السيرفر بيحتفظ بآخر {o?.keep.db ?? 14} نسخة يومية و{o?.keep.full ?? 4} أسبوعية، وجوجل درايف بيحتفظ بـ 120 يوم.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}><RefreshCcw className={cn("ml-1 h-4 w-4", q.isFetching && "animate-spin")} /> تحديث</Button>
            <Button variant="outline" size="sm" onClick={() => make.mutate("full")} disabled={make.isPending || busy}><Images className="ml-1 h-4 w-4" /> نسخة كاملة (بيانات + صور)</Button>
            <Button size="sm" onClick={() => make.mutate("db")} disabled={make.isPending || busy}>
              {make.isPending ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Database className="ml-1 h-4 w-4" />} خد نسخة دلوقتي
            </Button>
          </div>
        </header>

        {q.isError && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{apiErrorMessage(q.error, "تعذر تحميل النسخ")}</div>}

        {o && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Tile ok={ageH < 30} icon={HardDrive} title="آخر نسخة" value={lastDone ? when(lastDone.finished_at) : "مفيش لسه"} hint={lastDone ? `${size(lastDone.size)} · ${lastDone.summary?.rows?.toLocaleString("en-US") ?? "?"} صف` : "دوس «خد نسخة دلوقتي»"} />
            <Tile ok={!!o.drive?.ok} icon={o.drive?.ok ? Cloud : CloudOff} title="جوجل درايف" value={o.drive?.ok ? `${o.drive.folders} نسخة على درايف` : "مش مربوط"} hint={o.drive ? `${o.drive.message} · ${when(o.drive.at)}` : "محتاج ربط مرة واحدة"} />
            <Tile ok={o.cron_ok} icon={RotateCcw} title="النسخ التلقائي" value={o.cron_ok ? "شغال" : "متوقف"} hint={o.cron_ok ? `${o.schedule.db} · ${o.schedule.full}` : "المهمة المجدولة (Cron) مش شغالة على السيرفر"} />
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border bg-card">
          <h2 className="border-b p-4 font-black">النسخ</h2>
          {!o || o.runs.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{q.isLoading ? "…" : "لسه مفيش نسخ."}</p>
          ) : (
            <ul className="divide-y">
              {o.runs.map((r) => {
                const st = STATUS[r.status] ?? STATUS.failed;
                return (
                  <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", st.cls)}>{st.label}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">{r.kind === "full" ? "كاملة: بيانات + صور" : "قاعدة البيانات"}</span>
                        <span className="text-[11px] text-muted-foreground">{TRIGGER[r.trigger] ?? r.trigger}</span>
                      </div>
                      <div className="mt-1 text-sm font-bold">{when(r.finished_at ?? r.created_at)}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{r.file ?? `#${r.id}`} · {size(r.size)}{r.summary?.files ? ` · ${r.summary.files} images` : ""}</div>
                      {r.error && <div className="mt-1 text-[11px] text-red-600">{r.error}</div>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {r.parts.includes("database") && <Button variant="outline" size="sm" onClick={() => dl(r, "database")}><Download className="ml-1 h-3.5 w-3.5" /> البيانات</Button>}
                      {r.parts.includes("uploads") && <Button variant="outline" size="sm" onClick={() => dl(r, "uploads")}><Download className="ml-1 h-3.5 w-3.5" /> الصور</Button>}
                      {(r.on_server || r.status === "requested") && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(r)} aria-label="مسح"><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border bg-card p-5 text-sm leading-7">
          <h2 className="font-black">الاسترجاع (لو حصلت مشكلة)</h2>
          <ol className="list-decimal space-y-1 pr-5">
            <li>اختار النسخة اللي عايز ترجع لها من فوق (الاسم اللي بالإنجليزي).</li>
            <li>من الترمينال على السيرفر: <code className="rounded bg-muted px-1.5 py-0.5 text-xs" dir="ltr">bash ~/yusr-restore.sh 2026-11-13_0315-db-12</code></li>
            <li>السكريبت بياخد نسخة من الوضع الحالي الأول، ويقفل الـ API دقيقة، ويرجّع البيانات (والصور لو النسخة كاملة)، ويفتح تاني.</li>
          </ol>
          <p className="text-xs text-muted-foreground">نسخة على جوجل درايف بس؟ نزّلها على السيرفر الأول: <code dir="ltr">~/bin/rclone copy gdrive:ElyusrBackups/&lt;الاسم&gt; ~/domains/api.elyusr.org/public_html/storage/app/backups/&lt;الاسم&gt;</code></p>
          {o && o.deploys.length > 0 && (
            <details className="rounded-xl bg-muted/40 p-3">
              <summary className="cursor-pointer font-bold">نسخ قبل كل نشر ({o.deploys.length})</summary>
              <p className="mt-1 text-xs text-muted-foreground">كل نشر للموقع أو الـ API بياخد نسخة من الملفات اللي اتغيرت، وفيها <code>rollback.sh</code> بيرجّعها: <code dir="ltr">bash ~/backups/&lt;الاسم&gt;/rollback.sh</code></p>
              <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                {o.deploys.map((d) => <li key={d.name} className="flex justify-between gap-2 rounded bg-background px-2 py-1"><span dir="ltr" className="truncate">{d.name}</span><span className="shrink-0 text-muted-foreground">{when(d.at)}</span></li>)}
              </ul>
            </details>
          )}
          {o?.disk_free != null && <p className="text-xs text-muted-foreground">مساحة فاضية على السيرفر: {size(o.disk_free)}</p>}
        </section>
      </div>
    </AdminLayout>
  );
}

function Tile({ ok, icon: Icon, title, value, hint }: { ok: boolean; icon: typeof Cloud; title: string; value: string; hint?: string }) {
  return (
    <div className={cn("rounded-2xl border p-4", ok ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60")}>
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Icon className={cn("h-4 w-4", ok ? "text-emerald-700" : "text-amber-700")} /> {title}
        {ok ? <CheckCircle2 className="mr-auto h-4 w-4 text-emerald-600" /> : <AlertTriangle className="mr-auto h-4 w-4 text-amber-600" />}
      </div>
      <div className="mt-2 text-lg font-black">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{hint}</div>}
    </div>
  );
}
