/**
 * One place for everything that changes each Qurbani season.
 * Before each season: update `year`, `hijriYear`, `eidDate` (after the moon-sighting
 * announcement) and flip `bookingOpen` to true when booking actually opens.
 */
export const QURBANI_SEASON = {
  year: 2027,
  hijriYear: 1448,
  /** Eid al-Adha 1448 AH — approximate until the official announcement. */
  eidDate: "2027-05-16T05:00:00+02:00",
  /** false = pages show "booking opens soon" and no live offer/countdown pressure. */
  bookingOpen: false,
} as const;

export const EID_TIME = new Date(QURBANI_SEASON.eidDate).getTime();

/** Whole days until Eid (0 once it has passed). */
export const daysUntilEid = (now: number = Date.now()) =>
  Math.max(0, Math.ceil((EID_TIME - now) / 86_400_000));
