import { useState } from "react";
import {
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  Navigation,
  Sparkles,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  HeartHandshake,
  Compass,
  ArrowLeft,
  ArrowRight,
  Heart,
  Droplets,
  Home,
  Stethoscope,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useLang } from "@/i18n/LangContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/VYc3KdxrU1DQWwFf6";
const GOOGLE_MAPS_EMBED_SRC =
  "https://maps.google.com/maps?q=31.0298521,31.3655258+(%D9%85%D8%A4%D8%B3%D8%B3%D8%A9%20%D8%A7%D9%84%D9%8A%D8%B3%D8%B1%20%D8%A7%D9%84%D8%AE%D9%8A%D8%B1%D9%8A%D8%A9)&t=&z=17&ie=UTF8&iwloc=B&output=embed";

const PHONE_NUMBER = "+201097000137";
const PHONE_DISPLAY = "01097000137";
const WHATSAPP_LINK = "https://wa.me/201097000137";

const GOVERNORATES = [
  {
    id: "dak",
    slug: "dakahlia",
    name_ar: "الدقهلية · المنصورة",
    name_en: "Dakahlia · Mansoura",
    role_ar: "المقر الرئيسي والمجمع الطبي",
    role_en: "Headquarters & Medical Complex",
    desc_ar: "الإدارة العامة للمؤسسة، ومجمع عيادات اليسر التخصصية، وصرف المساعدات الشهرية المباشرة للأسر.",
    desc_en: "Main administrative HQ, specialized medical clinics, and monthly direct family stipends.",
    icon: Building2,
    badge_ar: "المقر الرئيسي",
    badge_en: "Main HQ",
  },
  {
    id: "shr",
    slug: "sharqia",
    name_ar: "محافظة الشرقية",
    name_en: "Sharqia Governorate",
    role_ar: "قوافل الإطعام واللحوم",
    role_en: "Food Aid & Meat Caravans",
    desc_ar: "توزيع كراتين الخير واللحوم البلدية على الأسر الأكثر استحقاقاً في قرى ومراكز الشرقية.",
    desc_en: "Distribution of essential food parcels and meat to vulnerable families in villages.",
    icon: HeartHandshake,
    badge_ar: "قوافل ميدانية",
    badge_en: "Field Caravans",
  },
  {
    id: "kfs",
    slug: "kafr-elsheikh",
    name_ar: "كفر الشيخ · الحفير",
    name_en: "Kafr El-Sheikh · Hafir",
    role_ar: "مشروع سكن كريم وترميم البيوت",
    role_en: "Dignified Shelter & Home Restoration",
    desc_ar: "تسقيف المنازل بالخشب والعوازل، وبناء دورات المياه، وإعادة تأهيل بيوت الأسر المستحقة.",
    desc_en: "Roofing, sanitation, and winterization for impoverished rural homes.",
    icon: Home,
    badge_ar: "إيواء وترميم",
    badge_en: "Shelter & Roofing",
  },
  {
    id: "fyo",
    slug: "fayoum",
    name_ar: "محافظة الفيوم",
    name_en: "Fayoum Governorate",
    role_ar: "سُقيا الماء وعمارة المساجد",
    role_en: "Clean Water & Mosque Building",
    desc_ar: "حفر وتمديد وصلات مياه شرب نقية للمنازل وبناء وصيانة بيوت الله في القرى الأشد احتياجاً.",
    desc_en: "Installing clean drinking water connections and constructing community mosques.",
    icon: Droplets,
    badge_ar: "سُقيا وإعمار",
    badge_en: "Water & Mosques",
  },
  {
    id: "cai",
    slug: "cairo",
    name_ar: "القاهرة الكبرى",
    name_en: "Greater Cairo",
    role_ar: "الحالات الطبية الحرجة والعمليات",
    role_en: "Critical Medical Cases & Surgeries",
    desc_ar: "تحويل ومتابعة الحالات الطبية المعقدة والعمليات الجراحية العاجلة في كبرى المستشفيات الجامعية.",
    desc_en: "Coordinating emergency surgical interventions and specialized treatments in Cairo hospitals.",
    icon: Stethoscope,
    badge_ar: "رعاية صحية",
    badge_en: "Healthcare",
  },
];

export const EgyptImpactMap = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [activeTab, setActiveTab] = useState<"hq" | "coverage">("hq");
  const [copied, setCopied] = useState(false);

  const addressText = isRTL
    ? "مؤسسة اليسر الخيرية — المنصورة، بجوار وكالة المنصورة، محافظة الدقهلية، مصر"
    : "Al-Yusr Charity Foundation — Near Mansoura Agency, Mansoura, Dakahlia, Egypt";

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(addressText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
    }
  };

  return (
    <section
      id="impact"
      className="relative z-10 isolate overflow-hidden bg-background py-16 md:py-24"
      aria-label={isRTL ? "موقع ومقر مؤسسة اليسر الخيرية" : "Al-Yusr Charity Foundation Location & Headquarters"}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Decorative calm background ambiance */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-secondary/[0.04] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-24 top-1/4 h-80 w-80 rounded-full bg-secondary/10 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -start-24 bottom-1/4 h-80 w-80 rounded-full bg-accent/10 blur-[130px]"
      />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-3.5 py-1 text-[11px] sm:text-xs font-black text-primary">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            {isRTL ? "مقرنا وموقعنا الميداني" : "Headquarters & Field Presence"}
          </span>

          <h2 className="mt-3 text-2xl font-black leading-tight text-primary sm:text-3xl md:text-4xl lg:text-[40px]">
            {isRTL ? (
              <>
                شرفنا بزيارتك في{" "}
                <span className="relative inline-block text-secondary drop-shadow-sm">
                  مقر مؤسسة اليسر
                  <span
                    aria-hidden
                    className="absolute -bottom-1.5 start-0 end-0 h-[3px] rounded-full bg-gradient-to-r from-secondary/20 via-secondary to-secondary/20"
                  />
                </span>
              </>
            ) : (
              <>
                Welcome to{" "}
                <span className="relative inline-block text-secondary drop-shadow-sm">
                  Al-Yusr Headquarters
                  <span
                    aria-hidden
                    className="absolute -bottom-1.5 start-0 end-0 h-[3px] rounded-full bg-gradient-to-r from-secondary/20 via-secondary to-secondary/20"
                  />
                </span>
              </>
            )}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-sm md:text-base font-medium leading-relaxed text-muted-foreground">
            {isRTL
              ? "أبوابنا مفتوحة دائماً لاستقبالكم في مقرنا الرئيسي بالمنصورة لتسليم الصدقات، واستلام إيصالات التبرع الرسمية، أو التعرف عن قرب على مسارات أثرنا الميداني في محافظات مصر."
              : "Our doors are open to welcome you at our headquarters in Mansoura to deliver donations, receive official receipts, or explore our verified field impact across Egyptian governorates."}
          </p>

          {/* Interactive Navigation Switcher */}
          <div className="mt-6 inline-flex max-w-full items-center gap-1 sm:gap-1.5 overflow-x-auto rounded-full border border-border/80 bg-card p-1 sm:p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("hq")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs md:text-sm font-black whitespace-nowrap shrink-0 transition-all ${
                activeTab === "hq"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>{isRTL ? "المقر الرئيسي (المنصورة)" : "Main HQ (Mansoura)"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("coverage")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs md:text-sm font-black whitespace-nowrap shrink-0 transition-all ${
                activeTab === "coverage"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>{isRTL ? "نطاق انتشارنا الميداني (5 محافظات)" : "Field Coverage (5 Governorates)"}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Headquarters Google Maps + Visiting Experience */}
        {activeTab === "hq" && (
          <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:items-stretch animate-fade-in">
            {/* Left Column: Glassmorphic Google Maps Window */}
            <div className="flex flex-col overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.25)] lg:col-span-7">
              {/* Map Window Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/40 px-5 py-3.5 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-primary">
                      {isRTL ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity Foundation"}
                    </span>
                    <span className="hidden sm:inline-block text-[11px] font-semibold text-muted-foreground ms-2">
                      {isRTL ? "مشهرة برقم 2665" : "Licensed NGO 2665"}
                    </span>
                  </div>
                </div>

                <a
                  href={GOOGLE_MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/40 bg-secondary/15 px-3 py-1.5 text-xs font-black text-primary transition-all hover:bg-secondary hover:text-secondary-foreground hover:scale-105"
                >
                  <Navigation className="h-3.5 w-3.5 text-accent" />
                  <span>{isRTL ? "فتح الاتجاهات" : "Get Directions"}</span>
                </a>
              </div>

              {/* Verified Embedded Google Map */}
              <div className="relative min-h-[380px] sm:min-h-[440px] flex-1 w-full bg-muted/20">
                <iframe
                  title={isRTL ? "موقع مقر مؤسسة اليسر على خرائط جوجل" : "Al-Yusr Charity Foundation Headquarters on Google Maps"}
                  src={GOOGLE_MAPS_EMBED_SRC}
                  className="h-full min-h-[380px] sm:min-h-[440px] w-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />

                {/* Floating Bottom Card Over Map */}
                <div className="pointer-events-none absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 flex justify-between items-end">
                  <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary/20 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="text-start">
                      <p className="text-[11px] font-black leading-tight text-primary">
                        {isRTL ? "المنصورة — المقر والمجمع الطبي" : "Mansoura HQ & Medical Complex"}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {isRTL ? "مفتوح لاستقبال الزوار والمتبرعين" : "Open for visitors & donors"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: HQ Hospitality & Visiting Guide */}
            <div className="flex flex-col justify-between gap-4 lg:col-span-5">
              {/* Card 1: Official Address */}
              <div className="group rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft transition-all hover:border-secondary/50 hover:shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="hidden sm:grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary/20 text-primary ring-1 ring-secondary/30">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                        {isRTL ? "العنوان الدقيق للمقر" : "Official Address"}
                      </span>
                      <h3 className="mt-1 text-base sm:text-lg font-black text-primary">
                        {isRTL ? "المنصورة، محافظة الدقهلية" : "Mansoura, Dakahlia"}
                      </h3>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">
                        {isRTL
                          ? "بجوار وكالة المنصورة — المقر الإداري العام والمجمع الطبي لمؤسسة اليسر الخيرية."
                          : "Near Mansoura Agency — Administrative HQ & Medical Complex of Al-Yusr Charity Foundation."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">{isRTL ? "تم نسخ العنوان!" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{isRTL ? "نسخ العنوان" : "Copy Address"}</span>
                      </>
                    )}
                  </button>

                  <a
                    href={GOOGLE_MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-black text-secondary hover:underline"
                  >
                    <span>{isRTL ? "عرض عبر تطبيق الخرائط" : "Open in Maps App"}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Card 2: Operating & Visiting Hours */}
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft">
                <div className="flex items-start gap-3.5">
                  <div className="hidden sm:grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary/20 text-primary ring-1 ring-secondary/30">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-start">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      {isRTL ? "مواعيد العمل والاستقبال" : "Visiting & Reception Hours"}
                    </span>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-foreground">
                        <span>{isRTL ? "السبت – الخميس:" : "Saturday – Thursday:"}</span>
                        <span className="font-black text-primary" dir="ltr">9:00 AM – 5:00 PM</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                        <span>{isRTL ? "الجمعة:" : "Friday:"}</span>
                        <span className="font-semibold text-accent">{isRTL ? "طوارئ ومتابعة هاتفية" : "Phone Inquiries Only"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: In-Person Services Available */}
              <div className="rounded-3xl border border-border/80 bg-card/90 p-5 shadow-soft">
                <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                  {isRTL ? "خدمات يقدمها المقر مباشرة لزوارنا" : "Available In-Person at HQ"}
                </span>

                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] sm:text-xs font-bold text-foreground/85">
                  <li className="flex items-center gap-2 rounded-xl bg-muted/40 p-2 border border-border/50">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                    <span>{isRTL ? "إيصالات تبرع رسمية فورية" : "Instant Official Receipts"}</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-xl bg-muted/40 p-2 border border-border/50">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                    <span>{isRTL ? "استقبال الصدقات العينية" : "In-Kind Donation Drop-off"}</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-xl bg-muted/40 p-2 border border-border/50">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                    <span>{isRTL ? "متابعة كفالات الأيتام والطلاب" : "Sponsorship Follow-up"}</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-xl bg-muted/40 p-2 border border-border/50">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                    <span>{isRTL ? "استقبال الحالات وبحث المساعدات" : "Social Case Applications"}</span>
                  </li>
                </ul>

                {/* Direct Action Buttons: 2 in a row on mobile */}
                <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    asChild
                    className="h-11 rounded-2xl bg-secondary hover:bg-secondary/90 font-black text-black shadow-md transition active:scale-95 text-xs sm:text-sm border border-secondary/40"
                  >
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <WhatsAppIcon size={16} className="h-4 w-4 fill-black text-black shrink-0" />
                      <span>{isRTL ? "محادثة واتساب" : "WhatsApp"}</span>
                    </a>
                  </Button>

                  <Button
                    asChild
                    className="h-11 rounded-2xl bg-orange-grad hover:opacity-95 font-black text-white shadow-md transition active:scale-95 text-xs sm:text-sm border-0"
                  >
                    <a href={`tel:${PHONE_NUMBER}`} className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <Phone className="h-4 w-4 text-white shrink-0" />
                      <span dir="ltr">{PHONE_DISPLAY}</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 5 Governorates Verified Coverage Grid */}
        {activeTab === "coverage" && (
          <div className="mt-10 space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {GOVERNORATES.map((gov) => {
                const Icon = gov.icon;
                return (
                  <div
                    key={gov.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-secondary/60 hover:shadow-card"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-black text-primary">
                          <MapPin className="h-3 w-3 text-secondary" />
                          {isRTL ? gov.badge_ar : gov.badge_en}
                        </span>

                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <h3 className="mt-4 text-xl font-black text-primary">
                        {isRTL ? gov.name_ar : gov.name_en}
                      </h3>

                      <p className="mt-1 text-xs font-black text-accent">
                        {isRTL ? gov.role_ar : gov.role_en}
                      </p>

                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {isRTL ? gov.desc_ar : gov.desc_en}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/60">
                      <Button
                        asChild
                        size="sm"
                        className="w-full rounded-xl bg-orange-grad font-black text-accent-foreground shadow-cta hover:opacity-95 text-xs h-9"
                      >
                        <Link to={`/donate?governorate=${encodeURIComponent(gov.slug)}`}>
                          <Heart className="h-3.5 w-3.5" />
                          {isRTL ? `تبرع لحملات ${gov.name_ar.split("·")[0].trim()}` : `Donate to ${gov.name_en.split("·")[0].trim()}`}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Extra Summary Card */}
              <div className="flex flex-col justify-between rounded-3xl border border-secondary/40 bg-gradient-to-br from-primary/95 to-primary p-6 text-primary-foreground shadow-card">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold text-secondary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isRTL ? "توثيق ميداني معتمد" : "Verified Documentation"}
                  </span>

                  <h3 className="mt-4 text-xl font-black leading-snug">
                    {isRTL ? "كل جنيه يُوثَّق في مكانه بالصوت والصورة" : "Every donation is documented on the ground"}
                  </h3>

                  <p className="mt-3 text-xs font-medium leading-relaxed text-primary-foreground/80">
                    {isRTL
                      ? "فِرقنا الميدانية مقيمة داخل القرى والمراكز لتحديد المستحقين ببحث اجتماعي دقيق، وتسليم الأمانات إلى مستحقيها بكرامة."
                      : "Our field teams reside in local villages to conduct social research and deliver your trust with absolute dignity."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/15">
                  <Link
                    to="/trust"
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-secondary hover:underline"
                  >
                    <span>{isRTL ? "تعرف على معايير الشفافية والتوثيق" : "Learn about our transparency standards"}</span>
                    <Arrow className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EgyptImpactMap;
