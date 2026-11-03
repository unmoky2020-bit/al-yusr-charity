import { UiSelect } from "@/components/common/UiSelect";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, MapPin, Phone, Package, HeartHandshake, UserPlus, RefreshCw, Calendar, Download, Eye } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLang } from "@/i18n/LangContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { khabiaRequestsApi, delegatesApi, delegateCasesApi } from "@/data/api/khabiaRequestsApi";
import { apiErrorMessage, isEndpointMissing, FEATURE_PENDING_MSG } from "@/data/api/adminApiHelpers";
import { toast } from "@/hooks/use-toast";

type Delegate = { id: string; full_name: string; phone: string | null; city: string | null };
type KhRow = { id: string; ref_code: string; full_name: string; phone: string; city: string;
  status: string; scheduled_at: string | null; assigned_delegate_id: string | null;
  amount_collected: number | null; delivery_proof_url: string | null; collection_proof_url: string | null };
type CaseRow = { id: string; ref_code: string; title: string; status: string;
  assigned_delegate_id: string | null; city: string | null; governorate: string };

const Inner = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [khabia, setKhabia] = useState<KhRow[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    const errors: string[] = [];
    const describe = (label: string, e: unknown) =>
      `${label}: ${isEndpointMissing(e) ? FEATURE_PENDING_MSG : apiErrorMessage(e)}`;
    const [dRes, kRes, cRes] = await Promise.allSettled([
      delegatesApi.list(),
      khabiaRequestsApi.list(),
      delegateCasesApi.list("any"),
    ]);
    if (dRes.status === "fulfilled") setDelegates(dRes.value);
    else { setDelegates([]); errors.push(describe(isAr ? "المندوبون" : "Delegates", dRes.reason)); }
    if (kRes.status === "fulfilled") setKhabia(kRes.value);
    else { setKhabia([]); errors.push(describe(isAr ? "طلبات الخبيئة" : "Khabia requests", kRes.reason)); }
    if (cRes.status === "fulfilled") setCases(cRes.value);
    else { setCases([]); errors.push(describe(isAr ? "الحالات المعيّنة" : "Assigned cases", cRes.reason)); }
    setLoadErrors(errors);
    setLoading(false);
  };
  useEffect(() => { void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Proof URLs are returned by the backend as ready-to-use (public or temporary signed) URLs.
  const proofUrls = useMemo(() => {
    const next: Record<string, string> = {};
    for (const k of khabia) {
      if (k.delivery_proof_url) next[k.delivery_proof_url] = k.delivery_proof_url;
      if (k.collection_proof_url) next[k.collection_proof_url] = k.collection_proof_url;
    }
    return next;
  }, [khabia]);

  const scheduleVisit = async (rowId: string, iso: string) => {
    setSavingId(rowId);
    try {
      await khabiaRequestsApi.update(rowId, { scheduled_at: iso ? new Date(iso).toISOString() : null, status: iso ? "scheduled" : "pending" });
      toast({ title: isAr ? " تم جدولة الزيارة" : " Visit scheduled" });
      void reload();
    } catch (e) { toast({ title: isAr ? "فشل جدولة الزيارة" : "Scheduling failed", description: apiErrorMessage(e), variant: "destructive" }); }
    finally { setSavingId(null); }
  };

  const assignKhabia = async (rowId: string, delegateId: string | null) => {
    setSavingId(rowId);
    try {
      await khabiaRequestsApi.update(rowId, { assigned_delegate_id: delegateId });
      toast({ title: isAr ? " تم تعيين المندوب" : " Assigned" });
      void reload();
    } catch (e) { toast({ title: isAr ? "فشل تعيين المندوب" : "Assignment failed", description: apiErrorMessage(e), variant: "destructive" }); }
    finally { setSavingId(null); }
  };

  const unassigned = useMemo(() => khabia.filter(k => !k.assigned_delegate_id && k.status !== "collected" && k.status !== "cancelled"), [khabia]);

  const perDelegate = useMemo(() => {
    const m = new Map<string, { kh: KhRow[]; cs: CaseRow[] }>();
    for (const d of delegates) m.set(d.id, { kh: [], cs: [] });
    for (const k of khabia) if (k.assigned_delegate_id && m.has(k.assigned_delegate_id)) m.get(k.assigned_delegate_id)!.kh.push(k);
    for (const c of cases) if (c.assigned_delegate_id && m.has(c.assigned_delegate_id)) m.get(c.assigned_delegate_id)!.cs.push(c);
    return m;
  }, [delegates, khabia, cases]);

  const filteredDelegates = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return delegates;
    return delegates.filter(d => (d.full_name || "").toLowerCase().includes(q) || (d.phone || "").includes(q) || (d.city || "").toLowerCase().includes(q));
  }, [delegates, filter]);

  const totals = {
    delegates: delegates.length,
    khabia: khabia.length,
    pending: unassigned.length,
    collected: khabia.reduce((s, r) => s + (Number(r.amount_collected) || 0), 0),
  };

  return (
    <AdminLayout title={{ ar: "متابعة المندوبين", en: "Delegate tracking" }}>
      <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={isAr ? "عدد المندوبين" : "Delegates"} value={totals.delegates} />
          <StatCard label={isAr ? "إجمالي طلبات الخبيئة" : "Total Khabia"} value={totals.khabia} />
          <StatCard label={isAr ? "بانتظار تعيين مندوب" : "Awaiting assignment"} value={totals.pending} />
          <StatCard label={isAr ? "إجمالي المُحصَّل (جنيه)" : "Collected (EGP)"} value={totals.collected.toLocaleString()} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={isAr ? "بحث: اسم/هاتف/مدينة…" : "Search name / phone / city…"} className="h-9 max-w-xs text-sm" />
          <Button onClick={() => void reload()} className="h-9 bg-secondary/30 text-xs text-primary hover:bg-secondary/50">
            <RefreshCw className="me-1 h-3 w-3" /> {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {!loading && loadErrors.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-bold text-destructive">
            {loadErrors.map((m) => <p key={m}>{m}</p>)}
          </div>
        )}

        {/* Unassigned Khabia — quick assignment */}
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-primary">
            <UserPlus className="h-4 w-4" /> {isAr ? `طلبات خبيئة بدون مندوب (${unassigned.length})` : `Unassigned Khabia (${unassigned.length})`}
          </h2>
          {loading ? (
            <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : unassigned.length === 0 ? (
            <p className="text-xs text-muted-foreground">{isAr ? "كل الطلبات مُعيَّنة ✅" : "All requests are assigned ✅"}</p>
          ) : (
            <div className="space-y-2">
              {unassigned.slice(0, 20).map((k) => (
                <div key={k.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2">
                  <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">{k.ref_code}</span>
                  <span className="text-xs font-bold text-primary">{k.full_name}</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{k.city}</span>
                  <a className="flex items-center gap-1 text-[11px] text-primary" dir="ltr" href={`tel:${k.phone}`}><Phone className="h-3 w-3" />{k.phone}</a>
                  <div className="ms-auto flex items-center gap-1.5">
                    <UiSelect
                      disabled={savingId === k.id || !delegates.length}
                      onChange={(e) => e.target.value && assignKhabia(k.id, e.target.value)}
                      defaultValue=""
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs font-bold">
                      <option value="">{isAr ? "— اختر مندوبًا —" : "— Pick delegate —"}</option>
                      {delegates.map((d) => (
                        <option key={d.id} value={d.id}>{d.full_name || d.phone || d.id.slice(0, 6)}</option>
                      ))}
                    </UiSelect>
                  </div>
                </div>
              ))}
              {!delegates.length && (
                <p className="text-[11px] text-muted-foreground">{isAr ? "أضف دور «مندوب ميداني» لمستخدم من /admin/users أولًا." : "Assign the 'delegate' role to a user from /admin/users first."}</p>
              )}
            </div>
          )}
        </section>

        {/* Per-delegate cards */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-black text-primary">
            <ShieldCheck className="h-4 w-4" /> {isAr ? "أداء كل مندوب" : "Per-delegate performance"}
          </h2>
          {loading ? (
            <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filteredDelegates.length === 0 ? (
            <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
              {isAr ? "لا يوجد مندوبون مطابقون." : "No matching delegates."}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredDelegates.map((d) => {
                const data = perDelegate.get(d.id) ?? { kh: [], cs: [] };
                const delivered = data.kh.filter(k => k.status === "delivered" || k.status === "collected").length;
                const collected = data.kh.filter(k => k.status === "collected").length;
                const sum = data.kh.reduce((s, r) => s + (Number(r.amount_collected) || 0), 0);
                return (
                  <article key={d.id} className="space-y-2 rounded-2xl bg-card p-4 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-primary">{d.full_name || (isAr ? "بدون اسم" : "Unnamed")}</h3>
                        <p className="text-[11px] text-muted-foreground">{[d.city, d.phone].filter(Boolean).join(" • ")}</p>
                      </div>
                      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">{isAr ? "مندوب" : "Delegate"}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <Pill icon={<Package className="h-3 w-3" />} label={isAr ? "خبيئات" : "Khabia"} value={data.kh.length} />
                      <Pill label={isAr ? "تم التسليم" : "Delivered"} value={delivered} />
                      <Pill label={isAr ? "تم التحصيل" : "Collected"} value={collected} />
                      <Pill icon={<HeartHandshake className="h-3 w-3" />} label={isAr ? "حالات" : "Cases"} value={data.cs.length} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? `إجمالي مُحصَّل: ${sum.toLocaleString()} جنيه` : `Total collected: ${sum.toLocaleString()} EGP`}
                    </p>
                    {data.kh.length > 0 && (
                      <details className="text-[11px]">
                        <summary className="cursor-pointer font-bold text-primary">{isAr ? "آخر مهام الخبيئة" : "Recent Khabia tasks"}</summary>
                        <ul className="mt-1.5 space-y-2">
                          {data.kh.slice(0, 8).map((k) => {
                            const dUrl = k.delivery_proof_url ? proofUrls[k.delivery_proof_url] : "";
                            const cUrl = k.collection_proof_url ? proofUrls[k.collection_proof_url] : "";
                            const draftVal = scheduleDraft[k.id] ?? (k.scheduled_at ? new Date(k.scheduled_at).toISOString().slice(0,16) : "");
                            return (
                              <li key={k.id} className="space-y-1.5 rounded bg-muted/40 p-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono text-[10px]" dir="ltr">{k.ref_code}</span>
                                  <span className="font-bold">{k.full_name}</span>
                                  <span className="ms-auto rounded-full bg-card px-1.5 py-0.5 text-[10px] font-bold">{k.status}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <input
                                    type="datetime-local"
                                    value={draftVal}
                                    onChange={(e) => setScheduleDraft({ ...scheduleDraft, [k.id]: e.target.value })}
                                    className="h-7 flex-1 min-w-[9rem] rounded border border-border bg-background px-1.5 text-[10px]"
                                  />
                                  <Button
                                    disabled={savingId === k.id}
                                    onClick={() => scheduleVisit(k.id, scheduleDraft[k.id] ?? draftVal)}
                                    className="h-7 bg-secondary/30 px-2 text-[10px] text-primary hover:bg-secondary/50">
                                    {isAr ? "جدولة" : "Set visit"}
                                  </Button>
                                </div>
                                {(dUrl || cUrl) && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {dUrl && (
                                      <button onClick={() => setPreview({ url: dUrl, title: `${k.ref_code} — ${isAr ? "إثبات التسليم" : "Delivery proof"}` })}
                                        className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                                        <Eye className="h-3 w-3" /> {isAr ? "صورة التسليم" : "Delivery"}
                                      </button>
                                    )}
                                    {cUrl && (
                                      <button onClick={() => setPreview({ url: cUrl, title: `${k.ref_code} — ${isAr ? "إثبات التحصيل" : "Collection proof"}` })}
                                        className="inline-flex items-center gap-1 rounded bg-secondary/30 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                        <Eye className="h-3 w-3" /> {isAr ? "صورة التحصيل" : "Collection"}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
          <DialogContent className="max-w-2xl" dir={isAr ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold text-primary">{preview?.title}</DialogTitle>
            </DialogHeader>
            {preview && (
              <div className="space-y-3">
                <img src={preview.url} alt={preview.title} className="max-h-[70vh] w-full rounded-lg object-contain" />
                <div className="flex justify-end">
                  <a href={preview.url} download target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-extrabold text-secondary hover:bg-primary/90">
                    <Download className="h-3.5 w-3.5" /> {isAr ? "تحميل الصورة" : "Download"}
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

const Pill = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-md bg-muted/40 p-1.5">
    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">{icon}{label}</div>
    <div className="text-sm font-extrabold text-primary">{value}</div>
  </div>
);

export default function AdminDelegates() {
  return (
    <RequireAuth roles={["admin", "case_manager"]}>
      <Inner />
    </RequireAuth>
  );
}