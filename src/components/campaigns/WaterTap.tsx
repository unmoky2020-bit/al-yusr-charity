import { useState } from "react";
import { Droplets, PersonStanding, HeartPulse, Footprints, CloudOff, Smile, ShieldCheck } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

/**
 * Interactive "open the tap" scene for the water project: a wall tap, a simple child holding a cup.
 * Closed: dry tap, sad child, the "before" hardships. Open: water flows, the cup fills, the child
 * smiles and the "after" benefits appear. Pure SVG + CSS (classes wtap-* in index.css).
 */
const BEFORE = [
  { icon: Footprints, ar: "مشوار بعيد وجركن ثقيل", en: "A long walk and a heavy jerrycan", bodyAr: "أمهات وآباء يحملون الماء من مسافات بعيدة كل يوم، وكثير منه غير نظيف.", bodyEn: "Mothers and fathers carry water from far away every day, often unclean." },
  { icon: HeartPulse, ar: "ماء ملوث يُمرض الصغير والكبير", en: "Dirty water makes young and old sick", bodyAr: "الأطفال وكبار السن أول من يتأذى من الماء الملوث: إسهال ونزلات معوية وأمراض في الكلى.", bodyEn: "Children and the elderly are first to suffer from dirty water: diarrhoea, stomach and kidney illness." },
  { icon: CloudOff, ar: "حين ينقطع الماء تتوقف الحياة", en: "When water stops, life stops", bodyAr: "لا طبخ ولا غسيل ولا وضوء ولا نظافة للأطفال، والبيت كله يعيش في قلق.", bodyEn: "No cooking, washing, ablution or bathing the children; the whole home lives in worry." },
];

const AFTER = [
  { icon: ShieldCheck, ar: "أمان لصحة الأطفال", en: "Safety for children's health", bodyAr: "الماء النظيف في البيت يعني أمراضًا أقل، وطفلًا يذهب إلى مدرسته بصحة جيدة.", bodyEn: "Clean water at home means less illness and children who go to school healthy." },
  { icon: PersonStanding, ar: "رعاية لكبار السن", en: "Care for the elderly", bodyAr: "يشرب كبير السن ويتوضأ دون أن ينتظر من يحضر له الماء.", bodyEn: "Elders can drink and make ablution without waiting for someone to fetch water." },
  { icon: Smile, ar: "راحة للأم والأب", en: "Relief for mothers and fathers", bodyAr: "يعود وقت المشوار وجهده إلى البيت والعمل والأولاد.", bodyEn: "The time and effort of the walk go back to home, work and children." },
];

const SKIN = "hsl(24 55% 69%)";
const SKIN_SHADE = "hsl(23 52% 66%)";
const CUP = "M184 198 H216 L211 236 Q210 241 205 241 H195 Q190 241 189 236 Z";

export const WaterTap = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  const items = open ? AFTER : BEFORE;

  return (
    <div className={`wtap ${open ? "wtap-open" : ""} grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]`}>
      <div className="relative mx-auto w-full max-w-md rounded-[2rem] bg-gradient-to-b from-sky-50 to-sky-100 p-4 ring-1 ring-sky-200 dark:from-slate-900 dark:to-slate-800 dark:ring-slate-700">
        <svg viewBox="0 0 360 300" className="h-auto w-full" role="img" aria-label={isAr ? (open ? "الحنفية مفتوحة والطفل سعيد بالماء النظيف" : "الحنفية مغلقة والطفل ينتظر الماء") : open ? "The tap is open and the child is happy" : "The tap is closed and the child is waiting"}>
          {/* wall tiles */}
          <g stroke="hsl(200 40% 80% / 0.6)" strokeWidth="1">
            <line x1="0" y1="100" x2="360" y2="100" /><line x1="0" y1="20" x2="360" y2="20" />
            <line x1="120" y1="20" x2="120" y2="100" /><line x1="240" y1="20" x2="240" y2="100" />
          </g>
          {/* ground */}
          <rect x="10" y="280" width="340" height="8" rx="4" fill="hsl(200 30% 70% / 0.45)" />
          {/* pipe from wall */}
          <rect x="250" y="44" width="110" height="16" rx="3" fill="hsl(210 10% 62%)" />
          {/* tap body + spout */}
          <rect x="222" y="36" width="40" height="32" rx="8" fill="hsl(210 12% 72%)" />
          <path d="M232 52 H208 Q200 52 200 60 V80" fill="none" stroke="hsl(210 12% 72%)" strokeWidth="16" strokeLinecap="round" />
          <rect x="192" y="78" width="16" height="8" rx="2" fill="hsl(210 10% 55%)" />
          {/* handle (rotates when open) */}
          <g className="wtap-handle">
            <rect x="238" y="22" width="8" height="16" rx="2" fill="hsl(210 10% 55%)" />
            <rect x="222" y="14" width="40" height="10" rx="5" fill="hsl(var(--secondary))" />
          </g>
          <defs>
            <linearGradient id="wtap-water" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="hsl(199 90% 70%)" />
              <stop offset="1" stopColor="hsl(199 90% 52%)" />
            </linearGradient>
            <clipPath id="wtap-cup"><path d={CUP} /></clipPath>
          </defs>
          {/* water stream (ends at the cup's rim) */}
          <rect className="wtap-stream" x="195" y="86" width="10" height="112" rx="5" fill="url(#wtap-water)" />
          {/* drip when closed */}
          <circle className="wtap-drip" cx="200" cy="92" r="3.5" fill="hsl(199 90% 60%)" />

          {/* ── child: drawn back to front ── */}
          {/* far arm, behind the body */}
          <path d="M150 196 Q178 206 208 214" fill="none" stroke={SKIN_SHADE} strokeWidth="9" strokeLinecap="round" />
          {/* legs and shoes */}
          <path d="M121 250 V273" stroke={SKIN} strokeWidth="11" strokeLinecap="round" />
          <path d="M141 250 V273" stroke={SKIN_SHADE} strokeWidth="11" strokeLinecap="round" />
          <ellipse cx="121" cy="278" rx="10" ry="5" fill="hsl(15 15% 20%)" />
          <ellipse cx="144" cy="278" rx="10" ry="5" fill="hsl(15 15% 20%)" />
          {/* shorts */}
          <path d="M110 228 H154 L156 256 H136 L131 240 L126 256 H108 Z" fill="hsl(212 50% 25%)" />
          {/* t-shirt with collar */}
          <path d="M108 186 Q112 176 131 176 Q150 176 155 186 L158 232 Q131 238 106 232 Z" fill="hsl(40 86% 62%)" />
          <path d="M120 177 Q131 186 142 177" fill="none" stroke="hsl(38 70% 50%)" strokeWidth="2.5" />
          {/* near arm: sleeve, then forearm reaching the cup */}
          <path d="M150 186 Q162 188 163 202 L152 206 Z" fill="hsl(40 86% 62%)" />
          <path d="M157 202 Q163 222 184 222" fill="none" stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
          {/* neck */}
          <rect x="125" y="158" width="13" height="20" rx="5" fill={SKIN_SHADE} />
          {/* head (a child's head is large: scaled up around the chin) */}
          <g transform="translate(132 163) scale(1.14) translate(-132 -163)">
            <ellipse cx="132" cy="134" rx="25" ry="29" fill="hsl(25 62% 74%)" />
            <ellipse cx="108" cy="138" rx="5" ry="8" fill={SKIN} />
            <ellipse cx="108.5" cy="138" rx="2.2" ry="4.5" fill="hsl(22 50% 61%)" />
            {/* hair with a side fringe */}
            <path d="M106 136 Q100 102 132 100 Q160 100 158 124 Q150 116 140 118 Q146 110 136 112 Q124 112 118 122 Q114 126 113 140 Q109 140 106 136 Z" fill="hsl(22 40% 16%)" />
            {/* eyebrows: worried when sad, relaxed when happy */}
            <g className="wtap-sad" fill="none" stroke="hsl(22 40% 16%)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M127 121 Q132 120 137.5 118" /><path d="M145 118 Q150 120 154.5 121.5" />
            </g>
            <g className="wtap-happy" fill="none" stroke="hsl(22 40% 16%)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M127 121 Q132 117.5 137 119.5" /><path d="M145 119.5 Q150 117.5 154.5 120.5" />
            </g>
            {/* eyes looking up at the tap */}
            <ellipse cx="133" cy="131" rx="4.6" ry="3.6" fill="#fff" />
            <ellipse cx="150" cy="131" rx="4.2" ry="3.6" fill="#fff" />
            <circle cx="134.5" cy="130.2" r="2.5" fill="hsl(22 48% 20%)" />
            <circle cx="151.4" cy="130.2" r="2.4" fill="hsl(22 48% 20%)" />
            <circle cx="135.3" cy="129.3" r="0.8" fill="#fff" />
            <circle cx="152.2" cy="129.3" r="0.8" fill="#fff" />
            <path d="M128.5 128.5 Q133 125.5 138 128" fill="none" stroke="hsl(22 40% 16%)" strokeWidth="1.3" />
            <path d="M146 128 Q150 125.5 154.5 128.5" fill="none" stroke="hsl(22 40% 16%)" strokeWidth="1.3" />
            {/* nose */}
            <path d="M143 133 Q146 141 142.5 143" fill="none" stroke="hsl(22 48% 58%)" strokeWidth="1.8" strokeLinecap="round" />
            {/* cheeks (happy) */}
            <g className="wtap-happy" fill="hsl(0 80% 74% / 0.45)"><ellipse cx="128" cy="144" rx="5" ry="3" /><ellipse cx="154" cy="143" rx="4" ry="2.6" /></g>
            {/* mouths */}
            <path className="wtap-sad" d="M137 153 Q143 149.5 149 153" fill="none" stroke="hsl(10 40% 38%)" strokeWidth="2" strokeLinecap="round" />
            <g className="wtap-happy">
              <path d="M134 148 Q143 161 152.5 148 Q143 151.5 134 148 Z" fill="hsl(4 45% 36%)" />
              <path d="M136 149 Q143 151.6 150.5 149" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          </g>

          {/* cup with filling water, held in both hands */}
          <path d={CUP} fill="#fff" />
          <g clipPath="url(#wtap-cup)">
            <rect className="wtap-fill" x="180" y="200" width="40" height="44" fill="hsl(199 90% 58%)" />
          </g>
          <path d={CUP} fill="none" stroke="hsl(199 50% 40%)" strokeWidth="2.5" />
          {/* splash at the rim */}
          <g className="wtap-splash" fill="hsl(199 90% 65%)">
            <circle cx="191" cy="194" r="2.6" /><circle cx="210" cy="193" r="2.2" /><circle cx="200" cy="189" r="1.8" />
          </g>
          <circle cx="186" cy="221" r="6" fill={SKIN} />
          <circle cx="214" cy="216" r="5.5" fill={SKIN_SHADE} />
        </svg>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-pressed={open}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-black shadow-lg transition hover:scale-[1.01] active:scale-[0.99] ${open ? "bg-primary text-primary-foreground" : "bg-sky-600 text-white shadow-sky-600/30"}`}
        >
          <Droplets className="h-5 w-5" />
          {open ? (isAr ? "أغلق الحنفية لترى الفرق" : "Close the tap and see the difference") : isAr ? "افتح الحنفية" : "Open the tap"}
        </button>
      </div>

      <div aria-live="polite">
        <p className={`text-sm font-black ${open ? "text-sky-600 dark:text-sky-400" : "text-accent"}`}>
          {open ? (isAr ? "بعد أن يصل الماء النظيف إلى البيت" : "After clean water reaches the home") : isAr ? "قبل أن يصل الماء إلى البيت" : "Before water reaches the home"}
        </p>
        <h2 className="mt-2 text-2xl font-black leading-snug text-primary md:text-3xl">
          {open
            ? isAr ? "حنفية واحدة تغيّر حياة بيت كامل" : "One tap changes a whole home"
            : isAr ? "تخيّل يومك دون ماء في البيت" : "Imagine your day without water at home"}
        </h2>
        <ul className="mt-6 space-y-3">
          {items.map(({ icon: Icon, ar, en, bodyAr, bodyEn }) => (
            <li key={en} className="wtap-card flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${open ? "bg-sky-600 text-white" : "bg-accent/15 text-accent"}`}><Icon className="h-5 w-5" /></span>
              <div>
                <h3 className="text-base font-black text-primary">{isAr ? ar : en}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{isAr ? bodyAr : bodyEn}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
