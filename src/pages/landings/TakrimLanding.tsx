import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Droplets,
  Fuel,
  HandHeart,
  Heart,
  HeartHandshake,
  MapPin,
  Phone,
  Shirt,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { HadithBlock, HADITH } from "@/components/campaigns/HadithBlock";
import { ProjectKindNote } from "@/components/campaigns/ProjectKind";
import { useLang } from "@/i18n/LangContext";
import { useTakrimContent, type TakrimShare } from "@/data/takrimContent";

const DONATE = "/donate?project=takrim";
const PHONE = "+201097000137";
const PHONE_DISPLAY = "+20 109 700 0137";

const waService = (isAr: boolean) =>
  `https://wa.me/201097000137?text=${encodeURIComponent(
    isAr
      ? "السلام عليكم، أرغب في طلب خدمة الغسل والتكفين ونقل المتوفى من مؤسسة اليسر.\nمكان المتوفى: \nموعد صلاة الجنازة: "
      : "Hello, I would like to request Al-Yusr's washing, shrouding and funeral transport service.\nLocation: \nFuneral prayer time: ",
  )}`;

const shareHref = (share: TakrimShare) =>
  `${DONATE}&package=${encodeURIComponent(String(share.apiId ?? share.id))}&amount=${share.amount}`;

/** Icons are decoration only; backend package names drive the content. */
const shareIcon = (share: TakrimShare): LucideIcon => {
  const s = `${share.id} ${share.nameEn} ${share.nameAr}`.toLowerCase();
  if (s.includes("new") || s.includes("جديدة")) return Truck;
  if (s.includes("running") || s.includes("fuel") || s.includes("تشغيل") || s.includes("وقود")) return Fuel;
  if (s.includes("wash") || s.includes("مغس")) return Droplets;
  if (s.includes("shroud") || s.includes("كفن")) return Shirt;
  return HandHeart;
};

const fmt = (n: number) => n.toLocaleString("en-US");

type Bi = { ar: string; en: string };
const t = (isAr: boolean, v: Bi) => (isAr ? v.ar : v.en);

const FEATURES: { icon: LucideIcon; title: Bi; body: Bi }[] = [
  {
    icon: Shirt,
    title: { ar: "التجهيز للقاء الله", en: "Prepared to meet Allah" },
    body: {
      ar: "نغسّل المتوفى ونكفّنه على السنة، في سترٍ واحترامٍ كاملين، ليلقى الله على الهيئة التي ينبغي أن يكون عليها.",
      en: "We wash and shroud the deceased per the Sunnah, with full discretion and respect, so they meet Allah in the state they deserve.",
    },
  },
  {
    icon: HeartHandshake,
    title: { ar: "راحة لأهل المتوفى", en: "Relief for the family" },
    body: {
      ar: "نرفع عن الأسرة عناء تجهيز المستلزمات وترتيب التنقل، لتتفرغ لوداع فقيدها في لحظة الحزن.",
      en: "We lift the burden of supplies and transport from the family, so they can give their full attention to farewell.",
    },
  },
  {
    icon: HandHeart,
    title: { ar: "مجانية تمامًا لكل الناس", en: "Completely free for everyone" },
    body: {
      ar: "نقدّم الخدمة لكل أسرة دون استثناء ودون أي مقابل، وتتكفل تبرعاتكم بالأكفان والوقود والصيانة.",
      en: "The service is offered to every family without exception and at no cost; your gifts cover shrouds, fuel and maintenance.",
    },
  },
];

const STEPS: { icon: LucideIcon; title: Bi; body: Bi }[] = [
  {
    icon: Phone,
    title: { ar: "التواصل معنا", en: "Contact us" },
    body: { ar: "تتواصل أسرة المتوفى مع اليسر هاتفيًا أو عبر واتساب، وتحدد المكان وموعد صلاة الجنازة.", en: "The family calls or messages Al-Yusr with the location and the funeral prayer time." },
  },
  {
    icon: Droplets,
    title: { ar: "الغسل والتكفين", en: "Washing and shrouding" },
    body: { ar: "يصل الفريق ومعه المستلزمات كاملة، فيغسّل المتوفى ويكفّنه على السنة.", en: "The team arrives with every supply and washes and shrouds the deceased per the Sunnah." },
  },
  {
    icon: Truck,
    title: { ar: "النقل إلى المسجد", en: "To the mosque" },
    body: { ar: "تنقل سيارة تكريم الإنسان الجثمان إلى المسجد لأداء صلاة الجنازة.", en: "The Takrim van carries the deceased to the mosque for the funeral prayer." },
  },
  {
    icon: MapPin,
    title: { ar: "إلى المقابر", en: "To the cemetery" },
    body: { ar: "ثم تنقله إلى المقابر، ويرافق الفريقُ الأسرةَ حتى يتم الدفن في هدوء ووقار.", en: "Then on to the cemetery, with the team beside the family until burial is complete." },
  },
];

const SERVICES: { icon: LucideIcon; title: Bi; body: Bi }[] = [
  {
    icon: Droplets,
    title: { ar: "غسل الميت على السنة", en: "Washing per the Sunnah" },
    body: {
      ar: "فريق مدرَّب على الغسل الشرعي، يراعي حرمة المتوفى ومشاعر أهله، ويوفّر مستلزمات الغسل كاملة؛ ويتولى الرجالُ غسل الرجال، والنساءُ غسل النساء.",
      en: "A team trained in Islamic washing, mindful of the deceased's sanctity and the family's feelings, with a complete washing kit; men are washed by men and women by women.",
    },
  },
  {
    icon: Shirt,
    title: { ar: "التكفين الشرعي", en: "Islamic shrouding" },
    body: {
      ar: "كفن شرعي نظيف بكامل مستلزماته من القماش والحنوط والأربطة، يُجهَّز سريعًا حتى لا تنشغل الأسرة بالبحث عنه في لحظة عصيبة.",
      en: "A clean Islamic shroud with all its supplies (cloth, perfume and ties), prepared quickly so the family is not left searching at a painful moment.",
    },
  },
  {
    icon: Truck,
    title: { ar: "نقل الموتى داخل المنصورة", en: "Funeral transport in Mansoura" },
    body: {
      ar: "سيارات مجهّزة تنقل المتوفى من البيت أو المستشفى إلى المسجد ثم إلى المقابر داخل مدينة المنصورة.",
      en: "Equipped vans carry the deceased from home or hospital to the mosque and then the cemetery inside Mansoura.",
    },
  },
];

/* ───────────────────────── Hero: request the service ───────────────────────── */

const TakrimHero = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const content = useTakrimContent();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="relative w-full overflow-x-clip pattern-hero-luxe hero-pattern-fade text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 leaf-bg opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(150_45%_30%/0.35),transparent_65%)]" />

      <div className="container relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pt-12 md:pb-24 md:pt-14">
        <div className="flex justify-center overflow-x-auto md:justify-start">
          <Breadcrumbs
            items={[
              { name: isAr ? "الرئيسية" : "Home", href: "/" },
              { name: isAr ? "مشاريعنا" : "Our projects", href: "/projects" },
              { name: isAr ? "تكريم الإنسان" : "Takrim" },
            ]}
          />
        </div>

        <div className="mt-8 grid items-center gap-10 md:mt-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="flex items-center justify-center gap-3 text-sm font-bold text-secondary md:justify-start">
              <span aria-hidden className="h-px w-10 bg-secondary/70" />
              {isAr ? "تكريم الإنسان · مؤسسة اليسر" : "Takrim · Al-Yusr Charity Foundation"}
            </p>

            <h1 className="mt-4 text-center text-[1.75rem] font-black leading-[1.3] text-balance sm:text-4xl md:text-start lg:text-[3.1rem] lg:leading-[1.25]">
              {t(isAr, content.title)}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-center text-base leading-loose text-primary-foreground/85 md:mx-0 md:text-start md:text-lg">
              {t(isAr, content.desc)}
            </p>

            {/* Request panel */}
            <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-background p-5 text-foreground shadow-card sm:p-6 md:mx-0">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-black text-primary sm:text-xl">{isAr ? "اطلب الخدمة الآن" : "Request the service now"}</h2>
                <span className="text-xs font-bold text-muted-foreground">{isAr ? "تواصل مباشر مع الفريق" : "Direct line to the team"}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  href={waService(isAr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-base font-black text-slate-950 transition-colors hover:bg-secondary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <WhatsAppIcon className="h-5 w-5 shrink-0" />
                  {isAr ? "اطلب عبر واتساب" : "Request on WhatsApp"}
                </a>
                <a
                  href={`tel:${PHONE}`}
                  className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl border border-primary/20 px-4 text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Phone className="h-5 w-5 shrink-0" />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-base font-black">{isAr ? "اتصل الآن" : "Call now"}</span>
                    <span dir="ltr" className="font-mono text-xs font-bold tabular-nums text-muted-foreground">{PHONE_DISPLAY}</span>
                  </span>
                </a>
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs font-bold text-muted-foreground sm:text-sm">
                {[
                  { ar: "مجانًا لكل الناس", en: "Free for everyone" },
                  { ar: "داخل مدينة المنصورة", en: "Inside Mansoura" },
                  { ar: "غسل وتكفين ونقل", en: "Washing, shrouding, transport" },
                ].map((item) => (
                  <li key={item.en} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {t(isAr, item)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex justify-center md:justify-start">
              <a
                href="#takrim-shares"
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-primary-foreground/85 underline decoration-secondary/70 decoration-2 underline-offset-[6px] transition-colors hover:text-secondary"
              >
                {isAr ? "أو ساهم في استمرار الخدمة مجانًا" : "Or help keep the service free"}
                <Arrow className="h-4 w-4" />
              </a>
            </div>
          </div>

          <figure className="mx-auto w-full max-w-md rounded-[20px] bg-primary-foreground/10 p-2 ring-1 ring-primary-foreground/15">
            <img
              src={content.image}
              alt={isAr ? "سيارة تكريم الإنسان لنقل الموتى في المنصورة من مؤسسة اليسر" : "Al-Yusr's Takrim van for funeral transport in Mansoura"}
              loading="eager"
              className="max-h-[480px] w-full rounded-2xl object-contain"
            />
          </figure>
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────── Du'a band ───────────────────────── */

const DuaBand = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <section aria-labelledby="takrim-dua" className="border-b border-border bg-muted/50 py-14 md:py-20">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <span aria-hidden className="h-px w-12 bg-primary/25 sm:w-20" />
          <h2 id="takrim-dua" className="text-sm font-black text-primary/70">{isAr ? "دعاء للمتوفى" : "A du'a for the deceased"}</h2>
          <span aria-hidden className="h-px w-12 bg-primary/25 sm:w-20" />
        </div>
        <blockquote className="mt-7 text-xl font-bold leading-[2.1] text-primary text-balance sm:text-2xl md:text-[1.7rem]">
          {isAr
            ? "«اللهم اغفر له وارحمه، وعافه واعفُ عنه، وأكرم نُزُله، ووسّع مُدخَله، واغسله بالماء والثلج والبَرَد، ونقّه من الخطايا كما يُنقّى الثوب الأبيض من الدنس»"
            : "“O Allah, forgive him and have mercy on him, keep him safe and pardon him, honour his reception and widen his entry, wash him with water, snow and hail, and cleanse him of sins as a white garment is cleansed of dirt.”"}
        </blockquote>
        <p className="mt-6 text-sm font-bold text-muted-foreground">{isAr ? "رواه مسلم" : "Sahih Muslim"}</p>
      </div>
    </section>
  );
};

/* ───────────────────────── Features ───────────────────────── */

const SectionHead = ({ title, lead, light = false }: { title: string; lead?: string; light?: boolean }) => (
  <div className="mx-auto max-w-2xl text-center">
    <h2 className={`text-2xl font-black md:text-[2.1rem] md:leading-tight ${light ? "text-primary-foreground" : "text-primary"}`}>{title}</h2>
    {lead && <p className={`mt-4 text-base leading-loose ${light ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{lead}</p>}
  </div>
);

const FeaturesSection = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <SectionHead
          title={isAr ? "مميزات الخدمة" : "Service features"}
          lead={isAr ? "صُمّمت الخدمة لتخفف عن الأسرة في أصعب لحظاتها، دون أن تتحمل أي تكلفة أو عناء." : "Built to ease the family's hardest moment, with no cost or burden left for them to carry."}
        />
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title.en} className="text-center md:border-s md:border-border md:px-8 md:first:border-s-0">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary/25 text-primary">
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-xl font-black text-primary">{t(isAr, title)}</h3>
              <p className="mx-auto mt-3 max-w-[34ch] text-[0.95rem] leading-loose text-muted-foreground">{t(isAr, body)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────── Donation shares ───────────────────────── */

const SharesSection = ({ shares }: { shares: TakrimShare[] }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  if (!shares.length) return null;

  const goal = shares.reduce((a, b) => (b.amount > a.amount ? b : a), shares[0]);
  const rest = shares.filter((s) => s !== goal);
  const GoalIcon = shareIcon(goal);
  const currency = isAr ? "جنيه" : "EGP";

  return (
    <section id="takrim-shares" className="scroll-mt-24 border-y border-border bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <SectionHead
          title={isAr ? "يمكنك التبرع لاستمرار الخدمة مجانًا" : "Give to keep the service free"}
          lead={
            isAr
              ? "يعود تبرعك إلى الخدمة نفسها: أكفان، ومصاريف تشغيل، وأجر المغسّل والمكفّن، وسيارة جديدة تتسع بها الخدمة لمن يحتاجها."
              : "Your gift goes back into the service itself: shrouds, running costs, the washer's and shrouder's fees, and a new van to reach more families."
          }
        />

        <div className={`mt-12 grid gap-4 ${rest.length >= 3 ? "md:grid-cols-3" : "sm:grid-cols-2"}`}>
          {rest.map((share) => {
            const Icon = shareIcon(share);
            return (
              <article key={share.id} className="flex flex-col rounded-2xl bg-card p-6 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary/25 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-black leading-snug text-primary">{t(isAr, { ar: share.nameAr, en: share.nameEn })}</h3>
                <p className="mt-auto pt-5 text-3xl font-black tabular-nums text-primary">
                  <span dir="ltr">{fmt(share.amount)}</span> <span className="text-sm font-bold text-muted-foreground">{currency}</span>
                </p>
                <Link
                  to={shareHref(share)}
                  className="mt-5 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-orange-grad px-4 text-sm font-black text-accent-foreground shadow-cta transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Heart className="h-4 w-4" />
                  {isAr ? "تبرّع بهذا السهم" : "Give this share"}
                </Link>
              </article>
            );
          })}
        </div>

        {/* The big goal */}
        <article className="relative mt-4 overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8 md:p-10">
          <div className="pointer-events-none absolute inset-0 leaf-bg opacity-15" />
          <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr_auto] md:gap-8">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-slate-950">
              <GoalIcon className="h-8 w-8" />
            </span>
            <div>
              <p className="text-sm font-black text-secondary">{isAr ? "الهدف القادم" : "The next goal"}</p>
              <h3 className="mt-1 text-xl font-black leading-snug sm:text-2xl">{t(isAr, { ar: goal.nameAr, en: goal.nameEn })}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-primary-foreground/75">
                {isAr
                  ? "سيارة إضافية تعني الوصول إلى أسر أكثر في وقت أقصر، وخطوة نحو مد الخدمة إلى القاهرة."
                  : "Another van means reaching more families sooner, and a step towards bringing the service to Cairo."}
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <p className="text-3xl font-black tabular-nums text-secondary sm:text-4xl">
                <span dir="ltr">{fmt(goal.amount)}</span> <span className="text-sm font-bold text-primary-foreground/70">{currency}</span>
              </p>
              <Link
                to={shareHref(goal)}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-orange-grad px-6 text-sm font-black text-accent-foreground shadow-cta transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <Heart className="h-4 w-4" />
                {isAr ? "ساهم في السيارة الجديدة" : "Help fund the new van"}
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

/* ───────────────────────── The journey (steps) ───────────────────────── */

const JourneySection = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground md:py-24">
      <div className="pointer-events-none absolute inset-0 leaf-bg opacity-10" />
      <div className="container relative mx-auto max-w-6xl px-4">
        <SectionHead
          light
          title={isAr ? "كيف تتم الخدمة خطوة بخطوة" : "How the service works, step by step"}
          lead={isAr ? "من لحظة تواصلكم معنا حتى الدفن، يرافقكم الفريق في كل خطوة." : "From your first call until the burial, the team is with you at every step."}
        />
        <ol className="relative mt-14 grid gap-0 md:grid-cols-4 md:gap-6">
          <span aria-hidden className="absolute inset-x-[12.5%] top-8 hidden border-t-2 border-dashed border-primary-foreground/25 md:block" />
          <span aria-hidden className="absolute bottom-8 start-8 top-8 border-s-2 border-dashed border-primary-foreground/25 md:hidden" />
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title.en} className="relative flex gap-5 pb-10 last:pb-0 md:flex-col md:items-center md:pb-0 md:text-center">
              <span className="relative z-10 grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary text-slate-950 ring-8 ring-primary">
                <Icon className="h-7 w-7" />
              </span>
              <div className="pt-1 md:pt-0">
                <p className="text-xs font-black text-secondary">{isAr ? `الخطوة ${i + 1}` : `Step ${i + 1}`}</p>
                <h3 className="mt-1 text-lg font-black">{t(isAr, title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75 md:mx-auto md:max-w-[26ch]">{t(isAr, body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

/* ───────────────────────── What the service includes + coverage ───────────────────────── */

const ServicesSection = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <h2 className="text-2xl font-black text-primary md:text-[2.1rem] md:leading-tight">
              {isAr ? "خدمات تكريم الإنسان في المنصورة" : "What Takrim provides in Mansoura"}
            </h2>
            <p className="mt-4 text-base leading-loose text-muted-foreground">
              {isAr
                ? "لحظة الوفاة من أصعب ما تمر به أي أسرة، وكثير من الأسر لا تعرف من يتولى الغسل والتكفين، أو كيف تدبّر سيارة لنقل المتوفى. يتحمل مشروع تكريم الإنسان من مؤسسة اليسر هذا العبء كاملًا عن الأسرة، من الغسل والتكفين حتى الدفن، مجانًا لكل الناس."
                : "A death is among the hardest moments any family faces, and many do not know who will wash and shroud, or how to arrange a funeral van. Al-Yusr's Takrim project carries that whole load, from washing and shrouding until burial, free for everyone."}
            </p>

            {/* Coverage */}
            <div className="mt-8 rounded-2xl bg-muted/60 p-6">
              <h3 className="text-base font-black text-primary">{isAr ? "نطاق الخدمة" : "Coverage"}</h3>
              <ol className="mt-4 space-y-4">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-secondary ring-4 ring-secondary/25" />
                  <div>
                    <p className="font-black text-primary">{isAr ? "متاحة الآن: المنصورة" : "Available now: Mansoura"}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {isAr ? "الغسل والتكفين ونقل الموتى داخل مدينة المنصورة بمحافظة الدقهلية." : "Washing, shrouding and funeral transport inside Mansoura, Dakahlia."}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-primary/40" />
                  <div>
                    <p className="font-black text-primary">{isAr ? "المرحلة القادمة: القاهرة" : "Next: Cairo"}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {isAr ? "نعمل على مد الخدمة إلى القاهرة، وكل سهم تتبرع به يقرّبنا من هذه الخطوة." : "We are working to bring the service to Cairo; every share you give brings that step closer."}
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <ul className="divide-y divide-border">
            {SERVICES.map(({ icon: Icon, title, body }) => (
              <li key={title.en} className="flex gap-5 py-7 first:pt-0 last:pb-0">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-secondary">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-primary">{t(isAr, title)}</h3>
                  <p className="mt-2 text-[0.95rem] leading-loose text-muted-foreground">{t(isAr, body)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

const TakrimMain = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const content = useTakrimContent();
  return (
    <>
      <DuaBand />
      <FeaturesSection />
      <SharesSection shares={content.shares} />
      <JourneySection />
      <ServicesSection />
      <HadithBlock hadith={HADITH.takrim} tone="light" label={isAr ? "فضل اتّباع الجنازة" : "The reward of following a funeral"} />
      <section className="bg-background pb-14 pt-4 md:pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <ProjectKindNote
            kinds={["impact"]}
            noteAr="تكريم الإنسان مشروع أثر مجتمعي، غايته تيسير نقل الموتى وتكريمهم ومساندة الأسر في أصعب لحظاتها، لا تحقيق الدخل."
            noteEn="Takrim is a community-impact project: its aim is dignified funeral transport and standing with families in their hardest moments, not income."
          />
        </div>
      </section>
    </>
  );
};

const TakrimLanding = () => {
  const content = useTakrimContent();

  return (
    <CampaignLandingShell
      slug="takrim"
      path="/takrim"
      crumbParent={{ ar: "مشاريعنا", en: "Our projects", href: "/projects" }}
      titleAr="تكريم الإنسان: غسل وتكفين ونقل الموتى مجانًا في المنصورة"
      titleEn="Takrim: free washing, shrouding and funeral transport in Mansoura"
      taglineAr="من الغسل والتكفين حتى المسجد والمقابر، فريق وسيارات مجهزة تكرّم المتوفى وترفع العناء عن أهله، والخدمة مجانية تمامًا لكل الناس. نخدم المنصورة الآن، والمرحلة القادمة القاهرة."
      taglineEn="From washing and shrouding to the mosque and the grave: a team and equipped vans that honour the deceased and carry the load for the family, completely free for everyone. Serving Mansoura now, Cairo next."
      metaDescAr="خدمة غسل وتكفين الميت ونقل الموتى داخل المنصورة من مؤسسة اليسر، مجانية تمامًا لكل الناس، والمرحلة القادمة القاهرة. اطلب الخدمة أو تبرع لاستمرارها."
      metaDescEn="Washing, shrouding and funeral van service inside Mansoura by Al-Yusr, completely free for everyone, expanding to Cairo next. Request the service or give to keep it free."
      seo={{
        title: {
          ar: "غسل وتكفين ونقل الموتى مجانًا في المنصورة | تكريم الإنسان — مؤسسة اليسر",
          en: "Free funeral washing, shrouding & vans in Mansoura | Takrim — Al-Yusr",
        },
      }}
      heroImage={content.image}
      heroAlt="سيارة تكريم الإنسان لنقل الموتى في المنصورة من مؤسسة اليسر"
      hero={<TakrimHero />}
      main={<TakrimMain />}
      relatedLinks={[
        { href: "/projects", ar: "كل مشاريع اليسر", en: "All projects" },
        { href: "/water", ar: "مشروع سقيا الماء", en: "Clean water project" },
        { href: "/nurseries", ar: "حضانات اليسر ودور التحفيظ", en: "Nurseries & Qur'an houses" },
        { href: "/trust", ar: "الشفافية والتقارير", en: "Trust & reports" },
      ]}
      faq={{
        ar: [
          { q: "كيف أطلب سيارة نقل موتى في المنصورة من مؤسسة اليسر؟", a: "تواصل معنا عبر واتساب أو هاتف المؤسسة، وأخبرنا بمكان المتوفى وموعد صلاة الجنازة، وسيتولى الفريق التنسيق معك فورًا." },
          { q: "هل خدمة الغسل والتكفين ونقل الموتى مجانية؟", a: "نعم، الخدمة مجانية تمامًا لكل الناس دون استثناء، وتُغطّى تكاليفها من تبرعات مشروع تكريم الإنسان." },
          { q: "ما المناطق التي تشملها الخدمة؟", a: "تشمل الخدمة حاليًا مدينة المنصورة بمحافظة الدقهلية، والمرحلة القادمة هي التوسع إلى القاهرة." },
          { q: "من يتولى غسل المتوفى؟", a: "فريق مدرَّب على الغسل الشرعي، يتولى فيه الرجالُ غسل الرجال والنساءُ غسل النساء، في ستر واحترام كاملين." },
          { q: "كيف أساهم في المشروع؟", a: "يمكنك التبرع بأحد أسهم المشروع: كفن شرعي، أو مصاريف تشغيل السيارة، أو مصاريف المغسّل والمكفّن، أو المساهمة في شراء سيارة جديدة، وذلك من صفحة التبرع." },
          { q: "ما فضل اتّباع الجنازة؟", a: "قال ﷺ: «من شهد الجنازة حتى يُصلّى عليها فله قيراط، ومن شهدها حتى تُدفن كان له قيراطان». قيل: وما القيراطان؟ قال: «مثل الجبلين العظيمين». متفق عليه." },
        ],
        en: [
          { q: "How do I request a funeral van in Mansoura?", a: "Contact us on WhatsApp or by phone with the location and the funeral prayer time, and the team will coordinate with you right away." },
          { q: "Is the service free?", a: "Yes. It is completely free for everyone, and its costs are covered by donations to the Takrim project." },
          { q: "Which areas do you cover?", a: "Mansoura, Dakahlia for now, with Cairo as the next phase." },
          { q: "Who washes the deceased?", a: "A team trained in Islamic washing; men are washed by men and women by women." },
          { q: "How can I help?", a: "Give one of the project's shares: an Islamic shroud, van running costs, the washer's and shrouder's costs, or a contribution to a new van, from the donation page." },
          { q: "What is the reward of following a funeral?", a: "The Prophet ﷺ said whoever attends until the prayer gets one qirat, and until burial two qirats, each like a great mountain (Bukhari & Muslim)." },
        ],
      }}
      donateHref={DONATE}
      donateLabelAr="تبرّع لاستمرار الخدمة"
      donateLabelEn="Keep the service free"
      bottomCtaAr="ساهم في أن تبقى الخدمة مجانية للجميع"
      bottomCtaEn="Help keep the service free for everyone"
      bottomSubAr="تبرعك يغطي الأكفان والوقود والصيانة، ويضمن وصول الخدمة إلى كل أسرة."
      bottomSubEn="Your gift covers shrouds, fuel and maintenance and keeps the service within reach of every family."
    />
  );
};

export default TakrimLanding;
