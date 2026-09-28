import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Truck,
  Sparkles,
  Phone,
  Building2,
  MapPin,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Tv,
  Sofa,
  Shirt,
  BookOpen,
  Pill,
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Copy,
  Check,
  Database,
  HeartHandshake,
  Layers,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { Helmet } from "react-helmet-async";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

import posterFurniture from "@/assets/markoun-poster-furniture.png";
import posterClothes from "@/assets/markoun-poster-clothes.png";
import posterMeds from "@/assets/markoun-poster-meds.png";
import posterDelivery from "@/assets/markoun-poster-delivery.png";
import posterMedBottle from "@/assets/markoun-poster-medbottle.png";
import markounFurniture from "@/assets/markoun-furniture.jpg";
import asasMarqun from "@/assets/asas-marqun.jpg";

const PILLARS_DATA = [
  {
    id: "furniture",
    titleAr: "الأثاث المنزلي",
    titleEn: "Home Furniture",
    subtitleAr: "أثاثك القديم عاش معاك قصة وهيبدأ قصة جديدة في حياة أسرة تانية",
    subtitleEn: "Your old furniture had a story with you, and will start a new life for another family",
    descAr: "نجمع القطع الفائضة عن حاجتكم (غرف نوم، سرير، خزائن، كنب، طاولات ومطابخ) لنساهم في تجهيز البيوت الفقيرة ومساندة مشروعات الزواج وتأسيس منازل مستقرة، لترفع أهالينا المستحقين من النوم على الأرض إلى الستر والراحة التامة.",
    descEn: "We collect surplus furniture (bedroom sets, beds, wardrobes, tables) to furnish needy homes, support marriage aid, and restore dignity.",
    icon: Sofa,
    tagAr: "تأسيس منازل مستقرة",
    tagEn: "Home Furnishing",
  },
  {
    id: "appliances",
    titleAr: "الأجهزة الكهربائية",
    titleEn: "Home Appliances",
    subtitleAr: "كل جهاز كهربائي مركون في بيتك لو تبرعت بيه هيكون صدقة جارية",
    subtitleEn: "Every idle appliance in your home becomes an ongoing charity",
    descAr: "نستقبل (الثلاجات، الغسالات، البوتاجازات، المراوح، الشاشات، السخانات والمكاوى) لإدخال الطمأنينة والتسهيلات الحياتية لبيوت أسر بسيطة بحاجة ماسة لها بعد فحصها وصيانتها بورش المؤسسة.",
    descEn: "We receive washers, fridges, stoves, and fans, restoring them in specialized workshops before delivery.",
    icon: Tv,
    tagAr: "صدقة جارية تنبض بالحياة",
    tagEn: "Ongoing Charity",
  },
  {
    id: "clothes",
    titleAr: "الملابس والكساء",
    titleEn: "Clothing & Garments",
    subtitleAr: "المركون في دولابك ستر لغيرك وقصة جديدة من الدفء",
    subtitleEn: "What is idle in your wardrobe is dignity for another",
    descAr: "نجمع الملابس المستعملة بحالة جيدة، لنقوم بفرزها، تنظيفها، وكيها وإعادة تقديمها بكرامة تامة للأسر والأطفال كـ «قصة جديدة» من الدفء والستر تليق بأهالينا المتعففين.",
    descEn: "Surplus quality garments are carefully sorted, cleaned, and presented with utmost dignity to underprivileged children and parents.",
    icon: Shirt,
    tagAr: "ستر وفرحة حقيقية",
    tagEn: "Warmth & Dignity",
  },
  {
    id: "meds",
    titleAr: "الصيدلية المستدامة (الأدوية)",
    titleEn: "Sustainable Medicine Bank",
    subtitleAr: "علاجك الفائض طوق نجاة لمريض غير قادر على ثمن الدواء",
    subtitleEn: "Your surplus medicine is a lifeline for struggling patients",
    descAr: "نجمع الأدوية الفائضة والصالحة للاستخدام من الصيدليات المنزلية، ليتم فحصها وتصنيفها تحت إشراف طبي وصيدلي دقيق وتوزيعها مجاناً بالكامل على المرضى غير القادرين على توفير تكلفة العلاج الشهري.",
    descEn: "We collect valid, unexpired household medications, medically inspecting and distributing them completely free to impoverished patients.",
    icon: Pill,
    tagAr: "رعاية صحية مجانية",
    tagEn: "Medical Aid",
  },
  {
    id: "books",
    titleAr: "المعرفة والتعليم (الكتب)",
    titleEn: "Educational Knowledge (Books)",
    subtitleAr: "كتاب ابنك فرصة لمستقبل ابن غيرك وطوق نجاة من الفقر",
    subtitleEn: "Your child's book is an opportunity for another student's bright future",
    descAr: "نستقبل الكتب المدرسية، الثقافية، والتعليمية لإعادة تدوير المعرفة وتوزيعها على الطلاب غير القادرين وتأسيس مكتبات بالقرى لإنقاذ الطلاب من خطر التسرب الدراسي.",
    descEn: "We collect textbooks and references to reuse knowledge and equip students from low-income households with essential study tools.",
    icon: BookOpen,
    tagAr: "دعم تعليم وتدوير معرفة",
    tagEn: "Education Lifeline",
  },
];

const ADVANTAGES_DATA = [
  {
    id: "data",
    icon: Database,
    titleAr: "القضاء على العشوائية",
    titleEn: "Zero Waste & Precision",
    descAr: "نعتمد على نظام رقمي وقواعد بيانات دقيقة ومحدثة تضمن ذهاب كل قطعة تبرع عيني إلى مكانها الصحيح والأنسب لاحتياج الأسرة الفعلي.",
    descEn: "Digital field databases guarantee every in-kind item matches the exact, validated needs of verified households.",
  },
  {
    id: "dignity",
    icon: HeartHandshake,
    titleAr: "حفظ كرامة المتلقي",
    titleEn: "Preserving Dignity",
    descAr: "نحن نؤمن أن جودة العطاء من جودة التعامل؛ لذا تمر كل التبرعات بمراحل فحص وتأهيل وصيانة وتنظيف دقيقة لتصل للمستفيدين وكأنها جديدة تماماً.",
    descEn: "All items undergo thorough repair, refurbishing, and cleaning so they reach recipient homes in pristine, dignified condition.",
  },
  {
    id: "doorstep",
    icon: Truck,
    titleAr: "راحة المتبرع (مندوب لحد الباب)",
    titleEn: "Doorstep Pickup Convenience",
    descAr: "وفرنا منظومة لوجستية متكاملة؛ لست بحاجة للتحرك من منزلك، بمجرد تواصلك معنا يتوجه مندوبنا الرسمي بسيارات المؤسسة لاستلام وتوثيق التبرع.",
    descEn: "Our official logistics vans collect items directly from your home with zero hassle, scheduled at your convenience.",
  },
];

const FAQS_DATA = [
  {
    q_ar: "إيه يعني حملة مَرْكون وليه أشارك فيها؟",
    q_en: "What is the Markoun campaign and why participate?",
    a_ar: "بعد دراسة ميدانية وجدنا أن من كل 10 بيوت في 4 بيوت فيهم كنوز مركونة لو تم استغلالها بشكل صحيح هتبني حياة لأسرة كاملة. حملة مركون هي أول حملة مصرية منظمة لإعادة استخدام واستغلال كل المركون في منزلك (أثاث، أجهزة، ملابس، أدوية، كتب) لتغيير حياة أسر مستحقة من الفقر للراحة والأمان.",
    a_en: "Studies show 4 out of 10 homes contain idle treasures. Markoun is Egypt's first organized campaign to repurpose surplus items and rebuild lives.",
  },
  {
    q_ar: "إزاي أتبرع بالمركون عندي ومين بيستلمه؟",
    q_en: "How do I donate my items and who collects them?",
    a_ar: "كل اللي عليك تعمله: ابعت كلمة «تبرع» في رسالة واتساب على 01097000137 أو اتصل بنا، وهيوصلك مندوبنا بسيارة المؤسسة المجهزة لحد باب منزلك ليستلم منك كل المركون بكل رقي وسهولة وبدون أي مجهود منك.",
    a_en: "Simply text 'Donate' via WhatsApp to 01097000137, and our representative will collect the items directly from your doorstep.",
  },
  {
    q_ar: "هل الاستلام من باب البيت بيكلفني أي رسوم أو مصاريف؟",
    q_en: "Are there any pickup fees?",
    a_ar: "الاستلام من باب منزلك والتوصيل لبيوت الأسر مجاني تماماً 100% وبدون أي مقابل على المتبرع أو الأسرة المستفيدة.",
    a_en: "Pickup and delivery are 100% free with zero fees.",
  },
  {
    q_ar: "هل تقبلون الأجهزة أو الأثاث اللي محتاج صيانة أو تنظيف؟",
    q_en: "Do you accept items needing repair?",
    a_ar: "نعم! مؤسسة اليسر تمتلك ورش صيانة وترميم متخصصة؛ سياراتنا تنقل المساهمات مباشرة للترميم والتصليح والتنظيف قبل تسليمها وفرشها داخل منازل أهالينا المستحقين.",
    a_en: "Yes! Al-Yusr has dedicated workshops that repair, clean, and restore items before delivering them.",
  },
  {
    q_ar: "ما هي شروط التبرع بالأدوية الفائضة؟",
    q_en: "What are the rules for medicine donations?",
    a_ar: "نستقبل كافة الأدوية الفائضة بشرط أن تكون داخل عبواتها الأصلية وسارية الصلاحية؛ حيث تخضع للمعاينة والفرز من صيادلة المؤسسة قبل صرفها مجاناً للمرضى.",
    a_en: "Medications must be in original blister/packaging with valid expiry dates, inspected by pharmacists before dispensing.",
  },
  {
    q_ar: "هل ممكن أتبرع بمبلغ مالي لو معنديش حاجة مركونة؟",
    q_en: "Can I donate money if I don't have surplus items?",
    a_ar: "نعم بالتأكيد! لمن ليس لديه مركون ويرغب في المساهمة في نفقات صيانة وترميم ونقل الأجهزة والأثاث وشراء النواقص، متاح التبرع عبر حساب CIB رقم 100043605733 أو عبر نموذج التبرع الإلكتروني بالموقع.",
    a_en: "Yes, financial donations supporting repair and transport costs are welcomed via CIB account 100043605733 or our online donation portal.",
  },
];

const MarkounLanding = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const base = "https://elyusr.org";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [copiedBank, setCopiedBank] = useState(false);
  const [hideSticky, setHideSticky] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setScrolledPastHero(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const footerEl = document.querySelector("footer") || document.querySelector("#contact");
    if (!footerEl) {
      return () => window.removeEventListener("scroll", handleScroll);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setHideSticky(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: "60px 0px 0px 0px" }
    );
    observer.observe(footerEl);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const copyBankNumber = () => {
    navigator.clipboard.writeText("100043605733");
    setCopiedBank(true);
    toast.success(isRTL ? "تم نسخ رقم الحساب البنكي (CIB)" : "CIB account copied");
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const waDonateText = encodeURIComponent(
    isRTL
      ? "تبرع - أرغب بالتبرع بمركون من منزلي (أثاث / أجهزة / ملابس / أدوية / كتب) ضمن حملة مركون"
      : "Donate - I want to donate surplus items (furniture / appliances / clothes / meds / books) via Markoun"
  );
  const waUrl = `https://wa.me/201097000137?text=${waDonateText}`;

  return (
    <PageLayout>
      <SEOHelmet
        title={
          isRTL
            ? "حملة مَرْكون — أول حملة مصرية تُحيي أُسرة بالمركون في بيتك | مؤسسة اليسر الخيرية"
            : "Markoun Campaign — What's Idle at Home is Life for Another | Al-Yusr"
        }
        description={
          isRTL
            ? "حملة مَرْكُون: كنزك المركون يبني حياة لغيرك. أول حملة مصرية منظمة لإعادة استخدام الأثاث المنزلي، الأجهزة الكهربائية، الملابس، الصيدلية المستدامة، والكتب. مندوبنا يصلك لباب بيتك مجاناً بالمنصورة والدقهلية: 01097000137."
            : "Markoun Campaign: Egypt's premier in-kind reuse initiative. Repurposing surplus furniture, electronics, clothing, medicine, and books with free doorstep pickup across Mansoura & Dakahlia."
        }
        path="/markoun"
        image={posterFurniture}
        keywords={
          isRTL
            ? "حملة مركون, تبرع بالاثاث المنزلي المنصورة, تبرع بالأجهزة الكهربائية المستعملة, تبرع بالملابس المستعملة الدقهلية, صيدلية خيرية مجانية المنصورة, مندوب استلام تبرعات من المنزل, مؤسسة اليسر الخيرية, جمعية اليسر المنصورة"
            : "Markoun campaign, in-kind donation Egypt, furniture donation Mansoura, used appliances charity, free medicine bank Egypt, Al-Yusr Charity"
        }
      />

      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
          { name: isRTL ? "حملات ومبادرات اليسر" : "Campaigns", url: `${base}/campaigns` },
          { name: isRTL ? "حملة مَرْكون" : "Markoun Campaign", url: `${base}/markoun` },
        ]}
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "حملة مَرْكُون للتبرعات العينية وإعادة التدوير",
            alternateName: "حملة مركون",
            provider: {
              "@type": "NGO",
              name: "مؤسسة اليسر الخيرية للتنمية",
              alternateName: "مؤسسة اليسر",
              url: "https://elyusr.org/",
              telephone: "+201097000137",
              taxID: "2665/2019",
            },
            serviceType: "استلام وتجديد وتوزيع التبرعات العينية (أثاث، أجهزة، ملابس، أدوية، كتب)",
            areaServed: ["Mansoura", "Dakahlia", "Egypt"],
            availableChannel: {
              "@type": "ServiceChannel",
              servicePhone: {
                "@type": "ContactPoint",
                telephone: "+201097000137",
                contactType: "customer service",
              },
            },
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="pattern-hero-luxe hero-pattern-fade relative isolate overflow-hidden text-primary-foreground">
        <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-35" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(150_55%_28%/0.4),transparent_60%)]" />

        <div className="container relative mx-auto max-w-6xl px-4 py-10 md:py-16">
          <div className="flex justify-center text-primary-foreground/75 md:justify-start">
            <Breadcrumbs
              items={[
                { name: isRTL ? "الرئيسية" : "Home", href: "/" },
                { name: isRTL ? "الحملات" : "Campaigns", href: "/campaigns" },
                { name: isRTL ? "حملة مَرْكون" : "Markoun" },
              ]}
            />
          </div>

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-12">
            {/* Hero Copy */}
            <div className="text-center lg:col-span-7 lg:text-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary-foreground backdrop-blur shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                {isRTL ? "أول حملة مصرية.. تُحيي أُسرة بالمركون في بيتك" : "First Egyptian campaign for surplus items"}
              </span>

              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:leading-[1.2]">
                {isRTL ? (
                  <>
                    كنزك المركون.. <br className="hidden sm:block" />
                    <span className="text-gradient-lime">يبني حياة لغيرك!</span>
                  </>
                ) : (
                  <>
                    What's idle in your home.. <br className="hidden sm:block" />
                    <span className="text-gradient-lime">builds a new life for another!</span>
                  </>
                )}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/90 sm:text-base md:text-lg">
                {isRTL
                  ? "في زوايا بيوتنا الكثير من الأشياء التي لم نَعد نستخدمها، ولكنها بالنسبة لأسر أخرى تُمثّل حلماً طال انتظاره. نحن لا نجمع مجرد أغراض فائضة، بل نعيد صياغة الأمل وننقل الدفء والاستقرار من بيوتكم إلى بيوت أهالينا المستحقين."
                  : "In every home there are idle belongings that represent a lifelong dream for struggling families. We don't just collect surplus items; we restore hope and transfer comfort directly into deserving households."}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 lg:justify-start w-full max-w-md mx-auto lg:mx-0">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--whatsapp,142_70%_42%))] px-5 sm:px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg transition hover:brightness-105 text-center leading-normal"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  <span>{isRTL ? "طلب مندوب استلام" : "Request Courier"}</span>
                </a>

                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto flex-1 rounded-full bg-orange-grad px-5 sm:px-6 py-3 text-xs sm:text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95 text-center leading-normal h-auto min-h-[44px]"
                >
                  <Link to="/donate?program=markoun">
                    <Heart className="h-4 w-4 shrink-0" />
                    <span>{isRTL ? "دعم نفقات الصيانة والنقل" : "Support Repair Fund"}</span>
                  </Link>
                </Button>
              </div>

              {/* Quick Info Badges */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-black text-primary-foreground/85 lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                  <Phone className="h-3.5 w-3.5 text-accent" />
                  <a href="tel:01097000137" dir="ltr">01097000137</a>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                  <Truck className="h-3.5 w-3.5 text-secondary" />
                  {isRTL ? "استلام مجاني لباب البيت" : "Free Doorstep Pickup"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                  {isRTL ? "مشهرة برقم 2665 لسنة 2019" : "Licensed NGO 2665/2019"}
                </span>
              </div>
            </div>

            {/* Hero Visual Poster */}
            <div className="relative lg:col-span-5">
              <div className="relative mx-auto max-w-md overflow-hidden rounded-[2.5rem] border-4 border-white/20 bg-card shadow-2xl">
                <img
                  src={posterFurniture}
                  alt={isRTL ? "بوستر حملة مركون - مؤسسة اليسر الخيرية" : "Markoun Campaign Poster"}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slogan Banner */}
      <section className="bg-primary/95 py-6 text-primary-foreground border-y border-secondary/30">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <p className="text-base sm:text-xl md:text-2xl font-black text-secondary tracking-wide">
            {isRTL ? "«اجعل من كركبة بيتك.. خطوة لـ عمار بيت غيرك»" : "'Transform household clutter into comfort for another home'"}
          </p>
        </div>
      </section>

      {/* 5 Main Pillars */}
      <section className="pattern-programs py-12 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <Layers className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "محاور ومستهدفات الحملة (ماذا نجمع؟)" : "What You Can Donate"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl md:text-4xl">
              {isRTL
                ? "خمسة مسارات شاملة لتغطية كافة الاحتياجات الأساسية للحياة الكريمة"
                : "Five Core Tracks Covering All Essential Needs"}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base">
              {isRTL
                ? "تتحرك حملة مركون بشكل شامل لتغطية كافة الاحتياجات الأساسية لعيش حياة كريمة عبر خمسة محاور رئيسية:"
                : "Markoun operates across five key tracks to fulfill every aspect of dignified living:"}
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS_DATA.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-card md:p-7"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-black text-secondary">
                        {isRTL ? p.tagAr : p.tagEn}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black text-primary md:text-2xl">
                      {isRTL ? p.titleAr : p.titleEn}
                    </h3>

                    <div className="mt-1 text-xs font-black text-accent md:text-sm">
                      {isRTL ? p.subtitleAr : p.subtitleEn}
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {isRTL ? p.descAr : p.descEn}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-secondary transition"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      {isRTL ? `طلب مندوب لـ ${p.titleAr}` : `Donate ${p.titleEn}`}
                      <Arrow className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Donate to Markoun */}
      <section className="bg-muted/40 py-12 md:py-20 border-y border-border/60">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "ضمان الأثر والأمانة" : "Why Choose Markoun"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl md:text-4xl">
              {isRTL ? "لماذا تتبرع لـ «مركون»؟" : "Why Donate to Markoun?"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {isRTL
                ? "عندما تختار التبرع لحملة مركون، فإنك تضمن أعلى مستويات الاحترافية والأمان:"
                : "Your donation is handled with absolute institutional diligence and care:"}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ADVANTAGES_DATA.map((adv) => {
              const Icon = adv.icon;
              return (
                <div
                  key={adv.id}
                  className="relative rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft text-center sm:text-start"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-primary shadow-sm mx-auto sm:mx-0">
                    <Icon className="h-6 w-6 text-secondary" />
                  </span>
                  <h3 className="mt-5 text-lg sm:text-xl font-black text-primary">
                    {isRTL ? adv.titleAr : adv.titleEn}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {isRTL ? adv.descAr : adv.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <Truck className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "آلية المشاركة وسهولة الإجراءات" : "How It Works"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl md:text-4xl">
              {isRTL ? "خطوات بسيطة ليصلك مندوبنا" : "Simple Steps to Participate"}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {isRTL
                ? "منظومة مريحة تضمن استلام المركون من باب بيتك وتوصيله بكامل الكرامة لأهالينا."
                : "Effortless process ensuring safe doorstep pickup and dignified family delivery."}
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                titleAr: "أرسل كلمة «تبرع»",
                titleEn: "Send 'Donate'",
                descAr: "أرسل رسالة بكلمة «تبرع» على واتساب أو اتصل برقم 01097000137 وحدد نوع المركون عندك.",
                descEn: "Send 'Donate' via WhatsApp or phone call."
              },
              {
                step: "2",
                titleAr: "مندوبنا عند باب بيتك",
                titleEn: "Doorstep Pickup",
                descAr: "سيارات المؤسسة المجهزة تصل أمام باب منزلك لاستلام الأغراض مجاناً وبكل احترام ورقي.",
                descEn: "Our courier collects your items directly from your home for free."
              },
              {
                step: "3",
                titleAr: "ورش الصيانة والترميم",
                titleEn: "Refurbish & Restore",
                descAr: "تدخل القطع ورش المؤسسة للتنظيف، الصيانة، وتغيير التالف لترجع بحالة ممتازة تليق بأهالينا.",
                descEn: "Workshops inspect, repair, and clean all items thoroughly."
              },
              {
                step: "4",
                titleAr: "التسليم والتوثيق الميداني",
                titleEn: "Documented Delivery",
                descAr: "تُسلّم وتُفرش داخل منازل الأسر الأكثر استحقاقاً مع توثيق مصور يوضح فرحتهم والأثر المحقق.",
                descEn: "Furnished directly inside beneficiary homes with full reporting."
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative rounded-3xl border border-border bg-card p-6 shadow-soft text-center sm:text-start"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-grad font-mono text-base font-black text-accent-foreground shadow-cta mx-auto sm:mx-0">
                  {s.step}
                </span>
                <h3 className="mt-4 text-base font-black text-primary">
                  {isRTL ? s.titleAr : s.titleEn}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                  {isRTL ? s.descAr : s.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Official Contact & Financial Support Box */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="overflow-hidden rounded-3xl border border-secondary/40 bg-gradient-to-br from-[#06331c] via-[#083820] to-[#042013] p-6 sm:p-8 md:p-10 text-primary-foreground shadow-card">
            <div className="grid gap-8 md:grid-cols-12 md:items-center">
              
              <div className="md:col-span-7 space-y-4 text-center md:text-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-secondary ring-1 ring-secondary/40">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isRTL ? "مؤسسة اليسر الخيرية — المنصورة" : "Al-Yusr Charity — Mansoura"}
                </span>

                <h2 className="text-2xl font-black md:text-3xl leading-tight">
                  {isRTL
                    ? "ثقتكم هي المحرك الأساسي لكل خطوة خير"
                    : "Your trust drives every step of impact"}
                </h2>

                <p className="text-xs sm:text-sm leading-relaxed text-primary-foreground/90 max-w-xl">
                  {isRTL
                    ? "سيارات مؤسسة اليسر تتحرك من قلب الميدان محملة بمساهماتكم، لتأخذ طريقها مباشرة للترميم قبل أن تذهب لأهالينا المتعففين المستحقين."
                    : "Official Al-Yusr transport vehicles collect contributions daily, heading straight to our restoration workshops before delivery."}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--whatsapp,142_70%_42%))] px-5 py-2.5 text-xs font-black text-white shadow-lg transition hover:brightness-105"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    <span>01097000137</span>
                  </a>
                  <a
                    href="tel:01097000137"
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-xs font-black text-white backdrop-blur hover:bg-white/25"
                  >
                    <Phone className="h-4 w-4 text-secondary" />
                    <span>01097000137</span>
                  </a>
                </div>
              </div>

              <div className="md:col-span-5 space-y-3.5 rounded-2xl border border-secondary/30 bg-black/30 p-5 sm:p-6 text-xs sm:text-sm backdrop-blur">
                <div className="flex items-start gap-3 border-b border-white/15 pb-3.5">
                  <Building2 className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <div className="flex-1">
                    <div className="font-black text-secondary">
                      {isRTL ? "للتبرع المادي ودعم نفقات النقل والصيانة (CIB):" : "Financial Support (CIB Bank):"}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span dir="ltr" className="font-mono text-base font-black text-white tracking-wider">
                        100043605733
                      </span>
                      <button
                        type="button"
                        onClick={copyBankNumber}
                        className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/25 transition"
                      >
                        {copiedBank ? <Check className="h-3 w-3 text-secondary" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedBank ? (isRTL ? "تم النسخ" : "Copied") : (isRTL ? "نسخ" : "Copy")}</span>
                      </button>
                    </div>
                    <div className="mt-1 text-[11px] opacity-80 text-primary-foreground/75">
                      {isRTL ? "باسم: مؤسسة اليسر للتنمية" : "Account Name: Al-Yusr Foundation"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <div>
                    <div className="font-black text-secondary">{isRTL ? "المقر الرئيسي:" : "Headquarters:"}</div>
                    <div className="mt-1 leading-relaxed text-white text-xs sm:text-sm">
                      {isRTL ? "المنصورة، تقسيم خطاب، بجوار وكالة المنصورة." : "Mansoura, Khattab District, next to Mansoura Agency."}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Field Proof Gallery */}
      <section className="bg-muted/30 py-12 md:py-16 border-t border-border/60">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <FileCheck2 className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "توثيق الميدان" : "Field Proof"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl">
              {isRTL ? "صور وتوثيق من ورش التجديد وبيوت أهالينا" : "Photos from Workshops & Homes"}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { src: posterFurniture, title: isRTL ? "بوستر حملة مركون" : "Markoun poster" },
              { src: markounFurniture, title: isRTL ? "تسليم وفرش أثاث لأسرة متعففة" : "Furniture delivery" },
              { src: asasMarqun, title: isRTL ? "أثاث بعد الصيانة في الورش" : "Refurbished furniture" },
              { src: posterClothes, title: isRTL ? "المركون في دولابك ستر لغيرك" : "Clothing drive" },
              { src: posterDelivery, title: isRTL ? "سيارات اليسر لاستلام المركون" : "Pickup vans" },
              { src: posterMeds, title: isRTL ? "كنوز مركونة في البيوت" : "Surplus treasures" },
              { src: posterMedBottle, title: isRTL ? "رعاية صحية وتكافل" : "Health support" },
            ].map((img, idx) => (
              <figure
                key={idx}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
              >
                <img
                  src={img.src}
                  alt={img.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-2 text-center text-[11px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {img.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Accordion with Generous Bottom Padding */}
      <section className="pt-12 pb-28 sm:pb-36 md:pb-44">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-black text-primary">
              <HelpCircle className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "الأسئلة الشائعة" : "FAQs"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl">
              {isRTL ? "كل ما تريد معرفته عن حملة مَرْكون" : "Frequently Asked Questions"}
            </h2>
          </div>

          <Accordion type="single" collapsible className="mt-8 space-y-3 rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-soft">
            {FAQS_DATA.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-border/60">
                <AccordionTrigger className="text-start text-sm font-black text-primary hover:text-secondary sm:text-base">
                  {isRTL ? faq.q_ar : faq.q_en}
                </AccordionTrigger>
                <AccordionContent className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {isRTL ? faq.a_ar : faq.a_en}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Sticky Bottom Floating Bar — Appears after scrolling past hero & Auto-hides before footer */}
      <div className={`fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 pointer-events-none transition-all duration-300 ${!hideSticky && scrolledPastHero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"}`}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-full border border-secondary/40 bg-primary/95 px-4 py-2.5 shadow-2xl backdrop-blur pointer-events-auto sm:px-6 sm:py-3">
          <div className="flex items-center gap-3">
            <span className="hidden sm:grid h-9 w-9 place-items-center rounded-full bg-secondary/20 text-secondary">
              <Truck className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs sm:text-sm font-black text-primary-foreground">
                {isRTL ? "عندك مركون في بيتك؟ (أثاث · أجهزة · ملابس · أدوية · كتب)" : "Have surplus items at home?"}
              </div>
              <div className="text-[10px] font-bold text-secondary hidden sm:block">
                {isRTL ? "استلام مجاني من باب بيتك بكتابة كلمة «تبرع»" : "Free doorstep pickup by texting 'Donate'"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--whatsapp,142_70%_42%))] px-4 py-2 text-xs font-black text-white shadow-cta transition hover:brightness-105"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {isRTL ? "ابعت «تبرع»" : "Text 'Donate'"}
            </a>
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex rounded-full border-white/30 bg-white/10 text-xs font-black text-primary-foreground hover:bg-white/20">
              <Link to="/donate?program=markoun">
                <Heart className="h-3.5 w-3.5 text-accent" />
                {isRTL ? "تبرع مالي" : "Donate"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default MarkounLanding;