import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLang } from "@/i18n/LangContext";
import { ChoiceSelect } from "@/components/admin/programs/FormKit";
import { describeWriteError, isEndpointMissing, BACKEND_PENDING_AR } from "@/data/api/backendPending";
import {
  listMediaFull,
  uploadMedia,
  deleteMedia,
  usageLabelAr,
  MEDIA_COLLECTIONS,
  MEDIA_COLLECTION_LABELS_AR,
  MEDIA_FOLDER_LABELS_AR,
  MEDIA_ACCEPT,
  MEDIA_MAX_BYTES,
  type MediaCollection,
  type MediaFile,
} from "@/data/api/mediaApi";
import {
  Search, Upload, Loader2, Check, Copy, Image as ImageIcon, RefreshCw, Trash2, ExternalLink,
  CheckSquare, Square, Layers, Link2, ShieldCheck, HardDrive, Images,
} from "lucide-react";

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

type Usage = "" | "used" | "unused" | "duplicates";

/**
 * Media library = every image stored on the site, and where each one is used.
 * - Upload once: an identical picture is never stored twice (the existing file is returned).
 * - Clean safely: unused files and identical copies can be moved to the trash (restorable on the
 *   server); a file the site still uses is never removed.
 * The public photo gallery (/admin/gallery) is separate: it is the curated list shown on the site,
 * and its photos can be picked from this library.
 */
export default function AdminMediaLibrary() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [hasUsage, setHasUsage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingBackend, setPendingBackend] = useState(false);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");
  const [usage, setUsage] = useState<Usage>("");
  const [uploadTo, setUploadTo] = useState<MediaCollection>("general");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMediaFull({ scope: "all" });
      setFiles(res.files);
      setFolders(res.folders.length ? res.folders : Array.from(new Set(res.files.map((f) => f.folder || `media/${f.collection}`))).sort());
      setHasUsage(res.hasUsage);
      setPendingBackend(false);
      setSelected(new Set());
    } catch (err) {
      if (isEndpointMissing(err)) setPendingBackend(true);
      else toast.error(describeWriteError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const unused = files.filter((f) => f.in_use === false);
    const dups = files.filter((f) => f.duplicate_of);
    const sum = (l: MediaFile[]) => l.reduce((s, f) => s + (Number(f.size) || 0), 0);
    return { total: files.length, size: sum(files), used: files.filter((f) => f.in_use).length, unused: unused.length, unusedSize: sum(unused), dups: dups.length, dupSize: sum(dups) };
  }, [files]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      if (folder && (f.folder || `media/${f.collection}`) !== folder) return false;
      if (usage === "used" && !f.in_use) return false;
      if (usage === "unused" && f.in_use !== false) return false;
      if (usage === "duplicates" && !f.duplicate_of) return false;
      return !q || f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
    });
  }, [files, search, folder, usage]);

  /** Only files the server would remove: unused (a used copy is never selectable). */
  const removable = (f: MediaFile) => hasUsage && f.in_use === false;
  const selectable = filtered.filter(removable);
  const allSelected = selectable.length > 0 && selectable.every((f) => selected.has(f.path));
  const toggle = (path: string) => setSelected((s) => { const n = new Set(s); if (n.has(path)) n.delete(path); else n.add(path); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectable.map((f) => f.path)));

  const handleUpload = async (list: FileList) => {
    const picked = Array.from(list);
    const bad = picked.find((f) => !MEDIA_ACCEPT.includes(f.type) || f.size > MEDIA_MAX_BYTES);
    if (bad) {
      toast.error(isAr ? `«${bad.name}»: الصيغ المسموحة JPG و PNG و WebP و GIF و AVIF، والحد الأقصى 5 ميجابايت` : `"${bad.name}": JPG, PNG, WebP, GIF, AVIF up to 5 MB`);
      return;
    }
    setUploading(true);
    let added = 0;
    let reused = 0;
    try {
      for (const f of picked) {
        const saved = await uploadMedia(f, f.name, uploadTo);
        if (saved.duplicate) reused++;
        else added++;
      }
      const parts = [
        added ? (isAr ? `اترفع ${added} صورة جديدة` : `${added} uploaded`) : "",
        reused ? (isAr ? `${reused} كانت موجودة قبل كده فاستخدمنا نفس النسخة` : `${reused} already existed (reused)`) : "",
      ].filter(Boolean);
      toast.success(parts.join(isAr ? " — " : " · "));
    } catch (err) {
      toast.error(describeWriteError(err, "POST /media"));
    } finally {
      setUploading(false);
      if (added + reused) await load();
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success(isAr ? "تم نسخ الرابط ✓" : "URL copied ✓");
  };

  const remove = async (paths: string[]) => {
    if (!paths.length) return;
    const msg = isAr
      ? `نقل ${paths.length} صورة لسلة المحذوفات على السيرفر؟\nالصور دي مش مستخدمة في أي مكان في الموقع، وتقدر ترجعها من السلة لو احتجتها.`
      : `Move ${paths.length} unused image(s) to the server trash? They can be restored.`;
    if (!confirm(msg)) return;
    setDeleting(true);
    try {
      const res = await deleteMedia(paths);
      const inUse = res.skipped.filter((s) => s.reason === "in_use");
      if (res.trashed.length) toast.success(isAr ? `اتنقل ${res.trashed.length} صورة للسلة` : `${res.trashed.length} moved to trash`);
      if (inUse.length) toast.info(isAr ? `${inUse.length} صورة اتسابت لأنها بقت مستخدمة في الموقع` : `${inUse.length} kept: in use`);
      if (!res.trashed.length && !inUse.length && res.skipped.length) toast.error(isAr ? "مقدرناش ننقل الصور — جرّب تاني" : "Could not move the images");
      await load();
    } catch (err) {
      toast.error(describeWriteError(err, "DELETE /media"));
    } finally {
      setDeleting(false);
    }
  };

  const folderLabel = (f: string) => (isAr ? MEDIA_FOLDER_LABELS_AR[f] || f : f);
  const usageTabs: Array<{ id: Usage; ar: string; en: string; n?: number }> = [
    { id: "", ar: "الكل", en: "All", n: stats.total },
    ...(hasUsage
      ? [
          { id: "used" as Usage, ar: "مستخدمة في الموقع", en: "In use", n: stats.used },
          { id: "unused" as Usage, ar: "مش مستخدمة", en: "Unused", n: stats.unused },
          { id: "duplicates" as Usage, ar: "نسخ مكررة", en: "Duplicates", n: stats.dups },
        ]
      : []),
  ];

  return (
    <AdminLayout>
      <Helmet>
        <title>{isAr ? "مكتبة الوسائط" : "Media Library"} — Al-Yusr</title>
      </Helmet>

      <div dir={isAr ? "rtl" : "ltr"} className="text-start">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-black text-primary">{isAr ? "مكتبة الوسائط" : "Media Library"}</h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isAr ? (
                <>كل الصور المتخزنة على السيرفر، وكل صورة مكتوب جنبها هي مستخدمة فين. الصورة بتترفع <b>مرة واحدة بس</b>: لو رفعت نفس الصورة تاني هنستخدم النسخة الموجودة. معرض الصور اللي بيظهر للزوار له شاشة منفصلة <Link to="/admin/gallery" className="font-bold text-emerald-700 underline">معرض الصور</Link>، وتقدر تختار صوره من هنا.</>
              ) : (
                "Every image stored on the server, with where it is used. Identical uploads are stored once. The public gallery has its own screen and can pick photos from here."
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {isAr ? "تحديث" : "Refresh"}
            </Button>
            <ChoiceSelect
              value={uploadTo}
              onChange={(v) => setUploadTo(v as MediaCollection)}
              className="h-9 w-48"
              ariaLabel={isAr ? "مجلد الرفع" : "Upload folder"}
              options={MEDIA_COLLECTIONS.map((c) => ({ value: c, label: isAr ? `ارفع إلى: ${MEDIA_COLLECTION_LABELS_AR[c]}` : `Upload to: ${c}` }))}
            />
            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 ${uploading || pendingBackend ? "pointer-events-none opacity-60" : ""}`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : isAr ? "رفع صور" : "Upload images"}
              <input type="file" accept={MEDIA_ACCEPT.join(",")} multiple className="hidden" disabled={uploading || pendingBackend}
                onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ""; }} />
            </label>
          </div>
        </div>

        {pendingBackend && (
          <Card className="mb-5 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {BACKEND_PENDING_AR}: <span dir="ltr" className="font-mono">GET/POST/DELETE /media</span>
          </Card>
        )}

        {/* Stats */}
        {!pendingBackend && files.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={Images} label={isAr ? "كل الصور" : "All images"} value={stats.total} sub={formatSize(stats.size)} />
            <Stat icon={ShieldCheck} label={isAr ? "مستخدمة في الموقع" : "In use"} value={hasUsage ? stats.used : "—"} tone="emerald" />
            <Stat icon={HardDrive} label={isAr ? "مش مستخدمة" : "Unused"} value={hasUsage ? stats.unused : "—"} sub={hasUsage ? formatSize(stats.unusedSize) : undefined} tone="amber"
              onClick={hasUsage && stats.unused ? () => setUsage("unused") : undefined} />
            <Stat icon={Layers} label={isAr ? "نسخ مكررة" : "Duplicates"} value={hasUsage ? stats.dups : "—"} sub={hasUsage && stats.dups ? formatSize(stats.dupSize) : undefined} tone="rose"
              onClick={hasUsage && stats.dups ? () => setUsage("duplicates") : undefined} />
          </div>
        )}

        {!loading && !pendingBackend && files.length > 0 && !hasUsage && (
          <Card className="mb-5 border-amber-300 bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-900">
            {isAr
              ? "السيرفر لسه مش بيقول كل صورة مستخدمة فين، فالحذف مقفول لحد ما تحديث مكتبة الوسائط يترفع على السيرفر."
              : "The server doesn't report usage yet, so deleting is disabled until the media-library update is deployed."}
          </Card>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isAr ? "ابحث باسم الملف..." : "Search by file name..."} className="ps-10" />
            </div>
            <ChoiceSelect
              value={folder || "__all"}
              onChange={(v) => setFolder(v === "__all" ? "" : v)}
              className="h-10 w-full sm:w-56"
              ariaLabel={isAr ? "الفولدر" : "Folder"}
              options={[{ value: "__all", label: isAr ? "كل الفولدرات" : "All folders" }, ...folders.map((f) => ({ value: f, label: folderLabel(f) }))]}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {usageTabs.map((t) => (
              <Button key={t.id || "all"} type="button" size="sm" variant={usage === t.id ? "default" : "outline"} onClick={() => setUsage(t.id)}>
                {isAr ? t.ar : t.en}
                {typeof t.n === "number" && <span className="ms-1.5 rounded-full bg-black/10 px-1.5 text-[10px]">{t.n}</span>}
              </Button>
            ))}
          </div>
        </div>

        {/* Bulk bar */}
        {hasUsage && selectable.length > 0 && (
          <div className="sticky top-16 z-20 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/95 p-2.5 shadow-sm backdrop-blur">
            <button type="button" onClick={toggleAll} className="inline-flex items-center gap-2 text-sm font-bold text-primary">
              {allSelected ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4" />}
              {isAr ? `اختار كل الصور اللي مش مستخدمة هنا (${selectable.length})` : `Select all unused here (${selectable.length})`}
            </button>
            <Button size="sm" variant="destructive" disabled={!selected.size || deleting} onClick={() => remove(Array.from(selected))} className="gap-1.5">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isAr ? `انقل ${selected.size} للسلة` : `Move ${selected.size} to trash`}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex h-60 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm text-muted-foreground">{isAr ? "بنجمع الصور ونشوف كل واحدة مستخدمة فين..." : "Loading images and their usage..."}</p>
          </div>
        )}

        {!loading && !pendingBackend && filtered.length === 0 && (
          <Card className="flex h-60 flex-col items-center justify-center gap-3 border-dashed text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-bold text-foreground">
              {usage === "unused" ? (isAr ? "مفيش صور مش مستخدمة 👌" : "No unused images 👌")
                : usage === "duplicates" ? (isAr ? "مفيش صور مكررة 👌" : "No duplicates 👌")
                : search ? (isAr ? "لا توجد صور مطابقة للبحث" : "No images match your search")
                : isAr ? "لا توجد صور هنا" : "No images here"}
            </p>
          </Card>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {filtered.map((f) => {
              const canRemove = removable(f);
              const isSel = selected.has(f.path);
              const original = f.duplicate_of ? files.find((x) => x.path === f.duplicate_of) : undefined;
              return (
                <Card key={f.path} className={`group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md ${isSel ? "border-red-400 ring-2 ring-red-300" : "border-border/80 hover:border-emerald-500/50"}`}>
                  <div className="relative aspect-square w-full overflow-hidden bg-muted">
                    <img src={f.preview} alt={f.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async" />
                    {/* status */}
                    <div className="absolute start-1.5 top-1.5 flex flex-wrap gap-1">
                      {f.in_use === true && <Badge tone="emerald">{isAr ? "مستخدمة" : "In use"}</Badge>}
                      {f.in_use === false && <Badge tone="amber">{isAr ? "مش مستخدمة" : "Unused"}</Badge>}
                      {f.duplicate_of && <Badge tone="rose">{isAr ? "نسخة مكررة" : "Copy"}</Badge>}
                    </div>
                    {canRemove && (
                      <button type="button" onClick={() => toggle(f.path)} aria-pressed={isSel}
                        className="absolute end-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-md bg-white/90 text-gray-800 shadow-sm" title={isAr ? "اختيار" : "Select"}>
                        {isSel ? <CheckSquare className="h-4 w-4 text-red-600" /> : <Square className="h-4 w-4" />}
                      </button>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                      <button type="button" onClick={() => handleCopy(f.url)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-gray-800 shadow-sm hover:bg-white" title={isAr ? "نسخ الرابط" : "Copy URL"}>
                        {copiedUrl === f.url ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a href={f.preview} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-gray-800 shadow-sm hover:bg-white" title={isAr ? "فتح الصورة" : "Open image"}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {canRemove && (
                        <button type="button" onClick={() => remove([f.path])} disabled={deleting} className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/90 text-white shadow-sm hover:bg-red-600 disabled:opacity-50" title={isAr ? "نقل للسلة" : "Move to trash"}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-2">
                    <span className="cursor-pointer truncate text-[11px] font-bold text-foreground hover:text-emerald-600" dir="ltr" title={f.url} onClick={() => handleCopy(f.url)}>{f.name}</span>
                    <span className="truncate text-[10px] text-muted-foreground/80">{folderLabel(f.folder || `media/${f.collection}`)} · <bdi dir="ltr">{formatSize(f.size)}</bdi></span>
                    {!!f.used_in?.length && (
                      <span className="flex flex-wrap gap-1" title={f.used_in.join(", ")}>
                        {f.used_in.slice(0, 2).map((r) => (
                          <span key={r} className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1 py-px text-[9.5px] font-bold text-emerald-800">
                            <Link2 className="h-2.5 w-2.5" /> {isAr ? usageLabelAr(r) : r}
                          </span>
                        ))}
                        {f.used_in.length > 2 && <span className="text-[9.5px] font-bold text-muted-foreground">+{f.used_in.length - 2}</span>}
                      </span>
                    )}
                    {original && (
                      <span className="truncate text-[9.5px] font-bold text-rose-700" dir="ltr" title={original.path}>= {original.name}</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && files.length > 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isAr
              ? `${filtered.length} من ${files.length} صورة · الحذف بينقل الصورة لسلة على السيرفر (storage/app/media-trash) ومش بيمسحها نهائي، والصور المستخدمة مش بتتحذف أبدًا.`
              : `${filtered.length} of ${files.length} images · deleting moves files to a server trash; used images are never removed.`}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({ icon: Icon, label, value, sub, tone = "slate", onClick }: {
  icon: typeof Images; label: string; value: number | string; sub?: string; tone?: "slate" | "emerald" | "amber" | "rose"; onClick?: () => void;
}) {
  const tones = { slate: "text-primary bg-muted", emerald: "text-emerald-700 bg-emerald-50", amber: "text-amber-700 bg-amber-50", rose: "text-rose-700 bg-rose-50" };
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-start ${onClick ? "transition hover:border-emerald-400" : ""}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold text-muted-foreground">{label}</span>
        <span className="block text-lg font-black leading-6 text-foreground">{value}</span>
        {sub && <span className="block text-[10.5px] text-muted-foreground"><bdi dir="ltr">{sub}</bdi></span>}
      </span>
    </Tag>
  );
}

function Badge({ tone, children }: { tone: "emerald" | "amber" | "rose"; children: ReactNode }) {
  const tones = { emerald: "bg-emerald-600 text-white", amber: "bg-amber-400 text-amber-950", rose: "bg-rose-600 text-white" };
  return <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-black shadow-sm ${tones[tone]}`}>{children}</span>;
}
