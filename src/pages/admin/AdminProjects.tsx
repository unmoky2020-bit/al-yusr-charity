import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, ExternalLink, Loader2, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { projectsApiV1, programsApiV1, LaravelProject, LaravelProgram } from "@/data/laravelApi";

type Node = {
  id: string;
  parent_id: string | null;
  type: "program" | "project" | "campaign" | "option";
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  amount: number | null;
  target_amount: number | null;
  collected_amount: number;
  active: boolean;
  sort_order: number;
};

const previewHref = (n: Node) => {
  if (n.type === "program") return `/programs/${n.slug}`;
  if (n.type === "campaign") return `/campaigns/${n.slug}`;
  return `/programs/${n.slug}`;
};

const AdminProjects = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [items, setItems] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Node | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", target_amount: 50000, description: "" });
  const [adding, setAdding] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [lProjects, lPrograms] = await Promise.all([
        projectsApiV1.listAll().catch(() => [] as LaravelProject[]),
        programsApiV1.listAll().catch(() => [] as LaravelProgram[]),
      ]);

      const projectNodes: Node[] = (Array.isArray(lProjects) ? lProjects : []).map((p: any, idx: number) => ({
        id: String(p.id),
        parent_id: null,
        type: "project",
        slug: p.slug || `project-${p.id}`,
        title_ar: p.name || `مشروع ${p.id}`,
        title_en: p.name_en || p.name || `Project ${p.id}`,
        description_ar: p.description || null,
        description_en: p.description_en || p.description || null,
        image_url: p.image_url || p.cover_image || null,
        amount: null,
        target_amount: Number(p.target_amount || 0),
        collected_amount: Number(p.collected_amount || 0),
        active: p.is_active !== undefined ? Boolean(p.is_active) : true,
        sort_order: idx + 1,
      }));

      const programNodes: Node[] = (Array.isArray(lPrograms) ? lPrograms : []).map((prog: any, idx: number) => ({
        id: String(prog.id),
        parent_id: prog.axis_id ? String(prog.axis_id) : null,
        type: "program",
        slug: prog.slug || `program-${prog.id}`,
        title_ar: prog.title_ar || prog.name_ar || prog.name || `برنامج ${prog.id}`,
        title_en: prog.title_en || prog.name_en || prog.name || `Program ${prog.id}`,
        description_ar: prog.description_ar || prog.description || null,
        description_en: prog.description_en || null,
        image_url: prog.image_url || prog.image || null,
        amount: prog.amount ? Number(prog.amount) : (prog.minimum_amount ? Number(prog.minimum_amount) : null),
        target_amount: Number(prog.target_amount || 0),
        collected_amount: Number(prog.collected_amount || 0),
        active: prog.is_active !== undefined ? Boolean(prog.is_active) : true,
        sort_order: (prog.sort_order ?? idx) + 100,
      }));

      const allNodes = [...projectNodes, ...programNodes];
      setItems(allNodes);
      if (!selected || !allNodes.find((n) => n.id === selected.id)) {
        setSelected(allNodes[0] || null);
      }
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, []);

  const safeItems = Array.isArray(items) ? items : [];

  const parentMap = useMemo(() => {
    const m = new Map<string, Node>();
    safeItems.forEach(i => m.set(i.id, i));
    return m;
  }, [safeItems]);

  const filtered = useMemo(
    () => safeItems
      .filter(i => i.type === "project" || i.type === "program")
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [safeItems]
  );
  const childrenOf = (pid: string) =>
    safeItems.filter(i => i.parent_id === pid).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const totals = useMemo(() => {
    const raised = safeItems.reduce((s, p) => s + Number(p.collected_amount || 0), 0);
    const target = safeItems.reduce((s, p) => s + Number(p.target_amount || 0), 0);
    return { raised, target, count: safeItems.length, active: safeItems.filter(i => i.active).length };
  }, [safeItems]);

  const toggleActive = async (n: Node) => {
    try {
      if (n.type === "program") {
        await programsApiV1.update(n.id, { is_active: !n.active } as any);
      } else {
        await projectsApiV1.update(n.id, { is_active: !n.active ? 1 : 0 } as any);
      }
      setItems(prev => prev.map(p => p.id === n.id ? { ...p, active: !n.active } : p));
      if (selected?.id === n.id) setSelected({ ...n, active: !n.active });
      toast({ title: !n.active ? (isAr ? "تم التفعيل" : "Activated") : (isAr ? "تم التعطيل" : "Deactivated") });
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast({ title: isAr ? "يرجى كتابة اسم المشروع" : "Project name is required", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      await projectsApiV1.create({
        name: newProject.name.trim(),
        description: newProject.description.trim() || newProject.name.trim(),
        target_amount: Number(newProject.target_amount || 10000),
        is_active: 1,
      } as any);
      toast({ title: isAr ? " تم إنشاء المشروع بنجاح" : " Project created successfully" });
      setShowAddModal(false);
      setNewProject({ name: "", target_amount: 50000, description: "" });
      void reload();
    } catch (err: any) {
      toast({ title: isAr ? "فشل إنشاء المشروع" : "Failed to create project", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(isAr ? `هل أنت متأكد من حذف "${name}"؟` : `Delete "${name}"?`)) return;
    try {
      const item = items.find((i) => i.id === id);
      if (item?.type === "program") {
        await programsApiV1.remove(id);
      } else {
        await projectsApiV1.remove(id);
      }
      toast({ title: isAr ? " تم الحذف بنجاح" : " Deleted successfully" });
      void reload();
    } catch (err: any) {
      toast({ title: isAr ? "فشل الحذف" : "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const addChildOption = async (parent: Node) => {
    toast({ title: isAr ? "يمكنك إضافة وتعديل خيارات التبرع من صفحة التفاصيل" : "Manage options in details page" });
  };

  return (
    <AdminLayout>
      <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard accent label={isAr ? "إجمالي العناصر" : "Total items"} value={totals.count} sub={`${totals.active} ${isAr ? "نشط" : "active"}`} />
          <StatCard label={isAr ? "تم جمعه" : "Raised"} value={`${(totals.raised / 1000).toFixed(1)}K EGP`} sub={totals.target ? `${Math.round((totals.raised / totals.target) * 100)}% ${isAr ? "من الهدف" : "of target"}` : ""} />
          <StatCard label={isAr ? "الهدف الإجمالي" : "Total target"} value={`${(totals.target / 1000).toFixed(1)}K EGP`} />
          <StatCard label={isAr ? "البرامج" : "Programs"} value={items.filter(i => i.type === "program").length} sub={`${items.filter(i => i.type === "option").length} ${isAr ? "خيار" : "options"}`} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-3 shadow-soft">
          <Button onClick={() => setShowAddModal(true)} className="bg-orange-grad text-accent-foreground font-bold">
            <Plus className="h-4 w-4 me-1.5" />
            {isAr ? "مشروع جديد" : "New project"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/programs"><Settings2 className="h-4 w-4 me-1.5" />{isAr ? "محرر البرامج" : "Programs editor"}</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-2xl bg-card p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            {filtered.map((p) => {
              const target = Number(p.target_amount || 0);
              const raised = Number(p.collected_amount || 0);
              const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
              const active = selected?.id === p.id;
              const kids = childrenOf(p.id);
              const isOpen = expanded[p.id] ?? false;
              return (
                <div key={p.id} className={`rounded-2xl bg-card p-4 shadow-soft transition hover:shadow-cta ${active ? "ring-2 ring-secondary" : ""}`}>
                  <button onClick={() => setSelected(p)} className="block w-full text-start">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-extrabold text-primary">{isAr ? (p.title_ar || p.title_en) : (p.title_en || p.title_ar)}</h3>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-extrabold uppercase text-muted-foreground">{p.type}</span>
                          {kids.length > 0 && (
                            <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                              {kids.length} {isAr ? "خيار" : "options"}
                            </span>
                          )}
                          {!p.active && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">{isAr ? "مخفي" : "hidden"}</span>}
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          /{p.slug}
                          {p.parent_id && parentMap.get(p.parent_id) && (
                            <span className="ms-2 rounded bg-muted px-1.5 py-0.5 font-sans font-bold text-foreground/70">
                              {isAr ? "ضمن: " : "in: "}
                              {isAr ? parentMap.get(p.parent_id)!.title_ar : (parentMap.get(p.parent_id)!.title_en || parentMap.get(p.parent_id)!.title_ar)}
                            </span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                    </div>
                    {target > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-accent" dir="ltr">{raised.toLocaleString()} / {target.toLocaleString()} EGP</span>
                          <span className="font-black text-primary">{pct}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </button>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-2">
                    {kids.length > 0 && (
                      <button
                        onClick={() => setExpanded(p2 => ({ ...p2, [p.id]: !isOpen }))}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-extrabold text-foreground hover:bg-muted/70">
                        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3 rtl:rotate-180" />}
                        {isAr ? (isOpen ? "إخفاء الخيارات" : "عرض الخيارات") : (isOpen ? "Hide options" : "Show options")}
                      </button>
                    )}
                    <button onClick={() => addChildOption(p)}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary/15 px-2 py-1 text-[11px] font-extrabold text-primary hover:bg-secondary/30">
                      <Plus className="h-3 w-3" />{isAr ? "إضافة خيار" : "Add option"}
                    </button>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold">
                      <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                      {isAr ? (p.active ? "ظاهر" : "مخفي") : (p.active ? "Visible" : "Hidden")}
                    </label>
                    <a href={previewHref(p)} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-secondary/15 px-2 py-1 text-[11px] font-extrabold text-primary hover:bg-secondary/30">
                      <ExternalLink className="h-3 w-3" />{isAr ? "معاينة" : "Preview"}
                    </a>
                    <Link to={`/admin/projects/${p.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-extrabold text-primary hover:bg-primary/20">
                      <Pencil className="h-3 w-3" />{isAr ? "تفاصيل وتعديل" : "Details & edit"}
                    </Link>
                    <button
                      onClick={() => handleDeleteProject(p.id, isAr ? p.title_ar : p.title_en)}
                      className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-extrabold text-destructive hover:bg-destructive/20 transition"
                      title={isAr ? "حذف المشروع" : "Delete project"}
                    >
                      <Trash2 className="h-3 w-3" />
                      {isAr ? "حذف" : "Delete"}
                    </button>
                  </div>
                  {isOpen && kids.length > 0 && (
                    <ul className="mt-3 space-y-1.5 rounded-xl border border-dashed border-border bg-muted/20 p-2">
                      {kids.map(c => (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-card px-2 py-1.5 text-xs">
                          <div className="min-w-0 flex-1">
                            <span className="truncate font-extrabold text-primary">{isAr ? (c.title_ar || c.title_en) : (c.title_en || c.title_ar)}</span>
                            <span className="ms-2 font-mono text-[10px] text-muted-foreground">/{c.slug}</span>
                            {c.amount ? <span className="ms-2 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">{Number(c.amount).toLocaleString()} EGP</span> : null}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                            <Link to={`/admin/projects/${c.id}`} className="rounded-md bg-primary/10 px-2 py-0.5 font-extrabold text-primary hover:bg-primary/20">
                              {isAr ? "تعديل" : "Edit"}
                            </Link>
                            <a href={`/programs/${c.slug}`} target="_blank" rel="noreferrer" className="rounded-md bg-secondary/15 px-2 py-0.5 font-extrabold text-primary hover:bg-secondary/30">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            {!filtered.length && (
              <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground">{isAr ? "لا توجد عناصر" : "No items"}</div>
            )}
          </div>

          <aside className="rounded-2xl bg-card p-4 shadow-soft lg:sticky lg:top-20 lg:self-start">
            {selected ? (
              <>
                <div className="text-[11px] font-bold uppercase text-muted-foreground">{isAr ? "تفاصيل" : "Details"}</div>
                <h2 className="mt-1 text-lg font-black text-primary">{isAr ? selected.title_ar : (selected.title_en || selected.title_ar)}</h2>
                {selected.image_url && <img src={selected.image_url} alt="" loading="lazy" className="mt-3 h-40 w-full rounded-xl object-cover" />}
                <div className="mt-3 space-y-2 text-sm">
                  <Detail label={isAr ? "النوع" : "Type"} value={selected.type} />
                  <Detail label="Slug" value={selected.slug} />
                  <Detail label={isAr ? "الهدف" : "Target"} value={`${Number(selected.target_amount || 0).toLocaleString()} EGP`} />
                  <Detail label={isAr ? "تم جمعه" : "Raised"} value={`${Number(selected.collected_amount || 0).toLocaleString()} EGP`} />
                  {selected.amount && <Detail label={isAr ? "سعر الخيار" : "Option price"} value={`${Number(selected.amount).toLocaleString()} EGP`} />}
                </div>
                {(selected.description_ar || selected.description_en) && (
                  <p className="mt-3 whitespace-pre-line rounded-xl bg-muted/30 p-2.5 text-xs leading-relaxed">{isAr ? (selected.description_ar || selected.description_en) : (selected.description_en || selected.description_ar)}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" className="bg-orange-grad text-accent-foreground">
                    <Link to={`/admin/projects/${selected.id}`}><Pencil className="h-4 w-4" />{isAr ? "صفحة التفاصيل" : "Open details"}</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={previewHref(selected)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />{isAr ? "معاينة" : "Preview"}</a>
                  </Button>
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground">{isAr ? "اختر عنصرًا" : "Select an item"}</p>}
          </aside>
        </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowAddModal(false)}>
            <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-primary">{isAr ? "إضافة مشروع جديد" : "Add New Project"}</h3>
                <button onClick={() => setShowAddModal(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "اسم المشروع *" : "Project Name *"}</label>
                  <Input value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} placeholder={isAr ? "مثال: محطة مياه نقية بالدقهلية" : "e.g. Clean Water Project"} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "الهدف المالي (ج.م) *" : "Target Amount (EGP) *"}</label>
                  <Input type="number" value={newProject.target_amount} onChange={(e) => setNewProject({ ...newProject, target_amount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "وصف المشروع" : "Project Description"}</label>
                  <Input value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} placeholder={isAr ? "تفاصيل المشروع وأثره" : "Details and impact"} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateProject} disabled={adding} className="flex-1 bg-orange-grad text-accent-foreground font-bold">
                  {adding && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {isAr ? "حفظ وإنشاء" : "Save & Create"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const Detail = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-end font-bold">{value}</span>
  </div>
);

export default AdminProjects;