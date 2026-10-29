import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin, Phone, Calendar, Package, HandCoins, CheckCircle2, Camera, ExternalLink, MessageSquarePlus, HeartHandshake } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { khabiaRequestsApi, delegateCasesApi, type KhabiaPatch } from "@/data/api/khabiaRequestsApi";
import { apiErrorMessage, isEndpointMissing, FEATURE_PENDING_MSG } from "@/data/api/adminApiHelpers";
import { toast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/image-compress";
import { getCaseStatusLabel } from "@/data/casesApi";
import { logActivity } from "@/lib/activityLog";
import { publicUrls } from "@/lib/publicUrls";

type Khabia = {
  id: string; ref_code: string; full_name: string; phone: string;
  city: string; address: string | null; status: string;
  scheduled_at: string | null; delivered_at: string | null;
  collected_at: string | null; amount_collected: number | null;
  notes: string | null;
  delivery_proof_url: string | null;
  collection_proof_url: string | null;
};

type AidCase = {
  id: string; ref_code: string; title: string; status: string;
  beneficiary_name: string; city: string | null; area: string | null;
  governorate: string; scheduled_visit_at: string | null;
  delegate_notes: string | null; cover_image_url: string | null;
};

const STATUS_FLOW: Array<{ v: string; ar: string; en: string; tone: string }> = [
  { v: "pending", ar: "بانتظار التحديد", en: "Pending", tone: "bg-muted text-foreground" },
  { v: "scheduled", ar: "محدد موعد", en: "Scheduled", tone: "bg-accent/15 text-accent" },
  { v: "delivered", ar: "تم تسليم الخبيئة", en: "Khabia delivered", tone: "bg-secondary/30 text-primary" },
  { v: "collected", ar: "تم جمع المبلغ", en: "Amount collected", tone: "bg-green-100 text-green-800" },
  { v: "cancelled", ar: "ملغي", en: "Cancelled", tone: "bg-rose-100 text-rose-700" },
];
const labelFor = (v: string, isAr: boolean) => {
  const f = STATUS_FLOW.find((s) => s.v === v); return f ? (isAr ? f.ar : f.en) : v;
};
const toneFor = (v: string) => STATUS_FLOW.find((s) => s.v === v)?.tone ?? "bg-muted";

const Inner = () => {
  const { lang } = useLang();
  const { user } = useAuth();
  const isAr = lang === "ar";
  const [tab, setTab] = useState<"khabia" | "aid">("khabia");
  const [rows, setRows] = useState<Khabia[]>([]);
  const [aid, setAid] = useState<AidCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<{ khabia?: string; aid?: string }>({});
  const [draft, setDraft] = useState<Record<string, { scheduled_at?: string; amount?: string; notes?: string }>>({});
  const [aidDraft, setAidDraft] = useState<Record<string, { scheduled_at?: string; note?: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const reload = async () => {
    if (!user?.id) return;
    setLoading(true);
    const errMsg = (e: unknown) => (isEndpointMissing(e) ? FEATURE_PENDING_MSG : apiErrorMessage(e));
    const byDate = (a: string | null, b: string | null) =>
      (a ? new Date(a).getTime() : Number.MAX_SAFE_INTEGER) - (b ? new Date(b).getTime() : Number.MAX_SAFE_INTEGER);
    const [kRes, cRes] = await Promise.allSettled([
      khabiaRequestsApi.list({ assigned_delegate_id: "me" }),
      delegateCasesApi.list("me"),
    ]);
    const errors: { khabia?: string; aid?: string } = {};
    if (kRes.status === "fulfilled") setRows([...kRes.value].sort((a, b) => byDate(a.scheduled_at, b.scheduled_at)));
    else { setRows([]); errors.khabia = errMsg(kRes.reason); }
    if (cRes.status === "fulfilled") setAid([...cRes.value].sort((a, b) => byDate(a.scheduled_visit_at, b.scheduled_visit_at)));
    else { setAid([]); errors.aid = errMsg(cRes.reason); }
    setLoadErrors(errors);
    setLoading(false);
  };
  useEffect(() => { void reload(); /* eslint-disable-next-line */ }, [user?.id]);

  const safeRows = Array.isArray(rows) ? rows : [];
  const safeAid = Array.isArray(aid) ? aid : [];

  const stats = useMemo(() => ({
    total: safeRows.length + safeAid.length,
    upcoming: safeRows.filter(r => r.scheduled_at && new Date(r.scheduled_at) >= new Date() && r.status !== "collected" && r.status !== "cancelled").length,
    delivered: safeRows.filter(r => r.status === "delivered").length,
    collected_total: safeRows.reduce((s, r) => s + (Number(r.amount_collected) || 0), 0),
  }), [safeRows, safeAid]);

  const saveAction = async (id: string, patch: Record<string, unknown>, successMsg: string) => {
    setSavingId(id);
    try {
      await khabiaRequestsApi.update(id, patch as KhabiaPatch);
      const target = rows.find((r) => r.id === id);
      void logActivity({
        action: "khabia.update",
        entityType: "khabia_request",
        entityId: id,
        summary: `${target?.ref_code ?? id} → ${(patch as any).status ?? "update"}`,
        details: patch as Record<string, unknown>,
      });
      toast({ title: successMsg });
      void reload();
    } catch (e) { toast({ title: isAr ? "فشل الحفظ" : "Save failed", description: apiErrorMessage(e), variant: "destructive" }); }
    finally { setSavingId(null); }
  };

  /** Compress + upload proof image; the backend stores it and updates the request (status / proof url). */
  const uploadProof = async (file: File, khabiaId: string, kind: "delivery" | "collection") => {
    if (!user?.id) throw new Error("Not signed in");
    const compressed = await compressImage(file, { maxEdge: 1400, quality: 0.78 });
    const ext = (compressed.type.split("/")[1] || "webp").replace("jpeg", "jpg");
    const updated = await khabiaRequestsApi.uploadProof(khabiaId, kind, compressed, `${kind}-${Date.now()}.${ext}`);
    return (kind === "delivery" ? updated.delivery_proof_url : updated.collection_proof_url) ?? "";
  };

  const onProofFile = async (khabiaId: string, kind: "delivery" | "collection", file: File | null) => {
    if (!file) return;
    setUploadingId(khabiaId);
    try {
      const path = await uploadProof(file, khabiaId, kind);
      const target = rows.find((r) => r.id === khabiaId);
      void logActivity({
        action: kind === "delivery" ? "khabia.proof_delivery" : "khabia.proof_collection",
        entityType: "khabia_request",
        entityId: khabiaId,
        summary: `${target?.ref_code ?? khabiaId} — ${kind === "delivery" ? "delivery proof" : "collection proof"} uploaded`,
        details: { path },
      });
      toast({ title: isAr ? " تم رفع صورة الإثبات" : " Proof uploaded" });
      void reload();
    } catch (e) { toast({ title: isAr ? "فشل رفع صورة الإثبات" : "Proof upload failed", description: apiErrorMessage(e), variant: "destructive" }); }
    finally { setUploadingId(null); }
  };

  // Proof URLs come back from the backend ready to display (public or temporary signed URLs).
  const proofUrls = useMemo(() => {
    const next: Record<string, string> = {};
    for (const r of rows) {
      if (r.delivery_proof_url) next[r.delivery_proof_url] = r.delivery_proof_url;
      if (r.collection_proof_url) next[r.collection_proof_url] = r.collection_proof_url;
    }
    return next;
  }, [rows]);

  /** Aid delivery — post a case_update with optional photo as proof. */
  const postAidProof = async (caseId: string, body: string, file: File | null) => {
    if (!body.trim() && !file) {
      toast({ title: isAr ? "اكتب ملاحظة أو أرفق صورة" : "Add a note or attach a photo", variant: "destructive" });
      return;
    }
    setUploadingId(caseId);
    try {
      const compressed = file ? await compressImage(file, { maxEdge: 1400, quality: 0.78 }) : null;
      await delegateCasesApi.postUpdate(caseId, body.trim() || (isAr ? "تم تسليم المساعدة" : "Aid delivered"), compressed);
      toast({ title: isAr ? " تم تسجيل التسليم" : " Delivery logged" });
      setAidDraft({ ...aidDraft, [caseId]: { ...aidDraft[caseId], note: "" } });
      void reload();
    } catch (e) { toast({ title: isAr ? "فشل تسجيل التسليم" : "Logging failed", description: apiErrorMessage(e), variant: "destructive" }); }
    finally { setUploadingId(null); }
  };

  return (
    <AdminLayout title={{ ar: "مهام المندوب الميداني", en: "Delegate field tasks" }}>
      <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "مهامك تشمل: توصيل الخبيئة لباب البيت، جمعها بعد فترة، وتسليم المساعدات للحالات المعتمدة. كل مهمة يعينها لك مسؤول الحالات."
            : "Your tasks: deliver Khabia boxes, collect them after a period, and deliver aid for approved cases. Tasks are assigned by the case manager."}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={isAr ? "إجمالي المهام" : "Total tasks"} value={stats.total} />
          <StatCard label={isAr ? "زيارات قادمة" : "Upcoming visits"} value={stats.upcoming} />
          <StatCard label={isAr ? "تم التسليم" : "Delivered"} value={stats.delivered} />
          <StatCard label={isAr ? "تم تحصيله" : "Collected (EGP)"} value={`${stats.collected_total.toLocaleString()}`} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-muted p-1">
          <button onClick={() => setTab("khabia")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition ${tab === "khabia" ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
            <Package className="h-3.5 w-3.5" /> {isAr ? `الخبيئة (${rows.length})` : `Khabia (${rows.length})`}
          </button>
          <button onClick={() => setTab("aid")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition ${tab === "aid" ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
            <HeartHandshake className="h-3.5 w-3.5" /> {isAr ? `تسليم مساعدات (${aid.length})` : `Aid deliveries (${aid.length})`}
          </button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : tab === "khabia" && rows.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-soft">
            <p className={`text-sm ${loadErrors.khabia ? "font-bold text-destructive" : "text-muted-foreground"}`}>
              {loadErrors.khabia ?? (isAr ? "لا توجد طلبات خبيئة مخصصة لك حاليًا." : "No Khabia tasks assigned to you yet.")}
            </p>
          </div>
        ) : tab === "aid" && aid.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-soft">
            <p className={`text-sm ${loadErrors.aid ? "font-bold text-destructive" : "text-muted-foreground"}`}>
              {loadErrors.aid ?? (isAr ? "لا توجد حالات مخصصة لك للتسليم." : "No aid cases assigned to you.")}
            </p>
          </div>
        ) : tab === "khabia" ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.map((r) => {
              const d = draft[r.id] ?? {};
              const scheduled = d.scheduled_at ?? (r.scheduled_at ? new Date(r.scheduled_at).toISOString().slice(0, 16) : "");
              const deliveryImg = r.delivery_proof_url ? proofUrls[r.delivery_proof_url] : "";
              const collectionImg = r.collection_proof_url ? proofUrls[r.collection_proof_url] : "";
              return (
                <article key={r.id} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">{r.ref_code}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${toneFor(r.status)}`}>{labelFor(r.status, isAr)}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-primary">{r.full_name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground" dir="ltr">
                      <Phone className="h-3 w-3" />
                      <a className="font-mono text-primary underline" href={`tel:${r.phone}`}>{r.phone}</a>
                    </p>
                    <p className="mt-0.5 flex items-start gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {[r.city, r.address].filter(Boolean).join(" — ")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="datetime-local"
                      value={scheduled}
                      onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, scheduled_at: e.target.value } })}
                      className="h-8 min-w-[10rem] flex-1 text-xs"
                    />
                    <Button
                      disabled={savingId === r.id}
                      onClick={() => saveAction(r.id,
                        { scheduled_at: scheduled ? new Date(scheduled).toISOString() : null, status: "scheduled" },
                        isAr ? "✅ تم تحديد الموعد" : "✅ Scheduled")}
                      className="h-8 bg-secondary/30 text-xs text-primary hover:bg-secondary/50">
                      {isAr ? "حفظ الموعد" : "Schedule"}
                    </Button>
                  </div>

                  {/* Delivery proof */}
                  <div className="rounded-lg border border-dashed border-border p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-muted-foreground">{isAr ? "إثبات تسليم الخبيئة" : "Delivery proof"}</span>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-accent/15 px-2 py-1 text-[11px] font-bold text-accent hover:bg-accent/25">
                        <Camera className="h-3 w-3" /> {isAr ? "رفع صورة" : "Upload"}
                        <input ref={(el) => (fileInputs.current[`d-${r.id}`] = el)}
                          type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={(e) => { void onProofFile(r.id, "delivery", e.target.files?.[0] ?? null); e.currentTarget.value = ""; }} />
                      </label>
                    </div>
                    {deliveryImg && (
                      <a href={deliveryImg} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img src={deliveryImg} alt="delivery proof" className="h-24 w-full rounded object-cover" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      disabled={savingId === r.id || r.status === "delivered" || r.status === "collected"}
                      onClick={() => saveAction(r.id,
                        { status: "delivered", delivered_at: new Date().toISOString() },
                        isAr ? "✅ تم تسليم الخبيئة" : "✅ Marked delivered")}
                      className="h-8 bg-accent/20 text-xs text-accent hover:bg-accent/30">
                      <Package className="me-1 h-3 w-3" /> {isAr ? "تم تسليم الخبيئة" : "Mark delivered"}
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <HandCoins className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number" inputMode="numeric" min={0} placeholder={isAr ? "المبلغ بالجنيه" : "Amount EGP"}
                        value={d.amount ?? (r.amount_collected != null ? String(r.amount_collected) : "")}
                        onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, amount: e.target.value } })}
                        className="h-8 w-28 text-xs" dir="ltr"
                      />
                      <Button
                        disabled={savingId === r.id}
                        onClick={() => {
                          const amt = Number(d.amount ?? r.amount_collected ?? 0);
                          if (!amt || amt <= 0) { toast({ title: isAr ? "أدخل المبلغ المُحصَّل" : "Enter collected amount", variant: "destructive" }); return; }
                          void saveAction(r.id,
                            { status: "collected", amount_collected: amt, collected_at: new Date().toISOString() },
                            isAr ? "✅ تم تسجيل التحصيل" : "✅ Collection recorded");
                        }}
                        className="h-8 bg-orange-grad text-xs text-accent-foreground">
                        <CheckCircle2 className="me-1 h-3 w-3" /> {isAr ? "تأكيد التحصيل" : "Confirm collection"}
                      </Button>
                    </div>
                  </div>

                  {/* Collection proof */}
                  <div className="rounded-lg border border-dashed border-border p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-muted-foreground">{isAr ? "إثبات استلام المبلغ" : "Collection proof"}</span>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-secondary/30 px-2 py-1 text-[11px] font-bold text-primary hover:bg-secondary/50">
                        <Camera className="h-3 w-3" /> {isAr ? "رفع صورة" : "Upload"}
                        <input type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={(e) => { void onProofFile(r.id, "collection", e.target.files?.[0] ?? null); e.currentTarget.value = ""; }} />
                      </label>
                    </div>
                    {collectionImg && (
                      <a href={collectionImg} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img src={collectionImg} alt="collection proof" className="h-24 w-full rounded object-cover" />
                      </a>
                    )}
                    {uploadingId === r.id && <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> {isAr ? "جارٍ الضغط والرفع…" : "Compressing & uploading…"}</p>}
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      placeholder={isAr ? "ملاحظات الزيارة…" : "Visit notes…"}
                      value={d.notes ?? (r.notes ?? "")}
                      onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, notes: e.target.value } })}
                      className="w-full rounded-md border border-border bg-background p-2 text-xs"
                    />
                    <div className="mt-1.5 flex justify-end">
                      <Button
                        disabled={savingId === r.id}
                        onClick={() => saveAction(r.id, { notes: (d.notes ?? r.notes ?? "").trim() || null }, isAr ? "✅ تم حفظ الملاحظة" : "✅ Note saved")}
                        className="h-7 bg-muted text-[11px]">
                        {isAr ? "حفظ الملاحظة" : "Save note"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          // Aid deliveries tab
          <div className="grid gap-3 lg:grid-cols-2">
            {aid.map((c) => {
              const ad = aidDraft[c.id] ?? {};
              const st = getCaseStatusLabel(c.status);
              return (
                <article key={c.id} className="space-y-3 overflow-hidden rounded-2xl bg-card shadow-soft">
                  {c.cover_image_url && <img src={c.cover_image_url} alt="" loading="lazy" className="h-28 w-full object-cover" />}
                  <div className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">{c.ref_code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${st.tone}`}>{isAr ? st.ar : st.en}</span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-extrabold text-primary">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">{c.beneficiary_name}</p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {[c.city, c.area].filter(Boolean).join(" — ") || c.governorate}
                    </p>
                    {c.delegate_notes && <p className="rounded-md bg-muted/40 p-2 text-[11px] text-foreground">📋 {c.delegate_notes}</p>}

                    <div className="space-y-2 rounded-lg border border-dashed border-border p-2">
                      <textarea rows={2}
                        placeholder={isAr ? "وصف التسليم / ملاحظة…" : "Delivery note…"}
                        value={ad.note ?? ""}
                        onChange={(e) => setAidDraft({ ...aidDraft, [c.id]: { ...ad, note: e.target.value } })}
                        className="w-full rounded-md border border-border bg-background p-2 text-xs" />
                      <div className="flex flex-wrap gap-1.5">
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-accent/15 px-2 py-1 text-[11px] font-bold text-accent hover:bg-accent/25">
                          <Camera className="h-3 w-3" /> {isAr ? "إرفاق صورة + تسجيل التسليم" : "Photo + log delivery"}
                          <input type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={(e) => { void postAidProof(c.id, ad.note ?? "", e.target.files?.[0] ?? null); e.currentTarget.value = ""; }} />
                        </label>
                        <Button
                          disabled={uploadingId === c.id}
                          onClick={() => void postAidProof(c.id, ad.note ?? "", null)}
                          className="h-7 bg-muted text-[11px]">
                          <MessageSquarePlus className="me-1 h-3 w-3" /> {isAr ? "تسجيل بدون صورة" : "Log only"}
                        </Button>
                        <Link to={publicUrls.case(c.ref_code)} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-bold hover:bg-muted/70">
                          <ExternalLink className="h-3 w-3" /> {isAr ? "صفحة الحالة" : "Public page"}
                        </Link>
                      </div>
                      {uploadingId === c.id && <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> {isAr ? "جارٍ الضغط والرفع…" : "Compressing & uploading…"}</p>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default function AdminMyCases() {
  return (
    <RequireAuth roles={["admin", "case_manager", "delegate"]}>
      <Inner />
    </RequireAuth>
  );
}