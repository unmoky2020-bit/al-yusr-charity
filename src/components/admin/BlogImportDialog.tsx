import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, FileUp, Loader2, XCircle } from "lucide-react";
import { parseArticleMarkdown, type ImportedArticle } from "@/lib/blog-import";
import { createPost, type DbStatus } from "@/data/blogApi";
import { generateAndUploadOg } from "@/lib/blog-uploads";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { NiceSelect } from "@/components/common/NiceSelect";
import { BlogPromptWorkbench } from "./BlogPromptWorkbench";
import { toast } from "@/lib/notify";

type Line = ImportedArticle & { pick: boolean; exists: boolean; state?: "ok" | "fail"; msg?: string };

/**
 * «استيراد مقالات»: pick one or more Markdown files (the team's template), check them, then create them
 * on the backend in one go — with SEO fields, bilingual content, tags and an optional generated OG image.
 * Articles whose link already exists are skipped (edit those from their page).
 */
export function BlogImportDialog({
  open, onOpenChange, existingSlugs, onDone, isRTL,
}: { open: boolean; onOpenChange: (v: boolean) => void; existingSlugs: Set<string>; onDone: () => void; isRTL: boolean }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [status, setStatus] = useState<DbStatus>("draft");
  const [withOg, setWithOg] = useState(true);
  const [running, setRunning] = useState(false);
  const [readingFiles, setReadingFiles] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [runTotal, setRunTotal] = useState(0);
  const [mode, setMode] = useState<"import" | "prompts">("import");

  const read = async (files: FileList) => {
    setReadingFiles(true);
    setLines([]);
    const out: Line[] = [];
    for (const file of Array.from(files)) {
      try {
        const article = parseArticleMarkdown(await file.text(), file.name);
        const exists = existingSlugs.has(article.slug);
        out.push({
          ...article,
          exists,
          pick: !exists && !article.problems.some((problem) => /مفيش عنوان|فاضي|الرابط لازم/.test(problem)),
        });
        setLines([...out]);
      } catch (error) {
        toast.error(`${isRTL ? "تعذر قراءة" : "Could not read"} ${file.name}: ${apiErrorMessage(error)}`);
      }
    }
    setLines(out.sort((a, b) => a.file.localeCompare(b.file)));
    setReadingFiles(false);
  };

  const run = async () => {
    setRunning(true);
    setCompletedCount(0);
    const next = [...lines];
    setRunTotal(next.filter((line) => line.pick && line.state !== "ok").length);
    for (let k = 0; k < next.length; k++) {
      const a = next[k];
      if (!a.pick || a.state === "ok") continue;
      try {
        let og: string | undefined;
        let imageWarning: string | undefined;
        if (withOg) {
          try {
            og = await generateAndUploadOg({ slug: a.slug, title: a.title_ar, category: a.category_ar });
          } catch (e) {
            imageWarning = isRTL
              ? `تعذر توليد صورة المشاركة: ${apiErrorMessage(e)} — تم استيراد المقال بدون صورة.`
              : `Could not generate the share image: ${apiErrorMessage(e)} — article imported without an image.`;
          }
        }
        await createPost({
          slug: a.slug,
          category_ar: a.category_ar, category_en: a.category_en || a.category_ar,
          focus_keyword: a.focus_keyword || undefined,
          title_ar: a.title_ar, title_en: a.title_en || a.title_ar,
          excerpt_ar: a.excerpt_ar, excerpt_en: a.excerpt_en || a.excerpt_ar,
          body_ar: a.body_ar, body_en: a.body_en.length ? a.body_en : a.body_ar,
          tags_ar: a.tags_ar, tags_en: a.tags_en.length ? a.tags_en : a.tags_ar,
          image_url: og, og_image_url: og,
          // an article with a suggested date waits as a draft until that date is set
          status: a.suggested_date && status === "published" ? "draft" : status,
        });
        const statusMessage = a.suggested_date && status === "published"
          ? (isRTL ? "اتحفظ مسودة لحد تاريخ النشر المقترح" : "Saved as draft (has a suggested date)")
          : undefined;
        next[k] = { ...a, state: "ok", msg: [statusMessage, imageWarning].filter(Boolean).join(" ") || undefined };
      } catch (e) {
        next[k] = { ...a, state: "fail", msg: apiErrorMessage(e) };
      }
      setLines([...next]);
      setCompletedCount((count) => count + 1);
    }
    setRunning(false);
    onDone();
  };

  const picked = lines.filter((l) => l.pick && l.state !== "ok").length;
  const finished = lines.length > 0 && lines.every((l) => !l.pick || l.state);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!running) { onOpenChange(v); if (!v) { setLines([]); setMode("import"); } } }}>
      <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRTL ? "استيراد مقالات جاهزة" : "Import articles"}</DialogTitle>
        </DialogHeader>
        <div role="tablist" aria-label={isRTL ? "أدوات المقالات" : "Article tools"} className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1">
          <button type="button" role="tab" aria-selected={mode === "import"} onClick={() => setMode("import")}
            className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${mode === "import" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {isRTL ? "رفع واستيراد ملفات" : "Upload and import"}
          </button>
          <button type="button" role="tab" aria-selected={mode === "prompts"} onClick={() => setMode("prompts")}
            className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${mode === "prompts" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {isRTL ? "تجهيز تعليمات AI" : "Prepare AI prompts"}
          </button>
        </div>
        {mode === "prompts" ? (
          <BlogPromptWorkbench isRTL={isRTL} />
        ) : (
          <>
        <p className="text-sm leading-6 text-muted-foreground">
          {isRTL
            ? "ارفع أي عدد من ملفات Markdown (.md) دفعة واحدة. استخدم القالب: بيانات المقال أولًا (العنوان، الرابط، الوصف، التصنيف، الكلمة الأساسية، كلمات قريبة)، ثم نص المقال. هنراجع التكرار والأخطاء قبل الاستيراد."
            : "Upload any number of Markdown (.md) files at once. Use the template: article metadata first (title, slug, description, category, focus keyword and related keywords), then the article body. Duplicates and validation issues are checked before import."}
        </p>
        <div className="mt-2">
          <label className="flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm font-black text-primary transition hover:border-secondary hover:bg-muted/30">
            <FileUp className="h-5 w-5" /> {isRTL ? "اختار ملفات Markdown (يمكن تحديد أكثر من ملف)" : "Choose Markdown files (multiple selection supported)"}
            <input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" multiple className="hidden" disabled={running || readingFiles}
              onChange={(e) => { if (e.target.files?.length) read(e.target.files); e.target.value = ""; }} />
          </label>
        </div>
        {readingFiles && (
          <p role="status" className="text-xs font-bold text-muted-foreground">
            {isRTL ? `جارٍ فحص الملفات… (${lines.length})` : `Checking files… (${lines.length})`}
          </p>
        )}

        {lines.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-muted-foreground">
              <span>{isRTL ? `تم تجهيز ${lines.length} ملفًا` : `${lines.length} files ready`}</span>
              <button type="button" className="text-primary underline-offset-2 hover:underline"
                onClick={() => setLines((current) => current.map((line) => ({
                  ...line,
                  pick: !line.exists && !line.problems.length && !line.state,
                })))}>
                {isRTL ? "تحديد المقالات الصالحة" : "Select valid articles"}
              </button>
            </div>
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
                    {l.title_en && <p className="text-xs text-muted-foreground" dir="ltr">{l.title_en}</p>}
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

        {mode === "import" && (
          <DialogFooter className="gap-2">
            {finished ? (
              <Button onClick={() => { onOpenChange(false); setLines([]); setMode("import"); }}>{isRTL ? "تم" : "Done"}</Button>
            ) : (
              <Button onClick={run} disabled={!picked || running || readingFiles} className="bg-orange-grad font-black text-accent-foreground">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {running
                  ? (isRTL ? `جارٍ الاستيراد ${completedCount}/${runTotal}` : `Importing ${completedCount}/${runTotal}`)
                  : (isRTL ? `استيراد ${picked} مقال` : `Import ${picked}`)}
              </Button>
            )}
          </DialogFooter>
        )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
