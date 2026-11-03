/**
 * Editor for /programs/{id}/page-sections (ALL endpoints used here already exist):
 *   GET list, POST add, PUT edit + reorder (sort_order), PATCH toggle, DELETE.
 *
 * content_ar / content_en are arrays whose item shape depends on section_key (see sectionSchemas.ts);
 * known shapes get structured inputs, anything else falls back to a validated JSON textarea.
 */
import { UiSelect } from "@/components/common/UiSelect";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, Braces, ChevronDown, ChevronUp, LayoutList, Loader2, Pencil, Plus, RefreshCw, Save, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  apiErrorMessageAr,
  programsAdminApi,
  type PageSectionInput,
  type ProgramPageSection,
} from "@/data/api/programsAdminApi";
import { BilingualField, Field, ItemListEditor, NeedsBackendBadge, SectionCard } from "./FormKit";
import { DEFAULT_NAV_ITEMS, NAV_ITEM_FIELDS, SECTION_SCHEMAS, getSectionSchema } from "./sectionSchemas";
import { str } from "./formUtils";

type Item = Record<string, unknown>;

interface SectionDraft {
  section_key: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  jsonMode: boolean;
  contentAr: Item[];
  contentEn: Item[];
  contentArJson: string;
  contentEnJson: string;
  navItems: Item[];
  settingsJson: string;
  is_enabled: boolean;
  sort_order: number;
}

const isEmptyJson = (v: unknown) =>
  v === null || v === undefined || (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0);

const isItemArray = (v: unknown): v is Item[] =>
  Array.isArray(v) && v.every((x) => x !== null && typeof x === "object" && !Array.isArray(x));

const pretty = (v: unknown) => (isEmptyJson(v) ? "" : JSON.stringify(v, null, 2));

function toDraft(s: ProgramPageSection): SectionDraft {
  const schema = getSectionSchema(s.section_key);
  const structured = !!schema && schema.content === "items" &&
    (isEmptyJson(s.content_ar) || isItemArray(s.content_ar)) &&
    (isEmptyJson(s.content_en) || isItemArray(s.content_en));
  const settings = (s.settings && typeof s.settings === "object" && !Array.isArray(s.settings)) ? (s.settings as Record<string, unknown>) : {};
  let navItems: Item[] = [];
  let settingsRest: unknown = s.settings;
  if (schema?.navSettings) {
    navItems = isItemArray(settings.top_section) ? [...settings.top_section] : [];
    const rest = { ...settings };
    delete rest.top_section;
    settingsRest = rest;
  }
  return {
    section_key: s.section_key,
    title_ar: str(s.title_ar),
    title_en: str(s.title_en),
    subtitle_ar: str(s.subtitle_ar),
    subtitle_en: str(s.subtitle_en),
    jsonMode: !!schema && schema.content === "items" ? !structured : !schema,
    contentAr: isItemArray(s.content_ar) ? s.content_ar : [],
    contentEn: isItemArray(s.content_en) ? s.content_en : [],
    contentArJson: pretty(s.content_ar),
    contentEnJson: pretty(s.content_en),
    navItems,
    settingsJson: pretty(settingsRest),
    is_enabled: s.is_enabled !== false,
    sort_order: Number(s.sort_order ?? 0),
  };
}

/** Drop list items whose every value is empty. */
const cleanItems = (list: Item[]) =>
  list.filter((it) => Object.values(it).some((v) => v !== "" && v !== null && v !== undefined && v !== false));

function parseJson(text: string, label: string, errors: string[]): unknown {
  if (!text.trim()) return [];
  try {
    return JSON.parse(text);
  } catch {
    errors.push(`${label}: صيغة JSON غير صحيحة`);
    return undefined;
  }
}

function fromDraft(d: SectionDraft, original: ProgramPageSection): { body?: PageSectionInput; errors: string[] } {
  const errors: string[] = [];
  const schema = getSectionSchema(d.section_key);
  if (!d.section_key.trim()) errors.push("مفتاح القسم مطلوب");

  let contentAr: unknown = original.content_ar ?? [];
  let contentEn: unknown = original.content_en ?? [];
  if (d.jsonMode) {
    contentAr = parseJson(d.contentArJson, "المحتوى العربي", errors);
    contentEn = parseJson(d.contentEnJson, "المحتوى الإنجليزي", errors);
  } else if (schema?.content === "items") {
    contentAr = cleanItems(d.contentAr);
    contentEn = cleanItems(d.contentEn);
  }

  let settings = parseJson(d.settingsJson, "الإعدادات", errors);
  if (settings !== undefined && (settings === null || typeof settings !== "object")) {
    errors.push("الإعدادات يجب أن تكون كائن JSON مثل {\"background\": \"#ffffff\"}");
  }
  if (schema?.navSettings && settings !== undefined) {
    const base = Array.isArray(settings) ? {} : (settings as Record<string, unknown>);
    settings = {
      ...base,
      top_section: cleanItems(d.navItems).map((it, i) => ({ ...it, is_enabled: it.is_enabled !== false, sort_order: i + 1 })),
    };
  } else if (Array.isArray(settings) && settings.length === 0) {
    settings = {};
  }

  if (errors.length) return { errors };
  return {
    errors,
    body: {
      section_key: d.section_key.trim(),
      title_ar: d.title_ar.trim() || null,
      title_en: d.title_en.trim() || null,
      subtitle_ar: d.subtitle_ar.trim() || null,
      subtitle_en: d.subtitle_en.trim() || null,
      content_ar: contentAr,
      content_en: contentEn,
      settings,
      is_enabled: d.is_enabled,
      sort_order: d.sort_order,
    },
  };
}

/** Body for re-saving a server copy unchanged (used for reorder). */
function serverBody(s: ProgramPageSection, sortOrder: number): PageSectionInput {
  return {
    section_key: s.section_key,
    title_ar: s.title_ar ?? null,
    title_en: s.title_en ?? null,
    subtitle_ar: s.subtitle_ar ?? null,
    subtitle_en: s.subtitle_en ?? null,
    content_ar: s.content_ar ?? [],
    content_en: s.content_en ?? [],
    settings: Array.isArray(s.settings) && s.settings.length === 0 ? {} : (s.settings ?? {}),
    is_enabled: s.is_enabled !== false,
    sort_order: sortOrder,
  };
}

export function PageSectionsEditor({ programId }: { programId: number | string }) {
  const [sections, setSections] = useState<ProgramPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState<SectionDraft | null>(null);
  const [newKey, setNewKey] = useState("");
  const [customKey, setCustomKey] = useState("");

  const sorted = useMemo(
    () => [...sections].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) || a.id - b.id),
    [sections],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setSections(await programsAdminApi.listSections(programId));
    } catch (err) {
      setLoadError(apiErrorMessageAr(err));
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => { void load(); }, [load]);

  const usedKeys = new Set(sections.map((s) => s.section_key));
  const freeSchemas = SECTION_SCHEMAS.filter((s) => !usedKeys.has(s.key));

  const fail = (title: string, err: unknown) =>
    toast({ variant: "destructive", title, description: apiErrorMessageAr(err) });

  const openEditor = (s: ProgramPageSection) => {
    if (openId === s.id) {
      if (draft && JSON.stringify(draft) !== JSON.stringify(toDraft(s)) && !window.confirm("لديك تعديلات غير محفوظة على هذا القسم. تجاهلها؟")) return;
      setOpenId(null);
      setDraft(null);
      return;
    }
    if (openId !== null && draft) {
      const cur = sections.find((x) => x.id === openId);
      if (cur && JSON.stringify(draft) !== JSON.stringify(toDraft(cur)) && !window.confirm("لديك تعديلات غير محفوظة على قسم آخر. تجاهلها؟")) return;
    }
    setOpenId(s.id);
    setDraft(toDraft(s));
  };

  const saveSection = async (s: ProgramPageSection) => {
    if (!draft) return;
    const { body, errors } = fromDraft(draft, s);
    if (!body) {
      toast({ variant: "destructive", title: "راجع بيانات القسم", description: errors.join(" — ") });
      return;
    }
    setBusy(`save-${s.id}`);
    try {
      const saved = await programsAdminApi.updateSection(programId, s.id, body);
      toast({ title: "تم حفظ القسم" });
      if (saved && typeof saved === "object" && "id" in saved) {
        setSections((list) => list.map((x) => (x.id === s.id ? { ...x, ...saved } : x)));
        setDraft(toDraft({ ...s, ...saved }));
      } else {
        await load();
        setOpenId(null);
        setDraft(null);
      }
    } catch (err) {
      fail("فشل حفظ القسم", err);
    } finally {
      setBusy("");
    }
  };

  const toggleSection = async (s: ProgramPageSection, next: boolean) => {
    setBusy(`toggle-${s.id}`);
    try {
      await programsAdminApi.toggleSection(programId, s.id, next);
      setSections((list) => list.map((x) => (x.id === s.id ? { ...x, is_enabled: next } : x)));
      if (draft && openId === s.id) setDraft({ ...draft, is_enabled: next });
      toast({ title: next ? "تم إظهار القسم" : "تم إخفاء القسم" });
    } catch (err) {
      fail("فشل تغيير حالة القسم", err);
    } finally {
      setBusy("");
    }
  };

  const deleteSection = async (s: ProgramPageSection) => {
    if (!window.confirm(`حذف القسم «${s.title_ar || s.section_key}» نهائياً؟`)) return;
    setBusy(`del-${s.id}`);
    try {
      await programsAdminApi.deleteSection(programId, s.id);
      setSections((list) => list.filter((x) => x.id !== s.id));
      if (openId === s.id) { setOpenId(null); setDraft(null); }
      toast({ title: "تم حذف القسم" });
    } catch (err) {
      fail("فشل حذف القسم", err);
    } finally {
      setBusy("");
    }
  };

  const moveSection = async (from: number, to: number) => {
    if (to < 0 || to >= sorted.length) return;
    const next = [...sorted];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    const changes = next
      .map((s, i) => ({ s, order: i }))
      .filter(({ s, order }) => Number(s.sort_order ?? 0) !== order);
    setBusy("reorder");
    try {
      for (const { s, order } of changes) {
        await programsAdminApi.updateSection(programId, s.id, serverBody(s, order));
      }
      setSections(next.map((s, i) => ({ ...s, sort_order: i })));
      if (draft && openId !== null) {
        const idx = next.findIndex((s) => s.id === openId);
        if (idx >= 0) setDraft({ ...draft, sort_order: idx });
      }
      toast({ title: "تم حفظ ترتيب الأقسام" });
    } catch (err) {
      fail("فشل حفظ الترتيب (تم إعادة تحميل الأقسام)", err);
      await load();
    } finally {
      setBusy("");
    }
  };

  const addSection = async () => {
    const key = (newKey === "__custom" ? customKey : newKey).trim();
    if (!key) {
      toast({ variant: "destructive", title: "اختر نوع القسم أولاً" });
      return;
    }
    if (!/^[a-z0-9_]+$/.test(key)) {
      toast({ variant: "destructive", title: "مفتاح غير صالح", description: "استخدم حروف إنجليزية صغيرة وأرقام و _ فقط" });
      return;
    }
    const schema = getSectionSchema(key);
    const maxOrder = sections.reduce((m, s) => Math.max(m, Number(s.sort_order ?? 0)), 0);
    setBusy("add");
    try {
      const created = await programsAdminApi.createSection(programId, {
        section_key: key,
        title_ar: schema?.labelAr ?? key,
        title_en: schema?.labelEn ?? key,
        content_ar: [],
        content_en: [],
        settings: schema?.navSettings ? { top_section: DEFAULT_NAV_ITEMS } : {},
        is_enabled: true,
        sort_order: key === "top_section" ? 0 : maxOrder + 1,
      });
      toast({ title: "تمت إضافة القسم" });
      setNewKey("");
      setCustomKey("");
      if (created && typeof created === "object" && "id" in created) {
        setSections((list) => [...list, created]);
        setOpenId(created.id);
        setDraft(toDraft(created));
      } else {
        await load();
      }
    } catch (err) {
      fail("فشل إضافة القسم", err);
    } finally {
      setBusy("");
    }
  };

  const patchDraft = (p: Partial<SectionDraft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const switchJsonMode = (on: boolean) => {
    if (!draft) return;
    if (on) {
      patchDraft({ jsonMode: true, contentArJson: pretty(cleanItems(draft.contentAr)), contentEnJson: pretty(cleanItems(draft.contentEn)) });
      return;
    }
    try {
      const ar = draft.contentArJson.trim() ? JSON.parse(draft.contentArJson) : [];
      const en = draft.contentEnJson.trim() ? JSON.parse(draft.contentEnJson) : [];
      if (!isItemArray(ar) || !isItemArray(en)) throw new Error("shape");
      patchDraft({ jsonMode: false, contentAr: ar, contentEn: en });
    } catch {
      toast({ variant: "destructive", title: "لا يمكن التحويل للمحرر", description: "المحتوى ليس قائمة عناصر JSON صالحة." });
    }
  };

  return (
    <SectionCard
      icon={<LayoutList className="h-4 w-4 text-primary" />}
      title="أقسام صفحة البرنامج"
      description="كل قسم يُحفظ منفصلاً. الصفحة العامة تقرأ هذه الأقسام عند تشغيل مصدر المحتوى من الـ API؛ مع الوضع الثابت تبقى الصفحة كما هي."
      actions={
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> تحديث
        </Button>
      }
    >
      {loadError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">تعذر تحميل الأقسام: {loadError}</div>
      )}

      {loading && sections.length === 0 ? (
        <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : sorted.length === 0 && !loadError ? (
        <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">لا توجد أقسام لهذا البرنامج بعد.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((s, i) => {
            const schema = getSectionSchema(s.section_key);
            const isOpen = openId === s.id && !!draft;
            return (
              <div key={s.id} className={`rounded-2xl border ${isOpen ? "border-primary/50" : "border-border/70"} bg-muted/20`}>
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <div className="flex items-center gap-0.5">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0 || !!busy} onClick={() => void moveSection(i, i - 1)} aria-label="لأعلى">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === sorted.length - 1 || !!busy} onClick={() => void moveSection(i, i + 1)} aria-label="لأسفل">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-foreground">{s.title_ar || schema?.labelAr || s.section_key}</span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground" dir="ltr">{s.section_key}</span>
                      {schema?.labelAr && <span className="text-[10px] text-muted-foreground">({schema.labelAr})</span>}
                      {!schema && <span className="text-[10px] font-bold text-amber-600">مفتاح غير معروف للواجهة</span>}
                    </div>
                    {s.title_en && <p className="text-[11px] text-muted-foreground" dir="ltr">{s.title_en}</p>}
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    {busy === `toggle-${s.id}` && <Loader2 className="h-3 w-3 animate-spin" />}
                    <Switch checked={s.is_enabled !== false} disabled={!!busy} onCheckedChange={(c) => void toggleSection(s, c)} />
                    {s.is_enabled !== false ? "ظاهر" : "مخفي"}
                  </label>
                  <Button type="button" size="sm" variant={isOpen ? "secondary" : "outline"} className="h-8 gap-1 rounded-xl text-xs" onClick={() => openEditor(s)}>
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />} {isOpen ? "إغلاق" : "تعديل"}
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" disabled={!!busy} onClick={() => void deleteSection(s)} aria-label="حذف">
                    {busy === `del-${s.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>

                {isOpen && draft && (
                  <div className="space-y-4 border-t border-border/70 p-3 sm:p-4">
                    {schema?.hintAr && <p className="rounded-xl bg-muted/50 p-2 text-[11px] text-muted-foreground">{schema.hintAr}</p>}
                    {schema?.proposed && (
                      <NeedsBackendBadge text="شكل العناصر مقترح من الواجهة (لا يوجد سجل حي بعد) — راجع ملف 04" />
                    )}
                    <BilingualField label="عنوان القسم" valueAr={draft.title_ar} valueEn={draft.title_en}
                      onAr={(v) => patchDraft({ title_ar: v })} onEn={(v) => patchDraft({ title_en: v })} />
                    <BilingualField label="العنوان الفرعي" valueAr={draft.subtitle_ar} valueEn={draft.subtitle_en}
                      onAr={(v) => patchDraft({ subtitle_ar: v })} onEn={(v) => patchDraft({ subtitle_en: v })} />

                    {(schema?.content === "items" || !schema) && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Label className="text-xs font-black">محتوى القسم</Label>
                          {schema?.content === "items" && (
                            <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => switchJsonMode(!draft.jsonMode)}>
                              {draft.jsonMode ? <LayoutList className="h-3.5 w-3.5" /> : <Braces className="h-3.5 w-3.5" />}
                              {draft.jsonMode ? "محرر الحقول" : "تحرير JSON"}
                            </Button>
                          )}
                        </div>
                        {draft.jsonMode || !schema?.itemFields ? (
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            <Field label="content_ar (JSON)">
                              <Textarea dir="ltr" rows={8} value={draft.contentArJson} className="rounded-xl font-mono text-[11px]"
                                onChange={(e) => patchDraft({ contentArJson: e.target.value })} />
                            </Field>
                            <Field label="content_en (JSON)">
                              <Textarea dir="ltr" rows={8} value={draft.contentEnJson} className="rounded-xl font-mono text-[11px]"
                                onChange={(e) => patchDraft({ contentEnJson: e.target.value })} />
                            </Field>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <Field label="العناصر (عربي)">
                              <ItemListEditor dir="rtl" items={draft.contentAr} fields={schema.itemFields}
                                newItem={schema.newItem ?? (() => ({}))} onChange={(v) => patchDraft({ contentAr: v })} />
                            </Field>
                            <Field label="Items (English)">
                              <ItemListEditor dir="ltr" items={draft.contentEn} fields={schema.itemFields}
                                newItem={schema.newItem ?? (() => ({}))} addLabel="Add item" onChange={(v) => patchDraft({ contentEn: v })} />
                            </Field>
                          </div>
                        )}
                      </div>
                    )}

                    {schema?.navSettings && (
                      <Field label="روابط التنقل (settings.top_section)">
                        <ItemListEditor dir="rtl" items={draft.navItems} fields={NAV_ITEM_FIELDS}
                          newItem={() => ({ key: "", title_ar: "", title_en: "", url: "#", is_enabled: true })}
                          addLabel="إضافة رابط" onChange={(v) => patchDraft({ navItems: v })} />
                      </Field>
                    )}

                    <Field label={schema?.navSettings ? "إعدادات إضافية (JSON اختياري)" : "إعدادات القسم settings (JSON اختياري)"}
                      hint='مثال: {"background": "#ffffff"} — اتركه فارغاً إن لم تحتجه'>
                      <Textarea dir="ltr" rows={3} value={draft.settingsJson} className="rounded-xl font-mono text-[11px]"
                        onChange={(e) => patchDraft({ settingsJson: e.target.value })} />
                    </Field>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" className="h-9 gap-1 rounded-xl text-xs"
                        onClick={() => setDraft(toDraft(s))}>
                        <X className="h-3.5 w-3.5" /> تراجع عن التعديلات
                      </Button>
                      <Button type="button" size="sm" className="h-9 gap-1 rounded-xl text-xs font-bold" disabled={!!busy} onClick={() => void saveSection(s)}>
                        {busy === `save-${s.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ القسم
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
        <p className="flex items-center gap-1.5 text-xs font-black text-primary"><Plus className="h-3.5 w-3.5" /> إضافة قسم</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <UiSelect value={newKey} onChange={(e) => setNewKey(e.target.value)}
            className="flex h-9 flex-1 rounded-xl border border-input bg-background px-3 text-xs">
            <option value="">اختر نوع القسم…</option>
            {freeSchemas.map((sc) => (
              <option key={sc.key} value={sc.key}>{sc.labelAr} ({sc.key})</option>
            ))}
            <option value="__custom">مفتاح مخصص…</option>
          </UiSelect>
          {newKey === "__custom" && (
            <Input dir="ltr" value={customKey} placeholder="custom_section_key" className="h-9 flex-1 rounded-xl font-mono text-xs"
              onChange={(e) => setCustomKey(e.target.value.toLowerCase())} />
          )}
          <Button type="button" size="sm" className="h-9 gap-1 rounded-xl text-xs" disabled={!!busy} onClick={() => void addSection()}>
            {busy === "add" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />} إضافة
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
