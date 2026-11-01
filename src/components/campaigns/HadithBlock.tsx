import { useLang } from "@/i18n/LangContext";

export type Hadith = { ar: string; en: string; sourceAr: string; sourceEn: string };

/** Authentic hadith tied to each campaign's theme. Sources are stated on every block. */
export const HADITH = {
  dhill: { ar: "أفضلُ الصدقةِ سَقْيُ الماء", en: "The best charity is giving water to drink.", sourceAr: "رواه أبو داود والنسائي وابن ماجه، وحسّنه الألباني", sourceEn: "Abu Dawud, al-Nasa'i and Ibn Majah; graded hasan by al-Albani" },
  setr: { ar: "ومَن سَتَرَ مسلماً سَتَرَه اللهُ في الدنيا والآخرة", en: "Whoever covers a Muslim, Allah will cover him in this world and the Hereafter.", sourceAr: "رواه مسلم", sourceEn: "Sahih Muslim" },
  athar: { ar: "إذا مات الإنسانُ انقطع عنه عملُه إلا من ثلاثة: إلا من صدقةٍ جارية، أو علمٍ يُنتفَع به، أو ولدٍ صالحٍ يدعو له", en: "When a person dies, their deeds end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for them.", sourceAr: "رواه مسلم", sourceEn: "Sahih Muslim" },
  ramadan: { ar: "مَن فطَّر صائماً كان له مثلُ أجره، غيرَ أنه لا ينقصُ من أجر الصائم شيئاً", en: "Whoever gives iftar to a fasting person earns the same reward, without the fasting person's reward being reduced at all.", sourceAr: "رواه الترمذي وقال: حسن صحيح", sourceEn: "al-Tirmidhi, who graded it hasan sahih" },
  markoun: { ar: "اتقوا النارَ ولو بشِقِّ تمرة", en: "Protect yourselves from the Fire, even with half a date.", sourceAr: "متفق عليه", sourceEn: "Agreed upon (Bukhari & Muslim)" },
  arboun: { ar: "ما نقصت صدقةٌ من مال", en: "Charity never decreases wealth.", sourceAr: "رواه مسلم", sourceEn: "Sahih Muslim" },
  takrim: { ar: "مَن شَهِدَ الجنازةَ حتى يُصلَّى عليها فله قيراط، ومَن شَهِدَها حتى تُدفَنَ كان له قيراطان. قيل: وما القيراطان؟ قال: مثلُ الجبلين العظيمين", en: "Whoever attends a funeral until the prayer is offered gets one qirat of reward, and whoever stays until the burial gets two. It was asked: what are two qirats? He said: like two great mountains.", sourceAr: "متفق عليه (البخاري ومسلم)", sourceEn: "Agreed upon (Bukhari & Muslim)" },
  farm: { ar: "ما من مسلمٍ يغرِسُ غرسًا، أو يزرعُ زرعًا، فيأكلُ منه طيرٌ أو إنسانٌ أو بهيمةٌ، إلا كان له به صدقة", en: "No Muslim plants a tree or sows a crop from which a bird, a person or an animal eats, except that it is charity for him.", sourceAr: "متفق عليه (البخاري ومسلم)", sourceEn: "Agreed upon (Bukhari & Muslim)" },
  quran: { ar: "خيرُكم مَن تعلَّمَ القرآنَ وعلَّمَه", en: "The best of you are those who learn the Qur'an and teach it.", sourceAr: "رواه البخاري", sourceEn: "Sahih al-Bukhari" },
  food: { ar: "يا أيها الناس، أفشوا السلام، وأطعِموا الطعام، وصِلوا الأرحام، وصلّوا بالليل والناس نيام، تدخلوا الجنة بسلام", en: "O people, spread peace, feed the hungry, keep the ties of kinship, and pray at night while people sleep, and you will enter Paradise in peace.", sourceAr: "رواه الترمذي وقال: حسن صحيح، وابن ماجه", sourceEn: "al-Tirmidhi (who graded it hasan sahih) and Ibn Majah" },
} satisfies Record<string, Hadith>;

type Tone = "light" | "dark" | "night" | "winter" | "paper";

const TONES: Record<Tone, { section: string; text: string; source: string; mark: string }> = {
  light: { section: "bg-[hsl(60_33%_97%)]", text: "text-primary", source: "text-muted-foreground", mark: "text-secondary" },
  dark: { section: "bg-primary", text: "text-secondary", source: "text-primary-foreground/70", mark: "text-secondary/40" },
  night: { section: "ramadan-night", text: "text-[hsl(var(--gold))]", source: "text-primary-foreground/70", mark: "text-[hsl(var(--gold)/0.35)]" },
  winter: { section: "setr-night", text: "text-[hsl(195_70%_88%)]", source: "text-primary-foreground/70", mark: "text-[hsl(195_70%_80%/0.3)]" },
  paper: { section: "athar-paper relative", text: "text-primary", source: "text-foreground/60", mark: "text-accent/40" },
};

export const HadithBlock = ({ hadith, tone = "light", label }: { hadith: Hadith; tone?: Tone; label?: string }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const t = TONES[tone];
  return (
    <section className={`${t.section} py-14 md:py-20`} aria-label={isAr ? "حديث شريف" : "Hadith"}>
      <figure className="container relative mx-auto max-w-4xl px-4 text-center">
        <span aria-hidden className={`block font-serif text-7xl leading-none ${t.mark}`}>❝</span>
        {label && <p className={`mt-2 text-sm font-black ${t.source}`}>{label}</p>}
        <blockquote className={`mx-auto mt-3 max-w-3xl text-2xl font-black leading-[1.75] md:text-3xl md:leading-[1.7] ${t.text}`}>
          {isAr ? `قال رسول الله ﷺ: «${hadith.ar}»` : `The Prophet ﷺ said: “${hadith.en}”`}
        </blockquote>
        <figcaption className={`mt-5 text-sm font-bold ${t.source}`}>{isAr ? hadith.sourceAr : hadith.sourceEn}</figcaption>
      </figure>
    </section>
  );
};
