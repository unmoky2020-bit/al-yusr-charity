import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RotateCcw, Vibrate, VibrateOff, Share2, Check, Heart, Sparkles, ImageDown, X, Users, Plus, Copy } from "lucide-react";
import { DHIKR_GROUPS, ALL_DHIKR, MIXED_DHIKR, groupOfDhikr, type Dhikr as DhikrType } from "@/data/adhkar";
import { misbahaRoomsApi, MISBAHA_ROOMS_PENDING_AR, type MisbahaRoom } from "@/data/api/misbahaRoomsApi";
import { isEndpointMissing } from "@/data/api/backendPending";
import { drawMisbahaSummary } from "@/lib/misbahaSummaryImage";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";

/**
 * /misbaha — a digital tasbih, and /misbaha/:slug — a shared misbaha for someone who passed away.
 * Counts are kept in this browser for the current day only: coming back the same day restores them,
 * a new day starts from zero. In a shared misbaha every tap is also added to the room's total.
 * Motion is short, transform/opacity only, and off under prefers-reduced-motion.
 */
type Dhikr = DhikrType;
const GROUPS = DHIKR_GROUPS;
const ALL = ALL_DHIKR;
const TARGETS = [33, 100, 1000, 0]; // 0 = open count
const BEADS = 33;
const MIXED = MIXED_DHIKR;
const MIXED_KEY = "__mixed";
type Mode = "mixed" | "single";
const MODES: { id: Mode; ar: string; en: string; subAr: string; subEn: string }[] = [
  { id: "mixed", ar: "أذكار متنوّعة", en: "Varied dhikr", subAr: "بتتغيّر مع كل ضغطة", subEn: "changes with every tap" },
  { id: "single", ar: "ذكر واحد", en: "One dhikr", subAr: "تختاره وتكرّره", subEn: "pick one and repeat" },
];

type Tally = Partial<Record<(typeof GROUPS)[number]["id"], number>>;
type Custom = { id: string; text: string };
type Saved = { mode: Mode; selected: string; counts: Record<string, number>; tally: Tally; targets: Record<string, number>; day: string; today: number; vibrate: boolean; custom: Custom[] };
/** A phrase the visitor added themself (kept on this device). */
const customToDhikr = (c: Custom): Dhikr => ({ id: c.id, text: c.text, en: c.text, virtue: "", virtueEn: "", source: "", sourceEn: "", target: 33 });
const keyFor = (room?: string) => (room ? `yusr-misbaha-room-${room}` : "yusr-misbaha-v2");
/** Local calendar day (not UTC), so the count resets at the visitor's own midnight. */
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
/** Same day → everything as it was left. New day → counts and summary start from zero (settings stay). */
const startDay = (s: Saved): Saved => (s.day === todayStr() ? s : { ...s, day: todayStr(), today: 0, counts: {}, tally: {} });
const load = (room?: string): Saved => {
  const fresh: Saved = { mode: "mixed", selected: ALL[0].id, counts: {}, tally: {}, targets: {}, day: todayStr(), today: 0, vibrate: true, custom: [] };
  try {
    const raw = localStorage.getItem(keyFor(room)) ?? (room ? null : localStorage.getItem("yusr-misbaha-v1"));
    const s = JSON.parse(raw || "null") as Partial<Saved> | null;
    if (!s || typeof s !== "object") return fresh;
    const out = { ...fresh, ...s, counts: { ...(s.counts || {}) }, tally: { ...(s.tally || {}) }, targets: { ...(s.targets || {}) }, custom: Array.isArray(s.custom) ? s.custom.slice(0, 20) : [] } as Saved;
    if (!ALL.some((d) => d.id === out.selected) && !out.custom.some((c) => c.id === out.selected)) out.selected = fresh.selected;
    if (out.mode !== "single") out.mode = "mixed";
    return startDay(out);
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
  const { slug: roomSlug } = useParams<{ slug?: string }>();
  return <MisbahaView key={roomSlug ?? "personal"} roomSlug={roomSlug} isAr={isAr} />;
};

const MisbahaView = ({ roomSlug, isAr }: { roomSlug?: string; isAr: boolean }) => {
  const navigate = useNavigate();
  const [st, setSt] = useState<Saved>(() => load(roomSlug));
  const [pulse, setPulse] = useState(0); // bumps on every tap → restarts the tap animation
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const doneTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try { localStorage.setItem(keyFor(roomSlug), JSON.stringify(st)); } catch { /* private mode: counting still works */ }
  }, [st, roomSlug]);
  useEffect(() => () => window.clearTimeout(doneTimer.current), []);

  // ── Shared misbaha (for someone who passed away) ──
  const [room, setRoom] = useState<MisbahaRoom | null>(null);
  const [roomState, setRoomState] = useState<"none" | "loading" | "ok" | "missing" | "pending">(roomSlug ? "loading" : "none");
  const pendingAdd = useRef(0);
  useEffect(() => {
    if (!roomSlug) return;
    let alive = true;
    misbahaRoomsApi
      .get(roomSlug)
      .then((r) => { if (!alive) return; setRoom(r); setRoomState(r ? "ok" : "missing"); })
      .catch((e) => alive && setRoomState(isEndpointMissing(e) ? "pending" : "missing"));
    return () => { alive = false; };
  }, [roomSlug]);
  // Taps are sent in small batches (every 3 s, and when the page is hidden) instead of one request each.
  useEffect(() => {
    if (!roomSlug || roomState !== "ok") return;
    const flush = () => {
      const n = pendingAdd.current;
      if (n <= 0) return;
      pendingAdd.current = 0;
      misbahaRoomsApi
        .add(roomSlug, Math.min(n, 500))
        .then((total) => { if (total !== null) setRoom((r) => (r ? { ...r, total_count: total } : r)); })
        .catch(() => { pendingAdd.current += n; });
    };
    const t = window.setInterval(flush, 3000);
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", onHide); flush(); };
  }, [roomSlug, roomState]);

  // A shared link can open a specific dhikr: /misbaha?d=astaghfir
  const [params] = useSearchParams();
  useEffect(() => {
    const d = params.get("d");
    if (d && ALL.some((x) => x.id === d)) setSt((s) => ({ ...s, mode: "single", selected: d }));
    // only on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // A shared misbaha can suggest a dhikr: used until the visitor picks something else.
  useEffect(() => {
    const d = room?.dhikr_id;
    if (d && ALL.some((x) => x.id === d)) setSt((s) => (s.today === 0 ? { ...s, mode: "single", selected: d } : s));
  }, [room?.dhikr_id]);
  const customDhikr = useMemo(() => st.custom.map(customToDhikr), [st.custom]);
  const findDhikr = (id: string) => ALL.find((d) => d.id === id) ?? customDhikr.find((d) => d.id === id);

  const isMixed = st.mode === "mixed";
  // In mixed mode the counter is shared and the dhikr to say now follows the count.
  const countKey = isMixed ? MIXED_KEY : st.selected;
  const count = st.counts[countKey] ?? 0;
  const dhikr = isMixed ? MIXED[count % MIXED.length] : findDhikr(st.selected) ?? ALL[0];
  const isCustom = dhikr.id.startsWith("my_");
  const nextDhikr = isMixed ? MIXED[(count + 1) % MIXED.length] : null;
  const group = groupOfDhikr(dhikr.id);
  const target = st.targets[countKey] ?? (isMixed ? 100 : dhikr.target);
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
    // the visitor's own phrases count as «ذكر ودعاء» in the summary
    const gid = dhikr.id.startsWith("my_") ? "dhikr" : groupOfDhikr(dhikr.id).id;
    setSt((prev) => {
      const s = startDay(prev); // the page may stay open past midnight
      return {
        ...s,
        counts: { ...s.counts, [countKey]: (s.counts[countKey] ?? 0) + 1 },
        tally: { ...s.tally, [gid]: (s.tally[gid] ?? 0) + 1 },
        today: s.today + 1,
      };
    });
    if (roomSlug && roomState === "ok") {
      pendingAdd.current += 1;
      setRoom((r) => (r ? { ...r, total_count: r.total_count + 1 } : r));
    }
    setPulse((p) => p + 1);
    if (completes) {
      setDone(true);
      window.clearTimeout(doneTimer.current);
      doneTimer.current = window.setTimeout(() => setDone(false), 1800);
    }
    vibrate(completes ? [40, 60, 40] : 8);
  }, [countKey, target, count, dhikr.id, roomSlug, roomState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, button, a, [contenteditable=true]") || t.isContentEditable)) return;
      e.preventDefault();
      tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  const [customText, setCustomText] = useState("");
  const addCustom = () => {
    const text = customText.trim().replace(/\s+/g, " ").slice(0, 120);
    if (text.length < 2) return;
    const id = `my_${Date.now().toString(36)}`;
    setSt((s) => ({ ...s, custom: [...s.custom, { id, text }].slice(-20), mode: "single", selected: id }));
    setCustomText("");
  };
  const removeCustom = (id: string) =>
    setSt((s) => ({ ...s, custom: s.custom.filter((c) => c.id !== id), selected: s.selected === id ? ALL[0].id : s.selected }));

  const [dhikrCopied, setDhikrCopied] = useState(false);
  const shareDhikr = async () => {
    const url = `https://elyusr.org/misbaha?d=${dhikr.id}`;
    const text = isAr ? `قول معايا: ${dhikr.text}` : `Say with me: ${dhikr.en}`;
    try {
      if (navigator.share) { await navigator.share({ text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setDhikrCopied(true);
      window.setTimeout(() => setDhikrCopied(false), 1800);
    } catch { /* dismissed */ }
  };

  const reset = () => { setSt((s) => ({ ...s, counts: { ...s.counts, [countKey]: 0 } })); setDone(false); };
  const choose = (id: string) => { setSt((s) => ({ ...s, mode: "single", selected: id })); setDone(false); };
  const setMode = (mode: Mode) => { setSt((s) => ({ ...s, mode })); setDone(false); };
  const setTarget = (n: number) => setSt((s) => ({ ...s, targets: { ...s.targets, [countKey]: n } }));

  const pageUrl = roomSlug ? `https://elyusr.org/misbaha/${roomSlug}` : "https://elyusr.org/misbaha";
  const shareText = room
    ? (isAr ? `سبحة لروح ${room.name}: شاركنا بتسبيحة أو استغفار أو صلاة على النبي ﷺ، وكل ذكر بيتضاف لعدّاد السبحة. والدال على الخير كفاعله.` : `A shared tasbih for the soul of ${room.name}. Every dhikr you say is added. Join in.`)
    : (isAr ? "مسبحة إلكترونية من مؤسسة اليسر: صلّ على النبي ﷺ، وسبّح، واستغفر" : "A digital tasbih from Al-Yusr");
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${pageUrl}`)}`;
  const share = async () => {
    const url = pageUrl;
    const text = shareText;
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
      {roomSlug ? (
        // Shared misbaha pages carry a family's loved one's name: kept out of search results.
        <SEOHelmet noindex
          title={room ? (isAr ? `سبحة لروح ${room.name} | مؤسسة اليسر` : `Tasbih for ${room.name} | Al-Yusr`) : (isAr ? "سبحة لمتوفّى | مؤسسة اليسر" : "Tasbih for a loved one | Al-Yusr")}
          description={isAr ? "شارك بالتسبيح والاستغفار والصلاة على النبي ﷺ، وكل ذكر بيتضاف لعدّاد واحد." : "Join in with tasbih, istighfar and salawat; every dhikr adds to one shared count."}
          path={`/misbaha/${roomSlug}`}
        />
      ) : (
      <SEOHelmet
        title={isAr ? "المسبحة الإلكترونية | صلاة على النبي وتسبيح واستغفار — مؤسسة اليسر" : "Digital tasbih | Salawat, tasbih & istighfar — Al-Yusr"}
        description={isAr ? "مسبحة إلكترونية سهلة: صلِّ على النبي ﷺ، وسبّح، واستغفر، واذكر الله، مع عدّاد وهدف يومي وفضل كل ذكر من الأحاديث الصحيحة. واعمل سبحة لروح حد غالي عليك وشاركها." : "An easy digital tasbih: salawat, tasbih, istighfar and dhikr with a counter, daily goal and the virtue of each dhikr. Create a shared tasbih for a loved one who passed away."}
        path="/misbaha"
      />
      )}
      <BreadcrumbSchema items={[{ name: isAr ? "الرئيسية" : "Home", url: "https://elyusr.org/" }, { name: isAr ? "المسبحة الإلكترونية" : "Digital tasbih", url: "https://elyusr.org/misbaha" }]} />

      <section className="pattern-hero-luxe relative overflow-hidden text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 leaf-bg opacity-20" />
        <div className="container relative mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-14">
          <div className="flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isAr ? "الرئيسية" : "Home", href: "/" }, { name: isAr ? "المسبحة الإلكترونية" : "Digital tasbih" }]} />
          </div>
          <div className="mx-auto mt-6 max-w-2xl text-center">
            {roomSlug ? (
              <RoomHeader isAr={isAr} state={roomState} room={room} onShare={share} waHref={waHref} pageUrl={pageUrl} copied={copied} fmt={(n) => n.toLocaleString(isAr ? "ar-EG" : "en-US")} />
            ) : (
              <>
                <h1 className="text-3xl font-black sm:text-4xl md:text-5xl">{isAr ? "المسبحة الإلكترونية" : "Digital tasbih"}</h1>
                <p className="mt-3 text-base text-primary-foreground/85 md:text-lg">
                  {isAr ? "قول الذكر واضغط على المسبحة. الذكر بيتغيّر مع كل ضغطة علشان تجمع بين الصلاة على النبي ﷺ والتسبيح والاستغفار، وتقدر تختار ذكر واحد لو حابب. عدّادك بيتحفظ على جهازك طول اليوم، ويبدأ من الأول مع يوم جديد." : "Say the dhikr and tap the beads. It changes with every tap so you combine salawat, tasbih and istighfar; you can also pick a single dhikr. Your count stays on this device for the day and starts fresh each new day."}
                </p>
              </>
            )}
          </div>

          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* ── Counter ── */}
            <div className="flex flex-col items-center">
              <div className="mb-5 min-h-[5.5rem] w-full max-w-md text-center" aria-live="polite">
                <p className="text-xs font-black text-secondary">{isMixed ? (isAr ? "قول دلوقتي" : "Say now") : (isAr ? "ذكرك" : "Your dhikr")}<span className="hidden font-bold text-white/45 sm:inline">{isAr ? " (اضغط المسبحة أو زرار المسافة)" : " (tap the beads or press Space)"}</span></p>
                <p key={`${dhikr.id}-${isMixed ? count : 0}`} className="misbaha-fade mt-1 text-xl font-black leading-[1.7] text-white sm:text-2xl">{isAr ? dhikr.text : dhikr.en}</p>
                {nextDhikr && (
                  <p className="mt-1 truncate text-xs font-bold text-white/55">{isAr ? `اللي بعده: ${nextDhikr.text}` : `Next: ${nextDhikr.en}`}</p>
                )}
              </div>
              <button
                type="button"
                onClick={tap}
                className={`misbaha-ring relative aspect-square w-full max-w-[340px] select-none rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60 ${done ? "misbaha-done" : ""}`}
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                aria-label={isAr ? `اضغط بعد ما تقول: ${dhikr.text}. العدد ${count}` : `Tap after saying: ${dhikr.en}. Count ${count}`}
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
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="text-sm font-bold text-white/75">
                  {isAr ? `ذكرك النهارده: ${fmt(st.today)}` : `Today's dhikr: ${fmt(st.today)}`}
                </p>
                {st.today > 0 && (
                  <button type="button" onClick={() => setSummaryOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 text-sm font-black text-slate-950 shadow-cta transition hover:-translate-y-0.5">
                    <ImageDown className="h-4 w-4" /> {isAr ? "خلّصت؟ خُد صورة حصيلتك" : "Done? Get your summary image"}
                  </button>
                )}
              </div>
            </div>

            {/* ── Choice of dhikr ── */}
            <div className="rounded-3xl bg-card p-5 text-foreground shadow-card sm:p-7">
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-muted/60 p-1" role="radiogroup" aria-label={isAr ? "طريقة الذكر" : "Dhikr mode"}>
                {MODES.map((m) => {
                  const on = st.mode === m.id;
                  return (
                    <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => setMode(m.id)}
                      className={`rounded-xl px-3 py-2 text-center transition ${on ? "bg-card shadow-soft" : "hover:bg-card/60"}`}>
                      <span className={`block text-sm font-black ${on ? "text-primary" : "text-muted-foreground"}`}>{isAr ? m.ar : m.en}</span>
                      <span className="block text-[11px] font-bold text-muted-foreground">{isAr ? m.subAr : m.subEn}</span>
                    </button>
                  );
                })}
              </div>

              {isMixed ? (
                <ol className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto pe-1 text-xs font-bold sm:grid-cols-3" aria-label={isAr ? "ترتيب الأذكار" : "Dhikr order"}>
                  {MIXED.map((d, i) => {
                    const on = i === count % MIXED.length;
                    return (
                      <li key={`${d.id}-${i}`} className={`truncate rounded-lg px-2 py-1.5 text-center transition-colors ${on ? "bg-secondary/25 text-primary" : "bg-muted/40 text-muted-foreground"}`} title={d.text}>
                        {(i + 1).toLocaleString(isAr ? "ar-EG" : "en-US")}. {isAr ? d.text : d.en}
                      </li>
                    );
                  })}
                </ol>
              ) : (
              <>
              <div role="tablist" aria-label={isAr ? "نوع الذكر" : "Type of dhikr"} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GROUPS.map((g) => {
                  const on = !isCustom && g.id === group.id;
                  return (
                    <button key={g.id} type="button" role="tab" aria-selected={on} onClick={() => choose(g.items[0].id)}
                      className={`rounded-2xl px-3 py-2.5 text-sm font-black transition ${on ? "bg-primary text-primary-foreground" : "bg-muted/60 text-primary hover:bg-secondary/20"}`}>
                      {isAr ? g.ar : g.en}
                    </button>
                  );
                })}
              </div>

              {customDhikr.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-black text-muted-foreground">{isAr ? "أذكارك الخاصة" : "Your own dhikr"}</p>
                  <div className="flex flex-wrap gap-2">
                    {customDhikr.map((d) => (
                      <span key={d.id} className={`inline-flex items-center gap-1 rounded-full border ps-3 text-sm font-black ${d.id === dhikr.id ? "border-secondary bg-secondary/10 text-primary" : "border-border text-primary"}`}>
                        <button type="button" onClick={() => choose(d.id)} aria-pressed={d.id === dhikr.id} className="py-1.5">{d.text}</button>
                        <button type="button" onClick={() => removeCustom(d.id)} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-destructive" aria-label={isAr ? `شيل ${d.text}` : `Remove ${d.text}`}><X className="h-3.5 w-3.5" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); addCustom(); }}>
                <label htmlFor="custom-dhikr" className="sr-only">{isAr ? "اكتب ذكر خاص بيك" : "Add your own dhikr"}</label>
                <input id="custom-dhikr" value={customText} onChange={(e) => setCustomText(e.target.value)} maxLength={120}
                  placeholder={isAr ? "اكتب ذكر أو دعاء خاص بيك" : "Write your own dhikr or dua"}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm font-bold outline-none focus:border-secondary" />
                <button type="submit" disabled={customText.trim().length < 2} className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground disabled:opacity-40">
                  <Plus className="h-4 w-4" /> {isAr ? "ضيف" : "Add"}
                </button>
              </form>

              {group.items.length > 1 && !isCustom && (
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
              </>
              )}

              <div key={`${dhikr.id}-${isMixed ? count : 0}`} className="misbaha-fade mt-6 rounded-2xl bg-muted/40 p-5 text-center">
                <p className="text-2xl font-black leading-[1.8] text-primary md:text-3xl">{dhikr.text}</p>
                {!isAr && <p className="mt-2 text-sm text-muted-foreground">{dhikr.en}</p>}
              </div>

              {!isCustom && (
              <figure className="mt-5 border-s-4 border-secondary ps-4">
                <p className="text-xs font-black text-secondary">{isAr ? "فضله" : "Its virtue"}</p>
                <blockquote className="mt-1 text-base font-bold leading-loose text-foreground/85">
                  {dhikr.prophetSaid === false
                    ? (isAr ? `«${dhikr.virtue}»` : `“${dhikr.virtueEn}”`)
                    : (isAr ? `قال رسول الله ﷺ: «${dhikr.virtue}»` : `The Prophet ﷺ said: “${dhikr.virtueEn}”`)}
                </blockquote>
                <figcaption className="mt-1 text-xs font-bold text-muted-foreground">{isAr ? dhikr.source : dhikr.sourceEn}</figcaption>
              </figure>
              )}

              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
                <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-primary transition hover:border-secondary hover:bg-secondary/10">
                  {copied ? <Check className="h-4 w-4 text-secondary" /> : <Share2 className="h-4 w-4" />}
                  {copied ? (isAr ? "اتنسخ الرابط" : "Link copied") : isAr ? "شارك المسبحة، والدال على الخير كفاعله" : "Share the tasbih"}
                </button>
                {!isCustom && (
                  <button type="button" onClick={shareDhikr} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-primary transition hover:border-secondary hover:bg-secondary/10">
                    {dhikrCopied ? <Check className="h-4 w-4 text-secondary" /> : <Share2 className="h-4 w-4" />}
                    {dhikrCopied ? (isAr ? "اتنسخ" : "Copied") : isAr ? "ابعت الذكر ده لحد" : "Send this dhikr"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!roomSlug && <MemorialSection isAr={isAr} onCreated={(slug) => navigate(`/misbaha/${slug}`)} />}

      {summaryOpen && (
        <SummaryDialog
          isAr={isAr}
          tally={st.tally}
          total={st.today}
          roomName={room?.name}
          pageUrl={pageUrl}
          onClose={() => setSummaryOpen(false)}
        />
      )}

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

/** Top of a shared misbaha page: whose it is, the shared total, and how to spread it. */
function RoomHeader({ isAr, state, room, onShare, waHref, pageUrl, copied, fmt }: {
  isAr: boolean; state: string; room: MisbahaRoom | null; onShare: () => void; waHref: string; pageUrl: string; copied: boolean; fmt: (n: number) => string;
}) {
  if (state === "loading") return <div className="mx-auto h-28 max-w-md animate-pulse rounded-3xl bg-white/10" />;
  if (!room) {
    return (
      <div className="rounded-3xl bg-white/10 p-6">
        <h1 className="text-2xl font-black md:text-3xl">{isAr ? "السبحة دي مش متاحة" : "This tasbih is not available"}</h1>
        <p className="mt-2 text-sm text-white/80">{state === "pending" ? MISBAHA_ROOMS_PENDING_AR : (isAr ? "الرابط ممكن يكون غلط أو السبحة اتشالت. تقدر تسبّح هنا عادي، أو تعمل سبحة جديدة." : "The link may be wrong or the tasbih was removed. You can still count here, or create a new one.")}</p>
        <Link to="/misbaha#memorial" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-black text-slate-950"><Plus className="h-4 w-4" /> {isAr ? "اعمل سبحة لحد غالي عليك" : "Create one for a loved one"}</Link>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm font-black text-secondary">{isAr ? "سبحة جماعية" : "Shared tasbih"}</p>
      <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">{isAr ? `لروح ${room.name}` : `For the soul of ${room.name}`}</h1>
      <p className="mt-2 text-sm text-white/80">{isAr ? "اللهم اغفر لموتانا وموتى المسلمين، وارحمهم، واجعل قبورهم روضةً من رياض الجنة." : "O Allah, forgive our dead and the dead of the Muslims and have mercy on them."}</p>
      <div className="mx-auto mt-5 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3">
        <Users className="h-5 w-5 text-secondary" />
        <span className="text-start">
          <span className="block font-mono text-3xl font-black tabular-nums">{fmt(room.total_count)}</span>
          <span className="block text-xs font-bold text-white/70">{isAr ? "ذكر اتقال لحد دلوقتي من كل اللي شاركوا" : "dhikr said so far by everyone"}</span>
        </span>
      </div>
      {room.target_total ? (
        <div className="mx-auto mt-3 max-w-sm">
          <div className="h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={room.target_total} aria-valuenow={Math.min(room.total_count, room.target_total)}
            aria-label={isAr ? "التقدم نحو هدف السبحة" : "Progress to the goal"}>
            <div className="h-full rounded-full bg-secondary transition-[width] duration-500" style={{ width: `${Math.min(100, (room.total_count / room.target_total) * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs font-bold text-white/70">
            {room.total_count >= room.target_total
              ? (isAr ? `وصلنا للهدف: ${fmt(room.target_total)} ذكر. كمّلوا، الخير ما بيخلصش.` : `Goal of ${fmt(room.target_total)} reached. Keep going.`)
              : (isAr ? `الهدف ${fmt(room.target_total)} ذكر، فاضل ${fmt(room.target_total - room.total_count)}` : `Goal ${fmt(room.target_total)}, ${fmt(room.target_total - room.total_count)} to go`)}
          </p>
        </div>
      ) : null}
      {room.created_by && <p className="mt-2 text-xs font-bold text-white/60">{isAr ? `السبحة دي عملها ${room.created_by}` : `Created by ${room.created_by}`}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-black text-white shadow-cta">
          <WhatsAppIcon className="h-4 w-4" /> {isAr ? "ابعتها على واتساب" : "Send on WhatsApp"}
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1877F2] px-4 py-2.5 text-sm font-black text-white">{isAr ? "فيسبوك" : "Facebook"}</a>
        <a href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-black text-white">{isAr ? "تليجرام" : "Telegram"}</a>
        <button type="button" onClick={onShare} className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-black text-white hover:bg-white/10">
          {copied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />} {copied ? (isAr ? "اتنسخ الرابط" : "Link copied") : (isAr ? "انسخ الرابط" : "Copy link")}
        </button>
      </div>
      <p className="mt-4 text-sm text-white/80">
        {isAr ? `وتقدر كمان تعمل صدقة جارية على روح ${room.name}: ` : `You can also give an ongoing charity for ${room.name}: `}
        <Link to="/water" className="font-black text-secondary underline-offset-4 hover:underline">{isAr ? "سقيا ماء" : "water"}</Link>
        {isAr ? " أو " : " or "}
        <Link to="/donate" className="font-black text-secondary underline-offset-4 hover:underline">{isAr ? "تبرّع صدقة جارية" : "give an ongoing charity"}</Link>
      </p>
    </div>
  );
}

/** «سبحة لمتوفّى»: create a shared misbaha, and see recent ones. */
function MemorialSection({ isAr, onCreated }: { isAr: boolean; onCreated: (slug: string) => void }) {
  const [name, setName] = useState("");
  const [by, setBy] = useState("");
  const [goal, setGoal] = useState<number>(10000);
  const [dhikrId, setDhikrId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<MisbahaRoom[]>([]);
  useEffect(() => { void misbahaRoomsApi.list(12).then(setRooms); }, []);
  const fmt = (n: number) => n.toLocaleString(isAr ? "ar-EG" : "en-US");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) { setError(isAr ? "اكتب اسم المتوفّى" : "Enter the name"); return; }
    setBusy(true); setError(null);
    try {
      const room = await misbahaRoomsApi.create({
        name: clean.slice(0, 80),
        created_by: by.trim().slice(0, 60) || undefined,
        target_total: goal || undefined,
        dhikr_id: dhikrId || undefined,
      });
      onCreated(room.slug);
    } catch (err) {
      setError(isEndpointMissing(err) ? MISBAHA_ROOMS_PENDING_AR : ((err as Error)?.message || (isAr ? "تعذر إنشاء السبحة" : "Could not create it")));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section id="memorial" className="bg-muted/40 py-12 md:py-16" aria-labelledby="memorial-title">
      <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <h2 id="memorial-title" className="text-2xl font-black text-primary md:text-3xl">{isAr ? "اعمل سبحة لروح حد غالي عليك" : "Create a tasbih for a loved one"}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {isAr ? "اكتب اسم المتوفّى، وهتاخد رابط تبعته للعيلة والأصحاب. كل اللي يفتح الرابط ويسبّح، ذكره بيتضاف لعدّاد واحد، وتشوفوا كلكم مع بعض اتقال قد إيه." : "Enter the name and you get a link to send to family and friends. Everyone who opens it adds to one shared count."}
          </p>
          <form onSubmit={submit} className="mt-5 space-y-3 rounded-3xl bg-card p-5 shadow-soft" noValidate>
            <div>
              <label htmlFor="memorial-name" className="text-sm font-black text-primary">{isAr ? "اسم المتوفّى" : "Name of the deceased"}</label>
              <input id="memorial-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required
                placeholder={isAr ? "مثلًا: الحاج محمد عبد الله" : "e.g. Hajj Muhammad Abdullah"}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 font-bold outline-none focus:border-secondary" />
            </div>
            <div>
              <label htmlFor="memorial-by" className="text-sm font-black text-primary">{isAr ? "اسمك (اختياري)" : "Your name (optional)"}</label>
              <input id="memorial-by" value={by} onChange={(e) => setBy(e.target.value)} maxLength={60}
                placeholder={isAr ? "هيظهر تحت اسم السبحة" : "Shown under the tasbih name"}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 font-bold outline-none focus:border-secondary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="memorial-goal" className="text-sm font-black text-primary">{isAr ? "هدف السبحة" : "Goal"}</label>
                <select id="memorial-goal" value={goal} onChange={(e) => setGoal(Number(e.target.value))}
                  className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 font-bold outline-none focus:border-secondary">
                  {[1000, 10000, 100000, 1000000].map((n) => <option key={n} value={n}>{n.toLocaleString(isAr ? "ar-EG" : "en-US")} {isAr ? "ذكر" : "dhikr"}</option>)}
                  <option value={0}>{isAr ? "من غير هدف" : "No goal"}</option>
                </select>
              </div>
              <div>
                <label htmlFor="memorial-dhikr" className="text-sm font-black text-primary">{isAr ? "الذكر المقترح" : "Suggested dhikr"}</label>
                <select id="memorial-dhikr" value={dhikrId} onChange={(e) => setDhikrId(e.target.value)}
                  className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 font-bold outline-none focus:border-secondary">
                  <option value="">{isAr ? "أذكار متنوّعة" : "Varied dhikr"}</option>
                  {["astaghfir", "salawat", "la_ilaha", "subhan_bihamdih", "tahleel", "hawqala"].map((id) => {
                    const d = ALL.find((x) => x.id === id);
                    return d ? <option key={id} value={id}>{isAr ? d.text : d.en}</option> : null;
                  })}
                </select>
              </div>
            </div>
            {error && <p className="text-sm font-bold text-destructive" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-black text-primary-foreground transition hover:opacity-95 disabled:opacity-60">
              <Plus className="h-4 w-4" /> {busy ? (isAr ? "بتتعمل..." : "Creating...") : (isAr ? "اعمل السبحة وخُد الرابط" : "Create and get the link")}
            </button>
            <p className="text-[11px] font-semibold text-muted-foreground">{isAr ? "صفحة السبحة مش بتظهر في جوجل، وبتوصل بس للي معاه الرابط أو من القايمة هنا." : "Tasbih pages are not shown in search engines."}</p>
          </form>
        </div>
        <div>
          <h3 className="text-lg font-black text-primary">{isAr ? "سبح بيتشارك فيها دلوقتي" : "Shared tasbihs right now"}</h3>
          {rooms.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">{isAr ? "أول سبحة هتعملها هتظهر هنا، وأي حد يقدر يدخل يشارك فيها." : "The first one you create will show here."}</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {rooms.map((r) => (
                <li key={r.slug}>
                  <Link to={`/misbaha/${r.slug}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition hover:border-secondary">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-primary">{isAr ? `لروح ${r.name}` : `For ${r.name}`}</span>
                      <span className="block text-[11px] font-bold text-muted-foreground">
                        {isAr ? `${fmt(r.total_count)} ذكر` : `${fmt(r.total_count)} dhikr`}
                        {r.target_total ? (isAr ? ` من ${fmt(r.target_total)}` : ` of ${fmt(r.target_total)}`) : ""}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-secondary/20 px-3 py-1 text-xs font-black text-primary">{isAr ? "شارك" : "Join"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/** «حصيلتك»: an image of today's dhikr by kind, ready to save or share. */
function SummaryDialog({ isAr, tally, total, roomName, pageUrl, onClose }: {
  isAr: boolean; tally: Tally; total: number; roomName?: string; pageUrl: string; onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [failed, setFailed] = useState(false);
  const locale = isAr ? "ar-EG" : "en-US";
  const fmt = (n: number) => n.toLocaleString(locale);
  const lines = GROUPS.map((g) => ({ label: isAr ? g.tallyAr : g.tallyEn, count: tally[g.id] ?? 0 })).filter((l) => l.count > 0);
  const day = new Date().toLocaleDateString(isAr ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    drawMisbahaSummary({
      title: roomName ? (isAr ? `لروح ${roomName}` : `For the soul of ${roomName}`) : (isAr ? "حصيلة ذكري النهارده" : "My dhikr today"),
      subtitle: day,
      lines,
      total,
      totalLabel: isAr ? "ذكر" : "dhikr",
      footer: isAr ? "سبّح معانا: elyusr.org/misbaha" : "Join in: elyusr.org/misbaha",
      rtl: isAr,
      locale,
    })
      .then((b) => { if (!alive) return; objectUrl = URL.createObjectURL(b); setBlob(b); setUrl(objectUrl); })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fileName = `hasilat-dhikr-${new Date().toISOString().slice(0, 10)}.png`;
  const canShareFile = !!blob && typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: "image/png" })] });
  const shareImage = async () => {
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], fileName, { type: "image/png" })], text: isAr ? `حصيلة ذكري النهارده. سبّح معانا: ${pageUrl}` : `My dhikr today. Join in: ${pageUrl}` });
    } catch { /* dismissed */ }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={isAr ? "حصيلة ذكرك" : "Your dhikr summary"} onClick={onClose}>
      <div className="relative max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-card p-4 shadow-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-muted text-primary" aria-label={isAr ? "إغلاق" : "Close"}><X className="h-4 w-4" /></button>
        <h2 className="pe-10 text-lg font-black text-primary">{isAr ? "تقبّل الله منك" : "May Allah accept it"}</h2>
        <ul className="mt-2 space-y-1 text-sm font-bold text-foreground/80">
          {lines.map((l) => <li key={l.label}>{fmt(l.count)} {l.label}</li>)}
        </ul>
        <div className="mt-3 overflow-hidden rounded-2xl bg-muted">
          {url ? <img src={url} alt={isAr ? "صورة حصيلة الذكر" : "Dhikr summary image"} className="block w-full" /> : (
            <div className="grid aspect-[4/5] place-items-center text-sm text-muted-foreground">{failed ? (isAr ? "تعذر تجهيز الصورة" : "Could not create the image") : (isAr ? "بنجهّز الصورة..." : "Preparing...")}</div>
          )}
        </div>
        <div className="mt-3 grid gap-2">
          {canShareFile && (
            <button type="button" onClick={shareImage} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-grad font-black text-accent-foreground shadow-cta">
              <Share2 className="h-4 w-4" /> {isAr ? "شارك الصورة" : "Share the image"}
            </button>
          )}
          {url && (
            <a href={url} download={fileName} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border font-black text-primary hover:border-secondary">
              <ImageDown className="h-4 w-4" /> {isAr ? "حمّل الصورة" : "Download the image"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Misbaha;
