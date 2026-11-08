import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  FileCheck2, Camera, Users, HandHeart, BadgeCheck, Heart, MessageCircle, ArrowLeft,
  ArrowRight, MousePointerClick, Search, Lock, CreditCard, Landmark, MapPin, Phone, Mail, CalendarCheck, EyeOff,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalFAQ } from "@/components/common/LocalFAQ";
import { useLang } from "@/i18n/LangContext";
import { useSiteStats } from "@/hooks/useSiteStats";
import trustHero from "@/assets/family-hope.webp";
import trustTransparency from "@/assets/yusr-distribution-1.webp";
import markounSalary from "@/assets/markoun-poster-delivery.png";
import posterMedBottle from "@/assets/markoun-poster-medbottle.png";
import markounWardrobe from "@/assets/markoun-poster-clothes.webp";
import qurbaniMeatTrays from "@/assets/qurbani-meat-trays.jpg";
import takrimVan from "@/assets/takrim-van.jpg";
import { FOUNDATION_EMAIL } from "@/data/api/contactApi";
import { bankAccountLabel, useBankAccounts } from "@/data/paymentOptions";
import { usePaymentOptions } from "@/data/paymentOptions";

const BASE = "https://elyusr.org";
const PHONE = "+20 109 700 0137";
const WA_NUMBER = "201097000137";
const EMAIL = FOUNDATION_EMAIL;
const LICENSE = "2665/2019";

/** Section heading used by every block on the page: the title, and its one-line context beside it. */
function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="grid gap-3 border-b border-border pb-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-end md:gap-10">
      <h2 className="text-balance text-3xl font-black leading-tight text-primary md:text-4xl">{title}</h2>
      {sub && <p className="max-w-md leading-relaxed text-foreground/75 md:text-lg">{sub}</p>}
    </div>
  );
}

const Trust = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const bankAccounts = useBankAccounts();
  const bankText = bankAccounts[0] ? bankAccountLabel(bankAccounts[0]) : "";
  // Transfer apps offered right now (wallets / InstaPay active in the dashboard).
  const { options: payOptions } = usePaymentOptions();
  const transferApps = payOptions.filter((o) => o.kind === "wallet" || o.kind === "instant");
  const walletNames = { ar: transferApps.map((o) => o.nameAr).join(" و"), en: transferApps.map((o) => o.nameEn).join(" & ") };
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const wa = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  // Impact numbers: the same live figures as the homepage (dashboard → أرقام الصفحة الرئيسية).
  const { data: stats, loading: statsLoading } = useSiteStats("home_stats");

  const promises = isRTL
    ? [
        { I: BadgeCheck, t: `مشهرة برقم ${LICENSE}`, d: "مؤسسة أهلية مسجّلة لدى وزارة التضامن الاجتماعي منذ 2019." },
        { I: Search, t: "رقم تتبع لكل تبرع", d: "تتابع حالة تبرعك من الاستلام حتى التسليم." },
        { I: Lock, t: "دفع آمن ومشفّر", d: "بيانات بطاقتك لا تُخزَّن عندنا أبدًا." },
        { I: Camera, t: "توثيق بالصور والفيديو", d: "دليل مرئي على وصول التبرع، مع حفظ كرامة الأسر." },
      ]
    : [
        { I: BadgeCheck, t: `Registered No. ${LICENSE}`, d: "Egyptian NGO registered with the Ministry of Social Solidarity since 2019." },
        { I: Search, t: "A tracking number per gift", d: "Follow your donation from receipt to delivery." },
        { I: Lock, t: "Secure, encrypted payment", d: "Your card details are never stored on our servers." },
        { I: Camera, t: "Photo & video proof", d: "Visual proof of delivery, with every family's dignity protected." },
      ];

  const pillars = isRTL
    ? [
        { I: Users, t: "زيارة ميدانية", d: "نسّق معنا لزيارة الحالة التي تبرعت لها، وشاهد الأثر بنفسك." },
        { I: Camera, t: "توثيق مرئي", d: "صور وفيديو لكل مشروع، مع حفظ كرامة الحالة." },
        { I: HandHeart, t: "تطوع عائلتك", d: "شارك أطفالك وشبابك في قوافل التوزيع." },
        { I: FileCheck2, t: "استلام مباشر", d: "سلّم تبرعك العيني بنفسك في المقر، أو للحالة مباشرة تحت إشرافنا." },
      ]
    : [
        { I: Users, t: "Field visit", d: "Coordinate a personal visit to the case you supported and see the impact." },
        { I: Camera, t: "Visual proof", d: "Photo and video for every project, dignity preserved." },
        { I: HandHeart, t: "Family volunteering", d: "Bring your kids and youth to distribution convoys." },
        { I: FileCheck2, t: "Direct hand-off", d: "Deliver in-kind donations yourself under our supervision." },
      ];

  const steps = isRTL
    ? [
        { I: MousePointerClick, t: "اختر الباب", d: "حالة بعينها، أو برنامج، أو مشروع، أو حملة: كفالة، علاج، إطعام، سقيا، صك أضحية." },
        { I: Heart, t: "تبرّع بأمان", d: "بطاقة بنكية أو محفظة إلكترونية عبر بوابة كاشير، أو إنستاباي، أو فودافون كاش، أو تحويل بنكي." },
        { I: Search, t: "تتبّع رقمك", d: "لكل تبرع رقم مرجعي تتابع به حالته من صفحة «تتبع تبرعك»." },
        { I: BadgeCheck, t: "استلم التوثيق", d: "صور التسليم وفيديو له، وزيارة ميدانية إن رغبت." },
      ]
    : [
        { I: MousePointerClick, t: "Pick a cause", d: "A specific case, program, project or campaign — sponsorship, treatment, food, water, Qurbani." },
        { I: Heart, t: "Donate safely", d: "Card or wallet via the Kashier gateway, InstaPay, Vodafone Cash or bank transfer." },
        { I: Search, t: "Track by reference", d: "Every donation has a reference you can follow on the Track page." },
        { I: BadgeCheck, t: "Receive proof", d: "Delivery photos and video — plus a field visit on request." },
      ];

  const allocation = [
    { ar: "يصل إلى الحالات والمستفيدين", en: "Reaches cases & beneficiaries", pct: 90, color: "bg-secondary" },
    { ar: "مصاريف لوجستية ونقل وتجهيز", en: "Logistics, transport & preparation", pct: 6, color: "bg-primary/45" },
    { ar: "رواتب وإدارة", en: "Salaries & administration", pct: 4, color: "bg-primary" },
  ];

  const docs = isRTL
    ? [
        { I: BadgeCheck, t: "حاصلون على صفة النفع العام", d: "مؤسسة ذات نفع عام معتمدة رسميًا." },
        { I: FileCheck2, t: `رقم الإشهار ${LICENSE}`, d: "مؤسسة أهلية مشهرة رسميًا منذ 2019." },
        { I: Landmark, t: "مسجّلون لدى وزارة التضامن الاجتماعي", d: "نعمل تحت إشراف ورقابة وزارة التضامن الاجتماعي." },
        { I: Lock, t: "جميع حساباتنا البنكية مرخّصة", d: "كل حسابات التبرع رسمية ومرخّصة باسم المؤسسة." },
      ]
    : [
        { I: BadgeCheck, t: "Public benefit status", d: "An officially recognised public-benefit foundation." },
        { I: FileCheck2, t: `Registration No. ${LICENSE}`, d: "A registered non-governmental foundation since 2019." },
        { I: Landmark, t: "Under the Ministry of Social Solidarity", d: "We operate under the Ministry of Social Solidarity's supervision." },
        { I: Lock, t: "All bank accounts are licensed", d: "Every donation account is official and licensed in the foundation's name." },
      ];

  const payments = isRTL
    ? [
        { I: CreditCard, t: "بطاقات ومحافظ إلكترونية", d: "عبر بوابة كاشير المرخّصة؛ يتم الدفع في صفحة البوابة نفسها، ولا نطّلع على بيانات بطاقتك." },
        ...(walletNames.ar ? [{ I: Phone, t: walletNames.ar, d: "حوّل المبلغ وأرسل صورة الإيصال، وسنؤكد التبرع ونرسل إليك رقم التتبع." }] : []),
        ...(bankText ? [{ I: Landmark, t: "تحويل بنكي", d: `حساب ${bankText} — وتحويل دولي SWIFT عند الطلب.` }] : []),
        { I: EyeOff, t: "تبرّع باسم «فاعل خير»", d: "يمكنك إخفاء اسمك من الظهور العام، وتبقى بياناتك محمية وفق سياسة الخصوصية." },
      ]
    : [
        { I: CreditCard, t: "Cards & e-wallets", d: "Through the licensed Kashier gateway — you pay on the gateway's own page and we never see card details." },
        ...(walletNames.en ? [{ I: Phone, t: walletNames.en, d: "Transfer and send the receipt; we confirm and send your tracking number." }] : []),
        ...(bankText ? [{ I: Landmark, t: "Bank transfer", d: `Account ${bankText} — international SWIFT on request.` }] : []),
        { I: EyeOff, t: "Give anonymously", d: "Hide your name publicly; your details stay protected under our privacy policy." },
      ];

  const regions = isRTL
    ? [
        "الدقهلية — المقر الرئيسي وقوافل الإطعام والمجمّع الطبي",
        "كفر الشيخ — تسقيف 70 بيتًا ضمن «سكن كريم»",
        "الفيوم — بناء وترميم المساجد والكتاتيب",
        "المنيا — حفر آبار وشبكات مياه نظيفة",
        "القاهرة — حالات عاجلة وقوافل إطعام دورية",
        "باقي المحافظات — حالات موثّقة بعد بحث ميداني",
      ]
    : [
        "Dakahlia — headquarters, food convoys and the medical complex",
        "Kafr El Sheikh — 70 homes re-roofed under Dignified Shelter",
        "Fayoum — mosque and Qur'an-school construction & restoration",
        "Minya — wells and clean-water networks",
        "Cairo — emergency cases and rolling food convoys",
        "Other governorates — verified cases after a field assessment",
      ];

  const gallery = [
    { src: qurbaniMeatTrays, alt: isRTL ? "صكوك أضحية موثّقة ومعبّأة" : "Documented & packed Qurbani shares" },
    { src: markounSalary, alt: isRTL ? "تسليم مرتب شهري لأسرة متعففة" : "Monthly stipend hand-off to a family" },
    { src: posterMedBottle, alt: isRTL ? "تجهيز أدوية مزمنة شهرية" : "Monthly chronic medication" },
    { src: markounWardrobe, alt: isRTL ? "تجهيز دولاب لطفلة في حملة مركون" : "Wardrobe set up for a child — Markoun" },
    { src: takrimVan, alt: isRTL ? "سيارة تكريم الإنسان" : "Honour-the-Human van" },
    { src: trustTransparency, alt: isRTL ? "قافلة توزيع ميدانية" : "Field distribution convoy" },
  ];

  const faq = isRTL
    ? [
        { q: "هل مؤسسة اليسر مرخّصة رسميًا في مصر؟", a: `نعم، اليسر مؤسسة أهلية مشهرة لدى وزارة التضامن الاجتماعي تحت رقم ${LICENSE}، وحاصلة على صفة النفع العام.` },
        { q: "كيف أتتبع تبرعي بعد الدفع؟", a: "يصلك رقم مرجعي بعد الدفع، أدخله في صفحة «تتبع تبرعك» (elyusr.org/donate/track) لتعرف حالة التبرع ومرحلة التنفيذ." },
        { q: "أين يذهب تبرعي بالضبط؟", a: "يصل 90% من التبرعات إلى الحالات والمستفيدين، و6% مصاريف لوجستية ونقل وتجهيز، و4% رواتب وإدارة." },
        { q: "هل تحتفظون ببيانات بطاقتي؟", a: "لا. يتم الدفع بالبطاقة في صفحة بوابة كاشير المرخّصة، ولا يطّلع أحد في المؤسسة على بيانات البطاقة أو يخزّنها." },
        { q: "هل يمكنني زيارة حالة تبرعت لها بنفسي؟", a: "نعم، ننسّق مع المتبرعين زيارات ميدانية للحالات في أي محافظة نعمل فيها، مع الحفاظ على كرامة الأسرة." },
        { q: "هل يمكنني التبرع دون أن يظهر اسمي؟", a: "نعم، اختر «فاعل خير» في نموذج التبرع. سنطلب رقم هاتفك فقط لنرسل إليك رقم التتبع والتوثيق." },
      ]
    : [
        { q: "Is Al-Yusr officially licensed in Egypt?", a: `Yes — a non-governmental foundation registered with the Ministry of Social Solidarity under No. ${LICENSE}, with public-benefit status.` },
        { q: "How do I track my donation after paying?", a: "You receive a reference after payment. Enter it on the Track page (elyusr.org/donate/track) to see its status and delivery stage." },
        { q: "Where exactly does my donation go?", a: "90% reaches the cases and beneficiaries, 6% covers logistics, transport and preparation, and 4% covers salaries and administration." },
        { q: "Do you store my card details?", a: "No. Card payments happen on the licensed Kashier gateway's page; nobody at the foundation sees or stores card data." },
        { q: "Can I personally visit a case I supported?", a: "Yes — we coordinate donor field visits in every governorate we work in, while preserving family dignity." },
        { q: "Can I donate without my name showing?", a: "Yes — choose \"Anonymous\" on the donation form. We only ask for a phone number to send your tracking reference and proof." },
      ];

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "الشفافية والثقة | مؤسسة اليسر الخيرية — تتبع تبرعك خطوة بخطوة" : "Trust & Transparency | Al-Yusr Charity Foundation"}
        description={isRTL
          ? `مؤسسة اليسر الخيرية مشهرة برقم ${LICENSE} وتعمل في كل محافظات مصر: رقم تتبع لكل تبرع، دفع آمن، توثيق بالصور والفيديو، 90% من التبرعات تصل إلى المستفيدين، وزيارات ميدانية للحالات.`
          : `Al-Yusr Charity Foundation (NGO No. ${LICENSE}) works across Egypt: a tracking number per donation, secure payment, photo/video proof, 90% of donations reaching beneficiaries, and field visits.`}
        path="/trust"
        image={trustHero}
        keywords={isRTL ? "شفافية مؤسسة خيرية, تتبع التبرع, جمعية خيرية موثوقة, مؤسسة خيرية مرخصة, التبرع الآمن" : "charity transparency Egypt, track donation, trusted charity Egypt, licensed NGO Egypt"}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${BASE}/` },
        { name: isRTL ? "الشفافية" : "Trust & Transparency", url: `${BASE}/trust` },
      ]} />
      {/* Organization credentials + page + verification how-to. The FAQPage JSON-LD comes from <LocalFAQ>. */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["Organization", "NGO"],
              "@id": `${BASE}/#org`,
              name: "Al-Yusr Charity Foundation",
              alternateName: "مؤسسة اليسر الخيرية",
              url: `${BASE}/`,
              logo: `${BASE}/icons/icon-512.png`,
              foundingDate: "2019",
              taxID: LICENSE,
              email: EMAIL,
              telephone: PHONE,
              areaServed: { "@type": "Country", name: "Egypt" },
              hasCredential: [
                { "@type": "EducationalOccupationalCredential", name: "Ministry of Social Solidarity license", identifier: LICENSE },
                { "@type": "EducationalOccupationalCredential", name: "Public Benefit Status" },
              ],
            },
            {
              "@type": "WebPage",
              "@id": `${BASE}/trust#webpage`,
              url: `${BASE}/trust`,
              name: isRTL ? "الشفافية والثقة — مؤسسة اليسر الخيرية" : "Trust & Transparency — Al-Yusr Charity Foundation",
              about: { "@id": `${BASE}/#org` },
              speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", ".ai-answer"] },
            },
            {
              "@type": "HowTo",
              name: isRTL ? "كيف تتأكد بنفسك من وصول تبرعك" : "How to verify your donation reached its recipient",
              step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.t, text: s.d })),
            },
          ],
        })}</script>
      </Helmet>

      {/* ══════════ HERO + the four promises as a ledger at its foot ══════════ */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <img src={trustHero} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary" aria-hidden />
        <div className="container relative z-10 mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
          <div className="text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "الشفافية" : "Trust" }]} />
          </div>
          <div className="mt-10 max-w-3xl md:mt-14">
            <h1 className="text-balance text-4xl font-black leading-[1.15] text-white sm:text-5xl md:text-6xl">
              {isRTL ? "الشفافية في مؤسسة اليسر الخيرية" : "Transparency at Al-Yusr Charity Foundation"}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
              {isRTL
                ? "نفتح أبوابنا لك لتتأكد بنفسك من وصول كل جنيه إلى مستحقه: ترخيص رسمي، ورقم تتبع لكل تبرع، وصور وفيديو، وزيارات ميدانية."
                : "We open our doors so you can verify every pound reached the right family — official license, a tracking number per donation, photos, video and field visits."}
            </p>
            {/* Short factual answer for AI / voice search (speakable target) */}
            <p className="ai-answer mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
              {isRTL
                ? `اليسر مؤسسة أهلية مصرية مشهرة لدى وزارة التضامن الاجتماعي برقم ${LICENSE}، تعمل في كل محافظات مصر منذ 2019؛ يصل 90% من التبرعات إلى الحالات والمستفيدين، ولكل تبرع رقم تتبع وتوثيق بالصور.`
                : `Al-Yusr is an Egyptian NGO registered with the Ministry of Social Solidarity (No. ${LICENSE}), working across Egypt since 2019; 90% of donations reach the cases and beneficiaries, and every gift has a tracking number and photo proof.`}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to="/donate"><Heart className="h-5 w-5" />{isRTL ? "تبرع بثقة" : "Donate with confidence"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/donate/track"><Search className="h-5 w-5" />{isRTL ? "تتبع تبرعك" : "Track your donation"}</Link>
              </Button>
            </div>
          </div>

          <ul className="mt-14 grid gap-x-8 border-t border-white/20 sm:grid-cols-2 lg:grid-cols-4">
            {promises.map((p) => (
              <li key={p.t} className="flex items-start gap-3 border-b border-white/10 py-6 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0">
                <p.I className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
                <div>
                  <h2 className="text-sm font-black text-white">{p.t}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/75">{p.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ Live impact numbers — one ledger, not four cards ══════════ */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title={isRTL ? "أرقامنا على أرض الواقع" : "Our impact in numbers"}
            sub={isRTL ? "وراء كل رقم ملف توثيق وصور ميدانية." : "Every number is backed by a documentation file and field photos."} />
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {statsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card px-4 py-8"><Skeleton className="mx-auto h-10 w-24" /><Skeleton className="mx-auto mt-3 h-4 w-28" /></div>
                ))
              : stats.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex flex-col-reverse items-center bg-card px-4 py-8 text-center">
                    <dt className="mt-2 text-sm font-bold text-foreground/75">{isRTL ? s.label_ar : s.label_en}</dt>
                    <dd className="font-mono text-3xl font-black tabular-nums text-primary md:text-5xl">
                      {s.value_text ?? (s.value_number ?? 0).toLocaleString("en-US")}
                      {(isRTL ? s.suffix_ar : s.suffix_en) ? <span className="ms-1 text-xl md:text-2xl">{isRTL ? s.suffix_ar : s.suffix_en}</span> : null}
                    </dd>
                  </div>
                ))}
          </dl>
        </div>
      </section>

      {/* ══════════ Verify yourself ══════════ */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center md:gap-14">
          <img src={trustTransparency} loading="lazy"
            alt={isRTL ? "أبواب اليسر مفتوحة لتتأكد بنفسك من وصول كل تبرع" : "Al-Yusr's doors are open — verify every donation yourself"}
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-card md:aspect-[4/5]" />
          <div>
            <h2 className="text-balance text-3xl font-black leading-tight text-primary md:text-4xl">
              {isRTL ? "لا نطلب منك أن تثق بنا… بل نُريك بنفسك" : "We don't ask for your trust — we show you"}
            </h2>
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {pillars.map((p) => (
                <li key={p.t} className="flex items-start gap-4 py-5">
                  <p.I className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden />
                  <div>
                    <h3 className="text-lg font-black text-primary">{p.t}</h3>
                    <p className="mt-1 leading-relaxed text-foreground/75">{p.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════ How it works — a path, the order matters ══════════ */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead title={isRTL ? "من تبرعك حتى وصول الأثر — 4 خطوات شفافة" : "From your donation to verified impact — 4 transparent steps"} />
          <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-8">
            <span aria-hidden className="absolute bottom-5 start-5 top-5 w-px bg-border md:bottom-auto md:end-5 md:start-5 md:top-5 md:h-px md:w-auto" />
            {steps.map((s, i) => (
              <li key={s.t} className="relative ps-16 md:ps-0">
                <span className="absolute start-0 top-0 grid h-10 w-10 place-items-center rounded-full bg-primary font-mono text-base font-black tabular-nums text-primary-foreground ring-8 ring-background md:static">
                  {i + 1}
                </span>
                <h3 className="text-lg font-black text-primary md:mt-5">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-foreground/75">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══════════ Where every pound goes — one bar that adds up to 100% ══════════ */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead title={isRTL ? "أين يذهب كل جنيه؟" : "Where does every pound go?"} />
          <div className="mt-10 grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-14">
            <div>
              <div className="font-mono text-7xl font-black leading-none tabular-nums text-primary md:text-8xl" dir="ltr">90%</div>
              <p className="mt-3 max-w-[16rem] font-bold text-foreground/80">
                {isRTL ? "من تبرعاتك تصل إلى الحالات والمستفيدين." : "of your donations reach the cases and beneficiaries."}
              </p>
            </div>
            <div>
              <div className="flex h-6 w-full overflow-hidden rounded-full bg-muted" role="img"
                aria-label={allocation.map((a) => `${isRTL ? a.ar : a.en} ${a.pct}%`).join("، ")}>
                {allocation.map((a) => <div key={a.en} className={a.color} style={{ width: `${a.pct}%` }} />)}
              </div>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                {allocation.map((a) => (
                  <li key={a.en} className="flex items-start gap-3">
                    <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${a.color}`} aria-hidden />
                    <div>
                      <div className="font-mono text-2xl font-black tabular-nums text-primary" dir="ltr">{a.pct}%</div>
                      <div className="text-sm font-bold text-foreground/75">{isRTL ? a.ar : a.en}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ Official standing ══════════ */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title={isRTL ? "وضعنا الرسمي" : "Our official standing"}
            sub={isRTL ? "مؤسسة رسمية تحت إشراف وزارة التضامن الاجتماعي." : "An official foundation supervised by the Ministry of Social Solidarity."} />
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {docs.map((d) => (
              <li key={d.t} className="flex items-start gap-4 bg-card p-6 md:p-7">
                <d.I className="mt-0.5 h-7 w-7 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="text-lg font-black text-primary">{d.t}</h3>
                  <p className="mt-1 leading-relaxed text-foreground/75">{d.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ Secure payment & donor privacy ══════════ */}
      <section className="bg-primary py-16 text-primary-foreground md:py-24">
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-14">
          <div>
            <Lock className="h-8 w-8 text-secondary" aria-hidden />
            <h2 className="mt-4 text-balance text-3xl font-black leading-tight md:text-4xl">{isRTL ? "طرق تبرع آمنة وبياناتك في أمان" : "Safe ways to give — your data stays safe"}</h2>
            <p className="mt-4 text-primary-foreground/80">
              {isRTL ? "تفاصيل حماية بياناتك في " : "How we protect your data: "}
              <Link to="/privacy" className="font-extrabold text-secondary underline decoration-secondary/50 underline-offset-4 hover:decoration-secondary">{isRTL ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
            </p>
          </div>
          <ul className="divide-y divide-white/15 border-y border-white/15">
            {payments.map((p) => (
              <li key={p.t} className="flex items-start gap-4 py-5">
                <p.I className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
                <div>
                  <h3 className="font-black text-white">{p.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-primary-foreground/80">{p.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ Where we work ══════════ */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title={isRTL ? "نصل إلى كل محافظات مصر" : "We reach every governorate in Egypt"}
            sub={isRTL ? "نقبل أي حالة في أي مكان في مصر بعد بحث ميداني يجريه فريقنا." : "Every case is accepted after a field assessment by our team, anywhere in Egypt."} />
          <dl className="mt-10 grid gap-x-12 md:grid-cols-2">
            {regions.map((x) => {
              const [place, ...rest] = x.split(" — ");
              return (
                <div key={x} className="flex items-start gap-3 border-b border-border py-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <dt className="font-black text-primary">{place}</dt>
                    {rest.length > 0 && <dd className="mt-0.5 text-sm leading-relaxed text-foreground/75">{rest.join(" — ")}</dd>}
                  </div>
                </div>
              );
            })}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline"><Link to="/cases">{isRTL ? "الحالات الموثّقة" : "Verified cases"}</Link></Button>
            <Button asChild variant="outline"><Link to="/about#achievements">{isRTL ? "إنجازاتنا" : "Our achievements"}</Link></Button>
            <Button asChild variant="outline"><Link to="/services-map">{isRTL ? "خريطة الخدمات" : "Services map"}</Link></Button>
          </div>
        </div>
      </section>

      {/* ══════════ Proof gallery — one lead photo, the rest around it ══════════ */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title={isRTL ? "صور حقيقية من قوافلنا الميدانية" : "Real photos from our field convoys"}
            sub={isRTL ? "يصاحب كل تبرع دليل بصري يصلك مع رقم المتابعة." : "Every donation comes with visual proof, sent with your tracking reference."} />
          <div className="mt-10 grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] md:grid-cols-3 md:auto-rows-[210px] [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
            {gallery.map((g, i) => (
              <figure key={g.alt} className={`group relative overflow-hidden rounded-2xl bg-muted ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                <img src={g.src} alt={g.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2.5 pt-8 text-xs font-bold text-white">{g.alt}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline"><Link to="/gallery">{isRTL ? "معرض الصور الكامل" : "Full gallery"}</Link></Button>
            <Button asChild variant="outline"><Link to="/stories">{isRTL ? "قصص الأثر" : "Impact stories"}</Link></Button>
          </div>
        </div>
      </section>

      {/* FAQ: dashboard category "trust" first; these items are the fallback. Emits the FAQPage JSON-LD. */}
      <LocalFAQ
        categorySlug="trust"
        donateHref="/donate"
        waText={isRTL ? "السلام عليكم، لديّ سؤال عن الشفافية وتتبع التبرع." : "Hi, I have a question about transparency and donation tracking."}
        title={isRTL ? "أسئلة شائعة عن الشفافية وتتبع التبرع" : "Transparency & donation tracking FAQs"}
        intro={isRTL ? "كل ما يخص الترخيص وتوثيق التبرع وطرق الدفع الآمنة في مؤسسة اليسر الخيرية." : "Everything about licensing, donation proof and secure payment at Al-Yusr Charity Foundation."}
        items={faq}
      />

      {/* ══════════ Legal identity & contact ══════════ */}
      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-8 rounded-2xl border border-border bg-card p-6 md:grid-cols-2 md:p-8">
            <div>
              <h2 className="text-xl font-black text-primary md:text-2xl">{isRTL ? "البيانات القانونية" : "Legal identity"}</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-foreground/85">
                <li className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{isRTL ? "مؤسسة اليسر الخيرية — مؤسسة أهلية مصرية" : "Al-Yusr Charity Foundation — Egyptian non-governmental foundation"}</li>
                <li className="flex gap-2"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{isRTL ? `مشهرة برقم ${LICENSE} لدى وزارة التضامن الاجتماعي` : `Registered No. ${LICENSE}, Ministry of Social Solidarity`}</li>
                <li className="flex gap-2"><CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{isRTL ? "تأسست عام 2019" : "Founded in 2019"}</li>
                <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{isRTL ? "المقر الرئيسي: المنصورة، تقسيم خطاب، بجوار وكالة المنصورة، محافظة الدقهلية" : "Head office: Khattab district, Mansoura, Dakahlia, Egypt"}</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-black text-primary md:text-2xl">{isRTL ? "تواصل مع فريق المتبرعين" : "Contact the donor team"}</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-foreground/85">
                <li><a href={`tel:+${WA_NUMBER}`} className="inline-flex items-center gap-2 hover:text-secondary"><Phone className="h-4 w-4 text-secondary" /><span dir="ltr">{PHONE}</span></a></li>
                <li><a href={wa(isRTL ? "السلام عليكم، لديّ سؤال عن تبرع." : "Hi, I have a question about a donation.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-secondary"><MessageCircle className="h-4 w-4 text-secondary" />{isRTL ? "واتساب" : "WhatsApp"}</a></li>
                <li><a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 hover:text-secondary"><Mail className="h-4 w-4 text-secondary" />{EMAIL}</a></li>
                <li><Link to="/contact" className="inline-flex items-center gap-2 font-extrabold text-primary underline decoration-secondary decoration-2 underline-offset-4">{isRTL ? "كل وسائل التواصل" : "All contact options"} <Arrow className="h-3.5 w-3.5" /></Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ Final CTA ══════════ */}
      <section className="bg-primary py-14 text-primary-foreground md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-black md:text-4xl">{isRTL ? "تبرعك يصل… ومتابعتك تصنع الفرق" : "Your donation arrives — your follow-up matters"}</h2>
          <p className="mt-3 text-primary-foreground/85 md:text-lg">
            {isRTL ? "تبرّع واستلم رقم تتبع فوري مع توثيق ميداني كامل." : "Donate and receive an instant tracking number with full field documentation."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to="/donate"><Heart className="h-5 w-5" />{isRTL ? "تبرع الآن" : "Donate now"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/donate/track">{isRTL ? "تتبع تبرعك" : "Track your donation"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Trust;
