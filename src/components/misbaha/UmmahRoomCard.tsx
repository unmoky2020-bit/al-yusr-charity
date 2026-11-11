import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Globe2 } from "lucide-react";
import { misbahaRoomsApi } from "@/data/api/misbahaRoomsApi";

/** The standing public misbaha everyone shares (created once on the server with this slug). */
export const UMMAH_ROOM_SLUG = "ummah";

/**
 * «سبحة الأمة» on /misbaha: one shared count for everyone — dhikr and dua for all Muslims,
 * living and dead. Hidden when the room can't be loaded.
 */
export function UmmahRoomCard({ isAr }: { isAr: boolean }) {
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    misbahaRoomsApi.get(UMMAH_ROOM_SLUG).then((r) => alive && r && setTotal(Number(r.total_count) || 0)).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  if (total === null) return null;
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  return (
    <section className="bg-background pt-10 md:pt-14" dir={isAr ? "rtl" : "ltr"}>
      <div className="container mx-auto max-w-3xl px-4">
        <Link
          to={`/misbaha/${UMMAH_ROOM_SLUG}`}
          className="keep-flow group relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-card transition hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary sm:flex-row sm:items-center sm:gap-6 sm:p-7"
        >
          <span aria-hidden className="pointer-events-none absolute -top-16 end-[-3rem] h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
            <Globe2 className="h-6 w-6" />
          </span>
          <span className="relative min-w-0 flex-1 text-start">
            <span className="block text-[11px] font-black text-secondary">{isAr ? "سبحة مفتوحة للجميع" : "One misbaha for everyone"}</span>
            <span className="mt-0.5 block text-xl font-black leading-snug sm:text-2xl">{isAr ? "سبحة جميع المسلمين والمسلمات" : "The misbaha of all Muslims"}</span>
            <span className="mt-1.5 block text-sm leading-relaxed text-primary-foreground/80">
              {isAr
                ? "اذكر الله وادعُ للمسلمين والمسلمات، الأحياء منهم والأموات. كل ذكر بيتضاف لعدّاد واحد يشارك فيه الكل."
                : "Remember Allah and pray for all Muslims, living and dead. Every dhikr adds to one count shared by all."}
            </span>
          </span>
          <span className="relative flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
            <span className="text-start sm:text-end">
              <span className="block font-mono text-2xl font-black tabular-nums text-secondary" dir="ltr">{total.toLocaleString("en-US")}</span>
              <span className="block text-[11px] font-bold text-primary-foreground/70">{isAr ? "ذكر اتقال لحد دلوقتي" : "dhikr so far"}</span>
            </span>
            <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-secondary px-4 text-sm font-black text-secondary-foreground">
              {isAr ? "شارك الآن" : "Join now"}<Arrow className="h-4 w-4 transition group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0" />
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
