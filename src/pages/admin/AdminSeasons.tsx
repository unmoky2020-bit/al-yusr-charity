import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SEASONS, useSeasonEnabled, setSeasonEnabled, type SeasonSlug, type Season } from "@/data/seasons";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import {
  Calendar,
  Sparkles,
  ExternalLink,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  Coins,
  Layers,
  Eye,
  Filter,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";

const SEASONS_CUSTOM_STORAGE_KEY = "elyusr_seasons_custom_overrides";

export const AdminSeasons: React.FC = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Partial<Season>>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEASONS_CUSTOM_STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {}
  }, []);

  const mergedSeasons = useMemo(() => {
    return SEASONS.map((s) => {
      const custom = overrides[s.slug] || {};
      return {
        ...s,
        ...custom,
      };
    });
  }, [overrides]);

  const activeCount = mergedSeasons.filter((s) => {
    const isEn = typeof window !== "undefined" ? localStorage.getItem(`elyusr_season_enabled_${s.slug}`) : null;
    return isEn !== null ? isEn === "true" : s.defaultEnabled;
  }).length;

  const filteredSeasons = mergedSeasons.filter((s) => {
    const isEn = typeof window !== "undefined" ? localStorage.getItem(`elyusr_season_enabled_${s.slug}`) : null;
    const enabled = isEn !== null ? isEn === "true" : s.defaultEnabled;
    if (filter === "active") return enabled;
    if (filter === "inactive") return !enabled;
    return true;
  });

  const handleSaveSeasonOverride = (updated: Season) => {
    const newOverrides = {
      ...overrides,
      [updated.slug]: {
        titleAr: updated.titleAr,
        titleEn: updated.titleEn,
        taglineAr: updated.taglineAr,
        taglineEn: updated.taglineEn,
        descriptionAr: updated.descriptionAr,
        descriptionEn: updated.descriptionEn,
        monthsAr: updated.monthsAr,
        monthsEn: updated.monthsEn,
        pricing: updated.pricing,
      },
    };
    setOverrides(newOverrides);
    localStorage.setItem(SEASONS_CUSTOM_STORAGE_KEY, JSON.stringify(newOverrides));
    toast.success(isRTL ? "تم حفظ التغييرات بنجاح" : "Season updated successfully");
    setEditingSeason(null);
  };

  return (
    <AdminLayout title={{ ar: "إدارة مواسم وحملات الخير السنوية", en: "Annual Seasons CMS" }}>
      <Helmet>
        <title>{isRTL ? "إدارة المواسم | لوحة التحكم" : "Seasons Management | Admin"}</title>
      </Helmet>

      <div className="space-y-6 pb-16">
        {/* Top Header Card */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground">
                  {isRTL ? "إدارة المواسم والحملات السنوية الستة" : "Annual Seasonal Campaigns"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {isRTL
                    ? "التحكم في مواسم الخير (ستر، رمضان، العشر الأوائل، الأضاحي، العودة للمدارس، ظل) وتفعيل استقبال التبرعات"
                    : "Manage 6 annual campaigns (Ster, Ramadan, Ashr, Qurbani, School, Thill) and toggle donation availability"}
                </p>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-center">
                <span className="block text-xs font-mono font-bold text-foreground">{SEASONS.length}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">{isRTL ? "إجمالي المواسم" : "Total"}</span>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-center">
                <span className="block text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{activeCount}</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">{isRTL ? "مواسم نشطة" : "Active"}</span>
              </div>
              <div className="rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-center">
                <span className="block text-xs font-mono font-bold text-muted-foreground">{SEASONS.length - activeCount}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">{isRTL ? "مغلقة مؤقتاً" : "Closed"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-muted/50 border border-border/80 p-1 rounded-xl">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === "all" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isRTL ? "جميع المواسم (6)" : "All (6)"}
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === "active" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isRTL ? `المتاحة حالياً (${activeCount})` : `Active (${activeCount})`}
            </button>
            <button
              onClick={() => setFilter("inactive")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === "inactive" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isRTL ? `المغلقة (${SEASONS.length - activeCount})` : `Closed (${SEASONS.length - activeCount})`}
            </button>
          </div>
        </div>

        {/* Seasons Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSeasons.map((season) => (
            <SeasonAdminCard
              key={season.slug}
              season={season}
              onEdit={() => setEditingSeason(season)}
            />
          ))}
        </div>

        {/* Edit Modal */}
        {editingSeason && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-black text-foreground">
                    {isRTL ? `تعديل حملة: ${editingSeason.titleAr}` : `Edit: ${editingSeason.titleEn}`}
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingSeason(null)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">{isRTL ? "عنوان الحملة (عربي)" : "Title (AR)"}</label>
                  <Input
                    value={editingSeason.titleAr}
                    onChange={(e) => setEditingSeason({ ...editingSeason, titleAr: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">{isRTL ? "الفترة الزمنية / الشهور (عربي)" : "Months (AR)"}</label>
                  <Input
                    value={editingSeason.monthsAr}
                    onChange={(e) => setEditingSeason({ ...editingSeason, monthsAr: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">{isRTL ? "الشعار النصي (Tagline)" : "Tagline"}</label>
                  <Input
                    value={editingSeason.taglineAr}
                    onChange={(e) => setEditingSeason({ ...editingSeason, taglineAr: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">{isRTL ? "الوصف التعريفي بالحملة" : "Description"}</label>
                  <Textarea
                    value={editingSeason.descriptionAr}
                    onChange={(e) => setEditingSeason({ ...editingSeason, descriptionAr: e.target.value })}
                    rows={3}
                    className="text-xs"
                  />
                </div>

                {/* Pricing Tiers Preview */}
                {editingSeason.pricing && editingSeason.pricing.length > 0 && (
                  <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-muted/20">
                    <span className="text-xs font-bold text-foreground">{isRTL ? "باقات وسهام التبرع المقترحة" : "Donation Tiers"}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {editingSeason.pricing.map((p, pIdx) => (
                        <div key={pIdx} className="rounded-lg bg-card border border-border p-2 text-center">
                          <span className="block text-[11px] font-bold truncate">{p.labelAr}</span>
                          <span className="block text-xs font-mono font-black text-emerald-600">{p.amount} ج.م</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSeason(null)}
                  className="text-xs font-bold"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveSeasonOverride(editingSeason)}
                  className="gap-1.5 bg-primary text-primary-foreground font-bold text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isRTL ? "حفظ التعديلات" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const SeasonAdminCard: React.FC<{
  season: Season;
  onEdit: () => void;
}> = ({ season, onEdit }) => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const enabled = useSeasonEnabled(season.slug);
  const Icon = season.icon;

  return (
    <div
      className={`rounded-2xl border transition-all p-5 flex flex-col justify-between gap-4 ${
        enabled
          ? "border-border/90 bg-card shadow-xs hover:border-emerald-500/40"
          : "border-border/50 bg-muted/20 opacity-75"
      }`}
    >
      <div className="space-y-3">
        {/* Top info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {season.tagAr} · {season.monthsAr}
              </span>
              <h3 className="text-base font-black text-foreground truncate">{season.titleAr}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-bold ${enabled ? "text-emerald-600" : "text-muted-foreground"}`}>
              {enabled ? (isRTL ? "متاحة للتبرع" : "Active") : (isRTL ? "مغلقة" : "Closed")}
            </span>
            <Switch checked={enabled} onCheckedChange={(v) => setSeasonEnabled(season.slug, v)} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {season.descriptionAr}
        </p>

        {/* Pricing pills */}
        {season.pricing && season.pricing.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {season.pricing.map((p, idx) => (
              <span key={idx} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                {p.labelAr}: <b className="font-mono text-emerald-600">{p.amount} ج.م</b>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <Link
          to={`/seasons/${season.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {isRTL ? "معاينة صفحة الموسم" : "Preview Page"}
        </Link>

        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="h-8 gap-1.5 text-xs font-bold"
        >
          <Edit3 className="h-3.5 w-3.5" />
          {isRTL ? "تعديل التفاصيل" : "Edit"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSeasons;