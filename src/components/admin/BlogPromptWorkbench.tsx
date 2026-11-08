import { useMemo, useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/notify";

type PromptRole = { title: string; objective: string; prompt: string };

export function BlogPromptWorkbench({ isRTL }: { isRTL: boolean }) {
  const [brief, setBrief] = useState("");
  const [keyword, setKeyword] = useState("");
  const [audience, setAudience] = useState("");
  const [sources, setSources] = useState("");
  const [wordTarget, setWordTarget] = useState("600");
  const [copied, setCopied] = useState<string | null>(null);

  const roles = useMemo<PromptRole[]>(() => {
    const context = [
      `موضوع وتوجيه المستخدم: ${brief.trim() || "[اكتب موضوع المقال وتوجيهاتك]"}`,
      `الكلمة الأساسية: ${keyword.trim() || "[حدّد الكلمة الأساسية]"}`,
      `الجمهور: ${audience.trim() || "قراء في مصر يبحثون عن معلومات موثوقة ومفهومة"}`,
      `الطول التقريبي: ${wordTarget} كلمة لكل نسخة`,
      `مصادر ومعلومات معتمدة من المستخدم: ${sources.trim() || "[أضف المصادر أو اكتب: لا توجد مصادر]"}`,
    ].join("\n");
    const guardrails = [
      "اكتب محتوى أصليًا، واضحًا ومفيدًا، ولا تنسخ نصوصًا منشورة.",
      "لا تختلق أرقامًا أو وقائع أو فتاوى أو أرقام هواتف أو وعودًا عن المؤسسة. ميّز الادعاءات التي تحتاج مصدرًا، واطلب التحقق منها بدل الجزم.",
      "استخدم لغة إنسانية محترمة، وتجنب استغلال قصص المستفيدين أو كشف أي بيانات شخصية.",
      "أخرج النتيجة في Markdown صالح للاستيراد، من دون مقدمات أو أسوار كود حول الملف النهائي.",
    ].join("\n");

    return [
      {
        title: "١. المخطط ومدقق المصادر",
        objective: "حدّد نية البحث، الأسئلة التي يجب أن يجيب عنها المقال، مخططًا منطقيًا، والحقائق التي تحتاج توثيقًا.",
        prompt: `أنت محرر بحث وتدقيق لمحتوى مؤسسة خيرية في مصر. لا تكتب المقال بعد. حلّل الطلب، واقترح مخططًا بعناوين واضحة، وأسئلة القارئ، ونقاط التحقق ومصادر موثوقة مناسبة. لا تدّعِ أنك تحققت من مصادر لم تُرفق.\n\n${context}\n\n${guardrails}`,
      },
      {
        title: "٢. الكاتب العربي والإنجليزي",
        objective: "اكتب مسودتين متطابقتين في المعنى بالعربية والإنجليزية اعتمادًا على المخطط والمصادر.",
        prompt: `أنت كاتب محتوى عربي/إنجليزي متخصص في المقالات الخيرية المفيدة لجمهور مصر. استخدم المخطط ونتيجة تدقيق المصادر التي سأضيفها بعد التعليمات. اكتب نسختين متكاملتين، لا ترجمة حرفية، ولا تضف معلومة غير موثقة.\n\n${context}\n\n${guardrails}\n\nقالب Markdown المطلوب:\n| الحقل | القيمة |\n|---|---|\n| العنوان | عنوان عربي |\n| العنوان بالإنجليزية | English title |\n| الرابط | short-english-slug |\n| الوصف | وصف عربي من 80 إلى 170 حرفًا |\n| الوصف بالإنجليزية | English meta description |\n| التصنيف | تصنيف عربي |\n| التصنيف بالإنجليزية | English category |\n| الكلمة الأساسية | الكلمة المستهدفة |\n| كلمات قريبة | كلمة، كلمة، كلمة |\n| كلمات قريبة بالإنجليزية | keyword, keyword, keyword |\n---\n# العنوان العربي\n\nنص المقال العربي مع عناوين فرعية.\n\n## English version\n# English title\n\nEnglish article body with equivalent useful detail.`,
      },
      {
        title: "٣. المراجع والمحرر",
        objective: "راجع المسودتين للحقائق واللغة والتناسق وسهولة القراءة وتحسين محركات البحث.",
        prompt: `أنت مراجع مستقل لمقال خيري عربي/إنجليزي. راجع المسودة والمخطط والمصادر التي سأرفقها. اكتشف الادعاءات غير المسندة، التكرار، الترجمة غير الطبيعية، ضعف الإجابة عن نية البحث، ومخاطر الخصوصية أو الوعود المضللة. لا تستبدل نقص المصدر بمعلومة مخترعة. أعطني قائمة تصحيحات محددة ثم نسخة مصححة كاملة بقالب Markdown نفسه.\n\n${context}\n\n${guardrails}\n\nأرفق بعد التعليمات مخرجات المخطط والكاتب والمسودة المراد مراجعتها.`,
      },
      {
        title: "٤. المقيم النهائي",
        objective: "قيّم الدقة والفائدة والوضوح والتوافق مع القالب، ثم أخرج الملف النهائي الجاهز للاستيراد.",
        prompt: `أنت محرر اعتماد نهائي. قيّم النص الذي سأرفقه على: دقة المعلومات (30)، تلبية حاجة القارئ (20)، وضوح العربية والإنجليزية وتكافؤهما (15)، اكتمال البيانات والقالب (15)، قابلية القراءة (10)، وSEO دون حشو (10). اذكر المجموع وأي مانع نشر. لا تعتمد معلومة بلا مصدر ولا تخفِ عدم اليقين. إذا اجتاز المقال المراجعة، أخرج ملف Markdown النهائي فقط بالقالب الذي يقرأه مستورد المدونة؛ وإلا أخرج قائمة النواقص بوضوح.\n\n${context}\n\n${guardrails}\n\nأرفق مخرجات الأدوار السابقة ومصادر التحقق.`,
      },
    ];
  }, [brief, keyword, audience, sources, wordTarget]);

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1600);
      toast.success(isRTL ? "تم نسخ التعليمات" : "Instructions copied");
    } catch (error) {
      toast.error(isRTL ? "تعذر النسخ. انسخ النص يدويًا." : "Could not copy. Please copy the text manually.");
      console.error("Could not copy AI workflow prompt", error);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p className="text-muted-foreground">
          {isRTL
            ? "التطبيق لا يتصل بأي نموذج ولا يستهلك API أو تكلفة. جهّز توجيهات منفصلة للمخطط والكاتب والمراجع والمقيّم وانسخها يدويًا؛ قد يفرض النموذج الذي تختاره رسومًا منفصلة. الاستيراد التلقائي وتنسيق النماذج سيُضافان بعد تجهيز backend آمن."
            : "This app does not call models or use API credits. Prepare separate planner, writer, reviewer and evaluator prompts and copy them manually; the model you choose may charge separately. Automated orchestration and importing can be added after a secure backend is ready."}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-bold">
          <span>{isRTL ? "الموضوع وتوجيهاتك" : "Topic and your instructions"} *</span>
          <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3}
            placeholder={isRTL ? "ما السؤال الذي سيجيب عنه المقال؟ ما المعلومات والنبرة المطلوبة؟" : "What question should the article answer? What details and tone do you want?"} />
        </label>
        <label className="space-y-1.5 text-xs font-bold">
          <span>{isRTL ? "المصادر أو الحقائق المعتمدة" : "Approved sources or facts"}</span>
          <Textarea value={sources} onChange={(e) => setSources(e.target.value)} rows={3}
            placeholder={isRTL ? "روابط رسمية أو معلومات معتمدة؛ اتركها فارغة إن لم تتوفر." : "Official links or approved facts; leave blank if unavailable."} />
        </label>
        <label className="space-y-1.5 text-xs font-bold">
          <span>{isRTL ? "الكلمة الأساسية" : "Focus keyword"}</span>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </label>
        <label className="space-y-1.5 text-xs font-bold">
          <span>{isRTL ? "الجمهور المستهدف" : "Target audience"}</span>
          <Input value={audience} onChange={(e) => setAudience(e.target.value)}
            placeholder={isRTL ? "مثال: أسر تبحث عن مساعدة موثوقة في مصر" : "e.g. families seeking reliable support in Egypt"} />
        </label>
        <label className="space-y-1.5 text-xs font-bold">
          <span>{isRTL ? "الطول المستهدف لكل نسخة" : "Target length per language"}</span>
          <Input type="number" min={300} max={3000} step={100} value={wordTarget}
            onChange={(e) => setWordTarget(e.target.value)} />
        </label>
      </div>
      <div className="space-y-3">
        {roles.map((role, index) => (
          <section key={role.title} className="space-y-2 rounded-xl border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-primary">{isRTL ? role.title : ["1. Planner & source checker", "2. Arabic and English writer", "3. Independent reviewer", "4. Final evaluator"][index]}</h3>
                <p className="text-xs text-muted-foreground">{isRTL ? role.objective : ["Identify search intent, outline the article, and flag claims that need evidence.", "Write equivalent, useful Arabic and English drafts from the outline and sources.", "Check factual support, language, consistency, readability and SEO.", "Score the article and output the final import-ready Markdown only if it passes."][index]}</p>
              </div>
              <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1.5"
                onClick={() => void copy(String(index), role.prompt)}>
                {copied === String(index) ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {isRTL ? "نسخ تعليمات الدور" : "Copy role prompt"}
              </Button>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer font-bold text-muted-foreground">{isRTL ? "معاينة التعليمات" : "Preview instructions"}</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-sans leading-5">{role.prompt}</pre>
            </details>
          </section>
        ))}
      </div>
    </div>
  );
}
