import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { READER_SURAHS } from "@/data/quranSurahs";

/**
 * Read a surah on the site, laid out like a Mushaf page: one continuous text with a numbered
 * end-of-verse mark after each verse (not one verse per line). The text is the Tanzil Uthmani
 * text, kept as static files in public/quran/{number}.json (built by scripts/quran/fetch-surahs.py).
 */

type Surah = { number: number; name: string; basmala: boolean; basmalaText: string; ayahs: string[] };

const SIZE_KEY = "yusr-quran-size";
const SIZES = [22, 26, 30, 34, 40];
const cache = new Map<number, Surah>();
const arNum = (n: number) => n.toLocaleString("ar-EG");

export function QuranReader({ isAr, initial, onClose }: { isAr: boolean; initial: number; onClose: () => void }) {
  const [n, setN] = useState(initial);
  const [surah, setSurah] = useState<Surah | null>(cache.get(initial) ?? null);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState(() => {
    try { const v = Number(localStorage.getItem(SIZE_KEY)); return SIZES.includes(v) ? v : SIZES[1]; } catch { return SIZES[1]; }
  });

  useEffect(() => {
    let alive = true;
    setFailed(false);
    const hit = cache.get(n);
    if (hit) { setSurah(hit); return; }
    setSurah(null);
    fetch(`/quran/${n}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((s: Surah) => { cache.set(n, s); if (alive) setSurah(s); })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [n]);

  useEffect(() => {
    try { localStorage.setItem(SIZE_KEY, String(size)); } catch { /* fine */ }
  }, [size]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const step = (d: 1 | -1) => setSize((s) => SIZES[Math.max(0, Math.min(SIZES.length - 1, SIZES.indexOf(s) + d))]);
  const meta = READER_SURAHS.find((s) => s.n === n) ?? READER_SURAHS[0];

  return (
    <div className="fixed inset-0 z-[160] flex flex-col bg-[#f6efdc]" role="dialog" aria-modal="true" aria-label={isAr ? `سورة ${meta.ar}` : `Surah ${meta.en}`}>
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-[#d9c79c] bg-[#06301c] px-3 py-2 text-white pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={isAr ? "إغلاق" : "Close"}>
          <X className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto" role="tablist" aria-label={isAr ? "السور" : "Surahs"}>
          {READER_SURAHS.map((s) => (
            <button key={s.n} type="button" role="tab" aria-selected={s.n === n} onClick={() => setN(s.n)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-black transition ${s.n === n ? "bg-secondary text-slate-950" : "bg-white/10 text-white hover:bg-white/20"}`}>
              {isAr ? s.ar : s.en}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1" role="group" aria-label={isAr ? "حجم الخط" : "Text size"}>
          <button type="button" onClick={() => step(-1)} disabled={size === SIZES[0]} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 disabled:opacity-30" aria-label={isAr ? "تصغير الخط" : "Smaller text"}><Minus className="h-4 w-4" /></button>
          <button type="button" onClick={() => step(1)} disabled={size === SIZES[SIZES.length - 1]} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 disabled:opacity-30" aria-label={isAr ? "تكبير الخط" : "Larger text"}><Plus className="h-4 w-4" /></button>
        </div>
      </div>

      {/* page */}
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-8">
        <article className="mx-auto max-w-2xl rounded-[1.25rem] border-[3px] border-double border-[#b8975a] bg-[#fffaf0] p-1.5 shadow-[0_10px_40px_-18px_rgba(80,60,20,0.45)]">
          <div className="rounded-[1rem] border border-[#d9c79c] px-4 pb-8 pt-5 sm:px-8">
            {/* surah title band */}
            <div className="relative mx-auto flex max-w-sm items-center justify-center rounded-full border-2 border-[#b8975a] bg-gradient-to-b from-[#0b4429] to-[#06301c] px-6 py-2 text-center shadow-sm">
              <span className="absolute -start-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-2 border-[#b8975a] bg-[#fffaf0]" aria-hidden />
              <span className="absolute -end-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-2 border-[#b8975a] bg-[#fffaf0]" aria-hidden />
              <h2 className="text-xl text-[#f3e3b3]" style={{ fontFamily: "'Amiri Quran', serif" }}>
                سُورَةُ {meta.ar}
              </h2>
            </div>
            {surah && (
              <p className="mt-1.5 text-center text-xs font-bold text-[#7a6435]">{isAr ? `آياتها ${arNum(surah.ayahs.length)}` : `${surah.ayahs.length} verses`}</p>
            )}

            {!surah ? (
              <p className="py-16 text-center text-sm font-bold text-[#7a6435]">{failed ? (isAr ? "تعذّر تحميل السورة، حاول مرة أخرى." : "Could not load the surah.") : isAr ? "جارٍ التحميل…" : "Loading…"}</p>
            ) : (
              <>
                {surah.basmala && surah.basmalaText && (
                  <p className="mt-5 text-center text-[#06301c]" style={{ fontFamily: "'Amiri Quran', serif", fontSize: size, lineHeight: 2 }}>{surah.basmalaText}</p>
                )}
                <p
                  dir="rtl"
                  lang="ar"
                  className="mt-3 text-justify text-[#1c1a14] [text-align-last:center]"
                  style={{ fontFamily: "'Amiri Quran', serif", fontSize: size, lineHeight: 2.35, wordSpacing: "0.05em" }}
                >
                  {surah.ayahs.map((a, i) => (
                    <span key={i}>
                      {a}
                      {" "}
                      <span
                        className="mx-0.5 inline-grid h-[1.35em] min-w-[1.35em] place-items-center rounded-full border border-[#b8975a] bg-[#fff6dc] px-[0.15em] align-middle text-[0.55em] leading-none text-[#7a5a1e]"
                        style={{ fontFamily: "'Droid Arabic Kufi', sans-serif" }}
                        aria-label={isAr ? `نهاية الآية ${arNum(i + 1)}` : `end of verse ${i + 1}`}
                      >
                        {arNum(i + 1)}
                      </span>{" "}
                    </span>
                  ))}
                </p>
              </>
            )}
          </div>
        </article>
        {/* Tanzil's terms: the text is used unchanged and its source is shown. */}
        <p className="mx-auto mt-3 max-w-2xl text-center text-[11px] font-bold text-[#7a6435]/80">
          {isAr ? "نص المصحف بالرسم العثماني من " : "Uthmani Quran text from "}
          <a href="https://tanzil.net" target="_blank" rel="noopener noreferrer" className="underline">Tanzil.net</a>
        </p>
      </div>
    </div>
  );
}
