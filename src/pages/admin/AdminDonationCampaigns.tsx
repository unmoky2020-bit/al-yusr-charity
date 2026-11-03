import { UiSelect } from "@/components/common/UiSelect";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Megaphone, Plus, Pencil, Trash2, Loader2, Save, X, Search,
  ExternalLink, Tag, Settings2,
} from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  donationCampaignsApi,
  donationCampaignCategoriesApi,
  type LaravelDonationCampaign,
  type LaravelDonationCampaignCategory,
  formatServerImageUrl,
} from "@/data/laravelApi";
import {
  donationCampaignsAdminApi,
  findIgnoredCampaignFields,
  CAMPAIGN_FIELD_LABELS_AR,
  type CampaignPackage,
} from "@/data/api/donationCampaignsAdminApi";
import { BACKEND_PENDING_AR, describeWriteError } from "@/data/api/backendPending";
import { CampaignPackagesManager } from "@/components/admin/campaigns/CampaignPackagesManager";
import { sortPackages, type PackagePriceKey } from "@/components/admin/campaigns/packageHelpers";
import { getCampaignPageMetaForCampaign } from "@/data/campaignPages";
import { publicUrls } from "@/lib/publicUrls";

export default function AdminDonationCampaigns() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [campaigns, setCampaigns] = useState<LaravelDonationCampaign[]>([]);
  const [categories, setCategories] = useState<LaravelDonationCampaignCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Edit / Create Campaign Dialog
  const [editing, setEditing] = useState<Partial<LaravelDonationCampaign> | null>(null);
  const [benefitsInput, setBenefitsInput] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Category Dialog (add + manage)
  const [showAddCat, setShowAddCat] = useState(false);
  const [showManageCats, setShowManageCats] = useState(false);
  const [newCat, setNewCat] = useState({ name_ar: "", name_en: "", slug: "", sort_order: 1 });
  const [savingCat, setSavingCat] = useState(false);
  const [editingCat, setEditingCat] = useState<LaravelDonationCampaignCategory | null>(null);
  const [savingEditCat, setSavingEditCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<number | string | null>(null);

  // Donation Packages Dialog
  const [packagesCamp, setPackagesCamp] = useState<LaravelDonationCampaign | null>(null);
  const [packagesList, setPackagesList] = useState<CampaignPackage[]>([]);
  const [packagesPriceKeys, setPackagesPriceKeys] = useState<PackagePriceKey[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campsRes, catsRes] = await Promise.all([
        donationCampaignsApi.listAll().catch(() => [] as LaravelDonationCampaign[]),
        donationCampaignCategoriesApi.listAll().catch(() => [] as LaravelDonationCampaignCategory[]),
      ]);

      // Only real categories from the backend (no invented ids that the backend would reject).
      setCategories(Array.isArray(catsRes) ? catsRes : []);

      if (Array.isArray(campsRes)) {
        // Normalize: some API responses return category as nested object without category_id
        const normalized = campsRes.map((c) => ({
          ...c,
          category_id: c.category_id ?? (c.category?.id != null ? Number(c.category.id) : null),
        }));
        setCampaigns(normalized);
      } else {
        setCampaigns([]);
      }
    } catch (e: any) {
      console.warn("Error loading donation campaigns:", e);
      toast({ title: isAr ? "خطأ في تحميل الحملات من الخادم" : "Error loading campaigns from server", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filtered List
  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const nameMatch = !search ||
        (c.name_ar && c.name_ar.includes(search)) ||
        (c.name_en && c.name_en.toLowerCase().includes(search.toLowerCase())) ||
        (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()));

      // Resolve category id from either direct field or nested object
      const campCatId = c.category_id ?? c.category?.id ?? null;
      const catMatch = selectedCat === "all" || String(campCatId) === String(selectedCat);
      const stMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && c.is_active !== false) ||
        (statusFilter === "inactive" && c.is_active === false);

      return nameMatch && catMatch && stMatch;
    });
  }, [campaigns, search, selectedCat, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.is_active !== false).length;
    const totalTarget = campaigns.reduce((acc, c) => acc + Number(c.target_amount || 0), 0);
    const totalCollected = campaigns.reduce((acc, c) => acc + Number(c.collected_amount || 0), 0);
    return { total, active, totalTarget, totalCollected };
  }, [campaigns]);

  // Open Edit / Create Dialog
  const openNew = () => {
    setEditing({
      name_ar: "",
      name_en: "",
      slug: "",
      category_id: categories[0]?.id ? Number(categories[0].id) : null,
      subtitle_ar: "",
      subtitle_en: "",
      description_ar: "",
      description_en: "",
      target_amount: 100000,
      minimum_amount: 100,
      collected_amount: 0,
      donation_available: true,
      is_active: true,
      sort_order: (campaigns.length || 0) + 1,
      image: "",
      benefits: [],
    });
    setBenefitsInput("");
  };

  const openEdit = (c: LaravelDonationCampaign) => {
    setEditing({ ...c });
    setBenefitsInput(Array.isArray(c.benefits) ? c.benefits.join("\n") : "");
  };

  // Save Campaign (Create or Update)
  const handleSaveCampaign = async () => {
    if (!editing || !editing.name_ar?.trim()) {
      toast({ title: isAr ? "يرجى كتابة اسم الحملة بالعربية" : "Please enter Arabic campaign name", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const parsedBenefits = benefitsInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: Partial<LaravelDonationCampaign> = {
        ...(editing.category_id ? { category_id: Number(editing.category_id) } : {}),
        name_ar: editing.name_ar.trim(),
        name_en: editing.name_en?.trim() || editing.name_ar.trim(),
        slug: editing.slug?.trim() || editing.name_ar.trim().toLowerCase().replace(/\s+/g, "-"),
        subtitle_ar: editing.subtitle_ar?.trim() || null,
        subtitle_en: editing.subtitle_en?.trim() || null,
        description_ar: editing.description_ar?.trim() || editing.name_ar.trim(),
        description_en: editing.description_en?.trim() || null,
        target_amount: Number(editing.target_amount || 0),
        collected_amount: Number(editing.collected_amount || 0),
        minimum_amount: Number(editing.minimum_amount || 50),
        donation_available: editing.donation_available !== false,
        is_active: editing.is_active !== false,
        sort_order: Number(editing.sort_order || 1),
        image: editing.image?.trim() || null,
        benefits: parsedBenefits,
      };

      let savedId: number | string | undefined = editing.id;
      if (editing.id && !String(editing.id).startsWith("static-")) {
        await donationCampaignsApi.update(editing.id, payload);
      } else {
        const created = await donationCampaignsApi.create(payload);
        savedId = created?.id;
      }
      // 2xx is not enough: re-read and tell the admin which fields the backend dropped (subtitle / category / image).
      let ignored: string[] = [];
      if (savedId !== undefined && savedId !== null && savedId !== "") {
        try {
          const fresh = await donationCampaignsAdminApi.get(savedId, { fresh: true });
          ignored = findIgnoredCampaignFields(payload as Record<string, unknown>, fresh as unknown as Record<string, unknown>);
        } catch { /* best effort */ }
      }
      const okTitle = editing.id ? (isAr ? "تم تحديث الحملة" : "Campaign updated") : (isAr ? "تم إنشاء الحملة في قاعدة البيانات" : "Campaign created");
      toast(
        ignored.length
          ? {
              title: `${okTitle}${isAr ? "، لكن الباك إند تجاهل بعض الحقول" : ", but the backend ignored some fields"}`,
              description: `${ignored.map((k) => CAMPAIGN_FIELD_LABELS_AR[k] || k).join("، ")} — ${BACKEND_PENDING_AR}`,
              variant: "destructive",
            }
          : { title: okTitle },
      );

      setEditing(null);
      await loadData();
    } catch (e: any) {
      toast({ title: isAr ? "فشل حفظ الحملة" : "Failed to save campaign", description: describeWriteError(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (id: number | string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذه الحملة؟" : "Are you sure you want to delete this campaign?")) return;
    try {
      if (!String(id).startsWith("static-")) {
        await donationCampaignsApi.remove(id);
      }
      setCampaigns((prev) => prev.filter((c) => String(c.id) !== String(id)));
      toast({ title: isAr ? "تم حذف الحملة" : "Campaign deleted" });
    } catch (e: any) {
      toast({ title: e.message || (isAr ? "فشل الحذف" : "Failed to delete"), variant: "destructive" });
    }
  };

  // Toggle Active
  const handleToggleActive = async (c: LaravelDonationCampaign) => {
    const nextState = !c.is_active;
    try {
      if (!String(c.id).startsWith("static-")) {
        await donationCampaignsApi.update(c.id, { is_active: nextState } as any);
      }
      setCampaigns((prev) =>
        prev.map((item) => (String(item.id) === String(c.id) ? { ...item, is_active: nextState } : item))
      );
      toast({ title: isAr ? `تم ${nextState ? "تفعيل" : "تعطيل"} الحملة` : `Campaign ${nextState ? "activated" : "deactivated"}` });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  // Save New Category
  const handleAddCategory = async () => {
    if (!newCat.name_ar.trim()) {
      toast({ title: isAr ? "اكتب اسم التصنيف بالعربية" : "Enter category name", variant: "destructive" });
      return;
    }
    setSavingCat(true);
    try {
      const baseSlug = newCat.name_en.trim()
        ? newCat.name_en.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : `camp-cat`;
      const slug = newCat.slug.trim() || `${baseSlug}-${Date.now().toString(36)}`;
      await donationCampaignCategoriesApi.create({
        name_ar: newCat.name_ar.trim(),
        name_en: newCat.name_en.trim() || newCat.name_ar.trim(),
        slug,
        is_active: true,
        sort_order: Number(newCat.sort_order || 1),
      } as any);

      toast({ title: isAr ? "تمت إضافة التصنيف بنجاح" : "Category created successfully" });
      setShowAddCat(false);
      setNewCat({ name_ar: "", name_en: "", slug: "", sort_order: categories.length + 1 });
      await loadData();
    } catch (e: any) {
      const msg = e?.message || "";
      const isSlugError = msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("slug") || msg.toLowerCase().includes("duplicate");
      toast({
        title: isSlugError
          ? (isAr ? "هذا الـ Slug مستخدم بالفعل، اكتب slug مختلفاً" : "Slug already exists, enter a unique slug")
          : (e?.message || (isAr ? "خطأ في الإضافة" : "Error adding category")),
        variant: "destructive",
      });
    } finally {
      setSavingCat(false);
    }
  };

  // Edit Category
  const handleUpdateCategory = async () => {
    if (!editingCat || !editingCat.name_ar?.trim()) return;
    setSavingEditCat(true);
    try {
      const slug = editingCat.slug?.trim() || `camp-cat-${Date.now().toString(36)}`;
      // PUT /donation-campaign-categories/{id} is PROPOSED (404 => "needs backend").
      await donationCampaignsAdminApi.updateCategory(editingCat.id, {
        name_ar: editingCat.name_ar.trim(),
        name_en: editingCat.name_en?.trim() || editingCat.name_ar.trim(),
        slug,
        is_active: editingCat.is_active !== false,
        sort_order: Number(editingCat.sort_order || 1),
      });
      toast({ title: isAr ? "تم تحديث التصنيف بنجاح" : "Category updated" });
      setEditingCat(null);
      await loadData();
    } catch (e: any) {
      const msg = e?.message || "";
      const isSlugError = msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("slug") || msg.toLowerCase().includes("duplicate");
      toast({
        title: isSlugError
          ? (isAr ? "هذا الـ Slug مستخدم بالفعل، غيّره وحفظ مرة ثانية" : "Slug already in use, try a different slug")
          : describeWriteError(e, "PUT /donation-campaign-categories/{id}"),
        variant: "destructive",
      });
    } finally {
      setSavingEditCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: LaravelDonationCampaignCategory) => {
    // Count campaigns linked to this category
    const linkedCount = campaigns.filter(
      (c) => String(c.category_id ?? c.category?.id) === String(cat.id)
    ).length;
    const confirmMsg = linkedCount > 0
      ? (isAr
          ? `تصنيف "${cat.name_ar}" مرتبط بـ ${linkedCount} حملة. هل تريد حذفه؟`
          : `Category "${cat.name_en || cat.name_ar}" has ${linkedCount} campaign(s). Delete anyway?`)
      : (isAr ? `هل أنت متأكد من حذف تصنيف "${cat.name_ar}"؟` : `Delete category "${cat.name_en || cat.name_ar}"?`);
    if (!confirm(confirmMsg)) return;
    setDeletingCatId(cat.id);
    try {
      await donationCampaignCategoriesApi.remove(cat.id);
      toast({ title: isAr ? "تم حذف التصنيف" : "Category deleted" });
      await loadData();
    } catch (e: any) {
      const msg = e?.message || "";
      const isFKError = msg.toLowerCase().includes("foreign key") || msg.toLowerCase().includes("constraint") || msg.includes("1451") || msg.includes("violate");
      toast({
        title: isFKError
          ? (isAr
              ? "لا يمكن حذف هذا التصنيف لأن هناك حملات مرتبطة به. يرجى تغيير تصنيفها أولاً."
              : "Cannot delete: some campaigns are still linked to this category. Please re-categorize them first.")
          : (e?.message || (isAr ? "خطأ في الحذف" : "Error deleting category")),
        variant: "destructive",
      });
    } finally {
      setDeletingCatId(null);
    }
  };

  // Sync / Seed from static CAMPAIGNS_DATA into Backend DB — REMOVED

  // Donation packages dialog: full management (add / edit / delete / reorder), live against the backend.
  const openPackages = (camp: LaravelDonationCampaign) => {
    setPackagesCamp(camp);
    setPackagesList(sortPackages(camp.donation_packages as CampaignPackage[] | undefined));
    setPackagesPriceKeys([]);
    const meta = getCampaignPageMetaForCampaign(camp);
    if (meta) {
      void meta.load().then((d) => setPackagesPriceKeys(d.prices.map((p) => ({ id: p.id, label: p.label })))).catch(() => {});
    }
  };

  const closePackages = () => {
    setPackagesCamp(null);
    void loadData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Megaphone className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-foreground">
                {isAr ? "إدارة الحملات والمبادرات" : "Campaigns Management"}
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr
                ? "إدارة حملات ومبادرات التبرع الخاصة بجمعية اليسر، ضبط المبالغ، باقات الأسهم، وتصنيفات الخير."
                : "Manage Al-Yusr charity campaigns, target amounts, donation packages, and categories."}
            </p>
          </div>

          <div className="flex items-center gap-2">
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
              asChild
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            >
              <Link to="/admin/donation-campaigns/new">
                <Plus className="h-4 w-4" />
                {isAr ? "حملة جديدة" : "New Campaign"}
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            accent
            label={isAr ? "إجمالي الحملات" : "Total Campaigns"}
            value={stats.total}
          />
          <StatCard
            label={isAr ? "حملات نشطة" : "Active Campaigns"}
            value={stats.active}
          />
          <StatCard
            label={isAr ? "إجمالي المستهدف" : "Total Target"}
            value={`${stats.totalTarget.toLocaleString("en-US")} ج.م`}
          />
          <StatCard
            label={isAr ? "إجمالي المحصل" : "Total Collected"}
            value={`${stats.totalCollected.toLocaleString("en-US")} ج.م`}
          />
        </div>

        {/* Filters Bar */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالاسم، الشعار أو المعرف (slug)..." : "Search campaigns..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              {(
                [
                  { v: "all", ar: "الكل", en: "All" },
                  { v: "active", ar: "نشطة", en: "Active" },
                  { v: "inactive", ar: "معطلة", en: "Inactive" },
                ] as const
              ).map((f) => (
                <button
                  key={f.v}
                  onClick={() => setStatusFilter(f.v)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${statusFilter === f.v
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted"
                    }`}
                >
                  {isAr ? f.ar : f.en}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <button
              onClick={() => setSelectedCat("all")}
              className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition ${selectedCat === "all"
                ? "bg-secondary text-secondary-foreground font-black"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
            >
              {isAr ? "جميع التصنيفات" : "All Categories"}
            </button>
            {categories.map((cat) => (
              <button
                key={String(cat.id)}
                onClick={() => setSelectedCat(String(cat.id))}
                className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition ${selectedCat === String(cat.id)
                  ? "bg-secondary text-secondary-foreground font-black"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
              >
                {cat.name_ar}
              </button>
            ))}
          </div>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">{isAr ? "جاري تحميل الحملات..." : "Loading campaigns..."}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center bg-card/50">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-lg font-bold text-foreground">
              {isAr ? "لا توجد حملات مطابقة" : "No campaigns found"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAr ? "جرب تغيير خيارات البحث أو قم بإضافة حملة جديدة" : "Try adjusting filters or add a new campaign"}
            </p>
            <Button asChild size="sm" className="mt-4 gap-1.5">
              <Link to="/admin/donation-campaigns/new">
                <Plus className="h-4 w-4" /> {isAr ? "إضافة حملة جديدة" : "Add Campaign"}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((camp) => {
              const target = Number(camp.target_amount || 0);
              const collected = Number(camp.collected_amount || 0);
              const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
              const campCatId = camp.category_id ?? camp.category?.id ?? null;
              const catObj = camp.category ?? categories.find((k) => String(k.id) === String(campCatId));

              return (
                <div
                  key={String(camp.id)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition hover:border-primary/50 hover:shadow-card"
                >
                  {/* Top image or banner */}
                  <div className="relative h-40 w-full overflow-hidden bg-muted">
                    {camp.image ? (
                      <img
                        src={formatServerImageUrl(camp.image)}
                        alt={camp.name_ar}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/10 via-primary/5 to-secondary/15">
                        <Megaphone className="h-10 w-10 text-primary/40" />
                      </div>
                    )}

                    <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                      {catObj && (
                        <span className="rounded-lg bg-background/90 px-2 py-0.5 text-[11px] font-bold text-foreground shadow-sm backdrop-blur">
                          {catObj.name_ar}
                        </span>
                      )}
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold shadow-sm ${camp.is_active !== false
                          ? "bg-emerald-500 text-white"
                          : "bg-muted-foreground text-white"
                          }`}
                      >
                        {camp.is_active !== false ? (isAr ? "نشطة" : "Active") : (isAr ? "معطلة" : "Inactive")}
                      </span>
                    </div>

                    <div className="absolute top-2.5 end-2.5">
                      <Link
                        to={publicUrls.donationCampaign(camp)}
                        target="_blank"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 text-foreground backdrop-blur hover:bg-background shadow-sm"
                        title={isAr ? "معاينة الحملة" : "Preview"}
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
                          {camp.name_ar}
                        </h3>
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {camp.slug}
                        </span>
                      </div>

                      {camp.subtitle_ar && (
                        <p className="mt-1 text-xs font-semibold text-secondary line-clamp-1">
                          {camp.subtitle_ar}
                        </p>
                      )}

                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                        {camp.description_ar || (isAr ? "لا يوجد وصف مدخل" : "No description")}
                      </p>
                    </div>

                    {/* Progress & Target */}
                    <div className="space-y-1.5 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{isAr ? "المحصل / المستهدف" : "Raised / Target"}</span>
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
                        <span>{isAr ? "الحد الأدنى:" : "Min:"} {Number(camp.minimum_amount || 50)} ج.م</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between border-t border-border/70 bg-muted/30 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={camp.is_active !== false}
                        onCheckedChange={() => handleToggleActive(camp)}
                      />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {camp.is_active !== false ? (isAr ? "مفعلة" : "On") : (isAr ? "معطلة" : "Off")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openPackages(camp)}
                        className="h-8 px-2 text-xs gap-1 text-secondary hover:text-secondary-foreground hover:bg-secondary/20"
                        title={isAr ? "إدارة باقات الأسهم" : "Packages"}
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
                        <Link to={`/admin/donation-campaigns/${camp.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCampaign(camp.id)}
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

      {/* ── Dialog: Create / Edit Campaign ── */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Megaphone className="h-5 w-5 text-primary" />
              {editing?.id && !String(editing.id).startsWith("static-")
                ? (isAr ? "تعديل بيانات الحملة" : "Edit Campaign")
                : (isAr ? "إضافة حملة جديدة" : "New Campaign")}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{isAr ? "اسم الحملة (بالعربي) *" : "Name (Arabic) *"}</Label>
                  <Input
                    value={editing.name_ar || ""}
                    onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })}
                    placeholder="مثال: سقيا الماء — محطات التحلية"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{isAr ? "اسم الحملة (بالإنجليزي)" : "Name (English)"}</Label>
                  <Input
                    value={editing.name_en || ""}
                    onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                    placeholder="Water Project"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{isAr ? "المعرف الرابطي (slug)" : "Slug"}</Label>
                  <Input
                    value={editing.slug || ""}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="water-project"
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label>{isAr ? "التصنيف التابع له *" : "Category *"}</Label>
                  <UiSelect
                    value={editing.category_id ? String(editing.category_id) : ""}
                    onChange={(e) => setEditing({ ...editing, category_id: e.target.value ? Number(e.target.value) : null })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{categories.length ? (isAr ? "— بدون تصنيف —" : "— No category —") : (isAr ? "لا توجد تصنيفات في قاعدة البيانات" : "No categories in the database")}</option>
                    {categories.map((k) => (
                      <option key={String(k.id)} value={String(k.id)}>
                        {k.name_ar} ({k.slug})
                      </option>
                    ))}
                  </UiSelect>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{isAr ? "الشعار أو السطر البارز (عربي)" : "Subtitle (Arabic)"}</Label>
                  <Input
                    value={editing.subtitle_ar || ""}
                    onChange={(e) => setEditing({ ...editing, subtitle_ar: e.target.value })}
                    placeholder="«نوفر شربة ماء نقية للأسر الأكثر احتياجاً»"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{isAr ? "الشعار (إنجليزي)" : "Subtitle (English)"}</Label>
                  <Input
                    value={editing.subtitle_en || ""}
                    onChange={(e) => setEditing({ ...editing, subtitle_en: e.target.value })}
                    placeholder="Clean water for families in need"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>{isAr ? "وصف الحملة بالعربي" : "Description (Arabic)"}</Label>
                <Textarea
                  value={editing.description_ar || ""}
                  onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })}
                  placeholder="اكتب نبذة كاملة عن أهداف وأثر الحملة..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>{isAr ? "المبلغ المستهدف (ج.م)" : "Target Amount"}</Label>
                  <Input
                    type="number"
                    value={editing.target_amount ?? 100000}
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
                <div>
                  <Label>{isAr ? "الحد الأدنى للتبرع (ج.م)" : "Minimum Donation"}</Label>
                  <Input
                    type="number"
                    value={editing.minimum_amount ?? 50}
                    onChange={(e) => setEditing({ ...editing, minimum_amount: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>{isAr ? "رابط الصورة (URL أو مسار)" : "Image URL"}</Label>
                <Input
                  value={editing.image || ""}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  placeholder="https://... أو /images/..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>{isAr ? "بنود وأركان الحملة (اكتب كل بند في سطر)" : "Benefits / Pillars (one per line)"}</Label>
                <Textarea
                  value={benefitsInput}
                  onChange={(e) => setBenefitsInput(e.target.value)}
                  placeholder="توفير المياه النظيفة للقرى&#10;محطات معالجة ثلاثية معتمدة&#10;متابعة وصيانة دورية"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border/70">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.is_active !== false}
                    onCheckedChange={(c) => setEditing({ ...editing, is_active: c })}
                  />
                  <Label>{isAr ? "حملة نشطة بالموقع" : "Active"}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.donation_available !== false}
                    onCheckedChange={(c) => setEditing({ ...editing, donation_available: c })}
                  />
                  <Label>{isAr ? "التبرع متاح أونلاين" : "Donation Available"}</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSaveCampaign} disabled={saving} className="gap-1.5 bg-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isAr ? "حفظ الحملة" : "Save Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Unified Manage & Add Categories ── */}
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
              {isAr ? "إدارة تصنيفات الحملات" : "Manage Campaign Categories"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? "إضافة وتعديل وحذف تصنيفات الحملات والمبادرات الخيرية."
                : "Add, edit, and delete campaign categories."}
            </DialogDescription>
          </DialogHeader>

          {/* ── Add New Category Form (Inline) ── */}
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
                  placeholder="مثال: مبادرات الاستدامة"
                  className="mt-1 h-8 text-xs"
                  dir="rtl"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold">{isAr ? "الاسم بالإنجليزية" : "Name (English)"}</Label>
                <Input
                  value={newCat.name_en}
                  onChange={(e) => setNewCat({ ...newCat, name_en: e.target.value })}
                  placeholder="Sustainability Initiatives"
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
                {isAr ? "إضافة التصنيف" : "Add"}
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
                    /* ── Inline Edit Row ── */
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
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <Input
                          value={editingCat.slug || ""}
                          onChange={(e) => setEditingCat({ ...editingCat, slug: e.target.value })}
                          placeholder="slug"
                          className="h-8 text-xs font-mono"
                        />
                        <Input
                          type="number"
                          value={editingCat.sort_order ?? ""}
                          onChange={(e) => setEditingCat({ ...editingCat, sort_order: Number(e.target.value) })}
                          placeholder={isAr ? "الترتيب" : "Order"}
                          className="h-8 text-xs font-mono"
                        />
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                          <Switch
                            checked={editingCat.is_active !== false}
                            onCheckedChange={(v) => setEditingCat({ ...editingCat, is_active: v })}
                          />
                          {isAr ? "نشط" : "Active"}
                        </label>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCat(null)}
                          className="h-7 px-2 text-xs"
                        >
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
                    /* ── Display Row ── */
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
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          title={isAr ? "تعديل" : "Edit"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(cat)}
                          disabled={deletingCatId === cat.id}
                          className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title={isAr ? "حذف" : "Delete"}
                        >
                          {deletingCatId === cat.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowManageCats(false);
                setEditingCat(null);
              }}
              className="w-full sm:w-auto"
            >
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Donation Packages ── */}
      <Dialog open={!!packagesCamp} onOpenChange={(open) => !open && closePackages()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-lg">
              <Tag className="h-5 w-5 text-secondary" />
              {isAr ? `باقات التبرع (الأسهم) — ${packagesCamp?.name_ar}` : `Donation Packages — ${packagesCamp?.name_en || packagesCamp?.name_ar}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? "الأسعار هنا هي اللي بتظهر في صفحة الحملة وصفحة التبرع (مثلاً سعر كرتونة الغذاء). أي تعديل يُحفظ في قاعدة البيانات فوراً."
                : "These amounts are the prices shown on the campaign and donate pages. Changes are saved immediately."}
            </DialogDescription>
          </DialogHeader>

          {packagesCamp && (
            <CampaignPackagesManager
              campaignId={packagesCamp.id}
              packages={packagesList}
              onChange={setPackagesList}
              isAr={isAr}
              priceKeys={packagesPriceKeys}
            />
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closePackages}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
