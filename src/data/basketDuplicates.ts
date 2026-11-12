/**
 * The donate basket must not hold the same thing twice: the same share (سهم/باقة) of the same
 * program, the same case, or two open "general" amounts for the same program. Two lines for the
 * same thing confuse the receipt and the case's remaining amount, so the second one is refused.
 */
export type BasketLine = {
  id: string;
  entityId: string;
  donationMode: "general" | "shares" | "case" | "in_kind";
  selectedShares: Record<string, number>;
  selectedCaseId?: string | null;
};

/** The things a line holds, as stable keys. */
export function lineKeys(it: BasketLine): string[] {
  switch (it.donationMode) {
    case "shares":
      return Object.entries(it.selectedShares)
        .filter(([, n]) => n > 0)
        .map(([s]) => `share:${it.entityId}:${s}`);
    case "case":
      return it.selectedCaseId ? [`case:${it.selectedCaseId}`] : [];
    case "general":
      return [`general:${it.entityId}`];
    default:
      return [];
  }
}

/** Keys held by every line except `exceptId`, mapped to the 1-based line number that holds them. */
export function takenByOthers(items: BasketLine[], exceptId: string): Map<string, number> {
  const out = new Map<string, number>();
  items.forEach((it, i) => {
    if (it.id === exceptId) return;
    for (const k of lineKeys(it)) if (!out.has(k)) out.set(k, i + 1);
  });
  return out;
}

/** For each line that repeats something an earlier line already holds: the earlier line's number. */
export function duplicateLines(items: BasketLine[]): Record<string, number> {
  const seen = new Map<string, number>();
  const out: Record<string, number> = {};
  items.forEach((it, i) => {
    for (const k of lineKeys(it)) {
      const first = seen.get(k);
      if (first !== undefined) {
        if (out[it.id] === undefined) out[it.id] = first;
      } else {
        seen.set(k, i + 1);
      }
    }
  });
  return out;
}

export const shareKey = (entityId: string, shareId: string) => `share:${entityId}:${shareId}`;
export const caseKey = (caseId: string) => `case:${caseId}`;
export const generalKey = (entityId: string) => `general:${entityId}`;
