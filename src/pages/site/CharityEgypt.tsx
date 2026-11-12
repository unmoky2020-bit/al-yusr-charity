import { useHasCases } from "@/data/useHasCases";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, ArrowRight, BadgeCheck, CreditCard, Globe, HandHeart, Landmark, MapPin, QrCode, Receipt,
  Search, ShieldCheck, Smartphone,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, FAQSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { FaqSection, ProgramsGrid, StepsCard } from "@/components/common/SeoLandingParts";
import { useLang } from "@/i18n/LangContext";
import { ORG, whatsappLink } from "@/data/orgInfo";

const PATH = "/charity-egypt";
const SITE = "https://elyusr.org";

/**
 * /charity-egypt — for searches across Egypt («جمعيات خيرية في مصر»، «التبرع اون لاين»، «جمعية خيرية مشهرة»).
 * It says plainly where the work happens (Mansoura and Dakahlia, villages of Kafr El-Sheikh around the
 * El-Hafir medical complex, and other governorates for some projects) and how anyone in Egypt can give.
 * No numbers or testimonials the dashboard doesn't hold.
 */
const CharityEgypt = () => {
  const { lang } = useLang();
  const hasCases = useHasCases();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  const intents = [
    { to: "/donate", Icon: HandHeart, t: ar ? "اتبرع دلوقتي" : "Donate now", d: ar ? "بالكارت أو المحفظة أو إنستاباي، وتاخد رقم تتبع" : "By card, wallet or InstaPay, with a tracking number", accent: true },
    { to: "/zakat", Icon: Landmark, t: ar ? "زكاة المال" : "Zakat", d: ar ? "طلّع زكاة مالك أونلاين من أي محافظة" : "Pay your zakat online from anywhere in Egypt" },
    { to: "/cases", Icon: Search, t: ar ? "حالات محتاجة دلوقتي" : "Cases in need now", d: ar ? "حالات اتراجعت ميدانيًا وتقدر تتابعها" : "Field-reviewed cases you can follow" },
    { to: "/donate/track", Icon: Receipt, t: ar ? "تتبع تبرعك" : "Track your gift", d: ar ? "برقم التتبع في أي وقت، ومنه تنزّل الإيصال" : "Any time with your tracking number, receipt included" },
  ];

  const methods = [
    { Icon: CreditCard, t: ar ? "الكارت" : "Card", d: ar ? "فيزا أو ماستركارد على بوابة كاشير. الموقع مش بيحتفظ ببيانات كارتك." : "Visa or Mastercard through the Kashier gateway. The site never stores your card." },
    { Icon: Smartphone, t: ar ? "المحافظ الإلكترونية" : "Mobile wallets", d: ar ? "حوّل على رقم المحفظة اللي في صفحة التبرع، وابعت الإيصال على واتساب." : "Send to the wallet number on the donate page, then share the receipt on WhatsApp." },
    { Icon: QrCode, t: ar ? "إنستاباي" : "InstaPay", d: ar ? "حوّل على عنوان الدفع اللي في صفحة التبرع، في ثواني." : "Send to the payment address on the donate page in seconds." },
    { Icon: Landmark, t: ar ? "التحويل البنكي" : "Bank transfer", d: ar ? "بيانات الحساب في صفحة التبرع، وبعد التحويل ابعت الإيصال." : "Account details are on the donate page; share the receipt after you transfer." },
  ];

  const proofSteps = ar
    ? [
        { t: "رقم تتبع لكل تبرع", d: "بيوصلك مع التبرع، وبيه تتابع حالته من صفحة «تتبع تبرعك» في أي وقت." },
        { t: "إيصال بالتبرع", d: "تنزّله من صفحة التتبع، أو تطلبه مننا على واتساب." },
        { t: "الحالة قدامك", d: "في صفحة كل حالة بتشوف المطلوب والمتجمّع لحد دلوقتي." },
      ]
    : [
        { t: "A tracking number for every gift", d: "You get it with your donation and can follow it on «Track your donation» at any time." },
        { t: "A receipt", d: "Download it from the tracking page, or ask us on WhatsApp." },
        { t: "The case in front of you", d: "Each case page shows its goal and what has been raised so far." },
      ];

  const scope = ar
    ? "مقرنا في المنصورة، وأغلب شغلنا في محافظة الدقهلية بمراكزها وقراها. مجمع اليسر الطبي في الحفير بيخدم قرى بين الدقهلية وكفر الشيخ، وبعض المشاريع والحملات بتوصل لمحافظات تانية. وكل حالة على الموقع مكتوب فيها مكانها."
    : "We are based in Mansoura, and most of our work is in Dakahlia's towns and villages. The El-Hafir medical complex serves villages between Dakahlia and Kafr El-Sheikh, and some projects and campaigns reach other governorates. Every case on the site states where it is.";

  const faq = ar
    ? [
        { q: "هل مؤسسة اليسر جمعية خيرية مشهرة في مصر؟", a: `أيوه. مؤسسة اليسر الخيرية ${ORG.registrationAr}، ومقرها في المنصورة بمحافظة الدقهلية.` },
        { q: "أقدر أتبرع وأنا في القاهرة أو الإسكندرية أو أي محافظة تانية؟", a: "أيوه. التبرع أونلاين من أي محافظة: بالكارت أو المحفظة أو إنستاباي أو التحويل البنكي، من صفحة التبرع." },
        { q: "إيه طرق الدفع المتاحة؟", a: "الكارت (فيزا وماستركارد) على بوابة كاشير، والمحافظ الإلكترونية، وإنستاباي، والتحويل البنكي. ولو حوّلت، ابعت الإيصال على واتساب علشان نأكد تبرعك." },
        { q: "هل التبرع أونلاين آمن؟", a: "الدفع بالكارت بيتم على بوابة كاشير، والموقع مش بيحتفظ ببيانات كارتك. وكل تبرع بياخد رقم تتبع." },
        { q: "تبرعي بيروح فين؟", a: scope },
        { q: "أقدر أطلّع زكاة مالي أونلاين؟", a: "أيوه، من صفحة زكاة المال، بأي طريقة دفع من اللي فوق." },
        { q: "إزاي أتابع تبرعي؟", a: `برقم التتبع من صفحة «تتبع تبرعك»، أو كلمنا على واتساب على ${ORG.phoneDisplay}.` },
        { q: "أنا عايش برا مصر، أقدر أتبرع؟", a: "أيوه، بالكارت من أي بلد أو بتحويل بنكي دولي. الخطوات في صفحة «اتبرع لمصر من برا مصر»." },
      ]
    : [
        { q: "Is Al-Yusr a registered charity in Egypt?", a: "Yes. Al-Yusr Charity Foundation is registered under No. 2665 of 2019 with the Ministry of Social Solidarity, and is based in Mansoura, Dakahlia." },
        { q: "Can I donate from Cairo, Alexandria or any other governorate?", a: "Yes. You can give online from any governorate by card, wallet, InstaPay or bank transfer on the donate page." },
        { q: "Which payment methods can I use?", a: "Card (Visa and Mastercard) through the Kashier gateway, mobile wallets, InstaPay and bank transfer. If you transfer, send the receipt on WhatsApp so we can confirm your gift." },
        { q: "Is donating online safe?", a: "Card payments run on the Kashier gateway and the site never stores your card. Every donation gets a tracking number." },
        { q: "Where does my donation go?", a: scope },
        { q: "Can I pay my zakat online?", a: "Yes, on the zakat page, with any of the payment methods above." },
        { q: "How do I follow my donation?", a: `With your tracking number on «Track your donation», or message us on WhatsApp at ${ORG.phoneDisplay}.` },
        { q: "I live outside Egypt. Can I donate?", a: "Yes, by card from any country or by international bank transfer. The steps are on «Donate to Egypt from abroad»." },
      ];

  const title = ar ? "جمعية خيرية مشهرة في مصر | اتبرع أونلاين — مؤسسة اليسر" : "Registered Egyptian charity | Donate online — Al-Yusr";
  const description = ar
    ? "مؤسسة اليسر الخيرية مشهرة برقم 2665 لسنة 2019. اتبرع أونلاين من أي محافظة في مصر بالكارت أو المحفظة أو إنستاباي، وتابع تبرعك برقم تتبع."
    : "Al-Yusr Charity Foundation is registered under No. 2665 of 2019. Donate online from any governorate in Egypt by card, wallet or InstaPay, and follow your gift with a tracking number.";
  const keywords = ar
    ? "جمعيات خيرية في مصر, جمعية خيرية مشهرة, مؤسسة خيرية مصرية, التبرع اون لاين, التبرع لجمعية خيرية, تبرع بالفيزا, التبرع بالمحفظة, التبرع عن طريق انستاباي, زكاة المال اون لاين, التبرع للفقراء في مصر"
    : "charity in Egypt, registered Egyptian charity, donate online Egypt, Egyptian NGO, zakat Egypt online, donate to the poor in Egypt";

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE}${PATH}#webpage`,
    url: `${SITE}${PATH}`,
    name: title,
    description,
    inLanguage: ar ? "ar-EG" : "en",
    isPartOf: { "@id": `${SITE}/#website` },
    about: { "@id": `${SITE}/#org` },
    spatialCoverage: { "@type": "Country", name: ar ? "مصر" : "Egypt" },
  };

  return (
    <PageLayout>
      <SEOHelmet title={title} description={description} path={PATH} keywords={keywords} image={ar ? "/og-ar.jpg" : "/og-en.jpg"} />
      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: ar ? "الرئيسية" : "Home", url: `${SITE}/` },
          { name: ar ? "جمعية خيرية في مصر" : "Charity in Egypt", url: `${SITE}${PATH}` },
        ]}
      />
      <FAQSchema items={faq} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(pageLd)}</script>
      </Helmet>

      {/* Hero: registered, online from any governorate, and the four things people come for */}
      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95" />
        <div className="container relative z-10 mx-auto max-w-5xl px-4 pb-10 pt-10 text-center md:pb-14 md:pt-14">
          <div className="mb-3 flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: ar ? "الرئيسية" : "Home", href: "/" }, { name: ar ? "جمعية خيرية في مصر" : "Charity in Egypt" }]} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-secondary">
            <MapPin className="h-3.5 w-3.5" /> {ar ? "من أي محافظة في مصر" : "From any governorate in Egypt"}
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
            {ar ? <>جمعية خيرية مصرية مشهرة: <span className="text-secondary">اتبرع من أي محافظة</span></> : <>A registered Egyptian charity: <span className="text-secondary">give from anywhere in Egypt</span></>}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/90 md:text-base">
            {ar
              ? `مؤسسة اليسر الخيرية مؤسسة أهلية ${ORG.registrationAr}، ومقرها في المنصورة. تقدر تتبرع أونلاين من أي محافظة، وتبرعك بيوصل لأسر محتاجة في الدقهلية والمحافظات اللي مشاريعنا بتوصلها.`
              : "Al-Yusr Charity Foundation is an NGO registered under No. 2665 of 2019, based in Mansoura. You can give online from any governorate, and your gift reaches families in need in Dakahlia and the governorates our projects reach."}
          </p>

          <div className="mx-auto mt-7 grid max-w-4xl grid-cols-2 gap-2.5 text-start sm:gap-3 lg:grid-cols-4">
            {intents.filter((x) => hasCases || x.to !== "/cases").map(({ to, Icon, t, d, accent }) => (
              <Link key={t} to={to} className={`group flex h-full flex-col gap-2 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${accent ? "border-transparent bg-orange-grad text-accent-foreground shadow-cta" : "border-white/15 bg-white/10 text-primary-foreground backdrop-blur-md hover:bg-white/15"}`}>
                <Icon className={`h-6 w-6 ${accent ? "" : "text-secondary"}`} />
                <span className="text-[15px] font-black leading-snug sm:text-base">{t}</span>
                <span className={`text-[11.5px] font-bold leading-relaxed sm:text-xs ${accent ? "text-accent-foreground/90" : "text-primary-foreground/75"}`}>{d}</span>
              </Link>
            ))}
          </div>

          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2 text-[11.5px] font-black sm:text-xs">
            {(ar
              ? ["مشهرة برقم 2665 لسنة 2019", "دفع آمن عبر كاشير", "رقم تتبع لكل تبرع", "مقر تقدر تزوره في المنصورة"]
              : ["Registered No. 2665/2019", "Secure Kashier payments", "Tracking number per gift", "An office you can visit in Mansoura"]
            ).map((x) => (
              <li key={x} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How to give from any governorate */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "اتبرع إزاي من أي محافظة؟" : "How to give from anywhere in Egypt"}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            {ar ? "4 طرق، وكلها من صفحة التبرع. اختار المشروع والمبلغ، وبعدها طريقة الدفع." : "Four ways, all on the donate page: choose the cause and the amount, then how to pay."}
          </p>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {methods.map(({ Icon, t, d }) => (
              <li key={t}>
                <Link to="/donate" className="block h-full rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition hover:border-secondary">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span>
                  <span className="mt-3 block text-base font-black text-primary">{t}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">{d}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ProgramsGrid
        title={ar ? "مشاريع تقدر تتبرع لها من أي مكان" : "Causes you can give to from anywhere"}
        subtitle={ar ? "برامج دايمة بتتحدّث من لوحة التحكم، وتقدر تتابع أي واحد فيها." : "Ongoing programs updated from our dashboard; follow any of them."}
      />

      {/* Where the money goes, said plainly, and how to check it arrived */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-2 lg:items-stretch">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft md:p-8">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/15 text-primary"><MapPin className="h-5 w-5" /></span>
            <h2 className="mt-4 text-2xl font-black text-primary md:text-3xl">{ar ? "تبرعك بيوصل فين؟" : "Where does your gift go?"}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{scope}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/charity-mansoura" className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-border px-5 text-sm font-black text-primary hover:border-secondary">
                {ar ? "مقرنا في المنصورة" : "Our office in Mansoura"} <Arrow className="h-4 w-4" />
              </Link>
              <Link to="/trust" className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-border px-5 text-sm font-black text-primary hover:border-secondary">
                <BadgeCheck className="h-4 w-4" /> {ar ? "الشفافية" : "Transparency"}
              </Link>
            </div>
          </div>
          <StepsCard Icon={Receipt} title={ar ? "إزاي تتأكد إن تبرعك وصل" : "How to check your gift arrived"} steps={proofSteps} />
        </div>
      </section>

      <LinkedCasesSection
        filter={{}}
        limit={3}
        isRTL={ar}
        title={ar ? "حالات محتاجة دعم دلوقتي" : "Cases that need support now"}
        subtitle={ar ? "حالات اتراجعت ميدانيًا، وتقدر تشوف المطلوب والمتجمّع لكل واحدة." : "Field-reviewed cases with their goal and what has been raised."}
        className="bg-muted/30"
      />

      {/* Donors outside Egypt */}
      <section className="bg-background py-10 md:py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <Link to="/donate-from-abroad" className="flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition hover:border-secondary md:p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><Globe className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black text-primary">{ar ? "عايش برا مصر؟" : "Living outside Egypt?"}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{ar ? "اتبرع بالكارت من أي بلد، أو بتحويل بنكي دولي." : "Give by card from any country, or by international bank transfer."}</span>
            </span>
            <Arrow className="h-5 w-5 shrink-0 text-primary" />
          </Link>
        </div>
      </section>

      <FaqSection title={ar ? "أسئلة عن التبرع لجمعية خيرية في مصر" : "Questions about giving to a charity in Egypt"} items={faq} className="bg-muted/30">
        <Link to="/donate" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-grad px-7 font-black text-accent-foreground shadow-cta transition hover:-translate-y-0.5">
          <HandHeart className="h-5 w-5" /> {ar ? "اتبرع دلوقتي" : "Donate now"}
        </Link>
        <a href={whatsappLink(ar ? "السلام عليكم، عندي سؤال عن التبرع لمؤسسة اليسر." : "Hello, I have a question about donating to Al-Yusr.")} target="_blank" rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border px-7 font-black text-primary hover:border-secondary">
          <WhatsAppIcon className="h-5 w-5" /> {ar ? "اسألنا على واتساب" : "Ask us on WhatsApp"}
        </a>
      </FaqSection>
    </PageLayout>
  );
};

export default CharityEgypt;
