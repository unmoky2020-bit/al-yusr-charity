import { useMemo, useState, type RefObject } from "react";
import {
  Bold, Heading2, Heading3, Link2, List, ListOrdered, Table, MessageSquareQuote, HelpCircle, Megaphone,
  BookOpen, Sparkles, AlertTriangle, CheckCircle2, Wand2,
} from "lucide-react";
import { auditArticleBody, cleanArticleBody } from "@/lib/article-links";

/**
 * The article editor's toolbar (Markdown, like WordPress blocks): headings, bold, links, lists, a table,
 * the «quick answer» box, an FAQ question, a donate button line and sources — inserted at the cursor —
 * plus a content check with a one-click «نظّف المقال».
 */
export function ArticleToolbar({
  textareaRef, value, onChange, slug, focus,
}: { textareaRef: RefObject<HTMLTextAreaElement>; value: string; onChange: (v: string) => void; slug: string; focus: string }) {
  const [open, setOpen] = useState(true);
  const issues = useMemo(() => auditArticleBody(value, slug, focus), [value, slug, focus]);
  const fixable = issues.some((i) => i.level === "fix");

  /** Wrap the selection (or insert a block on its own lines) and keep the cursor sensible. */
  const apply = (mode: "wrap" | "block", before: string, after = "", placeholder = "") => {
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? value.length;
    const end = ta?.selectionEnd ?? value.length;
    const sel = value.slice(start, end) || placeholder;
    let insert = `${before}${sel}${after}`;
    if (mode === "block") {
      const needsBreakBefore = start > 0 && !value.slice(0, start).endsWith("\n\n");
      insert = `${needsBreakBefore ? (value.slice(0, start).endsWith("\n") ? "\n" : "\n\n") : ""}${insert}\n\n`;
    }
    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const caret = start + insert.length - (mode === "block" ? 2 : after.length);
      ta.setSelectionRange(caret, caret);
    });
  };

  const tools: Array<{ icon: typeof Bold; label: string; run: () => void }> = [
    { icon: Heading2, label: "عنوان رئيسي (H2)", run: () => apply("block", "## ", "", "عنوان القسم") },
    { icon: Heading3, label: "عنوان فرعي (H3)", run: () => apply("block", "### ", "", "عنوان فرعي") },
    { icon: Bold, label: "عريض", run: () => apply("wrap", "**", "**", "كلام مهم") },
    {
      icon: Link2, label: "رابط", run: () => {
        const url = window.prompt("الرابط (صفحة في الموقع زي /donate أو رابط كامل):", "/donate");
        if (url) apply("wrap", "[", `](${url.trim()})`, "نص الرابط");
      },
    },
    { icon: List, label: "قائمة نقط", run: () => apply("block", "- ", "\n- \n- ", "البند الأول") },
    { icon: ListOrdered, label: "خطوات مرقّمة", run: () => apply("block", "1. ", "\n2. \n3. ", "الخطوة الأولى") },
    { icon: Table, label: "جدول", run: () => apply("block", "| العمود الأول | العمود التاني |\n|---|---|\n| ", " | قيمة |\n| قيمة | قيمة |", "قيمة") },
    { icon: MessageSquareQuote, label: "الإجابة السريعة (أول المقال)", run: () => apply("block", "**الإجابة السريعة:** ", "", "جملتين بيجاوبوا على سؤال القارئ مباشرة.") },
    { icon: HelpCircle, label: "سؤال شائع", run: () => apply("block", value.includes("## أسئلة شائعة") ? "**" : "## أسئلة شائعة\n\n**", "؟**\nالإجابة في جملة أو اتنين.", "السؤال") },
    {
      icon: Megaphone, label: "زرار تبرع", run: () => {
        const url = window.prompt("الزرار يودّي فين؟", "/donate");
        if (url) apply("block", "[", `](${url.trim()})`, "اتبرع دلوقتي");
      },
    },
    { icon: BookOpen, label: "المصادر", run: () => apply("block", "**المصادر:**\n- [", "](https://)", "اسم المصدر") },
  ];

  return (
    <div className="rounded-t-md border border-input bg-muted/40">
      <div className="flex flex-wrap items-center gap-1 p-1.5" role="toolbar" aria-label="أدوات المقال">
        {tools.map(({ icon: Icon, label, run }) => (
          <button key={label} type="button" onClick={run} title={label} aria-label={label}
            className="grid h-8 w-8 place-items-center rounded-md text-primary transition hover:bg-card hover:shadow-sm">
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <button type="button" disabled={!fixable}
          onClick={() => { if (window.confirm("هنحوّل الروابط المكتوبة كنص لروابط، ونحط الكلمة المفتاحية مكان الرابط لو مكتوب كأنه كلمة. نكمّل؟")) onChange(cleanArticleBody(value, slug, focus)); }}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary/25 px-2.5 text-[11px] font-black text-primary transition hover:bg-secondary/40 disabled:opacity-40">
          <Wand2 className="h-3.5 w-3.5" /> نظّف المقال
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)}
          className={`ms-auto inline-flex h-8 items-center gap-1 rounded-md px-2 text-[11px] font-black ${issues.length ? "text-amber-700" : "text-emerald-700"}`}>
          {issues.length ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {issues.length ? `${issues.length} ملاحظة على المحتوى` : "المحتوى تمام"}
        </button>
      </div>
      {open && issues.length > 0 && (
        <ul className="space-y-1 border-t border-input bg-card/60 px-3 py-2 text-[11.5px] font-bold">
          {issues.map((i) => (
            <li key={i.id} className={`flex items-start gap-1.5 ${i.level === "fix" ? "text-rose-700" : "text-amber-800"}`}>
              {i.level === "fix" ? <Wand2 className="mt-0.5 h-3 w-3 shrink-0" /> : <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />} {i.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
