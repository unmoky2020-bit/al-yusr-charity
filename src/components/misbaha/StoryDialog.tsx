import { useEffect, useState } from "react";
import { Check, Copy, Facebook, ImageDown, Instagram, Send, Share2, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { drawMisbahaStory } from "@/lib/misbahaStoryImage";
import { track } from "@/lib/track";
import type { MisbahaRoom } from "@/data/api/misbahaRoomsApi";
import { kindMeta, roomShareText, roomTagline, roomTitle } from "@/data/memorialDuas";

const XIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
    <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.7H5.58l11.09 14.5Z" />
  </svg>
);

/**
 * «شارك السبحة»: a story-size image (WhatsApp status, Instagram / Facebook stories) with a QR code,
 * plus every way to send the link. Above the site header (z-[150]) and sized to any screen.
 */
export function StoryDialog({ isAr, room, pageUrl, onClose }: { isAr: boolean; room: MisbahaRoom; pageUrl: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const locale = isAr ? "ar-EG" : "en-US";
  const title = roomTitle(room.kind, room.gender, room.name, isAr);
  const link = (source: string) => `${pageUrl}?utm_source=${source}&utm_medium=share&utm_campaign=misbaha`;
  const text = roomShareText(room.kind, room.gender, room.name, isAr);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    const meta = kindMeta(room.kind);
    drawMisbahaStory({
      kicker: isAr ? `سبحة مشتركة · ${meta.ar}` : `Shared tasbih · ${meta.en}`,
      title,
      tagline: roomTagline(room.kind, room.gender, isAr),
      total: room.total_count,
      totalLabel: isAr ? "ذكر حتى الآن" : "dhikr so far",
      zeroText: isAr ? "كن أول من يسبّح" : "Be the first",
      progress: room.target_total ? room.total_count / room.target_total : 0,
      goalLine: room.target_total ? (isAr ? `الهدف ${room.target_total.toLocaleString(locale)} ذكر — شاركنا` : `Goal: ${room.target_total.toLocaleString(locale)} — join us`) : undefined,
      cta: isAr ? "امسح الرمز وسبّح معنا" : "Scan and join in",
      url: link("story"),
      rtl: isAr,
      locale,
    })
      .then((b) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // drawn once per opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const sent = (channel: string) => track("misbaha_share", { payload: { channel, room: room.slug }, fbCustom: false });
  const fileName = `misbaha-${room.slug}.png`;
  const file = blob ? new File([blob], fileName, { type: "image/png" }) : null;
  const canShareFile = !!file && typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [file] });
  const shareImage = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file], text: `${title}\n${link("story")}` });
      sent("story_image");
    } catch {
      /* dismissed */
    }
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link("copy"));
      setCopied(true);
      sent("copy");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* no clipboard */
    }
  };

  const apps = [
    { key: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon, cls: "bg-[#25D366] text-white", href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${link("whatsapp")}`)}` },
    { key: "telegram", label: "Telegram", Icon: Send, cls: "bg-[#229ED9] text-white", href: `https://t.me/share/url?url=${encodeURIComponent(link("telegram"))}&text=${encodeURIComponent(text)}` },
    { key: "facebook", label: "Facebook", Icon: Facebook, cls: "bg-[#1877F2] text-white", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link("facebook"))}` },
    { key: "x", label: "X", Icon: XIcon, cls: "bg-black text-white", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link("x"))}` },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={isAr ? "شارك السبحة" : "Share the tasbih"} onClick={onClose}>
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-card shadow-card sm:max-w-3xl sm:rounded-[1.75rem] md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute end-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-muted text-primary hover:bg-secondary/30" aria-label={isAr ? "إغلاق" : "Close"}>
          <X className="h-4 w-4" />
        </button>

        {/* preview */}
        <div className="flex shrink-0 items-center justify-center bg-[#06301c] p-4 md:w-[46%] md:p-6">
          {url ? (
            <img src={url} alt={isAr ? "صورة السبحة للستوري" : "Tasbih story image"} className="max-h-[34dvh] w-auto rounded-2xl shadow-2xl md:max-h-[70dvh]" />
          ) : (
            <div className="grid aspect-[9/16] h-[34dvh] place-items-center rounded-2xl bg-white/5 text-sm font-bold text-white/70 md:h-[60dvh]">
              {failed ? (isAr ? "تعذر تجهيز الصورة" : "Could not create the image") : (isAr ? "جارٍ تجهيز الصورة…" : "Preparing…")}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <h2 className="pe-10 text-lg font-black text-primary">{isAr ? "شارك السبحة" : "Share the tasbih"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr ? "كل من يدخل من رابطك ويسبّح يُضاف ذكره إلى العدّاد. والدال على الخير كفاعله." : "Everyone who joins from your link adds to the count."}
          </p>

          <p className="mt-5 text-xs font-black text-muted-foreground">{isAr ? "صورة للستوري والحالة" : "Story & status image"}</p>
          <div className="mt-2 grid gap-2">
            {canShareFile && (
              <button type="button" onClick={shareImage} disabled={!file}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-grad font-black text-accent-foreground shadow-cta disabled:opacity-50">
                <Share2 className="h-4 w-4" /> {isAr ? "انشرها ستوري (واتساب · إنستجرام · فيسبوك)" : "Post as a story"}
              </button>
            )}
            <a href={url ?? undefined} download={fileName} aria-disabled={!url} onClick={() => url && sent("story_download")}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border font-black text-primary transition hover:border-secondary ${url ? "" : "pointer-events-none opacity-50"}`}>
              <ImageDown className="h-4 w-4" /> {isAr ? "حمّل الصورة" : "Download the image"}
            </a>
          </div>

          <p className="mt-5 text-xs font-black text-muted-foreground">{isAr ? "أرسل الرابط" : "Send the link"}</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {apps.map(({ key, label, Icon, cls, href }) => (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer" onClick={() => sent(key)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 text-[11px] font-black transition hover:brightness-95 ${cls}`}>
                <Icon className="h-5 w-5" /> {label}
              </a>
            ))}
          </div>
          <button type="button" onClick={copyLink}
            className="mt-2 flex h-12 w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 text-start transition hover:border-secondary">
            {copied ? <Check className="h-4 w-4 shrink-0 text-secondary" /> : <Copy className="h-4 w-4 shrink-0 text-primary" />}
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground" dir="ltr">{pageUrl.replace(/^https?:\/\//, "")}</span>
            <span className="shrink-0 text-xs font-black text-primary">{copied ? (isAr ? "تم النسخ" : "Copied") : isAr ? "انسخ" : "Copy"}</span>
          </button>

          <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#fdf2f8] via-[#f5f3ff] to-[#fff7ed] p-4">
            <p className="flex items-center gap-2 text-sm font-black text-primary"><Instagram className="h-4 w-4 text-[#d62976]" /> {isAr ? "على إنستجرام" : "On Instagram"}</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-xs leading-6 text-foreground/75">
              <li>{isAr ? "حمّل الصورة، أو اضغط «انشرها ستوري» من هاتفك." : "Save the image, or tap “Post as a story” on your phone."}</li>
              <li>{isAr ? "أضف إلى الستوري ملصق «Link» والصق رابط السبحة." : "Add a “Link” sticker and paste the tasbih link."}</li>
              <li>{isAr ? "ومن لا يضغط على الرابط يمكنه مسح الرمز الموجود في الصورة." : "Anyone can also scan the code on the image."}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
