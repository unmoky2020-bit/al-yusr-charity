import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Globe2 } from "lucide-react";
import { misbahaRoomsApi } from "@/data/api/misbahaRoomsApi";

/** The standing public misbaha everyone shares (created once on the server with this slug). */
export const UMMAH_ROOM_SLUG = "ummah";

/**
 * «سبحة الأمة» on /misbaha: one shared count for everyone — dhikr and dua for all Muslims,
 * living and dead. A slim strip inside the page hero, shown at once; the count joins when it loads.
 */
export function UmmahRoomCard({ isAr }: { isAr: boolean }) {
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    misbahaRoomsApi.get(UMMAH_ROOM_SLUG).then((r) => alive && r && setTotal(Number(r.total_count) || 0)).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  return (
    <Link
      to={`/misbaha/${UMMAH_ROOM_SLUG}`}
      dir={isAr ? "rtl" : "ltr"}
      className="keep-flow group mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-secondary/40 bg-[hsl(152_60%_12%)] p-3 text-start shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] transition hover:border-secondary/80 hover:bg-[hsl(152_60%_14%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary sm:gap-4 sm:p-4"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground sm:h-12 sm:w-12">
        <Globe2 className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-black leading-snug text-white sm:text-lg">{isAr ? "سبحة جميع المسلمين والمسلمات" : "The misbaha of all Muslims"}</span>
        <span className="mt-0.5 block text-xs font-bold leading-relaxed text-white/70 sm:text-sm">
          {total !== null && total > 0 && (
            <><span className="font-mono font-black tabular-nums text-secondary" dir="ltr">{total.toLocaleString("en-US")}</span>{" "}{isAr ? "ذكر · " : "dhikr · "}</>
          )}
          {isAr ? "للأحياء والأموات" : "for the living and the dead"}<span className="hidden sm:inline">{isAr ? "، عدّاد واحد للكل" : ", one shared count"}</span>
        </span>
      </span>
      <span className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-secondary px-3 text-sm font-black text-secondary-foreground sm:px-4">
        {isAr ? "شارك" : "Join"}<Arrow className="h-4 w-4 transition group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0" />
      </span>
    </Link>
  );
}
