import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Share2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { caseShareUrl } from "./caseShareUrl";
import { formatNumberEN } from "@/lib/utils";
import { SectionCard } from "@/components/admin/programs/FormKit";

/** Statuses whose public page is visible to visitors (others return 404 to the public). */
const PUBLIC_STATUSES = ["approved", "completed"];

type Platform = { key: string; label: string; cls: string; href: (url: string, text: string) => string };

const enc = encodeURIComponent;

const PLATFORMS: Platform[] = [
  { key: "whatsapp", label: "واتساب", cls: "bg-[#25D366] text-white hover:bg-[#1ebe5a]", href: (u, t) => `https://wa.me/?text=${enc(`${t}\n${u}`)}` },
  { key: "facebook", label: "فيسبوك", cls: "bg-[#1877F2] text-white hover:bg-[#166fe0]", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
  { key: "x", label: "X (تويتر)", cls: "bg-foreground text-background hover:opacity-90", href: (u, t) => `https://twitter.com/intent/tweet?text=${enc(t)}&url=${enc(u)}` },
  { key: "telegram", label: "تليجرام", cls: "bg-[#229ED9] text-white hover:bg-[#1d8cc2]", href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}` },
  { key: "linkedin", label: "لينكدإن", cls: "bg-[#0A66C2] text-white hover:bg-[#0959ab]", href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}` },
];

/**
 * Everything the team needs to spread an urgent case fast: a ready message (editable), one-click
 * share buttons per platform (each with its own UTM tag), copy buttons and the device share sheet.
 */
export function CaseShareBox({
  code,
  title,
  status,
  neededAmount,
  raisedAmount,
}: {
  code: string;
  title: string;
  status: string;
  neededAmount: number;
  raisedAmount: number;
}) {
  const remaining = Math.max(0, neededAmount - raisedAmount);
  const defaultText = useMemo(
    () =>
      [
        `🤲 ${title}`,
        remaining > 0
          ? `فاضل ${formatNumberEN(remaining)} ج.م بس علشان الحالة تكتمل — ساهم ولو بالقليل وشارك الرابط، المشاركة صدقة.`
          : "الحالة دي محتاجة دعمك — ساهم ولو بالقليل وشارك الرابط، المشاركة صدقة.",
        "تبرعك بيوصل للحالة نفسها وبتتابع تحديثاتها بالصور مع مؤسسة اليسر الخيرية.",
      ].join("\n"),
    [title, remaining],
  );
  const [text, setText] = useState(defaultText);
  useEffect(() => setText(defaultText), [defaultText]);

  const isPublic = PUBLIC_STATUSES.includes(status);
  const plainUrl = caseShareUrl(code);

  const copy = async (value: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: msg });
    } catch {
      toast({ title: "تعذر النسخ — انسخ يدوياً", variant: "destructive" });
    }
  };

  const nativeShare = () =>
    navigator.share?.({ title, text, url: caseShareUrl(code, "native") }).catch(() => {
      /* closed by the user */
    });

  return (
    <SectionCard
      icon={<Share2 className="h-4 w-4 text-primary" />}
      title="مشاركة الحالة"
      description="الحالات العاجلة بتعتمد على المشاركة أكتر من البحث. كل زرار بيضيف علامة للمنصة (UTM) عشان تعرف التبرعات جت منين."
    >
      <div className="space-y-4">
        {!isPublic && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            الحالة لسه مش معتمدة، فصفحتها مش ظاهرة للزوار. اعتمدها الأول قبل ما تشارك الرابط.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/40 p-2.5">
          <code className="min-w-0 flex-1 truncate text-xs" dir="ltr">{plainUrl}</code>
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1 rounded-lg" onClick={() => void copy(plainUrl, "تم نسخ الرابط")}>
            <Copy className="h-3.5 w-3.5" /> نسخ الرابط
          </Button>
          <a href={plainUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-bold hover:bg-muted">
            <ExternalLink className="h-3.5 w-3.5" /> فتح الصفحة
          </a>
        </div>

        <div>
          <span className="mb-1 block text-xs font-bold text-muted-foreground">نص المشاركة (تقدر تعدّله)</span>
          <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} className="rounded-xl text-sm" />
          <Button type="button" size="sm" variant="ghost" className="mt-1 h-7 gap-1 text-xs" onClick={() => void copy(`${text}\n${caseShareUrl(code, "copy")}`, "تم نسخ النص مع الرابط")}>
            <Copy className="h-3.5 w-3.5" /> نسخ النص مع الرابط (للجروبات والستوري)
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <a
              key={p.key}
              href={p.href(caseShareUrl(code, p.key), text)}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex h-9 items-center rounded-xl px-4 text-xs font-black transition ${p.cls}`}
            >
              {p.label}
            </a>
          ))}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button type="button" size="sm" variant="outline" className="h-9 gap-1 rounded-xl" onClick={() => void nativeShare()}>
              <Share2 className="h-3.5 w-3.5" /> مشاركة من الجهاز
            </Button>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
