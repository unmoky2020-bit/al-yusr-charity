/**
 * «بيانات الموقع العامة»: the organisation's contact data, the About-page milestones and the header /
 * footer links — content that used to live in the code (orgInfo.ts, About.tsx, Navbar / Footer).
 * Saved as site blocks (backend bundle deploy-2026-11-13-extras). An empty block = the built-in copy.
 */
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/notify";
import { askConfirm } from "@/components/common/confirm";
import { describeWriteError } from "@/data/api/backendPending";
import { ORG } from "@/data/orgInfo";
import type { RemoteOrgInfo } from "@/data/orgInfo";
import {
  isSafeHref,
  SITE_BLOCKS_QUERY,
  siteBlocksAdminApi,
  type FooterLink,
  type Milestone,
  type NavLink,
  type SiteBlockKey,
  type SiteBlocks,
} from "@/data/siteBlocks";

type OrgField = { key: keyof RemoteOrgInfo; label: string; placeholder: string; ltr?: boolean; long?: boolean };

const ORG_FIELDS: { title: string; fields: OrgField[] }[] = [
  {
    title: "الاسم والإشهار",
    fields: [
      { key: "name_ar", label: "الاسم بالعربي", placeholder: ORG.nameAr },
      { key: "name_en", label: "الاسم بالإنجليزي", placeholder: ORG.nameEn, ltr: true },
      { key: "license_ar", label: "الإشهار (عربي)", placeholder: ORG.registrationAr },
      { key: "license_en", label: "الإشهار (إنجليزي)", placeholder: ORG.registrationEn, ltr: true },
    ],
  },
  {
    title: "التواصل",
    fields: [
      { key: "phone", label: "التليفون بالصيغة الدولية", placeholder: ORG.phoneE164, ltr: true },
      { key: "phone_display", label: "التليفون كما يظهر", placeholder: ORG.phoneDisplay, ltr: true },
      { key: "whatsapp", label: "رقم واتساب (أرقام فقط)", placeholder: ORG.whatsapp, ltr: true },
      { key: "email", label: "البريد", placeholder: ORG.email, ltr: true },
    ],
  },
  {
    title: "المقر والمواعيد",
    fields: [
      { key: "address_ar", label: "العنوان بالعربي", placeholder: ORG.addressAr, long: true },
      { key: "address_en", label: "العنوان بالإنجليزي", placeholder: ORG.addressEn, ltr: true, long: true },
      { key: "hours_ar", label: "المواعيد بالعربي", placeholder: ORG.hours.labelAr },
      { key: "hours_en", label: "المواعيد بالإنجليزي", placeholder: ORG.hours.labelEn, ltr: true },
      { key: "maps_url", label: "رابط خرائط جوجل", placeholder: ORG.mapsUrl, ltr: true },
      { key: "review_url", label: "رابط «اكتب تقييم» من جوجل بيزنس", placeholder: "https://g.page/r/…/review", ltr: true },
    ],
  },
  {
    title: "السوشيال ميديا",
    fields: [
      { key: "facebook", label: "فيسبوك", placeholder: ORG.social.facebook || "https://facebook.com/…", ltr: true },
      { key: "instagram", label: "إنستجرام", placeholder: ORG.social.instagram || "https://instagram.com/…", ltr: true },
      { key: "youtube", label: "يوتيوب", placeholder: "https://youtube.com/@…", ltr: true },
      { key: "tiktok", label: "تيك توك", placeholder: "https://tiktok.com/@…", ltr: true },
      { key: "x", label: "X (تويتر)", placeholder: "https://x.com/…", ltr: true },
      { key: "linkedin", label: "لينكدإن", placeholder: "https://linkedin.com/company/…", ltr: true },
    ],
  },
];

const LINK_FIELDS = new Set<keyof RemoteOrgInfo>(["maps_url", "review_url", "facebook", "instagram", "youtube", "tiktok", "x", "linkedin"]);

function orgProblem(v: RemoteOrgInfo): string {
  for (const k of LINK_FIELDS) {
    const val = (v[k] ?? "").trim();
    if (val && !/^https:\/\/\S+$/.test(val)) return "كل الروابط لازم تبدأ بـ https://";
  }
  const phone = (v.phone ?? "").replace(/[\s-]/g, "");
  if (phone && !/^\+\d{8,15}$/.test(phone)) return "التليفون الدولي لازم يبدأ بـ + وبعده أرقام (مثال +201097000137).";
  const email = (v.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "البريد مش صحيح.";
  return "";
}

const clean = (v: RemoteOrgInfo): RemoteOrgInfo =>
  Object.fromEntries(Object.entries(v).map(([k, x]) => [k, (x ?? "").trim()]).filter(([, x]) => x)) as RemoteOrgInfo;

export default function AdminSiteBlocks() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState<SiteBlocks>({});
  const [org, setOrg] = useState<RemoteOrgInfo>({});
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [header, setHeader] = useState<NavLink[]>([]);
  const [footer, setFooter] = useState<FooterLink[]>([]);
  const [busy, setBusy] = useState<SiteBlockKey | "">("");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const b = await siteBlocksAdminApi.load();
      setSaved(b);
      setOrg(b.org_info ?? {});
      setMilestones(b.about_milestones ?? []);
      setHeader(b.nav_links?.header ?? []);
      setFooter(b.nav_links?.footer ?? []);
    } catch (e) {
      setLoadError(describeWriteError(e, "GET /site-blocks (حزمة deploy-2026-11-13-extras)"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const done = async (msg: string) => {
    toast.success(msg);
    await qc.invalidateQueries({ queryKey: SITE_BLOCKS_QUERY });
    await load();
  };

  const save = async <K extends SiteBlockKey>(key: K, value: NonNullable<SiteBlocks[K]>, msg: string) => {
    setBusy(key);
    try {
      await siteBlocksAdminApi.save(key, value);
      await done(msg);
    } catch (e) {
      toast.error("ما اتحفظش", { description: describeWriteError(e, `PUT /admin/site-blocks/${key}`) });
    } finally {
      setBusy("");
    }
  };

  const reset = async (key: SiteBlockKey, what: string) => {
    if (!(await askConfirm(`ترجع ${what} للنسخة الأصلية اللي في الموقع؟ اللي محفوظ هنا هيتمسح.`))) return;
    setBusy(key);
    try {
      await siteBlocksAdminApi.reset(key);
      await done("رجعت للنسخة الأصلية");
    } catch (e) {
      toast.error("ما رجعتش", { description: describeWriteError(e, `DELETE /admin/site-blocks/${key}`) });
    } finally {
      setBusy("");
    }
  };

  const saveOrg = () => {
    const p = orgProblem(org);
    if (p) return toast.error(p);
    return save("org_info", clean(org), "اتحفظت بيانات المؤسسة");
  };

  const saveMilestones = () => {
    const list = milestones.map((m) => ({ ...m, year: m.year.trim(), title_ar: m.title_ar.trim() }));
    if (list.some((m) => !m.year || !m.title_ar)) return toast.error("كل محطة محتاجة سنة وعنوان بالعربي.");
    return save("about_milestones", list, "اتحفظت محطات «من نحن»");
  };

  const saveLinks = () => {
    const all = [...header, ...footer];
    if (all.some((l) => !l.label_ar.trim())) return toast.error("كل رابط محتاج اسم بالعربي.");
    const bad = all.find((l) => !isSafeHref(l.href.trim()));
    if (bad) return toast.error(`الرابط «${bad.label_ar}» لازم يبدأ بـ / (صفحة في الموقع) أو https://`);
    return save("nav_links", { header, footer }, "اتحفظت روابط القوائم");
  };

  const fillLinksFromSite = () => {
    // A starting point: the site's built-in menus as they are now.
    setHeader(BUILT_IN_HEADER);
    setFooter(BUILT_IN_FOOTER);
    toast.info("اتحطت روابط الموقع الحالية. عدّل اللي تحبه واحفظ.");
  };

  return (
    <AdminLayout title={{ ar: "بيانات الموقع العامة", en: "Site-wide content" }} loading={loading}>
      <Helmet><title>بيانات الموقع العامة | لوحة اليسر</title></Helmet>
      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6" dir="rtl">
        <div>
          <h1 className="text-xl font-black text-primary">بيانات الموقع العامة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            بيانات المؤسسة، ومحطات «من نحن»، وروابط القوائم. الخانة الفاضية = النص الأصلي اللي في الموقع، فمفيش حاجة بتختفي لو سبتها.
          </p>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            مش قادر أقرا البيانات: {loadError}
          </div>
        )}

        <Tabs defaultValue="org" dir="rtl">
          <TabsList className="flex-wrap">
            <TabsTrigger value="org">بيانات المؤسسة</TabsTrigger>
            <TabsTrigger value="milestones">محطات «من نحن»</TabsTrigger>
            <TabsTrigger value="links">روابط القوائم</TabsTrigger>
          </TabsList>

          <TabsContent value="org" className="space-y-4">
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              الاسم والعنوان والتليفون لازم يبقوا نفس اللي في ملف جوجل بيزنس وفيسبوك بالظبط (ده بيأثر على الظهور في البحث المحلي). لو غيّرت حاجة هنا غيّرها هناك كمان.
              مواعيد العمل في بيانات جوجل المنظمة (Schema) ثابتة: السبت–الخميس 10 ص–9 م؛ لو المواعيد نفسها اتغيرت بلّغ المطوّر.
            </p>
            {ORG_FIELDS.map((g) => (
              <Card key={g.title} className="space-y-3 p-4">
                <h2 className="text-sm font-black text-primary">{g.title}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.fields.map((f) => (
                    <label key={f.key} className={`grid gap-1 text-xs font-bold text-muted-foreground ${f.long ? "sm:col-span-2" : ""}`}>
                      {f.label}
                      <Input
                        dir={f.ltr ? "ltr" : "rtl"}
                        value={org[f.key] ?? ""}
                        placeholder={f.placeholder}
                        className="h-10 text-sm"
                        onChange={(e) => setOrg((o) => ({ ...o, [f.key]: e.target.value }))}
                      />
                    </label>
                  ))}
                </div>
              </Card>
            ))}
            <Actions busy={busy === "org_info"} onSave={saveOrg} onReset={saved.org_info ? () => void reset("org_info", "بيانات المؤسسة") : undefined} />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-3">
            {milestones.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                مفيش محطات محفوظة، فصفحة «من نحن» بتعرض المحطات الأصلية. ضيف أول محطة علشان تبدأ تتحكم فيها من هنا.
              </div>
            )}
            {milestones.map((m, i) => (
              <Card key={i} className="space-y-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input dir="ltr" className="h-9 w-28 text-sm font-mono" placeholder="2019" value={m.year}
                    onChange={(e) => setMilestones((l) => l.map((x, j) => (j === i ? { ...x, year: e.target.value } : x)))} />
                  <Input className="h-9 min-w-0 flex-1 text-sm" placeholder="العنوان بالعربي *" value={m.title_ar}
                    onChange={(e) => setMilestones((l) => l.map((x, j) => (j === i ? { ...x, title_ar: e.target.value } : x)))} />
                  <RowMoves i={i} n={milestones.length} onMove={(a, b) => setMilestones((l) => move(l, a, b))} onRemove={() => setMilestones((l) => l.filter((_, j) => j !== i))} />
                </div>
                <Textarea rows={2} className="text-sm" placeholder="النص بالعربي" value={m.text_ar ?? ""}
                  onChange={(e) => setMilestones((l) => l.map((x, j) => (j === i ? { ...x, text_ar: e.target.value } : x)))} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input dir="ltr" className="h-9 text-sm" placeholder="Title (EN)" value={m.title_en ?? ""}
                    onChange={(e) => setMilestones((l) => l.map((x, j) => (j === i ? { ...x, title_en: e.target.value } : x)))} />
                  <Input dir="ltr" className="h-9 text-sm" placeholder="Text (EN)" value={m.text_en ?? ""}
                    onChange={(e) => setMilestones((l) => l.map((x, j) => (j === i ? { ...x, text_en: e.target.value } : x)))} />
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" className="gap-1.5" onClick={() => setMilestones((l) => [...l, { year: "", title_ar: "" }])}>
              <Plus className="h-4 w-4" /> إضافة محطة
            </Button>
            <Actions busy={busy === "about_milestones"} onSave={saveMilestones} onReset={saved.about_milestones ? () => void reset("about_milestones", "المحطات") : undefined} />
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            {header.length === 0 && footer.length === 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                <span>مفيش روابط محفوظة، فالقوائم بتعرض روابط الموقع الأصلية.</span>
                <Button type="button" size="sm" variant="outline" onClick={fillLinksFromSite}>ابدأ من روابط الموقع الحالية</Button>
              </div>
            )}
            <LinkList
              title="قائمة الهيدر (9 روابط بالكتير، صفحات من الموقع بس)"
              rows={header}
              onChange={setHeader}
            />
            <LinkList
              title="روابط الفوتر"
              rows={footer}
              onChange={(r) => setFooter(r as FooterLink[])}
              withColumn
            />
            <Actions busy={busy === "nav_links"} onSave={saveLinks} onReset={saved.nav_links ? () => void reset("nav_links", "روابط القوائم") : undefined} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

function RowMoves({ i, n, onMove, onRemove }: { i: number; n: number; onMove: (a: number, b: number) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => onMove(i, i - 1)} aria-label="لفوق"><ArrowUp className="h-3.5 w-3.5" /></Button>
      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={i === n - 1} onClick={() => onMove(i, i + 1)} aria-label="لتحت"><ArrowDown className="h-3.5 w-3.5" /></Button>
      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onRemove} aria-label="حذف"><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

function LinkList({ title, rows, onChange, withColumn = false }: {
  title: string;
  rows: (NavLink | FooterLink)[];
  onChange: (rows: (NavLink | FooterLink)[]) => void;
  withColumn?: boolean;
}) {
  const set = (i: number, patch: Partial<FooterLink>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <Card className="space-y-2 p-4">
      <h2 className="text-sm font-black text-primary">{title}</h2>
      {rows.map((r, i) => (
        <div key={i} className={`grid items-center gap-2 rounded-xl border border-border/70 bg-muted/20 p-2 ${withColumn ? "sm:grid-cols-[1fr_1fr_1fr_8rem_auto]" : "sm:grid-cols-[1fr_1fr_1fr_auto]"}`}>
          <Input className="h-9 text-sm" placeholder="الاسم بالعربي *" value={r.label_ar} onChange={(e) => set(i, { label_ar: e.target.value })} />
          <Input dir="ltr" className="h-9 text-sm" placeholder="Label (EN)" value={r.label_en ?? ""} onChange={(e) => set(i, { label_en: e.target.value })} />
          <Input dir="ltr" className={`h-9 font-mono text-xs ${r.href && !isSafeHref(r.href.trim()) ? "border-destructive" : ""}`} placeholder="/about" value={r.href} onChange={(e) => set(i, { href: e.target.value })} />
          {withColumn && (
            <div className="flex overflow-hidden rounded-lg border border-border text-xs font-bold">
              {(["quick", "campaigns"] as const).map((c) => (
                <button key={c} type="button" onClick={() => set(i, { column: c })}
                  className={`flex-1 px-2 py-2 ${(r as FooterLink).column === c ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                  {c === "quick" ? "روابط سريعة" : "الحملات"}
                </button>
              ))}
            </div>
          )}
          <RowMoves i={i} n={rows.length} onMove={(a, b) => onChange(move(rows, a, b))} onRemove={() => onChange(rows.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" className="gap-1.5"
        onClick={() => onChange([...rows, withColumn ? { label_ar: "", href: "/", column: "quick" } : { label_ar: "", href: "/" }])}>
        <Plus className="h-4 w-4" /> إضافة رابط
      </Button>
    </Card>
  );
}

function Actions({ busy, onSave, onReset }: { busy: boolean; onSave: () => void; onReset?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
      {onReset && (
        <Button type="button" variant="ghost" className="gap-1.5 text-muted-foreground" disabled={busy} onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> رجّع النسخة الأصلية
        </Button>
      )}
      <Button type="button" className="gap-1.5" disabled={busy} onClick={onSave}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
      </Button>
    </div>
  );
}

/** The site's built-in menus (Navbar / Footer), offered as a starting point. */
const BUILT_IN_HEADER: NavLink[] = [
  { label_ar: "من نحن", label_en: "About", href: "/about" },
  { label_ar: "برامجنا", label_en: "Programs", href: "/programs" },
  { label_ar: "مشاريعنا", label_en: "Projects", href: "/projects" },
  { label_ar: "حملاتنا", label_en: "Campaigns", href: "/campaigns" },
  { label_ar: "المسبحة", label_en: "Tasbih", href: "/misbaha" },
  { label_ar: "الحالات", label_en: "Cases", href: "/cases" },
  { label_ar: "المدونة", label_en: "Blog", href: "/blog" },
  { label_ar: "تواصل معنا", label_en: "Contact", href: "/contact" },
];

const BUILT_IN_FOOTER: FooterLink[] = [
  ...([
    ["من نحن", "About", "/about"],
    ["جمعية خيرية بالمنصورة", "Charity in Mansoura", "/charity-mansoura"],
    ["اتبرع من أي محافظة", "Give from anywhere in Egypt", "/charity-egypt"],
    ["التبرع من خارج مصر", "Donate from abroad", "/donate-from-abroad"],
    ["زكاة الفطر", "Zakat al-Fitr", "/zakat-al-fitr"],
    ["برامجنا", "Programs", "/programs"],
    ["مشاريعنا", "Projects", "/projects"],
    ["الحالات الإنسانية", "Cases", "/cases"],
    ["الشفافية", "Transparency", "/trust"],
    ["إنجازاتنا", "Achievements", "/about#achievements"],
    ["معرض الصور", "Gallery", "/gallery"],
    ["المدونة", "Blog", "/blog"],
    ["الأسئلة الشائعة", "FAQs", "/faqs"],
    ["تتبع تبرعك", "Track donation", "/donate/track"],
    ["تواصل معنا", "Contact", "/contact"],
    ["تطوّع معنا", "Volunteer", "/volunteer"],
  ] as const).map(([ar, en, href]) => ({ label_ar: ar, label_en: en, href, column: "quick" as const })),
  ...([
    ["حملة ظِلّ", "Dhill (Water)", "/dhill"],
    ["حملة سِتْر", "Setr (Winter)", "/setr"],
    ["حملة مَرْكُون", "Markoun In-Kind", "/markoun"],
    ["مبادرة عربون خير", "Arboun Khair", "/arboun"],
    ["تكريم الإنسان", "Takrim (funeral service)", "/takrim"],
    ["سقيا الماء", "Clean water", "/water"],
    ["المساعدات الطبية", "Medical aid", "/medical"],
    ["صدقات العشر الأوائل", "The ten days", "/ten-days"],
    ["المسبحة الإلكترونية", "Digital tasbih", "/misbaha"],
    ["حضانات اليسر", "Nurseries & Qur'an houses", "/nurseries"],
    ["حملة أَثَر التعليمية", "Athar Education", "/athar"],
    ["موسم رمضان المبارك", "Ramadan Season", "/ramadan"],
    ["الغذاء الشهري", "Monthly Food", "/food-box"],
    ["صكوك الأضاحي", "Qurbani Shares", "/qurbani"],
  ] as const).map(([ar, en, href]) => ({ label_ar: ar, label_en: en, href, column: "campaigns" as const })),
];
