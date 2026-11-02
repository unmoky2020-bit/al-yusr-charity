/**
 * Adhkar for the digital misbaha (/misbaha). Every virtue is quoted from an authentic narration
 * with its source. `prophetSaid: false` = the virtue is a companion's report, not the Prophet's ﷺ words.
 */
export type Dhikr = {
  id: string;
  text: string;
  en: string;
  virtue: string;
  virtueEn: string;
  source: string;
  sourceEn: string;
  target: number;
  prophetSaid?: boolean;
};
export type DhikrGroup = { id: "salawat" | "tasbih" | "istighfar" | "dhikr"; ar: string; en: string; /** label in the daily summary */ tallyAr: string; tallyEn: string; items: Dhikr[] };

const SALAWAT_VIRTUE = {
  virtue: "مَن صلّى عليّ صلاةً واحدة صلّى الله عليه بها عشرًا",
  virtueEn: "Whoever sends one prayer upon me, Allah sends ten upon him.",
  source: "رواه مسلم",
  sourceEn: "Muslim",
};
const FOUR_WORDS = {
  virtue: "أحبّ الكلام إلى الله أربع: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر",
  virtueEn: "The most beloved words to Allah are four: Subhan Allah, al-Hamdu lillah, La ilaha illa Allah and Allahu Akbar.",
  source: "رواه مسلم",
  sourceEn: "Muslim",
};

export const DHIKR_GROUPS: DhikrGroup[] = [
  {
    id: "salawat", ar: "الصلاة على النبي ﷺ", en: "Salawat", tallyAr: "صلاة على النبي ﷺ", tallyEn: "salawat upon the Prophet ﷺ",
    items: [
      { id: "salawat", text: "اللهم صلِّ وسلِّم على نبينا محمد", en: "O Allah, send prayers and peace upon our Prophet Muhammad", ...SALAWAT_VIRTUE, target: 100 },
      { id: "ibrahimiya", text: "اللهم صلِّ على محمد وعلى آل محمد، كما صليت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد", en: "O Allah, send prayers upon Muhammad and the family of Muhammad, as You sent prayers upon Ibrahim and the family of Ibrahim; You are Praiseworthy, Glorious", ...SALAWAT_VIRTUE, target: 10 },
    ],
  },
  {
    id: "tasbih", ar: "التسبيح", en: "Tasbih", tallyAr: "تسبيح", tallyEn: "tasbih",
    items: [
      { id: "subhan", text: "سبحان الله", en: "Glory be to Allah", virtue: "وسبحان الله والحمد لله تملآن ما بين السماوات والأرض", virtueEn: "And Subhan Allah and al-Hamdu lillah fill what is between the heavens and the earth.", source: "رواه مسلم", sourceEn: "Muslim", target: 33 },
      { id: "subhan_bihamdih", text: "سبحان الله وبحمده", en: "Glory be to Allah and praise be to Him", virtue: "مَن قال سبحان الله وبحمده في يومٍ مائة مرة حُطّت خطاياه وإن كانت مثل زبد البحر", virtueEn: "Whoever says it a hundred times a day, his sins are wiped away even if they are like the foam of the sea.", source: "متفق عليه", sourceEn: "Bukhari & Muslim", target: 100 },
      { id: "kalimatan", text: "سبحان الله وبحمده، سبحان الله العظيم", en: "Glory be to Allah and praise be to Him, glory be to Allah the Almighty", virtue: "كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن", virtueEn: "Two phrases light on the tongue, heavy on the scale, beloved to the Most Merciful.", source: "متفق عليه", sourceEn: "Bukhari & Muslim", target: 100 },
      { id: "subhan_azim", text: "سبحان الله العظيم وبحمده", en: "Glory be to Allah the Almighty and praise be to Him", virtue: "مَن قال سبحان الله العظيم وبحمده غُرست له نخلة في الجنة", virtueEn: "Whoever says it, a palm tree is planted for him in Paradise.", source: "رواه الترمذي، وصححه الألباني", sourceEn: "al-Tirmidhi; graded sahih by al-Albani", target: 33 },
      { id: "adad_khalqih", text: "سبحان الله وبحمده، عدد خلقه، ورضا نفسه، وزنة عرشه، ومداد كلماته", en: "Glory be to Allah and praise be to Him, as many times as His creation, as much as pleases Him, the weight of His Throne and the ink of His words", virtue: "لقد قلتُ بعدكِ أربع كلمات، ثلاث مرات، لو وُزنت بما قلتِ منذ اليوم لوزنتهن", virtueEn: "I said four phrases three times after you; were they weighed against all you have said today, they would outweigh it.", source: "رواه مسلم", sourceEn: "Muslim", target: 3 },
      { id: "baqiyat", text: "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر", en: "Glory be to Allah, praise be to Allah, there is no god but Allah, Allah is the Greatest", ...FOUR_WORDS, target: 33 },
      { id: "takbir", text: "الله أكبر", en: "Allah is the Greatest", ...FOUR_WORDS, target: 33 },
    ],
  },
  {
    id: "istighfar", ar: "الاستغفار", en: "Istighfar", tallyAr: "استغفار", tallyEn: "istighfar",
    items: [
      { id: "astaghfir", text: "أستغفر الله وأتوب إليه", en: "I seek Allah's forgiveness and turn to Him in repentance", virtue: "والله إني لأستغفر الله وأتوب إليه في اليوم أكثر من سبعين مرة", virtueEn: "By Allah, I seek Allah's forgiveness and repent to Him more than seventy times a day.", source: "رواه البخاري", sourceEn: "Bukhari", target: 100 },
      { id: "astaghfir_azim", text: "أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه", en: "I seek forgiveness of Allah the Almighty, besides whom there is no god, the Ever-Living, the Sustainer, and I repent to Him", virtue: "مَن قالها غُفر له وإن كان فرّ من الزحف", virtueEn: "Whoever says it is forgiven, even if he fled from the battlefield.", source: "رواه أبو داود والترمذي، وصححه الألباني", sourceEn: "Abu Dawud and al-Tirmidhi; graded sahih by al-Albani", target: 33 },
      { id: "rabbighfir", text: "رب اغفر لي وتب عليّ، إنك أنت التواب الرحيم", en: "My Lord, forgive me and accept my repentance; You are the Accepter of repentance, the Merciful", virtue: "إن كنا لنعدّ لرسول الله ﷺ في المجلس الواحد مائة مرة: رب اغفر لي وتب عليّ إنك أنت التواب الرحيم", virtueEn: "We would count the Messenger of Allah ﷺ saying it a hundred times in one sitting.", source: "رواه أبو داود والترمذي، وصححه الألباني", sourceEn: "Abu Dawud and al-Tirmidhi; graded sahih by al-Albani", target: 100, prophetSaid: false },
      { id: "yunus", text: "لا إله إلا أنت سبحانك إني كنت من الظالمين", en: "There is no god but You, glory be to You; I was among the wrongdoers", virtue: "دعوة ذي النون إذ دعا وهو في بطن الحوت، لم يدعُ بها رجلٌ مسلمٌ في شيءٍ قطّ إلا استجاب الله له", virtueEn: "The supplication of Dhu al-Nun in the belly of the whale: no Muslim ever calls with it for anything but Allah answers him.", source: "رواه الترمذي، وصححه الألباني", sourceEn: "al-Tirmidhi; graded sahih by al-Albani", target: 33 },
    ],
  },
  {
    id: "dhikr", ar: "الذكر والدعاء", en: "Dhikr & dua", tallyAr: "ذكر ودعاء", tallyEn: "dhikr & dua",
    items: [
      { id: "tahleel", text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", en: "There is no god but Allah alone, without partner; His is the dominion and His the praise, and He is over all things capable", virtue: "مَن قالها في يومٍ مائة مرة كانت له عدل عشر رقاب، وكُتبت له مائة حسنة، ومُحيت عنه مائة سيئة", virtueEn: "Whoever says it a hundred times a day earns the reward of freeing ten slaves, a hundred good deeds are written for him and a hundred bad deeds erased.", source: "متفق عليه", sourceEn: "Bukhari & Muslim", target: 100 },
      { id: "la_ilaha", text: "لا إله إلا الله", en: "There is no god but Allah", virtue: "أفضل الذكر لا إله إلا الله، وأفضل الدعاء الحمد لله", virtueEn: "The best remembrance is La ilaha illa Allah, and the best supplication is al-Hamdu lillah.", source: "رواه الترمذي، وحسنه الألباني", sourceEn: "al-Tirmidhi; graded hasan by al-Albani", target: 100 },
      { id: "hamd", text: "الحمد لله", en: "Praise be to Allah", virtue: "والحمد لله تملأ الميزان", virtueEn: "And al-Hamdu lillah fills the scale.", source: "رواه مسلم", sourceEn: "Muslim", target: 33 },
      { id: "hamd_kathir", text: "الحمد لله حمدًا كثيرًا طيبًا مباركًا فيه", en: "Praise be to Allah, abundant, good and blessed praise", virtue: "رأيت بضعة وثلاثين ملكًا يبتدرونها أيّهم يكتبها أول", virtueEn: "I saw more than thirty angels racing to be the first to record it.", source: "رواه البخاري", sourceEn: "Bukhari", target: 10 },
      { id: "hawqala", text: "لا حول ولا قوة إلا بالله", en: "There is no power nor strength except by Allah", virtue: "كنزٌ من كنوز الجنة", virtueEn: "A treasure from the treasures of Paradise.", source: "متفق عليه", sourceEn: "Bukhari & Muslim", target: 100 },
      { id: "radeet", text: "رضيت بالله ربًّا، وبالإسلام دينًا، وبمحمدٍ ﷺ رسولًا", en: "I am pleased with Allah as Lord, Islam as religion and Muhammad ﷺ as Messenger", virtue: "مَن قال رضيت بالله ربًّا، وبالإسلام دينًا، وبمحمدٍ رسولًا، وجبت له الجنة", virtueEn: "Whoever says it, Paradise becomes his due.", source: "رواه أبو داود، وصححه الألباني", sourceEn: "Abu Dawud; graded sahih by al-Albani", target: 3 },
      { id: "ainni", text: "اللهم أعنّي على ذكرك وشكرك وحسن عبادتك", en: "O Allah, help me to remember You, thank You and worship You well", virtue: "لا تدَعَنّ في دُبُر كل صلاة أن تقول: اللهم أعنّي على ذكرك وشكرك وحسن عبادتك", virtueEn: "Never leave saying after every prayer: O Allah, help me to remember You, thank You and worship You well.", source: "رواه أبو داود والنسائي، وصححه الألباني", sourceEn: "Abu Dawud and al-Nasa'i; graded sahih by al-Albani", target: 3 },
      { id: "hasbuna", text: "حسبنا الله ونعم الوكيل", en: "Allah is sufficient for us, and He is the best Disposer of affairs", virtue: "قالها إبراهيم عليه السلام حين أُلقي في النار، وقالها محمد ﷺ حين قالوا: إن الناس قد جمعوا لكم", virtueEn: "Ibrahim said it when he was thrown into the fire, and Muhammad ﷺ said it when they said: the people have gathered against you.", source: "رواه البخاري عن ابن عباس", sourceEn: "Bukhari, from Ibn Abbas", target: 33, prophetSaid: false },
      { id: "ya_hayy", text: "يا حيّ يا قيوم برحمتك أستغيث", en: "O Ever-Living, O Sustainer, by Your mercy I seek help", virtue: "كان النبي ﷺ إذا كربه أمرٌ قال: يا حيّ يا قيوم برحمتك أستغيث", virtueEn: "When something distressed the Prophet ﷺ he would say: O Ever-Living, O Sustainer, by Your mercy I seek help.", source: "رواه الترمذي، وحسنه الألباني", sourceEn: "al-Tirmidhi; graded hasan by al-Albani", target: 33, prophetSaid: false },
    ],
  },
];

export const ALL_DHIKR: Dhikr[] = DHIKR_GROUPS.flatMap((g) => g.items);

export const groupOfDhikr = (id: string): DhikrGroup =>
  DHIKR_GROUPS.find((g) => g.items.some((d) => d.id === id)) ?? DHIKR_GROUPS[0];

/**
 * «أذكار متنوّعة»: each tap moves to the next phrase. Salawat comes back regularly so a session
 * always carries it, and the four kinds alternate instead of repeating one phrase.
 */
const MIXED_ORDER = [
  "salawat", "subhan_bihamdih", "astaghfir", "la_ilaha",
  "salawat", "hamd", "rabbighfir", "hawqala",
  "salawat", "kalimatan", "yunus", "tahleel",
  "salawat", "subhan_azim", "astaghfir_azim", "hamd_kathir",
  "ibrahimiya", "baqiyat", "hasbuna", "takbir",
  "salawat", "subhan", "ya_hayy", "radeet", "ainni",
];
export const MIXED_DHIKR: Dhikr[] = MIXED_ORDER.map((id) => ALL_DHIKR.find((d) => d.id === id)).filter((d): d is Dhikr => !!d);
