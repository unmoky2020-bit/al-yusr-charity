/**
 * Shared misbaha kinds and the authentic duas shown on each room, worded for «he» or «she».
 * Sources are the books the hadith is narrated in; the text is the narration with the pronoun only
 * changed for a woman, and the name placed where the narration says «فلان».
 */
import type { MisbahaGender, MisbahaKind } from "@/data/api/misbahaRoomsApi";

export type KindMeta = {
  id: MisbahaKind;
  ar: string;
  en: string;
  hintAr: string;
  hintEn: string;
  nameLabelAr: string;
  nameLabelEn: string;
  placeholderAr: string;
  placeholderEn: string;
  /** dhikr id suggested by default for this kind */
  dhikr: string;
};

export const MISBAHA_KINDS: KindMeta[] = [
  {
    id: "deceased", ar: "لروح متوفّى", en: "For the deceased", hintAr: "صدقة ذكر تفضل في ميزانه", hintEn: "Remembrance gifted to a soul",
    nameLabelAr: "اسم المتوفّى", nameLabelEn: "Name of the deceased", placeholderAr: "مثلًا: محمد عبد الله", placeholderEn: "e.g. Muhammad Abdullah", dhikr: "astaghfir",
  },
  {
    id: "sick", ar: "بنية شفاء مريض", en: "For someone sick", hintAr: "ذكر ودعاء جماعي بنية الشفاء", hintEn: "Dhikr and dua for healing",
    nameLabelAr: "اسم المريض", nameLabelEn: "Name of the sick person", placeholderAr: "مثلًا: أم أحمد", placeholderEn: "e.g. Umm Ahmad", dhikr: "hawqala",
  },
  {
    id: "group", ar: "ذكر جماعي", en: "Group dhikr", hintAr: "للعيلة أو الشغل أو أي نية", hintEn: "For family, friends or any intention",
    nameLabelAr: "اسم المجموعة أو النية", nameLabelEn: "Group name or intention", placeholderAr: "مثلًا: عيلة الحاج سعيد — بنية تفريج الكرب", placeholderEn: "e.g. The Saeed family — for relief", dhikr: "salawat",
  },
];

export const kindMeta = (k?: string | null) => MISBAHA_KINDS.find((x) => x.id === k) ?? MISBAHA_KINDS[0];

const startsWithTitle = (name: string) => /^(ال)?(مرحوم|مرحومة|فقيد|فقيدة|المغفور)/.test(name.trim());

/** «لروح المرحوم محمد» / «بنية شفاء أم أحمد» / the group's own title. */
export function roomTitle(kind: MisbahaKind | undefined, gender: MisbahaGender | null | undefined, name: string, isAr: boolean): string {
  const k = kind ?? "deceased";
  if (!isAr) return k === "deceased" ? `For the soul of ${name}` : k === "sick" ? `For the healing of ${name}` : name;
  if (k === "sick") return `بنية شفاء ${name}`;
  if (k === "group") return name;
  if (startsWithTitle(name) || !gender) return `لروح ${name}`;
  return `لروح ${gender === "f" ? "المرحومة" : "المرحوم"} ${name}`;
}

export type Dua = { id: string; text: string; en: string; source: string; sourceEn: string; repeat?: number };

export function roomDuas(kind: MisbahaKind | undefined, gender: MisbahaGender | null | undefined, name: string): Dua[] {
  const f = gender === "f";
  const k = kind ?? "deceased";
  if (k === "deceased") {
    return [
      {
        id: "janaza",
        text: f
          ? "اللهم اغفر لها وارحمها، وعافها واعفُ عنها، وأكرم نُزُلها، ووسّع مُدخلها، واغسلها بالماء والثلج والبرد، ونقّها من الخطايا كما نقّيت الثوب الأبيض من الدنس"
          : "اللهم اغفر له وارحمه، وعافه واعفُ عنه، وأكرم نُزُله، ووسّع مُدخله، واغسله بالماء والثلج والبرد، ونقّه من الخطايا كما نقّيت الثوب الأبيض من الدنس",
        en: "O Allah, forgive and have mercy on them, pardon them, honour their resting place, widen their entrance, wash them with water, snow and hail, and cleanse them of sins as a white garment is cleansed of dirt.",
        source: "رواه مسلم", sourceEn: "Muslim",
      },
      {
        id: "dhimma",
        text: f
          ? `اللهم إن ${name} في ذمّتك وحبل جوارك، فقِها من فتنة القبر وعذاب النار، وأنت أهل الوفاء والحق، فاغفر لها وارحمها، إنك أنت الغفور الرحيم`
          : `اللهم إن ${name} في ذمّتك وحبل جوارك، فقِه من فتنة القبر وعذاب النار، وأنت أهل الوفاء والحق، فاغفر له وارحمه، إنك أنت الغفور الرحيم`,
        en: `O Allah, ${name} is under Your protection and in Your care; protect them from the trial of the grave and the punishment of the Fire. You are faithful and true; forgive them and have mercy on them, You are the Forgiving, the Merciful.`,
        source: "رواه أبو داود وابن ماجه، وصححه الألباني", sourceEn: "Abu Dawud and Ibn Majah; graded sahih by al-Albani",
      },
      {
        id: "hayyina",
        text: "اللهم اغفر لحيّنا وميّتنا، وشاهدنا وغائبنا، وصغيرنا وكبيرنا، وذكرنا وأنثانا",
        en: "O Allah, forgive our living and our dead, those present and those absent, our young and our old, our men and our women.",
        source: "رواه أبو داود والترمذي، وصححه الألباني", sourceEn: "Abu Dawud and al-Tirmidhi; graded sahih by al-Albani",
      },
    ];
  }
  if (k === "sick") {
    return [
      {
        id: "rabb_annas",
        text: "اللهم ربّ الناس، أذهب البأس، اشفِ أنت الشافي، لا شفاء إلا شفاؤك، شفاءً لا يغادر سقمًا",
        en: "O Allah, Lord of mankind, remove the harm and heal, You are the Healer; there is no healing but Yours, a healing that leaves no illness.",
        source: "متفق عليه", sourceEn: "Bukhari & Muslim",
      },
      {
        id: "asalu_allah",
        text: f ? "أسأل الله العظيم، ربّ العرش العظيم، أن يشفيها" : "أسأل الله العظيم، ربّ العرش العظيم، أن يشفيه",
        en: "I ask Allah the Almighty, Lord of the Mighty Throne, to heal them.",
        source: "رواه أبو داود والترمذي، وصححه الألباني (تُقال سبع مرات)", sourceEn: "Abu Dawud and al-Tirmidhi; graded sahih by al-Albani (said seven times)",
        repeat: 7,
      },
    ];
  }
  return [
    {
      id: "majlis",
      text: "لا يقعد قومٌ يذكرون الله عز وجل إلا حفّتهم الملائكة، وغشيتهم الرحمة، ونزلت عليهم السكينة، وذكرهم الله فيمن عنده",
      en: "No people sit remembering Allah but the angels surround them, mercy covers them, tranquillity descends upon them and Allah mentions them among those with Him.",
      source: "رواه مسلم", sourceEn: "Muslim",
    },
  ];
}

/** Short line under the title, used on the story image and the share text. */
export function roomTagline(kind: MisbahaKind | undefined, gender: MisbahaGender | null | undefined, isAr: boolean): string {
  const k = kind ?? "deceased";
  if (!isAr) return k === "deceased" ? "O Allah, forgive and have mercy on them" : k === "sick" ? "O Allah, grant them a complete healing" : "Remember Allah together";
  if (k === "deceased") return gender === "f" ? "اللهم اغفر لها وارحمها" : "اللهم اغفر له وارحمه";
  if (k === "sick") return gender === "f" ? "اللهم اشفِها شفاءً لا يغادر سقمًا" : "اللهم اشفِه شفاءً لا يغادر سقمًا";
  return "اذكروا الله معانا، وكل ذكر بيتضاف للعدّاد";
}

export function roomShareText(kind: MisbahaKind | undefined, gender: MisbahaGender | null | undefined, name: string, isAr: boolean): string {
  const title = roomTitle(kind, gender, name, isAr);
  if (!isAr) return `${title}: join with tasbih, istighfar and salawat — every dhikr adds to one shared count.`;
  const k = kind ?? "deceased";
  const ask = k === "deceased"
    ? (gender === "f" ? "ادعولها، وشاركوا بتسبيحة أو استغفار" : "ادعوله، وشاركوا بتسبيحة أو استغفار")
    : k === "sick" ? "شاركوا بذكر ودعاء بنية الشفاء" : "شاركونا الذكر";
  return `🤍 سبحة ${title}\n${ask}، وكل ذكر بيتضاف لعدّاد واحد بنشوفه كلنا.\nوالدال على الخير كفاعله.`;
}
