import { Link } from "react-router-dom";
import { Check, Copy, Image as ImageIcon, Plus, Share2, Sparkles, Users } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { MISBAHA_ROOMS_PENDING_AR, type MisbahaRoom } from "@/data/api/misbahaRoomsApi";
import { kindMeta, roomTagline, roomTitle } from "@/data/memorialDuas";

/** Top of a shared misbaha page: whose it is, the live shared total, and the main share actions. */
export function RoomHeader({
  isAr, state, room, waHref, copied, onCopy, onNativeShare, onStory, live, othersRecent, isNew, fmt,
}: {
  isAr: boolean;
  state: "loading" | "ok" | "missing" | "pending" | "none";
  room: MisbahaRoom | null;
  waHref: string;
  copied: boolean;
  onCopy: () => void;
  onNativeShare: (() => void) | null;
  onStory: () => void;
  /** the total is refreshed from the server */
  live: boolean;
  /** dhikr others added since the page opened */
  othersRecent: number;
  /** just created: nudge to send it now */
  isNew: boolean;
  fmt: (n: number) => string;
}) {
  if (state === "loading") return <div className="mx-auto h-40 max-w-md animate-pulse rounded-3xl bg-white/10" />;
  if (!room) {
    return (
      <div className="rounded-3xl bg-white/10 p-6">
        <h1 className="text-2xl font-black md:text-3xl">{state === "pending" ? (isAr ? "جارٍ تجهيز السبحة" : "Almost ready") : isAr ? "هذه السبحة غير متاحة" : "This tasbih is not available"}</h1>
        <p className="mt-2 text-sm text-white/80">
          {state === "pending"
            ? MISBAHA_ROOMS_PENDING_AR
            : isAr ? "قد يكون الرابط غير صحيح أو حُذفت السبحة. يمكنك التسبيح هنا كالمعتاد، أو إنشاء سبحة جديدة." : "The link may be wrong or the tasbih was removed. You can still count here, or create a new one."}
        </p>
        <Link to="/misbaha#memorial" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-black text-slate-950">
          <Plus className="h-4 w-4" /> {isAr ? "أنشئ سبحة جديدة" : "Create a new one"}
        </Link>
      </div>
    );
  }
  const meta = kindMeta(room.kind);
  const pct = room.target_total ? Math.min(100, (room.total_count / room.target_total) * 100) : 0;
  return (
    <div>
      {isNew && (
        <div className="misbaha-fade mx-auto mb-5 max-w-md rounded-2xl border border-secondary/40 bg-secondary/15 px-4 py-3 text-sm font-bold text-white">
          <Sparkles className="me-1 inline h-4 w-4 text-secondary" />
          {isAr ? "تم إنشاء السبحة. أرسلها الآن إلى مجموعات العائلة والأصدقاء، وكل من يدخل ويسبّح يزيد العدّاد." : "Created! Send it to family and friends now — everyone who joins adds to the count."}
        </div>
      )}
      <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-secondary">{isAr ? `سبحة مشتركة · ${meta.ar}` : `Shared tasbih · ${meta.en}`}</p>
      <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">{roomTitle(room.kind, room.gender, room.name, isAr)}</h1>
      <p className="mt-2 text-base font-bold text-white/80">{roomTagline(room.kind, room.gender, isAr)}</p>

      <div className="mx-auto mt-6 max-w-sm rounded-3xl bg-white/10 px-5 py-4 ring-1 ring-white/10">
        <div className="flex items-center justify-center gap-3">
          <Users className="h-6 w-6 shrink-0 text-secondary" />
          <span className="font-mono text-4xl font-black tabular-nums" aria-live="polite">{fmt(room.total_count)}</span>
        </div>
        <p className="mt-1 text-xs font-bold text-white/70">
          {isAr ? "ذكر قاله جميع المشاركين" : "dhikr said by everyone so far"}
          {live && (
            <span className="ms-2 inline-flex items-center gap-1 text-secondary">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60 motion-reduce:hidden" /><span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" /></span>
              {isAr ? "مباشر" : "live"}
            </span>
          )}
        </p>
        {othersRecent > 0 && (
          <p className="misbaha-fade mt-1 text-xs font-black text-secondary">{isAr ? `+${fmt(othersRecent)} من مشاركين آخرين منذ أن فتحت الصفحة` : `+${fmt(othersRecent)} from others since you opened`}</p>
        )}
        {room.target_total ? (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={room.target_total} aria-valuenow={Math.min(room.total_count, room.target_total)}
              aria-label={isAr ? "التقدم نحو هدف السبحة" : "Progress to the goal"}>
              <div className="h-full rounded-full bg-secondary transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs font-bold text-white/70">
              {room.total_count >= room.target_total
                ? isAr ? `بلغنا الهدف (${fmt(room.target_total)}) والحمد لله. واصلوا، فالخير لا ينتهي.` : `Goal of ${fmt(room.target_total)} reached. Keep going.`
                : isAr ? `الهدف ${fmt(room.target_total)} · المتبقي ${fmt(room.target_total - room.total_count)}` : `Goal ${fmt(room.target_total)} · ${fmt(room.target_total - room.total_count)} to go`}
            </p>
          </div>
        ) : null}
      </div>
      {room.created_by && <p className="mt-3 text-xs font-bold text-white/60">{isAr ? `أنشأها ${room.created_by}` : `Created by ${room.created_by}`}</p>}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-black text-white shadow-cta transition hover:brightness-95">
          <WhatsAppIcon className="h-4 w-4" /> {isAr ? "أرسلها عبر واتساب" : "WhatsApp"}
        </a>
        <button type="button" onClick={onStory} className="inline-flex h-11 items-center gap-2 rounded-xl bg-secondary px-5 text-sm font-black text-slate-950 shadow-cta transition hover:-translate-y-0.5">
          <ImageIcon className="h-4 w-4" /> {isAr ? "صورة للستوري" : "Story image"}
        </button>
        <button type="button" onClick={onCopy} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-black text-white hover:bg-white/10">
          {copied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />} {copied ? (isAr ? "تم النسخ" : "Copied") : isAr ? "انسخ الرابط" : "Copy link"}
        </button>
        {onNativeShare && (
          <button type="button" onClick={onNativeShare} className="grid h-11 w-11 place-items-center rounded-xl border border-white/25 text-white hover:bg-white/10" aria-label={isAr ? "مشاركة" : "Share"}>
            <Share2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
