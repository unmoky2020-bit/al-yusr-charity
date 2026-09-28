import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Eye, FileCheck2, Camera, Users, HandHeart, BadgeCheck, Heart, MessageCircle, Download, ArrowLeft, ArrowRight, MousePointerClick, Search, BadgeCheck as Verify } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { LocalFAQ } from "@/components/common/LocalFAQ";
import { StickyQurbaniCTA } from "@/components/common/StickyQurbaniCTA";
import { useLang } from "@/i18n/LangContext";
import trustHero from "@/assets/family-hope.jpg";
import trustTransparency from "@/assets/yusr-distribution-1.jpg";
import markounSalary from "@/assets/markoun-poster-delivery.png";
import posterMedBottle from "@/assets/markoun-poster-medbottle.png";
import posterDelivery from "@/assets/markoun-poster-delivery.png";
import markounWardrobe from "@/assets/markoun-poster-clothes.png";
import qurbaniMeatTrays from "@/assets/qurbani-meat-trays.jpg";
import takrimVan from "@/assets/takrim-van.jpg";

const Trust = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const base = "https://elyusr.org";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const wa = `https://wa.me/201097000137?text=${encodeURIComponent(isRTL ? "السلام عليكم، عايز أعرف ضمانات الشفافية وتتبع التبرع." : "Hi, I want to know your transparency and donation tracking guarantees.")}`;

  const pillars = isRTL
    ? [
        { I: Users,      t: "زيارة ميدانية", d: "نسّق معنا لزيارة الحالة اللي اتبرعت لها بنفسك وتشوف الأثر." },
        { I: Camera,     t: "توثيق مرئي", d: "صور وفيديو لكل مشروع، مع حفظ كرامة الحالة." },
        { I: HandHeart,  t: "تطوع عائلتك", d: "شارك أطفالك وشبابك في قوافل التوزيع." },
        { I: FileCheck2, t: "استلام مباشر", d: "وصل تبرعك العيني بنفسك للمقر أو للحالة بإشرافنا." },
      ]
    : [
        { I: Users,      t: "Field visit", d: "Coordinate to personally visit the case you supported and see the impact." },
        { I: Camera,     t: "Visual proof", d: "Photo and video for every project, dignity preserved." },
        { I: HandHeart,  t: "Family volunteering", d: "Bring your kids and youth to distribution convoys." },
        { I: FileCheck2, t: "Direct hand-off", d: "Deliver in-kind donations directly under our supervision." },
      ];

  const docs = isRTL
    ? [
        { t: "ترخيص وزارة التضامن الاجتماعي", d: "إشهار رسمي رقم 2655 لسنة 2019." },
        { t: "صفة النفع العام", d: "حاصلون على صفة النفع العام بعد تحقيق أثر ميداني." },
        { t: "مراجعة محاسبية مستقلة", d: "تقارير مالية سنوية معتمدة من مكتب محاسبة خارجي." },
        { t: "تقرير الأثر السنوي", d: "إنجازات 2025 موثقة بأرقام وصور وفيديو." },
      ]
    : [
        { t: "Ministry of Social Solidarity license", d: "Official NGO registration No. 2655/2019." },
        { t: "Public benefit status", d: "Granted after proven field impact." },
        { t: "Independent audit", d: "Annual financials reviewed by an external accounting firm." },
        { t: "Annual impact report", d: "2025 achievements documented with numbers, photos and video." },
      ];

  const allocation = [
    { ar: "البرامج الميدانية", en: "Field programs",     pct: 88, color: "bg-secondary" },
    { ar: "اللوجستيات والتشغيل", en: "Logistics & ops", pct: 8,  color: "bg-accent" },
    { ar: "الإدارة والمتابعة", en: "Admin & follow-up", pct: 4,  color: "bg-primary" },
  ];

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "ثقتك أمانة | شفافية وتوثيق مؤسسة اليسر الخيرية بالدقهلية" : "Your trust is a trust | Al-Yusr transparency in Dakahlia"}
        description={isRTL ? "ضمانات الشفافية في مؤسسة اليسر بالدقهلية والمنصورة: ترخيص رسمي من وزارة التضامن، مراجعة محاسبية مستقلة، توثيق صور وفيديو لكل تبرع، وزيارات ميدانية للحالات." : "Al-Yusr transparency guarantees in Dakahlia & Mansoura: Ministry of Social Solidarity license, independent audit, photo/video proof per donation, field visits."}
        path="/trust"
        image={trustHero}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "الشفافية" : "Trust & Transparency", url: `${base}/trust` },
      ]} />
      {/* Rich JSON-LD: Organization + ImageObject + FAQPage */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["Organization", "NGO"],
              "@id": `${base}/#org`,
              name: "Al-Yusr Charity Foundation",
              alternateName: "مؤسسة اليسر الخيرية",
              url: `${base}/`,
              logo: `${base}/icon-192.png`,
              foundingDate: "2019",
              taxID: "2655/2019",
              areaServed: ["Dakahlia, Egypt", "Mansoura", "Mit Ghamr", "Talkha"],
              hasCredential: [
                { "@type": "EducationalOccupationalCredential", name: "Ministry of Social Solidarity license", identifier: "2655/2019" },
                { "@type": "EducationalOccupationalCredential", name: "Public Benefit Status" },
              ],
            },
            {
              "@type": "ImageObject",
              contentUrl: `${base}${(trustHero as unknown as string)}`,
              caption: isRTL ? "شفافية وتوثيق مؤسسة اليسر" : "Al-Yusr transparency & documentation",
              creditText: "Al-Yusr Charity Foundation",
              copyrightNotice: "© Al-Yusr Charity Foundation",
              creator: { "@type": "Organization", name: "Al-Yusr Charity Foundation", url: "https://elyusr.org/" },
              license: `${base}/terms`,
              acquireLicensePage: `${base}/contact`,
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: isRTL ? "كيف أتأكد أن تبرعي وصل لمستحقه؟" : "How do I verify my donation reached its recipient?",
                  acceptedAnswer: { "@type": "Answer", text: isRTL ? "نرسل لك صور وفيديو توثيق، ويمكنك تنسيق زيارة ميدانية للحالة بنفسك في الدقهلية." : "We send photo/video proof and you can arrange a field visit to the case in Dakahlia." },
                },
                {
                  "@type": "Question",
                  name: isRTL ? "ما هي نسبة الإنفاق على البرامج؟" : "What share of donations goes to programs?",
                  acceptedAnswer: { "@type": "Answer", text: isRTL ? "88% للبرامج الميدانية، 8% لوجستيات، 4% إدارة." : "88% field programs, 8% logistics, 4% administration." },
                },
                {
                  "@type": "Question",
                  name: isRTL ? "هل اليسر مرخصة رسمياً؟" : "Is Al-Yusr officially licensed?",
                  acceptedAnswer: { "@type": "Answer", text: isRTL ? "نعم — إشهار وزارة التضامن الاجتماعي رقم 2655 لسنة 2019، وحاصلون على صفة النفع العام." : "Yes — Ministry of Social Solidarity registration No. 2655/2019, with Public Benefit status." },
                },
                {
                  "@type": "Question",
                  name: isRTL ? "في أي مدن بالدقهلية تعمل اليسر؟" : "Which Dakahlia cities does Al-Yusr serve?",
                  acceptedAnswer: { "@type": "Answer", text: isRTL ? "المنصورة، ميت غمر، طلخا، بلقاس، دكرنس، السنبلاوين، شربين، أجا، المطرية والدقهلية الشرقية، بالإضافة لمحافظة كفر الشيخ." : "Mansoura, Mit Ghamr, Talkha, Belqas, Dikirnis, Sinbillawayn, Sherbin, Aga, Matareya, East Dakahlia and Kafr El Sheikh Governorate." },
                },
              ],
            },
            {
              "@type": "WebPage",
              "@id": `${base}/trust#webpage`,
              url: `${base}/trust`,
              name: isRTL ? "شفافية مؤسسة اليسر بالدقهلية" : "Al-Yusr transparency in Dakahlia",
              speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "h2", ".ai-answer"] },
              primaryImageOfPage: {
                "@type": "ImageObject",
                contentUrl: `${base}${(trustHero as unknown as string)}`,
                creditText: "Al-Yusr Charity Foundation",
                copyrightNotice: "© Al-Yusr Charity Foundation",
                creator: { "@type": "Organization", name: "Al-Yusr Charity Foundation", url: "https://elyusr.org/" },
                license: `${base}/terms`,
                acquireLicensePage: `${base}/contact`,
              },
            },
            {
              "@type": "HowTo",
              name: isRTL ? "إزاي تتأكد بنفسك من وصول تبرعك" : "How to verify your donation reached its recipient",
              totalTime: "PT3M",
              step: [
                { "@type": "HowToStep", position: 1, name: isRTL ? "ادفع برقم مرجعي" : "Donate with reference", text: isRTL ? "كل تبرع بياخد رقم مرجعي تقدر تتبعه أونلاين." : "Every donation gets a reference ID you can track online." },
                { "@type": "HowToStep", position: 2, name: isRTL ? "استلم التوثيق" : "Receive proof", text: isRTL ? "بنبعت لك صور وفيديو التسليم خلال 72 ساعة." : "We send delivery photos/video within 72 hours." },
                { "@type": "HowToStep", position: 3, name: isRTL ? "زر الحالة" : "Visit the case", text: isRTL ? "نسّق معانا زيارة ميدانية للحالة في الدقهلية أو كفر الشيخ." : "Coordinate a field visit to the case in Dakahlia or Kafr El Sheikh." },
              ],
            },
          ],
        })}</script>
      </Helmet>

      <section className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="absolute inset-0 leaf-bg opacity-40" />
        <div className="container relative mx-auto px-4 py-14 md:py-24">
          <div className="text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "الشفافية" : "Trust" }]} />
          </div>
          <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
                <ShieldCheck className="h-3.5 w-3.5" /> {isRTL ? "وعد الشفافية" : "Transparency promise"}
              </span>
              <h1 className="mt-4 max-w-xl text-3xl font-black leading-tight md:text-5xl">
                {isRTL ? "شفافية مؤسسة اليسر بالدقهلية | تتبع تبرعك في المنصورة وميت غمر وطلخا" : "Al-Yusr transparency in Dakahlia | Track your donation in Mansoura, Mit Ghamr & Talkha"}
              </h1>
              <p className="mt-5 max-w-xl text-base text-primary-foreground/85 md:text-lg">
                {isRTL
                  ? "بنفتح أبوابنا لك علشان تتأكد بنفسك من وصول كل قرش لمستحقه — صور، فيديو، تقارير محاسبية، وزيارات ميدانية."
                  : "We open our doors so you can verify every penny reached its rightful recipient — photos, video, audit reports, and field visits."}
              </p>
              {/* AI/voice-search answer block — speakable target. */}
              <p className="ai-answer mt-3 max-w-xl text-sm text-primary-foreground/75">
                {isRTL
                  ? "اليسر مؤسسة خيرية مرخّصة (إشهار 2655/2019) بمقر المنصورة، تخدم الدقهلية الشرقية وميت غمر وطلخا وكفر الشيخ — توثيق صور/فيديو لكل تبرع، 88% للبرامج، ومراجعة محاسبية مستقلة."
                  : "Al-Yusr is a licensed Egyptian NGO (No. 2655/2019) based in Mansoura, serving East Dakahlia, Mit Ghamr, Talkha and Kafr El Sheikh — photo/video proof per donation, 88% to programs, independent audit."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link to="/donate"><Heart className="h-5 w-5" />{isRTL ? "تبرع بثقة" : "Donate with confidence"}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  <a href={wa} target="_blank" rel="noopener"><MessageCircle className="h-5 w-5" />{isRTL ? "اسأل عن أي تبرع" : "Ask about any donation"}</a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-secondary/15 blur-2xl" aria-hidden />
              <img src={trustHero} alt={isRTL ? "شفافية مؤسسة اليسر بالدقهلية والمنصورة — توثيق التبرعات" : "Al-Yusr transparency in Dakahlia & Mansoura — donation documentation"} width={1600} height={900} className="relative w-full rounded-[2rem] border-4 border-secondary/40 object-cover shadow-card" />
            </div>
          </div>
        </div>
      </section>

      {/* Local SEO internal links — Dakahlia cities + relevant programs/campaigns. */}
      <section className="bg-background border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <h2 className="text-base font-black text-primary md:text-lg">
            {isRTL ? "تتبع تبرعك في مدن الدقهلية وكفر الشيخ" : "Track your donation across Dakahlia & Kafr El Sheikh"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            {isRTL ? "كل مدينة وبرنامج له صفحة توثيق مستقلة:" : "Each city & program has its own documentation page:"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { to: "/qurbani/mansoura",     label: isRTL ? "المنصورة" : "Mansoura" },
              { to: "/qurbani/mit-ghamr",    label: isRTL ? "ميت غمر" : "Mit Ghamr" },
              { to: "/qurbani/talkha",       label: isRTL ? "طلخا" : "Talkha" },
              { to: "/qurbani/dikirnis",     label: isRTL ? "الدقهلية الشرقية" : "East Dakahlia" },
              { to: "/qurbani/belqas",       label: isRTL ? "بلقاس" : "Belqas" },
              { to: "/services-map",         label: isRTL ? "خريطة الخدمات" : "Services map" },
              { to: "/programs/odhya",       label: isRTL ? "برنامج الأضحية" : "Qurbani program" },
              { to: "/programs/box",         label: isRTL ? "كرتونة العزومة" : "Food box" },
              { to: "/programs/zakat",       label: isRTL ? "زكاة المال" : "Zakat" },
              { to: "/campaigns",            label: isRTL ? "الحملات النشطة" : "Active campaigns" },
              { to: "/farm",                 label: isRTL ? "المزرعة الوقفية" : "Endowment farm" },
              { to: "/about#achievements",   label: isRTL ? "إنجازاتنا 2025" : "Our 2025 impact" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:border-secondary hover:bg-secondary/25"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black text-primary md:text-4xl">{isRTL ? "أربع طرق تتأكد بنفسك" : "Four ways to verify yourself"}</h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              {isRTL ? "إحنا ما بنطلبش منك تثق فينا — إحنا بنوريك بنفسك." : "We don't ask you to trust us — we let you see for yourself."}
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><p.I className="h-6 w-6" /></div>
                <h3 className="mt-3 font-black text-primary">{p.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verify-yourself proof strip — uses uploaded transparency reference */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2 md:items-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-secondary/15 blur-2xl" aria-hidden />
            <img
              src={trustTransparency}
              alt={isRTL ? "أبواب اليسر مفتوحة لتتأكد بنفسك من شفافية كل تبرع" : "Al-Yusr doors open — verify every donation yourself"}
              loading="lazy"
              className="relative w-full rounded-3xl border-4 border-secondary/30 object-cover shadow-card"
            />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <ShieldCheck className="h-3.5 w-3.5" /> {isRTL ? "العنوان: ثقتك أمانة.. وشفافيتنا هي الضمان" : "Headline: Your trust is a trust — transparency is the guarantee"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "بنفتح أبوابنا لك لتتأكد بنفسك" : "Our doors are open — verify it yourself"}
            </h2>
            <ol className="mt-4 space-y-3 text-sm font-semibold text-foreground/90">
              <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-black text-primary">1</span>
                <span><b className="text-primary">{isRTL ? "الزيارة الميدانية: " : "Field visit: "}</b>{isRTL ? "نسّق لك زيارة الحالة اللي تبرعت لها بنفسك لترى أثر مالك." : "We coordinate a personal visit to the case you supported."}</span></li>
              <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-black text-primary">2</span>
                <span><b className="text-primary">{isRTL ? "التوثيق المرئي: " : "Visual proof: "}</b>{isRTL ? "نوثق كل مشروع بفيديو وصور ونرسلها لك أو ننشرها (مع الحفاظ على كرامة الحالة)." : "We document every project with video and photos — sent to you or published with dignity preserved."}</span></li>
              <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-black text-primary">3</span>
                <span><b className="text-primary">{isRTL ? "تطوع عائلتك: " : "Family volunteering: "}</b>{isRTL ? "نرحب بمشاركة أطفالك وشبابك في قوافل التوزيع ليروا قيمة الخير على أرض الواقع." : "Bring your kids to distribution convoys to see giving in action."}</span></li>
              <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-black text-primary">4</span>
                <span><b className="text-primary">{isRTL ? "الاستلام المباشر: " : "Direct hand-off: "}</b>{isRTL ? "يمكنك إيصال تبرعك العيني بنفسك للمقر أو للحالة مباشرة بإشرافنا." : "Deliver your in-kind donation in person under our supervision."}</span></li>
            </ol>
            <p className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm font-bold text-primary">
              {isRTL ? "آلاف المتبرعين وثقوا بنا لأننا مشهرون رسمياً ونعمل تحت رقابة وزارة التضامن الاجتماعي." : "Thousands of donors trust us — we're officially registered and operate under the Ministry of Social Solidarity's oversight."}
            </p>
          </div>
        </div>
      </section>

      {/* Real example: Markoun salary envelope = real, dignified hand-off */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[1fr_1.2fr] md:items-center">
          <img
            src={markounSalary}
            alt={isRTL ? "مندوب اليسر يسلّم مرتب شهري لأسرة متعففة في المنصورة" : "Al-Yusr rep delivering a monthly stipend to a needy family in Mansoura"}
            loading="lazy"
            className="aspect-[4/5] w-full rounded-3xl border border-border object-cover shadow-card"
          />
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold text-accent">
              <HandHeart className="h-3.5 w-3.5" /> {isRTL ? "مثال حي — حملة مركون" : "Real example — Markoun"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "مرتب شهري يصل ليد الأسرة بظرف مغلق" : "A monthly stipend handed to the family in a sealed envelope"}
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              {isRTL
                ? "في حملة مركون بنسلّم المرتب الشهري للأسر المتعففة شخصياً، بظرف مغلق وكامل الكرامة، مع إيصال موقّع وصور توثيقية تصل للمتبرع."
                : "In the Markoun campaign we hand the monthly stipend to needy families personally — a sealed envelope, full dignity, signed receipt and proof photos sent to the donor."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to="/campaigns/markoun"><Heart className="h-4 w-4" />{isRTL ? "تبرع لحملة مركون" : "Donate to Markoun"}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/donate/track">{isRTL ? "تتبع تبرعك" : "Track your donation"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Allocation chart */}
      <section className="bg-muted/30 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <Eye className="h-3.5 w-3.5" /> {isRTL ? "خطة الإنفاق 2025" : "2025 spending plan"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">{isRTL ? "فين بيروح كل جنيه؟" : "Where does every pound go?"}</h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              {isRTL ? "نسبة 88% من تبرعاتك بتروح مباشرة للبرامج الميدانية." : "88% of your donations go directly to field programs."}
            </p>
          </div>
          <div className="mt-10 grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
            {allocation.map((a) => (
              <div key={a.en}>
                <div className="mb-1.5 flex items-center justify-between text-sm font-extrabold text-primary">
                  <span>{isRTL ? a.ar : a.en}</span>
                  <span className="font-mono text-secondary">{a.pct}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`${a.color} h-full rounded-full`} style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black text-primary md:text-4xl">{isRTL ? "وثائقنا الرسمية" : "Our official documents"}</h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              {isRTL ? "كل وثيقة متاحة للتحقق وللتحميل عند الطلب." : "Every document is available for verification and download upon request."}
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {docs.map((d) => (
              <div key={d.t} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary"><BadgeCheck className="h-6 w-6" /></div>
                <div className="flex-1">
                  <h3 className="font-black text-primary">{d.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.d}</p>
                  <a href={`https://wa.me/201097000137?text=${encodeURIComponent(isRTL ? `عايز نسخة من: ${d.t}` : `I'd like a copy of: ${d.t}`)}`} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1.5 text-sm font-extrabold text-accent hover:text-secondary">
                    <Download className="h-4 w-4" />{isRTL ? "اطلب نسخة" : "Request a copy"} <Arrow className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الأرقام والنتائج — Numbers & results */}
      <section className="bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <BadgeCheck className="h-3.5 w-3.5" /> {isRTL ? "الأرقام والنتائج 2025" : "Numbers & results 2025"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">
              {isRTL ? "أثر موثّق بالأرقام داخل الدقهلية" : "Documented impact across Dakahlia"}
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              {isRTL ? "كل رقم بيقابله ملف توثيق وصور ميدانية من المنصورة وميت غمر وطلخا وبلقاس." : "Every number is backed by a documentation file and field photos from Mansoura, Mit Ghamr, Talkha and Belqas."}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { n: "9,520", ar: "أسرة مستفيدة", en: "Families served" },
              { n: "1,100+", ar: "كرتونة شهرية بالمنصورة", en: "Monthly boxes in Mansoura" },
              { n: "4 طن", en2: "4 tons", ar: "لحوم وُزعت في العيد", en: "Eid meat distributed" },
              { n: "70", ar: "بيت تم تسقيفه — كفر الشيخ", en: "Roofs rebuilt — Kafr El Sheikh" },
            ].map((s, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-5 text-center shadow-soft">
                <div className="font-mono text-2xl font-black text-secondary md:text-3xl">{s.en2 && !isRTL ? s.en2 : s.n}</div>
                <div className="mt-1 text-xs font-extrabold text-foreground/85 md:text-sm">{isRTL ? s.ar : s.en}</div>
              </div>
            ))}
          </div>
          <ul className="mx-auto mt-8 grid max-w-4xl gap-2 text-sm font-semibold text-foreground/85 md:grid-cols-2">
            {(isRTL ? [
              "الدقهلية الشرقية — قوافل إطعام دورية على مدار السنة",
              "كفر الشيخ — 70 بيت تم تسقيفه ضمن سكن كريم",
              "الفيوم — بناء وترميم المساجد والكتاتيب",
              "المنيا — حفر آبار وشبكات مياه نظيفة",
              "القاهرة — حالات عاجلة وقوافل إطعام دورية",
              "المنصورة وميت غمر وطلخا — مقر المؤسسة والمجمّع الطبي",
            ] : [
              "East Dakahlia — year-round food convoys",
              "Kafr El Sheikh — 70 homes re-roofed under Dignified Shelter",
              "Fayoum — mosque and Qur'an-school construction & restoration",
              "Minya — wells and clean-water networks",
              "Cairo — emergency cases and rolling food convoys",
              "Mansoura, Mit Ghamr & Talkha — HQ and medical complex",
            ]).map((x) => (
              <li key={x} className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{x}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline"><Link to="/about#achievements">{isRTL ? "كل إنجازاتنا 2025" : "All 2025 achievements"}</Link></Button>
            <Button asChild variant="outline"><Link to="/services-map">{isRTL ? "خريطة الخدمات" : "Services map"}</Link></Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-14 text-primary-foreground md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-black md:text-3xl">{isRTL ? "تبرعك بيوصل… ومتابعتك بتفرق" : "Your donation arrives — your follow-up matters"}</h2>
          <p className="mt-3 text-primary-foreground/85 md:text-lg">
            {isRTL ? "احجز تبرعك واستقبل رقم تتبع فوري مع توثيق ميداني كامل." : "Reserve your donation and receive an instant tracking number with full field documentation."}
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

      {/* كيف تتم العملية — Donor verification process */}
      <section className="bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <Eye className="h-3.5 w-3.5" /> {isRTL ? "كيف تتم العملية" : "How it works"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">
              {isRTL ? "من تبرعك حتى وصول الأثر — 4 خطوات شفافة" : "From your donation to verified impact — 4 transparent steps"}
            </h2>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(isRTL
              ? [
                  { I: MousePointerClick, t: "اختر الباب", d: "حدّد الحالة أو البرنامج (كفالة، علاج، سداد ديون، صك أضحية)." },
                  { I: Heart,             t: "تبرّع بأمان",  d: "بطاقة بنكية، فودافون كاش، إنستا باي، أو تحويل بنكي مباشر." },
                  { I: Search,            t: "تتبّع رقمك",   d: "كل تبرع له رقم مرجعي يعرض حالته من المعالجة لحد التسليم." },
                  { I: Verify,            t: "استلم التوثيق", d: "صور وفيديو من المنصورة وميت غمر وطلخا — وزيارة ميدانية لو حابب." },
                ]
              : [
                  { I: MousePointerClick, t: "Pick a cause",  d: "Select case or program (sponsorship, treatment, debt relief, Qurbani)." },
                  { I: Heart,             t: "Donate safely", d: "Card, Vodafone Cash, InstaPay, or direct bank transfer." },
                  { I: Search,            t: "Track by ref",  d: "Every donation has a reference showing real-time status." },
                  { I: Verify,            t: "Receive proof", d: "Photos & video from Mansoura, Mit Ghamr & Talkha — plus field visits on request." },
                ]
            ).map((s, i) => (
              <li key={i} className="relative rounded-3xl border border-border bg-card p-5 shadow-soft">
                <span className={`absolute -top-3 ${isRTL ? "right-5" : "left-5"} grid h-7 w-7 place-items-center rounded-full bg-secondary text-[12px] font-black text-primary shadow-soft`}>{i + 1}</span>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><s.I className="h-6 w-6" /></div>
                <h3 className="mt-3 font-black text-primary">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* نماذج توثيق — Proof gallery */}
      <section className="bg-muted/30 py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold text-accent">
              <Camera className="h-3.5 w-3.5" /> {isRTL ? "نماذج توثيق" : "Documentation samples"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">
              {isRTL ? "صور حقيقية من قوافلنا في الدقهلية" : "Real photos from our Dakahlia convoys"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {isRTL ? "كل تبرع يصاحبه دليل بصري — يصل لك مع رقم المتابعة." : "Every donation includes visual proof — sent with your tracking reference."}
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { src: markounSalary,        alt: isRTL ? "تسليم مرتب شهري لأسرة متعففة بالمنصورة" : "Monthly stipend hand-off in Mansoura" },
              { src: posterDelivery,      alt: isRTL ? "توصيل أدوية لمريضة كبيرة في السن (بديل)" : "Medication delivery — poster (replacement)" },
              { src: posterMedBottle,     alt: isRTL ? "تجهيز أدوية مزمنة شهرية (بديل)" : "Monthly chronic meds — poster (replacement)" },
              { src: markounWardrobe,      alt: isRTL ? "تجهيز دولاب لطفلة في حملة مركون" : "Wardrobe set up for a child — Markoun" },
              { src: qurbaniMeatTrays,     alt: isRTL ? "صكوك أضحية موثّقة ومعلّبة" : "Documented & packed Qurbani shares" },
              { src: takrimVan,            alt: isRTL ? "سيارة تكريم الإنسان توصل الصكوك للبيوت" : "Honor-the-Human van delivering aid" },
            ].map((g, i) => (
              <figure key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                <img src={g.src} alt={g.alt} loading="lazy" className="aspect-square w-full object-cover transition hover:scale-105" />
                <figcaption className="p-2 text-center text-[11px] font-bold text-muted-foreground">{g.alt}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline"><Link to="/gallery">{isRTL ? "معرض الصور الكامل" : "Full gallery"}</Link></Button>
            <Button asChild variant="outline"><Link to="/stories">{isRTL ? "قصص الأثر" : "Impact stories"}</Link></Button>
          </div>
        </div>
      </section>

      <LocalFAQ
        donateHref="/donate"
        title={isRTL ? "أسئلة شائعة عن الشفافية وتتبع التبرع" : "Transparency & donation tracking FAQs"}
        intro={isRTL ? "كل ما يخص توثيق التبرع، الترخيص، والتقارير المالية لمؤسسة اليسر بالدقهلية والمنصورة." : "Everything about donation proof, licensing, and financials for Al-Yusr in Dakahlia & Mansoura."}
        items={isRTL ? [
          { q: "هل مؤسسة اليسر مرخّصة رسميًا في مصر؟", a: "أيوه، اليسر مشهرة بوزارة التضامن الاجتماعي تحت رقم 2655 لسنة 2019، وحاصلة على صفة النفع العام، ومقرها الرئيسي في المنصورة بالدقهلية." },
          { q: "إزاي أتتبع تبرعي بعد ما أدفع؟", a: "بتوصلك رسالة وإيميل فيهم رقم متابعة، تقدر تستخدمه في صفحة /donation-tracking لمعرفة حالة التبرع وصور التسليم لحظة بلحظة." },
          { q: "إيه نسبة المصاريف الإدارية من تبرعي؟", a: "أقل من 8% من إجمالي التبرعات بتذهب للمصاريف الإدارية، والباقي بيوصل للمستحقين فعليًا — والتقرير المحاسبي السنوي متاح للتحميل من صفحة الشفافية." },
          { q: "هل أقدر أزور حالة تبرعت لها بنفسي؟", a: "أيوه، بننسّق مع المتبرعين زيارات ميدانية للحالات في المنصورة وميت غمر وطلخا والقرى المحيطة، مع الحفاظ على كرامة الأسرة." },
          { q: "مين بيراجع حسابات اليسر سنويًا؟", a: "مكتب محاسبة قانونية مستقل بيراجع كل التقارير المالية سنويًا، والنتائج بتتنشر في تقرير الأثر السنوي على الموقع." },
          { q: "هل بتشتغلوا في محافظات تانية غير الدقهلية؟", a: "أيوه، اليسر بتنفّذ مشاريع في كفر الشيخ والفيوم والمنيا والقاهرة، لكن المقر الرئيسي والمزرعة الوقفية في الدقهلية." },
        ] : [
          { q: "Is Al-Yusr officially licensed in Egypt?", a: "Yes — registered with the Ministry of Social Solidarity under No. 2655/2019, granted public-benefit status, and headquartered in Mansoura, Dakahlia." },
          { q: "How do I track my donation after paying?", a: "You receive an SMS/email with a tracking reference. Use it on /donation-tracking to see delivery status and photos in real time." },
          { q: "What percentage goes to admin costs?", a: "Under 8% of total donations covers admin; the rest reaches beneficiaries. The annual audit is downloadable from the Transparency page." },
          { q: "Can I personally visit a case I supported?", a: "Yes — we coordinate donor field visits in Mansoura, Mit Ghamr, Talkha and surrounding villages, while preserving family dignity." },
          { q: "Who audits Al-Yusr's accounts?", a: "An independent licensed accounting firm audits the annual financials, published in our annual impact report." },
          { q: "Do you operate outside Dakahlia?", a: "Yes — we run projects in Kafr El Sheikh, Fayoum, Minya and Cairo, but our HQ and endowment farm are in Dakahlia." },
        ]}
      />

      <StickyQurbaniCTA donateHref="/qurbani" />
    </PageLayout>
  );
};

export default Trust;