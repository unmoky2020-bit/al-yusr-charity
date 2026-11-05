import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartPulse, Moon, Plus, Users } from "lucide-react";
import { NiceSelect, fromNice, toNice } from "@/components/common/NiceSelect";
import { ALL_DHIKR } from "@/data/adhkar";
import { misbahaRoomsApi, MISBAHA_ROOMS_PENDING_AR, type MisbahaGender, type MisbahaKind, type MisbahaRoom } from "@/data/api/misbahaRoomsApi";
import { isEndpointMissing } from "@/data/api/backendPending";
import { MISBAHA_KINDS, kindMeta, roomTagline, roomTitle } from "@/data/memorialDuas";
import { track } from "@/lib/track";

/**
 * The public «سبح بيتشارك فيها دلوقتي» list under the form. Hidden: shared tasbihs reach people only
 * through their link. Set to true to show the list again.
 */
const SHOW_PUBLIC_ROOMS = false;

const KIND_ICON: Record<MisbahaKind, typeof Moon> = { deceased: Moon, sick: HeartPulse, group: Users };
const GOALS = [1000, 10000, 100000, 1000000, 0];
const DHIKR_CHOICES = ["astaghfir", "salawat", "la_ilaha", "subhan_bihamdih", "tahleel", "hawqala", "kalimatan", "yunus", "ya_hayy"];

/** Create a shared misbaha (deceased / sick / group), and browse the ones people are in now. */
export function MemorialCreate({ isAr, onCreated }: { isAr: boolean; onCreated: (slug: string) => void }) {
  const [kind, setKind] = useState<MisbahaKind>("deceased");
  const [gender, setGender] = useState<MisbahaGender>("m");
  const [name, setName] = useState("");
  const [by, setBy] = useState("");
  const [goal, setGoal] = useState<number>(10000);
  const [dhikrId, setDhikrId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<MisbahaRoom[] | null>(null);
  const [filter, setFilter] = useState<MisbahaKind | "all">("all");
  const meta = kindMeta(kind);
  const fmt = (n: number) => n.toLocaleString(isAr ? "ar-EG" : "en-US");
  const dir = isAr ? "rtl" : "ltr";

  useEffect(() => {
    if (!SHOW_PUBLIC_ROOMS) return;
    let alive = true;
    setRooms(null);
    void misbahaRoomsApi.list(12, filter === "all" ? undefined : filter).then((r) => alive && setRooms(r));
    return () => {
      alive = false;
    };
  }, [filter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2) {
      setError(isAr ? `اكتب ${meta.nameLabelAr}` : `Enter the ${meta.nameLabelEn.toLowerCase()}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const room = await misbahaRoomsApi.create({
        kind,
        gender: kind === "group" ? undefined : gender,
        name: clean.slice(0, 80),
        created_by: by.trim().slice(0, 60) || undefined,
        target_total: goal || undefined,
        dhikr_id: dhikrId || undefined,
      });
      track("misbaha_room_created", { fbEvent: "Lead", payload: { kind, goal } });
      onCreated(room.slug);
    } catch (err) {
      setError(isEndpointMissing(err) ? MISBAHA_ROOMS_PENDING_AR : (err as Error)?.message || (isAr ? "تعذر إنشاء السبحة" : "Could not create it"));
    } finally {
      setBusy(false);
    }
  };

  const preview = name.trim() ? roomTitle(kind, kind === "group" ? null : gender, name.trim(), isAr) : isAr ? meta.ar : meta.en;
  const goalLabel = (n: number) => (n === 0 ? (isAr ? "من غير هدف" : "No goal") : n === 1_000_000 ? (isAr ? "مليون" : "1M") : fmt(n));

  return (
    <section id="memorial" className="scroll-mt-24 bg-muted/40 py-12 md:py-16" aria-labelledby="memorial-title">
      <div className={`container mx-auto grid gap-10 px-4 ${SHOW_PUBLIC_ROOMS ? "max-w-6xl lg:grid-cols-[1.1fr_1fr] lg:items-start" : "max-w-3xl"}`}>
        <div>
          <span className="inline-block rounded-full bg-secondary/20 px-3 py-1 text-xs font-black text-primary">{isAr ? "سبحة مشتركة" : "Shared tasbih"}</span>
          <h2 id="memorial-title" className="mt-2 text-2xl font-black text-primary md:text-3xl">{isAr ? "اعمل سبحة يتشارك فيها الكل" : "Create a tasbih everyone can join"}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {isAr ? "لروح حد غالي، أو بنية شفاء مريض، أو ذكر جماعي للعيلة. هتاخد رابط وصورة ستوري، وكل اللي يدخل يسبّح بيزوّد عدّاد واحد بتشوفوه كلكم." : "For a loved one who passed, for someone sick, or for a group. You get a link and a story image; everyone who joins adds to one shared count."}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-5 rounded-3xl bg-card p-5 shadow-soft sm:p-6" noValidate>
            <fieldset>
              <legend className="mb-2 text-sm font-black text-primary">{isAr ? "السبحة دي…" : "This tasbih is…"}</legend>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                {MISBAHA_KINDS.map((k) => {
                  const Icon = KIND_ICON[k.id];
                  const on = kind === k.id;
                  return (
                    <button key={k.id} type="button" role="radio" aria-checked={on} onClick={() => { setKind(k.id); setDhikrId(""); }}
                      className={`flex items-start gap-3 rounded-2xl border p-3 text-start transition sm:flex-col sm:gap-2 ${on ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border hover:border-secondary"}`}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${on ? "bg-white/15 text-secondary" : "bg-secondary/15 text-primary"}`}><Icon className="h-[18px] w-[18px]" /></span>
                      <span>
                        <b className="block text-sm font-black">{isAr ? k.ar : k.en}</b>
                        <span className={`block text-[11px] font-bold ${on ? "text-white/75" : "text-muted-foreground"}`}>{isAr ? k.hintAr : k.hintEn}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label htmlFor="memorial-name" className="text-sm font-black text-primary">{isAr ? meta.nameLabelAr : meta.nameLabelEn}</label>
                <input id="memorial-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoComplete="off"
                  placeholder={isAr ? meta.placeholderAr : meta.placeholderEn}
                  className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 font-bold outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30" />
              </div>
              {kind !== "group" && (
                <div className="flex h-12 rounded-xl bg-muted p-1" role="radiogroup" aria-label={isAr ? "النوع" : "Gender"}>
                  {(["m", "f"] as const).map((gv) => (
                    <button key={gv} type="button" role="radio" aria-checked={gender === gv} onClick={() => setGender(gv)}
                      className={`rounded-lg px-4 text-sm font-black transition ${gender === gv ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
                      {gv === "m" ? (isAr ? (kind === "deceased" ? "المرحوم" : "هو") : "He") : isAr ? (kind === "deceased" ? "المرحومة" : "هي") : "She"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="memorial-by" className="text-sm font-black text-primary">{isAr ? "اسمك (اختياري)" : "Your name (optional)"}</label>
              <input id="memorial-by" value={by} onChange={(e) => setBy(e.target.value)} maxLength={60} autoComplete="name"
                placeholder={isAr ? "مثلًا: أولاده وأحفاده" : "e.g. His children and grandchildren"}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 font-bold outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30" />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-black text-primary">{isAr ? "هدف السبحة" : "Shared goal"}</legend>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((n) => (
                  <button key={n} type="button" aria-pressed={goal === n} onClick={() => setGoal(n)}
                    className={`h-10 rounded-full px-4 text-sm font-black transition ${goal === n ? "bg-secondary text-slate-950 shadow-sm" : "border border-border bg-background text-primary hover:border-secondary"}`}>
                    {goalLabel(n)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="memorial-dhikr" className="text-sm font-black text-primary">{isAr ? "الذكر اللي بيظهر أول ما حد يفتح" : "Dhikr shown first"}</label>
              <div className="mt-1">
                <NiceSelect id="memorial-dhikr" dir={dir} value={toNice(dhikrId)} onChange={(v) => setDhikrId(fromNice(v))} ariaLabel={isAr ? "الذكر المقترح" : "Suggested dhikr"}
                  options={[
                    { value: "", label: isAr ? "أذكار متنوّعة" : "Varied dhikr", hint: isAr ? "بتتغيّر مع كل ضغطة" : "changes with every tap" },
                    ...DHIKR_CHOICES.map((id) => ALL_DHIKR.find((x) => x.id === id)).filter(Boolean).map((d) => ({ value: d!.id, label: isAr ? d!.text : d!.en })),
                  ]} />
              </div>
            </div>

            {/* What visitors will see */}
            <div className="rounded-2xl bg-[#06301c] p-4 text-center text-white" aria-live="polite">
              <p className="text-[11px] font-black text-secondary">{isAr ? "هتظهر كده" : "Preview"}</p>
              <p className="mt-1 text-lg font-black leading-snug">{preview}</p>
              <p className="mt-1 text-xs font-bold text-white/70">{roomTagline(kind, kind === "group" ? null : gender, isAr)}</p>
            </div>

            {error && <p className="text-sm font-bold text-destructive" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-black text-primary-foreground transition hover:opacity-95 disabled:opacity-60">
              <Plus className="h-4 w-4" /> {busy ? (isAr ? "بتتعمل..." : "Creating...") : isAr ? "اعمل السبحة وخُد الرابط" : "Create and get the link"}
            </button>
            <p className="text-[11px] font-semibold text-muted-foreground">{isAr ? (SHOW_PUBLIC_ROOMS ? "صفحة السبحة مش بتظهر في جوجل، وبتوصل للي معاه الرابط أو من القايمة هنا." : "صفحة السبحة مش بتظهر في جوجل، وبتوصل بس للي معاه الرابط.") : "Tasbih pages are not shown in search engines."}</p>
          </form>
        </div>

        {SHOW_PUBLIC_ROOMS && <div>
          <h3 className="text-lg font-black text-primary">{isAr ? "سبح بيتشارك فيها دلوقتي" : "Shared right now"}</h3>
          <div className="mt-3 flex flex-wrap gap-2" role="tablist">
            {(["all", ...MISBAHA_KINDS.map((k) => k.id)] as const).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-black transition ${filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card text-primary hover:border-secondary"}`}>
                {f === "all" ? (isAr ? "الكل" : "All") : isAr ? kindMeta(f).ar : kindMeta(f).en}
              </button>
            ))}
          </div>
          {rooms === null ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-card" />)}</div>
          ) : rooms.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border bg-card/50 p-5 text-sm text-muted-foreground">{isAr ? "أول سبحة هتعملها هتظهر هنا، وأي حد يقدر يدخل يشارك فيها." : "The first one you create will show here."}</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {rooms.map((r) => {
                const Icon = KIND_ICON[(r.kind ?? "deceased") as MisbahaKind];
                const pct = r.target_total ? Math.min(100, (r.total_count / r.target_total) * 100) : 0;
                return (
                  <li key={r.slug}>
                    <Link to={`/misbaha/${r.slug}`} className="group block rounded-2xl border border-border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-soft">
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary"><Icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-primary">{roomTitle(r.kind, r.gender, r.name, isAr)}</span>
                          <span className="block text-[11px] font-bold text-muted-foreground">
                            {fmt(r.total_count)} {isAr ? "ذكر" : "dhikr"}{r.target_total ? (isAr ? ` من ${fmt(r.target_total)}` : ` of ${fmt(r.target_total)}`) : ""}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-secondary/20 px-3 py-1 text-xs font-black text-primary group-hover:bg-secondary">{isAr ? "شارك" : "Join"}</span>
                      </span>
                      {r.target_total ? <span className="mt-2 block h-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} /></span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>}
      </div>
    </section>
  );
}
