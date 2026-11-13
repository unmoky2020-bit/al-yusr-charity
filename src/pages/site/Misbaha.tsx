import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RotateCcw, Vibrate, VibrateOff, Share2, Check, ImageDown, X, Plus, Flame, CalendarDays, Users, Gift, ArrowLeft, ArrowDown, Undo2, Maximize2, ChevronDown, Infinity as InfinityIcon } from "lucide-react";
import { DHIKR_GROUPS, ALL_DHIKR, MIXED_DHIKR, groupOfDhikr, type Dhikr as DhikrType } from "@/data/adhkar";
import { misbahaRoomsApi, type MisbahaRoom } from "@/data/api/misbahaRoomsApi";
import { roomShareText, roomTitle } from "@/data/memorialDuas";
import { RoomHeader, RoomShareActions } from "@/components/misbaha/RoomHeader";
import { RoomExtras } from "@/components/misbaha/RoomExtras";
import { MisbahaFollow } from "@/components/misbaha/MisbahaFollow";
import { StoryDialog } from "@/components/misbaha/StoryDialog";
import { FocusMode } from "@/components/misbaha/FocusMode";
import { addToHistory, dayKey, lastWeek, readHistory } from "@/lib/sebhaHistory";
import { MemorialCreate } from "@/components/misbaha/MemorialCreate";
import { UMMAH_ROOM_SLUG, UmmahRoomCard } from "@/components/misbaha/UmmahRoomCard";
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
// «One kind» is the default (istighfar, tasbih, salawat…): its phrases take turns on every tap,
// so the visitor picks a kind, not a phrase from a list. «Varied» mixes all kinds.
const MODES: { id: Mode; ar: string; en: string; subAr: string; subEn: string }[] = [
  { id: "single", ar: "نوع واحد", en: "One kind", subAr: "تختاره وأذكاره تتنوّع", subEn: "its phrases take turns" },
  { id: "mixed", ar: "أذكار متنوّعة", en: "Varied dhikr", subAr: "تتغيّر مع كل ضغطة", subEn: "changes with every tap" },
];

type Tally = Partial<Record<(typeof GROUPS)[number]["id"], number>>;
type Custom = { id: string; text: string };
type Saved = {
  mode: Mode; selected: string; counts: Record<string, number>; tally: Tally; targets: Record<string, number>; day: string; today: number; vibrate: boolean; custom: Custom[];
  /** the visitor chose a kind / mode themself: a shared sebha's suggested dhikr no longer overrides it */
  picked?: boolean;
};
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
  const fresh: Saved = { mode: "single", selected: ALL[0].id, counts: {}, tally: {}, targets: {}, day: todayStr(), today: 0, vibrate: true, custom: [] };
  try {
    const raw = localStorage.getItem(keyFor(room)) ?? (room ? null : localStorage.getItem("yusr-misbaha-v1"));
    const s = JSON.parse(raw || "null") as Partial<Saved> | null;
    if (!s || typeof s !== "object") return fresh;
    const out = { ...fresh, ...s, counts: { ...(s.counts || {}) }, tally: { ...(s.tally || {}) }, targets: { ...(s.targets || {}) }, custom: Array.isArray(s.custom) ? s.custom.slice(0, 20) : [] } as Saved;
    if (!ALL.some((d) => d.id === out.selected) && !out.custom.some((c) => c.id === out.selected)) out.selected = fresh.selected;
    if (out.mode !== "single" && out.mode !== "mixed") out.mode = fresh.mode;
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
const todayLabel = (isAr: boolean) => {
  try {
    return new Intl.DateTimeFormat(isAr ? "ar-EG-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  } catch {
    return "";
  }
};

/** Bead positions on the ring (static). */
const BEAD_POS = Array.from({ length: BEADS }, (_, i) => {
  const a = (-90 + (i * 360) / BEADS) * (Math.PI / 180);
  return { x: 150 + 118 * Math.cos(a), y: 150 + 118 * Math.sin(a) };
});

type UndoStep = { kind: "tap"; key: string; gid: string; room: boolean } | { kind: "reset"; key: string; value: number };

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
  const [focus, setFocus] = useState(false);
  const [showAllMixed, setShowAllMixed] = useState(false);
  // Lifetime total and the last days (this device). Today's count from before this existed seeds it once.
  const [hist, setHist] = useState(() => {
    const h = readHistory();
    const saved = load(roomSlug);
    return h.days[dayKey()] === undefined && saved.today > 0 ? addToHistory(saved.today) : h;
  });
  /** What «تراجع» can take back: taps (newest last) and resets. */
  const undoStack = useRef<UndoStep[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const pushUndo = (u: UndoStep) => {
    undoStack.current = [...undoStack.current.slice(-199), u];
    setUndoCount(undoStack.current.length);
  };
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
    // iPhone Safari often skips visibilitychange when the tab or app is closed; pagehide still fires.
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", flush); flush(); };
  }, [roomSlug, roomState]);

  // A shared link can open a specific dhikr: /misbaha?d=astaghfir
  const [params] = useSearchParams();
  useEffect(() => {
    const d = params.get("d");
    if (d && ALL.some((x) => x.id === d)) setSt((s) => ({ ...s, mode: "single", selected: d, picked: true }));
    // only on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // A shared sebha opens on what its creator chose: their dhikr (and its kind), or varied adhkar when
  // they chose none. Kept until the visitor picks something themself.
  useEffect(() => {
    if (!room) return;
    const d = room.dhikr_id;
    setSt((s) => {
      if (s.picked) return s;
      if (d && ALL.some((x) => x.id === d)) return s.mode === "single" && s.selected === d ? s : { ...s, mode: "single", selected: d };
      return s.mode === "mixed" ? s : { ...s, mode: "mixed" };
    });
  }, [room]);
  const customDhikr = useMemo(() => st.custom.map(customToDhikr), [st.custom]);
  const findDhikr = (id: string) => ALL.find((d) => d.id === id) ?? customDhikr.find((d) => d.id === id);

  const isMixed = st.mode === "mixed";
  // The visitor's own phrase is said as it is; everything else is a sequence that moves on every tap:
  // all adhkar (varied), or the phrases of one kind starting from the chosen one.
  const isCustom = !isMixed && st.selected.startsWith("my_");
  const kind = groupOfDhikr(st.selected);
  const seq: Dhikr[] | null = isMixed ? MIXED : isCustom ? null : kind.items;
  const countKey = isMixed ? MIXED_KEY : isCustom ? st.selected : `kind:${kind.id}`;
  const count = st.counts[countKey] ?? 0;
  const seqStart = isMixed || !seq ? 0 : Math.max(0, seq.findIndex((d) => d.id === st.selected));
  const seqAt = seq ? (seqStart + count) % seq.length : 0;
  const dhikr = seq ? seq[seqAt] : findDhikr(st.selected) ?? ALL[0];
  const nextDhikr = seq && seq.length > 1 ? seq[(seqAt + 1) % seq.length] : null;
  const group = isCustom ? null : kind;
  const target = st.targets[countKey] ?? (seq ? 100 : dhikr.target);
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
    const toRoom = !!roomSlug && roomState === "ok";
    if (toRoom) {
      pendingAdd.current += 1;
      setRoom((r) => (r ? { ...r, total_count: r.total_count + 1 } : r));
    }
    pushUndo({ kind: "tap", key: countKey, gid, room: toRoom });
    setHist(addToHistory(1));
    setPulse((p) => p + 1);
    if (st.today === 0 || streak === 0) setStreak(bumpStreak());
    if (completes) {
      setDone(true);
      window.clearTimeout(doneTimer.current);
      doneTimer.current = window.setTimeout(() => setDone(false), 1800);
    }
    vibrate(completes ? [40, 60, 40] : 8);
  }, [countKey, target, count, dhikr.id, roomSlug, roomState, st.today, streak]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Takes back the last tap (or the last reset). A tap already sent to a shared sebha stays counted there. */
  const undo = useCallback(() => {
    const u = undoStack.current[undoStack.current.length - 1];
    if (!u) return;
    undoStack.current = undoStack.current.slice(0, -1);
    setUndoCount(undoStack.current.length);
    setDone(false);
    if (u.kind === "reset") {
      setSt((s) => ({ ...s, counts: { ...s.counts, [u.key]: u.value } }));
      return;
    }
    setSt((s) => ({
      ...s,
      counts: { ...s.counts, [u.key]: Math.max(0, (s.counts[u.key] ?? 0) - 1) },
      tally: { ...s.tally, [u.gid]: Math.max(0, (s.tally[u.gid as keyof Tally] ?? 0) - 1) },
      today: Math.max(0, s.today - 1),
    }));
    setHist(addToHistory(-1));
    if (u.room && pendingAdd.current > 0) {
      pendingAdd.current -= 1;
      setRoom((r) => (r ? { ...r, total_count: Math.max(0, r.total_count - 1) } : r));
    }
    vibrate(15);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Phones count on the finger lifting, not on the browser's click: iPhone Safari drops or delays
  // clicks on fast repeated taps (and on the first tap after a hover change), so taps went missing.
  // A finger that moved (a scroll) is not a tap; the click that follows a counted touch is ignored.
  const ringTouch = useRef<{ x: number; y: number } | null>(null);
  const touchCountedAt = useRef(0);
  const onRingDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse") return;
    ringTouch.current = { x: e.clientX, y: e.clientY };
  };
  const onRingUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const start = ringTouch.current;
    ringTouch.current = null;
    if (!start || e.pointerType === "mouse") return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) return;
    touchCountedAt.current = Date.now();
    tap();
  };
  const onRingClick = () => {
    if (Date.now() - touchCountedAt.current < 800) return;
    tap();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (focus) return; // the focus screen has its own keys
      const el = e.target as HTMLElement | null;
      const typing = !!el && (!!el.closest("input, textarea, select, [contenteditable=true]") || el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); undo(); return; }
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, button, a, [contenteditable=true]") || t.isContentEditable)) return;
      e.preventDefault();
      tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap, undo, focus]);

  const [customText, setCustomText] = useState("");
  const addCustom = () => {
    const text = customText.trim().replace(/\s+/g, " ").slice(0, 120);
    if (text.length < 2) return;
    const id = `my_${Date.now().toString(36)}`;
    setSt((s) => ({ ...s, custom: [...s.custom, { id, text }].slice(-20), mode: "single", selected: id, picked: true }));
    setCustomText("");
  };
  const removeCustom = (id: string) =>
    setSt((s) => ({ ...s, custom: s.custom.filter((c) => c.id !== id), selected: s.selected === id ? ALL[0].id : s.selected }));

  const [dhikrCopied, setDhikrCopied] = useState(false);
  const shareDhikr = async () => {
    const url = `https://elyusr.org/misbaha?d=${dhikr.id}`;
    const text = isAr ? `ردّد معي: ${dhikr.text}` : `Say with me: ${dhikr.en}`;
    try {
      if (navigator.share) { await navigator.share({ text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setDhikrCopied(true);
      window.setTimeout(() => setDhikrCopied(false), 1800);
    } catch { /* dismissed */ }
  };

  const reset = () => {
    if (count > 0) pushUndo({ kind: "reset", key: countKey, value: count });
    setSt((s) => ({ ...s, counts: { ...s.counts, [countKey]: 0 } }));
    setDone(false);
  };
  const choose = (id: string) => { setSt((s) => ({ ...s, mode: "single", selected: id, picked: true })); setDone(false); };
  const setMode = (mode: Mode) => {
    // back to «one kind» from a custom phrase or varied: keep the kind, start from its first phrase
    setSt((s) => ({ ...s, mode, picked: true, selected: mode === "single" && s.selected.startsWith("my_") ? ALL[0].id : s.selected }));
    setDone(false);
  };
  const setTarget = (n: number) => setSt((s) => ({ ...s, targets: { ...s.targets, [countKey]: n } }));

  const pageUrl = roomSlug ? `https://elyusr.org/misbaha/${roomSlug}` : "https://elyusr.org/misbaha";
  const shareText = room
    ? roomShareText(room.kind, room.gender, room.name, isAr)
    : (isAr ? "سبحة إلكترونية من مؤسسة اليسر: صلّ على النبي ﷺ، وسبّح، واستغفر" : "A digital tasbih from Al-Yusr");
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
      await navigator.share({ title: room ? roomTitle(room.kind, room.gender, room.name, isAr) : isAr ? "السبحة الإلكترونية" : "Digital tasbih", text: shareText, url: pageUrl });
      track("misbaha_share", { payload: { channel: "native", room: roomSlug ?? "personal" }, fbCustom: false });
    } catch { /* dismissed */ }
  };
  const openShare = () => setStoryOpen(true);
  const isNew = !!roomSlug && params.get("new") === "1";

  const fmt = (n: number) => n.toLocaleString(isAr ? "ar-EG" : "en-US");
  const beads = useMemo(() => BEAD_POS, []);

  return (
    <PageLayout>
      {roomSlug ? (
        // Shared misbaha pages carry a family's loved one's name: kept out of search results.
        <SEOHelmet noindex={roomSlug !== UMMAH_ROOM_SLUG /* the public one for everyone is a page of the site */}
          title={roomSlug === UMMAH_ROOM_SLUG ? (isAr ? "سبحة جميع المسلمين والمسلمات | سبحة جماعية أونلاين — مؤسسة اليسر" : "The misbaha of all Muslims | shared online tasbih — Al-Yusr") : room ? `${isAr ? "سبحة" : "Tasbih"} ${roomTitle(room.kind, room.gender, room.name, isAr)} | ${isAr ? "مؤسسة اليسر" : "Al-Yusr"}` : (isAr ? "سبحة مشتركة | مؤسسة اليسر" : "Shared tasbih | Al-Yusr")}
          description={isAr ? "شارك بالتسبيح والاستغفار والصلاة على النبي ﷺ، ويُضاف كل ذكر إلى عدّاد واحد." : "Join in with tasbih, istighfar and salawat; every dhikr adds to one shared count."}
          path={`/misbaha/${roomSlug}`}
          image={`https://elyusr.org/og/misbaha-${room?.kind ?? "deceased"}.jpg?v=2026.11b`}
        />
      ) : (
      <SEOHelmet
        title={isAr ? "السبحة الإلكترونية | صلاة على النبي وتسبيح واستغفار — مؤسسة اليسر" : "Digital tasbih | Salawat, tasbih & istighfar — Al-Yusr"}
        description={isAr ? "سبحة إلكترونية سهلة: صلِّ على النبي ﷺ، وسبّح، واستغفر، واذكر الله، مع عدّاد وهدف يومي وفضل كل ذكر من الأحاديث الصحيحة. وأنشئ سبحة مشتركة لروح من تحب وشاركها." : "An easy digital tasbih: salawat, tasbih, istighfar and dhikr with a counter, daily goal and the virtue of each dhikr. Create a shared tasbih for a loved one who passed away."}
        path="/misbaha"
        image="https://elyusr.org/og/misbaha.jpg?v=2026.11b"
      />
      )}
      <BreadcrumbSchema items={[{ name: isAr ? "الرئيسية" : "Home", url: "https://elyusr.org/" }, { name: isAr ? "السبحة الإلكترونية" : "Digital tasbih", url: "https://elyusr.org/misbaha" }]} />

      <section className="pattern-hero-luxe relative overflow-hidden text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 leaf-bg opacity-20" />
        <div className="container relative mx-auto max-w-6xl px-4 pb-14 pt-5 sm:pt-10 md:pb-20 md:pt-14">
          {/* A shared sebha is opened from a link: on phones its name and the beads come first. */}
          <div className={`justify-center text-primary-foreground/80 ${roomSlug ? "hidden sm:flex" : "flex"}`}>
            <Breadcrumbs items={[{ name: isAr ? "الرئيسية" : "Home", href: "/" }, { name: isAr ? "السبحة الإلكترونية" : "Digital tasbih" }]} />
          </div>
          <div className={`mx-auto max-w-2xl text-center sm:mt-6 ${roomSlug ? "mt-0" : "mt-3"}`}>
            {roomSlug ? (
              <RoomHeader isAr={isAr} state={roomState} room={room}
                live={roomState === "ok"} othersRecent={othersRecent} fmt={(n) => n.toLocaleString(isAr ? "ar-EG" : "en-US")} />
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-xs font-black sm:mb-4">
                  {todayLabel(isAr) && (
                    <span className="hidden items-center sm:inline-flex gap-1.5 rounded-full bg-white/10 px-3 py-1 text-white/85"><CalendarDays className="h-3.5 w-3.5 text-secondary" /> {todayLabel(isAr)}</span>
                  )}
                  {siteStats && siteStats.total > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-white/85">
                      <Users className="h-3.5 w-3.5 text-secondary" /> {isAr ? `${fmt(siteStats.total)} ذكر في ${fmt(siteStats.rooms)} سبحة مشتركة` : `${fmt(siteStats.total)} dhikr in ${fmt(siteStats.rooms)} shared tasbihs`}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-black sm:text-4xl md:text-5xl">{isAr ? "السبحة الإلكترونية" : "Digital tasbih"}</h1>
                {/* Phones: one short line, so the sebha itself is on the first screen. */}
                <p className="mt-2 text-sm font-bold text-primary-foreground/80 sm:hidden">
                  {isAr ? "قل الذكر واضغط على السبحة، وعدّادك محفوظ على جهازك طوال اليوم." : "Say the dhikr and tap the beads; your count stays on this device for the day."}
                </p>
                <p className="mt-3 hidden text-base text-primary-foreground/85 sm:block md:text-lg">
                  {isAr ? "قل الذكر واضغط على السبحة. يتغيّر الذكر مع كل ضغطة لتجمع بين الصلاة على النبي ﷺ والتسبيح والاستغفار، ويمكنك أن تختار ذكرًا واحدًا إن أردت. يُحفظ عدّادك على جهازك طوال اليوم، ويبدأ من جديد مع كل يوم." : "Say the dhikr and tap the beads. It changes with every tap so you combine salawat, tasbih and istighfar; you can also pick a single dhikr. Your count stays on this device for the day and starts fresh each new day."}
                </p>
              </>
            )}
          </div>

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)] items-start gap-8 sm:mt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* ── Counter ── */}
            <div className="flex min-w-0 flex-col items-center">
              <div className="mb-4 flex min-h-[6.5rem] w-full min-w-0 max-w-md flex-col justify-center text-center sm:mb-5" aria-live="polite">
                <button type="button" onClick={() => document.getElementById("dhikr-choice")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/80 transition hover:bg-white/15">
                  <ArrowDown className="h-3.5 w-3.5 text-secondary" /> {isAr ? "يمكنك النزول واختيار الذكر الذي تحبه" : "Scroll down to pick the dhikr you like"}
                </button>
                <p className="text-xs font-black text-secondary">{seq ? (isAr ? "قل الآن" : "Say now") : (isAr ? "ذكرك" : "Your dhikr")}<span className="hidden font-bold text-white/45 sm:inline">{isAr ? " (اضغط على السبحة أو زر المسافة)" : " (tap the beads or press Space)"}</span></p>
                <p key={`${dhikr.id}-${seq ? count : 0}`} className="misbaha-fade mt-1 text-xl font-black leading-[1.7] text-white sm:text-2xl">{isAr ? dhikr.text : dhikr.en}</p>
                {nextDhikr && (
                  <p className="mt-1 truncate text-xs font-bold text-white/55">{isAr ? `التالي: ${nextDhikr.text}` : `Next: ${nextDhikr.en}`}</p>
                )}
              </div>
              <button
                type="button"
                onPointerDown={onRingDown}
                onPointerUp={onRingUp}
                onPointerCancel={() => { ringTouch.current = null; }}
                onClick={onRingClick}
                onContextMenu={(e) => e.preventDefault()}
                className={`misbaha-ring relative aspect-square w-full max-w-[min(340px,72vw)] select-none sm:max-w-[340px] rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60 ${done ? "misbaha-done" : ""}`}
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", WebkitTouchCallout: "none" }}
                aria-label={isAr ? `اضغط بعد أن تقول: ${dhikr.text}. العدد ${count}` : `Tap after saying: ${dhikr.en}. Count ${count}`}
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

              {/* Progress toward the target (the ring shows it too; the bar says how much is left) */}
              {target > 0 && (
                <div className="mt-5 w-full max-w-xs">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={showFull ? target : inRound}
                    aria-label={isAr ? "التقدم نحو الهدف" : "Progress to the goal"}>
                    <div className="h-full rounded-full bg-secondary transition-[width] duration-200" style={{ width: `${((showFull ? target : inRound) / target) * 100}%` }} />
                  </div>
                  <p className="mt-1.5 text-center text-xs font-bold text-white/65">
                    {showFull
                      ? (isAr ? "أتممت الهدف، تقبّل الله منك" : "Goal reached, may Allah accept it")
                      : isAr ? `باقي ${fmt(target - inRound)} للوصول إلى ${fmt(target)}` : `${fmt(target - inRound)} left to ${fmt(target)}`}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2" role="group" aria-label={isAr ? "الهدف" : "Target"}>
                {TARGETS.map((n) => (
                  <button key={n} type="button" onClick={() => setTarget(n)} aria-pressed={target === n}
                    className={`rounded-full px-4 py-1.5 text-sm font-black transition ${target === n ? "bg-secondary text-slate-950" : "bg-white/10 text-white hover:bg-white/20"}`}>
                    {n ? fmt(n) : isAr ? "بدون حد" : "No limit"}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
                <button type="button" onClick={undo} disabled={undoCount === 0} title={isAr ? "تراجع عن آخر ضغطة (Ctrl+Z)" : "Undo the last tap (Ctrl+Z)"}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-white/90 transition hover:bg-white/10 disabled:opacity-35">
                  <Undo2 className="h-4 w-4" /> {isAr ? "تراجع" : "Undo"}
                </button>
                <button type="button" onClick={reset} disabled={count === 0} aria-label={isAr ? "تصفير عدّاد هذا الذكر (يمكنك التراجع)" : "Reset this counter (can be undone)"}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-white/90 transition hover:bg-white/10 disabled:opacity-35">
                  <RotateCcw className="h-4 w-4" /> {isAr ? "تصفير" : "Reset"}
                </button>
                <button type="button" onClick={() => setSt((s) => ({ ...s, vibrate: !s.vibrate }))} aria-pressed={st.vibrate}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-white/90 transition hover:bg-white/10">
                  {st.vibrate ? <Vibrate className="h-4 w-4" /> : <VibrateOff className="h-4 w-4" />} {isAr ? (st.vibrate ? "الاهتزاز مفعّل" : "الاهتزاز متوقف") : st.vibrate ? "Vibration on" : "Vibration off"}
                </button>
              </div>
              <button type="button" onClick={() => setFocus(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-black text-white transition hover:bg-white/20">
                <Maximize2 className="h-4 w-4 text-secondary" /> {isAr ? "وضع التركيز: الشاشة كلها سبحة" : "Focus mode: the whole screen counts"}
              </button>
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-bold text-white/75">
                  <span>{isAr ? `ذكرك اليوم: ${fmt(st.today)}` : `Today's dhikr: ${fmt(st.today)}`}</span>
                  {streak >= 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-black text-secondary">
                      <Flame className="h-3.5 w-3.5" /> {isAr ? (streak === 1 ? "اليوم الأول، ارجع بكرة" : streak === 2 ? "يومان متتاليان" : `${fmt(streak)} ${streak <= 10 ? "أيام" : "يومًا"} متتالية`) : `${fmt(streak)}-day streak`}
                    </span>
                  )}
                  {hist.total > st.today && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-black text-white/85">
                      <InfinityIcon className="h-3.5 w-3.5 text-secondary" /> {isAr ? `${fmt(hist.total)} ذكر منذ بدأت` : `${fmt(hist.total)} in total`}
                    </span>
                  )}
                </p>
                <WeekStrip isAr={isAr} days={lastWeek(hist)} fmt={fmt} />
                {st.today > 0 && (
                  <button type="button" onClick={() => setSummaryOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 text-sm font-black text-slate-950 shadow-cta transition hover:-translate-y-0.5">
                    <ImageDown className="h-4 w-4" /> {isAr ? "انتهيت؟ احصل على صورة حصيلتك" : "Done? Get your summary image"}
                  </button>
                )}
              </div>
              {roomSlug && room && roomState === "ok" && (
                <RoomShareActions isAr={isAr} room={room} waHref={waHref} copied={copied} onCopy={copyLink}
                  onNativeShare={canNative ? nativeShare : null} onStory={() => setStoryOpen(true)} />
              )}
            </div>

            {/* ── Choice of dhikr ── */}
            <div id="dhikr-choice" className="scroll-mt-24 rounded-3xl bg-card p-5 text-foreground shadow-card sm:p-7">
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

              {!isMixed && (
              <div role="tablist" aria-label={isAr ? "نوع الذكر" : "Type of dhikr"} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GROUPS.map((g) => {
                  const on = !isCustom && g.id === group?.id;
                  return (
                    <button key={g.id} type="button" role="tab" aria-selected={on} onClick={() => choose(g.items[0].id)}
                      className={`min-h-11 rounded-2xl px-3 py-2.5 text-sm font-black transition ${on ? "bg-primary text-primary-foreground shadow-soft" : "bg-muted/60 text-primary hover:bg-secondary/20"}`}>
                      {isAr ? g.ar : g.en}
                    </button>
                  );
                })}
              </div>
              )}

              {seq && seq.length > 1 && (
                <>
                <ol className="grid grid-cols-1 gap-1.5 text-xs font-bold sm:grid-cols-2" aria-label={isAr ? "ترتيب الأذكار" : "Dhikr order"}>
                  {seq.map((d, i) => {
                    const on = i === seqAt;
                    // Collapsed: only now and the next two, so the list does not overwhelm.
                    const ahead = (i - seqAt + seq.length) % seq.length;
                    if (!showAllMixed && ahead > 2) return null;
                    return (
                      <li key={`${d.id}-${i}`} className={`truncate rounded-lg px-2 py-1.5 text-center transition-colors ${on ? "bg-secondary/25 text-primary" : "bg-muted/40 text-muted-foreground"}`} title={d.text}>
                        {!showAllMixed && <span className="me-1 text-[10px] font-black text-secondary">{ahead === 0 ? (isAr ? "الآن" : "Now") : isAr ? "ثم" : "Then"}</span>}
                        {showAllMixed && `${(i + 1).toLocaleString(isAr ? "ar-EG" : "en-US")}. `}{isAr ? d.text : d.en}
                      </li>
                    );
                  })}
                </ol>
                {seq.length > 3 && (
                  <button type="button" onClick={() => setShowAllMixed((v) => !v)} aria-expanded={showAllMixed}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-black text-primary hover:text-secondary">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllMixed ? "rotate-180" : ""}`} />
                    {showAllMixed ? (isAr ? "اعرض الحالي فقط" : "Show fewer") : isAr ? `اعرض الترتيب كله (${fmt(seq.length)} أذكار)` : `Show the full order (${seq.length})`}
                  </button>
                )}
                </>
              )}

              {!isMixed && (
              <>
              <div className="mt-5 rounded-2xl border border-dashed border-border p-4">
                <p className="mb-1 text-sm font-black text-primary">{isAr ? "ذكرك أو دعاؤك الخاص" : "Your own dhikr or dua"}</p>
                <p className="mb-3 text-xs font-bold leading-relaxed text-muted-foreground">{isAr ? "اكتبه مرة، ويفضل محفوظ على جهازك تختاره في أي وقت." : "Write it once; it stays on this device to pick any time."}</p>
                {customDhikr.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {customDhikr.map((d) => (
                      <span key={d.id} className={`inline-flex max-w-full items-center gap-1 rounded-full border ps-3 text-sm font-black ${d.id === dhikr.id ? "border-secondary bg-secondary/10 text-primary" : "border-border text-primary"}`}>
                        <button type="button" onClick={() => choose(d.id)} aria-pressed={d.id === dhikr.id} className="min-h-9 truncate py-1.5">{d.text}</button>
                        <button type="button" onClick={() => removeCustom(d.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-destructive" aria-label={isAr ? `احذف ${d.text}` : `Remove ${d.text}`}><X className="h-3.5 w-3.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addCustom(); }}>
                  <label htmlFor="custom-dhikr" className="sr-only">{isAr ? "اكتب ذكرًا خاصًا بك" : "Add your own dhikr"}</label>
                  <input id="custom-dhikr" value={customText} onChange={(e) => setCustomText(e.target.value)} maxLength={120} enterKeyHint="done"
                    placeholder={isAr ? "مثلًا: اللهم اغفر لأبي وارحمه" : "e.g. O Allah, forgive my father"}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-base font-bold outline-none focus:border-secondary sm:text-sm" />
                  <button type="submit" disabled={customText.trim().length < 2} className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground disabled:opacity-40">
                    <Plus className="h-4 w-4" /> {isAr ? "أضف" : "Add"}
                  </button>
                </form>
              </div>
              </>
              )}

              <div key={`${dhikr.id}-${seq ? count : 0}`} className="misbaha-fade mt-6 rounded-2xl bg-muted/40 p-5 text-center">
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

              <div className="keep-flow mt-6 grid gap-2 border-t sm:flex sm:flex-wrap border-border pt-5">
                <button type="button" onClick={openShare} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-primary transition hover:border-secondary hover:bg-secondary/10">
                  {copied ? <Check className="h-4 w-4 text-secondary" /> : <Share2 className="h-4 w-4" />}
                  {copied ? (isAr ? "تم نسخ الرابط" : "Link copied") : isAr ? "شارك السبحة، والدال على الخير كفاعله" : "Share the tasbih"}
                </button>
                {!isCustom && (
                  <button type="button" onClick={shareDhikr} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-primary transition hover:border-secondary hover:bg-secondary/10">
                    {dhikrCopied ? <Check className="h-4 w-4 text-secondary" /> : <Share2 className="h-4 w-4" />}
                    {dhikrCopied ? (isAr ? "تم النسخ" : "Copied") : isAr ? "أرسل هذا الذكر لمن تحب" : "Send this dhikr"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {roomSlug && room && roomState === "ok" && <RoomExtras isAr={isAr} room={room} pageUrl={pageUrl} />}
      {roomSlug && room && roomState === "ok" && <MisbahaFollow slug={roomSlug} name={room.name} hasTarget={Boolean(room.target_total)} isAr={isAr} />}
      {/* The all-Muslims room rides the seam: half on the green hero, half on the light section below. */}
      {!roomSlug && (
        <div className="relative z-10 -mt-10 bg-gradient-to-b from-transparent from-50% to-muted/40 to-50% px-4">
          <UmmahRoomCard isAr={isAr} />
        </div>
      )}
      {!roomSlug && <MemorialCreate isAr={isAr} onCreated={(slug) => navigate(`/misbaha/${slug}?new=1`)} />}
      {storyOpen && (room || !roomSlug) && <StoryDialog isAr={isAr} room={room} personal={{ today: st.today }} pageUrl={pageUrl} onClose={() => setStoryOpen(false)} />}

      {isNew && room && roomState === "ok" && <NewRoomHint isAr={isAr} />}

      {focus && (
        <FocusMode
          isAr={isAr}
          text={isAr ? dhikr.text : dhikr.en}
          next={nextDhikr ? (isAr ? nextDhikr.text : nextDhikr.en) : null}
          shown={fmt(target ? inRound || (showFull ? target : 0) : count)}
          target={target ? (isAr ? `من ${fmt(target)}` : `of ${fmt(target)}`) : isAr ? "عدّ مفتوح" : "open count"}
          rounds={rounds > 0 ? (isAr ? `${fmt(rounds)} دورة` : `${fmt(rounds)} rounds`) : null}
          progress={target ? (showFull ? 1 : inRound / target) : 0}
          done={done}
          today={isAr ? `ذكرك اليوم: ${fmt(st.today)}` : `Today: ${fmt(st.today)}`}
          onTap={tap}
          onUndo={undo}
          canUndo={undoCount > 0}
          onClose={() => setFocus(false)}
        />
      )}

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
              {isAr ? "استخدمها وشاركها مع أحبابك، ولك أجر كل من يذكر الله بها." : "Use it and share it with your loved ones — you share the reward of everyone who remembers Allah with it."}
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

/**
 * Right after creating a shared sebha: a note at the bottom of the screen that the share link is
 * under the beads. It stays until the visitor scrolls down to the share buttons; if they never do,
 * it stays at least 20 seconds. Tapping it scrolls there.
 */
function NewRoomHint({ isAr }: { isAr: boolean }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const MIN_MS = 20000;
    const target = () => document.getElementById("room-share");
    let io: IntersectionObserver | null = null;
    const watch = () => {
      const el = target();
      if (!el || typeof IntersectionObserver === "undefined") return;
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) setShown(false);
      }, { threshold: 0.5 });
      io.observe(el);
    };
    const t = window.setTimeout(watch, 300); // the buttons render with the room
    const done = window.setTimeout(() => setShown(false), MIN_MS);
    return () => { window.clearTimeout(t); window.clearTimeout(done); io?.disconnect(); };
  }, []);
  if (!shown) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[120] flex justify-center px-4">
      <button type="button" onClick={() => document.getElementById("room-share")?.scrollIntoView({ behavior: "smooth", block: "center" })}
        className="misbaha-fade pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-start text-sm font-black text-slate-950 shadow-cta" role="status">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950/10"><ArrowDown className="h-5 w-5 animate-bounce motion-reduce:animate-none" /></span>
        <span>
          {isAr ? "تم إنشاء السبحة. رابط المشاركة تحت السبحة، أرسله لأهلك وأصحابك." : "Created! The share link is under the beads — send it to family and friends."}
          <span className="block text-xs font-bold text-slate-950/70">{isAr ? "اضغط هنا للنزول إليه" : "Tap to go there"}</span>
        </span>
      </button>
    </div>
  );
}

/** The last 7 days as small bars (this device), so coming back every day shows. */
function WeekStrip({ isAr, days, fmt }: { isAr: boolean; days: { day: string; date: Date; count: number }[]; fmt: (n: number) => string }) {
  if (!days.some((d) => d.count > 0)) return null;
  const max = Math.max(...days.map((d) => d.count), 1);
  const name = (d: Date) => {
    try { return new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-GB", { weekday: "long" }).format(d); } catch { return ""; }
  };
  // Under the bars: one letter per day (full names don't fit at 360px), «اليوم» for today.
  const short = (d: Date, i: number) => {
    if (i === days.length - 1) return isAr ? "اليوم" : "Today";
    try { return new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-GB", { weekday: "narrow" }).format(d); } catch { return ""; }
  };
  const label = days.map((d) => `${name(d.date)}: ${fmt(d.count)}`).join("، ");
  return (
    <div className="mt-1 w-full max-w-xs" role="img" aria-label={`${isAr ? "ذكرك في آخر ٧ أيام" : "Your dhikr in the last 7 days"} — ${label}`}>
      <div className="flex h-12 items-end justify-between gap-1.5">
        {days.map((d, i) => (
          <div key={d.day} className="flex h-full flex-1 items-end" title={`${name(d.date)}: ${fmt(d.count)}`}>
            <div className={`w-full rounded-t-md ${i === days.length - 1 ? "bg-secondary" : d.count ? "bg-secondary/55" : "bg-white/10"}`}
              style={{ height: `${d.count ? Math.max(12, (d.count / max) * 100) : 8}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between gap-1.5 text-[10px] font-bold text-white/50">
        {days.map((d, i) => <span key={d.day} className={`flex-1 text-center ${i === days.length - 1 ? "text-secondary" : ""}`}>{short(d.date, i)}</span>)}
      </div>
    </div>
  );
}

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
      title: title || (isAr ? "حصيلة ذكري اليوم" : "My dhikr today"),
      subtitle: day,
      lines,
      total,
      totalLabel: isAr ? "ذكر" : "dhikr",
      footer: `${isAr ? "سبّح معنا:" : "Join in:"} ${pageUrl.replace(/^https?:\/\//, "")}`,
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
      await navigator.share({ files: [new File([blob], fileName, { type: "image/png" })], text: isAr ? `حصيلة ذكري اليوم${title ? ` — ${title}` : ""}. سبّح معنا: ${pageUrl}` : `My dhikr today${title ? ` — ${title}` : ""}. Join in: ${pageUrl}` });
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
            <div className="grid aspect-[4/5] place-items-center text-sm text-muted-foreground">{failed ? (isAr ? "تعذّر تجهيز الصورة" : "Could not create the image") : (isAr ? "جارٍ تجهيز الصورة..." : "Preparing...")}</div>
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
