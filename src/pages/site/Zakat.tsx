import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchFaqs, type FaqItem } from "@/data/faqsApi";
import { Calculator, Coins, Wheat, Sprout, Banknote, Heart, ShieldCheck, BookOpen, ArrowLeft, ArrowRight, Sparkles, RefreshCw, Wifi, WifiOff, Users, Droplets, Home as HomeIcon, Stethoscope, GraduationCap, Tractor, MapPin, Eye, HandHeart } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { BreadcrumbSchema, SiteSchemas } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { FieldGalleryScroll } from "@/components/sections/FieldGalleryScroll";
import { StickyStack, StickyStackItem } from "@/components/ui/sticky-stack";
import { Check } from "lucide-react";
import imgFood from "@/assets/axis-food.jpg";
import imgHealth from "@/assets/axis-health.jpg";
import imgEdu from "@/assets/axis-education.jpg";
import { bankAccountLabel, useBankAccounts } from "@/data/paymentOptions";

/** Approximate gold price per gram in EGP — used only as a default for the nisab calculator.
 * Users can override the value before calculating. */
const DEFAULT_GOLD_PRICE = 4800;
const NISAB_GOLD_GRAMS = 85;
const ZAKAT_RATE = 0.025;
const OZ_TO_G = 31.1035;
const KARAT_FACTOR: Record<string, number> = { "24": 1, "21": 0.875, "18": 0.75 };
const FITR_PER_PERSON_DEFAULT = 50; // EGP — common Egyptian darul-iftaa minimum

const Zakat = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const bankAccounts = useBankAccounts();
  const bankText = bankAccounts[0] ? bankAccountLabel(bankAccounts[0]) : "";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const base = "https://elyusr.org";

  // Live gold price state
  const [karat, setKarat] = useState<"24" | "21" | "18">("21");
  const [gold, setGold] = useState(DEFAULT_GOLD_PRICE);
  const [liveStatus, setLiveStatus] = useState<"idle" | "loading" | "live" | "error">("idle");
  const [liveAt, setLiveAt] = useState<Date | null>(null);
  const [livePerGram24k, setLivePerGram24k] = useState<number | null>(null);

  // Advanced wealth fields
  const [cash, setCash] = useState(50000);
  const [savings, setSavings] = useState(30000);
  const [goldValue, setGoldValue] = useState(0);
  const [stock, setStock] = useState(0);
  const [receivables, setReceivables] = useState(0);
  const [debts, setDebts] = useState(0);
  // Zakat al-Fitr
  const [persons, setPersons] = useState(4);
  const [fitrPerPerson, setFitrPerPerson] = useState(FITR_PER_PERSON_DEFAULT);

  const { data: dynamicZakatFaqs } = useQuery<FaqItem[]>({
    queryKey: ["faqs-zakat"],
    queryFn: () => fetchFaqs({ categorySlug: "zakat" }),
    staleTime: 60_000,
  });

  const zakatFaqs = useMemo(() => {
    if (dynamicZakatFaqs && dynamicZakatFaqs.length > 0) {
      return dynamicZakatFaqs.map((f) => ({
        q: isRTL ? f.question_ar : (f.question_en || f.question_ar),
        a: isRTL ? f.answer_ar : (f.answer_en || f.answer_ar),
      }));
    }
    return isRTL ? [
      { q: "هل سعر الذهب في الحاسبة لحظي؟", a: "نعم، نسحب سعر الأونصة العالمي وسعر الدولار مقابل الجنيه آنيًا، ونحتسب الجرام عيار 24/21/18 تلقائيًا. تقدر تحدّثه يدويًا أيضًا." },
      { q: "ما الفرق بين زكاة المال وزكاة الفطر؟", a: "زكاة المال 2.5% من صافي مالك إذا بلغ النصاب وحال عليه الحول. زكاة الفطر صاع من غالب القوت أو قيمته النقدية عن كل فرد قبل صلاة العيد." },
      { q: "هل تُخصم الديون من وعاء الزكاة؟", a: "نعم، الديون المستحقة عليك حاليًا تُخصم. أما الأقساط طويلة المدى فيُخصم منها قسط السنة." },
      { q: "هل اليسر تستحق الزكاة؟", a: "نوجّه زكاتك مباشرة لمصارفها الشرعية الثمانية: الفقراء، المساكين، الغارمين، وفي الرقاب… عبر حالات موثّقة بأبحاث ميدانية." },
      { q: "كيف أتأكد أن زكاتي وصلت؟", a: "تصلك تقارير صور وفيديو، ويمكنك زيارة الأسرة بنفسك أو طلب تقرير الأثر من فريق الشفافية." },
    ] : [
      { q: "Is the gold price in the calculator live?", a: "Yes — we fetch the global ounce price and USD/EGP rate in real time and compute 24/21/18K gram prices automatically. Manual override is supported." },
      { q: "Difference between Zakat al-mal and Zakat al-Fitr?", a: "Zakat al-mal is 2.5% of net wealth above nisab held for a lunar year. Zakat al-Fitr is a per-person grain (or cash equivalent) due before Eid prayer." },
      { q: "Are debts deducted from Zakatable wealth?", a: "Yes — debts currently due are deducted. For long-term installments, only the year's portion is deducted." },
      { q: "Is Al-Yusr Zakat-eligible?", a: "We channel Zakat directly to its 8 Quranic categories — verified through field assessments." },
      { q: "How do I confirm my Zakat was delivered?", a: "You receive photo and video reports, can visit the family in person, or request an impact report from our transparency team." },
    ];
  }, [dynamicZakatFaqs, isRTL]);

  const fetchLiveGold = async () => {
    setLiveStatus("loading");
    try {
      const [goldRes, fxRes] = await Promise.all([
        fetch("https://api.gold-api.com/price/XAU"),
        fetch("https://open.er-api.com/v6/latest/USD"),
      ]);
      if (!goldRes.ok || !fxRes.ok) throw new Error("net");
      const goldJson = await goldRes.json();
      const fxJson = await fxRes.json();
      const usdPerOz = Number(goldJson?.price);
      const usdEgp = Number(fxJson?.rates?.EGP);
      if (!usdPerOz || !usdEgp) throw new Error("data");
      const perGram24k = (usdPerOz / OZ_TO_G) * usdEgp;
      setLivePerGram24k(perGram24k);
      setLiveAt(new Date());
      setLiveStatus("live");
    } catch {
      setLiveStatus("error");
    }
  };

  useEffect(() => { fetchLiveGold(); }, []);

  // Apply live price when available, scaled to chosen karat
  useEffect(() => {
    if (livePerGram24k != null) {
      setGold(Math.round(livePerGram24k * KARAT_FACTOR[karat]));
    }
  }, [livePerGram24k, karat]);

  const wealth = useMemo(
    () => Math.max(0, cash + savings + goldValue + stock + receivables - debts),
    [cash, savings, goldValue, stock, receivables, debts]
  );

  const { nisab, due, eligible } = useMemo(() => {
    // Nisab is always anchored to 24K equivalent regardless of selected display karat
    const baseGram24k = livePerGram24k ?? gold / KARAT_FACTOR[karat];
    const n = Math.round(baseGram24k * NISAB_GOLD_GRAMS);
    const e = wealth >= n;
    return { nisab: n, due: e ? Math.round(wealth * ZAKAT_RATE) : 0, eligible: e };
  }, [gold, karat, wealth, livePerGram24k]);

  const fitrTotal = Math.max(0, persons) * Math.max(0, fitrPerPerson);

  const types = isRTL
    ? [
        { icon: Coins,   t: "زكاة المال",          d: "ربع العشر (2.5%) على المال إذا بلغ النصاب وحال عليه الحول." },
        { icon: Banknote,t: "زكاة عروض التجارة",   d: "تُقوَّم البضاعة بسعر السوق يوم وجوب الزكاة وتُضاف للنقد." },
        { icon: Wheat,   t: "زكاة الزروع والثمار", d: "العُشر فيما سُقي بلا كلفة، ونصف العُشر فيما سُقي بكلفة." },
        { icon: Sprout,  t: "زكاة الفطر",          d: "صاع من غالب قوت البلد عن كل فرد قبل صلاة العيد." },
        { icon: ShieldCheck, t: "النذور والكفارات", d: "تُخرج عن الأيمان والكفارات حسب نوعها وسبب وجوبها." },
        { icon: Heart,   t: "صدقة جارية",          d: "أعمال يستمر أجرها بعد المتصدق: مياه، تعليم، علاج…" },
      ]
    : [
        { icon: Coins,   t: "Wealth Zakat",       d: "2.5% on cash & savings once nisab is reached and a lunar year passes." },
        { icon: Banknote,t: "Business Zakat",     d: "Stock valued at market price plus liquid assets, then 2.5%." },
        { icon: Wheat,   t: "Crops & Fruits",     d: "10% on rain-fed crops, 5% on irrigated crops at harvest." },
        { icon: Sprout,  t: "Zakat al-Fitr",      d: "One ṣāʿ of staple food per person before Eid prayer." },
        { icon: ShieldCheck, t: "Vows & Expiations", d: "Pledges and expiations paid per the ruling type." },
        { icon: Heart,   t: "Sadaqah Jariyah",    d: "Ongoing charity: water, education, treatment…" },
      ];

  const channels = isRTL
    ? [
        { t: "كفالة الأسر الفقيرة",       d: "كفالة شهرية تسدّ احتياج الأسرة الأساسي.", to: "/cases?cat=monthly-sponsorship" },
        { t: "سداد ديون الغارمين",        d: "تفريج كرب وستر للأسر التي أرهقها الدَّين.", to: "/cases?cat=debt" },
        { t: "العلاج الدوائي والعمليات",  d: "حالات علاج وأطراف صناعية وأجهزة طبية.",   to: "/cases?cat=medication" },
        { t: "مشاريع صغيرة للأسر",        d: "نحوّل الأسرة من فقيرة إلى منتجة.",         to: "/cases?cat=small-projects" },
      ]
    : [
        { t: "Family sponsorship",     d: "Monthly support that covers a family's essentials.", to: "/cases?cat=monthly-sponsorship" },
        { t: "Debt relief",            d: "Lift the burden of debt off struggling families.",   to: "/cases?cat=debt" },
        { t: "Medical treatment",      d: "Medication, surgery, prosthetics & devices.",       to: "/cases?cat=medication" },
        { t: "Small income projects",  d: "Turn a poor family into a productive one.",         to: "/cases?cat=small-projects" },
    ];

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "حاسبة الزكاة 2026 بسعر الذهب اليوم | مؤسسة اليسر" : "Zakat Calculator 2026 — Live Gold Price (Dakahlia) | Al-Yusr"}
        description={isRTL ? "احسب زكاتك أونلاين بسعر الذهب الحي في مصر اليوم (24/21/18 قيراط)، زكاة المال والتجارة والفطر، واصرفها في أبواب موثّقة بالدقهلية والمنصورة: كفالة يتيم، علاج، سداد ديون الغارمين، ومشاريع صغيرة عبر مؤسسة اليسر." : "Calculate Zakat online with Egypt's live gold price (24/21/18K), wealth, business and Zakat al-Fitr, then channel it through verified causes in Dakahlia & Mansoura via Al-Yusr."}
        path="/zakat"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "الزكاة" : "Zakat", url: `${base}/zakat` },
      ]} />

      {/* Hero */}
      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <div className="flex justify-center text-primary-foreground/85"><Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "الزكاة" : "Zakat" }]} /></div>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> {isRTL ? "مشهرة 2665/2019 — شفافية 99%" : "Licensed 2665/2019"}
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight text-shadow-soft md:text-5xl">
            {isRTL ? "حاسبة الزكاة 2026 بالدقهلية — زكاتُك بركة مالِك" : "Zakat Calculator 2026 (Dakahlia) — your Zakat, your wealth's blessing"}
          </h1>
          <p className="mt-3 mx-auto max-w-2xl text-primary-foreground/90 md:text-lg">
            {isRTL ? "احسب زكاتك بسعر الذهب اليوم في مصر، واصرفها في أبواب موثّقة بالمنصورة وميت غمر وطلخا: كفالة يتيم، علاج، سداد ديون الغارمين، ومشاريع صغيرة تُحيي الأسر." : "Calculate Zakat with Egypt's live gold price and channel it to verified causes in Mansoura, Mit Ghamr & Talkha — orphan sponsorship, treatment, debt relief, micro-projects."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <a href="#calculator"><Calculator className="h-5 w-5" />{isRTL ? "احسب زكاتك الآن" : "Calculate now"}</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <a href="#channels">{isRTL ? "أبواب صرف الزكاة" : "Where to give"} <Arrow className="h-4 w-4" /></a>
            </Button>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="pattern-programs py-12 pb-32 md:py-16 md:pb-16">
        <div className="container mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-primary">{isRTL ? "حاسبة زكاة المال (متقدّمة)" : "Advanced Zakat calculator"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isRTL ? "بسعر الذهب اللحظي اليوم في مصر. أدخل أصولك وخصم الديون لحساب صافي الزكاة." : "Live gold price for Egypt. Enter assets and deduct debts to compute your net Zakat."}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchLiveGold}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold transition ${liveStatus === "live" ? "border-secondary/40 bg-secondary/15 text-primary" : liveStatus === "error" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-muted text-muted-foreground"}`}
                aria-label={isRTL ? "تحديث سعر الذهب" : "Refresh gold price"}
              >
                {liveStatus === "live" ? <Wifi className="h-3.5 w-3.5" /> : liveStatus === "error" ? <WifiOff className="h-3.5 w-3.5" /> : <RefreshCw className={`h-3.5 w-3.5 ${liveStatus === "loading" ? "animate-spin" : ""}`} />}
                {liveStatus === "live"
                  ? (isRTL ? `سعر حي · ${liveAt?.toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}` : `Live · ${liveAt?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`)
                  : liveStatus === "error" ? (isRTL ? "تعذّر التحديث" : "Offline") : (isRTL ? "تحديث" : "Refresh")}
              </button>
            </div>

            {/* Karat selector */}
            <div className="mt-4 inline-flex rounded-xl bg-muted p-1">
              {(["24","21","18"] as const).map(k => (
                <button key={k} type="button" onClick={() => setKarat(k)}
                  className={`rounded-lg px-3 py-1 text-xs font-extrabold transition ${karat === k ? "bg-background text-primary shadow" : "text-muted-foreground"}`}>
                  {isRTL ? `${k} قيراط` : `${k}K`}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? `سعر الجرام (${karat} قيراط) ج.م` : `Gram price (${karat}K) EGP`}</label>
                <Input type="number" min={0} value={gold} onChange={(e) => setGold(Math.max(0, Number(e.target.value)))} />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {isRTL ? `النصاب = 85 جم ذهب 24 قيراط ≈ ${nisab.toLocaleString()} ج.م` : `Nisab = 85g of 24K gold ≈ ${nisab.toLocaleString()} EGP`}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? "نقد في اليد / حسابات بنكية" : "Cash on hand / bank"}</label>
                <Input type="number" min={0} value={cash} onChange={(e) => setCash(Math.max(0, Number(e.target.value)))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? "ودائع وشهادات وادخار" : "Savings, deposits, certificates"}</label>
                <Input type="number" min={0} value={savings} onChange={(e) => setSavings(Math.max(0, Number(e.target.value)))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? "قيمة الذهب والفضة" : "Gold & silver value"}</label>
                <Input type="number" min={0} value={goldValue} onChange={(e) => setGoldValue(Math.max(0, Number(e.target.value)))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? "بضاعة عروض التجارة (سعر السوق)" : "Business stock (market value)"}</label>
                <Input type="number" min={0} value={stock} onChange={(e) => setStock(Math.max(0, Number(e.target.value)))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? "ديون لك على الآخرين (مرجوّة السداد)" : "Receivables (likely repaid)"}</label>
                <Input type="number" min={0} value={receivables} onChange={(e) => setReceivables(Math.max(0, Number(e.target.value)))} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-muted-foreground">{isRTL ? "ديون عليك مستحقة الآن (تُخصم)" : "Debts due now (deducted)"}</label>
                <Input type="number" min={0} value={debts} onChange={(e) => setDebts(Math.max(0, Number(e.target.value)))} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-muted/50 p-4">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">{isRTL ? "صافي المال" : "Net wealth"}</div>
                <div className="mt-1 text-base font-black text-primary" dir="ltr">{wealth.toLocaleString()} EGP</div>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">{isRTL ? "النصاب" : "Nisab"}</div>
                <div className="mt-1 text-base font-black text-primary" dir="ltr">{nisab.toLocaleString()} EGP</div>
              </div>
              <div className={`rounded-2xl p-4 ${eligible ? "bg-secondary/20" : "bg-muted/50"}`}>
                <div className="text-[11px] font-bold uppercase text-muted-foreground">{isRTL ? "زكاتك" : "Your Zakat"}</div>
                <div className="mt-1 text-base font-black text-primary" dir="ltr">{due.toLocaleString()} EGP</div>
              </div>
            </div>
            {!eligible && (
              <p className="mt-3 text-xs text-muted-foreground">
                {isRTL ? "مالك أقل من النصاب حاليًا — لا تجب الزكاة، لكن صدقة التطوع باب عظيم." : "Your wealth is below nisab — Zakat is not due, but voluntary sadaqah is always rewarded."}
              </p>
            )}
            <Button asChild disabled={!eligible} className="mt-5 h-12 w-full bg-orange-grad text-base font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
              <Link to={`/donate?intent=zakat&amount=${due}`} data-source="zakat" data-label="zakat-donate">
                <Heart className="h-5 w-5" />{isRTL ? `أخرج زكاتك (${due.toLocaleString()} ج.م)` : `Pay your Zakat (${due.toLocaleString()} EGP)`}
              </Link>
            </Button>
          </div>

          {/* Quick rules */}
          <aside className="rounded-3xl border border-border bg-gradient-to-br from-secondary/10 to-accent/5 p-6 shadow-soft">
            <h3 className="text-lg font-black text-primary"><BookOpen className="me-1 inline h-5 w-5" /> {isRTL ? "قواعد مختصرة" : "Quick rules"}</h3>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed">
              {(isRTL ? [
                "النصاب: 85 جم ذهب أو ما يعادله نقدًا.",
                "النسبة: 2.5% (ربع العُشر).",
                "الحَول: مرور سنة هجرية على بلوغ النصاب.",
                "الديون المستحقة عليك تُخصم من وعاء الزكاة.",
                "تُصرف لأهلها الثمانية المذكورين في القرآن.",
              ] : [
                "Nisab: equivalent of 85 grams of gold.",
                "Rate: 2.5% (quarter of a tenth).",
                "Hawl: one full lunar year at or above nisab.",
                "Outstanding personal debts are deducted.",
                "Disbursed to the 8 categories mentioned in the Qur'an.",
              ]).map((line, i) => (
                <li key={i} className="flex gap-2"><span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />{line}</li>
              ))}
            </ul>

            {/* Zakat al-Fitr mini calculator */}
            <div className="mt-6 rounded-2xl border border-border bg-card p-4">
              <h4 className="flex items-center gap-2 text-base font-black text-primary"><Sprout className="h-4 w-4 text-secondary" /> {isRTL ? "زكاة الفطر" : "Zakat al-Fitr"}</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {isRTL ? "صاع من غالب قوت البلد لكل فرد — وقيمتها النقدية حسب فتوى دار الإفتاء المصرية." : "One ṣāʿ of staple food per person — cash equivalent per Egypt's Dar al-Iftaa."}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">{isRTL ? "عدد الأفراد" : "Persons"}</label>
                  <Input type="number" min={0} value={persons} onChange={(e) => setPersons(Math.max(0, Number(e.target.value)))} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">{isRTL ? "قيمة/فرد (ج.م)" : "Per person (EGP)"}</label>
                  <Input type="number" min={0} value={fitrPerPerson} onChange={(e) => setFitrPerPerson(Math.max(0, Number(e.target.value)))} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/15 px-3 py-2">
                <span className="text-xs font-bold text-primary">{isRTL ? "الإجمالي" : "Total"}</span>
                <span className="text-base font-black text-primary" dir="ltr">{fitrTotal.toLocaleString()} EGP</span>
              </div>
              <Button asChild disabled={fitrTotal <= 0} className="mt-3 h-10 w-full bg-secondary text-secondary-foreground hover:opacity-95">
                <Link to={`/donate?intent=fitr&amount=${fitrTotal}`} data-source="zakat" data-label="fitr-donate">
                  <Heart className="h-4 w-4" />{isRTL ? "أخرج زكاة الفطر" : "Pay Zakat al-Fitr"}
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </section>

      {/* Types */}
      <section className="pattern-axes py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isRTL ? "أنواع الزكاة والصدقات" : "Types of Zakat & sadaqah"}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">{isRTL ? "اختر النوع الذي يناسبك واصرفه عبر اليسر بأمانة." : "Pick the type that fits you and entrust it to Al-Yusr."}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((x) => {
              const Icon = x.icon;
              return (
                <article key={x.t} className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/15 text-secondary"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-3 text-base font-black text-primary">{x.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Channels */}
      <section id="channels" className="pattern-campaigns py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isRTL ? "أبواب صرف زكاتك" : "Where your Zakat goes"}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((x) => (
              <Link key={x.t} to={x.to} className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                <h3 className="text-base font-black text-primary group-hover:text-secondary">{x.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-secondary">
                  {isRTL ? "تصفح الحالات" : "Browse cases"} <Arrow className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 grid gap-3 rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-secondary/5 p-6 text-center sm:grid-cols-3">
            {[
              { k: "70+", v: isRTL ? "خدمة مفهرسة" : "Indexed services" },
              { k: "11",  v: isRTL ? "برنامج رئيسي" : "Core programs" },
              { k: "99%", v: isRTL ? "شفافية صرف" : "Transparency" },
            ].map(s => (
              <div key={s.k}><div className="text-3xl font-black text-primary">{s.k}</div><div className="text-xs font-bold text-muted-foreground">{s.v}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars: Food / Health / Education — matches "محاور عملنا" cards */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <header className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {isRTL ? "محاور الصرف" : "Disbursement pillars"}
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-primary sm:text-4xl md:text-5xl">
              {isRTL ? "محاور صرف زكاتك في اليسر" : "Where your Zakat is invested"}
            </h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {isRTL
                ? "نحن لا نمنح إعانة، بل نصنع حياة. زكاتك تتحوّل إلى غذاء يحفظ الكرامة، علاج يعيد الأمل، وتعليم يكسر دائرة الفقر."
                : "We don't hand out aid — we rebuild lives. Your Zakat becomes food, healthcare and education that break the cycle of poverty."}
            </p>
          </header>
          <StickyStack className="mt-10">
            {[
              { img: imgFood, number: "01", donateSlug: "box", href: "/axes/food",
                tag: isRTL ? "محور الإطعام" : "Food pillar", title: isRTL ? "الغذاء" : "Food",
                desc: isRTL ? "أمان غذائي لكل أسرة مستحقة عبر مزارعنا الوقفية ومطابخ اليسر الدائمة." : "Food security via endowment farms & permanent Al-Yusr kitchens.",
                bullets: isRTL ? ["كرتونة الغذاء الشهرية + كيلو لحمة بلدي", "مطبخ يومي بآلاف الوجبات الساخنة", "أكثر من 5 طن لحوم سنويًا"] : ["Monthly box + 1kg farm meat", "Daily kitchen, thousands of hot meals", "5+ tons of meat per year"],
                accent: "bg-secondary text-secondary-foreground" },
              { img: imgHealth, number: "02", donateSlug: "treatment", href: "/axes/health",
                tag: isRTL ? "محور الصحة" : "Health pillar", title: isRTL ? "الصحة" : "Healthcare",
                desc: isRTL ? "بناء إنسان منتج ومستقر عبر القوافل والمجمعات الطبية ومركز الغسيل الكلوي." : "Caravans, clinics & a dialysis center.",
                bullets: isRTL ? ["عمليات وعلاج للحالات العاجلة", "قوافل علاجية في القرى النائية", "أطراف صناعية وكراسي ذوي الهمم"] : ["Surgeries & urgent treatment", "Caravans in remote villages", "Prosthetics & wheelchairs"],
                accent: "bg-accent text-accent-foreground" },
              { img: imgEdu, number: "03", donateSlug: "education", href: "/axes/education",
                tag: isRTL ? "محور التعليم" : "Education pillar", title: isRTL ? "التعليم" : "Education",
                desc: isRTL ? "محاربة الفقر الأول بالعلم وتأمين مستقبل الأجيال داخل مجمّعنا التعليمي." : "Fighting poverty with knowledge inside our educational complex.",
                bullets: isRTL ? ["كفالة تعليمية لـ 354 طالبًا", "دروس ومتابعة داخل المجمّع", "حقائب وأدوات لكل عام دراسي"] : ["Sponsorship for 354 students", "Tutoring inside our complex", "Backpacks & tools each year"],
                accent: "bg-primary text-primary-foreground" },
            ].map((p, idx) => (
              <StickyStackItem key={p.title} index={idx}>
                <div
                  style={{ isolation: "isolate" }}
                  className={`group relative isolate mx-auto flex w-full max-w-5xl scroll-mt-24 flex-col overflow-hidden rounded-[28px] border border-primary/10 bg-gradient-to-b from-card to-card/95 shadow-card ring-1 ring-primary/5 transition-colors duration-300 hover:border-secondary/50 md:items-stretch ${idx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
                >
                  <div className="relative m-2.5 aspect-[4/5] overflow-hidden rounded-[20px] bg-gradient-to-br from-primary/5 to-secondary/10 sm:aspect-[4/3] md:m-3 md:aspect-auto md:w-1/2 md:shrink-0 md:self-stretch">
                    <img src={p.img} alt={p.title} loading="lazy" className="absolute inset-0 h-full w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.04] md:object-cover" />
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    <span className={`absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold shadow-cta ring-2 ring-card ${p.accent}`}>{p.tag}</span>
                    <span aria-hidden className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-secondary text-[14px] font-black text-secondary-foreground shadow-cta ring-2 ring-card">{p.number}</span>
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-1 md:w-1/2 md:justify-center md:px-6 md:py-6">
                    <h3 className="text-2xl font-black leading-tight text-primary md:text-[28px]">{p.title}</h3>
                    <p className="mt-2 text-[13px] font-semibold leading-7 text-muted-foreground">{p.desc}</p>
                    <ul className="mt-3.5 space-y-2">
                      {p.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-[12.5px] font-semibold text-foreground/85">
                          <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-secondary/20 text-primary"><Check className="h-2.5 w-2.5" strokeWidth={3.5} /></span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                      {/* z-10 keeps this button above the stretched "Learn more" overlay so it stays independently clickable */}
                      <Link
                        to={`/donate?program=${p.donateSlug}`}
                        className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-orange-grad px-4 py-2 text-[12.5px] font-extrabold text-accent-foreground shadow-cta transition hover:-translate-y-0.5 hover:opacity-95"
                      >
                        <Heart className="h-3.5 w-3.5" />
                        {isRTL ? "تبرع بزكاتك" : "Donate Zakat"}
                      </Link>
                      {/* Stretched link: the ::after overlay makes the whole card navigate to the axis page without nesting <a> inside <a> */}
                      <Link
                        to={p.href}
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-[12.5px] font-extrabold text-accent ring-1 ring-accent/20 transition-all duration-300 after:absolute after:inset-0 after:content-[''] group-hover:gap-3 group-hover:bg-accent group-hover:text-accent-foreground"
                      >
                        {isRTL ? "اعرف أكثر" : "Learn more"}
                        <Arrow className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </StickyStackItem>
            ))}
            <div aria-hidden className="h-2" />
          </StickyStack>
        </div>
      </section>

      {/* Donation store — Zakat-eligible shares */}
      <section className="pattern-programs py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isRTL ? "اختر سهمك في الجنة" : "Choose your share in jannah"}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
            {isRTL ? "أبواب صرف موثّقة تتوافق مع مصارف الزكاة الشرعية." : "Verified channels aligned with the Quranic Zakat categories."}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Droplets, t: isRTL ? "سهم سُقيا الماء" : "Water share", d: isRTL ? "وصلة مياه أو حفر بئر." : "Water connection or well.", to: "/programs/water" },
              { icon: HomeIcon, t: isRTL ? "سهم سَتر" : "Shelter share (Satr)", d: isRTL ? "تسقيف وترميم منزل لأسرة." : "Roof and home repair for a family.", to: "/programs/shelter" },
              { icon: Wheat, t: isRTL ? "كرتونة الخير 25 كيلو" : "Food box 25kg", d: isRTL ? "إطعام أسرة لمدة شهر كامل." : "Feed a family for a full month.", to: "/programs/box" },
              { icon: Coins, t: isRTL ? "صك الأضحية" : "Qurbani share", d: isRTL ? "لحوم بلدي من مزارعنا — بدون ربح." : "Farm-fresh meat at cost — no margin.", to: "/qurbani" },
              { icon: HandHeart, t: isRTL ? "تيسير عروسة" : "Bride preparation", d: isRTL ? "تجهيز يتيمة بأجهزة ومستلزمات بيتها." : "Outfitting an orphan bride's home.", to: "/programs/bride" },
              { icon: Stethoscope, t: isRTL ? "سهم العلاج" : "Treatment share", d: isRTL ? "دواء أو عملية جراحية عاجلة." : "Medication or urgent surgery.", to: "/cases?cat=medication" },
            ].map(({ icon: Icon, t, d, to }) => (
              <Link key={t} to={to} className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/15 text-secondary"><Icon className="h-5 w-5" /></span>
                  <h3 className="text-base font-black text-primary group-hover:text-secondary">{t}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Seasonal campaigns */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isRTL ? "مواسم الخير في اليسر" : "Al-Yusr seasons of giving"}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { t: isRTL ? "موسم الشتاء — حملة ستر" : "Winter — Satr campaign", d: isRTL ? "من أكتوبر لفبراير: لحاف، مراتب، كسوة، أسقف، أبواب وشبابيك. «من ستر مسلماً ستره الله»." : "Oct–Feb: blankets, mattresses, clothing, roofs, doors and windows." },
              { t: isRTL ? "موسم الصيف — حملة ظل" : "Summer — Shade campaign", d: isRTL ? "وصلات مياه، تركيب مراوح من «مركون»، ومشروبات باردة لعمال الشمس." : "Water hookups, refurbished fans, and cold drinks for outdoor workers." },
              { t: isRTL ? "رمضان المبارك" : "Holy Ramadan", d: isRTL ? "كرتونة 25 كيلو، مطبخ اليسر، لحوم مزارعنا الوقفية، زكاة المال والفطر." : "25kg box, Al-Yusr kitchen, endowment-farm meat, Zakat al-mal and Fitr." },
              { t: isRTL ? "عيد الأضحى — تيسير الطاعة" : "Eid al-Adha", d: isRTL ? "ربط المضحي بالمستحق مباشرة، أكثر من 2 طن لحوم سنويًا للأسر المتعففة." : "Direct link between the donor and beneficiary, 2+ tons of meat yearly." },
            ].map(s => (
              <article key={s.t} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-base font-black text-primary">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline — proof of growth */}
      <section className="pattern-axes py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isRTL ? "سجل الإنجازات منذ 2019" : "Track record since 2019"}</h2>
          <ol className="relative mt-8 space-y-6 border-s-2 border-secondary/30 ps-6">
            {[
              { y: "2019–2021", t: isRTL ? "التأسيس" : "Foundation", d: isRTL ? "انطلاق قوافل الدقهلية، تأمين 42 منزلًا بالعاصفرة، وتوفير الأكسجين لـ 37 أسرة في كورونا." : "Dakahlia convoys begin, 42 homes secured, oxygen for 37 families during COVID." },
              { y: "2022", t: isRTL ? "الانتشار" : "Expansion", d: isRTL ? "بناء مسجد الفيوم، 1200 شنطة رمضان، وتسقيف 40 منزلًا في شهر." : "Fayoum mosque built, 1,200 Ramadan boxes, 40 roofs in one month." },
              { y: "2023", t: isRTL ? "المشاريع الكبرى" : "Major projects", d: isRTL ? "خط مياه 750م بالمنزلة، ومجمّع خدمي طبي وتعليمي من 4 طوابق." : "750m water main in Al-Manzala, 4-floor medical & educational complex." },
              { y: "2024", t: isRTL ? "الاستدامة" : "Sustainability", d: isRTL ? "كرتونة 12 كيلو المكثفة، وتسقيف 11 منزلًا واسعًا بالحفير." : "Compact 12kg box launched, 11 large roofs in Al-Hafeer." },
              { y: "2025", t: isRTL ? "عام القمة" : "Peak year", d: isRTL ? "1100 كرتونة + 5 طن لحوم، تسقيف 70 منزلًا (8361 م²)، 100 وصلة مياه، إعمار 20 مسجدًا، 9 عرائس، كفالة 354 طالبًا، ودعم 700 أسرة." : "1,100 boxes + 5t meat, 70 roofs (8,361m²), 100 water hookups, 20 mosques, 9 brides, 354 students, 700 families." },
            ].map(it => (
              <li key={it.y} className="relative">
                <span className="absolute -start-[34px] mt-1 grid h-5 w-5 place-items-center rounded-full bg-secondary text-secondary-foreground text-[10px] font-black">●</span>
                <div className="text-xs font-extrabold text-secondary">{it.y}</div>
                <div className="text-base font-black text-primary">{it.t}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{it.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Coverage map — Egypt provinces */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isRTL ? "خريطة عملنا في مصر" : "Our coverage across Egypt"}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
            {isRTL ? "تواجد دائم في 5 محافظات + استجابة عاجلة لكل ربوع مصر." : "Permanent teams in 5 governorates + urgent response across Egypt."}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { p: isRTL ? "الدقهلية" : "Dakahlia", d: isRTL ? "عاصمة عملنا — المجمّع الطبي ومركز الغسيل الكلوي." : "Our HQ — medical complex and dialysis center." },
              { p: isRTL ? "الشرقية" : "Sharqia", d: isRTL ? "قوافل إطعام دورية ودعم الأسر الأشد احتياجًا." : "Regular food convoys and family support." },
              { p: isRTL ? "كفر الشيخ" : "Kafr El-Sheikh", d: isRTL ? "معقل «سكن كريم» وتسقيف منازل الحفير." : "Home of Sakan Karim — roofs in Al-Hafeer." },
              { p: isRTL ? "الفيوم" : "Fayoum", d: isRTL ? "بناء المساجد وتنمية القرى النائية." : "Mosque building and rural development." },
              { p: isRTL ? "المنيا" : "Minya", d: isRTL ? "حفر الآبار وتوصيل مياه الحياة في الصعيد." : "Wells and water lines in Upper Egypt." },
              { p: isRTL ? "باقي المحافظات" : "Other provinces", d: isRTL ? "قوافل طبية وإنسانية عاجلة عند الحاجة." : "Urgent medical and humanitarian convoys." },
            ].map(c => (
              <div key={c.p} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-center gap-2 text-primary"><MapPin className="h-4 w-4 text-secondary" /><span className="text-sm font-black">{c.p}</span></div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & transparency */}
      <section className="pattern-campaigns py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isRTL ? "ثقتك أمانة.. وشفافيتنا هي الضمان" : "Your trust is sacred — transparency is our guarantee"}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Eye, t: isRTL ? "الزيارة الميدانية" : "Field visit", d: isRTL ? "نسّق معنا لزيارة الحالة التي تبرّعت لها وتأكّد بنفسك." : "Coordinate to visit the case you funded and see the impact." },
              { icon: ShieldCheck, t: isRTL ? "التوثيق المرئي" : "Visual proof", d: isRTL ? "كل مشروع موثّق بالصور والفيديو مع حفظ كرامة الحالة." : "Every project documented in photo and video, dignity preserved." },
              { icon: Users, t: isRTL ? "تطوّع عائلتك" : "Family volunteering", d: isRTL ? "شارك أطفالك وشبابك في قوافل التوزيع لتعليمهم قيمة الخير." : "Bring your kids and youth on distribution convoys." },
              { icon: Tractor, t: isRTL ? "المزرعة الوقفية" : "Endowment farm", d: isRTL ? "مواشٍ محصّنة بأفضل الأعلاف لضمان جودة لحوم بلا ربح." : "Vaccinated livestock on premium feed for cost-only meat." },
            ].map(({ icon: Icon, t, d }) => (
              <article key={t} className="flex gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-secondary"><Icon className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-base font-black text-primary">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
            {isRTL ? `مؤسسة مشهرة برقم 2665/2019 تحت رقابة وزارة التضامن الاجتماعي.${bankText ? ` حساب ${bankText}.` : ""}` : `Licensed NGO 2665/2019 under the Ministry of Social Solidarity.${bankText ? ` Account ${bankText}.` : ""}`}
          </p>
        </div>
      </section>

      {/* FAQ + JSON-LD */}
      <section className="bg-background py-12 md:py-16" dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isRTL ? "أسئلة شائعة عن الزكاة" : "Frequently asked questions"}</h2>
          <div className="mt-8 space-y-3">
            {zakatFaqs.map((f, i) => (
              <details key={i} className="group rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-soft open:shadow-card">
                <summary className="cursor-pointer list-none text-sm sm:text-base font-extrabold text-primary marker:hidden flex items-center gap-2">
                  <span className="shrink-0 text-secondary font-black">Q{i + 1}.</span>
                  <span className="leading-snug">{f.q}</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-3">{f.a}</p>
              </details>
            ))}
          </div>

          {/* Center link to FAQ Hub */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/faqs"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-secondary/40 bg-card px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-secondary/10 transition"
            >
              <span>{isRTL ? "مركز الأسئلة الشائعة" : "FAQ Center"}</span>
              <Arrow className="h-3.5 w-3.5 text-secondary" />
            </Link>
          </div>

          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: zakatFaqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }) }}
          />
        </div>
      </section>

      <section className="relative overflow-hidden pattern-hero-luxe text-primary-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 pattern-cta-rays opacity-60" />
        <div className="container relative mx-auto max-w-3xl px-4 pt-14 pb-28 sm:pb-36 md:pt-20 md:pb-44 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            {isRTL ? "زكاتك تصل لأهلها" : "Your Zakat reaches its rightful people"}
          </span>
          <h2 className="mt-3 text-2xl font-black leading-tight text-shadow-soft md:text-4xl">
            {isRTL ? "أمانة موثّقة بالصور والفيديو" : "A trust — documented with photos and video"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/85 md:text-base">
            {isRTL
              ? "كل جنيه يُصرف يُعرض للمتبرع: التاريخ، المكان، الأسرة، والأثر — بدون رمزية ولا اختصار."
              : "Every EGP is reported back to the donor: date, place, family, impact — never symbolic."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to={`/donate?intent=zakat${eligible ? `&amount=${due}` : ""}`} data-source="zakat-cta">
                <Heart className="h-5 w-5" />{isRTL ? "أخرج زكاتك الآن" : "Pay your Zakat now"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <a href="#calculator"><Calculator className="h-4 w-4" /> {isRTL ? "احسب من جديد" : "Recalculate"}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile sticky pay card — small screens only */}
      <div
        role="region"
        aria-label={isRTL ? "بطاقة الزكاة السريعة" : "Quick Zakat card"}
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl border border-secondary/30 bg-[hsl(152_65%_10%)]/95 px-3 py-2 text-primary-foreground shadow-cta backdrop-blur">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-bold text-primary-foreground/80">
              {eligible ? (isRTL ? "زكاتك المستحقة" : "Your Zakat due") : (isRTL ? "احسب زكاتك" : "Calculate your Zakat")}
            </div>
            <div className="truncate text-sm font-extrabold" dir="ltr">
              {eligible ? `${due.toLocaleString()} EGP` : (isRTL ? "ابدأ الحساب" : "Start now")}
            </div>
          </div>
          {eligible ? (
            <Link
              to={`/donate?intent=zakat&amount=${due}`}
              className="shrink-0 rounded-xl bg-orange-grad px-4 py-2 text-xs font-extrabold text-accent-foreground shadow-cta"
            >
              {isRTL ? "ادفع" : "Pay"}
            </Link>
          ) : (
            <a
              href="#calculator"
              className="shrink-0 rounded-xl bg-orange-grad px-4 py-2 text-xs font-extrabold text-accent-foreground shadow-cta"
            >
              {isRTL ? "احسب" : "Calc"}
            </a>
          )}
        </div>
      </div>
      <FieldGalleryScroll galleryKey="zakat" />
    </PageLayout>
  );
};
export default Zakat;