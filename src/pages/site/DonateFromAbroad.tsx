import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, Clock, CreditCard, Globe, HandHeart, Landmark, Mail, Phone, ShieldCheck } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, FAQSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { FaqSection, ProgramsGrid, StepsCard } from "@/components/common/SeoLandingParts";
import { useLang } from "@/i18n/LangContext";
import { ORG, whatsappLink, useOrg } from "@/data/orgInfo";

const PATH = "/donate-from-abroad";
const SITE = "https://elyusr.org";

/**
 * /donate-from-abroad — for Egyptians abroad and Arab donors («التبرع لمصر من الخارج»، «التبرع من السعودية
 * لمصر»…). Two ways that work today: a card online through Kashier (amounts in EGP, the donor's bank
 * converts), or an international bank transfer whose IBAN/SWIFT are sent on WhatsApp. One page for every
 * country, so there are no near-identical per-country pages.
 */
const DonateFromAbroad = () => {
  const { lang } = useLang();
  useOrg(); // re-render when the dashboard's organisation data arrives
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  const transferText = ar
    ? "السلام عليكم، أنا عايش برا مصر وعايز أتبرع لمؤسسة اليسر بتحويل بنكي دولي. ممكن بيانات الحساب (IBAN وSWIFT)؟"
    : "Hello, I live outside Egypt and would like to give to Al-Yusr by international bank transfer. Could you send the account details (IBAN and SWIFT)?";
  const transferHref = whatsappLink(transferText);

  const cardSteps = ar
    ? [
        { t: "اختار التبرع والمبلغ", d: "من صفحة التبرع. المبالغ على الموقع بالجنيه المصري." },
        { t: "ادفع بالكارت", d: "فيزا أو ماستركارد من أي بنك في أي بلد، على بوابة كاشير." },
        { t: "خد رقم التتبع", d: "تابع تبرعك من صفحة «تتبع تبرعك» من أي مكان، ومنها تنزّل الإيصال." },
      ]
    : [
        { t: "Choose the cause and the amount", d: "On the donate page. Amounts on the site are in Egyptian pounds." },
        { t: "Pay by card", d: "Visa or Mastercard from any bank in any country, through the Kashier gateway." },
        { t: "Keep your tracking number", d: "Follow your gift on «Track your donation» from anywhere, and download the receipt there." },
      ];

  const transferSteps = ar
    ? [
        { t: "ابعتلنا على واتساب", d: "قولنا عايز تتبرع لإيه وبكام." },
        { t: "نبعتلك بيانات الحساب", d: "IBAN وSWIFT واسم البنك." },
        { t: "ابعت الإيصال", d: "بعد التحويل ابعت صورة الإيصال، ونأكد تبرعك برقم تتبع." },
      ]
    : [
        { t: "Message us on WhatsApp", d: "Tell us what you would like to give to, and how much." },
        { t: "We send the account details", d: "IBAN, SWIFT and the bank's name." },
        { t: "Send the receipt", d: "After the transfer, send a photo of the receipt and we confirm your gift with a tracking number." },
      ];

  const faq = ar
    ? [
        { q: "أقدر أتبرع لمصر من السعودية أو الإمارات أو الكويت أو قطر أو عُمان؟", a: "أيوه، من أي بلد. بالكارت أونلاين (فيزا أو ماستركارد) من صفحة التبرع، أو بتحويل بنكي دولي بعد ما تطلب بيانات الحساب على واتساب." },
        { q: "المبلغ بيتحسب بأي عملة؟", a: "المبالغ على الموقع بالجنيه المصري. لما تدفع بالكارت، بنكك بيحوّل المبلغ لعملتك بسعر الصرف بتاعه." },
        { q: "فيه رسوم على التبرع من برا مصر؟", a: "الموقع مش بيزوّد أي رسوم على المبلغ اللي بتختاره، بس ممكن بنكك ياخد رسوم تحويل عملة أو رسوم تحويل دولي." },
        { q: "هل مؤسسة اليسر جمعية مشهرة؟", a: `أيوه. مؤسسة اليسر الخيرية ${ORG.registrationAr}، ومقرها في المنصورة بمحافظة الدقهلية.` },
        { q: "أقدر أطلّع زكاة مالي في مصر وأنا برا؟", a: "أيوه، من صفحة زكاة المال، بالكارت أونلاين أو بالتحويل البنكي الدولي." },
        { q: "أقدر أتبرع بصك أضحية في مصر وأنا برا؟", a: "أيوه، من صفحة الأضحية وقت الموسم، بالكارت أو بالتحويل الدولي." },
        { q: "إزاي أتأكد إن تبرعي وصل؟", a: "كل تبرع بياخد رقم تتبع تتابع بيه حالته من أي بلد. ولو حوّلت بنكيًا، بنأكد التبرع أول ما الإيصال يوصلنا." },
        { q: "بتردوا إمتى؟", a: `على واتساب والتليفون (${ORG.phoneDisplay}) من السبت للخميس، من 10 الصبح لـ 9 بالليل بتوقيت القاهرة، والجمعة إجازة.` },
      ]
    : [
        { q: "Can I donate to Egypt from Saudi Arabia, the UAE, Kuwait, Qatar or Oman?", a: "Yes, from any country: by card online (Visa or Mastercard) on the donate page, or by international bank transfer once you ask us for the account details on WhatsApp." },
        { q: "Which currency is my donation in?", a: "Amounts on the site are in Egyptian pounds. When you pay by card, your bank converts the amount into your currency at its own rate." },
        { q: "Are there fees for giving from abroad?", a: "The site adds no fee to the amount you choose, but your bank may charge a currency-conversion or international-transfer fee." },
        { q: "Is Al-Yusr a registered charity?", a: "Yes. Al-Yusr Charity Foundation is registered under No. 2665 of 2019 with the Ministry of Social Solidarity, and is based in Mansoura, Dakahlia." },
        { q: "Can I pay my zakat in Egypt from abroad?", a: "Yes, on the zakat page, by card online or by international bank transfer." },
        { q: "Can I give a qurbani in Egypt from abroad?", a: "Yes, on the qurbani page during the season, by card or international transfer." },
        { q: "How do I know my gift arrived?", a: "Every donation gets a tracking number you can check from any country. For bank transfers, we confirm the gift as soon as your receipt reaches us." },
        { q: "When do you reply?", a: `On WhatsApp and by phone (${ORG.phoneDisplay}), Saturday to Thursday, 10am to 9pm Cairo time; closed on Fridays.` },
      ];

  const title = ar ? "التبرع لمصر من الخارج | مؤسسة اليسر الخيرية" : "Donate to Egypt from abroad | Al-Yusr Charity Foundation";
  const description = ar
    ? "عايش برا مصر؟ اتبرع لمؤسسة اليسر الخيرية (مشهرة برقم 2665) بالكارت أونلاين من أي بلد أو بتحويل بنكي دولي، وتابع تبرعك برقم تتبع."
    : "Living outside Egypt? Give to Al-Yusr Charity Foundation (registered No. 2665) by card from any country or by international bank transfer, and follow your gift with a tracking number.";
  const keywords = ar
    ? "التبرع لمصر من الخارج, التبرع لجمعية خيرية في مصر من السعودية, التبرع من الكويت لمصر, التبرع من الامارات لمصر, التبرع من قطر لمصر, التبرع من عمان لمصر, زكاة المال للمصريين في الخارج, صك اضحية في مصر من الخارج, تبرع بالفيزا لمصر"
    : "donate to Egypt from abroad, Egyptian charity donation online, donate to a charity in Egypt from the UK, donate to Egypt from the USA, zakat Egypt online, qurbani Egypt from abroad";

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
          { name: ar ? "التبرع لمصر من الخارج" : "Donate to Egypt from abroad", url: `${SITE}${PATH}` },
        ]}
      />
      <FAQSchema items={faq} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(pageLd)}</script>
      </Helmet>

      {/* Hero: the two ways that work from any country */}
      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95" />
        <div className="container relative z-10 mx-auto max-w-4xl px-4 pb-10 pt-10 text-center md:pb-14 md:pt-14">
          <div className="mb-3 flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: ar ? "الرئيسية" : "Home", href: "/" }, { name: ar ? "التبرع لمصر من الخارج" : "Donate to Egypt from abroad" }]} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-secondary">
            <Globe className="h-3.5 w-3.5" /> {ar ? "من أي بلد في العالم" : "From any country"}
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
            {ar ? <>اتبرع لمصر <span className="text-secondary">من برا مصر</span></> : <>Donate to Egypt <span className="text-secondary">from abroad</span></>}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/90 md:text-base">
            {ar
              ? `للمصريين في الخليج وأوروبا وأمريكا وأي مكان، وللإخوة العرب: تبرعك بيوصل لأسر محتاجة في مصر عن طريق مؤسسة ${ORG.registrationAr.replace(/ — .*/, "")}، وتقدر تتابعه برقم تتبع.`
              : "For Egyptians in the Gulf, Europe, America and everywhere, and for Arab donors: your gift reaches families in need in Egypt through a foundation registered under No. 2665 of 2019, and you can follow it with a tracking number."}
          </p>

          <div className="mx-auto mt-7 grid max-w-3xl gap-3 text-start sm:grid-cols-2">
            <Link to="/donate" className="flex h-full items-start gap-3 rounded-2xl border border-transparent bg-orange-grad p-5 text-accent-foreground shadow-cta transition hover:-translate-y-0.5">
              <CreditCard className="mt-0.5 h-6 w-6 shrink-0" />
              <span>
                <span className="block text-base font-black sm:text-lg">{ar ? "بالكارت أونلاين" : "By card online"}</span>
                <span className="mt-1 block text-xs font-bold leading-relaxed text-accent-foreground/90 sm:text-sm">{ar ? "فيزا أو ماستركارد من أي بلد، على بوابة كاشير" : "Visa or Mastercard from any country, through Kashier"}</span>
              </span>
            </Link>
            <a href={transferHref} target="_blank" rel="noopener noreferrer" className="flex h-full items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 text-primary-foreground backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15">
              <Landmark className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
              <span>
                <span className="block text-base font-black sm:text-lg">{ar ? "تحويل بنكي دولي" : "International bank transfer"}</span>
                <span className="mt-1 block text-xs font-bold leading-relaxed text-primary-foreground/75 sm:text-sm">{ar ? "ابعتلنا على واتساب ونبعتلك IBAN وSWIFT" : "Message us on WhatsApp for the IBAN and SWIFT"}</span>
              </span>
            </a>
          </div>

          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2 text-[11.5px] font-black sm:text-xs">
            {(ar
              ? ["مشهرة برقم 2665 لسنة 2019", "رقم تتبع لكل تبرع", "دفع آمن عبر كاشير", "نرد على واتساب بتوقيت القاهرة"]
              : ["Registered No. 2665/2019", "Tracking number per gift", "Secure Kashier payments", "WhatsApp replies on Cairo time"]
            ).map((x) => (
              <li key={x} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The two ways, step by step */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "خطوات التبرع من برا مصر" : "How to give from abroad, step by step"}</h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            <StepsCard
              Icon={CreditCard}
              title={ar ? "بالكارت أونلاين" : "By card online"}
              steps={cardSteps}
              note={ar ? "بنكك بيحوّل المبلغ لعملتك بسعره، وممكن ياخد رسوم تحويل عملة." : "Your bank converts the amount at its own rate and may charge a currency-conversion fee."}
            >
              <Link to="/donate" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-grad px-5 text-sm font-black text-accent-foreground shadow-cta">
                <HandHeart className="h-4 w-4" /> {ar ? "اتبرع بالكارت" : "Give by card"}
              </Link>
            </StepsCard>
            <StepsCard
              Icon={Landmark}
              title={ar ? "تحويل بنكي دولي" : "International bank transfer"}
              steps={transferSteps}
              note={ar ? "التحويل الدولي ممكن ياخد كام يوم، وبنكك ممكن ياخد رسوم تحويل." : "International transfers can take a few days, and your bank may charge a transfer fee."}
            >
              <a href={transferHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-black text-white hover:opacity-95">
                <WhatsAppIcon className="h-4 w-4" /> {ar ? "اطلب بيانات الحساب" : "Ask for the account details"}
              </a>
            </StepsCard>
          </div>
        </div>
      </section>

      <ProgramsGrid
        title={ar ? "تبرعات تقدر تعملها من أي بلد" : "Causes you can give to from any country"}
        subtitle={ar ? "برامج دايمة بتتحدّث من لوحة التحكم. وللزكاة والأضحية ليهم صفحات خاصة." : "Ongoing programs updated from our dashboard. Zakat and qurbani have their own pages."}
      />

      {/* Zakat, qurbani and Egypt-wide links */}
      <section className="bg-background py-10 md:py-12">
        <div className="container mx-auto grid max-w-5xl gap-3 px-4 sm:grid-cols-3">
          {[
            { to: "/zakat", t: ar ? "زكاة المال" : "Zakat", d: ar ? "طلّع زكاتك في مصر وانت برا" : "Pay your zakat in Egypt from abroad" },
            { to: "/qurbani", t: ar ? "صك الأضحية" : "Qurbani", d: ar ? "في موسم الأضحية" : "During the qurbani season" },
            { to: "/charity-egypt", t: ar ? "المؤسسة في مصر" : "Our work in Egypt", d: ar ? "تبرعك بيوصل فين، وإزاي تتأكد" : "Where your gift goes, and how to check" },
          ].map(({ to, t, d }) => (
            <Link key={to} to={to} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition hover:border-secondary">
              <span className="min-w-0">
                <span className="block font-black text-primary">{t}</span>
                <span className="block text-xs font-bold text-muted-foreground">{d}</span>
              </span>
              <Arrow className="h-4 w-4 shrink-0 text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {/* Reaching us from another time zone */}
      <section className="bg-muted/30 py-12 md:py-14">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft md:p-8">
            <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "تتواصل معانا إزاي من برا" : "Reaching us from abroad"}</h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3 md:text-[15px]">
              {[
                { Icon: Phone, k: ar ? "واتساب وتليفون" : "WhatsApp & phone", v: ORG.phoneDisplay, ltr: true },
                { Icon: Clock, k: ar ? "بتوقيت القاهرة" : "Cairo time", v: ar ? ORG.hours.labelAr : ORG.hours.labelEn },
                { Icon: Mail, k: ar ? "الإيميل" : "Email", v: ORG.email, ltr: true },
              ].map(({ Icon, k, v, ltr }) => (
                <div key={k} className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <dt className="text-xs font-black text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 break-words font-bold leading-relaxed text-foreground" dir={ltr ? "ltr" : undefined}>{v}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={whatsappLink(ar ? "السلام عليكم، أنا عايش برا مصر وعندي سؤال عن التبرع." : "Hello, I live outside Egypt and have a question about donating.")} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 font-black text-white hover:opacity-95">
                <WhatsAppIcon className="h-4 w-4" /> {ar ? "واتساب" : "WhatsApp"}
              </a>
              <a href={`mailto:${ORG.email}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 font-black text-primary hover:border-secondary">
                <Mail className="h-4 w-4" /> {ar ? "ابعت إيميل" : "Send an email"}
              </a>
            </div>
          </div>
        </div>
      </section>

      <FaqSection title={ar ? "أسئلة عن التبرع لمصر من الخارج" : "Questions about giving to Egypt from abroad"} items={faq}>
        <Link to="/donate" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-grad px-7 font-black text-accent-foreground shadow-cta transition hover:-translate-y-0.5">
          <HandHeart className="h-5 w-5" /> {ar ? "اتبرع دلوقتي" : "Donate now"}
        </Link>
        <a href={transferHref} target="_blank" rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border px-7 font-black text-primary hover:border-secondary">
          <Landmark className="h-5 w-5" /> {ar ? "تحويل بنكي دولي" : "International transfer"}
        </a>
      </FaqSection>
    </PageLayout>
  );
};

export default DonateFromAbroad;
