import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SEASONS, matchSeasonRecord, invalidateSeasonsCache, type Season } from "@/data/seasons";
import { seasonsApi, type SeasonInput, type SeasonItemRow, type SeasonPricingRow, type SeasonRecord } from "@/data/api/seasonsApi";
import { describeWriteError, BACKEND_PENDING_AR } from "@/data/api/backendPending";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import {
  Calendar,
  ExternalLink,
  Edit3,
  Save,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  DatabaseZap,
} from "lucide-react";

/**
 * Seasons CMS: reads and writes the backend `/seasons` table (no localStorage).
 *   list    GET    /seasons           (existing; auth)
 *   create  POST   /seasons           (existing)
 *   toggle  PATCH  /seasons/{id}      (existing: is_active, donation_available)
 *   edit    PUT    /seasons/{id}      (PROPOSED)
 *   delete  DELETE /seasons/{id}      (PROPOSED)
 * The six static seasons (src/data/seasons.ts) are shown even when the backend has no record for them, with a
 * button that creates the record from the static copy.
 */

/** Columns the backend may not have yet (PROPOSED): if a save response lacks them, the admin is told. */
const PROPOSED_SEASON_FIELDS: Array<keyof SeasonInput> = ["slug", "badge_ar", "badge_en", "donate_url", "items", "pricing", "meta_title_ar", "meta_title_en", "meta_description_ar", "meta_description_en"];

type FormState = SeasonInput & { id?: number };

const emptyForm = (sortOrder: number): FormState => ({
  slug: "",
  name_ar: "",
  name_en: "",
  period_ar: "",
  period_en: "",
  tagline_ar: "",
  tagline_en: "",
  description_ar: "",
  description_en: "",
  is_active: true,
  donation_available: true,
  sort_order: sortOrder,
  badge_ar: "",
  badge_en: "",
  donate_url: "",
  items: [],
  pricing: [],
  meta_title_ar: "",
  meta_title_en: "",
  meta_description_ar: "",
  meta_description_en: "",
});

/** Form prefilled from the static season (used to create its backend record). */
const formFromStatic = (s: Season, sortOrder: number): FormState => ({
  slug: s.slug,
  name_ar: s.titleAr,
  name_en: s.titleEn,
  period_ar: s.monthsAr,
  period_en: s.monthsEn,
  tagline_ar: s.taglineAr,
  tagline_en: s.taglineEn,
  description_ar: s.descriptionAr,
  description_en: s.descriptionEn,
  is_active: s.defaultEnabled,
  donation_available: s.defaultEnabled,
  sort_order: sortOrder,
  badge_ar: s.tagAr,
  badge_en: s.tagEn,
  donate_url: s.donateHref,
  items: s.items.map((i) => ({ ar: i.ar, en: i.en, desc_ar: i.arD ?? null, desc_en: i.enD ?? null })),
  pricing: (s.pricing || []).map((p) => ({ label_ar: p.labelAr, label_en: p.labelEn, amount: p.amount, tag_ar: p.tagAr ?? null, tag_en: p.tagEn ?? null })),
  meta_title_ar: s.metaTitleAr,
  meta_title_en: s.metaTitleEn,
  meta_description_ar: s.metaDescAr,
  meta_description_en: s.metaDescEn,
});

const formFromRecord = (r: SeasonRecord): FormState => ({
  ...emptyForm(r.sort_order ?? 1),
  ...Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null && v !== undefined)),
  id: r.id,
  items: Array.isArray(r.items) ? r.items : [],
  pricing: Array.isArray(r.pricing) ? r.pricing : [],
});

const toPayload = (f: FormState): Partial<SeasonInput> => {
  const out: Partial<SeasonInput> = {
    slug: f.slug?.trim() || null,
    name_ar: f.name_ar.trim(),
    name_en: f.name_en?.trim() || f.name_ar.trim(),
    period_ar: f.period_ar?.trim() || null,
    period_en: f.period_en?.trim() || null,
    tagline_ar: f.tagline_ar?.trim() || null,
    tagline_en: f.tagline_en?.trim() || null,
    description_ar: f.description_ar?.trim() || null,
    description_en: f.description_en?.trim() || null,
    is_active: !!f.is_active,
    donation_available: !!f.donation_available,
    sort_order: Number(f.sort_order || 1),
    badge_ar: f.badge_ar?.trim() || null,
    badge_en: f.badge_en?.trim() || null,
    donate_url: f.donate_url?.trim() || null,
    items: (f.items || []).filter((i) => i.ar?.trim()),
    pricing: (f.pricing || []).filter((p) => p.label_ar?.trim()).map((p) => ({ ...p, amount: Number(p.amount) || 0 })),
    meta_title_ar: f.meta_title_ar?.trim() || null,
    meta_title_en: f.meta_title_en?.trim() || null,
    meta_description_ar: f.meta_description_ar?.trim() || null,
    meta_description_en: f.meta_description_en?.trim() || null,
  };
  return out;
};

const ignoredProposedFields = (sent: Partial<SeasonInput>, returned: SeasonRecord | null | undefined): string[] => {
  if (!returned || typeof returned !== "object") return [];
  return PROPOSED_SEASON_FIELDS.filter((k) => {
    const v = sent[k];
    const hasValue = Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "";
    return hasValue && !Object.prototype.hasOwnProperty.call(returned, k);
  });
};

type Row = { key: string; staticSeason?: Season; record?: SeasonRecord };

export const AdminSeasons: React.FC = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [records, setRecords] = useState<SeasonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRecords(await seasonsApi.listAdmin());
    } catch (e) {
      setRecords([]);
      setLoadError(describeWriteError(e, "GET /seasons"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Six static seasons (linked to their backend record when it exists) + backend-only seasons. */
  const rows = useMemo<Row[]>(() => {
    const used = new Set<number>();
    const out: Row[] = SEASONS.map((s) => {
      const r = matchSeasonRecord(s, records.filter((x) => !used.has(x.id)));
      if (r) used.add(r.id);
      return { key: s.slug, staticSeason: s, record: r };
    });
    records
      .filter((r) => !used.has(r.id))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .forEach((r) => out.push({ key: `db-${r.id}`, record: r }));
    return out;
  }, [records]);

  const isOn = (r: Row) => (r.record ? r.record.is_active !== false && r.record.donation_available !== false : false);
  const activeCount = rows.filter(isOn).length;
  const filtered = rows.filter((r) => (filter === "active" ? isOn(r) : filter === "inactive" ? !isOn(r) : true));

  const afterWrite = async () => {
    invalidateSeasonsCache();
    await load();
  };

  const handleToggle = async (r: SeasonRecord, patch: Partial<Pick<SeasonRecord, "is_active" | "donation_available">>) => {
    setBusyId(r.id);
    try {
      await seasonsApi.toggle(r.id, {
        is_active: patch.is_active ?? r.is_active,
        donation_available: patch.donation_available ?? r.donation_available,
      });
      toast.success(isRTL ? "تم تحديث حالة الموسم في قاعدة البيانات" : "Season status updated");
      await afterWrite();
    } catch (e) {
      toast.error(isRTL ? "لم يتم تغيير حالة الموسم" : "Status not changed", { description: describeWriteError(e, "PATCH /seasons/{id}") });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (r: SeasonRecord) => {
    if (!window.confirm(isRTL ? `حذف الموسم «${r.name_ar}» من قاعدة البيانات؟` : `Delete season "${r.name_en || r.name_ar}"?`)) return;
    setBusyId(r.id);
    try {
      await seasonsApi.remove(r.id);
      toast.success(isRTL ? "تم حذف الموسم" : "Season deleted");
      await afterWrite();
    } catch (e) {
      toast.error(isRTL ? "لم يتم حذف الموسم" : "Season not deleted", { description: describeWriteError(e, "DELETE /seasons/{id}") });
    } finally {
      setBusyId(null);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.name_ar.trim()) {
      toast.error(isRTL ? "اكتب اسم الموسم بالعربي" : "Arabic name is required");
      return;
    }
    setSaving(true);
    const payload = toPayload(form);
    try {
      const saved = form.id ? await seasonsApi.update(form.id, payload) : await seasonsApi.create(payload);
      const ignored = ignoredProposedFields(payload, saved);
      if (ignored.length) {
        toast.warning(isRTL ? "تم الحفظ، لكن الباك إند تجاهل بعض الحقول" : "Saved, but the backend ignored some fields", {
          description: `${ignored.join("، ")} — ${BACKEND_PENDING_AR}`,
          duration: 10000,
        });
      } else {
        toast.success(form.id ? (isRTL ? "تم حفظ تعديلات الموسم" : "Season updated") : (isRTL ? "تم إنشاء الموسم في قاعدة البيانات" : "Season created"));
      }
      setForm(null);
      await afterWrite();
    } catch (e) {
      toast.error(isRTL ? "لم يتم حفظ الموسم" : "Season not saved", {
        description: describeWriteError(e, form.id ? "PUT /seasons/{id}" : "POST /seasons"),
      });
    } finally {
      setSaving(false);
    }
  };

  const nextSort = () => Math.max(0, ...records.map((r) => r.sort_order ?? 0)) + 1;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

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
                  {isRTL ? "إدارة المواسم والحملات السنوية" : "Annual Seasonal Campaigns"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {isRTL
                    ? "البيانات تُقرأ وتُحفظ في قاعدة البيانات (/seasons). التفعيل والإيقاف يظهران لكل الأدمنز."
                    : "Data is read from and saved to the database (/seasons)."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-center">
                <span className="block text-xs font-mono font-bold text-foreground">{rows.length}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">{isRTL ? "إجمالي المواسم" : "Total"}</span>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-center">
                <span className="block text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{activeCount}</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">{isRTL ? "متاحة للتبرع" : "Active"}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading} className="h-9 gap-1.5 text-xs font-bold">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {isRTL ? "تحديث" : "Reload"}
              </Button>
              <Button size="sm" onClick={() => setForm(emptyForm(nextSort()))} className="h-9 gap-1.5 text-xs font-bold">
                <Plus className="h-3.5 w-3.5" />
                {isRTL ? "موسم جديد" : "New season"}
              </Button>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <p className="font-black">{isRTL ? "تعذر تحميل المواسم من قاعدة البيانات" : "Could not load seasons from the database"}</p>
              <p>{loadError}</p>
              <p className="text-[11px] opacity-80">
                {isRTL
                  ? "الحالة المعروضة أدناه هي الافتراضية من الكود ولا يمكن تعديلها حتى يعمل GET /seasons."
                  : "The cards below show the code defaults; editing needs a working GET /seasons."}
              </p>
            </div>
          </div>
        )}

        {/* Filter Switcher */}
        <div className="flex items-center gap-2 bg-muted/50 border border-border/80 p-1 rounded-xl w-fit">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === f ? (f === "active" ? "bg-emerald-600 text-white shadow-xs" : "bg-background shadow-xs text-foreground") : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all"
                ? isRTL ? `الكل (${rows.length})` : `All (${rows.length})`
                : f === "active"
                  ? isRTL ? `المتاحة (${activeCount})` : `Active (${activeCount})`
                  : isRTL ? `المغلقة (${rows.length - activeCount})` : `Closed (${rows.length - activeCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((row) => (
              <SeasonAdminCard
                key={row.key}
                row={row}
                isRTL={isRTL}
                busy={!!row.record && busyId === row.record.id}
                canWrite={!loadError}
                onToggle={handleToggle}
                onEdit={() => setForm(row.record ? formFromRecord(row.record) : formFromStatic(row.staticSeason!, nextSort()))}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Edit / Create Modal */}
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-black text-foreground">
                    {form.id ? (isRTL ? `تعديل: ${form.name_ar}` : `Edit: ${form.name_en || form.name_ar}`) : isRTL ? "إنشاء موسم في قاعدة البيانات" : "Create season"}
                  </h3>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setForm(null)} className="h-8 w-8 p-0 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label={isRTL ? "المفتاح (slug) — مقترح" : "Slug (proposed)"}>
                    <Input dir="ltr" className="text-xs font-mono" placeholder="ster | thill | ramadan | ashr | qurbani | school" value={form.slug || ""} onChange={(e) => set("slug", e.target.value.trim())} />
                  </Field>
                  <Field label={isRTL ? "الترتيب" : "Sort order"}>
                    <Input dir="ltr" type="number" className="text-xs font-mono" value={form.sort_order ?? ""} onChange={(e) => set("sort_order", Number(e.target.value))} />
                  </Field>
                  <div className="flex items-end gap-4 pb-1">
                    <label className="flex items-center gap-2 text-xs font-bold"><Switch checked={!!form.is_active} onCheckedChange={(v) => set("is_active", v)} />{isRTL ? "نشط" : "Active"}</label>
                    <label className="flex items-center gap-2 text-xs font-bold"><Switch checked={!!form.donation_available} onCheckedChange={(v) => set("donation_available", v)} />{isRTL ? "التبرع متاح" : "Donations"}</label>
                  </div>
                </div>

                <Pair isRTL={isRTL} label={isRTL ? "اسم/عنوان الموسم *" : "Name *"} ar={form.name_ar} en={form.name_en || ""} onAr={(v) => set("name_ar", v)} onEn={(v) => set("name_en", v)} />
                <Pair isRTL={isRTL} label={isRTL ? "الفترة / الشهور" : "Period"} ar={form.period_ar || ""} en={form.period_en || ""} onAr={(v) => set("period_ar", v)} onEn={(v) => set("period_en", v)} />
                <Pair isRTL={isRTL} label={isRTL ? "الشارة (مثلاً: موسم الشتاء) — مقترح" : "Badge (proposed)"} ar={form.badge_ar || ""} en={form.badge_en || ""} onAr={(v) => set("badge_ar", v)} onEn={(v) => set("badge_en", v)} />
                <Pair isRTL={isRTL} label={isRTL ? "الشعار النصي (Tagline)" : "Tagline"} ar={form.tagline_ar || ""} en={form.tagline_en || ""} onAr={(v) => set("tagline_ar", v)} onEn={(v) => set("tagline_en", v)} />
                <Pair isRTL={isRTL} multiline label={isRTL ? "الوصف" : "Description"} ar={form.description_ar || ""} en={form.description_en || ""} onAr={(v) => set("description_ar", v)} onEn={(v) => set("description_en", v)} />

                <Field label={isRTL ? "رابط التبرع — مقترح" : "Donate URL (proposed)"}>
                  <Input dir="ltr" className="text-xs font-mono" placeholder="/donate?campaign=ster" value={form.donate_url || ""} onChange={(e) => set("donate_url", e.target.value)} />
                </Field>

                {/* Pricing tiers (PROPOSED JSON column) */}
                <ListEditor<SeasonPricingRow>
                  isRTL={isRTL}
                  title={isRTL ? "فئات التبرع (pricing) — مقترح" : "Pricing tiers (proposed)"}
                  rows={form.pricing || []}
                  onChange={(rows) => set("pricing", rows)}
                  blank={{ label_ar: "", label_en: "", amount: 0, tag_ar: "", tag_en: "" }}
                  render={(row, patch) => (
                    <div className="grid gap-2 sm:grid-cols-5">
                      <Input dir="rtl" className="h-8 text-xs" placeholder="الاسم" value={row.label_ar} onChange={(e) => patch({ label_ar: e.target.value })} />
                      <Input dir="ltr" className="h-8 text-xs" placeholder="Label" value={row.label_en || ""} onChange={(e) => patch({ label_en: e.target.value })} />
                      <Input dir="ltr" type="number" className="h-8 text-xs font-mono" placeholder="EGP" value={row.amount} onChange={(e) => patch({ amount: Number(e.target.value) })} />
                      <Input dir="rtl" className="h-8 text-xs" placeholder="وسم" value={row.tag_ar || ""} onChange={(e) => patch({ tag_ar: e.target.value })} />
                      <Input dir="ltr" className="h-8 text-xs" placeholder="Tag" value={row.tag_en || ""} onChange={(e) => patch({ tag_en: e.target.value })} />
                    </div>
                  )}
                />

                {/* Items (PROPOSED JSON column) */}
                <ListEditor<SeasonItemRow>
                  isRTL={isRTL}
                  title={isRTL ? "بنود الموسم (items) — مقترح" : "Items (proposed)"}
                  rows={form.items || []}
                  onChange={(rows) => set("items", rows)}
                  blank={{ ar: "", en: "", desc_ar: "", desc_en: "" }}
                  render={(row, patch) => (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input dir="rtl" className="h-8 text-xs" placeholder="البند" value={row.ar} onChange={(e) => patch({ ar: e.target.value })} />
                      <Input dir="ltr" className="h-8 text-xs" placeholder="Item" value={row.en || ""} onChange={(e) => patch({ en: e.target.value })} />
                      <Input dir="rtl" className="h-8 text-xs" placeholder="وصف قصير (اختياري)" value={row.desc_ar || ""} onChange={(e) => patch({ desc_ar: e.target.value })} />
                      <Input dir="ltr" className="h-8 text-xs" placeholder="Short description" value={row.desc_en || ""} onChange={(e) => patch({ desc_en: e.target.value })} />
                    </div>
                  )}
                />

                <Pair isRTL={isRTL} label={isRTL ? "عنوان السيو (meta title) — مقترح" : "Meta title (proposed)"} ar={form.meta_title_ar || ""} en={form.meta_title_en || ""} onAr={(v) => set("meta_title_ar", v)} onEn={(v) => set("meta_title_en", v)} />
                <Pair isRTL={isRTL} multiline label={isRTL ? "وصف السيو (meta description) — مقترح" : "Meta description (proposed)"} ar={form.meta_description_ar || ""} en={form.meta_description_en || ""} onAr={(v) => set("meta_description_ar", v)} onEn={(v) => set("meta_description_en", v)} />
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-border">
                <p className="text-[11px] text-muted-foreground">
                  {form.id
                    ? isRTL ? "الحفظ: PUT /seasons/{id} (مقترح؛ لو ظهر «يحتاج تفعيل من الباك إند» فلم يُحفظ شيء)." : "Saves with PUT /seasons/{id} (proposed)."
                    : isRTL ? "الإنشاء: POST /seasons." : "Creates with POST /seasons."}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setForm(null)} className="text-xs font-bold">
                    {isRTL ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button size="sm" onClick={() => void handleSave()} disabled={saving} className="gap-1.5 bg-primary text-primary-foreground font-bold text-xs">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isRTL ? "حفظ في قاعدة البيانات" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="grid gap-1.5 text-xs font-bold text-foreground/80">
    {label}
    {children}
  </label>
);

const Pair: React.FC<{ isRTL: boolean; label: string; ar: string; en: string; onAr: (v: string) => void; onEn: (v: string) => void; multiline?: boolean }> = ({ label, ar, en, onAr, onEn, multiline }) => {
  const Cmp = multiline ? Textarea : Input;
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold text-foreground/80">{label}</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <Cmp dir="rtl" className="text-xs" value={ar} onChange={(e) => onAr(e.target.value)} placeholder="عربي" />
        <Cmp dir="ltr" className="text-xs" value={en} onChange={(e) => onEn(e.target.value)} placeholder="English" />
      </div>
    </div>
  );
};

function ListEditor<T extends object>({ isRTL, title, rows, onChange, blank, render }: {
  isRTL: boolean;
  title: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  blank: T;
  render: (row: T, patch: (p: Partial<T>) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">{title}</span>
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onChange([...rows, { ...blank }])}>
          <Plus className="h-3 w-3" />
          {isRTL ? "إضافة" : "Add"}
        </Button>
      </div>
      {rows.length === 0 && <p className="text-[11px] text-muted-foreground">{isRTL ? "لا توجد عناصر." : "No rows."}</p>}
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">{render(row, (p) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r))))}</div>
          <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive/80" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

const SeasonAdminCard: React.FC<{
  row: Row;
  isRTL: boolean;
  busy: boolean;
  canWrite: boolean;
  onToggle: (r: SeasonRecord, patch: Partial<Pick<SeasonRecord, "is_active" | "donation_available">>) => void;
  onEdit: () => void;
  onDelete: (r: SeasonRecord) => void;
}> = ({ row, isRTL, busy, canWrite, onToggle, onEdit, onDelete }) => {
  const { staticSeason: s, record: r } = row;
  const Icon = s?.icon ?? Calendar;
  const enabled = r ? r.is_active !== false && r.donation_available !== false : false;
  const title = r?.name_ar || s?.titleAr || "";
  const period = r?.period_ar || s?.monthsAr || "";
  const badge = r?.badge_ar || s?.tagAr || "";
  const description = r?.description_ar || s?.descriptionAr || "";
  const pricing = r?.pricing?.length
    ? r.pricing.map((p) => ({ label: p.label_ar, amount: p.amount }))
    : (s?.pricing || []).map((p) => ({ label: p.labelAr, amount: p.amount }));

  return (
    <div className={`rounded-2xl border transition-all p-5 flex flex-col justify-between gap-4 ${enabled ? "border-border/90 bg-card shadow-xs hover:border-emerald-500/40" : "border-border/50 bg-muted/20"}`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {[badge, period].filter(Boolean).join(" · ")}
              </span>
              <h3 className="text-base font-black text-foreground truncate">{title}</h3>
              <span className="text-[10px] font-mono text-muted-foreground">
                {r ? `#${r.id}${r.slug ? ` · ${r.slug}` : ""}` : s ? `${s.slug} · ${isRTL ? "غير موجود في قاعدة البيانات" : "not in the database"}` : ""}
              </span>
            </div>
          </div>

          {r && (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <label className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                {isRTL ? "نشط" : "Active"}
                <Switch checked={r.is_active !== false} disabled={busy || !canWrite} onCheckedChange={(v) => onToggle(r, { is_active: v })} />
              </label>
              <label className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                {isRTL ? "التبرع متاح" : "Donations"}
                <Switch checked={r.donation_available !== false} disabled={busy || !canWrite} onCheckedChange={(v) => onToggle(r, { donation_available: v })} />
              </label>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>

        {pricing.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pricing.map((p, idx) => (
              <span key={idx} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                {p.label}: <b className="font-mono text-emerald-600">{p.amount} ج.م</b>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
        {s ? (
          <Link to={`/seasons/${s.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />
            {isRTL ? "معاينة صفحة الموسم" : "Preview Page"}
          </Link>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1.5">
          {r && (
            <Button size="sm" variant="ghost" onClick={() => onDelete(r)} disabled={busy || !canWrite} className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive" title={isRTL ? "حذف" : "Delete"}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onEdit} disabled={!canWrite} className="h-8 gap-1.5 text-xs font-bold">
            {r ? <Edit3 className="h-3.5 w-3.5" /> : <DatabaseZap className="h-3.5 w-3.5" />}
            {r ? (isRTL ? "تعديل التفاصيل" : "Edit") : isRTL ? "إنشاء في قاعدة البيانات" : "Create in DB"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSeasons;
