import { Droplets, Home, Filter, Gauge, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { HadithBlock, HADITH } from "@/components/campaigns/HadithBlock";
import { ProjectKindNote } from "@/components/campaigns/ProjectKind";
import { WaterTap } from "@/components/campaigns/WaterTap";
import { BentoGallery } from "@/components/campaigns/shared";
import { useLang } from "@/i18n/LangContext";
import waterHero from "@/assets/program-water-new.jpg";
import posterWater from "@/assets/poster-water.png";
import yusrWater from "@/assets/yusr-water.png";

const DONATE = "/donate?project=water";

const WHAT: { icon: LucideIcon; ar: string; en: string; bodyAr: string; bodyEn: string }[] = [
  { icon: Home, ar: "وصلة مياه منزلية", en: "A home water connection", bodyAr: "توصيل مية الشرب النظيفة من الشبكة الرسمية لجوه البيت، بالمواسير والتركيب.", bodyEn: "Connecting clean drinking water from the official network into the home, with pipes and installation." },
  { icon: Gauge, ar: "عداد ورسوم رسمية", en: "Meter and official fees", bodyAr: "رسوم العداد والتوصيل الرسمية اللي بتقف عائق قدام أسر كتير.", bodyEn: "The official meter and connection fees that stop many families." },
  { icon: Filter, ar: "فلاتر ومحطات تنقية", en: "Filters and purification units", bodyAr: "فلترة المية في القرى اللي شبكتها ضعيفة أو مياهها مش آمنة للشرب.", bodyEn: "Filtering water in villages where the network is weak or unsafe to drink." },
];

const GALLERY = [
  { src: waterHero, altAr: "توصيل مياه نظيفة لبيت أسرة مستحقة في الدقهلية", altEn: "Clean water reaching a family home in Dakahlia" },
  { src: posterWater, altAr: "مشروع سقيا الماء من مؤسسة اليسر", altEn: "Al-Yusr clean water project" },
  { src: yusrWater, altAr: "مياه شرب نقية للأطفال وكبار السن", altEn: "Safe drinking water for children and elders" },
];

const WaterMain = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <>
      {/* Interactive tap */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <WaterTap />
        </div>
      </section>

      {/* Why clean water */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "ليه المية النظيفة أولوية؟" : "Why clean water comes first"}</h2>
          <div className="mt-6 space-y-4 text-sm leading-loose text-foreground/85 sm:text-base">
            <p>
              {isAr
                ? "المية النظيفة هي أول خط حماية لصحة الأطفال وكبار السن. الطفل جسمه لسه بيكبر ومناعته ضعيفة، وكبير السن جسمه ما بيستحملش الأمراض اللي بتيجي من المية الملوثة. شربة مية نظيفة في البيت معناها زيارات أقل للدكتور، ومصاريف علاج أقل، وطفل بيلعب ويروح مدرسته بصحته."
                : "Clean water is the first line of protection for children and the elderly. A child's immunity is still developing, and an elder's body copes poorly with waterborne illness. Clean water at home means fewer doctor visits, lower medical costs, and children who play and go to school healthy."}
            </p>
            <p>
              {isAr
                ? "وفي بيوت كتير في قرى الدقهلية، الأم أو الأب بيمشوا مسافات طويلة كل يوم علشان يملوا جراكن مية، وأحيانًا المية دي نفسها مش نظيفة. ولما المية تقطع، البيت كله بيتعطّل: لا طبخ، ولا غسيل، ولا وضوء، ولا نظافة للصغيرين. وصلة مية واحدة بترجّع للأسرة وقتها وصحتها وراحة بالها."
                : "In many homes in Dakahlia's villages, a mother or father walks long distances daily to fill jerrycans, and that water is often unclean. When water is cut, the whole home stops: no cooking, washing, ablution or bathing the little ones. One connection gives a family back its time, health and peace of mind."}
            </p>
          </div>
        </div>
      </section>

      {/* What your donation does */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "تبرعك في سقيا الماء بيروح فين؟" : "Where your water donation goes"}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {WHAT.map(({ icon: Icon, ar, en, bodyAr, bodyEn }) => (
              <article key={en} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-600 text-white"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-4 text-lg font-black text-primary">{isAr ? ar : en}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isAr ? bodyAr : bodyEn}</p>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <ProjectKindNote
              kinds={["impact"]}
              noteAr="سقيا الماء مشروع أثر مجتمعي: صحة وأمان للأطفال وكبار السن، وراحة للأمهات والآباء، وصدقة جارية ما دام الناس بيشربوا."
              noteEn="Clean water is a community-impact project: health for children and elders, relief for parents, and ongoing charity as long as people drink."
            />
          </div>
        </div>
      </section>

      <HadithBlock hadith={HADITH.dhill} tone="dark" />

      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "من الميدان" : "From the field"}</h2>
          <BentoGallery items={GALLERY} isAr={isAr} />
        </div>
      </section>
    </>
  );
};

const WaterLanding = () => (
  <CampaignLandingShell
    slug="water"
    path="/water"
    crumbParent={{ ar: "مشاريعنا", en: "Our projects", href: "/projects" }}
    badgeAr="أفضل الصدقة سقي الماء"
    badgeEn="The best charity is giving water"
    titleAr="سقيا الماء — مياه نظيفة لكل بيت"
    titleEn="Clean water — safe water for every home"
    taglineAr="وصلة مية نظيفة جوه البيت يعني أمان لصحة الأطفال وكبار السن، وراحة للأم والأب من مشوار الجراكن والمية الملوثة. افتح الحنفية تحت وشوف الفرق بنفسك."
    taglineEn="A clean water connection at home means safety for children and elders, and relief for parents from long trips and dirty water. Open the tap below and see the difference."
    metaDescAr="تبرع لمشروع سقيا الماء من مؤسسة اليسر: توصيل مياه شرب نظيفة للبيوت وفلاتر للقرى في الدقهلية. أمان لصحة الأطفال وكبار السن وصدقة جارية."
    metaDescEn="Support Al-Yusr's clean water project: home water connections and filters for villages in Dakahlia. Safety for children and elders, and ongoing charity."
    seo={{ title: { ar: "سقيا الماء وتوصيل مياه نظيفة للبيوت | صدقة جارية — مؤسسة اليسر", en: "Clean water connections | Ongoing charity — Al-Yusr" } }}
    heroImage={waterHero}
    heroAlt="توصيل مياه شرب نظيفة لبيت أسرة مستحقة من مؤسسة اليسر"
    main={<WaterMain />}
    relatedLinks={[
      { href: "/projects", ar: "كل مشاريع اليسر", en: "All projects" },
      { href: "/dhill", ar: "حملة ظِلّ (سقيا وأسقف)", en: "Dhill campaign" },
      { href: "/takrim", ar: "تكريم الإنسان", en: "Takrim" },
      { href: "/nurseries", ar: "حضانات اليسر ودور التحفيظ", en: "Nurseries & Qur'an houses" },
    ]}
    faq={{
      ar: [
        { q: "مين بيستفيد من مشروع سقيا الماء؟", a: "أسر مستحقة في قرى الدقهلية مالهاش وصلة مية في البيت أو مياهها مش آمنة، بعد بحث ميداني من فريق اليسر." },
        { q: "إيه اللي بيتعمل بالتبرع؟", a: "وصلات مياه منزلية من الشبكة الرسمية، ورسوم العداد، وفلاتر ومحطات تنقية للقرى اللي مياهها ضعيفة." },
        { q: "هل سقيا الماء صدقة جارية؟", a: "أيوه، طول ما الناس بتشرب وتتوضى من المية دي الأجر مستمر. وقال ﷺ: «أفضل الصدقة سقي الماء»." },
        { q: "هل هيوصلني توثيق؟", a: "أيوه، بنرسل صور التنفيذ بعد ما الوصلة تتركب وتشتغل." },
        { q: "ممكن أعمل وصلة مية صدقة عن متوفى؟", a: "أيوه، تقدر تكتب اسم المتوفى في صفحة التبرع وتكون الصدقة باسمه." },
      ],
      en: [
        { q: "Who benefits?", a: "Families in Dakahlia's villages with no home water connection or unsafe water, selected after a field visit." },
        { q: "What does the donation fund?", a: "Home connections from the official network, meter fees, and filters or purification units for villages." },
        { q: "Is it ongoing charity?", a: "Yes. As long as people drink and make ablution from it, the reward continues." },
        { q: "Will I receive proof?", a: "Yes, we send photos once the connection is installed and working." },
        { q: "Can I give it on behalf of someone who has passed?", a: "Yes, add their name on the donation page." },
      ],
    }}
    donateHref={DONATE}
    donateLabelAr="تبرع لسقيا الماء"
    donateLabelEn="Give clean water"
    bottomCtaAr="افتح حنفية خير في بيت محتاج"
    bottomCtaEn="Open a tap of good in a home in need"
  />
);

export default WaterLanding;
