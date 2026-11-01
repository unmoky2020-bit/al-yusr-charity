import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Vibrate, VibrateOff, Share2, Check, Heart, Sparkles } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";

/**
 * /misbaha — a digital tasbih. Pick a dhikr (salawat, tasbih, istighfar, general dhikr), tap the
 * bead ring to count. Counts, targets and today's total are kept in this browser only
 * (localStorage, per-visitor convenience). Motion is short, transform/opacity only, and off under
 * prefers-reduced-motion.
 */
type Dhikr = { id: string; text: string; en: string; virtue: string; virtueEn: string; source: string; sourceEn: string; target: number };
type Group = { id: string; ar: string; en: string; items: Dhikr[] };

const GROUPS: Group[] = [
  {
    id: "salawat", ar: "الصلاة على النبي ﷺ", en: "Salawat",
    items: [
      { id: "salawat", text: "اللهم صلِّ وسلِّم على نبينا محمد", en: "O Allah, send prayers and peace upon our Prophet Muhammad", virtue: "مَن صلّى عليّ صلاةً واحدة صلّى الله عليه بها عشرًا", virtueEn: "Whoever sends one prayer upon me, Allah sends ten upon him.", source: "رواه مسلم", sourceEn: "Muslim", target: 100 },
    ],
  },
  {
    id: "tasbih", ar: "التسبيح", en: "Tasbih",
    items: [
      { id: "subhan_bihamdih", text: "سبحان الله وبحمده", en: "Glory be to Allah and praise be to Him", virtue: "مَن قال سبحان الله وبحمده في يومٍ مائة مرة حُطّت خطاياه وإن كانت مثل زبد البحر", virtueEn: "Whoever says it a hundred times a day, his sins are wiped away even if they are like the foam of the sea.", source: "متفق عليه", sourceEn: "Bukhari & Muslim", target: 100 },
      { id: "kalimatan", text: "سبحان الله وبحمده، سبحان الله العظيم", en: "Glory be to Allah and praise be to Him, glory be to Allah the Almighty", virtue: "كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن", virtueEn: "Two phrases light on the tongue, heavy on the scale, beloved to the Most Merciful.", source: "متفق عليه", sourceEn: "Bukhari & Muslim", target: 100 },
      { id: "baqiyat", text: "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر", en: "Glory be to Allah, praise be to Allah, there is no god but Allah, Allah is the Greatest", virtue: "أحبّ الكلام إلى الله أربع: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر", virtueEn: "The most beloved words to Allah are four: Subhan Allah, al-Hamdu lillah, La ilaha illa Allah and Allahu Akbar.", source: "رواه مسلم", sourceEn: "Muslim", target: 33 },
    ],
  },
  {
    id: "istighfar", ar: "الاستغفار", en: "Istighfar",
    items: [
      { id: "astaghfir", text: "أستغفر الله وأتوب إليه", en: "I seek Allah's forgiveness and turn to Him in repentance", virtue: "والله إني لأستغفر الله وأتوب إليه في اليوم أكثر من سبعين مرة", virtueEn: "By Allah, I seek Allah's forgiveness and repent to Him more than seventy times a day.", source: "رواه البخاري", sourceEn: "Bukhari", target: 100 },
      { id: "astaghfir_azim", text: "أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه", en: "I seek forgiveness of Allah the Almighty, besides whom there is no god, the Ever-Living, the Sustainer, and I repent to Him", virtue: "مَن قالها غُفر له وإن كان فرّ من الزحف", virtueEn: "Whoever says it is forgiven, even if he fled from the battlefield.", source: "رواه أبو داود والترمذي، وصححه الألباني", sourceEn: "Abu Dawud and al-Tirmidhi; graded sahih by al-Albani", target: 33 },
    ],
  },
  {
    id: "dhikr", ar: "الذكر", en: "Dhikr",
    items: [
      { id: "tahleel", text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", en: "There is no god but Allah alone, without partner; His is the dominion and His the praise, and He is over all things capable", virtue: "مَن قالها في يومٍ مائة مرة كانت له عدل عشر رقاب، وكُتبت له مائة حسنة، ومُحيت عنه مائة سيئة", virtueEn: "Whoever says it a hundred times a day earns the reward of freeing ten slaves, a hundred good deeds are written for him and a hundred bad deeds erased.", source: "متفق عليه", sourceEn: "Bukhari & Muslim", target: 100 },
      { id: "hawqala", text: "لا حول ولا قوة إلا بالله", en: "There is no power nor strength except by Allah", virtue: "كنزٌ من كنوز الجنة", virtueEn: "A treasure from the treasures of Paradise.", source: "متفق عليه", sourceEn: "Bukhari & Muslim", target: 100 },
      { id: "hamd", text: "الحمد لله", en: "Praise be to Allah", virtue: "والحمد لله تملأ الميزان", virtueEn: "And al-Hamdu lillah fills the scale.", source: "رواه مسلم", sourceEn: "Muslim", target: 33 },
    ],
  },
];
const ALL = GROUPS.flatMap((g) => g.items);
const TARGETS = [33, 100, 1000, 0]; // 0 = open count
const BEADS = 33;

type Saved = { selected: string; counts: Record<string, number>; targets: Record<string, number>; day: string; today: number; vibrate: boolean };
const KEY = "yusr-misbaha-v1";
const todayStr = () => new Date().toISOString().slice(0, 10);
const load = (): Saved => {
  const fresh: Saved = { selected: ALL[0].id, counts: {}, targets: {}, day: todayStr(), today: 0, vibrate: true };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<Saved> | null;
    if (!s || typeof s !== "object") return fresh;
    const out = { ...fresh, ...s, counts: { ...(s.counts || {}) }, targets: { ...(s.targets || {}) } } as Saved;
    if (!ALL.some((d) => d.id === out.selected)) out.selected = fresh.selected;
    if (out.day !== fresh.day) { out.day = fresh.day; out.today = 0; }
    return out;
  } catch {
    return fresh;
  }
};

/** Bead positions on the ring (static). */
const BEAD_POS = Array.from({ length: BEADS }, (_, i) => {
  const a = (-90 + (i * 360) / BEADS) * (Math.PI / 180);
  return { x: 150 + 118 * Math.cos(a), y: 150 + 118 * Math.sin(a) };
});

const Misbaha = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [st, setSt] = useState<Saved>(load);
  const [pulse, setPulse] = useState(0); // bumps on every tap → restarts the tap animation
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const doneTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* private mode: counting still works */ }
  }, [st]);
  useEffect(() => () => window.clearTimeout(doneTimer.current), []);

  const dhikr = ALL.find((d) => d.id === st.selected) ?? ALL[0];
  const group = GROUPS.find((g) => g.items.some((d) => d.id === dhikr.id)) ?? GROUPS[0];
  const count = st.counts[dhikr.id] ?? 0;
  const target = st.targets[dhikr.id] ?? dhikr.target;
  const rounds = target ? Math.floor(count / target) : 0;
  const inRound = target ? count % target : count;
  // Beads lit: progress within the target, or within each 33 on an open count.
  const lit = target ? Math.round((inRound / target) * BEADS) : count % BEADS;
  const showFull = target > 0 && count > 0 && inRound === 0; // a round just completed → full ring

  const vibrate = (ms: number | number[]) => {
    if (!st.vibrate) return;
    try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
  };

  const tap = useCallback(() => {
    const completes = target > 0 && (count + 1) % target === 0;
    setSt((s) => {
      const day = todayStr();
      const today = s.day === day ? s.today : 0;
      return { ...s, counts: { ...s.counts, [dhikr.id]: (s.counts[dhikr.id] ?? 0) + 1 }, today: today + 1, day };
    });
    setPulse((p) => p + 1);
    if (completes) {
      setDone(true);
      window.clearTimeout(doneTimer.current);
      doneTimer.current = window.setTimeout(() => setDone(false), 1800);
    }
    vibrate(completes ? [40, 60, 40] : 8);
  }, [dhikr.id, target, count]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { setSt((s) => ({ ...s, counts: { ...s.counts, [dhikr.id]: 0 } })); setDone(false); };
  const choose = (id: string) => { setSt((s) => ({ ...s, selected: id })); setDone(false); };
  const setTarget = (n: number) => setSt((s) => ({ ...s, targets: { ...s.targets, [dhikr.id]: n } }));

  const share = async () => {
    const url = "https://elyusr.org/misbaha";
    const text = isAr ? "مسبحة إلكترونية من مؤسسة اليسر: صلّ على النبي ﷺ، وسبّح، واستغفر" : "A digital tasbih from Al-Yusr";
    try {
      if (navigator.share) { await navigator.share({ title: isAr ? "المسبحة الإلكترونية" : "Digital tasbih", text, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* dismissed */ }
  };

  const fmt = (n: number) => n.toLocaleString(isAr ? "ar-EG" : "en-US");
  const beads = useMemo(() => BEAD_POS, []);

  return (
    <PageLayout>
      <SEOHelmet
        title={isAr ? "المسبحة الإلكترونية | صلاة على النبي وتسبيح واستغفار — مؤسسة اليسر" : "Digital tasbih | Salawat, tasbih & istighfar — Al-Yusr"}
        description={isAr ? "مسبحة إلكترونية سهلة: صلِّ على النبي ﷺ، وسبّح، واستغفر، واذكر الله، مع عدّاد وهدف يومي وفضل كل ذكر من الأحاديث الصحيحة." : "An easy digital tasbih: salawat, tasbih, istighfar and dhikr with a counter, daily goal and the virtue of each dhikr."}
        path="/misbaha"
      />
      <BreadcrumbSchema items={[{ name: isAr ? "الرئيسية" : "Home", url: "https://elyusr.org/" }, { name: isAr ? "المسبحة الإلكترونية" : "Digital tasbih", url: "https://elyusr.org/misbaha" }]} />

      <section className="pattern-hero-luxe relative overflow-hidden text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 leaf-bg opacity-20" />
        <div className="container relative mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-14">
          <div className="flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isAr ? "الرئيسية" : "Home", href: "/" }, { name: isAr ? "المسبحة الإلكترونية" : "Digital tasbih" }]} />
          </div>
          <div className="mx-auto mt-6 max-w-2xl text-center">
            <h1 className="text-3xl font-black sm:text-4xl md:text-5xl">{isAr ? "المسبحة الإلكترونية" : "Digital tasbih"}</h1>
            <p className="mt-3 text-base text-primary-foreground/85 md:text-lg">
              {isAr ? "اختار ذكرك، واضغط على المسبحة مع كل تسبيحة. عدّادك بيتحفظ على جهازك." : "Choose your dhikr and tap the beads with each one. Your count is saved on this device."}
            </p>
          </div>

          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* ── Counter ── */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={tap}
                className={`misbaha-ring relative aspect-square w-full max-w-[340px] select-none rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60 ${done ? "misbaha-done" : ""}`}
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                aria-label={isAr ? `اضغط للتسبيح: ${dhikr.text}. العدد ${count}` : `Tap to count: ${dhikr.en}. Count ${count}`}
              >
                <svg viewBox="0 0 300 300" className="h-full w-full" aria-hidden>
                  <circle cx="150" cy="150" r="146" fill="hsl(152 55% 9%)" />
                  <circle cx="150" cy="150" r="118" fill="none" stroke="hsl(var(--secondary) / 0.18)" strokeWidth="2" />
                  {beads.map((b, i) => {
                    const on = showFull || i < lit;
                    const newest = !showFull && i === lit - 1;
                    return (
                      <circle
                        key={newest ? `new-${i}` : i}
                        cx={b.x}
                        cy={b.y}
                        r={newest ? 9 : 7.5}
                        className={`misbaha-bead ${newest ? "misbaha-bead-new" : ""}`}
                        fill={on ? "hsl(var(--secondary))" : "hsl(0 0% 100% / 0.14)"}
                      />
                    );
                  })}
                  {/* tassel at the top */}
                  <path d="M150 18 l-6 -12 h12 Z" fill="hsl(var(--secondary))" />
                </svg>
                <span key={pulse} className="misbaha-tap pointer-events-none absolute inset-[22%] rounded-full" aria-hidden />
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="text-center">
                    <span className="block font-mono text-6xl font-black tabular-nums text-white sm:text-7xl" aria-live="polite">{fmt(target ? inRound || (showFull ? target : 0) : count)}</span>
                    <span className="mt-1 block text-sm font-bold text-white/70">
                      {target ? (isAr ? `من ${fmt(target)}` : `of ${fmt(target)}`) : isAr ? "عدّ مفتوح" : "open count"}
                    </span>
                    {rounds > 0 && <span className="mt-1 block text-xs font-black text-secondary">{isAr ? `${fmt(rounds)} دورة` : `${fmt(rounds)} rounds`}</span>}
                  </span>
                </span>
                <span className={`misbaha-toast pointer-events-none absolute inset-x-0 -bottom-2 mx-auto w-fit rounded-full bg-secondary px-4 py-1.5 text-sm font-black text-slate-950 shadow-cta ${done ? "is-on" : ""}`} aria-hidden={!done}>
                  {isAr ? "تقبّل الله منك" : "May Allah accept it"}
                </span>
              </button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {TARGETS.map((n) => (
                  <button key={n} type="button" onClick={() => setTarget(n)} aria-pressed={target === n}
                    className={`rounded-full px-4 py-1.5 text-sm font-black transition ${target === n ? "bg-secondary text-slate-950" : "bg-white/10 text-white hover:bg-white/20"}`}>
                    {n ? fmt(n) : isAr ? "بدون حد" : "No limit"}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
                <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-white/90 transition hover:bg-white/10">
                  <RotateCcw className="h-4 w-4" /> {isAr ? "تصفير" : "Reset"}
                </button>
                <button type="button" onClick={() => setSt((s) => ({ ...s, vibrate: !s.vibrate }))} aria-pressed={st.vibrate}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-white/90 transition hover:bg-white/10">
                  {st.vibrate ? <Vibrate className="h-4 w-4" /> : <VibrateOff className="h-4 w-4" />} {isAr ? (st.vibrate ? "الاهتزاز شغال" : "الاهتزاز مقفول") : st.vibrate ? "Vibration on" : "Vibration off"}
                </button>
              </div>
              <p className="mt-4 text-sm font-bold text-white/75">
                {isAr ? `ذكرك النهارده: ${fmt(st.today)}` : `Today's dhikr: ${fmt(st.today)}`}
              </p>
            </div>

            {/* ── Choice of dhikr ── */}
            <div className="rounded-3xl bg-card p-5 text-foreground shadow-card sm:p-7">
              <div role="tablist" aria-label={isAr ? "نوع الذكر" : "Type of dhikr"} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GROUPS.map((g) => {
                  const on = g.id === group.id;
                  return (
                    <button key={g.id} type="button" role="tab" aria-selected={on} onClick={() => choose(g.items[0].id)}
                      className={`rounded-2xl px-3 py-2.5 text-sm font-black transition ${on ? "bg-primary text-primary-foreground" : "bg-muted/60 text-primary hover:bg-secondary/20"}`}>
                      {isAr ? g.ar : g.en}
                    </button>
                  );
                })}
              </div>

              {group.items.length > 1 && (
                <div className="mt-4 space-y-2">
                  {group.items.map((d) => {
                    const on = d.id === dhikr.id;
                    return (
                      <button key={d.id} type="button" onClick={() => choose(d.id)} aria-pressed={on}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-start transition ${on ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/50"}`}>
                        <span className="text-sm font-black leading-relaxed text-primary">{isAr ? d.text : d.en}</span>
                        <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-black text-muted-foreground">{fmt(st.counts[d.id] ?? 0)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div key={dhikr.id} className="misbaha-fade mt-6 rounded-2xl bg-muted/40 p-5 text-center">
                <p className="text-2xl font-black leading-[1.8] text-primary md:text-3xl">{dhikr.text}</p>
                {!isAr && <p className="mt-2 text-sm text-muted-foreground">{dhikr.en}</p>}
              </div>

              <figure className="mt-5 border-s-4 border-secondary ps-4">
                <p className="text-xs font-black text-secondary">{isAr ? "فضله" : "Its virtue"}</p>
                <blockquote className="mt-1 text-base font-bold leading-loose text-foreground/85">
                  {isAr ? `قال رسول الله ﷺ: «${dhikr.virtue}»` : `The Prophet ﷺ said: “${dhikr.virtueEn}”`}
                </blockquote>
                <figcaption className="mt-1 text-xs font-bold text-muted-foreground">{isAr ? dhikr.source : dhikr.sourceEn}</figcaption>
              </figure>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
                <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-primary transition hover:border-secondary hover:bg-secondary/10">
                  {copied ? <Check className="h-4 w-4 text-secondary" /> : <Share2 className="h-4 w-4" />}
                  {copied ? (isAr ? "اتنسخ الرابط" : "Link copied") : isAr ? "شارك المسبحة، والدال على الخير كفاعله" : "Share the tasbih"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A gentle reminder, below the tool so it never gets in the way */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-secondary" />
          <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">{isAr ? "ومع الذكر، ما تنساش الصدقة" : "Alongside dhikr, remember charity"}</h2>
          <p className="mt-3 text-muted-foreground md:text-lg">
            {isAr ? "صدقة صغيرة النهارده ممكن تفتح باب فرحة لأسرة محتاجة، وتفضل في ميزانك." : "A small charity today can open a door of joy for a family in need, and stays on your scale."}
          </p>
          <Link to="/donate" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-grad px-7 py-3 text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95">
            <Heart className="h-5 w-5" /> {isAr ? "تصدّق الآن" : "Give now"}
          </Link>
        </div>
      </section>
    </PageLayout>
  );
};

export default Misbaha;
