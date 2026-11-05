import { useEffect, useState, type ReactNode } from "react";
import {
  Accessibility,
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Bone,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FlaskConical,
  HeartPulse,
  Hospital,
  Info,
  MapPin,
  Pill,
  RotateCcw,
  Scan,
  Smile,
  Stethoscope,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DonateBtn, DonationPicker, ShareBand, StartsFrom, Stepper, type Source } from "@/components/campaigns/DonationPicker";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProjectKindNote } from "@/components/campaigns/ProjectKind";
import { BentoGallery } from "@/components/campaigns/shared";
import { PAGE_GALLERIES, usePageGallery } from "@/data/pageGalleries";
import { resolveImages } from "@/data/pageImages";
import { useInView } from "@/hooks/useInView";
import { useLang } from "@/i18n/LangContext";
import { entityDonateHref, findShare, shareDonateHref, useEntityShares, type Share } from "@/data/entityShares";
import { useProjectDetail } from "@/data/sources/projects";
import { COMPLEX_SHARES, CONVOY_SHARES, DISABILITY_SHARES, MEDICAL_SOURCES, SECTION_WORDS, sectionShares, TREATMENT_SHARES } from "@/data/medicalShares";
import heroHealth from "@/assets/program-health.webp";

/**
 * /medical — «المشروع الطبي»: one long page, every section open, in this order:
 *   complex → prescriptions, surgeries, radiology & labs → overcoming disability → medical convoys.
 * Every section sells packages of the backend project "medical" (editable in the dashboard); prices are shown
 * as «يبدأ من» and the donor can pick several shares before opening the donate form.
 */

type Bi = { ar: string; en: string };
/** Hero image: the medical project's cover image (dashboard → المشاريع → المجمعات الطبية → الصورة), else the site photo. */
const useMedicalHeroImage = () => {
  const { project } = useProjectDetail("medical");
  return project?.image && project.image !== "/placeholder.svg" ? project.image : heroHealth;
};
const MEDICAL_GALLERY_DEFAULTS = resolveImages(PAGE_GALLERIES.medical.defaults);
/** Stable empty fallback, so a section can tell "no project packages" from its own defaults. */
const NO_SHARES: Share[] = [];
const t = (isAr: boolean, v: Bi) => (isAr ? v.ar : v.en);
const fmt = (n: number) => n.toLocaleString("en-US");

const SECTIONS: { id: string; icon: LucideIcon; title: Bi }[] = [
  { id: "complex", icon: Hospital, title: { ar: "مجمع اليسر الطبي", en: "Medical complex" } },
  { id: "prescriptions", icon: Pill, title: { ar: "صرف الروشتات", en: "Prescriptions" } },
  { id: "surgeries", icon: Activity, title: { ar: "العمليات الجراحية", en: "Surgeries" } },
  { id: "diagnosis", icon: Scan, title: { ar: "الأشعة والتحاليل", en: "Scans & tests" } },
  { id: "disability", icon: Accessibility, title: { ar: "تحدّي الإعاقة", en: "Overcoming Disability" } },
  { id: "convoys", icon: Truck, title: { ar: "القوافل الطبية", en: "Medical convoys" } },
];

/* ───────────────────────── Layout helpers ───────────────────────── */

const Section = ({ id, n, tone = "light", children }: { id: string; n: number; tone?: "light" | "muted" | "dark"; children: ReactNode }) => {
  const bg = tone === "dark" ? "bg-primary text-primary-foreground" : tone === "muted" ? "bg-muted/50" : "bg-background";
  return (
    <section id={id} aria-labelledby={`${id}-title`} data-medical-section={n} className={`relative scroll-mt-24 overflow-hidden py-16 md:py-24 ${bg}`}>
      {tone === "dark" && <div className="pointer-events-none absolute inset-0 leaf-bg opacity-10" />}
      <div className="container relative mx-auto max-w-6xl px-4">{children}</div>
    </section>
  );
};

const SectionHead = ({ id, n, eyebrow, title, lead, dark = false }: { id: string; n: number; eyebrow: string; title: string; lead: ReactNode; dark?: boolean }) => (
  <div className="max-w-3xl">
    <p className={`flex items-center gap-3 text-sm font-black ${dark ? "text-secondary" : "text-primary/60"}`}>
      <span className="font-mono tabular-nums">{String(n).padStart(2, "0")}</span>
      <span aria-hidden className={`h-px w-8 ${dark ? "bg-secondary/60" : "bg-primary/30"}`} />
      {eyebrow}
    </p>
    <h2 id={`${id}-title`} className={`mt-3 text-2xl font-black leading-tight md:text-[2.2rem] ${dark ? "text-primary-foreground" : "text-primary"}`}>{title}</h2>
    <div className={`mt-4 text-base leading-loose ${dark ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{lead}</div>
  </div>
);

const Point = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <li className={`flex items-start gap-2.5 text-[0.95rem] font-bold leading-relaxed ${dark ? "text-primary-foreground/85" : "text-foreground/85"}`}>
    <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${dark ? "text-secondary" : "text-primary"}`} />
    <span>{children}</span>
  </li>
);

/* ───────────────────────── Hero ───────────────────────── */

const MedicalHero = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const heroImage = useMedicalHeroImage();
  const stats: { v: string; l: Bi }[] = [
    { v: "43", l: { ar: "قرية يخدمها المجمع", en: "villages served" } },
    { v: "2", l: { ar: "غرفتا عمليات", en: "operating rooms" } },
    { v: "3–10", l: { ar: "أيام لكل قافلة", en: "days per convoy" } },
    { v: "6", l: { ar: "خدمات طبية", en: "medical services" } },
  ];
  return (
    <section className="relative w-full overflow-x-clip pattern-hero-luxe hero-pattern-fade text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 leaf-bg opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(150_45%_30%/0.35),transparent_65%)]" />
      <div className="container relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:pt-12 md:pb-20 md:pt-14">
        <div className="flex justify-center overflow-x-auto md:justify-start">
          <Breadcrumbs items={[{ name: isAr ? "الرئيسية" : "Home", href: "/" }, { name: isAr ? "مشاريعنا" : "Our projects", href: "/projects" }, { name: isAr ? "المشروع الطبي" : "Medical project" }]} />
        </div>

        <div className="mt-8 grid items-center gap-10 md:mt-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="text-center md:text-start">
            <p className="flex items-center justify-center gap-3 text-sm font-bold text-secondary md:justify-start">
              <span aria-hidden className="h-px w-10 bg-secondary/70" />
              {isAr ? "المشروع الطبي · مؤسسة اليسر" : "The medical project · Al-Yusr Charity Foundation"}
            </p>
            <h1 className="mt-4 text-[1.8rem] font-black leading-[1.3] text-balance sm:text-4xl lg:text-[3.2rem] lg:leading-[1.22]">
              {isAr ? "المشروع الطبي: حتى لا يتأخر علاج مريض بسبب التكلفة" : "The medical project: so no patient's treatment waits on cost"}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-loose text-primary-foreground/85 md:mx-0 md:text-lg">
              {isAr
                ? "يبدأ المشروع من مجمع اليسر الطبي الذي يخدم 43 قرية، ويمتد إلى صرف الروشتات بالمجان، والمشاركة في العمليات والأشعة والتحاليل، وتأهيل الأطفال ذوي الإعاقة، والقوافل الطبية إلى أبعد القرى."
                : "It starts with the Al-Yusr medical complex serving 43 villages and extends to free prescriptions, help with surgery, scans and tests, rehabilitation for children with disabilities, and convoys to the furthest villages."}
            </p>
          </div>
          <figure className="mx-auto w-full max-w-md rounded-[20px] bg-primary-foreground/10 p-2 ring-1 ring-primary-foreground/15">
            <img src={heroImage} alt={isAr ? "طبيب من فريق اليسر مع مريض أثناء صرف العلاج" : "An Al-Yusr doctor with a patient"} loading="eager" className="aspect-[4/3] w-full rounded-2xl object-cover" />
          </figure>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-primary-foreground/15 md:grid-cols-4">
          {stats.map(({ v, l }) => (
            <div key={l.en} className="bg-[hsl(152_70%_9%)] px-5 py-5 text-center md:text-start">
              <dt className="sr-only">{t(isAr, l)}</dt>
              <dd>
                <span dir="ltr" className="block text-3xl font-black tabular-nums text-secondary">{v}</span>
                <span className="mt-1 block text-sm font-bold text-primary-foreground/75">{t(isAr, l)}</span>
              </dd>
            </div>
          ))}
        </dl>

        <nav aria-label={isAr ? "أقسام المشروع الطبي" : "Medical project sections"} className="mt-8">
          <ol className="flex flex-wrap justify-center gap-2 md:justify-start">
            {SECTIONS.map(({ id, icon: Icon, title }, i) => (
              <li key={id}>
                <a href={`#${id}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary-foreground/[0.08] px-4 text-sm font-bold ring-1 ring-primary-foreground/15 transition-colors hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  <span className="font-mono text-xs tabular-nums text-secondary">{String(i + 1).padStart(2, "0")}</span>
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(isAr, title)}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
};

/* ───────────────────────── 01 · Medical complex ───────────────────────── */

const VillagesRing = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  const dots: { x: number; y: number }[] = [];
  [{ n: 17, r: 92 }, { n: 26, r: 136 }].forEach(({ n, r }, ri) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ri * 0.12;
      dots.push({ x: 160 + r * Math.cos(a), y: 160 + r * Math.sin(a) });
    }
  });
  return (
    <div ref={ref} className="relative mx-auto aspect-square w-full max-w-[360px]">
      <svg viewBox="0 0 320 320" className="h-full w-full" role="img" aria-label={isAr ? "43 قرية حول مجمع اليسر الطبي" : "43 villages around the Al-Yusr medical complex"}>
        <circle cx="160" cy="160" r="92" fill="none" stroke="hsl(var(--primary) / 0.12)" strokeDasharray="3 6" />
        <circle cx="160" cy="160" r="136" fill="none" stroke="hsl(var(--primary) / 0.12)" strokeDasharray="3 6" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="6" className="fill-secondary transition-opacity duration-500 motion-reduce:transition-none" style={{ opacity: inView ? 1 : 0.18, transitionDelay: inView ? `${i * 28}ms` : "0ms" }} />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid h-[122px] w-[122px] place-items-center rounded-full bg-primary text-center text-primary-foreground shadow-card">
          <div>
            <Hospital className="mx-auto h-6 w-6 text-secondary" />
            <p className="mt-1 text-3xl font-black tabular-nums leading-none">43</p>
            <p className="mt-1 text-xs font-bold text-primary-foreground/75">{isAr ? "قرية" : "villages"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BeforeAfter = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [after, setAfter] = useState(true);
  const before: Bi[] = [
    { ar: "لا يوجد مركز طبي واحد في 43 قرية", en: "Not a single medical centre in 43 villages" },
    { ar: "سفر إلى المدن المجاورة من أجل كشف بسيط", en: "Travelling to nearby towns for a simple check-up" },
    { ar: "تكلفة مواصلات تُضاف إلى تكلفة العلاج", en: "Transport costs on top of treatment costs" },
    { ar: "تأجيل الكشف والعلاج حتى تسوء الحالة", en: "Check-ups put off until the condition worsens" },
  ];
  const now: Bi[] = [
    { ar: "مجمع طبي قريب في الحفير بمنطقة البنزينة", en: "A nearby medical complex in El-Hafir" },
    { ar: "عيادات للكشف في التخصصات المختلفة", en: "Clinics across the specialties" },
    { ar: "غرفتا عمليات داخل المجمع", en: "Two operating rooms on site" },
    { ar: "روشتات تُصرف بالمجان للمستحقين", en: "Free prescriptions for those in need" },
  ];
  const items = after ? now : before;
  return (
    <div className="rounded-2xl bg-muted/60 p-5 sm:p-7">
      <div role="radiogroup" aria-label={isAr ? "قبل المجمع وبعده" : "Before and after the complex"} className="inline-flex rounded-xl bg-background p-1 ring-1 ring-border">
        {[
          { v: false, l: { ar: "قبل المجمع", en: "Before" } },
          { v: true, l: { ar: "بعد المجمع", en: "After" } },
        ].map(({ v, l }) => (
          <button
            key={l.en}
            type="button"
            role="radio"
            aria-checked={after === v}
            onClick={() => setAfter(v)}
            className={`min-h-[40px] rounded-lg px-5 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${after === v ? "bg-primary text-primary-foreground" : "text-primary hover:bg-muted"}`}
          >
            {t(isAr, l)}
          </button>
        ))}
      </div>
      <ul aria-live="polite" className="mt-5 space-y-3">
        {items.map((it) => (
          <li key={it.en} className="flex items-start gap-3 text-[0.95rem] font-bold leading-relaxed text-foreground/85">
            <span aria-hidden className={`mt-2 h-2 w-2 shrink-0 rounded-full ${after ? "bg-secondary ring-4 ring-secondary/25" : "bg-muted-foreground/40"}`} />
            {t(isAr, it)}
          </li>
        ))}
      </ul>
    </div>
  );
};

const CLINICS: { id: string; icon: LucideIcon; label: Bi; body: Bi }[] = [
  { id: "internal", icon: Stethoscope, label: { ar: "الباطنة", en: "Internal medicine" }, body: { ar: "كشف ومتابعة لأمراض الباطنة والأمراض المزمنة مثل الضغط والسكر، مع توجيه المريض إلى ما يحتاجه من تحاليل وأشعة.", en: "Check-ups and follow-up for internal and chronic illnesses such as blood pressure and diabetes, with referral to the tests and scans the patient needs." } },
  { id: "dental", icon: Smile, label: { ar: "الأسنان", en: "Dentistry" }, body: { ar: "كشف وعلاج لمشكلات الأسنان واللثة في مكان قريب، بدلًا من السفر من أجل ألم يمكن علاجه.", en: "Dental and gum care close to home, instead of travelling for pain that can be treated nearby." } },
  { id: "eyes", icon: Eye, label: { ar: "العيون", en: "Ophthalmology" }, body: { ar: "كشف على النظر وأمراض العيون، ومتابعة الحالات التي تحتاج إلى علاج أو تدخل.", en: "Eye examinations and care, with follow-up for cases that need treatment or intervention." } },
  { id: "women", icon: HeartPulse, label: { ar: "النساء والتوليد", en: "Obstetrics & gynaecology" }, body: { ar: "متابعة الحمل وصحة المرأة في مكان قريب، دون أن تتحمل الأم مشقة السفر.", en: "Pregnancy follow-up and women's health close to home, sparing mothers the journey." } },
  { id: "more", icon: Bone, label: { ar: "تخصصات أخرى", en: "More specialties" }, body: { ar: "يضم المجمع عيادات للكشف في مختلف التخصصات، لتلبية احتياجات أهالي القرى المحيطة.", en: "The complex has clinics across the specialties to meet the needs of the surrounding villages." } },
];

const ClinicExplorer = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [id, setId] = useState(CLINICS[0].id);
  const c = CLINICS.find((x) => x.id === id) ?? CLINICS[0];
  const Icon = c.icon;
  return (
    <div className="grid overflow-hidden rounded-2xl ring-1 ring-border md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="bg-card p-3 sm:p-4" role="tablist" aria-label={isAr ? "عيادات المجمع" : "The complex's clinics"}>
        {CLINICS.map(({ id: cid, icon: CIcon, label }) => {
          const on = cid === id;
          return (
            <button
              key={cid}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setId(cid)}
              onMouseEnter={() => setId(cid)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-start text-[0.95rem] font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${on ? "bg-primary text-primary-foreground" : "text-primary hover:bg-muted"}`}
            >
              <CIcon className={`h-5 w-5 shrink-0 ${on ? "text-secondary" : ""}`} />
              {t(isAr, label)}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" aria-live="polite" className="flex flex-col justify-center bg-muted/60 p-6 sm:p-8">
        <Icon className="h-9 w-9 text-primary" />
        <h4 className="mt-4 text-xl font-black text-primary">{isAr ? `عيادة ${c.label.ar}` : c.label.en}</h4>
        <p className="mt-3 text-[0.95rem] leading-loose text-muted-foreground">{t(isAr, c.body)}</p>
      </div>
    </div>
  );
};

const ComplexSection = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const src = MEDICAL_SOURCES.complex;
  const shares = useEntityShares(src.kind, src.slug, COMPLEX_SHARES);
  return (
    <Section id="complex" n={1}>
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div>
          <SectionHead
            id="complex"
            n={1}
            eyebrow={isAr ? "مجمع اليسر الطبي" : "Al-Yusr Medical Complex"}
            title={isAr ? "مركز طبي لـ 43 قرية لم يكن فيها مركز واحد" : "A medical centre for 43 villages that had none"}
            lead={
              <>
                <p>
                  {isAr
                    ? "بين محافظتي الدقهلية وكفر الشيخ تقع 43 قرية لا يوجد بها مركز طبي واحد، فيضطر المريض إلى السفر ليحصل على كشف بسيط، وكثيرًا ما يؤجّل علاجه حتى تسوء حالته."
                    : "Between Dakahlia and Kafr El-Sheikh lie 43 villages without a single medical centre, so patients must travel for even a simple check-up and often delay treatment until their condition worsens."}
                </p>
                <p className="mt-3">
                  {isAr
                    ? "لذلك أنشأت مؤسسة اليسر مجمعها الطبي في الحفير بمنطقة البنزينة، ليكون أقرب باب للعلاج لأهالي هذه القرى: عيادات للكشف في كل التخصصات، وغرفتا عمليات، وروشتات تُصرف بالمجان."
                    : "So Al-Yusr built its medical complex in El-Hafir, in the Benzina area, as the nearest door to care for these villages: clinics across the specialties, two operating rooms and free prescriptions."}
                </p>
              </>
            }
          />
          <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-muted/70 px-4 py-2.5 text-sm font-bold text-primary">
            <MapPin className="h-4 w-4 shrink-0" />
            {isAr ? "الحفير، منطقة البنزينة · بين الدقهلية وكفر الشيخ" : "El-Hafir, Benzina area · between Dakahlia and Kafr El-Sheikh"}
          </p>
        </div>
        <VillagesRing />
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-xl font-black text-primary">{isAr ? "ماذا تغيّر في القرى؟" : "What changed for the villages?"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{isAr ? "بدّل بين الحالتين لترى الفرق." : "Switch between the two to see the difference."}</p>
          <div className="mt-5"><BeforeAfter /></div>
        </div>
        <div>
          <h3 className="text-xl font-black text-primary">{isAr ? "عيادات للكشف في كل التخصصات" : "Clinics across the specialties"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{isAr ? "اختر عيادة لتتعرف على ما تقدّمه." : "Pick a clinic to see what it offers."}</p>
          <div className="mt-5"><ClinicExplorer /></div>
        </div>
      </div>

      <figure className="mx-auto mt-16 max-w-3xl border-y border-border py-10 text-center">
        <blockquote className="text-xl font-bold leading-[2] text-primary sm:text-2xl md:text-[1.7rem]">
          {isAr ? "قال رسول الله ﷺ: «أحبُّ الناسِ إلى اللهِ أنفعُهم للناسِ»" : "The Prophet ﷺ said: “The most beloved of people to Allah are those most beneficial to people.”"}
        </blockquote>
        <figcaption className="mt-3 text-sm font-bold text-muted-foreground">{isAr ? "رواه الطبراني، وحسّنه الألباني" : "Narrated by al-Tabarani; graded hasan by al-Albani"}</figcaption>
      </figure>

      <DonationPicker source={src} shares={shares} title={isAr ? "ساهم في مجمع اليسر الطبي" : "Support the medical complex"} />
    </Section>
  );
};

/* ───────────────────────── 02 · Prescriptions ───────────────────────── */

const RX_STEPS: { icon: LucideIcon; title: Bi; body: Bi; question?: Bi }[] = [
  { icon: ClipboardCheck, title: { ar: "استلام الروشتة", en: "Prescription received" }, body: { ar: "يقدّم المريض روشتة الطبيب المعالج، ويُراجع وضعه الاجتماعي للتأكد من استحقاقه.", en: "The patient brings the treating doctor's prescription, and their situation is reviewed to confirm eligibility." } },
  { icon: Stethoscope, title: { ar: "مراجعة الصيدلي", en: "Pharmacist review" }, question: { ar: "هل يتم الصرف؟", en: "Should it be dispensed?" }, body: { ar: "يراجع فريق من الأطباء الصيادلة الروشتة، ويتحقق من صحة الدواء وجرعته قبل الموافقة على الصرف.", en: "A team of doctors and pharmacists reviews the prescription and checks the medicine and dose before approving it." } },
  { icon: Pill, title: { ar: "الصرف بالمجان", en: "Dispensed free" }, body: { ar: "يُصرف الدواء للمريض بالمجان، دون أن يتحمل أي تكلفة.", en: "The medicine is handed to the patient free of charge." } },
  { icon: RotateCcw, title: { ar: "متابعة الجرعة", en: "Dose follow-up" }, question: { ar: "هل أُخذت الجرعة؟", en: "Was the dose taken?" }, body: { ar: "يتابع الفريق التزام المريض بالجرعة، فإن احتاج العلاج إلى استمرار تُصرف الروشتة مرة أخرى.", en: "The team follows up that the dose was taken; if treatment must continue, the prescription is dispensed again." } },
];

const PrescriptionFlow = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [step, setStep] = useState(0);
  const s = RX_STEPS[step];
  const Icon = s.icon;
  const last = step === RX_STEPS.length - 1;
  return (
    <div>
      <ol className="grid grid-cols-4 gap-2">
        {RX_STEPS.map((x, i) => {
          const XIcon = x.icon;
          const on = i === step;
          const done = i < step;
          return (
            <li key={x.title.en} className="relative">
              {i > 0 && <span aria-hidden className={`absolute end-1/2 top-6 h-0.5 w-full ${done || on ? "bg-secondary" : "bg-primary-foreground/20"}`} />}
              <button type="button" onClick={() => setStep(i)} aria-current={on ? "step" : undefined} className="relative z-10 mx-auto flex flex-col items-center gap-2 rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <span className={`grid h-12 w-12 place-items-center rounded-full transition-colors ${on ? "bg-secondary text-slate-950 ring-4 ring-secondary/30" : done ? "bg-secondary/70 text-slate-950" : "bg-primary-foreground/10 text-primary-foreground/60"}`}>
                  <XIcon className="h-5 w-5" />
                </span>
                <span className={`text-center text-[11px] font-black leading-tight sm:text-xs ${on ? "text-secondary" : "text-primary-foreground/70"}`}>{t(isAr, x.title)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div aria-live="polite" className="mt-6 rounded-2xl bg-primary-foreground/[0.07] p-5 ring-1 ring-primary-foreground/15 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-slate-950">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-secondary">{isAr ? `المرحلة ${step + 1} من ${RX_STEPS.length}` : `Stage ${step + 1} of ${RX_STEPS.length}`}</p>
            <h4 className="mt-1 text-lg font-black">
              {t(isAr, s.title)}
              {s.question && <span className="ms-2 text-base font-bold text-secondary">{t(isAr, s.question)}</span>}
            </h4>
            <p className="mt-2 text-sm leading-loose text-primary-foreground/80">{t(isAr, s.body)}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => setStep(last ? 2 : step + 1)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-black text-primary-foreground ring-1 ring-primary-foreground/25 transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
            {last && <RotateCcw className="h-4 w-4" />}
            {last ? (isAr ? "إعادة الصرف عند الحاجة" : "Dispense again if needed") : isAr ? "المرحلة التالية" : "Next stage"}
            {!last && (isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />)}
          </button>
        </div>
      </div>
    </div>
  );
};

const PrescriptionsSection = ({ shares }: { shares: Share[] }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const src = MEDICAL_SOURCES.treatment;
  const share = findShare(shares, ["prescription", "روشت"]);
  const [qty, setQty] = useState(1);
  return (
    <Section id="prescriptions" n={2} tone="dark">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <SectionHead
            id="prescriptions"
            n={2}
            dark
            eyebrow={isAr ? "المساعدات العلاجية" : "Treatment aid"}
            title={isAr ? "روشتات تُصرف بالمجان، بمتابعة الأطباء الصيادلة" : "Free prescriptions, followed up by pharmacists"}
            lead={
              isAr
                ? "نصرف الروشتات بالمجان للمرضى المستحقين، ونتعاون مع فريق من الأطباء الصيادلة يتحقق من كل روشتة قبل صرفها، ثم يتابع: هل أخذ المريض الجرعة، أم يحتاج إلى صرف الروشتة مرة أخرى؟ بهذه المتابعة يصل الدواء إلى من يحتاجه فعلًا، ولا ينقطع علاج المريض المزمن."
                : "We dispense prescriptions free to eligible patients, with a team of doctors and pharmacists who check each one before it is dispensed, then follow up whether the dose was taken or must be dispensed again. This way medicine reaches those who truly need it, and chronic treatment is never interrupted."
            }
          />
          <ul className="mt-6 space-y-3">
            <Point dark>{isAr ? "مراجعة كل روشتة قبل صرفها" : "Every prescription checked before dispensing"}</Point>
            <Point dark>{isAr ? "صرف الدواء بالمجان دون أي تكلفة على المريض" : "Medicine dispensed at no cost to the patient"}</Point>
            <Point dark>{isAr ? "متابعة الجرعة وإعادة الصرف للأمراض المزمنة" : "Dose follow-up and repeat dispensing for chronic illness"}</Point>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-bold text-primary-foreground/70">{isAr ? "اضغط على أي مرحلة لترى ما يحدث فيها:" : "Tap any stage to see what happens in it:"}</p>
          <PrescriptionFlow />
        </div>
      </div>

      {share && (
        <div className="mt-12 grid items-center gap-5 rounded-2xl bg-primary-foreground/[0.07] p-5 ring-1 ring-primary-foreground/15 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,240px)] md:gap-8">
          <div>
            <p className="text-lg font-black">{t(isAr, { ar: share.nameAr, en: share.nameEn })}</p>
            <StartsFrom amount={share.amount} dark />
          </div>
          <Stepper qty={qty} setQty={setQty} dark />
          <p className="text-3xl font-black tabular-nums text-secondary">
            <span dir="ltr">{fmt(share.amount * qty)}</span> <span className="text-sm font-bold text-primary-foreground/70">{isAr ? "جنيه" : "EGP"}</span>
          </p>
          <DonateBtn to={shareDonateHref(src.kind, src.slug, share, qty)}>{isAr ? "تبرّع بروشتة" : "Give a prescription"}</DonateBtn>
        </div>
      )}
    </Section>
  );
};

/* ───────────────────────── 03 · Surgeries ───────────────────────── */

const SURGERY_STEPS: Bi[] = [
  { ar: "مراجعة طبية واجتماعية للحالة", en: "Medical and social review of the case" },
  { ar: "تحديد العملية وتكلفتها مع الطبيب المعالج", en: "Defining the operation and its cost with the treating doctor" },
  { ar: "المشاركة في التكلفة، والأولوية للحالات العاجلة", en: "Sharing the cost, with urgent cases first" },
  { ar: "إجراء العملية داخل المجمع عند الإمكان، ومتابعة المريض بعدها", en: "Surgery inside the complex where possible, with follow-up afterwards" },
];

const SurgeriesSection = ({ shares }: { shares: Share[] }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const src = MEDICAL_SOURCES.treatment;
  return (
    <Section id="surgeries" n={3}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <SectionHead
            id="surgeries"
            n={3}
            eyebrow={isAr ? "المساعدات العلاجية" : "Treatment aid"}
            title={isAr ? "المشاركة في العمليات الجراحية" : "Sharing the cost of surgery"}
            lead={
              isAr
                ? "بعض المرضى يعرفون أن علاجهم في عملية جراحية، لكن التكلفة تقف بينهم وبين الشفاء. نشارك في تكاليف العمليات الجراحية للمرضى غير القادرين، ويضم مجمع اليسر الطبي غرفتي عمليات تخدمان أهالي القرى المحيطة دون عناء السفر."
                : "Some patients know their cure is an operation, but cost stands between them and recovery. We share the cost of surgery for patients who cannot afford it, and the Al-Yusr complex has two operating rooms serving the surrounding villages without the burden of travel."
            }
          />
          <ol className="mt-8 space-y-0">
            {SURGERY_STEPS.map((s, i) => (
              <li key={s.en} className="relative flex gap-4 pb-6 last:pb-0">
                {i < SURGERY_STEPS.length - 1 && <span aria-hidden className="absolute start-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 bg-border" />}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-mono text-sm font-black tabular-nums text-secondary">{i + 1}</span>
                <p className="pt-1.5 text-[0.95rem] font-bold leading-relaxed text-foreground/85">{t(isAr, s)}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col justify-center gap-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-primary text-center text-primary-foreground">
                <Activity className="h-8 w-8 text-secondary" />
                <p className="mt-3 text-sm font-black">{isAr ? `غرفة العمليات ${n === 1 ? "الأولى" : "الثانية"}` : `Operating room ${n}`}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-bold text-muted-foreground">{isAr ? "غرفتا عمليات داخل مجمع اليسر الطبي" : "Two operating rooms inside the Al-Yusr complex"}</p>
        </div>
      </div>
      <ShareBand source={src} share={findShare(shares, ["surgery", "عملي"])} fallbackTitle={{ ar: "العمليات الجراحية", en: "surgery" }} />
    </Section>
  );
};

/* ───────────────────────── 04 · Radiology & labs ───────────────────────── */

const DiagnosisSection = ({ shares }: { shares: Share[] }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const src = MEDICAL_SOURCES.treatment;
  const radiology = findShare(shares, ["radiology", "scan", "أشع"]);
  const labs = findShare(shares, ["lab", "تحالي"]);
  const [kind, setKind] = useState<"radiology" | "labs">("radiology");
  const cols: { id: "radiology" | "labs"; icon: LucideIcon; badge: LucideIcon; title: Bi; body: Bi; points: Bi[]; share?: Share }[] = [
    {
      id: "radiology",
      icon: Scan,
      badge: BadgePercent,
      title: { ar: "الأشعة بسعر مخفّض", en: "Scans at a reduced price" },
      body: { ar: "نتعاون مع مراكز أشعة لإجراء الأشعة التي يطلبها الطبيب المعالج بسعر مخفّض للمستحقين.", en: "We work with radiology centres to provide the scans a treating doctor requests at a reduced price for those in need." },
      points: [
        { ar: "أشعة يطلبها الطبيب المعالج", en: "Scans requested by the treating doctor" },
        { ar: "مراكز أشعة متعاونة مع اليسر", en: "Partner radiology centres" },
        { ar: "سعر مخفّض للمستحقين", en: "A reduced price for those in need" },
      ],
      share: radiology,
    },
    {
      id: "labs",
      icon: FlaskConical,
      badge: FlaskConical,
      title: { ar: "التحاليل الطبية", en: "Lab tests" },
      body: { ar: "نتعاون مع معامل تحاليل لإجراء تحاليل التشخيص والمتابعة للمرضى المستحقين، حتى لا يؤجّل مريض متابعته بسبب التكلفة.", en: "We work with laboratories to run diagnostic and follow-up tests for patients in need, so no one delays follow-up because of cost." },
      points: [
        { ar: "تحاليل التشخيص", en: "Diagnostic tests" },
        { ar: "تحاليل المتابعة للأمراض المزمنة", en: "Follow-up tests for chronic illness" },
        { ar: "معامل تحاليل متعاونة مع اليسر", en: "Partner laboratories" },
      ],
      share: labs,
    },
  ];
  const active = cols.find((c) => c.id === kind) ?? cols[0];
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [kind]);
  return (
    <Section id="diagnosis" n={4} tone="muted">
      <SectionHead
        id="diagnosis"
        n={4}
        eyebrow={isAr ? "المساعدات العلاجية" : "Treatment aid"}
        title={isAr ? "التشخيص الصحيح أول خطوة في العلاج" : "A correct diagnosis is the first step of treatment"}
        lead={isAr ? "كثير من المرضى يتوقف علاجهم عند أشعة أو تحليل لا يقدرون على تكلفته. لذلك نتعاون مع مراكز الأشعة ومعامل التحاليل ليبدأ العلاج على تشخيص صحيح." : "Many patients' treatment stops at a scan or test they cannot afford, so we work with radiology centres and laboratories so treatment starts from a correct diagnosis."}
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {cols.map(({ id, icon: Icon, title, body, points }) => (
          <div key={id} className={`rounded-2xl p-6 transition-shadow sm:p-7 ${kind === id ? "bg-card shadow-card ring-2 ring-primary" : "bg-card ring-1 ring-border"}`}>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-secondary"><Icon className="h-6 w-6" /></span>
              <h3 className="text-xl font-black text-primary">{t(isAr, title)}</h3>
            </div>
            <p className="mt-4 text-[0.95rem] leading-loose text-muted-foreground">{t(isAr, body)}</p>
            <ul className="mt-4 space-y-2.5">{points.map((p) => <Point key={p.en}>{t(isAr, p)}</Point>)}</ul>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div role="radiogroup" aria-label={isAr ? "اختر ما تتبرع به" : "Choose what to give"} className="inline-flex rounded-xl bg-muted p-1">
            {cols.map(({ id, title }) => (
              <button key={id} type="button" role="radio" aria-checked={kind === id} onClick={() => setKind(id)} className={`min-h-[42px] rounded-lg px-4 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${kind === id ? "bg-primary text-primary-foreground" : "text-primary"}`}>
                {id === "radiology" ? (isAr ? "أشعة" : "Scan") : isAr ? "تحاليل" : "Tests"}
                <span className="sr-only"> {t(isAr, title)}</span>
              </button>
            ))}
          </div>
          {active.share && <StartsFrom amount={active.share.amount} />}
        </div>
        {active.share ? (
          <div className="mt-5 grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,240px)] md:gap-8">
            <p className="text-lg font-black text-primary">{t(isAr, { ar: active.share.nameAr, en: active.share.nameEn })}</p>
            <Stepper qty={qty} setQty={setQty} />
            <p className="text-3xl font-black tabular-nums text-primary">
              <span dir="ltr">{fmt(active.share.amount * qty)}</span> <span className="text-sm font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span>
            </p>
            <DonateBtn to={shareDonateHref(src.kind, src.slug, active.share, qty)}>{isAr ? "تبرّع الآن" : "Donate now"}</DonateBtn>
          </div>
        ) : (
          <div className="mt-5 max-w-sm"><DonateBtn to={entityDonateHref(src.kind, src.slug)}>{isAr ? "تبرّع الآن" : "Donate now"}</DonateBtn></div>
        )}
      </div>
    </Section>
  );
};

/* ───────────────────────── 05 · Overcoming disability ───────────────────────── */

const CHILD_PATH: { icon: LucideIcon; title: Bi; body: Bi; note?: boolean }[] = [
  { icon: ClipboardCheck, title: { ar: "تقييم حالة الطفل", en: "Assessing the child" }, body: { ar: "يبدأ الطريق بتقييم طبي لحالة الطفل لتحديد ما يحتاجه من تأهيل وعلاج.", en: "The path starts with a medical assessment to set out the rehabilitation and therapy the child needs." } },
  { icon: Users, title: { ar: "التأهيل", en: "Rehabilitation" }, body: { ar: "برامج تأهيل تساعد الطفل على اكتساب مهارات الحركة والاعتماد على نفسه، ومشاركة أقرانه في الحياة اليومية.", en: "Rehabilitation that helps the child gain movement skills and independence and take part in daily life with other children." } },
  { icon: Activity, title: { ar: "العلاج الطبيعي", en: "Physiotherapy" }, body: { ar: "جلسات علاج طبيعي منتظمة يتابع فيها المختصون تقدّم الطفل جلسة بعد جلسة.", en: "Regular physiotherapy sessions in which specialists follow the child's progress session by session." } },
  { icon: Accessibility, title: { ar: "الأطراف الصناعية لبعض الحالات", en: "Prosthetics for some cases" }, body: { ar: "تُصرف الأطراف الصناعية لبعض الحالات بعد تقييمها طبيًا، وحسب الإمكانات المتاحة.", en: "Prosthetic limbs are provided for some cases after a medical assessment, as resources allow." }, note: true },
];

const DisabilitySection = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const src = MEDICAL_SOURCES.disability;
  const shares = sectionShares(useEntityShares(src.kind, src.slug, NO_SHARES), SECTION_WORDS.disability, DISABILITY_SHARES);
  const [open, setOpen] = useState(0);
  return (
    <Section id="disability" n={5}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <SectionHead
            id="disability"
            n={5}
            eyebrow={isAr ? "تحدّي الإعاقة" : "Overcoming Disability"}
            title={isAr ? "نساند الأطفال ذوي الإعاقة ليتحركوا ويتعلموا ويعيشوا بثقة" : "Helping children with disabilities move, learn and live with confidence"}
            lead={isAr ? "الإعاقة لا ينبغي أن تُغلق باب الطفولة. نقدّم للأطفال ذوي الإعاقة التأهيل وجلسات العلاج الطبيعي، ونصرف الأطراف الصناعية لبعض الحالات، لتعود لهم القدرة على الحركة والمشاركة." : "A disability should not close the door on childhood. We give children with disabilities rehabilitation and physiotherapy, and prosthetic limbs for some cases, so they can move and take part again."}
          />
          <div role="note" className="mt-8 flex items-start gap-3 rounded-2xl bg-[hsl(40_95%_94%)] p-5 text-[hsl(30_60%_25%)]">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-bold leading-relaxed">
              {isAr ? "تنويه: صرف الأطراف الصناعية غير متوفر دائمًا، ويتم حسب الإمكانات المتاحة وبعد التقييم الطبي لكل حالة." : "Note: prosthetic limbs are not always available; they are provided as resources allow and after a medical assessment of each case."}
            </p>
          </div>
        </div>
        <div>
          <p className="mb-4 text-sm font-bold text-muted-foreground">{isAr ? "طريق الطفل معنا، اضغط على كل مرحلة:" : "The child's path with us; tap each stage:"}</p>
          <ol className="space-y-2">
            {CHILD_PATH.map(({ icon: Icon, title, body, note }, i) => {
              const on = i === open;
              return (
                <li key={title.en} className={`overflow-hidden rounded-2xl transition-colors ${on ? "bg-primary text-primary-foreground" : "bg-muted/60"}`}>
                  <button type="button" aria-expanded={on} onClick={() => setOpen(i)} className="flex w-full items-center gap-4 px-5 py-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? "bg-secondary text-slate-950" : "bg-background text-primary"}`}><Icon className="h-5 w-5" /></span>
                    <span className="flex-1">
                      <span className={`block text-xs font-black ${on ? "text-secondary" : "text-primary/55"}`}>{isAr ? `المرحلة ${i + 1}` : `Stage ${i + 1}`}</span>
                      <span className={`block text-base font-black ${on ? "" : "text-primary"}`}>{t(isAr, title)}{note && <span className={`ms-1 ${on ? "text-secondary" : "text-accent"}`}>*</span>}</span>
                    </span>
                  </button>
                  {on && <p className="px-5 pb-5 ps-[4.75rem] text-sm leading-loose text-primary-foreground/80">{t(isAr, body)}</p>}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <DonationPicker source={src} shares={shares} title={isAr ? "ساهم في تحدّي الإعاقة" : "Support Overcoming Disability"} />
    </Section>
  );
};

/* ───────────────────────── 06 · Medical convoys ───────────────────────── */

const ConvoysSection = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const src = MEDICAL_SOURCES.convoys;
  const shares = sectionShares(useEntityShares(src.kind, src.slug, NO_SHARES), SECTION_WORDS.convoys, CONVOY_SHARES);
  const [days, setDays] = useState(5);
  const carries: { icon: LucideIcon; label: Bi; body: Bi }[] = [
    { icon: Users, label: { ar: "مجموعة من الأطباء", en: "A group of doctors" }, body: { ar: "تجتمع في القافلة تخصصات مختلفة لتغطي احتياجات أهل القرية.", en: "Different specialties travel together to cover the village's needs." } },
    { icon: Stethoscope, label: { ar: "معدات طبية بسيطة", en: "Simple equipment" }, body: { ar: "تحمل القافلة المعدات اللازمة للكشف في مكان إقامتها بالقرية.", en: "The convoy carries what is needed to examine patients on site." } },
    { icon: Pill, label: { ar: "كشف وعلاج بالمجان", en: "Free care" }, body: { ar: "يحصل المرضى على الكشف والعلاج دون أي تكلفة.", en: "Patients receive check-ups and treatment at no cost." } },
  ];
  return (
    <Section id="convoys" n={6} tone="dark">
      <SectionHead
        id="convoys"
        n={6}
        dark
        eyebrow={isAr ? "القوافل الطبية" : "Medical convoys"}
        title={isAr ? "حين لا يستطيع المريض الوصول، يصل إليه الطبيب" : "When patients cannot reach a doctor, the doctor reaches them"}
        lead={isAr ? "القافلة الطبية تجمع مجموعة من الأطباء ومعهم معدات طبية بسيطة، وتتجه إلى المناطق البعيدة في القرى الفقيرة، فتقدّم الكشف والعلاج بالمجان لأهلها، وتستمر من 3 إلى 10 أيام حسب احتياج المنطقة." : "A medical convoy gathers a group of doctors with simple equipment and heads to remote, poor villages, offering free check-ups and treatment for 3 to 10 days depending on the area's needs."}
      />
      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ul className="space-y-3">
          {carries.map(({ icon: Icon, label, body }) => (
            <li key={label.en} className="flex gap-4 rounded-2xl bg-primary-foreground/[0.06] p-5 ring-1 ring-primary-foreground/10">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-slate-950"><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-base font-black">{t(isAr, label)}</p>
                <p className="mt-1 text-sm leading-relaxed text-primary-foreground/75">{t(isAr, body)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl bg-primary-foreground/[0.06] p-6 ring-1 ring-primary-foreground/10 sm:p-7">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-black text-secondary">{isAr ? "مدة القافلة" : "Convoy length"}</p>
            <p className="text-3xl font-black tabular-nums">{days} <span className="text-sm font-bold text-primary-foreground/70">{isAr ? "أيام" : "days"}</span></p>
          </div>
          <div className="mt-5 flex gap-1.5" dir="ltr" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`h-10 flex-1 rounded-md transition-colors motion-reduce:transition-none ${i < days ? "bg-secondary" : i < 3 ? "bg-secondary/40" : "bg-primary-foreground/10"}`} />
            ))}
          </div>
          <label htmlFor="convoy-days" className="mt-5 block text-xs font-bold text-primary-foreground/70">{isAr ? "حرّك المؤشر لتغيير المدة (من 3 إلى 10 أيام)" : "Drag to change the length (3 to 10 days)"}</label>
          <input id="convoy-days" type="range" min={3} max={10} value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-2 w-full accent-[hsl(var(--secondary))]" dir="ltr" />
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
            {isAr ? `في قافلة من ${days} أيام، يقدّم الأطباء الكشف والعلاج بالمجان طوال أيامها.` : `In a ${days}-day convoy, the doctors give free check-ups and treatment every day.`}
          </p>
        </div>
      </div>
      <DonationPicker source={src} shares={shares} title={isAr ? "ساهم في القافلة القادمة" : "Support the next convoy"} dark />
    </Section>
  );
};

/* ───────────────────────── Page ───────────────────────── */

const FromTheField = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const gallery = usePageGallery("medical") ?? MEDICAL_GALLERY_DEFAULTS;
  return (
    <section className="bg-muted/40 py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "من الميدان" : "From the field"}</h2>
        {/* Dashboard → معارض صور الصفحات → «من الميدان» في المشروع الطبي (defaults in data/pageGalleries.ts). */}
        <BentoGallery isAr={isAr} items={gallery} />
        <div className="mx-auto mt-10 max-w-4xl">
          <ProjectKindNote
            kinds={["impact"]}
            noteAr="المشروع الطبي من مشاريع الأثر المجتمعي، غايته مساندة المرضى وقت الحاجة حتى لا يتأخر علاج أحد بسبب التكلفة."
            noteEn="The medical project is a community-impact project: standing with patients in need so no one's treatment waits on cost."
          />
        </div>
      </div>
    </section>
  );
};

const MedicalMain = () => {
  const src = MEDICAL_SOURCES.treatment;
  const treatment = useEntityShares(src.kind, src.slug, TREATMENT_SHARES);
  return (
    <>
      <ComplexSection />
      <PrescriptionsSection shares={treatment} />
      <SurgeriesSection shares={treatment} />
      <DiagnosisSection shares={treatment} />
      <DisabilitySection />
      <ConvoysSection />
      <FromTheField />
    </>
  );
};

const MedicalLanding = () => {
  const heroImage = useMedicalHeroImage();
  return (
  <CampaignLandingShell
    slug="medical"
    path="/medical"
    crumbParent={{ ar: "مشاريعنا", en: "Our projects", href: "/projects" }}
    titleAr="المشروع الطبي: مجمع اليسر الطبي والعلاج وتحدّي الإعاقة والقوافل"
    titleEn="The medical project: Al-Yusr Medical Complex, treatment, disability support and convoys"
    taglineAr="مجمع طبي يخدم 43 قرية، وروشتات بالمجان، ومشاركة في العمليات والأشعة والتحاليل، وتأهيل للأطفال ذوي الإعاقة، وقوافل طبية للقرى البعيدة."
    taglineEn="A complex serving 43 villages, free prescriptions, help with surgery, scans and tests, rehabilitation for children with disabilities, and convoys to remote villages."
    metaDescAr="المشروع الطبي من مؤسسة اليسر: مجمع اليسر الطبي بالحفير يخدم 43 قرية بين الدقهلية وكفر الشيخ، صرف روشتات بالمجان، عمليات جراحية، أشعة وتحاليل، تحدّي الإعاقة، وقوافل طبية."
    metaDescEn="Al-Yusr's medical project: the El-Hafir complex serving 43 villages between Dakahlia and Kafr El-Sheikh, free prescriptions, surgery, scans and tests, disability support and medical convoys."
    seo={{ title: { ar: "علاج المرضى غير القادرين في مصر: عمليات وروشتات وأشعة | اليسر", en: "The medical project: complex, prescriptions, surgery & convoys | Al-Yusr" } }}
    heroImage={heroImage}
    heroAlt="طبيب من مؤسسة اليسر مع مريض أثناء صرف العلاج"
    hero={<MedicalHero />}
    main={<MedicalMain />}
    relatedLinks={[
      { href: "/projects", ar: "كل المشاريع", en: "All projects" },
      { href: "/takrim", ar: "تكريم الإنسان", en: "Takrim" },
      { href: "/water", ar: "سقيا الماء", en: "Clean water" },
      { href: "/trust", ar: "الشفافية والتقارير", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "أين يقع مجمع اليسر الطبي؟", a: "في الحفير بمنطقة البنزينة، بين محافظتي الدقهلية وكفر الشيخ، ويخدم 43 قرية لم يكن بها مركز طبي واحد." },
        { q: "ما العيادات الموجودة في المجمع؟", a: "عيادات للكشف في التخصصات المختلفة، مثل الباطنة والأسنان والعيون والنساء والتوليد، إلى جانب غرفتي عمليات." },
        { q: "كيف تُصرف الروشتات بالمجان؟", a: "يراجع فريق من الأطباء الصيادلة الروشتة قبل صرفها، ثم يتابع التزام المريض بالجرعة، وتُصرف الروشتة مرة أخرى إذا احتاج العلاج إلى استمرار." },
        { q: "هل الأشعة والتحاليل مجانية؟", a: "نتعاون مع مراكز أشعة لإجراء الأشعة بسعر مخفّض للمستحقين، ومع معامل تحاليل لإجراء التحاليل اللازمة لهم." },
        { q: "هل الأطراف الصناعية متاحة لكل الحالات؟", a: "لا، صرف الأطراف الصناعية غير متوفر دائمًا، ويتم لبعض الحالات حسب الإمكانات المتاحة وبعد التقييم الطبي." },
        { q: "ما القافلة الطبية؟", a: "قافلة تجمع مجموعة من الأطباء ومعدات طبية بسيطة، وتتجه إلى القرى الفقيرة البعيدة لتقدّم الكشف والعلاج بالمجان لمدة من 3 إلى 10 أيام." },
        { q: "هل يمكنني التبرع بأكثر من سعر السهم؟", a: "نعم، السعر المعروض هو بداية السهم، ويمكنك زيادة عدد الأسهم في الصفحة أو تعديل المبلغ في صفحة التبرع." },
      ],
      en: [
        { q: "Where is the Al-Yusr medical complex?", a: "In El-Hafir, Benzina area, between Dakahlia and Kafr El-Sheikh; it serves 43 villages that had no medical centre." },
        { q: "Which clinics does it have?", a: "Clinics across specialties such as internal medicine, dentistry, ophthalmology and obstetrics & gynaecology, plus two operating rooms." },
        { q: "How are prescriptions dispensed free?", a: "Doctors and pharmacists review each prescription before it is dispensed, follow up that the dose was taken, and dispense it again if treatment must continue." },
        { q: "Are scans and tests free?", a: "We partner with radiology centres for scans at a reduced price for those in need, and with laboratories for the tests they need." },
        { q: "Are prosthetic limbs available for every case?", a: "No. They are not always available and are provided for some cases as resources allow, after a medical assessment." },
        { q: "What is a medical convoy?", a: "A group of doctors with simple equipment who travel to remote poor villages and give free check-ups and treatment for 3 to 10 days." },
        { q: "Can I give more than one share?", a: "Yes. The price shown is where a share starts; add more shares on the page or change the amount on the donation page." },
      ],
    }}
    donateHref={entityDonateHref("project", "medical")}
    donateLabelAr="تبرّع للمشروع الطبي"
    donateLabelEn="Support the medical project"
    bottomCtaAr="كن سببًا في شفاء مريض"
    bottomCtaEn="Be the reason a patient heals"
    bottomSubAr="كل سهم يصل إلى مريض بعينه: دواء، أو أشعة، أو عملية، أو جلسة تأهيل لطفل."
    bottomSubEn="Every share reaches a real patient: medicine, a scan, surgery or a rehabilitation session for a child."
  />
  );
};

export default MedicalLanding;
