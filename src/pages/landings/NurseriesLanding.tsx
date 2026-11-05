import { Baby, BookOpen, Trophy, Layers, ClipboardCheck, Users, Sparkles, HeartHandshake, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { HadithBlock, HADITH } from "@/components/campaigns/HadithBlock";
import { ProjectKindNote } from "@/components/campaigns/ProjectKind";
import { BentoGallery } from "@/components/campaigns/shared";
import { useLang } from "@/i18n/LangContext";
import { DonationPicker } from "@/components/campaigns/DonationPicker";
import { entityDonateHref, useEntityShares, type Share } from "@/data/entityShares";
import heroChild from "@/assets/hero-child.jpg";
import programEducation from "@/assets/program-education.jpg";
import posterEducation from "@/assets/poster-education.png";
import axisEducation from "@/assets/axis-education.jpg";

/**
 * /nurseries — an introduction to Al-Yusr's education project (not an enrolment page):
 * learning nurseries for ages 4–6, Qur'an houses for ages 4–16, Qur'an competitions,
 * curricula the foundation builds and supervises, and its educational team.
 */
/** Backend project behind this page: its packages (dashboard → المشاريع → حضانات اليسر, slug `nurseries`) are sold below. */
const SOURCE = { kind: "project" as const, slug: "nurseries" };
const DONATE = entityDonateHref(SOURCE.kind, SOURCE.slug);
/** Shown only until the backend program answers (offline / static mode). */
const DEFAULT_SHARES: Share[] = [
  { id: "qr-student", nameAr: "سهم تحفيظ طفل", nameEn: "Sponsor a child's memorisation", amount: 150 },
  { id: "qr-teacher", nameAr: "سهم في مرتب معلم", nameEn: "A share of a teacher's salary", amount: 500 },
  { id: "qr-teacher-full", nameAr: "مرتب معلم كامل", nameEn: "A teacher's full salary", amount: 4000 },
  { id: "qr-full", nameAr: "سهم التحفيظ بالكامل", nameEn: "Sponsor the whole memorisation programme", amount: 25000 },
];

const AGE_MIN = 4;
const AGE_MAX = 16;
const AGES = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i);
/** Position (0–100%) of an age on the ruler; a track spans from the start of `from` to the end of `to`. */
/** "من ٤ لـ ٦ سنين" / "Ages 4–6" (Arabic: سنين for 3–10, سنة above). */
const ageRange = (from: number, to: number, isAr: boolean) =>
  isAr ? `من ${from.toLocaleString("ar-EG")} لـ ${to.toLocaleString("ar-EG")} ${to <= 10 ? "سنين" : "سنة"}` : `Ages ${from}–${to}`;
const at = (age: number) => ((age - AGE_MIN) / (AGE_MAX - AGE_MIN + 1)) * 100;

const TRACKS: { icon: LucideIcon; from: number; to: number; ar: string; en: string; bodyAr: string; bodyEn: string; bar: string; points: { ar: string; en: string }[] }[] = [
  {
    icon: Baby,
    from: 4,
    to: 6,
    ar: "حضانات اليسر التعليمية",
    en: "Al-Yusr learning nurseries",
    bar: "bg-secondary",
    bodyAr: "حضانات تعليمية للأطفال من سن ٤ لحد ٦ سنين. الطفل بيتأسّس فيها قبل المدرسة على القراءة والكتابة والحساب، ويتربّى على القيم والآداب، في بيئة آمنة ومليانة لعب ونشاط.",
    bodyEn: "Learning nurseries for children aged 4 to 6. Before school, children build foundations in reading, writing and numbers and grow on good values, in a safe place full of play and activity.",
    points: [
      { ar: "تأسيس في القراءة والكتابة والحساب", en: "Foundations in reading, writing and numbers" },
      { ar: "قيم وآداب إسلامية بأسلوب يناسب سنّهم", en: "Islamic values and manners suited to their age" },
      { ar: "أنشطة ولعب ورسم بتبني شخصية الطفل", en: "Play, art and activities that build character" },
    ],
  },
  {
    icon: BookOpen,
    from: 4,
    to: 16,
    ar: "دور تحفيظ القرآن الكريم",
    en: "Qur'an memorisation houses",
    bar: "bg-primary",
    bodyAr: "دور تحفيظ للأطفال والشباب من سن ٤ لحد ١٦ سنة. حلقات حفظ ومراجعة وتجويد بتمشي مع الطالب من أول سورة لحد ما يكبر، علشان يطلع جيل حافظ لكتاب الله وفاهم معانيه.",
    bodyEn: "Qur'an houses for children and teens aged 4 to 16. Memorisation, review and tajweed circles that grow with the student from the first surah onward, raising a generation that holds the Qur'an and understands it.",
    points: [
      { ar: "حلقات حسب مستوى كل طالب وسنّه", en: "Circles matched to each student's level and age" },
      { ar: "تعليم أحكام التجويد والتلاوة الصحيحة", en: "Tajweed and correct recitation" },
      { ar: "مراجعة دورية تثبّت الحفظ", en: "Regular review that makes memorisation last" },
    ],
  },
];

const PILLARS: { icon: LucideIcon; ar: string; en: string; bodyAr: string; bodyEn: string }[] = [
  {
    icon: Layers,
    ar: "مناهج متخصصة بنبنيها بنفسنا",
    en: "Specialised curricula we build ourselves",
    bodyAr: "ما بنعتمدش على منهج جاهز. بنبني مناهج الحضانة ومناهج التحفيظ بنفسنا، متدرّجة حسب السن والمستوى، ومربوطة ببعض علشان الطفل يكمّل رحلته من غير ما يتوه.",
    bodyEn: "We don't rely on an off-the-shelf curriculum. We build our nursery and Qur'an curricula ourselves, graded by age and level and connected so each child's journey continues smoothly.",
  },
  {
    icon: ClipboardCheck,
    ar: "إشراف ومتابعة مستمرة",
    en: "Continuous supervision",
    bodyAr: "المؤسسة بتشرف بنفسها على تطبيق المناهج في كل حضانة ودار تحفيظ: زيارات، وتقييم دوري للطلاب، ومتابعة لجودة التعليم.",
    bodyEn: "The foundation itself supervises how the curricula are taught in every nursery and Qur'an house: visits, regular student assessment and quality follow-up.",
  },
  {
    icon: Users,
    ar: "فريق تربوي قوي",
    en: "A strong educational team",
    bodyAr: "معلمات حضانة ومحفّظين ومحفّظات ومشرفين تربويين، بيتابعوا كل طفل كإنسان قبل ما يكون طالب، وبيتدرّبوا باستمرار على أساليب التعليم والتربية.",
    bodyEn: "Nursery teachers, Qur'an teachers and educational supervisors who see each child as a person before a student, and who train continually in teaching and upbringing.",
  },
  {
    icon: Trophy,
    ar: "مسابقات القرآن الكريم",
    en: "Qur'an competitions",
    bodyAr: "مسابقات دورية في الحفظ والتجويد بتشجّع الطلاب وتخلق روح منافسة حلوة، وبتنتهي بتكريم للحفّاظ قدّام أهاليهم.",
    bodyEn: "Regular memorisation and tajweed competitions that motivate students with healthy rivalry, ending with memorisers honoured in front of their families.",
  },
];

const GALLERY = [
  { src: programEducation, altAr: "أطفال في فصل تعليمي بحضانات اليسر", altEn: "Children in an Al-Yusr nursery classroom" },
  { src: axisEducation, altAr: "حلقة تحفيظ قرآن للأطفال في دور اليسر", altEn: "A children's Qur'an circle" },
  { src: posterEducation, altAr: "تعليم الأطفال في مؤسسة اليسر", altEn: "Children's education at Al-Yusr" },
  { src: heroChild, altAr: "طفل من أطفال حضانات اليسر", altEn: "A child at an Al-Yusr nursery" },
];

/** Age ruler 4 → 16 with one bar per track: shows at a glance which ages each part of the project serves. */
const AgeJourney = ({ isAr }: { isAr: boolean }) => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
    <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "رحلة الطفل معانا من ٤ لـ ١٦ سنة" : "A child's journey with us, from 4 to 16"}</h2>
    <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
      {isAr ? "الطفل بيبدأ معانا في الحضانة وحلقة التحفيظ في نفس الوقت، وبيكمّل في دار التحفيظ لحد ما يبقى شاب." : "Children start with us in the nursery and the Qur'an circle at the same time, then continue in the Qur'an house into their teens."}
    </p>
    <div className="mt-8 space-y-4" dir="ltr">
      {TRACKS.map((t) => (
        <div key={t.en}>
          <p className="mb-1.5 text-sm font-black text-primary" dir={isAr ? "rtl" : "ltr"}>
            {isAr ? t.ar : t.en} <span className="font-bold text-muted-foreground">· {ageRange(t.from, t.to, isAr)}</span>
          </p>
          <div className="relative h-4 rounded-full bg-muted">
            <div className={`absolute inset-y-0 rounded-full ${t.bar}`} style={{ left: `${at(t.from)}%`, width: `${at(t.to + 1) - at(t.from)}%` }} />
          </div>
        </div>
      ))}
      <div className="relative mt-2 h-6">
        {AGES.map((a) => (
          <span key={a} className="absolute -translate-x-1/2 text-[11px] font-bold text-muted-foreground" style={{ left: `${(at(a) + at(a + 1)) / 2}%` }}>
            {isAr ? a.toLocaleString("ar-EG") : a}
          </span>
        ))}
      </div>
      <p className="text-center text-xs font-bold text-muted-foreground" dir={isAr ? "rtl" : "ltr"}>{isAr ? "السن بالسنين" : "Age in years"}</p>
    </div>
  </div>
);

const NurseriesMain = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const shares = useEntityShares(SOURCE.kind, SOURCE.slug, DEFAULT_SHARES);
  return (
    <>
      {/* Key facts */}
      <section aria-label={isAr ? "المشروع في سطور" : "The project at a glance"} className="border-y border-border bg-card">
        <div className="container mx-auto max-w-6xl px-4 py-5">
          <ul className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
            {[
              { n: isAr ? "٤ – ٦ سنين" : "Ages 4–6", l: isAr ? "حضانات تعليمية" : "Learning nurseries" },
              { n: isAr ? "٤ – ١٦ سنة" : "Ages 4–16", l: isAr ? "دور تحفيظ القرآن" : "Qur'an houses" },
              { n: isAr ? "مناهج خاصة" : "Own curricula", l: isAr ? "بنبنيها ونشرف عليها" : "Built and supervised by us" },
              { n: isAr ? "مسابقات قرآن" : "Qur'an contests", l: isAr ? "وتكريم للحفّاظ" : "With awards for memorisers" },
            ].map((f) => (
              <li key={f.l} className="rounded-2xl bg-muted/40 px-3 py-3">
                <p className="text-lg font-black text-primary sm:text-xl">{f.n}</p>
                <p className="mt-0.5 text-xs font-bold text-muted-foreground">{f.l}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The two parts of the project */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "المشروع جزئين بيكمّلوا بعض" : "Two parts that complete each other"}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {TRACKS.map(({ icon: Icon, from, to, ar, en, bodyAr, bodyEn, points }) => (
              <article key={en} className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><Icon className="h-7 w-7" /></span>
                  <span className="rounded-full bg-secondary/15 px-3 py-1 text-sm font-black text-primary">
                    {ageRange(from, to, isAr)}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-black text-primary">{isAr ? ar : en}</h3>
                <p className="mt-2 text-sm leading-loose text-muted-foreground sm:text-base">{isAr ? bodyAr : bodyEn}</p>
                <ul className="mt-4 space-y-2">
                  {points.map((pt) => (
                    <li key={pt.en} className="flex items-start gap-2 text-sm font-bold text-foreground/85">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /> {isAr ? pt.ar : pt.en}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-8">
            <AgeJourney isAr={isAr} />
          </div>
        </div>
      </section>

      {/* What makes it different */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "إيه اللي بيميّز حضانات ودور اليسر؟" : "What sets Al-Yusr's nurseries and Qur'an houses apart"}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, ar, en, bodyAr, bodyEn }) => (
              <article key={en} className="flex items-start gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-primary"><Icon className="h-6 w-6" /></span>
                <div>
                  <h3 className="text-lg font-black text-primary">{isAr ? ar : en}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{isAr ? bodyAr : bodyEn}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HadithBlock hadith={HADITH.quran} tone="dark" label={isAr ? "فضل تعلّم القرآن وتعليمه" : "The virtue of learning and teaching the Qur'an"} />

      {/* Project type + how donors help */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl space-y-6 px-4">
          <ProjectKindNote
            kinds={["service", "impact"]}
            noteAr="حضانات اليسر ودور التحفيظ بتجمع النوعين: مشروع خدمي بيدخّل موارد بتتصرف على أنشطة المؤسسة، وفي نفس الوقت أثره الأكبر هو تربية جيل متعلّم وحافظ للقرآن."
            noteEn="Al-Yusr's nurseries and Qur'an houses are both: a service project whose income funds the foundation's work, and above all a way of raising an educated generation that holds the Qur'an."
          />
          <div className="flex items-start gap-3 rounded-3xl bg-primary p-6 text-primary-foreground">
            <HeartHandshake className="mt-1 h-6 w-6 shrink-0 text-secondary" />
            <p className="text-sm leading-loose sm:text-base">
              {isAr
                ? "تبرعك للمشروع بيساعدنا نطوّر المناهج، وندرّب الفريق التربوي، ونجهّز الفصول وحلقات التحفيظ، ونكرّم الحفّاظ في المسابقات. وكل آية بيحفظها طالب صدقة جارية لكل اللي ساهم فيها."
                : "Your gift helps us develop the curricula, train the educational team, equip classrooms and Qur'an circles, and honour memorisers at the competitions. Every verse a student memorises is ongoing charity for all who helped."}
            </p>
          </div>
        </div>
      </section>

      {/* Donation packages (from the backend program) */}
      <section id="nurseries-shares" className="scroll-mt-24 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "ساهم في حضانات ودور اليسر" : "Support Al-Yusr's nurseries and Qur'an houses"}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-loose text-muted-foreground sm:text-base">
            {isAr ? "اختر السهم المناسب لك، ويمكنك زيادة عدد الأسهم أو تعديل المبلغ في صفحة التبرع." : "Pick the share that suits you; you can add more shares or change the amount on the donation page."}
          </p>
          <DonationPicker source={SOURCE} shares={shares} title={isAr ? "أسهم المشروع" : "Project shares"} />
        </div>
      </section>

      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "من حضاناتنا ودورنا" : "From our nurseries and Qur'an houses"}</h2>
          <BentoGallery items={GALLERY} isAr={isAr} />
        </div>
      </section>
    </>
  );
};

const NurseriesLanding = () => (
  <CampaignLandingShell
    slug="nurseries"
    path="/nurseries"
    crumbParent={{ ar: "مشاريعنا", en: "Our projects", href: "/projects" }}
    badgeAr="مشروع تعليمي · صدقة جارية"
    badgeEn="Education project · ongoing charity"
    titleAr="حضانات اليسر التعليمية ودور تحفيظ القرآن"
    titleEn="Al-Yusr learning nurseries and Qur'an houses"
    taglineAr="حضانات تعليمية للأطفال من ٤ لـ ٦ سنين، ودور تحفيظ قرآن من ٤ لـ ١٦ سنة، بمناهج متخصصة بنبنيها ونشرف عليها بنفسنا، وفريق تربوي قوي، ومسابقات قرآن بتكرّم الحفّاظ."
    taglineEn="Learning nurseries for ages 4–6 and Qur'an houses for ages 4–16, with specialised curricula we build and supervise ourselves, a strong educational team, and Qur'an competitions that honour memorisers."
    metaDescAr="حضانات اليسر التعليمية للأطفال من 4 إلى 6 سنوات ودور تحفيظ القرآن من 4 إلى 16 سنة: مناهج متخصصة تبنيها مؤسسة اليسر وتشرف عليها، فريق تربوي، ومسابقات قرآن."
    metaDescEn="Al-Yusr learning nurseries for ages 4–6 and Qur'an houses for ages 4–16: specialised curricula built and supervised by Al-Yusr, an educational team, and Qur'an competitions."
    seo={{ title: { ar: "حضانات اليسر التعليمية ودور تحفيظ القرآن للأطفال | مؤسسة اليسر", en: "Al-Yusr learning nurseries & Qur'an houses" } }}
    heroImage={heroChild}
    heroAlt="طفل في حضانات اليسر التعليمية ودور تحفيظ القرآن"
    main={<NurseriesMain />}
    relatedLinks={[
      { href: "/projects", ar: "كل مشاريع اليسر", en: "All projects" },
      { href: "/athar", ar: "حملة أثر (التعليم)", en: "Athar (education)" },
      { href: "/takrim", ar: "تكريم الإنسان", en: "Takrim" },
      { href: "/water", ar: "سقيا الماء", en: "Clean water" },
    ]}
    faq={{
      ar: [
        { q: "حضانات اليسر لأي سن؟", a: "حضانات اليسر التعليمية للأطفال من سن ٤ لحد ٦ سنين، يعني مرحلة ما قبل المدرسة." },
        { q: "دور تحفيظ القرآن لأي سن؟", a: "دور التحفيظ بتستقبل الأطفال والشباب من سن ٤ لحد ١٦ سنة، والحلقات بتتقسّم حسب السن والمستوى." },
        { q: "مين اللي بيحط المناهج؟", a: "مؤسسة اليسر بتبني مناهج الحضانة والتحفيظ بنفسها، وبتشرف على تطبيقها في كل حضانة ودار تحفيظ بزيارات وتقييم دوري." },
        { q: "إيه هي مسابقات القرآن؟", a: "مسابقات دورية في الحفظ والتجويد للطلاب، بتشجّعهم على الإتقان وبتنتهي بتكريم الحفّاظ قدّام أهاليهم." },
        { q: "مين الفريق اللي بيعلّم الأطفال؟", a: "فريق تربوي من معلمات الحضانة والمحفّظين والمحفّظات والمشرفين التربويين، وبيتدرّبوا باستمرار." },
        { q: "إزاي أدعم المشروع؟", a: "تقدر تتبرع من صفحة التبرع، وتبرعك بيروح لتطوير المناهج وتدريب الفريق وتجهيز الفصول وتكريم الحفّاظ." },
      ],
      en: [
        { q: "What ages do the nurseries serve?", a: "Al-Yusr learning nurseries serve children aged 4 to 6, the pre-school years." },
        { q: "What ages do the Qur'an houses serve?", a: "Children and teens aged 4 to 16, in circles grouped by age and level." },
        { q: "Who writes the curricula?", a: "Al-Yusr builds its own nursery and Qur'an curricula and supervises how they are taught through visits and regular assessment." },
        { q: "What are the Qur'an competitions?", a: "Regular memorisation and tajweed competitions that motivate students and end with memorisers honoured in front of their families." },
        { q: "Who teaches the children?", a: "An educational team of nursery teachers, Qur'an teachers and supervisors who train continually." },
        { q: "How can I support the project?", a: "Give from the donation page; your gift funds curriculum development, team training, classrooms and awards for memorisers." },
      ],
    }}
    donateHref={DONATE}
    donateLabelAr="ادعم المشروع"
    donateLabelEn="Support the project"
    bottomCtaAr="ساهم في تربية جيل متعلّم وحافظ للقرآن"
    bottomCtaEn="Help raise an educated generation that holds the Qur'an"
  />
);

export default NurseriesLanding;
