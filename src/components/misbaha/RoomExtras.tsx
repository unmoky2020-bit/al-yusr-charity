import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Check, Copy, Droplets, Facebook, HandHeart, HeartPulse, Plus, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import type { MisbahaRoom } from "@/data/api/misbahaRoomsApi";
import { roomDuas, roomShareText } from "@/data/memorialDuas";
import { track } from "@/lib/track";

const SURAHS = [
  { n: 1, ar: "الفاتحة", en: "Al-Fatiha" },
  { n: 36, ar: "يس", en: "Ya-Sin" },
  { n: 67, ar: "الملك", en: "Al-Mulk" },
  { n: 112, ar: "الإخلاص", en: "Al-Ikhlas" },
];

/** Below the counter on a shared misbaha: duas to say, Quran, ready share message, ongoing charity. */
export function RoomExtras({ isAr, room, pageUrl }: { isAr: boolean; room: MisbahaRoom; pageUrl: string }) {
  const duas = roomDuas(room.kind, room.gender, room.name);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reps, setReps] = useState<Record<string, number>>({});
  const message = `${roomShareText(room.kind, room.gender, room.name, isAr)}\n${pageUrl}`;
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
      if (id === "message") track("misbaha_share", { payload: { channel: "copy_message", room: room.slug }, fbCustom: false });
    } catch {
      /* no clipboard */
    }
  };
  const sent = (channel: string) => track("misbaha_share", { payload: { channel, room: room.slug }, fbCustom: false });
  const kind = room.kind ?? "deceased";
  const him = room.gender === "f" ? "لها" : "له";

  return (
    <section className="bg-background py-12 md:py-16" aria-label={isAr ? "أدعية ومشاركة" : "Duas and sharing"}>
      <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <h2 className="text-2xl font-black text-primary md:text-3xl">
            {kind === "deceased" ? (isAr ? `ادعُ ${him}` : "Pray for them") : kind === "sick" ? (isAr ? `ادعُ ${him} بالشفاء` : "Pray for their healing") : isAr ? "فضل الذكر الجماعي" : "Remembering together"}
          </h2>
          <ul className="mt-5 space-y-3">
            {duas.map((d) => (
              <li key={d.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <p className="text-lg font-black leading-[2] text-primary md:text-xl">{isAr ? d.text : d.en}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? d.source : d.sourceEn}</span>
                  <span className="flex items-center gap-2">
                    {d.repeat && (
                      <button type="button" onClick={() => setReps((r) => ({ ...r, [d.id]: Math.min(d.repeat!, (r[d.id] ?? 0) + 1) }))}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-black transition ${(reps[d.id] ?? 0) >= d.repeat ? "bg-secondary text-slate-950" : "bg-muted text-primary hover:bg-secondary/20"}`}>
                        {(reps[d.id] ?? 0) >= d.repeat ? <Check className="h-3.5 w-3.5" /> : null}
                        {(reps[d.id] ?? 0).toLocaleString(isAr ? "ar-EG" : "en-US")} / {d.repeat.toLocaleString(isAr ? "ar-EG" : "en-US")}
                      </button>
                    )}
                    <button type="button" onClick={() => copy(d.id, d.text)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-black text-primary hover:border-secondary">
                      {copiedId === d.id ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5" />} {copiedId === d.id ? (isAr ? "تم النسخ" : "Copied") : isAr ? "انسخ" : "Copy"}
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {kind !== "group" && (
            <div className="mt-6 rounded-3xl bg-muted/50 p-5">
              <p className="flex items-center gap-2 text-sm font-black text-primary"><BookOpen className="h-4 w-4 text-secondary" /> {isAr ? `اقرأ ما تيسّر وادعُ ${him}` : "Read some Quran and pray for them"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SURAHS.map((s) => (
                  <a key={s.n} href={`https://quran.com/${s.n}`} target="_blank" rel="noopener noreferrer"
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm font-black text-primary transition hover:border-secondary">
                    {isAr ? `سورة ${s.ar}` : `Surah ${s.en}`}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h3 className="text-lg font-black text-primary">{isAr ? "رسالة جاهزة للمجموعات" : "Ready-made message"}</h3>
            <p className="mt-1 text-xs font-bold text-muted-foreground">{isAr ? "انسخها وأرسلها، أو اختر التطبيق مباشرة." : "Copy it, or pick an app."}</p>
            <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-2xl bg-muted/50 p-3 font-sans text-sm font-bold leading-7 text-foreground/85" dir={isAr ? "rtl" : "ltr"}>{message}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => copy("message", message)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground">
                {copiedId === "message" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copiedId === "message" ? (isAr ? "تم النسخ" : "Copied") : isAr ? "انسخ الرسالة" : "Copy message"}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} onClick={() => sent("whatsapp")} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                className="grid h-10 w-10 place-items-center rounded-xl bg-[#25D366] text-white"><WhatsAppIcon className="h-4 w-4" /></a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`} onClick={() => sent("facebook")} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="grid h-10 w-10 place-items-center rounded-xl bg-[#1877F2] text-white"><Facebook className="h-4 w-4" /></a>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(roomShareText(room.kind, room.gender, room.name, isAr))}`} onClick={() => sent("telegram")} target="_blank" rel="noopener noreferrer" aria-label="Telegram"
                className="grid h-10 w-10 place-items-center rounded-xl bg-[#229ED9] text-white"><Send className="h-4 w-4" /></a>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#f3fae6] to-card p-5 ring-1 ring-secondary/30">
            {kind === "sick" ? (
              <>
                <h3 className="flex items-center gap-2 text-lg font-black text-primary"><HeartPulse className="h-5 w-5 text-secondary" /> {isAr ? "داووا مرضاكم بالصدقة" : "Charity for healing"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{isAr ? `ساهم في علاج مريض محتاج بنية شفاء ${room.name}.` : `Help treat a patient in need, with the intention of ${room.name}'s healing.`}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/cases" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-orange-grad px-4 text-sm font-black text-accent-foreground shadow-cta">{isAr ? "حالات العلاج" : "Medical cases"}</Link>
                  <Link to="/donate" className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-black text-primary">{isAr ? "صدقة عامة" : "General charity"}</Link>
                </div>
              </>
            ) : (
              <>
                <h3 className="flex items-center gap-2 text-lg font-black text-primary"><HandHeart className="h-5 w-5 text-secondary" /> {isAr ? (kind === "deceased" ? `صدقة جارية ${room.gender === "f" ? "على روحها" : "على روحه"}` : "صدقة جارية بنية المجموعة") : "An ongoing charity"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{isAr ? "يظل أجرها جاريًا: سقيا ماء أو حفر بئر أو مساهمة في حالة." : "Its reward keeps running: water, a well, or a case."}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/water" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-orange-grad px-4 text-sm font-black text-accent-foreground shadow-cta"><Droplets className="h-4 w-4" /> {isAr ? "سقيا ماء" : "Water"}</Link>
                  <Link to="/cases" className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-black text-primary">{isAr ? "ساهم في حالة" : "Fund a case"}</Link>
                  <Link to="/donate" className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-black text-primary">{isAr ? "تبرع" : "Donate"}</Link>
                </div>
              </>
            )}
          </div>

          <Link to="/misbaha#memorial" className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm font-black text-primary transition hover:border-secondary hover:bg-secondary/10">
            <Plus className="h-4 w-4" /> {isAr ? "أنشئ سبحة لشخص آخر عزيز عليك" : "Create one for someone else"}
          </Link>
        </div>
      </div>
    </section>
  );
}
