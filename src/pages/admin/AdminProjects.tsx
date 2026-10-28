import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban, Plus, Pencil, Trash2, Loader2, Save, X, Search,
  Tag, ExternalLink, Users, ArrowUpRight,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  projectsApi,
  casesApiV1,
  formatServerImageUrl,
  type LaravelProject,
  type LaravelCase,
} from "@/data/laravelApi";

export default function AdminProjects() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [projects, setProjects] = useState<LaravelProject[]>([]);
  const [allCases, setAllCases] = useState<LaravelCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Edit / Add Project Dialog
  const [editing, setEditing] = useState<Partial<LaravelProject> | null>(null);
  const [saving, setSaving] = useState(false);

  // Packages Dialog
  const [pkgProject, setPkgProject] = useState<LaravelProject | null>(null);
  const [newPkg, setNewPkg] = useState({ name_ar: "سهم مساهمة", amount: 200, is_active: true });
  const [savingPkg, setSavingPkg] = useState(false);

  // Linked Cases Drawer/Dialog
  const [viewCasesProject, setViewCasesProject] = useState<LaravelProject | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, casesRes] = await Promise.all([
        projectsApi.listAll().catch(() => [] as LaravelProject[]),
        casesApiV1.listAll().catch(() => [] as LaravelCase[]),
      ]);

      setAllCases(Array.isArray(casesRes) ? casesRes : []);
      setProjects(Array.isArray(projRes) ? projRes : []);
    } catch (e: any) {
      console.warn("Failed to load projects:", e);
      toast({ title: isAr ? "خطأ في تحميل المشاريع" : "Failed to load projects", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filtered Projects
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const name = p.name_ar || p.name || "";
      const nameEn = p.name_en || "";
      const matchQuery =
        !search ||
        name.includes(search) ||
        nameEn.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_active !== false) ||
        (statusFilter === "inactive" && p.is_active === false);

      return matchQuery && matchStatus;
    });
  }, [projects, search, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.is_active !== false).length;
    const totalTarget = projects.reduce((acc, p) => acc + Number(p.target_amount || 0), 0);
    const totalCollected = projects.reduce((acc, p) => acc + Number(p.collected_amount || 0), 0);
    const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;
    return { total, active, totalTarget, totalCollected, overallPct };
  }, [projects]);

  // Open New Project
  const openNew = () => {
    setEditing({
      name: "",
      name_ar: "",
      name_en: "",
      description: "",
      target_amount: 50000,
      collected_amount: 0,
      is_active: true,
    });
  };

  // Open Edit Project
  const openEdit = (p: LaravelProject) => {
    setEditing({ ...p, name_ar: p.name_ar || p.name });
  };

  // Save Project
  const handleSaveProject = async () => {
    if (!editing || (!editing.name?.trim() && !editing.name_ar?.trim())) {
      toast({ title: isAr ? "يرجى كتابة اسم المشروع" : "Please enter project name", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const finalName = editing.name_ar?.trim() || editing.name?.trim() || "";
      const payload: Partial<LaravelProject> = {
        name: finalName,
        name_ar: finalName,
        name_en: editing.name_en?.trim() || finalName,
        description: editing.description?.trim() || "",
        target_amount: Number(editing.target_amount || 0),
        is_active: editing.is_active !== false,
      };

      if (editing.id && !String(editing.id).startsWith("static-")) {
        await projectsApi.update(editing.id, payload as any);
        toast({ title: isAr ? "تم تحديث المشروع بنجاح" : "Project updated successfully" });
      } else {
        await projectsApi.create(payload as any);
        toast({ title: isAr ? "تم إنشاء المشروع بنجاح في قاعدة البيانات" : "Project created successfully" });
      }

      setEditing(null);
      await loadData();
    } catch (e: any) {
      toast({ title: e.message || "Failed to save project", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (id: number | string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا المشروع؟" : "Are you sure you want to delete this project?")) return;
    try {
      if (!String(id).startsWith("static-")) {
        await projectsApi.remove(id);
      }
      setProjects((prev) => prev.filter((p) => String(p.id) !== String(id)));
      toast({ title: isAr ? "تم حذف المشروع" : "Project deleted" });
    } catch (e: any) {
      toast({ title: e.message || "Failed to delete", variant: "destructive" });
    }
  };

  // Toggle Active
  const handleToggleActive = async (p: LaravelProject) => {
    const next = !p.is_active;
    try {
      if (!String(p.id).startsWith("static-")) {
        await projectsApi.update(p.id, { is_active: next } as any);
      }
      setProjects((prev) =>
        prev.map((item) => (String(item.id) === String(p.id) ? { ...item, is_active: next } : item))
      );
      toast({ title: isAr ? `تم ${next ? "تفعيل" : "تعطيل"} المشروع` : `Project ${next ? "activated" : "deactivated"}` });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  // Add Donation Package
  const handleAddPackage = async () => {
    if (!pkgProject || !newPkg.name_ar.trim() || Number(newPkg.amount) <= 0) {
      toast({ title: isAr ? "اكتب اسم الباقة والمبلغ" : "Fill package name and amount", variant: "destructive" });
      return;
    }
    setSavingPkg(true);
    try {
      if (!String(pkgProject.id).startsWith("static-")) {
        await projectsApi.createPackage(pkgProject.id, {
          name_ar: newPkg.name_ar.trim(),
          amount: Number(newPkg.amount),
        });
        toast({ title: isAr ? "تمت إضافة باقة التبرع للمشروع" : "Donation package added" });
      } else {
        toast({ title: isAr ? "احفظ المشروع أولاً في قاعدة البيانات لإضافة باقات إليه" : "Save project to backend DB first" });
      }
      setPkgProject(null);
      await loadData();
    } catch (e: any) {
      toast({ title: e.message || "Failed to add package", variant: "destructive" });
    } finally {
      setSavingPkg(false);
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
                <FolderKanban className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-foreground">
                {isAr ? "إدارة المشاريع الخيرية" : "Projects Management"}
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr
                ? "متابعة وإدارة المشروعات الكبرى (جهاز عروسة، تسقيف البيوت، سقيا الماء)، مبالغ التبرع، وباقات الأسهم والحالات المرتبطة بها."
                : "Manage major charity projects (brides, roofing, water), targets, donation packages, and linked beneficiary cases."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            >
              <Link to="/admin/projects/new">
                <Plus className="h-4 w-4" />
                {isAr ? "مشروع جديد" : "New Project"}
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            accent
            label={isAr ? "إجمالي المشاريع" : "Total Projects"}
            value={stats.total}
          />
          <StatCard
            label={isAr ? "مشاريع نشطة" : "Active Projects"}
            value={stats.active}
          />
          <StatCard
            label={isAr ? "إجمالي المستهدف" : "Total Target"}
            value={`${stats.totalTarget.toLocaleString("en-US")} ج.م`}
          />
          <StatCard
            label={isAr ? "إجمالي المحصل" : "Total Collected"}
            value={`${stats.totalCollected.toLocaleString("en-US")} ج.م (${stats.overallPct}%)`}
          />
        </div>

        {/* Filters Bar */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث باسم المشروع أو تفاصيله..." : "Search projects..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                { v: "all", ar: "الكل", en: "All" },
                { v: "active", ar: "نشط", en: "Active" },
                { v: "inactive", ar: "معطل", en: "Inactive" },
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

        {/* Projects Cards Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-0 shadow-soft animate-pulse"
              >
                <div className="aspect-video sm:h-44 w-full bg-muted/70" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-3/4 rounded-md bg-muted" />
                    <div className="h-5 w-14 rounded-md bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-full rounded bg-muted/60" />
                    <div className="h-3 w-4/5 rounded bg-muted/60" />
                  </div>
                  <div className="space-y-2 pt-3 border-t border-border/40">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 rounded bg-muted/60" />
                      <div className="h-3 w-24 rounded bg-muted/60" />
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted" />
                    <div className="flex justify-between">
                      <div className="h-3 w-12 rounded bg-muted/60" />
                      <div className="h-3 w-28 rounded bg-muted/60" />
                    </div>
                  </div>
                </div>
                <div className="h-11 border-t border-border/60 bg-muted/20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center bg-card/50">
            <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-lg font-bold text-foreground">
              {isAr ? "لا توجد مشاريع مطابقة" : "No projects found"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? "جرب تعديل خيارات البحث أو قم بإضافة مشروع جديد" : "Try searching or add a new project"}
            </p>
            <Button asChild size="sm" className="mt-4 gap-1.5">
              <Link to="/admin/projects/new">
                <Plus className="h-4 w-4" /> {isAr ? "إضافة مشروع جديد" : "Add Project"}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((proj) => {
              const target = Number(proj.target_amount || 0);
              const collected = Number(proj.collected_amount || 0);
              const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
              const linkedCases = allCases.filter(
                (c) => String(c.project_id) === String(proj.id) || (c.project && String(c.project.id) === String(proj.id))
              );
              const rawImg = (proj as any).cover_image || proj.image || (proj as any).cover_image_url || (proj as any).image_url;
              const imageSrc = rawImg ? formatServerImageUrl(rawImg) : null;

              return (
                <div
                  key={String(proj.id)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition hover:border-primary/50 hover:shadow-card"
                >
                  {/* Project Cover Image */}
                  <div className="relative aspect-video sm:h-44 w-full overflow-hidden bg-muted">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={proj.name_ar || proj.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/10 via-primary/5 to-muted text-muted-foreground/30">
                        <FolderKanban className="h-12 w-12" />
                      </div>
                    )}

                    <div className="absolute top-3 start-3">
                      <span className="text-[11px] font-mono font-bold text-white bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                        #{proj.id}
                      </span>
                    </div>

                    <div className="absolute top-3 end-3">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-xs ${
                          proj.is_active !== false
                            ? "bg-emerald-600/95 text-white"
                            : "bg-black/60 text-white/90"
                        }`}
                      >
                        {proj.is_active !== false ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-foreground text-lg leading-snug">
                          {proj.name_ar || proj.name}
                        </h3>
                        {proj.name_en && proj.name_en !== proj.name && (
                          <p className="text-xs text-muted-foreground">{proj.name_en}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {proj.description || (isAr ? "لا يوجد وصف مدخل لهذا المشروع." : "No description provided.")}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-3 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "نسبة التنفيذ والتغطية" : "Funded"}</span>
                        <span className="font-bold text-foreground">
                          {collected.toLocaleString("en-US")} / {target.toLocaleString("en-US")} ج.م
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{pct}% {isAr ? "مكتمل" : "Funded"}</span>
                        <button
                          onClick={() => setViewCasesProject(proj)}
                          className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Users className="h-3 w-3" />
                          <span>{linkedCases.length} {isAr ? "حالات مرتبطة بالمشروع" : "Linked cases"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between border-t border-border/70 bg-muted/30 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={proj.is_active !== false}
                        onCheckedChange={() => handleToggleActive(proj)}
                      />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {proj.is_active !== false ? (isAr ? "مفعل" : "On") : (isAr ? "معطل" : "Off")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPkgProject(proj)}
                        className="h-8 px-2 text-xs gap-1 text-secondary hover:text-secondary-foreground hover:bg-secondary/20"
                        title={isAr ? "إضافة باقة مساهمة" : "Tiers"}
                      >
                        <Tag className="h-3.5 w-3.5" />
                        <span>{isAr ? "باقات" : "Tiers"}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title={isAr ? "تعديل" : "Edit"}
                      >
                        <Link to={`/admin/projects/${proj.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProject(proj.id)}
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

      {/* ── Dialog: Create / Edit Project ── */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FolderKanban className="h-5 w-5 text-primary" />
              {editing?.id && !String(editing.id).startsWith("static-")
                ? (isAr ? "تعديل بيانات المشروع" : "Edit Project")
                : (isAr ? "إضافة مشروع خيري جديد" : "New Project")}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-2 text-sm">
              <div>
                <Label>{isAr ? "اسم المشروع (عربي) *" : "Project Name (Arabic) *"}</Label>
                <Input
                  value={editing.name_ar || editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value, name_ar: e.target.value })}
                  placeholder="مثال: جهاز عروسه"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>{isAr ? "اسم المشروع (إنجليزي)" : "Project Name (English)"}</Label>
                <Input
                  value={editing.name_en || ""}
                  onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                  placeholder="Bride Trousseau Project"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>{isAr ? "وصف المشروع وأهدافه" : "Description"}</Label>
                <Textarea
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="اكتب نبذة عن الفئات المستفيدة ومجال المشروع..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isAr ? "المبلغ المستهدف (ج.م) *" : "Target Amount (EGP) *"}</Label>
                  <Input
                    type="number"
                    value={editing.target_amount ?? 50000}
                    onChange={(e) => setEditing({ ...editing, target_amount: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{isAr ? "المبلغ المحصل (ج.م)" : "Collected Amount"}</Label>
                  <Input
                    type="number"
                    value={editing.collected_amount ?? 0}
                    onChange={(e) => setEditing({ ...editing, collected_amount: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Switch
                  checked={editing.is_active !== false}
                  onCheckedChange={(c) => setEditing({ ...editing, is_active: c })}
                />
                <Label>{isAr ? "مشروع نشط ومتاح للتبرع" : "Active"}</Label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSaveProject} disabled={saving} className="gap-1.5 bg-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isAr ? "حفظ المشروع" : "Save Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Project Donation Packages (الأسهم) ── */}
      <Dialog open={!!pkgProject} onOpenChange={(open) => !open && setPkgProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-lg">
              <Tag className="h-5 w-5 text-secondary" />
              {isAr ? `باقات المساهمة — ${pkgProject?.name_ar || pkgProject?.name}` : "Donation Packages"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "إضافة أسهم تبرع محددة لهذا المشروع (مثل: سهم جهاز ثلاجة 5000 ج، سهم مساهمة عام 200 ج)."
                : "Add preset contribution packages for this project."}
            </p>

            <div className="rounded-xl border border-border p-3 space-y-3 bg-muted/20">
              <Label className="font-bold">{isAr ? "إضافة باقة جديدة:" : "Add New Package:"}</Label>
              <div>
                <Label className="text-xs">{isAr ? "اسم الباقة (عربي)" : "Package Name"}</Label>
                <Input
                  value={newPkg.name_ar}
                  onChange={(e) => setNewPkg({ ...newPkg, name_ar: e.target.value })}
                  placeholder="سهم 200 جنيه"
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
            <Button variant="outline" onClick={() => setPkgProject(null)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
            <Button onClick={handleAddPackage} disabled={savingPkg} className="gap-1.5 bg-secondary text-secondary-foreground">
              {savingPkg && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAr ? "إضافة الباقة" : "Add Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Linked Cases ── */}
      <Dialog open={!!viewCasesProject} onOpenChange={(open) => !open && setViewCasesProject(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-lg">
              <Users className="h-5 w-5 text-primary" />
              {isAr
                ? `الحالات المرتبطة بمشروع: ${viewCasesProject?.name_ar || viewCasesProject?.name}`
                : "Linked Beneficiary Cases"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {(() => {
              const linked = allCases.filter(
                (c) =>
                  String(c.project_id) === String(viewCasesProject?.id) ||
                  (c.project && String(c.project.id) === String(viewCasesProject?.id))
              );

              if (linked.length === 0) {
                return (
                  <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                    <Users className="mx-auto h-8 w-8 opacity-40" />
                    <p className="mt-2 text-sm">{isAr ? "لا توجد حالات مسجلة حالياً تحت هذا المشروع." : "No linked cases found."}</p>
                    <Link to="/admin/cases" className="mt-3 inline-block">
                      <Button size="sm" variant="outline" className="text-xs gap-1">
                        <Plus className="h-3 w-3" /> {isAr ? "إضافة حالة وربطها بالمشروع" : "Add linked case"}
                      </Button>
                    </Link>
                  </div>
                );
              }

              return (
                <div className="divide-y divide-border border rounded-xl overflow-hidden">
                  {linked.map((c) => (
                    <div key={String(c.id)} className="p-3 flex items-center justify-between hover:bg-muted/40 transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded font-bold">
                            {c.code || `#${c.id}`}
                          </span>
                          <span className="font-bold text-foreground text-sm">{c.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? "المستفيد:" : "Beneficiary:"} {c.beneficiary_name} • {c.governorate || "الدقهلية"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono text-xs text-primary">
                          {Number(c.target_amount || 0).toLocaleString()} ج.م
                        </span>
                        <Link to={`/admin/cases/${c.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCasesProject(null)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}