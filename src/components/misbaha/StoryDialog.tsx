import { useEffect, useState } from "react";
import { ImageDown, Share2, X } from "lucide-react";
import { drawMisbahaStory } from "@/lib/misbahaStoryImage";
import { track } from "@/lib/track";
import type { MisbahaRoom } from "@/data/api/misbahaRoomsApi";
import { kindMeta, roomTagline, roomTitle } from "@/data/memorialDuas";

/** Story-size image of a shared misbaha, ready to post on WhatsApp status / Instagram / Facebook. */
export function StoryDialog({ isAr, room, pageUrl, onClose }: { isAr: boolean; room: MisbahaRoom; pageUrl: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [failed, setFailed] = useState(false);
  const locale = isAr ? "ar-EG" : "en-US";

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    const meta = kindMeta(room.kind);
    drawMisbahaStory({
      kicker: isAr ? `سبحة مشتركة · ${meta.ar}` : `Shared tasbih · ${meta.en}`,
      title: roomTitle(room.kind, room.gender, room.name, isAr),
      tagline: roomTagline(room.kind, room.gender, isAr),
      total: room.total_count,
      totalLabel: isAr ? "ذكر لحد دلوقتي" : "dhikr so far",
      goalLine: room.target_total ? (isAr ? `الهدف ${room.target_total.toLocaleString(locale)} ذكر — شاركنا` : `Goal: ${room.target_total.toLocaleString(locale)} — join us`) : undefined,
      cta: isAr ? "امسح الكود وسبّح معانا" : "Scan and join in",
      url: `${pageUrl}?utm_source=story&utm_medium=share&utm_campaign=misbaha`,
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
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fileName = `misbaha-${room.slug}.png`;
  const file = blob ? new File([blob], fileName, { type: "image/png" }) : null;
  const canShareFile = !!file && typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [file] });
  const shareImage = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file], text: `${roomTitle(room.kind, room.gender, room.name, isAr)}\n${pageUrl}` });
      track("misbaha_share", { payload: { channel: "story_image", room: room.slug }, fbCustom: false });
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={isAr ? "صورة الستوري" : "Story image"} onClick={onClose}>
      <div className="relative flex max-h-[94vh] w-full max-w-xs flex-col rounded-3xl bg-card p-4 shadow-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute end-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-muted text-primary" aria-label={isAr ? "إغلاق" : "Close"}><X className="h-4 w-4" /></button>
        <h2 className="pe-10 text-base font-black text-primary">{isAr ? "صورة للستوري والحالة" : "Story & status image"}</h2>
        <p className="mt-0.5 text-xs font-bold text-muted-foreground">{isAr ? "حمّلها وانشرها، واللي يشوفها يمسح الكود ويشارك." : "Save and post it; viewers scan the code to join."}</p>
        <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl bg-muted">
          {url ? <img src={url} alt={isAr ? "صورة السبحة للستوري" : "Tasbih story image"} className="mx-auto block max-h-[62vh] w-auto" /> : (
            <div className="grid aspect-[9/16] place-items-center text-sm text-muted-foreground">{failed ? (isAr ? "تعذر تجهيز الصورة" : "Could not create the image") : (isAr ? "بنجهّز الصورة..." : "Preparing...")}</div>
          )}
        </div>
        <div className="mt-3 grid gap-2">
          {canShareFile && (
            <button type="button" onClick={shareImage} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-grad font-black text-accent-foreground shadow-cta">
              <Share2 className="h-4 w-4" /> {isAr ? "انشرها ستوري / حالة" : "Post as story"}
            </button>
          )}
          {url && (
            <a href={url} download={fileName} onClick={() => track("misbaha_share", { payload: { channel: "story_download", room: room.slug }, fbCustom: false })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border font-black text-primary hover:border-secondary">
              <ImageDown className="h-4 w-4" /> {isAr ? "حمّل الصورة" : "Download"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
