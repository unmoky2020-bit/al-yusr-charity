import { useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, CalendarClock, Calculator, HandHeart, Minus, Plus, Receipt, ShieldCheck, Users } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, FAQSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { FaqSection, StepsCard } from "@/components/common/SeoLandingParts";
import { useLang } from "@/i18n/LangContext";
import { formatNumber } from "@/lib/donationDisplay";

const PATH = "/zakat-al-fitr";
const SITE = "https://elyusr.org";

/**
 * The amounts announced by Dar al-Ifta. When the 1448 AH amount is announced (just before Ramadan,
 * about February 2027), set `current` and every number on the page follows.
 */
const FITR = {
  coming: { hijri: "1448هـ", year: 2027 },
  current: null as null | { amount: number; date: string; url: string },
  last: {
    amount: 35,
    hijri: "1447هـ",
    year: 2026,
    dateAr: "18 فبراير 2026",
    dateEn: "18 February 2026",
    url: "https://www.dar-alifta.org/ar/Articles/Details/11042",
  },
};

/** /zakat-al-fitr — «زكاة الفطر 2027»: the amount, the time, who pays, a family calculator, and paying online. */
const ZakatAlFitr = () => {
  const { lang } = useLang();
  const ar = lang === "ar";
  const perPerson = FITR.current?.amount ?? FITR.last.amount;
  const [people, setPeople] = useState(4);
  const [amount, setAmount] = useState(perPerson);
  const total = Math.max(1, people) * Math.max(perPerson, amount || 0);
  const year = FITR.coming.year;

  const amountLine = FITR.current
    ? (ar ? `${FITR.current.amount} جنيهًا كحد أدنى عن الفرد` : `EGP ${FITR.current.amount} minimum per person`)
    : (ar ? `لم تُعلن بعد. قيمة ${FITR.last.year}: ${FITR.last.amount} جنيهًا كحد أدنى عن الفرد` : `Not announced yet. ${FITR.last.year}: EGP ${FITR.last.amount} minimum per person`);

  const facts = [
    { Icon: Banknote, t: ar ? `القيمة في ${year}` : `Amount in ${year}`, d: amountLine },
    { Icon: CalendarClock, t: ar ? "وقت الإخراج" : "When to pay", d: ar ? "من أول يوم في رمضان حتى قبيل صلاة عيد الفطر." : "From the first day of Ramadan until just before the Eid prayer." },
    { Icon: Users, t: ar ? "عن مَن تُخرج" : "On whose behalf", d: ar ? "عن نفسك وعن كل من تلزمك نفقته من أهل بيتك." : "For yourself and everyone you support at home." },
    { Icon: ShieldCheck, t: ar ? "نقدًا أم حبوبًا" : "Money or grain", d: ar ? "أجازت دار الإفتاء المصرية إخراجها نقدًا بدلًا من الحبوب." : "Dar al-Ifta permits paying it in money instead of grain." },
  ];

  const faq = ar
    ? [
        { q: `كم زكاة الفطر ${year}؟`, a: FITR.current ? `حددت دار الإفتاء المصرية زكاة الفطر لعام ${FITR.coming.hijri}/${year}م بمبلغ ${FITR.current.amount} جنيهًا كحد أدنى عن كل فرد.` : `تعلن دار الإفتاء المصرية قيمة زكاة الفطر لعام ${FITR.coming.hijri}/${year}م قبيل رمضان، وسنحدّث هذه الصفحة فور الإعلان. كانت قيمة عام ${FITR.last.hijri}/${FITR.last.year}م ${FITR.last.amount} جنيهًا كحد أدنى عن الفرد، ومن زاد فله الأجر.` },
        { q: "هل يجوز إخراج زكاة الفطر نقودًا؟", a: "نعم، أجازت دار الإفتاء المصرية إخراج زكاة الفطر بالقيمة نقودًا بدلًا من الحبوب، لأنها أنفع للفقير في قضاء حاجاته." },
        { q: "متى يبدأ وقت إخراج زكاة الفطر؟", a: "يجوز إخراجها من أول يوم في شهر رمضان حتى قبيل صلاة عيد الفطر، والأفضل ألا تؤخَّر إلى آخر وقتها حتى تصل إلى مستحقيها قبل العيد." },
        { q: "على من تجب زكاة الفطر؟", a: "تجب على كل مسلم يملك ما يزيد عن قوته وقوت من يعول يوم العيد وليلته، يخرجها عن نفسه وعن كل من تلزمه نفقتهم." },
        { q: "ما الفرق بين زكاة الفطر وزكاة المال؟", a: "زكاة الفطر مقدار ثابت عن كل فرد يُخرج في رمضان، أما زكاة المال فهي ٢٫٥٪ من المال إذا بلغ النصاب وحال عليه الحول، ولها حاسبة خاصة في صفحة زكاة المال." },
        { q: "هل أستطيع إخراج زكاة الفطر وأنا خارج مصر؟", a: "نعم، يمكنك الدفع بالكارت من أي بلد أو بتحويل بنكي دولي، والخطوات في صفحة التبرع من خارج مصر." },
      ]
    : [
        { q: `How much is Zakat al-Fitr in ${year}?`, a: FITR.current ? `Dar al-Ifta set Zakat al-Fitr for ${year} at a minimum of EGP ${FITR.current.amount} per person.` : `Dar al-Ifta announces the ${year} amount just before Ramadan; this page is updated as soon as it does. In ${FITR.last.year} it was a minimum of EGP ${FITR.last.amount} per person.` },
        { q: "Can Zakat al-Fitr be paid in money?", a: "Yes. Egypt's Dar al-Ifta permits paying its value in money instead of grain." },
        { q: "When can it be paid?", a: "From the first day of Ramadan until just before the Eid al-Fitr prayer." },
        { q: "Who must pay it?", a: "Every Muslim who has more than the needs of himself and his dependents for the day and night of Eid pays it for himself and those he supports." },
        { q: "How is it different from Zakat al-Mal?", a: "Zakat al-Fitr is a fixed amount per person paid in Ramadan; Zakat al-Mal is 2.5% of wealth that reaches the nisab and is held for a lunar year." },
        { q: "Can I pay it from outside Egypt?", a: "Yes, by card from any country or by international bank transfer." },
      ];

  const steps = ar
    ? [
        { t: "احسب زكاة أسرتك", d: "عدد الأفراد × القيمة عن الفرد، من الحاسبة بالأعلى." },
        { t: "ادفعها أونلاين بأمان", d: "بالكارت أو المحفظة أو إنستاباي، ويصلك إيصال ورقم تتبع." },
        { t: "تصل إلى مستحقيها", d: "تُصرف على أسر متعففة يتحقق منها فريقنا ميدانيًا." },
      ]
    : [
        { t: "Work out your family's amount", d: "People × amount per person, in the calculator above." },
        { t: "Pay online securely", d: "By card, wallet or InstaPay, with a receipt and tracking number." },
        { t: "It reaches those who need it", d: "Paid to families our team has verified in the field." },
      ];

  const title = ar ? `زكاة الفطر ${year}: القيمة ووقت الإخراج وحاسبة الأسرة | مؤسسة اليسر` : `Zakat al-Fitr ${year}: amount, timing and family calculator | Al-Yusr`;
  const description = ar
    ? `كم زكاة الفطر ${year}؟ قيمتها في ${FITR.last.year} كانت ${FITR.last.amount} جنيهًا للفرد حسب دار الإفتاء. احسب زكاة أسرتك واعرف وقت إخراجها ومن تجب عليه، وأخرجها أونلاين مع مؤسسة اليسر.`
    : `How much is Zakat al-Fitr in ${year}? In ${FITR.last.year} it was EGP ${FITR.last.amount} per person (Dar al-Ifta). Calculate your family's amount and pay it online with Al-Yusr.`;
  const keywords = ar
    ? `زكاة الفطر ${year}, مقدار زكاة الفطر ${year}, قيمة زكاة الفطر ${year}, زكاة الفطر كام, حساب زكاة الفطر, زكاة رمضان للفرد ${year}, موعد إخراج زكاة الفطر, زكاة الفطر نقدا`
    : `zakat al-fitr ${year}, zakat al-fitr amount Egypt, fitrana ${year}, pay zakat al-fitr online`;

  const crumbs = [{ name: ar ? "الرئيسية" : "Home", href: "/" }, { name: ar ? "زكاة المال" : "Zakat", href: "/zakat" }, { name: ar ? "زكاة الفطر" : "Zakat al-Fitr" }];

  return (
    <PageLayout>
      <SEOHelmet title={title} description={description} path={PATH} keywords={keywords} image={ar ? "/og-ar.jpg" : "/og-en.jpg"} />
      <SiteSchemas />
      <BreadcrumbSchema items={crumbs.map((c) => ({ name: c.name, url: `${SITE}${c.href ?? PATH}` }))} />
      <FAQSchema items={faq} />

      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95" />
        <div className="container relative z-10 mx-auto max-w-5xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <div className="mb-3 flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={crumbs} />
          </div>
          <h1 className="text-center text-3xl font-black leading-tight md:text-5xl">
            {ar ? <>زكاة الفطر {year}: <span className="text-secondary">قيمتها ووقت إخراجها</span></> : <>Zakat al-Fitr {year}: <span className="text-secondary">amount and timing</span></>}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-primary-foreground/90 md:text-base">
            {ar
              ? `حددت دار الإفتاء المصرية زكاة الفطر لعام ${FITR.last.hijri}/${FITR.last.year}م بمبلغ ${FITR.last.amount} جنيهًا كحد أدنى عن كل فرد. تُعلن قيمة ${FITR.coming.hijri}/${year}م قبيل رمضان، وسنحدّث هذه الصفحة فور إعلانها.`
              : `Dar al-Ifta set Zakat al-Fitr for ${FITR.last.year} at a minimum of EGP ${FITR.last.amount} per person. The ${year} amount is announced just before Ramadan; this page is updated as soon as it is.`}
          </p>

          {/* Family calculator */}
          <div id="calculator" className="mx-auto mt-8 max-w-xl rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md md:p-6">
            <div className="flex items-center gap-2 text-sm font-black text-secondary">
              <Calculator className="h-4 w-4" /> {ar ? "احسب زكاة الفطر لأسرتك" : "Your family's Zakat al-Fitr"}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-bold text-primary-foreground/80">{ar ? "عدد الأفراد" : "People"}</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <button type="button" aria-label={ar ? "أقل" : "Fewer"} onClick={() => setPeople((n) => Math.max(1, n - 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 hover:bg-white/25"><Minus className="h-4 w-4" /></button>
                  <span className="min-w-[3rem] text-center text-2xl font-black tabular-nums">{formatNumber(people, lang)}</span>
                  <button type="button" aria-label={ar ? "أكثر" : "More"} onClick={() => setPeople((n) => Math.min(30, n + 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 hover:bg-white/25"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
              <label className="block">
                <span className="text-xs font-bold text-primary-foreground/80">{ar ? "عن الفرد (جنيه)" : "Per person (EGP)"}</span>
                <input
                  type="number" inputMode="numeric" min={perPerson} value={amount} dir="ltr"
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-lg font-black text-primary-foreground outline-none focus:border-secondary"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/40 px-4 py-3">
              <div>
                <div className="text-xs font-bold text-primary-foreground/75">{ar ? "زكاة أسرتك" : "Your family's total"}</div>
                <div className="text-3xl font-black tabular-nums text-secondary">{formatNumber(total, lang)} <span className="text-base">{ar ? "ج.م" : "EGP"}</span></div>
              </div>
              <Link to={`/donate?program=zakat&amount=${total}`} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-orange-grad px-6 font-black text-accent-foreground shadow-cta transition hover:-translate-y-0.5">
                <HandHeart className="h-5 w-5" /> {ar ? "أخرجها الآن" : "Pay it now"}
              </Link>
            </div>
            <p className="mt-3 text-xs text-primary-foreground/70">
              {ar ? "الحد الأدنى حسب آخر إعلان لدار الإفتاء، ومن زاد فله الأجر." : "The minimum follows Dar al-Ifta's latest announcement; giving more is rewarded."}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "زكاة الفطر في أربع نقاط" : "Zakat al-Fitr at a glance"}</h2>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(({ Icon, t, d }) => (
              <li key={t} className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-3 text-base font-black text-primary">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted-foreground">
            {ar ? "المصدر: " : "Source: "}
            <a href={FITR.last.url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline-offset-4 hover:underline">
              {ar ? `دار الإفتاء المصرية، ${FITR.last.dateAr}` : `Egypt's Dar al-Ifta, ${FITR.last.dateEn}`}
            </a>
          </p>
        </div>
      </section>

      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-2 lg:items-stretch">
          <StepsCard Icon={Receipt} title={ar ? "أخرجها مع مؤسسة اليسر" : "Pay it with Al-Yusr"} steps={steps} />
          <div className="flex flex-col justify-center rounded-3xl border border-border/70 bg-card p-6 shadow-soft md:p-8">
            <h2 className="text-xl font-black text-primary md:text-2xl">{ar ? "وزكاة المال؟" : "And Zakat al-Mal?"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              {ar ? "زكاة المال ٢٫٥٪ من مالك إذا بلغ النصاب وحال عليه الحول. احسبها بسعر الذهب اليوم من حاسبة زكاة المال." : "Zakat al-Mal is 2.5% of wealth above the nisab held for a lunar year. Work it out with today's gold price."}
            </p>
            <Link to="/zakat#calculator" className="mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-border px-5 font-black text-primary hover:border-secondary">
              <Calculator className="h-4 w-4" /> {ar ? "حساب زكاة المال" : "Zakat calculator"}
            </Link>
          </div>
        </div>
      </section>

      <FaqSection title={ar ? `أسئلة عن زكاة الفطر ${year}` : `Questions about Zakat al-Fitr ${year}`} items={faq}>
        <Link to={`/donate?program=zakat&amount=${total}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-grad px-7 font-black text-accent-foreground shadow-cta transition hover:-translate-y-0.5">
          <HandHeart className="h-5 w-5" /> {ar ? "أخرج زكاة الفطر" : "Pay Zakat al-Fitr"}
        </Link>
        <Link to="/donate-from-abroad" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border px-7 font-black text-primary hover:border-secondary">
          {ar ? "من خارج مصر" : "From abroad"}
        </Link>
      </FaqSection>
    </PageLayout>
  );
};

export default ZakatAlFitr;
