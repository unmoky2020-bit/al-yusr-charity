import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, ChevronRight, Inbox, Mail, MessageCircle, Phone, Search, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ChoiceSelect } from "@/components/admin/programs/FormKit";
import { describeWriteError } from "@/data/api/backendPending";
import { FOUNDATION_WHATSAPP } from "@/data/api/contactApi";
import {
  CONTACT_SECTION_LABELS,
  CONTACT_STATUS_LABELS,
  contactMessagesApi,
  type ContactMessage,
  type ContactStatus,
} from "@/data/api/contactMessagesApi";
import { timeAgoAr } from "@/components/notifications/NotificationItem";

const STATUS_TONE: Record<ContactStatus, string> = {
  new: "bg-rose-500/15 text-rose-700",
  read: "bg-amber-500/15 text-amber-700",
  replied: "bg-emerald-500/15 text-emerald-700",
  archived: "bg-muted text-muted-foreground",
};

/** Normalise an Egyptian mobile (01xxxxxxxxx) to the international form wa.me expects. */
const waNumber = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "20");

/** «تواصل معنا» messages: filter, open, mark replied, reply by WhatsApp / email. */
export default function AdminInbox() {
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [section, setSection] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await contactMessagesApi.list({ page, status, section, search: query });
      setRows(r.data ?? []);
      setMeta({ current_page: r.current_page, last_page: r.last_page, total: r.total });
    } catch (e) {
      toast.error(describeWriteError(e, "GET /contact-messages"));
    } finally {
      setLoading(false);
    }
  }, [page, status, section, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (m: ContactMessage, next: ContactStatus) => {
    setRows((r) => r.map((x) => (x.id === m.id ? { ...x, status: next } : x)));
    try {
      await contactMessagesApi.setStatus(m.id, next);
    } catch (e) {
      toast.error(describeWriteError(e));
      void load();
    }
  };

  const open = (m: ContactMessage) => {
    setOpenId(openId === m.id ? null : m.id);
    if (m.status === "new") void changeStatus(m, "read");
  };

  const remove = async (m: ContactMessage) => {
    if (!window.confirm(`حذف رسالة ${m.name}؟`)) return;
    try {
      await contactMessagesApi.remove(m.id);
      setRows((r) => r.filter((x) => x.id !== m.id));
    } catch (e) {
      toast.error(describeWriteError(e));
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>رسائل تواصل معنا — Al-Yusr</title></Helmet>
      <div className="space-y-4" dir="rtl">
        <div>
          <h1 className="text-2xl font-black text-primary">رسائل «تواصل معنا»</h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.total} رسالة. كل رسالة جديدة بيوصل عنها إشعار.</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_12rem_12rem]">
          <form className="relative" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الموبايل أو الإيميل أو الكود…" className="h-10 rounded-xl ps-10" />
          </form>
          <ChoiceSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} noneLabel="كل الحالات"
            options={Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
          <ChoiceSelect value={section} onChange={(v) => { setSection(v); setPage(1); }} noneLabel="كل الأقسام"
            options={Object.entries(CONTACT_SECTION_LABELS).map(([value, label]) => ({ value, label }))} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {loading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-sm text-muted-foreground"><Inbox className="h-10 w-10 opacity-50" /> مفيش رسائل</div>
          ) : (
            rows.map((m) => (
              <div key={m.id} className="border-b border-border/60 last:border-0">
                <button type="button" onClick={() => open(m)} className={`flex w-full items-center gap-3 p-4 text-start hover:bg-muted/50 ${m.status === "new" ? "bg-secondary/10" : ""}`}>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${STATUS_TONE[m.status]}`}>{CONTACT_STATUS_LABELS[m.status]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-foreground">{m.name} <span className="font-semibold text-muted-foreground">— {CONTACT_SECTION_LABELS[m.section] ?? m.section}</span></div>
                    <div className="truncate text-xs text-muted-foreground">{m.message}</div>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgoAr(m.created_at)}</span>
                </button>
                {openId === m.id && (
                  <div className="space-y-3 bg-muted/30 px-4 pb-4">
                    <p className="whitespace-pre-wrap rounded-xl bg-card p-3 text-sm leading-relaxed">{m.message}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground">{m.ref_code}</span>
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 font-bold hover:bg-muted"><Mail className="h-3.5 w-3.5" /> {m.email}</a>
                      {m.phone && (
                        <>
                          <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 font-bold hover:bg-muted" dir="ltr"><Phone className="h-3.5 w-3.5" /> {m.phone}</a>
                          <a target="_blank" rel="noreferrer"
                            href={`https://wa.me/${waNumber(m.phone)}?text=${encodeURIComponent(`أهلاً ${m.name}، معاك مؤسسة اليسر بخصوص رسالتك (${m.ref_code}).`)}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-bold text-white hover:bg-emerald-700">
                            <MessageCircle className="h-3.5 w-3.5" /> رد على واتساب
                          </a>
                        </>
                      )}
                      <div className="ms-auto flex gap-1.5">
                        {m.status !== "replied" && <Button size="sm" variant="outline" onClick={() => void changeStatus(m, "replied")}>اترد عليها</Button>}
                        {m.status !== "archived" && <Button size="sm" variant="outline" onClick={() => void changeStatus(m, "archived")}>أرشفة</Button>}
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => void remove(m)} aria-label="حذف"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">رقم المؤسسة على واتساب: {FOUNDATION_WHATSAPP}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="السابق"><ChevronRight className="h-4 w-4" /></Button>
            <span className="text-sm font-bold">{meta.current_page} / {meta.last_page}</span>
            <Button size="icon" variant="outline" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} aria-label="التالي"><ChevronLeft className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
