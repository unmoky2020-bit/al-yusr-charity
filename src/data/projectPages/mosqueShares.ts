import type { Share } from "@/data/entityShares";

const TRACK_WORDS = {
  build: ["بناء", "أسمنت", "اسمنت", "إنشائ", "انشائ", "مئذن", "أساس", "طوب", "build", "cement", "construct", "minaret", "foundation"],
  rebuild: ["ترميم", "إعمار", "اعمار", "فرش", "سجاد", "تجهيز", "تكييف", "إضاءة", "renov", "restor", "carpet", "furnish", "equip"],
};

const BUILD_DEFAULTS: Share[] = [
  { id: "msq-cement", nameAr: "سهم مواد بناء وأسمنت", nameEn: "Building materials share", amount: 500 },
  { id: "msq-meter", nameAr: "سهم متر مربع في مسجد جديد", nameEn: "One square metre of a new mosque", amount: 1000 },
];

const REBUILD_DEFAULTS: Share[] = [
  { id: "msq-carpet", nameAr: "سهم فرش وسجاد مسجد", nameEn: "Mosque carpet share", amount: 250 },
  { id: "msq-restore", nameAr: "سهم ترميم مسجد", nameEn: "Mosque restoration share", amount: 1000 },
];

const matches = (share: Share, words: string[]) => {
  const text = `${share.id} ${share.nameAr} ${share.nameEn}`.toLowerCase();
  return words.some((word) => text.includes(word.toLowerCase()));
};

/** Split backend packages between construction and restoration without duplicating a package. */
export function splitMosqueShares(all: Share[]): Record<"build" | "rebuild", Share[]> {
  const build = all.filter((share) => matches(share, TRACK_WORDS.build));
  const rebuild = all.filter((share) => !build.includes(share) && matches(share, TRACK_WORDS.rebuild));
  return {
    build: build.length ? build : BUILD_DEFAULTS,
    rebuild: rebuild.length ? rebuild : REBUILD_DEFAULTS,
  };
}
