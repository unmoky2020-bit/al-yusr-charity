/**
 * «تبرّع بنية …» on a shared misbaha: a swipeable row of real open cases (published, not yet
 * funded), each opening the donate form on that case. While there are no published cases the row
 * shows the ongoing-charity programs instead (water, mosques, Quran nurseries, orphans), never
 * made-up cases.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Droplets, HeartHandshake, Landmark } from "lucide-react";
import { useRef } from "react";
import { listPublicCases, CASE_PLACEHOLDER_IMAGE, type CaseRow } from "@/data/casesApi";
import { caseFunding, filterOpenCases } from "@/lib/caseFunding";
import { track } from "@/lib/track";

type Props = { isAr: boolean; roomSlug?: string; roomName?: string; kind?: "deceased" | "sick" | "group" };

const JARIYA = [
  { to: "/water", ar: "سقيا ماء", en: "Clean water", descAr: "وصلة مياه لبيت محتاج، أجرها جارٍ ما شرب منها أحد.", Icon: Droplets },
  { to: "/mosques", ar: "إعمار مسجد", en: "Build a mosque", descAr: "مساهمة في بناء أو ترميم مسجد في قرى مصر.", Icon: Landmark },
  { to: "/nurseries", ar: "حضانات القرآن", en: "Quran nurseries", descAr: "طفل يحفظ القرآن، وكل آية يقرأها في ميزانك.", Icon: BookOpen },
  { to: "/programs/orphans", ar: "كفالة يتيم", en: "Sponsor an orphan", descAr: "«أنا وكافل اليتيم في الجنة هكذا».", Icon: HeartHandshake },
];

export function MisbahaGiveCarousel({ isAr, roomSlug, roomName, kind = "deceased" }: Props) {
  const rail = useRef<HTMLDivElement>(null);
  const { data: cases = [] } = useQuery({
    queryKey: ["misbaha-open-cases"],
    queryFn: async () => filterOpenCases(await listPublicCases({ limit: 30 })).slice(0, 10),
    staleTime: 5 * 60_000,
  });
  const forWhom = roomName ? (kind === "sick" ? `بنية شفاء ${roomName}` : kind === "deceased" ? `على روح ${roomName}` : `بنية «${roomName}»`) : "";
  const clicked = (target: string) => track("misbaha_give_click", { payload: { room: roomSlug ?? "", target }, fbCustom: false });
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: (isAr ? -1 : 1) * dir * 300, behavior: "smooth" });
  const hasCases = cases.length > 0;

  return (
    <section className="bg-muted/30 py-10 md:py-14" aria-labelledby="misbaha-give">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="misbaha-give" className="text-2xl font-black text-primary md:text-3xl">
              {isAr ? (hasCases ? "حالات محتاجة دلوقتي" : "صدقة جارية") : hasCases ? "Cases in need now" : "Ongoing charity"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAr
                ? `${hasCases ? "تبرّع لحالة" : "اختار صدقة جارية"}${forWhom ? ` ${forWhom}` : ""}، وأجرها يوصل مع كل ذكر بيتقال هنا.`
                : "Give alongside your dhikr."}
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => scroll(-1)} aria-label={isAr ? "السابق" : "Previous"} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-primary hover:border-secondary">
              {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label={isAr ? "التالي" : "Next"} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-primary hover:border-secondary">
              {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div ref={rail} className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {hasCases
            ? cases.map((c) => <CaseSlide key={c.id} c={c} isAr={isAr} onGo={() => clicked(`case:${c.ref_code}`)} />)
            : JARIYA.map((j) => (
                <Link key={j.to} to={j.to} onClick={() => clicked(j.to)}
                  className="group flex w-[78%] shrink-0 snap-start flex-col rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:border-secondary sm:w-[46%] lg:w-[23.5%]">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-primary"><j.Icon className="h-6 w-6" /></span>
                  <h3 className="mt-3 text-lg font-black text-primary">{isAr ? j.ar : j.en}</h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{j.descAr}</p>
                  <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-grad px-4 text-sm font-black text-accent-foreground shadow-cta">
                    {isAr ? "تبرّع" : "Give"}
                  </span>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

function CaseSlide({ c, isAr, onGo }: { c: CaseRow; isAr: boolean; onGo: () => void }) {
  const f = caseFunding(c);
  const pct = f.pct;
  const img = c.cover_image_url && c.cover_image_url !== CASE_PLACEHOLDER_IMAGE ? c.cover_image_url : CASE_PLACEHOLDER_IMAGE;
  return (
    <article className="flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft sm:w-[46%] lg:w-[23.5%]">
      <img src={img} alt={img === CASE_PLACEHOLDER_IMAGE ? "" : c.title} className="aspect-[4/3] w-full object-cover" loading="lazy" decoding="async" />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-black text-primary">{c.title}</h3>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-[11.5px] font-bold text-muted-foreground">
          {isAr ? `فاضل ${f.remaining.toLocaleString("en-US")} ج` : `${f.remaining.toLocaleString("en-US")} EGP to go`}
        </p>
        <div className="mt-3 flex gap-2">
          <Link to={`/donate?case=${encodeURIComponent(c.ref_code)}`} onClick={onGo}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-orange-grad px-3 text-sm font-black text-accent-foreground shadow-cta">
            {isAr ? "تبرّع للحالة" : "Give"}
          </Link>
          <Link to={`/cases/${encodeURIComponent(c.ref_code)}`} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-black text-primary">
            {isAr ? "التفاصيل" : "Details"}
          </Link>
        </div>
      </div>
    </article>
  );
}
