import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, FileUp, Loader2, XCircle } from "lucide-react";
import { parseArticleMarkdown, type ImportedArticle } from "@/lib/blog-import";
import { createPost, type DbStatus } from "@/data/blogApi";
import { generateAndUploadOg } from "@/lib/blog-uploads";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { NiceSelect } from "@/components/common/NiceSelect";

type Line = ImportedArticle & { pick: boolean; exists: boolean; state?: "ok" | "fail"; msg?: string };

/**
 * «استيراد مقالات»: pick one or more Markdown files (the team's template), check them, then create them
 * on the backend in one go — with SEO fields, tags and an OG image generated from the title.
 * Articles whose link already exists are skipped (edit those from their page).
 */
export function BlogImportDialog({
  open, onOpenChange, existingSlugs, onDone, isRTL,
}: { open: boolean; onOpenChange: (v: boolean) => void; existingSlugs: Set<string>; onDone: () => void; isRTL: boolean }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [status, setStatus] = useState<DbStatus>("draft");
  const [withOg, setWithOg] = useState(true);
  const [running, setRunning] = useState(false);

  const read = async (files: FileList) => {
    const out: Line[] = [];
    for (const f of Array.from(files)) {
      const a = parseArticleMarkdown(await f.text(), f.name);
      const exists = existingSlugs.has(a.slug);
      out.push({ ...a, exists, pick: !exists && !a.problems.some((p) => /مفيش عنوان|فاضي|الرابط لازم/.test(p)) });
    }
    setLines(out.sort((x, y) => x.file.localeCompare(y.file)));
  };

  const run = async () => {
    setRunning(true);
    const next = [...lines];
    for (let k = 0; k < next.length; k++) {
      const a = next[k];
      if (!a.pick || a.state === "ok") continue;
      try {
        let og: string | undefined;
        if (withOg) {
          try { og = await generateAndUploadOg({ slug: a.slug, title: a.title_ar, category: a.category_ar }); } catch { og = undefined; }
        }
        await createPost({
          slug: a.slug,
          category_ar: a.category_ar, category_en: "",
          focus_keyword: a.focus_keyword || undefined,
          title_ar: a.title_ar, title_en: "",
          excerpt_ar: a.excerpt_ar, excerpt_en: "",
          body_ar: a.body_ar, body_en: [],
          tags_ar: a.tags_ar, tags_en: [],
          image_url: og, og_image_url: og,
          // an article with a suggested date waits as a draft until that date is set
          status: a.suggested_date && status === "published" ? "draft" : status,
        });
        next[k] = { ...a, state: "ok", msg: a.suggested_date && status === "published" ? (isRTL ? "اتحفظ مسودة لحد تاريخ النشر المقترح" : "Saved as draft (has a suggested date)") : undefined };
      } catch (e) {
        next[k] = { ...a, state: "fail", msg: apiErrorMessage(e) };
      }
      setLines([...next]);
    }
    setRunning(false);
    onDone();
  };

  const picked = lines.filter((l) => l.pick && l.state !== "ok").length;
  const finished = lines.length > 0 && lines.every((l) => !l.pick || l.state);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!running) { onOpenChange(v); if (!v) setLines([]); } }}>
      <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRTL ? "استيراد مقالات جاهزة" : "Import articles"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-6 text-muted-foreground">
          {isRTL
            ? "اختار ملف أو أكتر بصيغة Markdown (.md) على القالب بتاعنا: جدول البيانات فوق (العنوان، الرابط، الوصف، التصنيف، الكلمة الأساسية، كلمات قريبة) وبعده نص المقال."
            : "Pick Markdown files in the team template: the metadata table, then the article."}
        </p>
        <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-5 text-sm font-black text-primary hover:border-secondary">
          <FileUp className="h-5 w-5" /> {isRTL ? "اختار الملفات" : "Choose files"}
          <input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" multiple className="hidden" disabled={running}
            onChange={(e) => { if (e.target.files?.length) read(e.target.files); e.target.value = ""; }} />
        </label>

        {lines.length > 0 && (
          <>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <NiceSelect value={status} onChange={(v) => setStatus(v as DbStatus)} ariaLabel={isRTL ? "الحالة" : "Status"} size="sm" dir={isRTL ? "rtl" : "ltr"}
                options={[
                  { value: "draft", label: isRTL ? "حفظ كمسودات (أراجعها الأول)" : "Save as drafts" },
                  { value: "published", label: isRTL ? "نشر على طول" : "Publish now" },
                ]} />
              <label className="flex items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold">
                <input type="checkbox" checked={withOg} onChange={(e) => setWithOg(e.target.checked)} />
                {isRTL ? "اعمل صورة غلاف ومشاركة (OG) من العنوان" : "Generate a cover / OG image from the title"}
              </label>
            </div>
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
              {lines.map((l, k) => (
                <li key={l.file} className="flex items-start gap-3 p-3">
                  <input type="checkbox" className="mt-1" checked={l.pick} disabled={running || l.exists || l.state === "ok"}
                    onChange={(e) => setLines((p) => p.map((x, i) => (i === k ? { ...x, pick: e.target.checked } : x)))} />
                  <div className="min-w-0 flex-1">
                    <p className="font-black leading-6 text-primary">{l.title_ar || l.file}</p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">/blog/{l.slug}</p>
                    <p className="mt-1 text-[11px] font-bold text-muted-foreground">
                      {l.category_ar} · {l.words} {isRTL ? "كلمة" : "words"} · {isRTL ? "الكلمة الأساسية:" : "keyword:"} {l.focus_keyword || "—"} · {l.tags_ar.length} {isRTL ? "وسم" : "tags"}
                    </p>
                    {l.exists && <p className="mt-1 text-[11px] font-bold text-amber-700">{isRTL ? "الرابط ده موجود — عدّل المقال من صفحته" : "This link exists — edit it from its page"}</p>}
                    {l.suggested_date && <p className="mt-1 text-[11px] font-bold text-violet-700">{isRTL ? "تاريخ نشر مقترح:" : "Suggested date:"} {l.suggested_date}</p>}
                    {l.problems.map((p) => <p key={p} className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-700"><AlertTriangle className="h-3 w-3" /> {p}</p>)}
                    {l.msg && <p className={`mt-1 text-[11px] font-bold ${l.state === "fail" ? "text-destructive" : "text-emerald-700"}`}>{l.msg}</p>}
                  </div>
                  {l.state === "ok" && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
                  {l.state === "fail" && <XCircle className="h-5 w-5 shrink-0 text-destructive" />}
                </li>
              ))}
            </ul>
          </>
        )}

        <DialogFooter className="gap-2">
          {finished ? (
            <Button onClick={() => { onOpenChange(false); setLines([]); }}>{isRTL ? "تم" : "Done"}</Button>
          ) : (
            <Button onClick={run} disabled={!picked || running} className="bg-orange-grad font-black text-accent-foreground">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {isRTL ? `استيراد ${picked} مقال` : `Import ${picked}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
