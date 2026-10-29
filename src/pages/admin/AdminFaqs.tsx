import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HelpCircle, Plus, Search, Edit2, Trash2, CheckCircle2,
  AlertCircle, Eye, EyeOff, FolderPlus,
  ArrowUpDown, ExternalLink
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/LangContext";
import {
  fetchFaqsAdmin, fetchFaqCategoriesAdmin, createFaq, updateFaq, deleteFaq,
  FAQ_PAGE_CATEGORIES,
  type FaqItem, type FaqCategory
} from "@/data/faqsApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";

export const AdminFaqs = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);


  // Form State
  const [formCategory, setFormCategory] = useState<string>("home");
  const [questionAr, setQuestionAr] = useState("");
  const [questionEn, setQuestionEn] = useState("");
  const [answerAr, setAnswerAr] = useState("");
  const [answerEn, setAnswerEn] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);


  // Queries
  // Admin reads come only from Laravel (GET /faqs) — no static fallback rows.
  const { data: faqs = [], isLoading: isFaqsLoading, error: faqsError } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: () => fetchFaqsAdmin(),
    retry: false,
  });

  const { data: categories = [] } = useQuery<FaqCategory[]>({
    queryKey: ["admin-faq-categories"],
    queryFn: () => fetchFaqCategoriesAdmin().catch(() => [] as FaqCategory[]),
  });

  // Open Dialog for Create
  const handleOpenCreate = () => {
    setEditingFaq(null);
    setFormCategory("home");
    setQuestionAr("");
    setQuestionEn("");
    setAnswerAr("");
    setAnswerEn("");
    setSortOrder(faqs.length + 1);
    setIsActive(true);
    setIsDialogOpen(true);
  };

  // Open Dialog for Edit
  const handleOpenEdit = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFormCategory(faq.category?.slug || faq.pageCategory || "home");
    setQuestionAr(faq.question_ar);
    setQuestionEn(faq.question_en || "");
    setAnswerAr(faq.answer_ar);
    setAnswerEn(faq.answer_en || "");
    setSortOrder(faq.sort_order || 1);
    setIsActive(faq.is_active ?? true);
    setIsDialogOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Find matching category ID from backend categories
      const targetCat = categories.find((c) => c.slug.toLowerCase() === formCategory.toLowerCase());
      const catId = targetCat?.id || null;

      if (editingFaq) {
        return updateFaq(editingFaq.id, {
          faq_category_id: catId,
          question_ar: questionAr,
          question_en: questionEn || undefined,
          answer_ar: answerAr,
          answer_en: answerEn || undefined,
          sort_order: sortOrder,
          is_active: isActive,
        });
      } else {
        return createFaq({
          faq_category_id: catId,
          question_ar: questionAr,
          question_en: questionEn || undefined,
          answer_ar: answerAr,
          answer_en: answerEn || undefined,
          sort_order: sortOrder,
          is_active: isActive,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: isAr ? "تم الحفظ بنجاح" : "Saved successfully",
        description: isAr
          ? editingFaq ? "تم تعديل السؤال الشائع" : "تمت إضافة السؤال الشائع الجديد"
          : "FAQ item saved to backend.",
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["all-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["faqs-home"] });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ أثناء الحفظ" : "Save error",
        description: apiErrorMessage(err, isAr ? "يرجى التحقق من الاتصال بالباك إند" : "Check backend connection"),
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return deleteFaq(id);
    },
    onSuccess: () => {
      toast({
        title: isAr ? "تم الحذف" : "Deleted",
        description: isAr ? "تم حذف السؤال الشائع بنجاح" : "FAQ deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["all-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["faqs-home"] });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: isAr ? "فشل الحذف" : "Delete failed",
        description: apiErrorMessage(err),
      });
    },
  });

  // Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number | string; is_active: boolean }) => {
      return updateFaq(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["all-faqs"] });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: isAr ? "فشل تغيير الحالة" : "Status change failed",
        description: apiErrorMessage(err),
      });
    },
  });

  // Filtered List

  // Filtered List
  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      const matchCat =
        selectedCat === "all" ||
        (f.category?.slug || f.pageCategory)?.toLowerCase() === selectedCat.toLowerCase();

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        f.question_ar.toLowerCase().includes(q) ||
        f.answer_ar.toLowerCase().includes(q) ||
        (f.question_en && f.question_en.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [faqs, selectedCat, search]);

  const activeCount = faqs.filter((f) => f.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ─── Page Header ─── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary/15 text-secondary">
                <HelpCircle className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-foreground">
                  {isAr ? "إدارة الأسئلة الشائعة وتصنيفاتها" : "FAQ & Categories Management"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "إدارة الأسئلة الشائعة المعروضة في كل صفحة (الرئيسية، من نحن، البرامج، تواصل معنا) ومركز الأسئلة."
                    : "Manage page-specific FAQs and the public FAQ Hub."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleOpenCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? "إضافة سؤال جديد" : "Add FAQ"}</span>
            </Button>
          </div>
        </div>

        {/* ─── Metric Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm text-start rtl:text-right" dir={isAr ? "rtl" : "ltr"}>
            <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              {isAr ? "إجمالي الأسئلة" : "Total FAQs"}
            </div>
            <div className="mt-1 text-2xl font-black text-primary">{faqs.length}</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm text-start rtl:text-right" dir={isAr ? "rtl" : "ltr"}>
            <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              {isAr ? "الأسئلة النشطة" : "Active FAQs"}
            </div>
            <div className="mt-1 text-2xl font-black text-secondary">{activeCount}</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm text-start rtl:text-right" dir={isAr ? "rtl" : "ltr"}>
            <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              {isAr ? "الصفحات المشمولة" : "Covered Pages"}
            </div>
            <div className="mt-1 text-2xl font-black text-foreground">{FAQ_PAGE_CATEGORIES.length} {isAr ? "صفحات" : "pages"}</div>
          </div>
        </div>

        {/* ─── Filters & Search Bar ─── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm" dir={isAr ? "rtl" : "ltr"}>
          {/* Search — icon placed on the left side to avoid collision with RTL Arabic text */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "بحث في نص السؤال أو الإجابة..." : "Search question or answer..."}
              className="pl-9 pr-3.5 h-9 text-xs"
              dir={isAr ? "rtl" : "ltr"}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label className="text-xs font-bold text-muted-foreground shrink-0">
              {isAr ? "تصفية حسب الصفحة:" : "Filter by page:"}
            </Label>
            <Select value={selectedCat} onValueChange={setSelectedCat} dir={isAr ? "rtl" : "ltr"}>
              <SelectTrigger className="h-9 w-full sm:w-60 text-xs font-bold border-primary/20 focus:ring-primary/30 text-start" dir={isAr ? "rtl" : "ltr"}>
                <SelectValue placeholder={isAr ? "جميع الصفحات" : "All pages"} />
              </SelectTrigger>
              <SelectContent className="text-xs" dir={isAr ? "rtl" : "ltr"}>
                <SelectItem value="all" className="text-xs font-bold">
                  {isAr ? "جميع الصفحات" : "All pages"}
                </SelectItem>
                {FAQ_PAGE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug} className="text-xs">
                    {isAr ? cat.name_ar : cat.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── Questions List Table / Cards ─── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" dir={isAr ? "rtl" : "ltr"}>
          {isFaqsLoading ? (
            <div className="py-16 text-center text-muted-foreground font-bold">
              {isAr ? "جاري تحميل الأسئلة..." : "Loading FAQs..."}
            </div>
          ) : faqsError ? (
            <div className="py-16 text-center text-destructive">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive/60" />
              <p className="mt-2 text-sm font-bold">{apiErrorMessage(faqsError, isAr ? "تعذر تحميل الأسئلة من الخادم" : "Could not load FAQs")}</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-bold">{isAr ? "لا توجد أسئلة تطابق البحث" : "No FAQs found"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredFaqs.map((faq) => {
                const catSlug = faq.category?.slug || faq.pageCategory || "home";
                const catInfo = FAQ_PAGE_CATEGORIES.find((c) => c.slug === catSlug);

                return (
                  <div
                    key={faq.id}
                    className="p-5 hover:bg-muted/30 transition flex flex-col md:flex-row md:items-start justify-between gap-4 text-start rtl:text-right"
                    dir={isAr ? "rtl" : "ltr"}
                  >
                    <div className="space-y-2 min-w-0 flex-1 text-start rtl:text-right" dir={isAr ? "rtl" : "ltr"}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black text-black shadow-xs">
                          {catInfo ? (isAr ? catInfo.name_ar : catInfo.name_en) : (faq.category?.name_ar || catSlug)}
                        </span>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground font-mono">
                          #{faq.sort_order || 1}
                        </span>
                        {!faq.is_active && (
                          <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                            {isAr ? "معطّل" : "Inactive"}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-foreground leading-snug text-start rtl:text-right" dir="rtl">
                        {faq.question_ar}
                      </h3>
                      {faq.question_en && (
                        <p className="text-xs font-semibold text-muted-foreground font-sans text-start ltr:text-left" dir="ltr">
                          {faq.question_en}
                        </p>
                      )}

                      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed text-start rtl:text-right" dir="rtl">
                        {faq.answer_ar}
                      </p>
                      {faq.answer_en && (
                        <p className="text-xs text-muted-foreground font-sans leading-relaxed text-start ltr:text-left" dir="ltr">
                          {faq.answer_en}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-start pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: faq.id,
                            is_active: !faq.is_active,
                          })
                        }
                        title={faq.is_active ? (isAr ? "تعطيل السؤال" : "Deactivate") : (isAr ? "تفعيل السؤال" : "Activate")}
                        className="h-8 px-2 text-xs"
                      >
                        {faq.is_active ? (
                          <Eye className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(faq)}
                        className="h-8 px-2.5 text-xs font-bold gap-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>{isAr ? "تعديل" : "Edit"}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(isAr ? "هل أنت متأكد من حذف هذا السؤال؟" : "Delete this FAQ?")) {
                            deleteMutation.mutate(faq.id);
                          }
                        }}
                        className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Add/Edit Modal Dialog ─── */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl" dir={isAr ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-primary">
                {editingFaq
                  ? (isAr ? "تعديل السؤال الشائع" : "Edit FAQ Item")
                  : (isAr ? "إضافة سؤال شائع جديد" : "Add New FAQ Item")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAr
                  ? "حدد تصنيف الصفحة لكي يظهر السؤال في قسمها الخاص وفي مركز الأسئلة الشائعة."
                  : "Assign to a page category to appear in both the page FAQ section and FAQ Hub."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">{isAr ? "تصنيف الصفحة:" : "Page Category:"}</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="mt-1 h-9 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_PAGE_CATEGORIES.map((c) => (
                        <SelectItem key={c.slug} value={c.slug} className="text-xs">
                          {isAr ? c.name_ar : c.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-bold">{isAr ? "ترتيب الظهور:" : "Sort Order:"}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">{isAr ? "السؤال بالعربية (مطلوب):" : "Question in Arabic (Required):"}</Label>
                <Input
                  value={questionAr}
                  onChange={(e) => setQuestionAr(e.target.value)}
                  placeholder={isAr ? "مثال: كيف أضمن وصول تبرعي لمستحقيه؟" : "Enter question in Arabic"}
                  className="mt-1 h-9 text-xs font-bold"
                  dir="rtl"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">{isAr ? "السؤال بالإنجليزية (اختياري):" : "Question in English (Optional):"}</Label>
                <Input
                  value={questionEn}
                  onChange={(e) => setQuestionEn(e.target.value)}
                  placeholder="e.g. How do I ensure my donation reaches those in need?"
                  className="mt-1 h-9 text-xs"
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">{isAr ? "الإجابة بالعربية (مطلوب):" : "Answer in Arabic (Required):"}</Label>
                <Textarea
                  rows={4}
                  value={answerAr}
                  onChange={(e) => setAnswerAr(e.target.value)}
                  placeholder={isAr ? "اكتب الإجابة المفصلة والشافية..." : "Enter full answer in Arabic"}
                  className="mt-1 text-xs leading-relaxed"
                  dir="rtl"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">{isAr ? "الإجابة بالإنجليزية (اختياري):" : "Answer in English (Optional):"}</Label>
                <Textarea
                  rows={3}
                  value={answerEn}
                  onChange={(e) => setAnswerEn(e.target.value)}
                  placeholder="Enter answer in English..."
                  className="mt-1 text-xs leading-relaxed"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <div className="text-xs font-bold">{isAr ? "تفعيل السؤال" : "Active Status"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {isAr ? "إظهار السؤال للزوار في الموقع" : "Make question publicly visible"}
                  </div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={!questionAr.trim() || !answerAr.trim() || saveMutation.isPending}
                className="bg-primary text-primary-foreground text-xs font-bold"
              >
                {saveMutation.isPending
                  ? (isAr ? "جاري الحفظ..." : "Saving...")
                  : (isAr ? "حفظ السؤال" : "Save Question")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminFaqs;
