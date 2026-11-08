import type { CaseUpdateRow, JourneyStepRow } from "@/data/casesApi";

const sameText = (a: string | null | undefined, b: string | null | undefined) =>
  !!a?.trim() && !!b?.trim() && a.trim() === b.trim();

/** Journey entries already include updates created by the backend; omit their duplicate update rows. */
export function updatesNotInJourney(journey: JourneyStepRow[], updates: CaseUpdateRow[]): CaseUpdateRow[] {
  return updates.filter((update) => !journey.some((step) => {
    if (step.occurred_at !== update.created_at) return false;
    const sameBody = sameText(update.body, step.note_ar) || sameText(update.body, step.note_en);
    const sameImage = !!update.image_url && update.image_url === step.media_url;
    return sameBody || sameImage;
  }));
}
