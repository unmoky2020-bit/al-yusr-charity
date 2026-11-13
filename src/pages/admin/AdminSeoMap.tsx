/**
 * «خريطة السيو»: where we stand on every keyword of docs/seo-keywords.csv, where we're heading, and
 * the plan. The team types each keyword's Google position (Search Console → الأداء → الاستعلامات,
 * column «الموضع») with the date; it's saved as the site block `seo_progress`.
 */
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Save, Search, Target, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/notify";
import { describeWriteError } from "@/data/api/backendPending";
import { SITE_BLOCKS_QUERY, siteBlocksAdminApi, type SeoProgress } from "@/data/siteBlocks";
import { SEO_KEYWORDS, TIER_AR, summarize, tierOf, type SeoTier } from "@/data/seoKeywords";

/** Date of the last Search Console snapshot written into docs/seo-keywords.csv (docs/SEO-TRACKER.md). */
const GSC_SNAPSHOT = "2026-11-10";

const TIER_CLS: Record<SeoTier, string> = {
  top3: "bg-emerald-600 text-white",
  top10: "bg-emerald-100 text-emerald-800",
  top20: "bg-amber-100 text-amber-800",
  far: "bg-rose-100 text-rose-800",
  untracked: "bg-muted text-muted-foreground",
};

const PLAN = [
  { phase: "1 — الأساس (اتعمل)", items: ["صفحة مالكة لكل مجموعة كلمات", "JSON-LD وروابط داخلية بين الصفحات المالكة", "نص ظاهر بدل النص المخفي", "خريطة الموقع وIndexNow"] },
  { phase: "2 — المسك (دلوقتي)", items: ["طلب الأرشفة يوميًا (docs/INDEXING.md)", "تحديث الترتيب هنا كل أسبوع من Search Console", "الكلمات اللي في الصفحة التانية: نزوّد فقرة ظاهرة + سؤال شائع + رابط داخلي ليها", "صور حقيقية بـ alt فيه الكلمة"] },
  { phase: "3 — التوسع", items: ["مقال لكل كلمة طويلة (long-tail) بيرجع للصفحة المالكة", "ملف Google Business: صور ومراجعات أسبوعية (المنصورة)", "روابط من مواقع مصرية (أخبار محلية، أدلة جمعيات)", "صفحات للمدن للكلمات المحلية"] },
];

export default function AdminSeoMap() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<SeoProgress>({});
  const [saved, setSaved] = useState<string>("{}");
  const [group, setGroup] = useState<string>("all");
  const [tier, setTier] = useState<SeoTier | "all">("all");
  const [q, setQ] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    void (async () => {
      try {
        const b = await siteBlocksAdminApi.load();
        // Until the team types a position, a keyword shows its Search Console average position from
        // the last snapshot in docs/seo-keywords.csv (rounded), dated with that snapshot.
        const seed: SeoProgress = { ...(b.seo_progress ?? {}) };
        for (const k of SEO_KEYWORDS) {
          if (!seed[k.keyword] && k.gscPos !== null) seed[k.keyword] = { pos: Math.max(1, Math.min(100, Math.round(k.gscPos))), date: GSC_SNAPSHOT, note: `Search Console: ${k.gscText}` };
        }
        setProgress(seed);
        setSaved(JSON.stringify(b.seo_progress ?? {}));
      } catch (e) {
        toast.error("مش قادر أقرا الخريطة", { description: describeWriteError(e, "GET /site-blocks") });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => [...new Set(SEO_KEYWORDS.map((k) => k.group))], []);
  const sum = useMemo(() => summarize(SEO_KEYWORDS, progress), [progress]);
  const dirty = JSON.stringify(progress) !== saved;
  const list = useMemo(() => {
    const t = q.trim();
    return SEO_KEYWORDS.filter((k) => (group === "all" || k.group === group) && (tier === "all" || tierOf(progress[k.keyword]) === tier) && (!t || k.keyword.includes(t) || k.page.includes(t)));
  }, [group, tier, q, progress]);

  const setPos = (kw: string, raw: string) => {
    const v = raw.replace(/\D/g, "");
    setProgress((p) => ({ ...p, [kw]: { ...(p[kw] ?? {}), pos: v ? Math.min(100, Math.max(1, Number(v))) : null, date: today } }));
  };
  const setNote = (kw: string, note: string) => setProgress((p) => ({ ...p, [kw]: { ...(p[kw] ?? { pos: null }), note } }));

  const save = async () => {
    setSaving(true);
    try {
      const clean: SeoProgress = {};
      for (const [k, e] of Object.entries(progress)) {
        if (e.pos !== null || e.date || e.note) clean[k] = { pos: e.pos, ...(e.date ? { date: e.date } : {}), ...(e.note?.trim() ? { note: e.note.trim() } : {}) };
      }
      await siteBlocksAdminApi.save("seo_progress", clean);
      setSaved(JSON.stringify(clean));
      await qc.invalidateQueries({ queryKey: SITE_BLOCKS_QUERY });
      toast.success("اتحفظت خريطة السيو");
    } catch (e) {
      toast.error("ما اتحفظتش", { description: describeWriteError(e, "PUT /admin/site-blocks/seo_progress") });
    } finally {
      setSaving(false);
    }
  };

  const total = SEO_KEYWORDS.length;
  const pct = (n: number) => Math.round((n / total) * 100);
  const tiles: { t: SeoTier; label: string }[] = [
    { t: "top3", label: TIER_AR.top3 }, { t: "top10", label: TIER_AR.top10 }, { t: "top20", label: TIER_AR.top20 },
    { t: "far", label: TIER_AR.far }, { t: "untracked", label: TIER_AR.untracked },
  ];

  return (
    <AdminLayout title={{ ar: "خريطة السيو", en: "SEO map" }} loading={loading}>
      <Helmet><title>خريطة السيو | لوحة اليسر</title></Helmet>
      <div className="mx-auto max-w-6xl space-y-5 p-1" dir="rtl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary">خريطة السيو</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {total} كلمة في {groups.length} مجموعة، لكل مجموعة صفحة مالكة. اكتب ترتيب كل كلمة من Search Console (الأداء ← الاستعلامات ← «الموضع») مرة كل أسبوع، والصفحة دي بتقولك إحنا فين ورايحين فين. الأرقام المبدئية من لقطة 10 نوفمبر (docs/SEO-TRACKER.md). البحث من موبايلك بيتأثر بمكانك، فالرقم المعتمد هو «الموضع» في Search Console.
            </p>
          </div>
          <Button onClick={() => void save()} disabled={!dirty || saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
          </Button>
        </div>

        {/* Where we are */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {tiles.map(({ t, label }) => (
            <button key={t} type="button" onClick={() => setTier(tier === t ? "all" : t)}
              className={`rounded-2xl border p-4 text-start transition ${tier === t ? "border-primary ring-2 ring-primary/30" : "border-border"} bg-card`}>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-black ${TIER_CLS[t]}`}>{label}</span>
              <div className="mt-2 font-mono text-2xl font-black text-primary">{sum.all[t]}</div>
              <div className="text-[11px] font-bold text-muted-foreground">{pct(sum.all[t])}% من الكلمات</div>
            </button>
          ))}
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="flex h-full">
            {(["top3", "top10", "top20", "far"] as SeoTier[]).map((t) => (
              <div key={t} className={TIER_CLS[t].split(" ")[0]} style={{ width: `${pct(sum.all[t])}%` }} />
            ))}
          </div>
        </div>

        {/* Where we're heading */}
        <div className="grid gap-3 md:grid-cols-3">
          {PLAN.map((p) => (
            <div key={p.phase} className="rounded-2xl border border-border bg-card p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-black text-primary"><Target className="h-4 w-4 text-secondary" /> {p.phase}</h2>
              <ul className="mt-2 list-disc space-y-1 ps-5 text-[12.5px] leading-relaxed text-muted-foreground">
                {p.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* Per group */}
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/60 text-[11px] font-black text-muted-foreground">
              <tr><th className="p-2 text-start">المجموعة</th><th className="p-2 text-start">الصفحة المالكة</th><th className="p-2">الكلمات</th><th className="p-2">أول 3</th><th className="p-2">صفحة أولى</th><th className="p-2">صفحة تانية</th><th className="p-2">ما اتقاسش</th></tr>
            </thead>
            <tbody>
              {[...sum.groups.entries()].map(([g, v]) => (
                <tr key={g} className="border-t border-border/60">
                  <td className="p-2"><button type="button" onClick={() => setGroup(group === g ? "all" : g)} className={`font-bold ${group === g ? "text-secondary" : "text-primary"} hover:underline`}>{g}</button></td>
                  <td className="p-2"><a href={v.page} target="_blank" rel="noopener noreferrer" dir="ltr" className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">{v.page}<ExternalLink className="h-3 w-3" /></a></td>
                  <td className="p-2 text-center font-mono">{v.total}</td>
                  <td className="p-2 text-center font-mono text-emerald-700">{v.tiers.top3 || ""}</td>
                  <td className="p-2 text-center font-mono text-emerald-700">{v.tiers.top10 || ""}</td>
                  <td className="p-2 text-center font-mono text-amber-700">{v.tiers.top20 || ""}</td>
                  <td className="p-2 text-center font-mono text-muted-foreground">{v.tiers.untracked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Keywords */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن كلمة أو صفحة" className="h-10 ps-9" />
          </div>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="h-10 rounded-md border border-border bg-card px-2 text-sm font-bold text-primary" aria-label="المجموعة">
            <option value="all">كل المجموعات</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <span className="text-xs font-bold text-muted-foreground">{list.length} كلمة</span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/60 text-[11px] font-black text-muted-foreground">
              <tr><th className="p-2 text-start">الكلمة</th><th className="p-2 text-start">الصفحة</th><th className="w-24 p-2">الترتيب</th><th className="p-2">الحالة</th><th className="p-2">آخر قياس</th><th className="p-2 text-start">ملاحظة</th></tr>
            </thead>
            <tbody>
              {list.map((k) => {
                const e = progress[k.keyword];
                const t = tierOf(e);
                return (
                  <tr key={k.keyword} className="border-t border-border/60">
                    <td className="p-2 font-bold text-foreground">{k.keyword}{k.seenInGsc && <TrendingUp className="ms-1 inline h-3.5 w-3.5 text-emerald-600" aria-label="ظهرنا فيها" />}</td>
                    <td className="p-2"><span dir="ltr" className="font-mono text-xs text-muted-foreground">{k.page}</span></td>
                    <td className="p-2"><Input value={e?.pos ?? ""} onChange={(ev) => setPos(k.keyword, ev.target.value)} inputMode="numeric" dir="ltr" placeholder="—" className="h-8 text-center font-mono" aria-label={`ترتيب ${k.keyword}`} /></td>
                    <td className="p-2 text-center"><span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${TIER_CLS[t]}`}>{TIER_AR[t]}</span></td>
                    <td className="p-2 text-center font-mono text-[11px] text-muted-foreground" dir="ltr">{e?.date ?? ""}</td>
                    <td className="p-2"><Input value={e?.note ?? ""} onChange={(ev) => setNote(k.keyword, ev.target.value)} className="h-8 text-xs" placeholder={k.gscText || ""} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
