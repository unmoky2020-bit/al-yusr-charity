import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban, Plus, Pencil, Trash2, Search, Tag, Users, ArrowUpRight,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { ListingHeroImageButton } from "@/components/admin/ListingHeroImageButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { apiErrorMessageAr, projectsAdminApi } from "@/data/api/programsAdminApi";
import { PackagesEditor } from "@/components/admin/programs/PackagesEditor";

export default function AdminProjects() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [projects, setProjects] = useState<LaravelProject[]>([]);
  const [allCases, setAllCases] = useState<LaravelCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Packages Dialog (inline edit / delete / reorder via PackagesEditor)
  const [pkgProject, setPkgProject] = useState<LaravelProject | null>(null);

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
    } catch (e) {
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

  // Delete Project
  const handleDeleteProject = async (id: number | string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا المشروع؟" : "Are you sure you want to delete this project?")) return;
    try {
      await projectsAdminApi.remove(id);
      setProjects((prev) => prev.filter((p) => String(p.id) !== String(id)));
      toast({ title: isAr ? "تم حذف المشروع" : "Project deleted" });
    } catch (e) {
      toast({ title: isAr ? "فشل حذف المشروع" : "Delete failed", description: apiErrorMessageAr(e), variant: "destructive" });
    }
  };

  // Toggle Active
  const handleToggleActive = async (p: LaravelProject) => {
    const next = !(p.is_active !== false);
    try {
      await projectsAdminApi.update(p.id, { is_active: next });
      setProjects((prev) =>
        prev.map((item) => (String(item.id) === String(p.id) ? { ...item, is_active: next } : item))
      );
      toast({ title: isAr ? `تم ${next ? "تفعيل" : "تعطيل"} المشروع` : `Project ${next ? "activated" : "deactivated"}` });
    } catch (e) {
      toast({ title: isAr ? "فشل تغيير الحالة" : "Update failed", description: apiErrorMessageAr(e), variant: "destructive" });
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
            <ListingHeroImageButton pageKey="projects" />
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
              const rawImg = proj.cover_image || proj.image || proj.cover_image_url || proj.image_url;
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
                      {(proj as { short_description?: string | null }).short_description || proj.description || (isAr ? "لا يوجد وصف مدخل لهذا المشروع." : "No description provided.")}
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

      {/* ── Dialog: Project Donation Packages (الأسهم) ── */}
      <Dialog
        open={!!pkgProject}
        onOpenChange={(open) => {
          if (!open) {
            setPkgProject(null);
            void loadData();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Tag className="h-5 w-5 text-secondary" />
              {`باقات المساهمة — ${pkgProject?.name_ar || pkgProject?.name || ""}`}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            الإضافة تعمل الآن. تعديل الاسم/المبلغ/التفعيل والحذف والترتيب تحتاج المسارات المقترحة في الباك إند، وستظهر رسالة واضحة لو لم تكن مفعّلة.
          </p>
          {pkgProject && <PackagesEditor kind="projects" ownerId={pkgProject.id} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPkgProject(null); void loadData(); }}>إغلاق</Button>
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