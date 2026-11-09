/**
 * The journey of a donation as its donor sees it (9 Nov 2026):
 *   registered → paid → family identified → being prepared → delivered.
 * The first two come from the donation status; the last three are set by the team from the
 * donation's page in the dashboard (PATCH /donations/{id}/delivery) and kept in its history.
 */
export type DeliveryStage = "family_identified" | "preparing" | "delivered";
export const DELIVERY_STAGES: DeliveryStage[] = ["family_identified", "preparing", "delivered"];

export interface DeliveryInfo {
  stage: DeliveryStage;
  history: Array<{ stage: DeliveryStage; at: string; note?: string }>;
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

/** The delivery part of a backend donation (`delivery: {stage, history}`), or null. */
export function parseDelivery(raw: unknown): DeliveryInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { stage?: unknown; history?: unknown };
  if (!isDeliveryStage(r.stage)) return null;
  const history = Array.isArray(r.history)
    ? r.history
        .filter((h): h is { stage: DeliveryStage; at: string; note?: string } => !!h && isDeliveryStage((h as { stage?: unknown }).stage))
        .map((h) => ({ stage: h.stage, at: String(h.at || ""), ...(h.note ? { note: String(h.note) } : {}) }))
    : [];
  return { stage: r.stage, history };
}

/** How far the donation got (index in JOURNEY). Failed / refunded / unpaid donations stay at "registered". */
export function journeyIndex(status: string | null | undefined, delivery: DeliveryInfo | null): number {
  const s = String(status || "").toLowerCase();
  if (s === "completed") return JOURNEY.indexOf(delivery?.stage ?? "delivered");
  if (s !== "paid") return 0;
  return delivery ? JOURNEY.indexOf(delivery.stage) : 1;
}

/** Date of each reached step that we know (registered = creation, delivery steps from their history). */
export function journeyDates(createdAt: string | undefined, delivery: DeliveryInfo | null): Partial<Record<JourneyStep, string>> {
  const out: Partial<Record<JourneyStep, string>> = {};
  if (createdAt) out.registered = createdAt;
  for (const h of delivery?.history ?? []) if (h.at) out[h.stage] = h.at;
  return out;
}
