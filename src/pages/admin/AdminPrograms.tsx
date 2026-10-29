import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen, Plus, Pencil, Trash2, Loader2, Search, ExternalLink, Tag, Users,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { apiErrorMessageAr, programsAdminApi } from "@/data/api/programsAdminApi";
import { PackagesEditor } from "@/components/admin/programs/PackagesEditor";
import { publicUrls } from "@/lib/publicUrls";

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

  // Donation Packages Dialog (inline edit / delete / reorder via PackagesEditor)
  const [pkgProgram, setPkgProgram] = useState<LaravelProgram | null>(null);

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
    } catch (e) {
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

  // Delete Program
  const handleDeleteProgram = async (id: number | string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا البرنامج؟" : "Are you sure you want to delete this program?")) return;
    try {
      await programsAdminApi.remove(id);
      setPrograms((prev) => prev.filter((p) => String(p.id) !== String(id)));
      toast({ title: isAr ? "تم حذف البرنامج" : "Program deleted" });
    } catch (e) {
      toast({ title: isAr ? "فشل حذف البرنامج" : "Delete failed", description: apiErrorMessageAr(e), variant: "destructive" });
    }
  };

  // Toggle Active
  const handleToggleActive = async (p: LaravelProgram) => {
    const next = !(p.is_active !== false);
    try {
      await programsAdminApi.update(p.id, { is_active: next });
      setPrograms((prev) =>
        prev.map((item) => (String(item.id) === String(p.id) ? { ...item, is_active: next } : item))
      );
      toast({ title: isAr ? `تم ${next ? "تفعيل" : "تعطيل"} البرنامج` : `Program ${next ? "activated" : "deactivated"}` });
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
            <Button onClick={() => nav("/admin/programs/new")} size="sm" className="mt-4 gap-1.5">
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
                        to={publicUrls.program(prog.slug)}
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

      {/* ── Dialog: Program Donation Packages (الأسهم) ── */}
      <Dialog
        open={!!pkgProgram}
        onOpenChange={(open) => {
          if (!open) {
            setPkgProgram(null);
            void loadData();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Tag className="h-5 w-5 text-secondary" />
              {`باقات التبرع والأسهم — ${pkgProgram?.name_ar || pkgProgram?.name || ""}`}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            الإضافة تعمل الآن. تعديل الاسم/المبلغ/التفعيل والحذف والترتيب تحتاج المسارات المقترحة في الباك إند، وستظهر رسالة واضحة لو لم تكن مفعّلة.
          </p>
          {pkgProgram && <PackagesEditor kind="programs" ownerId={pkgProgram.id} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPkgProgram(null); void loadData(); }}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
