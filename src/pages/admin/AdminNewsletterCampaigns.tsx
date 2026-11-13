import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, CalendarClock, Copy, Eye, Loader2, Mail, MailOpen, MousePointerClick, Plus, Save, Send, Trash2, Users, XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/notify";
import { askConfirm } from "@/components/common/confirm";
import { useAuth } from "@/auth/AuthContext";
import { useCan } from "@/auth/useCan";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { newsletterCampaignsApi, type CampaignDoc, type MailBlock, type NewsletterCampaign } from "@/data/api/newsletterCampaignsApi";
import { mailAdminApi } from "@/data/api/mailApi";
import { EmailPreviewFrame } from "@/components/admin/mail/EmailPreviewFrame";
import { BlockList, ImageField } from "@/components/admin/mail/BlockEditor";
import { BLOCK_LABELS, STARTERS, newBlock } from "@/components/admin/mail/mailStarters";
import { cn } from "@/lib/utils";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "bg-zinc-100 text-zinc-700" },
  scheduled: { label: "مجدولة", cls: "bg-sky-100 text-sky-800" },
  sending: { label: "بتتبعت", cls: "bg-amber-100 text-amber-800" },
  sent: { label: "اتبعتت", cls: "bg-emerald-100 text-emerald-800" },
  failed: { label: "فشلت", cls: "bg-red-100 text-red-700" },
};
const fmt = (n?: number) => Number(n ?? 0).toLocaleString("en-US");
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

type Draft = { id?: string; subject: string; preheader: string; doc: CampaignDoc; status?: string };
const ADD_ORDER: MailBlock["type"][] = ["text", "heading", "image", "button", "card", "cards", "stats", "quote", "list", "note", "divider", "spacer"];

function draftFrom(c: NewsletterCampaign): Draft {
  const doc: CampaignDoc = c.blocks ?? { title: c.subject, eyebrow: "نشرة اليسر", hero: null, items: c.html ? [{ type: "html", html: c.html }] : [] };
  return { id: c.id, subject: c.subject, preheader: c.preheader ?? "", doc, status: c.status };
}

/**
 * Newsletter campaigns: a list, and an editor that builds the email from blocks (text, images from
 * the media library, buttons, campaign/case cards, numbers, duas) with a live phone/desktop preview
 * rendered by the server in the exact design subscribers get. Sending goes through the outbox in
 * batches under the mailbox's daily limit.
 */
export default function AdminNewsletterCampaigns() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const can = useCan();
  const canEdit = can("newsletter.update") || can("newsletter.create");
  const list = useQuery({ queryKey: ["nl-campaigns"], queryFn: () => newsletterCampaignsApi.list() });
  const subs = useQuery({ queryKey: ["nl-confirmed"], queryFn: () => newsletterCampaignsApi.confirmedCount() });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [starter, setStarter] = useState(false);

  useEffect(() => {
    if (params.get("new") === "1") { setStarter(true); params.delete("new"); setParams(params, { replace: true }); }
  }, [params, setParams]);

  const refresh = () => { qc.invalidateQueries({ queryKey: ["nl-campaigns"] }); qc.invalidateQueries({ queryKey: ["mail-overview"] }); };

  if (draft) return <Composer key={draft.id ?? "new"} initial={draft} confirmed={subs.data ?? 0} canEdit={canEdit} onClose={() => { setDraft(null); refresh(); }} />;

  const rows = list.data ?? [];
  return (
    <AdminLayout title={{ ar: "حملات النشرة", en: "Newsletter campaigns" }} loading={list.isLoading}>
      <Helmet><title>حملات النشرة | لوحة اليسر</title></Helmet>
      <div className="mx-auto max-w-5xl space-y-5 p-1" dir="rtl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary">حملات النشرة البريدية</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <Users className="inline h-4 w-4" /> {fmt(subs.data)} مشترك مؤكد · <Link to="/admin/mail" className="font-bold text-primary underline">مركز البريد</Link> · <Link to="/admin/newsletter" className="underline">المشتركين</Link>
            </p>
          </div>
          {canEdit && <Button onClick={() => setStarter(true)}><Plus className="ml-1 h-4 w-4" /> نشرة جديدة</Button>}
        </header>

        {list.isError && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{apiErrorMessage(list.error, "تعذر تحميل الحملات")}</div>}

        {rows.length === 0 && !list.isLoading ? (
          <div className="rounded-3xl border border-dashed bg-card p-10 text-center">
            <Mail className="mx-auto h-10 w-10 text-primary/60" />
            <h2 className="mt-3 text-lg font-black">لسه مفيش نشرات</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">ابدأ من قالب جاهز (أخبار الأثر، حملة عاجلة، شكر وتقرير) وعدّل الكلام والصور، وشوف شكلها على الموبايل قبل ما تبعت.</p>
            {canEdit && <Button className="mt-4" onClick={() => setStarter(true)}><Plus className="ml-1 h-4 w-4" /> اكتب أول نشرة</Button>}
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((c) => <CampaignRow key={c.id} c={c} canEdit={canEdit} onOpen={() => setDraft(draftFrom(c))} onChanged={refresh} />)}
          </ul>
        )}
      </div>

      <Dialog open={starter} onOpenChange={setStarter}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader><DialogTitle>تبدأ منين؟</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {STARTERS.map((s) => (
              <button key={s.id} type="button" onClick={() => { setStarter(false); setDraft({ subject: s.subject, preheader: "", doc: JSON.parse(JSON.stringify(s.doc)) }); }}
                className="overflow-hidden rounded-2xl border text-right transition hover:border-primary hover:shadow-md">
                {s.doc.hero?.image ? <img src={s.doc.hero.image} alt="" className="aspect-[2/1] w-full object-cover" /> : <div className="flex aspect-[2/1] items-center justify-center bg-muted"><Plus className="h-8 w-8 text-muted-foreground" /></div>}
                <div className="p-3"><b>{s.name}</b><p className="text-xs text-muted-foreground">{s.hint}</p></div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function CampaignRow({ c, canEdit, onOpen, onChanged }: { c: NewsletterCampaign; canEdit: boolean; onOpen: () => void; onChanged: () => void }) {
  const st = STATUS[c.status] ?? STATUS.draft;
  const base = Math.max(1, c.sent_count);
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); onChanged(); } catch (e) { toast.error("تعذر", { description: apiErrorMessage(e) }); }
  };
  const hero = c.blocks?.hero?.image;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-right">
        {hero ? <img src={hero.startsWith("/") ? hero : hero} alt="" className="h-16 w-28 shrink-0 rounded-xl object-cover" /> : <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-xl bg-primary/5"><Mail className="h-6 w-6 text-primary/50" /></div>}
        <span className="min-w-0">
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", st.cls)}>{st.label}{c.status === "scheduled" && c.scheduled_at ? ` · ${when(c.scheduled_at)}` : ""}</span>
          <b className="mt-1 block truncate">{c.subject || "بدون عنوان"}</b>
          <span className="text-xs text-muted-foreground">
            {c.status === "draft" ? `آخر تعديل ${when(c.created_at)}` : (
              <>اتبعت {fmt(c.sent_count)} من {fmt(c.recipients_count)}{c.queued_count ? ` · ${fmt(c.queued_count)} مستنية` : ""}
                {" · "}<MailOpen className="inline h-3.5 w-3.5" /> {Math.round((c.opened_count / base) * 100)}%
                {" · "}<MousePointerClick className="inline h-3.5 w-3.5" /> {Math.round((c.clicked_count / base) * 100)}%</>
            )}
          </span>
        </span>
      </button>
      {canEdit && (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" title="نسخة" onClick={() => act(() => newsletterCampaignsApi.duplicate(c.id), "اتعملت نسخة")}><Copy className="h-4 w-4" /></Button>
          {(c.status === "sending" || c.status === "scheduled") && (
            <Button variant="ghost" size="sm" title="إيقاف" onClick={async () => { if (await askConfirm("توقف اللي لسه ما اتبعتش؟")) act(() => newsletterCampaignsApi.cancel(c.id), "اتوقفت"); }}><XCircle className="h-4 w-4" /></Button>
          )}
          {c.status !== "sending" && (
            <Button variant="ghost" size="sm" title="حذف" className="text-destructive" onClick={async () => { if (await askConfirm("حذف الحملة؟")) act(() => newsletterCampaignsApi.remove(c.id), "اتحذفت"); }}><Trash2 className="h-4 w-4" /></Button>
          )}
        </div>
      )}
    </li>
  );
}

/* ───────────── composer ───────────── */

function Composer({ initial, confirmed, canEdit, onClose }: { initial: Draft; confirmed: number; canEdit: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [d, setD] = useState<Draft>(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "test" | "send">(null);
  const [html, setHtml] = useState<string | null>(null);
  const [pvLoading, setPvLoading] = useState(false);
  const [pvError, setPvError] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [at, setAt] = useState("");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const locked = d.status === "sent" || d.status === "sending";
  const timer = useRef<number>();

  const update = (patch: Partial<Draft>) => { setD((x) => ({ ...x, ...patch })); setDirty(true); };
  const updateDoc = (patch: Partial<CampaignDoc>) => update({ doc: { ...d.doc, ...patch } });

  const docForPreview = useMemo(() => ({ title: d.doc.title || d.subject, preheader: d.preheader, eyebrow: d.doc.eyebrow, hero: d.doc.hero?.image ? d.doc.hero : null, items: d.doc.items }), [d]);
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setPvLoading(true);
      try { setHtml(await mailAdminApi.preview(docForPreview)); setPvError(null); } catch (e) { setPvError(apiErrorMessage(e, "تعذر تحميل المعاينة")); } finally { setPvLoading(false); }
    }, 700);
    return () => window.clearTimeout(timer.current);
  }, [docForPreview]);

  const save = useCallback(async (): Promise<string | null> => {
    if (!d.subject.trim()) { toast.error("اكتب عنوان الرسالة (اللي بيظهر في صندوق الوارد)"); return null; }
    setBusy("save");
    try {
      const body = { subject: d.subject.trim(), preheader: d.preheader.trim() || null, blocks: { ...d.doc, title: d.doc.title || d.subject }, html: "" };
      const saved = d.id ? await newsletterCampaignsApi.update(d.id, body) : await newsletterCampaignsApi.create({ ...body, status: "draft" });
      setD((x) => ({ ...x, id: saved.id, status: saved.status }));
      setDirty(false);
      return saved.id;
    } catch (e) {
      toast.error("تعذر الحفظ", { description: apiErrorMessage(e) });
      return null;
    } finally { setBusy(null); }
  }, [d]);

  const sendTest = async () => {
    const email = (user as { email?: string } | null)?.email;
    if (!email) { toast.error("حسابك مفيهوش بريد"); return; }
    const id = dirty || !d.id ? await save() : d.id;
    if (!id) return;
    setBusy("test");
    try {
      const r = await newsletterCampaignsApi.sendTest(id, email);
      toast.success(r.message || `اتبعتت تجربة لـ ${email}`, { description: "افتحها من الموبايل وشوف الشكل الحقيقي." });
    } catch (e) { toast.error("تعذر إرسال التجربة", { description: apiErrorMessage(e) }); } finally { setBusy(null); }
  };

  const send = async () => {
    const id = dirty || !d.id ? await save() : d.id;
    if (!id) return;
    setBusy("send");
    try {
      const r = await newsletterCampaignsApi.send(id, at ? new Date(at).toISOString() : null);
      toast.success(r.scheduled ? "اتجدولت" : "بدأ الإرسال", { description: r.message });
      setSendOpen(false);
      onClose();
    } catch (e) { toast.error("تعذر الإرسال", { description: apiErrorMessage(e) }); } finally { setBusy(null); }
  };

  const leave = async () => {
    if (dirty && !(await askConfirm("في تعديلات ما اتحفظتش. تخرج من غير حفظ؟"))) return;
    onClose();
  };

  return (
    <AdminLayout title={{ ar: "محرر النشرة", en: "Newsletter editor" }}>
      <Helmet><title>محرر النشرة | لوحة اليسر</title></Helmet>
      <div className="mx-auto max-w-7xl space-y-4 p-1" dir="rtl">
        <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-2 border-b bg-background/95 px-1 py-2 backdrop-blur">
          <Button variant="ghost" size="sm" onClick={leave}><ArrowRight className="ml-1 h-4 w-4" /> الحملات</Button>
          <div className="flex flex-wrap gap-2">
            {canEdit && !locked && (
              <>
                <Button variant="outline" size="sm" onClick={() => save().then((id) => id && toast.success("اتحفظت"))} disabled={!!busy}>
                  {busy === "save" ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Save className="ml-1 h-4 w-4" />} حفظ{dirty ? " •" : ""}
                </Button>
                <Button variant="outline" size="sm" onClick={sendTest} disabled={!!busy}>
                  {busy === "test" ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Eye className="ml-1 h-4 w-4" />} ابعت لي تجربة
                </Button>
                <Button size="sm" onClick={() => setSendOpen(true)} disabled={!!busy}><Send className="ml-1 h-4 w-4" /> إرسال</Button>
              </>
            )}
            {locked && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">الحملة دي اتبعتت — اعمل منها نسخة لو عايز تعدّل</span>}
          </div>
        </div>

        <div className="flex gap-1 rounded-xl bg-muted p-1 lg:hidden">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setMobileTab(t)} className={cn("flex-1 rounded-lg py-1.5 text-sm font-bold", mobileTab === t ? "bg-background shadow-sm" : "text-muted-foreground")}>{t === "edit" ? "تحرير" : "معاينة"}</button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <fieldset disabled={locked || !canEdit} className={cn("space-y-4", mobileTab === "preview" && "hidden lg:block")}>
            <section className="space-y-3 rounded-2xl border bg-card p-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-muted-foreground">عنوان الرسالة في صندوق الوارد *</span>
                <Input value={d.subject} onChange={(e) => update({ subject: e.target.value })} placeholder="مثال: أثرك الشهر ده 🌿" className="text-base font-bold" maxLength={150} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-muted-foreground">سطر المعاينة (بيظهر جنب العنوان في جيميل)</span>
                <Input value={d.preheader} onChange={(e) => update({ preheader: e.target.value })} placeholder="جملة قصيرة تشجّع على الفتح" maxLength={150} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">العنوان الكبير جوه الإيميل</span>
                  <Input value={d.doc.title ?? ""} onChange={(e) => updateDoc({ title: e.target.value })} placeholder={d.subject || "نفس عنوان الرسالة"} />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">السطر البرتقالي فوقه</span>
                  <Input value={d.doc.eyebrow ?? ""} onChange={(e) => updateDoc({ eyebrow: e.target.value })} placeholder="نشرة اليسر" />
                </label>
              </div>
              <ImageField label="الصورة الرئيسية (عرض الإيميل كله)" value={d.doc.hero?.image ?? ""} onChange={(image) => updateDoc({ hero: image ? { ...(d.doc.hero ?? {}), image } : null })} />
            </section>

            <BlockList items={d.doc.items} onChange={(items) => updateDoc({ items })} />

            <section className="rounded-2xl border border-dashed bg-card p-3">
              <span className="mb-2 block text-xs font-bold text-muted-foreground">ضيف جزء</span>
              <div className="flex flex-wrap gap-1.5">
                {ADD_ORDER.map((t) => (
                  <Button key={t} type="button" variant="secondary" size="sm" onClick={() => updateDoc({ items: [...d.doc.items, newBlock(t)] })}>
                    <Plus className="ml-1 h-3.5 w-3.5" /> {BLOCK_LABELS[t]}
                  </Button>
                ))}
              </div>
            </section>
          </fieldset>

          <aside className={cn("lg:sticky lg:top-16 lg:self-start", mobileTab === "edit" && "hidden lg:block")}>
            <EmailPreviewFrame html={html} loading={pvLoading} error={pvError} title="كده هتوصل للمشترك" />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">المعاينة من السيرفر بنفس التصميم اللي بيوصل. «ابعت لي تجربة» علشان تشوفها في جيميل.</p>
          </aside>
        </div>
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إرسال «{d.subject}»</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm leading-7">
            <p>هتتبعت لـ <b>{fmt(confirmed)}</b> مشترك مؤكد. كل واحد ليه رابط إلغاء اشتراك خاص بيه.</p>
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">الصندوق بيبعت حوالي 65 رسالة نشرة في اليوم (والباقي محجوز للرموز والإيصالات). لو المشتركين أكتر، الإرسال بيكمل لوحده تاني يوم. تقدر توقفه من قائمة الحملات.</p>
            <label className="block space-y-1">
              <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground"><CalendarClock className="h-4 w-4" /> جدولة (اختياري)</span>
              <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
            </label>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={send} disabled={busy === "send" || confirmed === 0}>
                {busy === "send" ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Send className="ml-1 h-4 w-4" />} {at ? "جدولة" : "ابعت دلوقتي"}
              </Button>
              <Button variant="outline" onClick={() => setSendOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
