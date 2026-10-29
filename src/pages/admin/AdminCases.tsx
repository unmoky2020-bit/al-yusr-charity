import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users, Search, Plus, Trash2, Pencil, CheckCircle2, XCircle,
  Loader2, ExternalLink, ShieldCheck, Tag, FolderKanban, BookOpen,
  Megaphone, AlertCircle, ArrowUpRight, Check, Clock,
  Filter, MapPin, Save, Settings2, X,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChoiceSelect } from "@/components/admin/programs/FormKit";
import { UrgentCasesSettingsCard } from "@/components/admin/UrgentCasesSettingsCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  casesApiV1,
  caseCategoriesApi,
  programsApiV1,
  projectsApi,
  donationCampaignsApi,
  type LaravelCase,
  type LaravelCaseCategory,
  type LaravelProgram,
  type LaravelProject,
  type LaravelDonationCampaign,
} from "@/data/laravelApi";


const STATUS_OPTIONS: Array<{ v: string; ar: string; en: string; cls: string }> = [
  { v: "all", ar: "جميع الحالات", en: "All Cases", cls: "bg-muted text-muted-foreground" },
  { v: "pending_review", ar: "قيد المراجعة", en: "Pending Review", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  { v: "approved", ar: "معتمدة", en: "Approved", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  { v: "completed", ar: "مكتملة", en: "Completed", cls: "bg-primary/15 text-primary" },
  { v: "closed", ar: "مغلقة", en: "Closed", cls: "bg-muted text-muted-foreground" },
  { v: "rejected", ar: "مرفوضة", en: "Rejected", cls: "bg-destructive/15 text-destructive" },
];

export default function AdminCases() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [cases, setCases] = useState<LaravelCase[]>([]);
  const [categories, setCategories] = useState<LaravelCaseCategory[]>([]);
  const [programs, setPrograms] = useState<LaravelProgram[]>([]);
  const [projects, setProjects] = useState<LaravelProject[]>([]);
  const [campaigns, setCampaigns] = useState<LaravelDonationCampaign[]>([]);

  const [stats, setStats] = useState({
    total: 0,
    pending_review: 0,
    approved: 0,
    completed: 0,
    closed: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [relationFilter, setRelationFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");

  // Category management state
  const [showManageCats, setShowManageCats] = useState(false);
  const [newCat, setNewCat] = useState({ name_ar: "", name_en: "", slug: "" });
  const [savingCat, setSavingCat] = useState(false);
  const [editingCat, setEditingCat] = useState<LaravelCaseCategory | null>(null);
  const [savingEditCat, setSavingEditCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<number | string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesRes, statsRes, catsRes, progsRes, projsRes, campsRes] = await Promise.all([
        casesApiV1.listAll().catch(() => [] as LaravelCase[]),
        casesApiV1.statistics().catch(() => null),
        casesApiV1.categories().catch(() => [] as LaravelCaseCategory[]),
        programsApiV1.listAll().catch(() => [] as LaravelProgram[]),
        projectsApi.listAll().catch(() => [] as LaravelProject[]),
        donationCampaignsApi.listAll().catch(() => [] as LaravelDonationCampaign[]),
      ]);

      setPrograms(Array.isArray(progsRes) ? progsRes : []);
      setProjects(Array.isArray(projsRes) ? projsRes : []);
      setCampaigns(Array.isArray(campsRes) ? campsRes : []);

      // Backend categories only; test rows ("The category field is required.") stay hidden.
      setCategories((Array.isArray(catsRes) ? catsRes : []).filter((k) => !/required|field is/i.test(`${k.name_ar} ${k.slug}`)));

      if (Array.isArray(casesRes) && casesRes.length > 0) {
        setCases(casesRes);
      } else {
        setCases([]);
      }

      if (statsRes && typeof statsRes.total === "number") {
        setStats(statsRes);
      } else {
        const loadedList = Array.isArray(casesRes) ? casesRes : [];
        setStats({
          total: loadedList.length,
          pending_review: loadedList.filter((c) => c.status === "pending_review" || c.status === "pending").length,
          approved: loadedList.filter((c) => c.status === "approved").length,
          completed: loadedList.filter((c) => c.status === "completed" || c.status === "funded").length,
          closed: loadedList.filter((c) => c.status === "closed").length,
          rejected: loadedList.filter((c) => c.status === "rejected").length,
        });
      }
    } catch (e: any) {
      console.warn("Error loading cases data:", e);
      toast({ title: isAr ? "خطأ في تحميل بيانات الحالات" : "Failed to load cases", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filtered Cases
  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchSearch =
        !search ||
        (c.title && c.title.includes(search)) ||
        (c.code && c.code.toLowerCase().includes(search.toLowerCase())) ||
        (c.beneficiary_name && c.beneficiary_name.includes(search)) ||
        (c.governorate && c.governorate.includes(search));

      const normStatus = c.status === "pending" ? "pending_review" : c.status === "funded" ? "completed" : c.status;
      const matchStatus = statusFilter === "all" || normStatus === statusFilter;

      const matchCat = catFilter === "all" || String(c.category_id) === String(catFilter);

      let matchRelation = true;
      if (relationFilter === "program") matchRelation = Boolean(c.program_id || c.program);
      else if (relationFilter === "project") matchRelation = Boolean(c.project_id || c.project);
      else if (relationFilter === "campaign") matchRelation = Boolean(c.donation_campaign_id || c.donation_campaign);
      else if (relationFilter === "general") matchRelation = !c.program_id && !c.project_id && !c.donation_campaign_id;

      return matchSearch && matchStatus && matchCat && matchRelation;
    });
  }, [cases, search, statusFilter, catFilter, relationFilter]);

  // Create / edit happen on the full case page (/admin/cases/new, /admin/cases/:id).
  const openNew = () => navigate("/admin/cases/new");
  const openEdit = (c: LaravelCase) => navigate(`/admin/cases/${c.id}`);

  // Quick Change Status
  const handleSetStatus = async (id: number | string, newStatus: string) => {
    try {
      if (!String(id).startsWith("static-")) {
        await casesApiV1.update(id, { status: newStatus } as any);
      }
      setCases((prev) =>
        prev.map((item) => (String(item.id) === String(id) ? { ...item, status: newStatus } : item))
      );
      toast({ title: isAr ? "تم تحديث حالة الحالة" : "Status updated" });
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
    }
  };

  // Delete Case
  const handleDeleteCase = async (id: number | string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذه الحالة؟" : "Are you sure you want to delete this case?")) return;
    try {
      if (!String(id).startsWith("static-")) {
        await casesApiV1.remove(id);
      }
      setCases((prev) => prev.filter((c) => String(c.id) !== String(id)));
      toast({ title: isAr ? "تم حذف الحالة" : "Case deleted" });
    } catch (e: any) {
      toast({ title: e.message || "Failed to delete", variant: "destructive" });
    }
  };

  // Category management handlers
  const handleAddCategory = async () => {
    if (!newCat.name_ar.trim()) return;
    setSavingCat(true);
    try {
      // Generate slug from English name (preferred) or transliterate Arabic safely
      const baseSlug = newCat.name_en.trim()
        ? newCat.name_en.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : newCat.name_ar.trim().replace(/\s+/g, "-");
      const slug = newCat.slug.trim() || `cat-${baseSlug}-${Date.now().toString(36)}`;
      await caseCategoriesApi.create({
        name_ar: newCat.name_ar.trim(),
        name_en: newCat.name_en.trim() || newCat.name_ar.trim(),
        slug,
      } as any);
      setNewCat({ name_ar: "", name_en: "", slug: "" });
      toast({ title: isAr ? "تمت إضافة التصنيف بنجاح" : "Category added successfully" });
      await loadData();
    } catch (e: any) {
      const msg = e?.message || "";
      const isSlugError = msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("slug") || msg.toLowerCase().includes("duplicate");
      toast({
        title: isSlugError
          ? (isAr ? "هذا الـ Slug مستخدم بالفعل، اكتب slug مختلفاً" : "Slug already exists, please enter a unique slug")
          : (e?.message || (isAr ? "خطأ في الإضافة" : "Error adding category")),
        variant: "destructive",
      });
    } finally {
      setSavingCat(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCat || !editingCat.name_ar.trim()) return;
    setSavingEditCat(true);
    try {
      const slug = editingCat.slug?.trim() || editingCat.name_ar.trim().replace(/\s+/g, "-");
      await caseCategoriesApi.update(editingCat.id, {
        name_ar: editingCat.name_ar,
        name_en: editingCat.name_en?.trim() || editingCat.name_ar,
        slug,
      } as any);
      toast({ title: isAr ? "تم تعديل التصنيف بنجاح" : "Category updated successfully" });
      setEditingCat(null);
      await loadData();
    } catch (e: any) {
      const msg = e?.message || "";
      const isSlugError = msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("slug") || msg.toLowerCase().includes("duplicate");
      toast({
        title: isSlugError
          ? (isAr ? "هذا الـ Slug مستخدم بالفعل، غيّره واحفظ مرة ثانية" : "Slug already in use, try a different slug")
          : (e?.message || (isAr ? "خطأ في التحديث" : "Error updating category")),
        variant: "destructive",
      });
    } finally {
      setSavingEditCat(false);
    }
  };

  const handleDeleteCategory = async (id: number | string) => {
    // Count cases linked to this category
    const linkedCount = cases.filter((c) => String(c.category_id) === String(id)).length;
    const confirmMsg = linkedCount > 0
      ? (isAr
          ? `هذا التصنيف مرتبط بـ ${linkedCount} حالة. هل تريد حذفه؟ ستُصبح الحالات المرتبطة به بدون تصنيف.`
          : `This category has ${linkedCount} linked case(s). Delete anyway? Linked cases will become uncategorized.`)
      : (isAr ? "هل أنت متأكد من حذف هذا التصنيف؟" : "Delete this category?");
    if (!confirm(confirmMsg)) return;
    setDeletingCatId(id);
    try {
      await caseCategoriesApi.remove(id);
      toast({ title: isAr ? "تم حذف التصنيف" : "Category deleted" });
      await loadData();
    } catch (e: any) {
      const msg = e?.message || "";
      const isFKError = msg.toLowerCase().includes("foreign key") || msg.toLowerCase().includes("constraint") || msg.includes("1451") || msg.includes("violate");
      toast({
        title: isFKError
          ? (isAr
              ? "لا يمكن حذف هذا التصنيف لأن هناك حالات مرتبطة به. يرجى تغيير تصنيف تلك الحالات أولاً."
              : "Cannot delete: some cases are still linked to this category. Please re-categorize them first.")
          : (e?.message || (isAr ? "خطأ في الحذف" : "Error deleting category")),
        variant: "destructive",
      });
    } finally {
      setDeletingCatId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-foreground">
                {isAr ? "إدارة حالات المستفيدين" : "Beneficiary Cases"}
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr
                ? "إدارة الحالات الإنسانية المعتمدة وقيد المراجعة، ربط الحالات بالبرامج والمشاريع والحملات، ومتابعة جمع التبرعات."
                : "Manage beneficiary cases, review and approve requests, link cases to programs/projects, and track funding."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManageCats(true)}
              className="gap-1.5"
            >
              <Settings2 className="h-4 w-4 text-primary" />
              {isAr ? "إدارة التصنيفات" : "Categories"}
            </Button>
            <Button
              onClick={openNew}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {isAr ? "حالة جديدة" : "New Case"}
            </Button>
          </div>
        </div>

        {/* Real Backend Statistics Bar */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          <StatCard accent label={isAr ? "إجمالي الحالات" : "Total"} value={stats.total} />
          <StatCard label={isAr ? "قيد المراجعة" : "Pending Review"} value={stats.pending_review} />
          <StatCard label={isAr ? "معتمدة ونشطة" : "Approved"} value={stats.approved} />
          <StatCard label={isAr ? "مكتملة التمويل" : "Completed"} value={stats.completed} />
          <StatCard label={isAr ? "مغلقة" : "Closed"} value={stats.closed} />
          <StatCard label={isAr ? "مرفوضة" : "Rejected"} value={stats.rejected} />
        </div>

        {/* Homepage «حالات عاجلة» carousel */}
        <UrgentCasesSettingsCard cases={cases} />

        {/* Filters Box */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالعنوان، كود الحالة، اسم المستفيد، أو المحافظة..." : "Search cases..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {STATUS_OPTIONS.map((f) => (
                <button
                  key={f.v}
                  onClick={() => setStatusFilter(f.v)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === f.v
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/80 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {isAr ? f.ar : f.en}
                </button>
              ))}
            </div>
          </div>

          {/* Relation & Category Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
            <span className="font-bold text-muted-foreground">{isAr ? "نوع الارتباط:" : "Linkage:"}</span>
            {[
              { v: "all", ar: "الكل" },
              { v: "program", ar: "مرتبطة ببرنامج" },
              { v: "project", ar: "مرتبطة بمشروع" },
              { v: "campaign", ar: "مرتبطة بحملة" },
              { v: "general", ar: "حالات عامة" },
            ].map((r) => (
              <button
                key={r.v}
                onClick={() => setRelationFilter(r.v)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  relationFilter === r.v
                    ? "bg-secondary text-secondary-foreground font-black"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {r.ar}
              </button>
            ))}

            <div className="ms-auto flex items-center gap-1.5">
              <span className="font-bold text-muted-foreground">{isAr ? "التصنيف:" : "Category:"}</span>
              <ChoiceSelect value={catFilter} onChange={setCatFilter} className="h-8 w-48 text-xs"
                options={[{ value: "all", label: isAr ? "جميع التصنيفات" : "All Categories" }, ...categories.map((k) => ({ value: String(k.id), label: k.name_ar }))]} />
            </div>
          </div>
        </div>

        {/* Cases Table / Cards */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">{isAr ? "جاري تحميل الحالات..." : "Loading cases..."}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center bg-card/50">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-lg font-bold text-foreground">
              {isAr ? "لا توجد حالات مطابقة للفلاتر" : "No cases found"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? "جرب تعديل خيارات البحث أو قم بإضافة حالة جديدة" : "Try searching or add a new case"}
            </p>
            <Button onClick={openNew} size="sm" className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" /> {isAr ? "إضافة حالة جديدة" : "Add Case"}
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                  <tr>
                    <th className="p-3.5 text-start">{isAr ? "كود الحالة" : "Code"}</th>
                    <th className="p-3.5 text-start">{isAr ? "العنوان والمستفيد" : "Title & Beneficiary"}</th>
                    <th className="p-3.5 text-start">{isAr ? "الارتباط (برنامج / مشروع / حملة)" : "Linked To"}</th>
                    <th className="p-3.5 text-start">{isAr ? "الموقع" : "Location"}</th>
                    <th className="p-3.5 text-start">{isAr ? "الأولوية" : "Priority"}</th>
                    <th className="p-3.5 text-start">{isAr ? "المبلغ المطلوب" : "Target"}</th>
                    <th className="p-3.5 text-start">{isAr ? "الحالة" : "Status"}</th>
                    <th className="p-3.5 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((item, _idx) => {
                    const normSt = item.status === "pending" ? "pending_review" : item.status === "funded" ? "completed" : item.status || "approved";
                    const progLinked = programs.find((p) => String(p.id) === String(item.program_id)) || item.program;
                    const projLinked = projects.find((p) => String(p.id) === String(item.project_id)) || item.project;
                    const campLinked = campaigns.find((c) => String(c.id) === String(item.donation_campaign_id)) || item.donation_campaign;

                    return (
                      <tr key={item.id != null ? String(item.id) : `case-idx-${_idx}`} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-mono text-xs font-bold text-primary">
                          {item.code || `CASE-${item.id}`}
                        </td>

                        <td className="p-3.5 max-w-[260px]">
                          <Link
                            to={`/admin/cases/${item.id}`}
                            className="font-bold text-foreground hover:text-primary transition line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {isAr ? "المستفيد:" : "Beneficiary:"} {item.beneficiary_name}
                            {item.age ? ` (${item.age} سنة)` : ""}
                          </p>
                        </td>

                        <td className="p-3.5">
                          {progLinked ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                              <BookOpen className="h-3 w-3" />
                              <span>{(progLinked as any).name_ar || (progLinked as any).name}</span>
                            </span>
                          ) : projLinked ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                              <FolderKanban className="h-3 w-3" />
                              <span>{(projLinked as any).name_ar || (projLinked as any).name}</span>
                            </span>
                          ) : campLinked ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                              <Megaphone className="h-3 w-3" />
                              <span>{(campLinked as any).name_ar || (campLinked as any).name}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {isAr ? "حالة عامة" : "General"}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {item.governorate || "الدقهلية"}
                          {item.city ? ` • ${item.city}` : ""}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              item.priority === "high" || item.priority === "critical"
                                ? "bg-red-500/15 text-red-700 dark:text-red-400"
                                : item.priority === "medium"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.priority === "high" || item.priority === "critical"
                              ? (isAr ? "عاجلة / عالية" : "High")
                              : item.priority === "medium"
                              ? (isAr ? "متوسطة" : "Medium")
                              : (isAr ? "عادية" : "Low")}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono text-xs font-bold text-foreground whitespace-nowrap">
                          {Number(item.target_amount || 0).toLocaleString()} ج.م
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              normSt === "approved"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : normSt === "completed"
                                ? "bg-primary/15 text-primary"
                                : normSt === "pending_review"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : normSt === "rejected"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {STATUS_OPTIONS.find((s) => s.v === normSt)?.ar || normSt}
                          </span>
                        </td>

                        <td className="p-3.5 text-end whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {normSt === "pending_review" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSetStatus(item.id, "approved")}
                                className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title={isAr ? "اعتماد الحالة" : "Approve"}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(item)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title={isAr ? "تعديل" : "Edit"}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Link to={`/admin/cases/${item.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                                title={isAr ? "التفاصيل" : "Details"}
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCase(item.id)}
                              className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                              title={isAr ? "حذف" : "Delete"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog: إدارة تصنيفات الحالات ── */}
      <Dialog
        open={showManageCats}
        onOpenChange={(o) => {
          setShowManageCats(o);
          if (!o) setEditingCat(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-lg">
              <Settings2 className="h-5 w-5 text-primary" />
              {isAr ? "إدارة تصنيفات الحالات" : "Manage Case Categories"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? "إضافة وتعديل وحذف تصنيفات الحالات الإنسانية."
                : "Add, edit, and delete beneficiary case categories."}
            </DialogDescription>
          </DialogHeader>

          {/* ── Add New Category Form ── */}
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Plus className="h-4 w-4" />
              <span>{isAr ? "إضافة تصنيف جديد" : "Add New Category"}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <Label className="text-[11px] font-bold">{isAr ? "اسم التصنيف بالعربية *" : "Name (Arabic) *"}</Label>
                <Input
                  value={newCat.name_ar}
                  onChange={(e) => setNewCat({ ...newCat, name_ar: e.target.value })}
                  placeholder="مثال: أمراض مزمنة"
                  className="mt-1 h-8 text-xs"
                  dir="rtl"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold">{isAr ? "الاسم بالإنجليزية" : "Name (English)"}</Label>
                <Input
                  value={newCat.name_en}
                  onChange={(e) => setNewCat({ ...newCat, name_en: e.target.value })}
                  placeholder="Chronic Diseases"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={newCat.slug}
                  onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                  placeholder="slug (اختياري)"
                  className="h-8 text-xs font-mono"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddCategory}
                disabled={savingCat || !newCat.name_ar.trim()}
                className="h-8 px-3 text-xs gap-1 bg-primary text-primary-foreground shrink-0 cursor-pointer"
              >
                {savingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {isAr ? "إضافة" : "Add"}
              </Button>
            </div>
          </div>

          {/* ── Existing Categories List ── */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-muted-foreground block">
              {isAr ? `التصنيفات الحالية (${categories.length}):` : `Current Categories (${categories.length}):`}
            </label>
            {categories.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                {isAr ? "لا توجد تصنيفات حتى الآن" : "No categories yet"}
              </p>
            ) : (
              categories.map((cat) => (
                <div
                  key={String(cat.id)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-xs"
                >
                  {editingCat?.id === cat.id ? (
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={editingCat.name_ar}
                          onChange={(e) => setEditingCat({ ...editingCat, name_ar: e.target.value })}
                          placeholder={isAr ? "الاسم العربي" : "Arabic name"}
                          className="h-8 text-xs"
                          dir="rtl"
                        />
                        <Input
                          value={editingCat.name_en || ""}
                          onChange={(e) => setEditingCat({ ...editingCat, name_en: e.target.value })}
                          placeholder="English name"
                          className="h-8 text-xs"
                        />
                      </div>
                      <Input
                        value={editingCat.slug || ""}
                        onChange={(e) => setEditingCat({ ...editingCat, slug: e.target.value })}
                        placeholder="slug"
                        className="h-8 text-xs font-mono"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingCat(null)} className="h-7 px-2 text-xs">
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleUpdateCategory}
                          disabled={savingEditCat}
                          className="h-7 px-3 text-xs gap-1"
                        >
                          {savingEditCat ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          {isAr ? "حفظ" : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{cat.name_ar}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono truncate">
                          <span>{cat.slug}</span>
                          {cat.name_en && (
                            <>
                              <span>•</span>
                              <span className="font-sans">{cat.name_en}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCat({ ...cat })}
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={deletingCatId === cat.id}
                          className="h-7 w-7 p-0 rounded-lg text-destructive hover:text-destructive/80 cursor-pointer"
                        >
                          {deletingCatId === cat.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}