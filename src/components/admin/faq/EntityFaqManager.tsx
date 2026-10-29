import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, HelpCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  createFaq,
  createFaqCategory,
  deleteFaq,
  fetchFaqCategoriesAdmin,
  fetchFaqsAdmin,
  updateFaq,
  type FaqCategory,
  type FaqItem,
} from "@/data/faqsApi";
import { apiErrorMessageAr } from "@/data/api/programsAdminApi";
import { ChoiceSelect, Field, SectionCard } from "@/components/admin/programs/FormKit";

/** What the FAQ belongs to — only changes the wording. */
export type FaqOwnerKind = "program" | "project" | "campaign" | "axis";

/** `fallback` = what the public page shows while no category is linked. */
export const FAQ_OWNER: Record<FaqOwnerKind, { one: string; page: string; fallback: string }> = {
  program: { one: "البرنامج", page: "صفحة البرنامج", fallback: "أسئلة تصنيف programs العامة" },
  project: { one: "المشروع", page: "صفحة المشروع", fallback: "مفيش أسئلة" },
  campaign: { one: "الحملة", page: "صفحة الحملة", fallback: "الأسئلة المكتوبة في تصميم الصفحة" },
  axis: { one: "المحور", page: "صفحة المحور", fallback: "مفيش أسئلة" },
};

/**
 * The FAQ of a program / project / campaign = the questions of ONE category from the FAQ screen
 * (column faq_category_id on the record). Questions edited here are the same rows the
 * «الأسئلة الشائعة» screen shows, so a change appears everywhere that category is used.
 */
type Draft = { question_ar: string; answer_ar: string; question_en: string; answer_en: string; is_active: boolean; sort_order: number };

const toDraft = (f: FaqItem): Draft => ({
  question_ar: f.question_ar || "",
  answer_ar: f.answer_ar || "",
  question_en: f.question_en || "",
  answer_en: f.answer_en || "",
  is_active: f.is_active !== false,
  sort_order: f.sort_order ?? 0,
});

export function EntityFaqManager({
  kind,
  saved,
  linkedCategoryId,
  slug,
  nameAr,
  onLink,
}: {
  kind: FaqOwnerKind;
  /** False for a record that was never saved (no id yet). */
  saved: boolean;
  linkedCategoryId: number | null | undefined;
  /** Used for the «category for this page» button (its slug). */
  slug: string;
  nameAr: string;
  /** Saves faq_category_id on the record; resolves after the server confirmed. */
  onLink: (categoryId: number | null) => Promise<void>;
}) {
  const words = FAQ_OWNER[kind];
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [linkedId, setLinkedId] = useState<number | null>(linkedCategoryId ?? null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, items] = await Promise.all([fetchFaqCategoriesAdmin(), fetchFaqsAdmin()]);
      setCategories(cats);
      setFaqs(items);
      setDrafts({});
    } catch (e) {
      toast({ variant: "destructive", title: "تعذر تحميل الأسئلة", description: apiErrorMessageAr(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => setLinkedId(linkedCategoryId ?? null), [linkedCategoryId]);

  const linked = categories.find((c) => Number(c.id) === linkedId);
  const questions = useMemo(
    () => (linked ? faqs.filter((f) => Number(f.faq_category_id ?? f.category?.id) === Number(linked.id)) : [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [faqs, linked],
  );

  const saveLink = async (categoryId: number | null) => {
    setBusy("link");
    try {
      await onLink(categoryId);
      setLinkedId(categoryId);
      toast({ title: categoryId ? `تم ربط ${words.one} بالتصنيف` : `${words.page} هتعرض الأسئلة العامة` });
    } catch (e) {
      toast({ variant: "destructive", title: "لم يتم حفظ الربط", description: apiErrorMessageAr(e) });
    } finally {
      setBusy("");
    }
  };

  /** Creates a category named after this page (slug = its slug) and links it. */
  const createCategoryForEntity = async () => {
    if (!slug) return;
    setBusy("category");
    try {
      let cat = categories.find((c) => c.slug === slug);
      if (!cat) {
        cat = (await createFaqCategory({ name_ar: `أسئلة ${nameAr || slug}`, name_en: slug, slug, is_active: true, sort_order: categories.length + 1 })) as FaqCategory;
        await load();
      }
      await saveLink(cat ? Number(cat.id) : null);
    } catch (e) {
      toast({ variant: "destructive", title: "تعذر إنشاء التصنيف", description: apiErrorMessageAr(e) });
      setBusy("");
    }
  };

  const draftOf = (f: FaqItem) => drafts[String(f.id)] ?? toDraft(f);
  const setDraft = (id: string, patch: Partial<Draft>, base: Draft) => setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? base), ...patch } }));

  const saveQuestion = async (f: FaqItem) => {
    const d = draftOf(f);
    if (!d.question_ar.trim() || !d.answer_ar.trim()) {
      toast({ variant: "destructive", title: "السؤال والإجابة بالعربي مطلوبين" });
      return;
    }
    setBusy(`q-${f.id}`);
    try {
      await updateFaq(f.id, { ...d, faq_category_id: Number(linked!.id) });
      toast({ title: "تم حفظ السؤال" });
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "لم يتم الحفظ", description: apiErrorMessageAr(e) });
    } finally {
      setBusy("");
    }
  };

  const removeQuestion = async (f: FaqItem) => {
    if (!window.confirm("حذف السؤال ده؟ هيتشال من كل الصفحات اللي بتعرض التصنيف ده.")) return;
    setBusy(`q-${f.id}`);
    try {
      await deleteFaq(f.id);
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "لم يتم الحذف", description: apiErrorMessageAr(e) });
    } finally {
      setBusy("");
    }
  };

  const addQuestion = async () => {
    if (!newDraft || !linked) return;
    if (!newDraft.question_ar.trim() || !newDraft.answer_ar.trim()) {
      toast({ variant: "destructive", title: "السؤال والإجابة بالعربي مطلوبين" });
      return;
    }
    setBusy("new");
    try {
      await createFaq({ ...newDraft, faq_category_id: Number(linked.id), sort_order: questions.length + 1 });
      setNewDraft(null);
      toast({ title: "تمت إضافة السؤال" });
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "لم تتم الإضافة", description: apiErrorMessageAr(e) });
    } finally {
      setBusy("");
    }
  };

  const qaEditor = (d: Draft, onPatch: (p: Partial<Draft>) => void) => (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div className="space-y-2" dir="rtl">
        <Input value={d.question_ar} placeholder="السؤال بالعربي" className="h-10 rounded-xl font-bold" onChange={(e) => onPatch({ question_ar: e.target.value })} />
        <Textarea value={d.answer_ar} rows={3} placeholder="الإجابة بالعربي" className="rounded-xl text-sm leading-relaxed" onChange={(e) => onPatch({ answer_ar: e.target.value })} />
      </div>
      <div className="space-y-2" dir="ltr">
        <Input value={d.question_en} placeholder="Question (English)" className="h-10 rounded-xl" onChange={(e) => onPatch({ question_en: e.target.value })} />
        <Textarea value={d.answer_en} rows={3} placeholder="Answer (English)" className="rounded-xl text-sm" onChange={(e) => onPatch({ answer_en: e.target.value })} />
      </div>
    </div>
  );

  if (!saved) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        احفظ {words.one} أولاً عشان تربطه بتصنيف أسئلة.
      </div>
    );
  }

  return (
    <SectionCard
      icon={<HelpCircle className="h-4 w-4 text-primary" />}
      title={`الأسئلة الشائعة في ${words.page}`}
      description={
        <>{words.page} بتعرض أسئلة تصنيف واحد من شاشة «الأسئلة الشائعة». نفس الأسئلة بتتعدل من هنا أو من هناك. لو مفيش تصنيف مربوط، بيظهر: {words.fallback}.</>
      }
      actions={
        <Link to="/admin/faqs" className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted">
          <ExternalLink className="h-3.5 w-3.5" /> كل الأسئلة والتصنيفات
        </Link>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري التحميل…</div>
      ) : (
        <div className="space-y-4">
          <Field label="تصنيف الأسئلة المربوط">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[16rem] flex-1">
                <ChoiceSelect
                  value={linkedId ? String(linkedId) : ""}
                  disabled={!!busy}
                  onChange={(v) => void saveLink(v ? Number(v) : null)}
                  noneLabel={`بدون تصنيف — ${words.fallback}`}
                  ariaLabel="تصنيف الأسئلة المربوط"
                  options={categories.map((c) => ({
                    value: String(c.id),
                    label: `${c.name_ar} — ${faqs.filter((f) => Number(f.faq_category_id ?? f.category?.id) === Number(c.id)).length} سؤال`,
                  }))}
                />
              </div>
              {!linked && slug && !categories.some((c) => c.slug === slug) && (
                <Button type="button" size="sm" variant="outline" className="h-10 gap-1 rounded-xl" disabled={!!busy} onClick={() => void createCategoryForEntity()}>
                  {busy === "category" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} تصنيف خاص بـ{words.one}
                </Button>
              )}
            </div>
          </Field>

          {linked && (
            <div className="space-y-3">
              {questions.map((f, i) => {
                const d = draftOf(f);
                const id = String(f.id);
                return (
                  <div key={id} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-muted-foreground">سؤال {i + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                          <Switch checked={d.is_active} onCheckedChange={(c) => setDraft(id, { is_active: c }, d)} /> ظاهر
                        </label>
                        <Button type="button" size="sm" className="h-8 gap-1 rounded-xl" disabled={!!busy} onClick={() => void saveQuestion(f)}>
                          {busy === `q-${f.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={!!busy} onClick={() => void removeQuestion(f)} aria-label="حذف">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {qaEditor(d, (p) => setDraft(id, p, d))}
                  </div>
                );
              })}
              {questions.length === 0 && <p className="text-xs text-muted-foreground">التصنيف ده لسه مفيهوش أسئلة.</p>}

              {newDraft ? (
                <div className="space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
                  {qaEditor(newDraft, (p) => setNewDraft({ ...newDraft, ...p }))}
                  <div className="flex gap-2">
                    <Button type="button" size="sm" className="gap-1 rounded-xl" disabled={!!busy} onClick={() => void addQuestion()}>
                      {busy === "new" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} إضافة السؤال
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={() => setNewDraft(null)}>إلغاء</Button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full gap-1 rounded-xl border-dashed" onClick={() => setNewDraft({ question_ar: "", answer_ar: "", question_en: "", answer_en: "", is_active: true, sort_order: 0 })}>
                  <Plus className="h-4 w-4" /> إضافة سؤال لتصنيف «{linked.name_ar}»
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
