import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen, Plus, Pencil, Trash2, Loader2, Save, X, Search,
  Eye, EyeOff, Globe2, ExternalLink, Tag, Compass, Calendar,
  FileText, ShieldCheck, Users,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  programsApiV1,
  axesApi,
  seasonsApi,
  type LaravelProgram,
  type LaravelSeason,
  type LaravelAxis,
  formatServerImageUrl,
} from "@/data/laravelApi";

export default function AdminPrograms() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const nav = useNavigate();

  const [programs, setPrograms] = useState<LaravelProgram[]>([]);
  const [axes, setAxes] = useState<LaravelAxis[]>([]);
  const [seasons, setSeasons] = useState<LaravelSeason[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedAxis, setSelectedAxis] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Edit / Create Dialog
  const [editing, setEditing] = useState<Partial<LaravelProgram> | null>(null);
  const [benefitsArText, setBenefitsArText] = useState("");
  const [benefitsEnText, setBenefitsEnText] = useState("");
  const [saving, setSaving] = useState(false);

  // Donation Packages Dialog
  const [pkgProgram, setPkgProgram] = useState<LaravelProgram | null>(null);
  const [newPkg, setNewPkg] = useState({ name_ar: "باقة 100 جنيه", name_en: "100 EGP Package", amount: 100, is_active: true });
  const [savingPkg, setSavingPkg] = useState(false);


  // Load programs, axes, seasons from backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [progsRes, axesRes, seasonsRes] = await Promise.all([
        programsApiV1.listAll().catch(() => [] as LaravelProgram[]),
        axesApi.listAll().catch(() => [] as LaravelAxis[]),
        seasonsApi.listAll().catch(() => [] as LaravelSeason[]),
      ]);

      setAxes(Array.isArray(axesRes) ? axesRes : []);
      setSeasons(Array.isArray(seasonsRes) ? seasonsRes : []);
      setPrograms(Array.isArray(progsRes) ? progsRes : []);
    } catch (e: any) {
      console.warn("Programs load error:", e);
      toast({ title: isAr ? "خطأ في تحميل البرامج" : "Failed to load programs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filtered List
  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const name = p.name_ar || p.name || p.title_ar || "";
      const nameEn = p.name_en || p.title_en || "";
      const slug = p.slug || "";
      const queryMatch =
        !search ||
        name.includes(search) ||
        nameEn.toLowerCase().includes(search.toLowerCase()) ||
        slug.toLowerCase().includes(search.toLowerCase());

      const axisMatch =
        selectedAxis === "all" ||
        String(p.axis_id) === String(selectedAxis) ||
        (p.axis && String(p.axis.id) === String(selectedAxis));

      const stMatch =
        statusFilter === "all" ||
        (statusFilter === "published" && (p.status === "published" || !p.status)) ||
        (statusFilter === "draft" && p.status === "draft");

      return queryMatch && axisMatch && stMatch;
    });
  }, [programs, search, selectedAxis, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = programs.length;
    const active = programs.filter((p) => p.is_active !== false).length;
    const published = programs.filter((p) => p.status === "published" || !p.status).length;
    const totalTarget = programs.reduce((acc, p) => acc + Number(p.target_amount || 0), 0);
    return { total, active, published, totalTarget };
  }, [programs]);

  // Open New Program Dialog
  const openNew = () => {
    setEditing({
      name_ar: "",
      name_en: "",
      slug: "",
      axis_id: axes[0]?.id ? Number(axes[0].id) : null,
      season_ids: [],
      tagline_ar: "",
      tagline_en: "",
      period_ar: "",
      period_en: "",
      description_ar: "",
      description_en: "",
      content_ar: "",
      content_en: "",
      benefits_ar: [],
      benefits_en: [],
      target_amount: 50000,
      minimum_amount: 100,
      status: "published",
      is_active: true,
      donation_available: true,
      hide_from_audience: false,
      sort_order: (programs.length || 0) + 1,
      image: "",
    });
    setBenefitsArText("");
    setBenefitsEnText("");
  };

  // Open Edit Program Dialog
  const openEdit = (p: LaravelProgram) => {
    setEditing({
      ...p,
      name_ar: p.name_ar || p.name || p.title_ar || "",
      name_en: p.name_en || p.title_en || "",
      description_ar: p.description_ar || p.description || "",
      season_ids: p.season_ids || (p.seasons ? p.seasons.map((s) => s.id) : []),
    });
    setBenefitsArText(Array.isArray(p.benefits_ar) ? p.benefits_ar.join("\n") : "");
    setBenefitsEnText(Array.isArray(p.benefits_en) ? p.benefits_en.join("\n") : "");
  };

  // Save Program
  const handleSaveProgram = async () => {
    if (!editing || !editing.name_ar?.trim()) {
      toast({ title: isAr ? "يرجى إدخال اسم البرنامج بالعربية" : "Please enter program name", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const parsedBenefitsAr = benefitsArText.split("\n").map((s) => s.trim()).filter(Boolean);
      const parsedBenefitsEn = benefitsEnText.split("\n").map((s) => s.trim()).filter(Boolean);

      const payload: Partial<LaravelProgram> = {
        name_ar: editing.name_ar.trim(),
        name_en: editing.name_en?.trim() || editing.name_ar.trim(),
        name: editing.name_ar.trim(),
        slug: editing.slug?.trim() || editing.name_ar.trim().toLowerCase().replace(/\s+/g, "-"),
        axis_id: editing.axis_id ? Number(editing.axis_id) : null,
        season_ids: Array.isArray(editing.season_ids) ? editing.season_ids : [],
        tagline_ar: editing.tagline_ar?.trim() || null,
        tagline_en: editing.tagline_en?.trim() || null,
        period_ar: editing.period_ar?.trim() || null,
        period_en: editing.period_en?.trim() || null,
        description_ar: editing.description_ar?.trim() || editing.name_ar.trim(),
        description_en: editing.description_en?.trim() || null,
        description: editing.description_ar?.trim() || editing.name_ar.trim(),
        content_ar: editing.content_ar?.trim() || editing.description_ar?.trim() || null,
        content_en: editing.content_en?.trim() || null,
        benefits_ar: parsedBenefitsAr,
        benefits_en: parsedBenefitsEn,
        target_amount: Number(editing.target_amount || 0),
        minimum_amount: Number(editing.minimum_amount || 50),
        donation_available: editing.donation_available !== false,
        status: editing.status || "published",
        is_active: editing.is_active !== false,
        hide_from_audience: Boolean(editing.hide_from_audience),
        sort_order: Number(editing.sort_order || 1),
        image: editing.image?.trim() || null,
      };

      if (editing.id && !String(editing.id).startsWith("static-")) {
        await programsApiV1.update(editing.id, payload as any);
        toast({ title: isAr ? "تم تحديث البرنامج بنجاح" : "Program updated successfully" });
      } else {
        await programsApiV1.create(payload as any);
        toast({ title: isAr ? "تم إنشاء البرنامج بنجاح في قاعدة البيانات" : "Program created successfully" });
      }

      setEditing(null);
      await loadData();
    } catch (e: any) {
      toast({ title: e.message || (isAr ? "فشل حفظ البرنامج" : "Failed to save program"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete Program
  const handleDeleteProgram = async (id: number | string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا البرنامج؟" : "Are you sure you want to delete this program?")) return;
    try {
      if (!String(id).startsWith("static-")) {
        await programsApiV1.remove(id);
      }
      setPrograms((prev) => prev.filter((p) => String(p.id) !== String(id)));
      toast({ title: isAr ? "تم حذف البرنامج" : "Program deleted" });
    } catch (e: any) {
      toast({ title: e.message || "Failed to delete", variant: "destructive" });
    }
  };

  // Toggle Active
  const handleToggleActive = async (p: LaravelProgram) => {
    const next = !p.is_active;
    try {
      if (!String(p.id).startsWith("static-")) {
        await programsApiV1.update(p.id, { is_active: next } as any);
      }
      setPrograms((prev) =>
        prev.map((item) => (String(item.id) === String(p.id) ? { ...item, is_active: next } : item))
      );
      toast({ title: isAr ? `تم ${next ? "تفعيل" : "تعطيل"} البرنامج` : `Program ${next ? "activated" : "deactivated"}` });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  // Add Donation Package to Program
  const handleAddPackage = async () => {
    if (!pkgProgram || !newPkg.name_ar.trim() || Number(newPkg.amount) <= 0) {
      toast({ title: isAr ? "يرجى كتابة اسم الباقة والمبلغ" : "Fill package name and amount", variant: "destructive" });
      return;
    }
    setSavingPkg(true);
    try {
      if (!String(pkgProgram.id).startsWith("static-")) {
        await programsApiV1.addPackage(pkgProgram.id, {
          name_ar: newPkg.name_ar.trim(),
          name_en: newPkg.name_en?.trim() || null,
          amount: Number(newPkg.amount),
          sort_order: 1,
          is_active: newPkg.is_active,
        });
        toast({ title: isAr ? "تمت إضافة باقة التبرع (السهم) للبرنامج" : "Donation package added" });
      } else {
        toast({ title: isAr ? "احفظ البرنامج أولاً في قاعدة البيانات لإضافة باقات إليه" : "Save program to backend DB first" });
      }
      setPkgProgram(null);
      await loadData();
    } catch (e: any) {
      toast({ title: e.message || "Failed to add package", variant: "destructive" });
    } finally {
      setSavingPkg(false);
    }
  };

  // Sync static programs to backend DB

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-foreground">
                {isAr ? "إدارة البرامج الخيرية" : "Programs Management"}
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr
                ? "إدارة البرامج الإنسانية والتنموية التابعة لجمعية اليسر، ربطها بالمحاور والمواسم، وضبط باقات الأسهم."
                : "Manage humanitarian and development programs, link with axes and seasons, and manage share tiers."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => nav('/admin/programs/new')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {isAr ? "برنامج جديد" : "New Program"}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            accent
            label={isAr ? "إجمالي البرامج" : "Total Programs"}
            value={stats.total}
          />
          <StatCard
            label={isAr ? "برامج نشطة" : "Active Programs"}
            value={stats.active}
          />
          <StatCard
            label={isAr ? "برامج منشورة" : "Published"}
            value={stats.published}
          />
          <StatCard
            label={isAr ? "إجمالي المستهدف" : "Total Target"}
            value={`${stats.totalTarget.toLocaleString("en-US")} ج.م`}
          />
        </div>

        {/* Filters Bar */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث باسم البرنامج، الشعار أو المعرف (slug)..." : "Search programs..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5">
              {(
                [
                  { v: "all", ar: "الكل", en: "All" },
                  { v: "published", ar: "منشور", en: "Published" },
                  { v: "draft", ar: "مسودة", en: "Draft" },
                ] as const
              ).map((f) => (
                <button
                  key={f.v}
                  onClick={() => setStatusFilter(f.v)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
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

          {/* Axes Horizontal Tabs */}
          {axes.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
              <span className="text-xs font-bold text-muted-foreground shrink-0 ms-1">
                {isAr ? "المحور:" : "Axis:"}
              </span>
              <button
                onClick={() => setSelectedAxis("all")}
                className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  selectedAxis === "all"
                    ? "bg-secondary text-secondary-foreground font-black"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {isAr ? "جميع المحاور" : "All Axes"}
              </button>
              {axes.map((ax) => (
                <button
                  key={String(ax.id)}
                  onClick={() => setSelectedAxis(String(ax.id))}
                  className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    selectedAxis === String(ax.id)
                      ? "bg-secondary text-secondary-foreground font-black"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {ax.name_ar}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">{isAr ? "جاري تحميل البرامج..." : "Loading programs..."}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center bg-card/50">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-lg font-bold text-foreground">
              {isAr ? "لا توجد برامج مطابقة" : "No programs found"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? "جرب تغيير خيارات البحث أو قم بإضافة برنامج جديد" : "Try adjusting filters or add a new program"}
            </p>
            <Button onClick={openNew} size="sm" className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" /> {isAr ? "إضافة برنامج جديد" : "Add Program"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((prog) => {
              const nameAr = prog.name_ar || prog.name || prog.title_ar || "برنامج";
              const target = Number(prog.target_amount || 0);
              const axisObj = axes.find((ax) => String(ax.id) === String(prog.axis_id)) || prog.axis;
              const pkgsCount = prog.donation_packages?.length || 0;
              const casesCount = prog.cases?.length || 0;

              return (
                <div
                  key={String(prog.id)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition hover:border-primary/50 hover:shadow-card"
                >
                  {/* Top Image & Badges */}
                  <div className="relative h-40 w-full overflow-hidden bg-muted">
                    {prog.image ? (
                      <img
                        src={formatServerImageUrl(prog.image)}
                        alt={nameAr}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-emerald-500/5 to-secondary/15">
                        <BookOpen className="h-10 w-10 text-primary/40" />
                      </div>
                    )}

                    <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                      {axisObj && (
                        <span className="rounded-lg bg-background/90 px-2 py-0.5 text-[11px] font-bold text-foreground shadow-sm backdrop-blur">
                          {axisObj.name_ar}
                        </span>
                      )}
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold shadow-sm ${
                          prog.status === "published" || !prog.status
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {prog.status === "published" || !prog.status ? (isAr ? "منشور" : "Published") : (isAr ? "مسودة" : "Draft")}
                      </span>
                    </div>

                    <div className="absolute top-2.5 end-2.5">
                      <Link
                        to={`/programs/${prog.slug}`}
                        target="_blank"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 text-foreground backdrop-blur hover:bg-background shadow-sm"
                        title={isAr ? "معاينة صفحة البرنامج" : "Preview"}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-black text-foreground text-base line-clamp-1">
                          {nameAr}
                        </h3>
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {prog.slug}
                        </span>
                      </div>

                      {prog.tagline_ar && (
                        <p className="mt-1 text-xs font-semibold text-secondary line-clamp-1">
                          {prog.tagline_ar}
                        </p>
                      )}

                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                        {prog.description_ar || prog.description || (isAr ? "لا يوجد وصف مدخل" : "No description")}
                      </p>
                    </div>

                    {/* Metadata & Stats */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "المستهدف" : "Target"}:</span>
                        <span className="font-bold text-foreground">
                          {target > 0 ? `${target.toLocaleString("en-US")} ج.م` : (isAr ? "مستمر" : "Ongoing")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-secondary" />
                          <span>{pkgsCount} {isAr ? "باقات أسهم" : "packages"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-primary" />
                          <span>{casesCount} {isAr ? "حالات مرتبطة" : "cases"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between border-t border-border/70 bg-muted/30 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={prog.is_active !== false}
                        onCheckedChange={() => handleToggleActive(prog)}
                      />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {prog.is_active !== false ? (isAr ? "مفعل" : "On") : (isAr ? "معطل" : "Off")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPkgProgram(prog)}
                        className="h-8 px-2 text-xs gap-1 text-secondary hover:text-secondary-foreground hover:bg-secondary/20"
                        title={isAr ? "إدارة باقات الأسهم" : "Packages"}
                      >
                        <Tag className="h-3.5 w-3.5" />
                        <span>{isAr ? "باقات" : "Tiers"}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title={isAr ? "تعديل" : "Edit"}
                        asChild
                      >
                        <Link to={`/admin/programs/${prog.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProgram(prog.id)}
                        className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        title={isAr ? "حذف" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dialog: Create / Edit Program ── */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5 text-primary" />
              {editing?.id && !String(editing.id).startsWith("static-")
                ? (isAr ? "تعديل بيانات البرنامج" : "Edit Program")
                : (isAr ? "إضافة برنامج خيري جديد" : "New Program")}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">{isAr ? "البيانات الأساسية" : "Basic Info"}</TabsTrigger>
                <TabsTrigger value="content">{isAr ? "المحتوى والفوائد" : "Content & Benefits"}</TabsTrigger>
                <TabsTrigger value="finance">{isAr ? "التبرع والمبالغ" : "Donation & Finance"}</TabsTrigger>
              </TabsList>

              {/* Tab 1: Basic */}
              <TabsContent value="basic" className="space-y-4 py-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "اسم البرنامج (عربي) *" : "Name (Arabic) *"}</Label>
                    <Input
                      value={editing.name_ar || ""}
                      onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })}
                      placeholder="مثال: كفالة طالب علم"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isAr ? "اسم البرنامج (إنجليزي)" : "Name (English)"}</Label>
                    <Input
                      value={editing.name_en || ""}
                      onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                      placeholder="Student Sponsorship"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "المعرف الرابطي (slug) *" : "Slug *"}</Label>
                    <Input
                      value={editing.slug || ""}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                      placeholder="kafalat-talib-ilm"
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label>{isAr ? "المحور التابع له (Axis)" : "Axis"}</Label>
                    <select
                      value={editing.axis_id ? String(editing.axis_id) : ""}
                      onChange={(e) => setEditing({ ...editing, axis_id: e.target.value ? Number(e.target.value) : null })}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{isAr ? "بدون محور محدد" : "None"}</option>
                      {axes.map((ax) => (
                        <option key={String(ax.id)} value={String(ax.id)}>
                          {ax.name_ar} ({ax.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Seasons Checkboxes */}
                {seasons.length > 0 && (
                  <div>
                    <Label>{isAr ? "المواسم المرتبطة بالبرنامج:" : "Linked Seasons:"}</Label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {seasons.map((s) => {
                        const checked = Array.isArray(editing.season_ids) && editing.season_ids.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                              checked
                                ? "border-primary bg-primary/10 text-primary font-bold"
                                : "border-border bg-card text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={(e) => {
                                const current = editing.season_ids || [];
                                const next = e.target.checked
                                  ? [...current, s.id]
                                  : current.filter((x) => x !== s.id);
                                setEditing({ ...editing, season_ids: next });
                              }}
                            />
                            <span>{s.name_ar}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "الحالة (Status)" : "Status"}</Label>
                    <select
                      value={editing.status || "published"}
                      onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="published">{isAr ? "منشور (Published)" : "Published"}</option>
                      <option value="draft">{isAr ? "مسودة (Draft)" : "Draft"}</option>
                    </select>
                  </div>
                  <div>
                    <Label>{isAr ? "ترتيب الظهور (Sort Order)" : "Sort Order"}</Label>
                    <Input
                      type="number"
                      value={editing.sort_order ?? 1}
                      onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing.is_active !== false}
                      onCheckedChange={(c) => setEditing({ ...editing, is_active: c })}
                    />
                    <Label>{isAr ? "نشط ويعمل" : "Active"}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(editing.hide_from_audience)}
                      onCheckedChange={(c) => setEditing({ ...editing, hide_from_audience: c })}
                    />
                    <Label>{isAr ? "إخفاء من قائمة الزوار العامة" : "Hide from Audience"}</Label>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Content */}
              <TabsContent value="content" className="space-y-4 py-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "الشعار البارز (عربي)" : "Tagline (Arabic)"}</Label>
                    <Input
                      value={editing.tagline_ar || ""}
                      onChange={(e) => setEditing({ ...editing, tagline_ar: e.target.value })}
                      placeholder="دفء يصل إلى مستحقيه"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isAr ? "الفترة الزمنية (عربي)" : "Period (Arabic)"}</Label>
                    <Input
                      value={editing.period_ar || ""}
                      onChange={(e) => setEditing({ ...editing, period_ar: e.target.value })}
                      placeholder="طوال العام / موسم الشتاء"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>{isAr ? "الوصف المختصر (عربي)" : "Short Description (Arabic)"}</Label>
                  <Textarea
                    value={editing.description_ar || ""}
                    onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })}
                    placeholder="نبذة سريعة عن البرنامج تظهر في البطاقات والمشاركات..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>{isAr ? "المحتوى والقصة الكاملة للبرنامج (عربي)" : "Full Story / Content (Arabic)"}</Label>
                  <Textarea
                    value={editing.content_ar || ""}
                    onChange={(e) => setEditing({ ...editing, content_ar: e.target.value })}
                    placeholder="التفاصيل الكاملة للبرنامج، الفئات المستهدفة، ومراحل التنفيذ..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>{isAr ? "أهم المزايا والفوائد (اكتب كل ميزة في سطر)" : "Benefits (Arabic - one per line)"}</Label>
                  <Textarea
                    value={benefitsArText}
                    onChange={(e) => setBenefitsArText(e.target.value)}
                    placeholder="دعم الطلاب بالمستلزمات المدرسية&#10;توفير الرعاية والمتابعة الدورية&#10;تخفيف العبء عن كاهل الأسر المتعففة"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </TabsContent>

              {/* Tab 3: Finance & Media */}
              <TabsContent value="finance" className="space-y-4 py-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{isAr ? "المبلغ المستهدف (ج.م)" : "Target Amount (EGP)"}</Label>
                    <Input
                      type="number"
                      value={editing.target_amount ?? 50000}
                      onChange={(e) => setEditing({ ...editing, target_amount: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{isAr ? "الحد الأدنى للتبرع (ج.م)" : "Minimum Donation (EGP)"}</Label>
                    <Input
                      type="number"
                      value={editing.minimum_amount ?? 100}
                      onChange={(e) => setEditing({ ...editing, minimum_amount: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>{isAr ? "رابط صورة البرنامج (Image URL)" : "Image URL"}</Label>
                  <Input
                    value={editing.image || ""}
                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                    placeholder="https://... أو /assets/..."
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={editing.donation_available !== false}
                    onCheckedChange={(c) => setEditing({ ...editing, donation_available: c })}
                  />
                  <Label>{isAr ? "التبرع المباشر متاح عبر بوابات الدفع بالموقع" : "Direct Donation Available"}</Label>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSaveProgram} disabled={saving} className="gap-1.5 bg-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isAr ? "حفظ البرنامج" : "Save Program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Program Donation Packages (الأسهم) ── */}
      <Dialog open={!!pkgProgram} onOpenChange={(open) => !open && setPkgProgram(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-lg">
              <Tag className="h-5 w-5 text-secondary" />
              {isAr ? `باقات التبرع والأسهم — ${pkgProgram?.name_ar || pkgProgram?.name}` : "Donation Packages"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "إضافة باقات تبرع محددة (مثل: سهم 100 جنيه، باقة كفالة شهرية 500 جنيه) لتسهيل التبرع السريع."
                : "Add preset contribution packages for this program."}
            </p>

            {pkgProgram?.donation_packages && pkgProgram.donation_packages.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{isAr ? "الباقات الحالية:" : "Current Packages:"}</Label>
                <div className="space-y-1">
                  {pkgProgram.donation_packages.map((pkg, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted/60 p-2.5 rounded-lg text-xs">
                      <span className="font-bold text-foreground">{pkg.name_ar}</span>
                      <span className="font-mono text-primary font-bold">{Number(pkg.amount).toLocaleString()} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border p-3 space-y-3 bg-muted/20">
              <Label className="font-bold">{isAr ? "إضافة باقة جديدة:" : "Add New Package:"}</Label>
              <div>
                <Label className="text-xs">{isAr ? "اسم الباقة (عربي)" : "Package Name"}</Label>
                <Input
                  value={newPkg.name_ar}
                  onChange={(e) => setNewPkg({ ...newPkg, name_ar: e.target.value })}
                  placeholder="باقة 100 جنيه"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "المبلغ (ج.م)" : "Amount (EGP)"}</Label>
                <Input
                  type="number"
                  value={newPkg.amount}
                  onChange={(e) => setNewPkg({ ...newPkg, amount: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPkgProgram(null)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
            <Button onClick={handleAddPackage} disabled={savingPkg} className="gap-1.5 bg-secondary text-secondary-foreground">
              {savingPkg && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAr ? "إضافة الباقة" : "Add Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
