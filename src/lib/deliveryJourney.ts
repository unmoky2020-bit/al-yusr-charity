/**
 * The journey of a donation as its donor sees it:
 *   registered → paid → family identified → being prepared → delivered.
 * The first two come from the donation status; the last three are lines the team adds from the
 * donation's page or a distribution day (backend: DeliverySteps). A line can carry photos (faces
 * already blurred) and a note. "on_hold" is not a step: it pauses the donation with a reason until
 * the next step clears it.
 */
export type DeliveryStage = "family_identified" | "preparing" | "delivered";
export const DELIVERY_STAGES: DeliveryStage[] = ["family_identified", "preparing", "delivered"];
export type DeliveryLineStage = DeliveryStage | "on_hold";

export interface DeliveryLine {
  stage: DeliveryLineStage;
  at: string;
  note?: string;
  photos?: string[];
  distribution?: { id: number; title?: string; place?: string };
}

export interface DeliveryInfo {
  /** Last step reached (null when only a hold was recorded). */
  stage: DeliveryStage | null;
  /** Set while the donation is paused. */
  hold: { note?: string; at?: string } | null;
  history: DeliveryLine[];
}

export type JourneyStep = "registered" | "paid" | DeliveryStage;
export const JOURNEY: JourneyStep[] = ["registered", "paid", ...DELIVERY_STAGES];

export const JOURNEY_LABEL: Record<JourneyStep, { ar: string; en: string; hintAr: string; hintEn: string }> = {
  registered: { ar: "تم تسجيل التبرع", en: "Donation registered", hintAr: "وصلنا طلبك", hintEn: "We have your request" },
  paid: { ar: "تم استلام التبرع", en: "Payment received", hintAr: "اتأكدنا من الدفع", hintEn: "Payment confirmed" },
  family_identified: { ar: "تم تحديد الأسرة المستحقة", en: "Family identified", hintAr: "بعد بحث ميداني", hintEn: "After a field visit" },
  preparing: { ar: "جاري تجهيز التبرع لها", en: "Being prepared", hintAr: "بنجهّز التبرع", hintEn: "Getting it ready" },
  delivered: { ar: "تم تسليم تبرعك", en: "Delivered", hintAr: "وصل للأسرة", hintEn: "Reached the family" },
};

export function isDeliveryStage(v: unknown): v is DeliveryStage {
  return typeof v === "string" && (DELIVERY_STAGES as string[]).includes(v);
}

const isLineStage = (v: unknown): v is DeliveryLineStage => v === "on_hold" || isDeliveryStage(v);

function parseLine(raw: unknown): DeliveryLine | null {
  if (!raw || typeof raw !== "object") return null;
  const h = raw as Record<string, unknown>;
  if (!isLineStage(h.stage)) return null;
  const photos = Array.isArray(h.photos) ? h.photos.filter((p): p is string => typeof p === "string" && p.length > 0) : [];
  const d = h.distribution as Record<string, unknown> | undefined;
  return {
    stage: h.stage,
    at: String(h.at || ""),
    ...(h.note ? { note: String(h.note) } : {}),
    ...(photos.length ? { photos } : {}),
    ...(d && d.id ? { distribution: { id: Number(d.id), ...(d.title ? { title: String(d.title) } : {}), ...(d.place ? { place: String(d.place) } : {}) } } : {}),
  };
}

/** The delivery part of a backend donation (`delivery: {stage?, hold?, history}`), or null. */
export function parseDelivery(raw: unknown): DeliveryInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { stage?: unknown; hold?: unknown; history?: unknown };
  const history = Array.isArray(r.history) ? r.history.map(parseLine).filter((l): l is DeliveryLine => l !== null) : [];
  const stage = isDeliveryStage(r.stage) ? r.stage : null;
  const holdRaw = r.hold && typeof r.hold === "object" ? (r.hold as Record<string, unknown>) : null;
  const hold = holdRaw ? { ...(holdRaw.note ? { note: String(holdRaw.note) } : {}), ...(holdRaw.at ? { at: String(holdRaw.at) } : {}) } : null;
  if (!stage && !hold) return null;
  return { stage, hold, history };
}

/** How far the donation got (index in JOURNEY). Failed / refunded / unpaid donations stay at "registered". */
export function journeyIndex(status: string | null | undefined, delivery: DeliveryInfo | null): number {
  const s = String(status || "").toLowerCase();
  if (s === "completed") return JOURNEY.indexOf(delivery?.stage ?? "delivered");
  if (s !== "paid") return 0;
  return delivery?.stage ? JOURNEY.indexOf(delivery.stage) : 1;
}

/** Date of each reached step that we know (registered = creation, delivery steps from their lines). */
export function journeyDates(createdAt: string | undefined, delivery: DeliveryInfo | null): Partial<Record<JourneyStep, string>> {
  const out: Partial<Record<JourneyStep, string>> = {};
  if (createdAt) out.registered = createdAt;
  for (const h of delivery?.history ?? []) if (h.at && isDeliveryStage(h.stage)) out[h.stage] = h.at;
  return out;
}

/** The latest line of each reached step (its note, photos, distribution day). */
export function linesByStep(delivery: DeliveryInfo | null): Partial<Record<DeliveryStage, DeliveryLine>> {
  const out: Partial<Record<DeliveryStage, DeliveryLine>> = {};
  for (const h of delivery?.history ?? []) if (isDeliveryStage(h.stage)) out[h.stage] = h;
  return out;
}

/** Every photo of the trail, newest first (for the "proof" strip). */
export function trailPhotos(delivery: DeliveryInfo | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of [...(delivery?.history ?? [])].reverse()) for (const p of h.photos ?? []) if (!seen.has(p)) { seen.add(p); out.push(p); }
  return out;
}
