import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Calendar, Clock, ExternalLink, Eye, FileDown, FileJson,
  Image as ImageIcon, Loader2, Upload, Wand2, Save, CheckCircle2, AlertTriangle,
  Sparkles, Link2, Search, RotateCcw, History, Globe, Twitter, Facebook, ShieldCheck,
  Instagram, Music2, Undo2, Redo2, X,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { ArticleToolbar } from "@/components/admin/ArticleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequireAuth } from "@/auth/RequireAuth";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import {
  type DbBlogPost, dbToBlogPost,
  updatePost, updatePostStatus, updatePostMedia, deletePost,
  fetchAllRowsAdmin,
} from "@/data/blogApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { uploadBlogMedia, generateAndUploadOg } from "@/lib/blog-uploads";
import { auditPost, downloadJson, downloadPdf, downloadCsv } from "@/lib/seo-report";
import {
  scoreDraft, buildSuggestions, suggestRelated, countInternalLinks,
  type Suggestion, type RelatedSuggestion,
} from "@/lib/blog-optimize";
import { publicUrls } from "@/lib/publicUrls";

type EditState = {
  slug: string;
  category_ar: string; category_en: string;
  title_ar: string; title_en: string;
  excerpt_ar: string; excerpt_en: string;
  body_ar: string; body_en: string;
  tags_ar: string; tags_en: string;
  image_url: string;
  og_image_url: string;
  focus_keyword: string;
  scheduled_at: string;
};

/* Helper: Supabase may return JSONB arrays as string or actual array */
const toArray = (v: unknown): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p.map(String) : [v]; } catch { return [v]; }
  }
  return [];
};

const fromRow = (r: DbBlogPost): EditState => ({
  slug: r.slug || "",
  category_ar: r.category_ar || "", category_en: r.category_en || "",
  title_ar: r.title_ar || "", title_en: r.title_en || "",
  excerpt_ar: r.excerpt_ar || "", excerpt_en: r.excerpt_en || "",
  body_ar: toArray(r.body_ar).join("\n\n"),
  body_en: toArray(r.body_en).join("\n\n"),
  tags_ar: toArray(r.tags_ar).join(", "),
  tags_en: toArray(r.tags_en).join(", "),
  image_url: r.image_url || "",
  og_image_url: r.og_image_url || "",
  focus_keyword: r.focus_keyword || "",
  scheduled_at: r.scheduled_at ? r.scheduled_at.slice(0, 16) : "",
});

const draftKey = (slug: string) => `blog-edit-draft:${slug}`;

const ScoreRing = ({ value, tone }: { value: number; tone: string }) => {
  const r = 52, c = 2 * Math.PI * r;
  const off = c - (Math.min(100, value) / 100) * c;
  const textTone = tone.replace("stroke-", "text-");
  return (
    <div className="relative grid place-items-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} className="fill-none stroke-muted" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} className={`fill-none ${tone} transition-all duration-500`}
          strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className={`text-3xl font-black ${textTone}`}>{value}</div>
        <div className="-mt-1 text-[10px] font-bold text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
};

/* Field with label + counter (when min/max provided) */
const Field = ({
  label, hint, value, min, max, children,
}: { label: string; hint?: string; value?: string; min?: number; max?: number; children: React.ReactNode }) => {
  const len = (value || "").length;
  const inRange = min !== undefined && max !== undefined ? len >= min && len <= max : true;
  const showCount = min !== undefined && max !== undefined;
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
        <span>{label}{hint && <span className="ms-1 font-normal normal-case text-muted-foreground/70">— {hint}</span>}</span>
        {showCount && (
          <span className={`font-bold tabular-nums ${inRange ? "text-emerald-800" : "text-destructive"}`}>{len}/{max}</span>
        )}
      </span>
      {children}
    </label>
  );
};

/* Hook: probe image natural dimensions + load state */
const useImageDims = (url: string) => {
  const [state, setState] = useState<{ w: number; h: number; ok: boolean; loading: boolean }>(
    { w: 0, h: 0, ok: false, loading: !!url },
  );
  useEffect(() => {
    if (!url) { setState({ w: 0, h: 0, ok: false, loading: false }); return; }
    setState((s) => ({ ...s, loading: true }));
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => setState({ w: im.naturalWidth, h: im.naturalHeight, ok: true, loading: false });
    im.onerror = () => setState({ w: 0, h: 0, ok: false, loading: false });
    im.src = url;
    return () => { im.onload = null; im.onerror = null; };
  }, [url]);
  return state;
};

/* Compute OG/Twitter dimension status — Open Graph spec recommends 1200×630 (1.91:1) */
const ogStatus = (w: number, h: number) => {
  if (!w || !h) return { ok: false, level: "missing" as const, msg: "no image" };
  const ratio = w / h;
  const idealRatio = 1200 / 630; // 1.9047
  const ratioDelta = Math.abs(ratio - idealRatio) / idealRatio;
  const exact = w === 1200 && h === 630;
  const sizeOk = w >= 1080 && h >= 566 && w <= 4096 && h <= 4096;
  const ratioOk = ratioDelta <= 0.06;
  if (exact) return { ok: true, level: "perfect" as const, msg: "1200×630 perfect" };
  if (sizeOk && ratioOk) return { ok: true, level: "good" as const, msg: `${w}×${h} acceptable (≈1.91:1)` };
  if (!ratioOk) return { ok: false, level: "ratio" as const, msg: `${w}×${h} — ratio ${ratio.toFixed(2)}:1, expected 1.91:1` };
  return { ok: false, level: "size" as const, msg: `${w}×${h} — too small/large for 1200×630` };
};

/* Per-network ideal dimensions and fit check */
type NetSpec = { name: string; w: number; h: number; tol: number };
const NET_SPECS: Record<string, NetSpec> = {
  google:    { name: "Google",    w: 1200, h: 630,  tol: 0.10 },
  facebook:  { name: "Facebook",  w: 1200, h: 630,  tol: 0.06 },
  x:         { name: "X",         w: 1200, h: 600,  tol: 0.08 },
  instagram: { name: "Instagram", w: 1080, h: 1080, tol: 0.05 },
  tiktok:    { name: "TikTok",    w: 1080, h: 1920, tol: 0.05 },
};
const networkFit = (w: number, h: number, key: keyof typeof NET_SPECS) => {
  const s = NET_SPECS[key];
  if (!w || !h) return { ok: false, level: "missing" as const, label: `${s.w}×${s.h}` };
  const ratio = w / h;
  const target = s.w / s.h;
  const delta = Math.abs(ratio - target) / target;
  const sized = w >= s.w * 0.85 && h >= s.h * 0.85;
  if (delta <= s.tol && sized) return { ok: true, level: "ok" as const, label: `${w}×${h} ✓` };
  if (delta <= s.tol) return { ok: false, level: "small" as const, label: `${w}×${h} small` };
  return { ok: false, level: "ratio" as const, label: `${w}×${h} ≠ ${s.w}×${s.h}` };
};

/* Social preview: Google + Facebook + Twitter + Instagram + TikTok + dimension audit */
const SocialPreview = ({
  isRTL, title, description, image, coverFallback, slug,
}: { isRTL: boolean; title: string; description: string; image: string; coverFallback?: string; slug: string }) => {
  const url = `graceflow-quest.lovable.app/blog/${slug}`;
  const host = "graceflow-quest.lovable.app";
  const t = title || (isRTL ? "عنوان المقال" : "Post title");
  const d = description || (isRTL ? "الوصف القصير سيظهر هنا في نتائج البحث ومنشورات السوشيال ميديا." : "Short description preview here.");
  const [bust, setBust] = useState(0);
  const primary = image || "";
  const fb = coverFallback && coverFallback !== image ? coverFallback : "";
  const dimsPrimary = useImageDims(primary ? `${primary}${primary.includes("?") ? "&" : "?"}_b=${bust}` : "");
  const dimsFb = useImageDims(fb);
  // Use primary if it loaded; otherwise auto-fallback to cover image
  const usingFallback = !!primary && !dimsPrimary.loading && !dimsPrimary.ok && !!fb && dimsFb.ok;
  const img = usingFallback ? fb : primary;
  const dims = usingFallback ? dimsFb : dimsPrimary;
  const status = ogStatus(dims.w, dims.h);

  const fits = {
    google: networkFit(dims.w, dims.h, "google"),
    facebook: networkFit(dims.w, dims.h, "facebook"),
    x: networkFit(dims.w, dims.h, "x"),
    instagram: networkFit(dims.w, dims.h, "instagram"),
    tiktok: networkFit(dims.w, dims.h, "tiktok"),
  };
  const Badge = ({ k }: { k: keyof typeof fits }) => {
    const f = fits[k];
    if (!img) return null;
    const tone = f.ok ? "bg-secondary/15 text-emerald-800" : f.level === "small" ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive";
    return <span className={`ms-auto rounded px-1.5 py-0.5 text-[9px] font-bold ${tone}`}>{f.label}</span>;
  };

  const fallback = (cls: string) => (
    <div className={`grid place-items-center bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 ${cls}`}>
      <div className="px-3 text-center">
        <div className="line-clamp-2 text-[11px] font-extrabold text-primary" dir={isRTL ? "rtl" : "ltr"}>{t}</div>
        <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{host}</div>
      </div>
    </div>
  );
  const pic = (cls: string) => img
    ? (dims.ok || dims.loading
        ? <img src={img} alt="" className={`${cls} w-full bg-muted object-cover`} />
        : fallback(`${cls} w-full`))
    : fallback(`${cls} w-full`);

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-primary">
          <Globe className="h-4 w-4" /> {isRTL ? "معاينة محركات البحث والشبكات الاجتماعية" : "Search & Social previews"}
        </div>
        {/* Dimension audit badge */}
        <div className="flex items-center gap-1 text-[10px]">
          {usingFallback && (
            <span className="rounded bg-accent/15 px-2 py-0.5 font-bold text-accent">{isRTL ? "بديل: صورة الغلاف" : "Fallback: cover image"}</span>
          )}
          <button
            type="button"
            onClick={() => setBust(Date.now())}
            className="rounded border border-border bg-card px-2 py-0.5 font-bold text-muted-foreground hover:bg-muted"
            title={isRTL ? "اختبار سريع" : "Quick test"}
          >
            {isRTL ? "اختبار" : "Re-test"}
          </button>
          {!img && <span className="rounded bg-muted px-2 py-0.5 font-bold text-muted-foreground">{isRTL ? "لا توجد صورة OG — ولّد واحدة" : "No OG image — generate one"}</span>}
          {img && dims.loading && <span className="rounded bg-muted px-2 py-0.5 font-bold text-muted-foreground">{isRTL ? "فحص الأبعاد…" : "Checking…"}</span>}
          {img && !dims.loading && status.level === "perfect" && (
            <span className="rounded bg-secondary/15 px-2 py-0.5 font-bold text-emerald-800"><CheckCircle2 className="me-1 inline h-3 w-3" />{isRTL ? "أبعاد مثالية 1200×630" : "Ideal 1200×630"}</span>
          )}
          {img && !dims.loading && status.level === "good" && (
            <span className="rounded bg-secondary/15 px-2 py-0.5 font-bold text-emerald-800"><CheckCircle2 className="me-1 inline h-3 w-3" />{dims.w}×{dims.h} ✓</span>
          )}
          {img && !dims.loading && status.level === "ratio" && (
            <span className="rounded bg-destructive/15 px-2 py-0.5 font-bold text-destructive"><AlertTriangle className="me-1 inline h-3 w-3" />{isRTL ? `نسبة غير مناسبة ${dims.w}×${dims.h} — يفضل 1200×630` : `Bad ratio ${dims.w}×${dims.h} — use 1200×630`}</span>
          )}
          {img && !dims.loading && status.level === "size" && (
            <span className="rounded bg-accent/15 px-2 py-0.5 font-bold text-accent"><AlertTriangle className="me-1 inline h-3 w-3" />{dims.w}×{dims.h} — {isRTL ? "حجم غير موصى به" : "size not recommended"}</span>
          )}
          {primary && !dimsPrimary.loading && !dimsPrimary.ok && !usingFallback && (
            <span className="rounded bg-destructive/15 px-2 py-0.5 font-bold text-destructive"><AlertTriangle className="me-1 inline h-3 w-3" />{isRTL ? "تعذّر تحميل الصورة (CORS أو 404)" : "Image failed to load (CORS or 404)"}</span>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Google SERP */}
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><Search className="h-3 w-3" /> Google · 1200×630 <Badge k="google" /></div>
          <div className="mt-1.5 truncate text-[11px] text-emerald-800" dir="ltr">{url}</div>
          <div className="line-clamp-1 text-[15px] font-bold text-primary" dir={isRTL ? "rtl" : "ltr"}>{t}</div>
          <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>{d}</div>
        </div>
        {/* Facebook / LinkedIn OG */}
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex items-center gap-1 px-3 pt-2 text-[10px] font-bold text-muted-foreground"><Facebook className="h-3 w-3" /> Facebook / LinkedIn · 1200×630 <Badge k="facebook" /></div>
          <div className="mt-2 aspect-[1200/630] w-full">{pic("h-full")}</div>
          <div className="border-t border-border bg-muted/30 px-3 py-2">
            <div className="text-[9px] uppercase text-muted-foreground" dir="ltr">{host}</div>
            <div className="line-clamp-2 text-[11px] font-bold text-primary" dir={isRTL ? "rtl" : "ltr"}>{t}</div>
            <div className="line-clamp-1 text-[10px] text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>{d}</div>
          </div>
        </div>
        {/* Twitter / X */}
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex items-center gap-1 px-3 pt-2 text-[10px] font-bold text-muted-foreground"><Twitter className="h-3 w-3" /> X · 1200×600 (2:1) <Badge k="x" /></div>
          <div className="mt-2 aspect-[2/1] w-full">{pic("h-full")}</div>
          <div className="px-3 py-2">
            <div className="line-clamp-2 text-[11px] font-bold text-primary" dir={isRTL ? "rtl" : "ltr"}>{t}</div>
            <div className="line-clamp-1 text-[10px] text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>{d}</div>
            <div className="mt-1 text-[9px] uppercase text-muted-foreground" dir="ltr">{host}</div>
          </div>
        </div>
        {/* Instagram (1:1 feed) */}
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex items-center gap-1 px-3 pt-2 text-[10px] font-bold text-muted-foreground"><Instagram className="h-3 w-3" /> Instagram · 1080×1080 <Badge k="instagram" /></div>
          <div className="mt-2 aspect-square w-full">{pic("h-full")}</div>
          <div className="px-3 py-2">
            <div className="line-clamp-2 text-[11px] font-bold text-primary" dir={isRTL ? "rtl" : "ltr"}>{t}</div>
          </div>
        </div>
        {/* TikTok / Reels (9:16) */}
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex items-center gap-1 px-3 pt-2 text-[10px] font-bold text-muted-foreground"><Music2 className="h-3 w-3" /> TikTok / Reels · 1080×1920 <Badge k="tiktok" /></div>
          <div className="relative mt-2 mx-auto aspect-[9/16] w-32">
            {pic("h-full")}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="line-clamp-3 text-[10px] font-extrabold text-white" dir={isRTL ? "rtl" : "ltr"}>{t}</div>
            </div>
          </div>
        </div>
        {/* WhatsApp / Telegram link card (2:1 small) */}
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="px-3 pt-2 text-[10px] font-bold text-muted-foreground">WhatsApp / Telegram</div>
          <div className="flex gap-2 p-2">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded">{pic("h-full")}</div>
            <div className="min-w-0">
              <div className="line-clamp-2 text-[11px] font-bold text-primary" dir={isRTL ? "rtl" : "ltr"}>{t}</div>
              <div className="line-clamp-2 text-[10px] text-muted-foreground" dir={isRTL ? "rtl" : "ltr"}>{d}</div>
              <div className="text-[9px] text-muted-foreground" dir="ltr">{host}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tip when failing */}
      {img && !dims.loading && (status.level === "ratio" || status.level === "size") && (
        <p className="mt-2 rounded-md border border-accent/30 bg-accent/5 p-2 text-[11px] text-accent">
          {isRTL
            ? "نصيحة: استبدل الصورة بأخرى 1200×630 بكسل، أو اضغط «ولّد OG» لإنشاء صورة بالأبعاد الصحيحة تلقائيًا."
            : "Tip: replace with a 1200×630 image, or click “Generate OG” to create one with the correct dimensions."}
        </p>
      )}
    </div>
  );
};

const Inner = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const [row, setRow] = useState<DbBlogPost | null>(null);
  const [picker, setPicker] = useState<null | "cover" | "og">(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<EditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [pool, setPool] = useState<DbBlogPost[]>([]);
  const [previewSug, setPreviewSug] = useState<Suggestion | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<EditState[]>([]);
  const [future, setFuture] = useState<EditState[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const initialJson = useRef<string>("");
  const autosaveTimer = useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    const all = await fetchAllRowsAdmin();
    const r = all.find((item) => item.slug === slug || item.id === slug) || null;

    if (!r) { setLoading(false); return; }
    setRow(r);
    const fresh = fromRow(r);
    try {
      const cached = localStorage.getItem(draftKey(r.slug));
      if (cached) {
        const parsed = JSON.parse(cached) as { ts: number; data: EditState };
        const serverTs = new Date(r.updated_at).getTime();
        if (parsed.ts > serverTs) {
          setDraft(parsed.data);
          initialJson.current = JSON.stringify(fresh);
          setDirty(true);
          setLastSavedAt(new Date(parsed.ts));
          setLoading(false);
          toast({ title: isRTL ? "تم استرجاع مسودة محلية أحدث" : "Restored newer local draft" });
          return;
        }
      }
    } catch { /* ignore */ }
    setDraft(fresh);
    initialJson.current = JSON.stringify(fresh);
    setDirty(false);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  useEffect(() => {
    fetchAllRowsAdmin().then((rows) => setPool(rows.filter((r) => r.status === "published")));
  }, []);

  useEffect(() => {
    if (!draft || !row) return;
    const cur = JSON.stringify(draft);
    const isDirty = cur !== initialJson.current;
    setDirty(isDirty);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    if (isDirty) {
      autosaveTimer.current = window.setTimeout(() => {
        setAutoSaving(true);
        try {
          localStorage.setItem(draftKey(row.slug), JSON.stringify({ ts: Date.now(), data: draft }));
          setLastSavedAt(new Date());
        } catch { /* ignore */ }
        setAutoSaving(false);
      }, 1200);
    }
    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
  }, [draft, row]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const score = useMemo(() => draft ? scoreDraft(draft, isRTL) : null, [draft, isRTL]);
  const suggestions = useMemo<Suggestion[]>(() =>
    draft ? buildSuggestions(draft, isRTL) : [], [draft, isRTL]);
  const related = useMemo<RelatedSuggestion[]>(() =>
    draft ? suggestRelated(draft, pool, isRTL, 8) : [], [draft, pool, isRTL]);
  const internalLinks = useMemo(() => draft ? countInternalLinks(draft.body_ar) : 0, [draft]);

  const save = async (mode: "save" | "publish" | "schedule" | "unpublish") => {
    if (!row || !draft) return;
    setSaving(true);
    try {
      // PATCH /blog-seo/{id} (or POST /blog-seo the first time an older / built-in article is saved)
      const savedId = await updatePost(row.id, {
        slug: draft.slug.toLowerCase().replace(/\s+/g, "-"),
        category_ar: draft.category_ar, category_en: draft.category_en || draft.category_ar,
        focus_keyword: draft.focus_keyword || null,
        title_ar: draft.title_ar, title_en: draft.title_en || draft.title_ar,
        excerpt_ar: draft.excerpt_ar, excerpt_en: draft.excerpt_en || draft.excerpt_ar,
        body_ar: draft.body_ar.split(/\n\s*\n/).filter(Boolean),
        body_en: (draft.body_en || draft.body_ar).split(/\n\s*\n/).filter(Boolean),
        tags_ar: draft.tags_ar.split(",").map((s) => s.trim()).filter(Boolean),
        tags_en: (draft.tags_en || draft.tags_ar).split(",").map((s) => s.trim()).filter(Boolean),
        image_url: draft.image_url || null,
        og_image_url: draft.og_image_url || null,
        seo_score: score?.score ?? 0,
      });
      if (mode === "publish") await updatePostStatus(savedId, "published");
      if (mode === "unpublish") await updatePostStatus(savedId, "draft");
      if (mode === "schedule") {
        if (!draft.scheduled_at) { toast({ title: isRTL ? "اختر موعد النشر" : "Pick a schedule time", variant: "destructive" }); setSaving(false); return; }
        await updatePostStatus(savedId, "scheduled", new Date(draft.scheduled_at).toISOString());
      }
      try { localStorage.removeItem(draftKey(row.slug)); } catch {}
      toast({ title: isRTL ? "تم الحفظ" : "Saved" });
      const newSlug = draft.slug.toLowerCase().replace(/\s+/g, "-");
      if (newSlug && newSlug !== row.slug) { nav(`/admin/blog-seo/${newSlug}`, { replace: true }); return; }
      await load();
    } catch (e: unknown) {
      toast({ title: isRTL ? "فشل الحفظ على الخادم" : "Save failed", description: apiErrorMessage(e), variant: "destructive" });
    } finally { setSaving(false); }
  };

  const removePost = async () => {
    if (!row) return;
    const builtIn = row.id.startsWith("static-");
    if (!confirm(builtIn
      ? (isRTL ? "المقال ده جزء من كود الموقع، فهيتأرشف: هيختفي من المدونة والسايت ماب، وتقدر ترجّعه بالنشر تاني. نكمّل؟" : "This article ships with the site, so it will be archived (hidden from the blog and sitemap). Continue?")
      : (isRTL ? "حذف هذا المقال نهائيًا من قاعدة البيانات؟" : "Delete this article permanently?"))) return;
    setSaving(true);
    try {
      const result = await deletePost(row.id);
      try { localStorage.removeItem(draftKey(row.slug)); } catch { /* local draft cleanup only */ }
      toast({ title: result === "archived" ? (isRTL ? "اتأرشف المقال واختفى من الموقع" : "Article archived") : (isRTL ? "تم حذف المقال" : "Article deleted") });
      nav("/admin/blog-seo");
    } catch (e: unknown) {
      toast({ title: isRTL ? "فشل الحذف" : "Delete failed", description: apiErrorMessage(e), variant: "destructive" });
    } finally { setSaving(false); }
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !draft) return;
    setUploading(true);
    try {
      const url = await uploadBlogMedia(f, f.name);
      setDraft({ ...draft, image_url: url });
      toast({ title: isRTL ? " تم رفع الصورة" : " Image uploaded" });
    } catch (e: any) {
      toast({ title: isRTL ? "فشل الرفع" : "Upload failed", description: e.message, variant: "destructive" });
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const regenerateOg = async () => {
    if (!row || !draft || !draft.title_ar) return;
    try {
      const og = await generateAndUploadOg({ slug: draft.slug, title: draft.title_ar, category: draft.category_ar });
      pushHistory();
      setDraft({ ...draft, og_image_url: og });
      await updatePostMedia(row.id, { og_image_url: og, image_url: row.image_url || og });
      // End-to-end re-check: probe dimensions of the freshly generated OG
      const dims = await new Promise<{ w: number; h: number; ok: boolean }>((resolve) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight, ok: true });
        im.onerror = () => resolve({ w: 0, h: 0, ok: false });
        im.src = `${og}${og.includes("?") ? "&" : "?"}t=${Date.now()}`;
      });
      const st = ogStatus(dims.w, dims.h);
      if (!dims.ok) {
        toast({ title: isRTL ? " تعذّر التحقق من صورة OG" : " Could not verify OG image", variant: "destructive" });
      } else if (st.level === "perfect") {
        toast({ title: isRTL ? " تم توليد OG — 1200×630" : " OG generated — 1200×630" });
      } else {
        toast({ title: isRTL ? ` OG بأبعاد ${dims.w}×${dims.h}` : `⚠️ OG is ${dims.w}×${dims.h}`,
          description: isRTL ? "يفضّل 1200×630 — تم تحديث المعاينة. أعد التوليد إذا لزم." : "Recommended 1200×630 — preview updated. Regenerate if needed.",
          variant: "destructive",
        });
      }
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const pushHistory = useCallback(() => {
    setDraft((d) => {
      if (d) setHistory((h) => [...h.slice(-19), d]);
      return d;
    });
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setDraft((cur) => { if (cur) setFuture((f) => [...f, cur]); return prev; });
      toast({ title: isRTL ? "تم التراجع" : "Undone" });
      return h.slice(0, -1);
    });
  }, [isRTL]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[f.length - 1];
      setDraft((cur) => { if (cur) setHistory((h) => [...h, cur]); return next; });
      toast({ title: isRTL ? "تمت الإعادة" : "Redone" });
      return f.slice(0, -1);
    });
  }, [isRTL]);

  // Ctrl/Cmd + Z / Y / Shift+Z keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === "y") || (k === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const applySuggestion = useCallback((s: Suggestion) => {
    pushHistory();
    setDraft((d) => d ? { ...d, [s.field]: s.after } as EditState : d);
    setPreviewSug(null);
    toast({ title: isRTL ? "تم تطبيق الاقتراح" : "Suggestion applied" });
  }, [isRTL, pushHistory]);

  const applyMany = (idxs: number[]) => {
    pushHistory();
    setDraft((d) => {
      if (!d) return d;
      let next = { ...d };
      // Apply field-by-field; if multiple suggestions on same field, last wins by index order
      for (const i of idxs) {
        const s = suggestions[i];
        if (s) next = { ...next, [s.field]: s.after } as EditState;
      }
      return next;
    });
    setAccepted(new Set());
    setReviewMode(false);
    setPreviewSug(null);
    toast({ title: isRTL ? `تم تطبيق ${idxs.length} تغيير` : `Applied ${idxs.length} changes` });
  };

  const insertRelatedLink = (slug: string, title: string) => {
    pushHistory();
    setDraft((d) => {
      if (!d) return d;
      const link = isRTL
        ? `\n\nاقرأ أيضًا: [${title}](/blog/${slug})`
        : `\n\nRead also: [${title}](/blog/${slug})`;
      return { ...d, body_ar: d.body_ar.trimEnd() + link };
    });
    toast({ title: isRTL ? "تمت إضافة الرابط الداخلي بنجاح" : "Internal link added" });
  };

  const removeRelatedLink = (slug: string) => {
    pushHistory();
    setDraft((d) => {
      if (!d) return d;
      const lines = d.body_ar.split(/\r?\n/).filter((l) => !l.includes(`/blog/${slug}`));
      return { ...d, body_ar: lines.join("\n").trim() };
    });
    toast({ title: isRTL ? "تمت إزالة الارتباط الداخلي بنجاح" : "Internal link removed" });
  };

  const discardLocal = () => {
    if (!row) return;
    try { localStorage.removeItem(draftKey(row.slug)); } catch {}
    load();
  };

  if (loading) return <AdminLayout><div className="p-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div></AdminLayout>;
  if (!row || !draft) return (
    <AdminLayout>
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="font-bold text-muted-foreground">{isRTL ? "المقال غير موجود" : "Article not found"}</p>
        <Link to="/admin/blog-seo" className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> {isRTL ? "عودة لقائمة المقالات" : "Back to articles"}
        </Link>
      </div>
    </AdminLayout>
  );

  const sc = score!;
  const ringTone = sc.score >= 85 ? "stroke-secondary" : sc.score >= 60 ? "stroke-accent" : "stroke-destructive";
  const previewHref = publicUrls.blog(draft.slug, row.status !== "published");
  const auditedPost = dbToBlogPost({
    ...row,
    slug: draft.slug || row.slug,
    category_ar: draft.category_ar || row.category_ar || "",
    category_en: draft.category_en || draft.category_ar || row.category_en || "",
    title_ar: draft.title_ar || row.title_ar || "",
    title_en: draft.title_en || draft.title_ar || row.title_en || "",
    excerpt_ar: draft.excerpt_ar || row.excerpt_ar || "",
    excerpt_en: draft.excerpt_en || draft.excerpt_ar || row.excerpt_en || "",
    body_ar: (draft.body_ar || "").split(/\n\s*\n/).filter(Boolean),
    body_en: (draft.body_en || draft.body_ar || "").split(/\n\s*\n/).filter(Boolean),
    tags_ar: (draft.tags_ar || "").split(",").map((s) => s.trim()).filter(Boolean),
    tags_en: (draft.tags_en || draft.tags_ar || "").split(",").map((s) => s.trim()).filter(Boolean),
    image_url: draft.image_url || row.image_url,
  });

  const fkQuery = encodeURIComponent(draft.focus_keyword || draft.title_ar || draft.category_ar);

  return (
    <AdminLayout>
      <div dir={isRTL ? "rtl" : "ltr"} className="space-y-3 px-1 sm:px-0">
        {/* ── Top toolbar ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button onClick={() => nav("/admin/blog-seo")} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs font-bold hover:bg-muted">
              <ArrowLeft className="h-3.5 w-3.5" /> {isRTL ? "رجوع" : "Back"}
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black text-primary sm:text-base">{draft.title_ar || draft.slug}</h1>
              <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]" dir="ltr">
                /{draft.slug} · {row.status}
                {dirty && <span className="mx-1 rounded bg-accent/15 px-1.5 py-0.5 font-bold text-accent">{isRTL ? "غير محفوظ" : "unsaved"}</span>}
                {autoSaving && <span className="mx-1">{isRTL ? "حفظ تلقائي…" : "autosaving…"}</span>}
                {!autoSaving && lastSavedAt && <span className="mx-1">· {isRTL ? "محفوظ" : "local"} {lastSavedAt.toLocaleTimeString()}</span>}
              </p>
            </div>
          </div>
          {/* Action buttons — scroll horizontally on very small screens */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <Link to={previewHref} target="_blank" className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-muted/50 px-2 text-xs font-bold hover:bg-muted">
              <Eye className="h-3.5 w-3.5" /> {isRTL ? "معاينة" : "Preview"}
            </Link>
            <Link to={publicUrls.blog(draft.slug)} target="_blank" className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-muted/50 px-2 text-xs font-bold hover:bg-muted">
              <ExternalLink className="h-3.5 w-3.5" /> {isRTL ? "افتح" : "Live"}
            </Link>
            <Button size="sm" variant="outline" onClick={() => downloadPdf(auditPost(auditedPost))}><FileDown className="h-3.5 w-3.5" /><span className="hidden sm:inline"> PDF</span></Button>
            <Button size="sm" variant="outline" onClick={() => downloadJson(auditPost(auditedPost))}><FileJson className="h-3.5 w-3.5" /><span className="hidden sm:inline"> JSON</span></Button>
            <Button size="sm" variant="outline" onClick={() => downloadCsv(auditPost(auditedPost))}><FileDown className="h-3.5 w-3.5" /><span className="hidden sm:inline"> CSV</span></Button>
            {dirty && (
              <Button size="sm" variant="outline" onClick={discardLocal}>
                <RotateCcw className="h-3.5 w-3.5" /><span className="hidden sm:inline"> {isRTL ? "تجاهل" : "Discard"}</span>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={undo} disabled={history.length === 0}>
              <Undo2 className="h-3.5 w-3.5" /><span className="hidden sm:inline"> {isRTL ? "تراجع" : "Undo"}</span>
              {history.length > 0 && <span className="ms-1 text-[9px] text-muted-foreground">{history.length}</span>}
            </Button>
            <Button size="sm" variant="outline" onClick={redo} disabled={future.length === 0}>
              <Redo2 className="h-3.5 w-3.5" /><span className="hidden sm:inline"> {isRTL ? "إعادة" : "Redo"}</span>
            </Button>
            <Button size="sm" onClick={() => save("save")} disabled={saving} className="bg-orange-grad font-extrabold text-accent-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isRTL ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>

        {/* ── Main content grid: single col on mobile, sidebar on lg ── */}
        <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
          <div className="grid gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Slug" hint={isRTL ? "رابط ثابت" : "URL path"}>
                <Input dir="ltr" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
              </Field>
              <Field label={isRTL ? "الكلمة المفتاحية" : "Focus keyword"} hint={isRTL ? "الموضوع الأساسي" : "primary topic"}>
                <Input value={draft.focus_keyword} onChange={(e) => setDraft({ ...draft, focus_keyword: e.target.value })} />
              </Field>
              <Field label={isRTL ? "التصنيف (عربي)" : "Category (AR)"}>
                <Input value={draft.category_ar} onChange={(e) => setDraft({ ...draft, category_ar: e.target.value })} />
              </Field>
              <Field label="Category (EN)">
                <Input dir="ltr" value={draft.category_en} onChange={(e) => setDraft({ ...draft, category_en: e.target.value })} />
              </Field>
              <Field label={isRTL ? "العنوان (عربي)" : "Title (AR)"} value={draft.title_ar} min={30} max={70}>
                <Input value={draft.title_ar} onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })} />
              </Field>
              <Field label="Title (EN)" value={draft.title_en} min={30} max={70}>
                <Input dir="ltr" value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} />
              </Field>
            </div>
            <Field label={isRTL ? "الوصف القصير (عربي)" : "Excerpt (AR)"} hint={isRTL ? "يظهر في نتائج البحث" : "shows in SERPs"} value={draft.excerpt_ar} min={80} max={170}>
              <textarea className="min-h-[60px] w-full rounded-md border border-input bg-background p-3 text-sm" value={draft.excerpt_ar} onChange={(e) => setDraft({ ...draft, excerpt_ar: e.target.value })} />
            </Field>
            <Field label="Excerpt (EN)" value={draft.excerpt_en} min={80} max={170}>
              <textarea dir="ltr" className="min-h-[60px] w-full rounded-md border border-input bg-background p-3 text-sm" value={draft.excerpt_en} onChange={(e) => setDraft({ ...draft, excerpt_en: e.target.value })} />
            </Field>
            <Field label={isRTL ? "نص المقال (عربي)" : "Body (AR)"} hint={isRTL ? "افصل الفقرات بسطر فارغ — اهدف ≥600 كلمة" : "blank line between paragraphs — aim ≥600 words"}>
              <ArticleToolbar
                textareaRef={bodyRef}
                value={draft.body_ar}
                onChange={(v) => setDraft({ ...draft, body_ar: v })}
                slug={draft.slug}
                focus={draft.focus_keyword}
              />
              <textarea ref={bodyRef} dir="rtl" className="min-h-[420px] w-full rounded-b-md rounded-t-none border border-t-0 border-input bg-background p-3 text-[14.5px] leading-8" value={draft.body_ar} onChange={(e) => setDraft({ ...draft, body_ar: e.target.value })} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {(() => { const w = draft.body_ar.split(/\s+/).filter(Boolean).length; return `${w} كلمة · ${Math.max(1, Math.round(w / 180))} دقيقة قراءة`; })()}
              </p>
            </Field>
            <Field label="Body (EN)">
              <textarea dir="ltr" className="min-h-[160px] w-full rounded-md border border-input bg-background p-3 text-sm" value={draft.body_en} onChange={(e) => setDraft({ ...draft, body_en: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={isRTL ? "وسوم AR" : "Tags (AR)"} hint={isRTL ? "مفصولة بفاصلة — 3+" : "comma separated — 3+"}>
                <Input value={draft.tags_ar} onChange={(e) => setDraft({ ...draft, tags_ar: e.target.value })} />
              </Field>
              <Field label="Tags (EN)" hint="comma separated">
                <Input dir="ltr" value={draft.tags_en} onChange={(e) => setDraft({ ...draft, tags_en: e.target.value })} />
              </Field>
            </div>

            {/* Live social previews */}
            <SocialPreview
              isRTL={isRTL}
              title={draft.title_ar}
              description={draft.excerpt_ar}
              image={draft.og_image_url || draft.image_url}
              coverFallback={draft.image_url}
              slug={draft.slug}
            />

            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{isRTL ? "صورة الغلاف" : "Cover image"}</label>
                <div className="flex gap-1">
                  <a href={`https://unsplash.com/s/photos/${fkQuery}`} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[10px] font-bold hover:bg-muted">
                    <Search className="h-3 w-3" /> Unsplash
                  </a>
                  <a href={`https://www.pexels.com/search/${fkQuery}/`} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[10px] font-bold hover:bg-muted">
                    <Search className="h-3 w-3" /> Pexels
                  </a>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {draft.image_url
                  ? <img src={draft.image_url} alt="" className="h-16 w-28 rounded-lg object-cover" />
                  : <div className="grid h-16 w-28 place-items-center rounded-lg bg-muted text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
                <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {isRTL ? "رفع صورة" : "Upload"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setPicker("cover")}>
                  <ImageIcon className="h-3.5 w-3.5" /> {isRTL ? "من المكتبة" : "From library"}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
                <Input className="min-w-[200px] flex-1" placeholder={isRTL ? "أو ألصق رابط صورة خارجية" : "Or paste external image URL"} value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
                <Button type="button" size="sm" variant="outline" onClick={regenerateOg}><Wand2 className="h-3.5 w-3.5" /> {isRTL ? "ولّد OG" : "Generate OG"}</Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                <span className="text-[11px] font-extrabold text-muted-foreground">{isRTL ? "صورة المشاركة (OG) 1200×630:" : "Share image (OG):"}</span>
                {draft.og_image_url
                  ? <img src={draft.og_image_url} alt="" className="h-10 w-[76px] rounded-md object-cover" />
                  : <span className="text-[11px] text-muted-foreground">{isRTL ? "مش موجودة — هتستخدم صورة الغلاف" : "none — the cover is used"}</span>}
                <Button type="button" size="sm" variant="outline" onClick={() => setPicker("og")}>
                  <ImageIcon className="h-3.5 w-3.5" /> {isRTL ? "اختار من المكتبة" : "From library"}
                </Button>
                {draft.og_image_url && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setDraft({ ...draft, og_image_url: "" })}>{isRTL ? "شيلها" : "Remove"}</Button>
                )}
              </div>
              <MediaPickerModal
                open={picker !== null}
                onOpenChange={(v) => !v && setPicker(null)}
                currentValue={picker === "og" ? draft.og_image_url : draft.image_url}
                title={picker === "og" ? (isRTL ? "صورة المشاركة من المكتبة" : "Share image from the library") : (isRTL ? "صورة الغلاف من المكتبة" : "Cover from the library")}
                onSelect={(url) => setDraft((d) => (d ? (picker === "og" ? { ...d, og_image_url: url } : { ...d, image_url: url }) : d))}
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{isRTL ? "جدولة النشر" : "Schedule publish"}</label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input type="datetime-local" value={draft.scheduled_at} onChange={(e) => setDraft({ ...draft, scheduled_at: e.target.value })} className="max-w-[260px]" />
                <Button size="sm" variant="secondary" onClick={() => save("schedule")} disabled={saving || !draft.scheduled_at}>
                  <Calendar className="h-4 w-4" /> {isRTL ? "حفظ + جدولة" : "Save + schedule"}
                </Button>
              </div>
            </div>

            {/* Auto-optimize */}
            <div className="rounded-xl border border-accent/40 bg-accent/5 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-accent">
                  <Sparkles className="h-4 w-4" /> {isRTL ? "تحسين تلقائي ذكي" : "Auto-optimize"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{suggestions.length} {isRTL ? "اقتراح" : "suggestions"}</span>
                  {suggestions.length > 0 && (
                    <Button size="sm" variant={reviewMode ? "default" : "outline"} className={`h-6 px-2 text-[10px] ${reviewMode ? "bg-orange-grad text-accent-foreground" : ""}`}
                      onClick={() => { setReviewMode((v) => !v); setAccepted(new Set(suggestions.map((_, i) => i))); }}>
                      <ShieldCheck className="h-3 w-3" /> {isRTL ? "وضع المراجعة الآمن" : "Safe review"}
                    </Button>
                  )}
                </div>
              </div>
              {suggestions.length === 0 ? (
                <p className="mt-2 text-[11px] text-emerald-800">{isRTL ? "✓ لا اقتراحات — كل المعايير ضمن المدى المثالي." : "✓ No suggestions — all in ideal range."}</p>
              ) : (
                <>
                  {reviewMode && (
                    <>
                    {(() => {
                      // Conflict detection: same field selected more than once
                      const byField = new Map<string, number[]>();
                      Array.from(accepted).forEach((i) => {
                        const f = suggestions[i]?.field;
                        if (!f) return;
                        byField.set(f, [...(byField.get(f) || []), i]);
                      });
                      const conflicts = Array.from(byField.entries()).filter(([, v]) => v.length > 1);
                      if (conflicts.length === 0) return null;
                      return (
                        <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[10px] text-destructive">
                          <div className="flex items-center gap-1 font-extrabold">
                            <AlertTriangle className="h-3 w-3" />
                            {isRTL ? "تعارض: اقتراحات متعددة تعدّل نفس الحقل" : "Conflict: multiple suggestions modify the same field"}
                          </div>
                          <ul className="mt-0.5 list-disc ps-4">
                            {conflicts.map(([f, ids]) => (
                              <li key={f}>
                                <b>{f === "title_ar" ? (isRTL ? "العنوان" : "Title") : f === "excerpt_ar" ? (isRTL ? "الوصف" : "Excerpt") : (isRTL ? "النص" : "Body")}</b>
                                {" — "}
                                {isRTL ? `${ids.length} اقتراحات — سيُطبَّق الأخير فقط.` : `${ids.length} suggestions — only the last will apply.`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                    <div className="mt-2 flex items-center justify-between rounded-md border border-accent/30 bg-accent/10 px-2 py-1.5 text-[10px]">
                      <span className="font-bold text-accent">{isRTL ? "اختر التغييرات قبل الاعتماد — لا شيء يُكتب إلا بعد موافقتك." : "Pick changes before applying — nothing is written until you confirm."}</span>
                      <div className="flex gap-1">
                        <button className="rounded border border-border px-1.5 py-0.5 hover:bg-muted" onClick={() => setAccepted(new Set(suggestions.map((_, i) => i)))}>{isRTL ? "اختر الكل" : "All"}</button>
                        <button className="rounded border border-border px-1.5 py-0.5 hover:bg-muted" onClick={() => setAccepted(new Set())}>{isRTL ? "مسح" : "None"}</button>
                        <button disabled={accepted.size === 0} className="rounded bg-orange-grad px-2 py-0.5 font-extrabold text-accent-foreground disabled:opacity-50"
                          onClick={() => applyMany(Array.from(accepted).sort((a, b) => a - b))}>
                          {isRTL ? `اعتمد المحدد (${accepted.size})` : `Apply selected (${accepted.size})`}
                        </button>
                      </div>
                    </div>
                    </>
                  )}
                  <ul className="mt-2 space-y-2">
                    {suggestions.map((s, i) => {
                      const checked = accepted.has(i);
                      const showDiff = reviewMode || previewSug === s;
                      return (
                        <li key={i} className={`rounded-lg border bg-card p-2 ${reviewMode && checked ? "border-secondary/50" : "border-border"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-[11px] font-bold">
                              {reviewMode && (
                                <input type="checkbox" checked={checked}
                                  onChange={(e) => setAccepted((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(i); else next.delete(i);
                                    return next;
                                  })} />
                              )}
                              {s.field === "title_ar" ? (isRTL ? "العنوان" : "Title") : s.field === "excerpt_ar" ? (isRTL ? "الوصف" : "Excerpt") : (isRTL ? "النص" : "Body")}
                            </span>
                            {!reviewMode && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => setPreviewSug(previewSug === s ? null : s)}>{isRTL ? "Diff" : "Diff"}</Button>
                                <Button size="sm" className="h-6 bg-orange-grad px-2 text-[10px] text-accent-foreground" onClick={() => applySuggestion(s)}>{isRTL ? "تطبيق" : "Apply"}</Button>
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">{s.reason}</p>
                          {showDiff && (
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                                <div className="text-[9px] font-bold uppercase text-destructive">− {isRTL ? "قبل" : "Before"}</div>
                                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap text-[10px]">{s.before || "—"}</pre>
                              </div>
                              <div className="rounded-md border border-secondary/30 bg-secondary/5 p-2">
                                <div className="text-[9px] font-bold uppercase text-emerald-800">+ {isRTL ? "بعد" : "After"}</div>
                                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap text-[10px]">{s.after}</pre>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            {/* Internal links */}
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-primary">
                  <Link2 className="h-4 w-4" /> {isRTL ? "تدقيق الروابط الداخلية" : "Internal links audit"}
                </div>
                <span className={`text-[10px] font-bold ${internalLinks >= 2 ? "text-emerald-800" : "text-destructive"}`}>
                  {internalLinks} {isRTL ? "رابط" : "links"} · {isRTL ? "الهدف ≥2" : "target ≥2"}
                </span>
              </div>
              {related.length === 0 ? (
                <p className="mt-2 text-[11px] text-muted-foreground">{isRTL ? "لا توجد مقالات منشورة لاقتراحها بعد." : "No published posts to suggest yet."}</p>
              ) : (
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {related.map((r) => (
                    <li key={r.slug} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2 py-1.5">
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-bold">{r.title}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{r.reason}</div>
                      </div>
                      {r.alreadyLinked ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="rounded bg-secondary/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 inline-flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                            {isRTL ? "مرتبط" : "linked"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRelatedLink(r.slug)}
                            title={isRTL ? "إزالة هذا الرابط من المقال" : "Remove link from post"}
                            className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-6 shrink-0 px-2 text-[10px]" onClick={() => insertRelatedLink(r.slug, r.title)}>+ {isRTL ? "أضف" : "Add"}</Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{isRTL ? "نقاط السيو الحية" : "Live SEO score"}</div>
            <div className="mt-2 flex items-center justify-center"><ScoreRing value={sc.score} tone={ringTone} /></div>
            <div className="mt-1 text-center text-[10px] text-muted-foreground">
              {sc.score >= 100 ? (isRTL ? "ممتاز — مهيّأ بالكامل" : "Perfect — fully optimized")
                : `${100 - sc.score} ${isRTL ? "نقطة متبقية للوصول 100/100" : "pts left to 100/100"}`}
            </div>
            <ul className="mt-3 space-y-1.5 text-[12px] text-foreground">
              {sc.checks.map((c) => {
                const pct = c.weight ? Math.round((c.earned / c.weight) * 100) : 0;
                return (
                  <li key={c.key} className="rounded-md border border-border bg-muted/20 p-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`flex items-center gap-1 font-bold ${c.ok ? "text-emerald-800" : "text-destructive"}`}>
                        {c.ok ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{c.label}</span>
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{c.earned}/{c.weight}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded bg-muted">
                      <div className={`h-full ${c.ok ? "bg-secondary" : c.earned > 0 ? "bg-accent" : "bg-destructive/40"}`} style={{ width: `${pct}%` }} />
                    </div>
                    {!c.ok && <p className="mt-1 text-[10px] text-muted-foreground">{c.hint}</p>}
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex flex-col gap-2">
              {row.status !== "published" && (
                <Button onClick={() => save("publish")} disabled={saving} className="bg-orange-grad font-extrabold text-accent-foreground">
                  <CheckCircle2 className="h-4 w-4" /> {isRTL ? "حفظ + نشر" : "Save + publish"}
                </Button>
              )}
              {row.status === "published" && (
                <Button variant="outline" onClick={() => save("unpublish")} disabled={saving}>
                  {isRTL ? "حول لمسودّة" : "Unpublish"}
                </Button>
              )}
              {row.id.startsWith("laravel-") && (
                <Button variant="outline" onClick={removePost} disabled={saving} className="border-destructive/40 text-destructive hover:bg-destructive/10">
                  {isRTL ? "حذف المقال" : "Delete article"}
                </Button>
              )}
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <History className="h-3 w-3" /> {isRTL ? "آخر تحديث:" : "Updated:"} {new Date(row.updated_at).toLocaleString()}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
};

const AdminBlogPostEdit = () => (
  <RequireAuth roles={["admin", "editor"]}>
    <Inner />
  </RequireAuth>
);

export default AdminBlogPostEdit;
