import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RotateCcw, Vibrate, VibrateOff, Share2, Check, ImageDown, X, Plus, Flame, CalendarDays, Users, Gift, ArrowLeft } from "lucide-react";
import { DHIKR_GROUPS, ALL_DHIKR, MIXED_DHIKR, groupOfDhikr, type Dhikr as DhikrType } from "@/data/adhkar";
import { misbahaRoomsApi, type MisbahaRoom } from "@/data/api/misbahaRoomsApi";
import { roomShareText, roomTitle } from "@/data/memorialDuas";
import { RoomHeader } from "@/components/misbaha/RoomHeader";
import { RoomExtras } from "@/components/misbaha/RoomExtras";
import { StoryDialog } from "@/components/misbaha/StoryDialog";
import { MemorialCreate } from "@/components/misbaha/MemorialCreate";
import { track } from "@/lib/track";
import { isEndpointMissing } from "@/data/api/backendPending";
import { drawMisbahaSummary } from "@/lib/misbahaSummaryImage";
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

/** Days in a row with at least one dhikr (this device). */
const STREAK_KEY = "yusr-misbaha-streak";
const dayBefore = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(y, m - 1, d - 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};
const readStreak = (): number => {
  try {
    const s = JSON.parse(localStorage.getItem(STREAK_KEY) || "null") as { last: string; n: number } | null;
    if (!s) return 0;
    const today = todayStr();
    return s.last === today || s.last === dayBefore(today) ? s.n : 0;
  } catch {
    return 0;
  }
};
const bumpStreak = (): number => {
  try {
    const today = todayStr();
    const s = JSON.parse(localStorage.getItem(STREAK_KEY) || "null") as { last: string; n: number } | null;
    if (s?.last === today) return s.n;
    const n = s?.last === dayBefore(today) ? s.n + 1 : 1;
    localStorage.setItem(STREAK_KEY, JSON.stringify({ last: today, n }));
    return n;
  } catch {
    return 0;
  }
};
const hijriToday = (isAr: boolean) => {
  try {
    return new Intl.DateTimeFormat(isAr ? "ar-EG-u-ca-islamic-umalqura" : "en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  } catch {
    return "";
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
  const [storyOpen, setStoryOpen] = useState(false);
  const [streak, setStreak] = useState<number>(() => readStreak());
  const [siteStats, setSiteStats] = useState<{ rooms: number; total: number } | null>(null);
  useEffect(() => {
    if (roomSlug) return;
    void misbahaRoomsApi.stats().then(setSiteStats);
  }, [roomSlug]);
  const doneTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try { localStorage.setItem(keyFor(roomSlug), JSON.stringify(st)); } catch { /* private mode: counting still works */ }
  }, [st, roomSlug]);
  useEffect(() => () => window.clearTimeout(doneTimer.current), []);

  // ── Shared misbaha (for someone who passed away) ──
  const [room, setRoom] = useState<MisbahaRoom | null>(null);
  const [roomState, setRoomState] = useState<"none" | "loading" | "ok" | "missing" | "pending">(roomSlug ? "loading" : "none");
  const pendingAdd = useRef(0);
  const myFlushed = useRef(0);
  const baseline = useRef<number | null>(null);
  const [othersRecent, setOthersRecent] = useState(0);
  useEffect(() => {
    if (!roomSlug) return;
    let alive = true;
    misbahaRoomsApi
      .get(roomSlug)
      .then((r) => {
        if (!alive) return;
        setRoom(r);
        setRoomState(r ? "ok" : "missing");
        if (r) baseline.current = r.total_count;
      })
      .catch((e) => alive && setRoomState(isEndpointMissing(e) ? "pending" : "missing"));
    return () => { alive = false; };
  }, [roomSlug]);
  // Live: refresh the shared total every 15 s while the page is visible, so everyone sees it climb.
  useEffect(() => {
    if (!roomSlug || roomState !== "ok") return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void misbahaRoomsApi.get(roomSlug).then((r) => {
        if (!r) return;
        setRoom((prev) => (prev ? { ...prev, ...r, total_count: Math.max(prev.total_count, r.total_count + pendingAdd.current) } : r));
        if (baseline.current !== null) setOthersRecent(Math.max(0, r.total_count - baseline.current - myFlushed.current));
      }).catch(() => undefined);
    };
    const t = window.setInterval(refresh, 15000);
    return () => window.clearInterval(t);
  }, [roomSlug, roomState]);
  // Taps are sent in small batches (every 3 s, and when the page is hidden) instead of one request each.
  useEffect(() => {
    if (!roomSlug || roomState !== "ok") return;
    const flush = () => {
      const n = pendingAdd.current;
      if (n <= 0) return;
      pendingAdd.current = 0;
      misbahaRoomsApi
        .add(roomSlug, Math.min(n, 500))
        .then((total) => {
          myFlushed.current += n;
          if (total !== null) setRoom((r) => (r ? { ...r, total_count: Math.max(total + pendingAdd.current, r.total_count) } : r));
        })
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
    if (st.today === 0 || streak === 0) setStreak(bumpStreak());
    if (completes) {
      setDone(true);
      window.clearTimeout(doneTimer.current);
      doneTimer.current = window.setTimeout(() => setDone(false), 1800);
    }
    vibrate(completes ? [40, 60, 40] : 8);
  }, [countKey, target, count, dhikr.id, roomSlug, roomState, st.today, streak]); // eslint-disable-line react-hooks/exhaustive-deps

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
    ? roomShareText(room.kind, room.gender, room.name, isAr)
    : (isAr ? "مسبحة إلكترونية من مؤسسة اليسر: صلّ على النبي ﷺ، وسبّح، واستغفر" : "A digital tasbih from Al-Yusr");
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${pageUrl}?utm_source=whatsapp&utm_medium=share&utm_campaign=misbaha`)}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      track("misbaha_share", { payload: { channel: "copy", room: roomSlug ?? "personal" }, fbCustom: false });
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* no clipboard */ }
  };
  const canNative = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const nativeShare = async () => {
    try {
      await navigator.share({ title: room ? roomTitle(room.kind, room.gender, room.name, isAr) : isAr ? "المسبحة الإلكترونية" : "Digital tasbih", text: shareText, url: pageUrl });
      track("misbaha_share", { payload: { channel: "native", room: roomSlug ?? "personal" }, fbCustom: false });
    } catch { /* dismissed */ }
  };
  const share = async () => (canNative ? nativeShare() : copyLink());
  const isNew = !!roomSlug && params.get("new") === "1";

  const fmt = (n: number) => n.toLocaleString(isAr ? "ar-EG" : "en-US");
  const beads = useMemo(() => BEAD_POS, []);

  return (
    <PageLayout>
      {roomSlug ? (
        // Shared misbaha pages carry a family's loved one's name: kept out of search results.
        <SEOHelmet noindex
          title={room ? `${isAr ? "سبحة" : "Tasbih"} ${roomTitle(room.kind, room.gender, room.name, isAr)} | ${isAr ? "مؤسسة اليسر" : "Al-Yusr"}` : (isAr ? "سبحة مشتركة | مؤسسة اليسر" : "Shared tasbih | Al-Yusr")}
          description={isAr ? "شارك بالتسبيح والاستغفار والصلاة على النبي ﷺ، وكل ذكر بيتضاف لعدّاد واحد." : "Join in with tasbih, istighfar and salawat; every dhikr adds to one shared count."}
          path={`/misbaha/${roomSlug}`}
          image={`https://elyusr.org/og/misbaha-${room?.kind ?? "deceased"}.jpg?v=2026.11`}
        />
      ) : (
      <SEOHelmet
        title={isAr ? "المسبحة الإلكترونية | صلاة على النبي وتسبيح واستغفار — مؤسسة اليسر" : "Digital tasbih | Salawat, tasbih & istighfar — Al-Yusr"}
        description={isAr ? "مسبحة إلكترونية سهلة: صلِّ على النبي ﷺ، وسبّح، واستغفر، واذكر الله، مع عدّاد وهدف يومي وفضل كل ذكر من الأحاديث الصحيحة. واعمل سبحة لروح حد غالي عليك وشاركها." : "An easy digital tasbih: salawat, tasbih, istighfar and dhikr with a counter, daily goal and the virtue of each dhikr. Create a shared tasbih for a loved one who passed away."}
        path="/misbaha"
        image="https://elyusr.org/og/misbaha.jpg?v=2026.11"
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
              <RoomHeader isAr={isAr} state={roomState} room={room} waHref={waHref} copied={copied} onCopy={copyLink} onNativeShare={canNative ? nativeShare : null}
                onStory={() => setStoryOpen(true)} live={roomState === "ok"} othersRecent={othersRecent} isNew={isNew} fmt={(n) => n.toLocaleString(isAr ? "ar-EG" : "en-US")} />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs font-black">
                  {hijriToday(isAr) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-white/85"><CalendarDays className="h-3.5 w-3.5 text-secondary" /> {hijriToday(isAr)}</span>
                  )}
                  {siteStats && siteStats.total > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-white/85">
                      <Users className="h-3.5 w-3.5 text-secondary" /> {isAr ? `${fmt(siteStats.total)} ذكر في ${fmt(siteStats.rooms)} سبحة مشتركة` : `${fmt(siteStats.total)} dhikr in ${fmt(siteStats.rooms)} shared tasbihs`}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-black sm:text-4xl md:text-5xl">{isAr ? "المسبحة الإلكترونية" : "Digital tasbih"}</h1>
                <p className="mt-3 text-base text-primary-foreground/85 md:text-lg">
                  {isAr ? "قول الذكر واضغط على المسبحة. الذكر بيتغيّر مع كل ضغطة علشان تجمع بين الصلاة على النبي ﷺ والتسبيح والاستغفار، وتقدر تختار ذكر واحد لو حابب. عدّادك بيتحفظ على جهازك طول اليوم، ويبدأ من الأول مع يوم جديد." : "Say the dhikr and tap the beads. It changes with every tap so you combine salawat, tasbih and istighfar; you can also pick a single dhikr. Your count stays on this device for the day and starts fresh each new day."}
                </p>
              </>
            )}
          </div>

          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* ── Counter ── */}
            <div className="flex min-w-0 flex-col items-center">
              <div className="mb-5 flex min-h-[8.75rem] w-full min-w-0 max-w-md flex-col justify-center text-center sm:min-h-[6.5rem]" aria-live="polite">
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
                <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-bold text-white/75">
                  <span>{isAr ? `ذكرك النهارده: ${fmt(st.today)}` : `Today's dhikr: ${fmt(st.today)}`}</span>
                  {streak >= 2 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-black text-secondary">
                      <Flame className="h-3.5 w-3.5" /> {isAr ? `${fmt(streak)} أيام ورا بعض` : `${fmt(streak)}-day streak`}
                    </span>
                  )}
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

      {roomSlug && room && roomState === "ok" && <RoomExtras isAr={isAr} room={room} pageUrl={pageUrl} />}
      {!roomSlug && <MemorialCreate isAr={isAr} onCreated={(slug) => navigate(`/misbaha/${slug}?new=1`)} />}
      {storyOpen && room && <StoryDialog isAr={isAr} room={room} pageUrl={pageUrl} onClose={() => setStoryOpen(false)} />}

      {summaryOpen && (
        <SummaryDialog
          isAr={isAr}
          tally={st.tally}
          total={st.today}
          roomTitle={room ? (room.kind === "group" ? (isAr ? `مع ${room.name}` : `With ${room.name}`) : roomTitle(room.kind, room.gender, room.name, isAr)) : undefined}
          pageUrl={pageUrl}
          onClose={() => setSummaryOpen(false)}
        />
      )}

      {/* Who the tasbih is from (rooms have their own closing section) */}
      {!roomSlug && <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-center text-primary-foreground shadow-card sm:px-10">
            <span aria-hidden className="pointer-events-none absolute inset-0 leaf-bg opacity-20" />
            <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 ring-1 ring-accent/40">
              <Gift className="h-7 w-7 text-accent" />
            </span>
            <h2 className="relative mt-4 text-2xl font-black leading-snug md:text-3xl">
              {isAr ? "هذه السبحة هدية من مؤسسة اليسر الخيرية" : "This tasbih is a gift from Al-Yusr Charity Foundation"}
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/80 md:text-base">
              {isAr ? "استخدمها وشاركها مع أحبابك، ولكل من يذكر الله بيها أجر." : "Use it and share it with your loved ones; every remembrance carries reward."}
            </p>
            <Link to="/about" className="relative mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-grad px-7 py-3 text-sm font-black text-accent-foreground shadow-cta transition hover:-translate-y-0.5 hover:opacity-95">
              {isAr ? "تعرّف علينا أكثر" : "Get to know us"}
              <ArrowLeft className="h-4 w-4 ltr:rotate-180" />
            </Link>
          </div>
        </div>
      </section>}
    </PageLayout>
  );
};

/** «حصيلتك»: an image of today's dhikr by kind, ready to save or share. */
function SummaryDialog({ isAr, tally, total, roomTitle: title, pageUrl, onClose }: {
  isAr: boolean; tally: Tally; total: number; /** the room's own wording: «لروح المرحوم …» / «بنية شفاء …» / «مع عيلة …» */ roomTitle?: string; pageUrl: string; onClose: () => void;
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
      title: title || (isAr ? "حصيلة ذكري النهارده" : "My dhikr today"),
      subtitle: day,
      lines,
      total,
      totalLabel: isAr ? "ذكر" : "dhikr",
      footer: `${isAr ? "سبّح معانا:" : "Join in:"} ${pageUrl.replace(/^https?:\/\//, "")}`,
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
      await navigator.share({ files: [new File([blob], fileName, { type: "image/png" })], text: isAr ? `حصيلة ذكري النهارده${title ? ` — ${title}` : ""}. سبّح معانا: ${pageUrl}` : `My dhikr today${title ? ` — ${title}` : ""}. Join in: ${pageUrl}` });
    } catch { /* dismissed */ }
  };

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={isAr ? "حصيلة ذكرك" : "Your dhikr summary"} onClick={onClose}>
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
