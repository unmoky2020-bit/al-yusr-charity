import { useState } from "react";
import { Link } from "react-router-dom";
import { Hospital, Pill, Activity, Scan, FlaskConical, Accessibility, HeartHandshake, Truck, CheckCircle2, Heart, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { ProjectKindNote } from "@/components/campaigns/ProjectKind";
import { BentoGallery } from "@/components/campaigns/shared";
import { useLang } from "@/i18n/LangContext";
import heroHealth from "@/assets/program-health.webp";
import prostheticsImg from "@/assets/Prosthetics.jpg";
import medicineImg from "@/assets/axis-health.jpg";

/**
 * /medical — every kind of medical aid Al-Yusr gives, in one page: the medical complexes,
 * prescriptions, surgeries, radiology, lab tests, prosthetics, overcoming disability and convoys.
 * Each service donates to the program that funds it (dashboard → البرامج: treatment / prosthetics).
 */
const TREATMENT = "/donate?program=treatment";
const PROSTHETICS = "/donate?program=prosthetics";

type Service = { id: string; icon: LucideIcon; ar: string; en: string; bodyAr: string; bodyEn: string; coversAr: string[]; coversEn: string[]; donate: string };

const SERVICES: Service[] = [
  {
    id: "complexes",
    icon: Hospital,
    ar: "مجمعات اليسر الطبية",
    en: "Al-Yusr medical complexes",
    bodyAr: "مجمع المنصورة الطبي والتعليمي، مبنى من ٤ أدوار بيخدم أهالي الدقهلية، ومركز غسيل كلوي بالمنزلة بيقدّم جلسات غسيل مجانية للمناطق البعيدة.",
    bodyEn: "The Mansoura medical and educational complex, a four-storey building serving Dakahlia, and a dialysis centre in El-Manzala offering free sessions to remote areas.",
    coversAr: ["كشف وعيادات تخصصية", "جلسات غسيل كلوي مجانية", "متابعة الحالات المزمنة"],
    coversEn: ["Specialist clinics", "Free dialysis sessions", "Chronic case follow-up"],
    donate: TREATMENT,
  },
  {
    id: "prescriptions",
    icon: Pill,
    ar: "صرف الروشتات",
    en: "Prescriptions",
    bodyAr: "صرف الأدوية للمرضى غير القادرين، وخصوصًا أدوية الأمراض المزمنة اللي المريض محتاجها كل شهر ومينفعش يوقفها.",
    bodyEn: "Medicines for patients who cannot pay, especially monthly chronic-disease medication that must not be interrupted.",
    coversAr: ["أدوية الضغط والسكر والقلب", "علاج شهري منتظم", "صرف بعد مراجعة الروشتة"],
    coversEn: ["Blood pressure, diabetes and heart medicines", "Regular monthly treatment", "Dispensed after prescription review"],
    donate: TREATMENT,
  },
  {
    id: "surgeries",
    icon: Activity,
    ar: "العمليات الجراحية",
    en: "Surgeries",
    bodyAr: "المساهمة في العمليات العاجلة اللي المريض مش قادر على تكلفتها، بعد بحث طبي واجتماعي للحالة.",
    bodyEn: "Contributing to urgent surgeries patients cannot afford, after a medical and social review of the case.",
    coversAr: ["عمليات قلب وعظام وعيون", "حالات عاجلة بالأولوية", "متابعة بعد العملية"],
    coversEn: ["Heart, bone and eye surgery", "Urgent cases first", "Post-operative follow-up"],
    donate: TREATMENT,
  },
  {
    id: "radiology",
    icon: Scan,
    ar: "الأشعة",
    en: "Radiology",
    bodyAr: "التشخيص الصح أول خطوة في العلاج. بنساعد المرضى في تكلفة الأشعة اللي الدكتور طالبها علشان العلاج يبدأ صح.",
    bodyEn: "Correct diagnosis is the first step of treatment. We help patients with the cost of the scans their doctor requests.",
    coversAr: ["أشعة عادية وسونار", "أشعة مقطعية ورنين", "بطلب من الطبيب المعالج"],
    coversEn: ["X-ray and ultrasound", "CT and MRI", "As requested by the treating doctor"],
    donate: TREATMENT,
  },
  {
    id: "labs",
    icon: FlaskConical,
    ar: "التحاليل",
    en: "Lab tests",
    bodyAr: "تحاليل التشخيص والمتابعة اللي بتتكرر مع الأمراض المزمنة، علشان المريض ما يأجّلش المتابعة بسبب التكلفة.",
    bodyEn: "Diagnostic and follow-up tests that chronic illness requires again and again, so no patient delays follow-up because of cost.",
    coversAr: ["تحاليل دم شاملة", "وظائف كلى وكبد", "تحاليل متابعة دورية"],
    coversEn: ["Full blood tests", "Kidney and liver function", "Regular follow-up tests"],
    donate: TREATMENT,
  },
  {
    id: "prosthetics",
    icon: Accessibility,
    ar: "الأطراف الصناعية",
    en: "Prosthetic limbs",
    bodyAr: "طرف صناعي حديث بيرجّع الإنسان لشغله وحياته. بنغطي الحالة من أولها لآخرها، ومش بنسلّم الطرف ونمشي.",
    bodyEn: "A modern prosthetic limb returns a person to work and life. We cover the case from start to finish, not just the hand-over.",
    coversAr: ["تقييم طبي وتصميم على المقاس", "التركيب وجلسات إعادة التأهيل", "متابعة لمدة سنة"],
    coversEn: ["Medical assessment and custom design", "Fitting and rehabilitation sessions", "One year of follow-up"],
    donate: PROSTHETICS,
  },
  {
    id: "disability",
    icon: HeartHandshake,
    ar: "تحدّي الإعاقة",
    en: "Overcoming disability",
    bodyAr: "دعم ذوي الهمم بالأجهزة والعلاج اللي يساعدهم يتحرّكوا ويتعلّموا ويشتغلوا، ويرجعوا جزء فعّال من المجتمع.",
    bodyEn: "Supporting people with disabilities with the devices and therapy that help them move, learn and work, and take their place in society.",
    coversAr: ["كراسي متحركة وعكازات وأجهزة تعويضية", "علاج طبيعي وجلسات تخاطب للأطفال", "دمج اجتماعي وربط بفرص عمل"],
    coversEn: ["Wheelchairs, crutches and assistive devices", "Physiotherapy and speech therapy for children", "Social integration and job links"],
    donate: PROSTHETICS,
  },
  {
    id: "convoys",
    icon: Truck,
    ar: "القوافل الطبية",
    en: "Medical convoys",
    bodyAr: "قوافل طبية تخصصية بتوصل للقرى البعيدة اللي أهلها مش قادرين يسافروا للمستشفى.",
    bodyEn: "Specialist medical convoys reaching distant villages whose people cannot travel to a hospital.",
    coversAr: ["كشف تخصصي في القرية", "صرف علاج مجاني", "تحويل الحالات المحتاجة للمجمع"],
    coversEn: ["Specialist check-ups in the village", "Free medicine", "Referral to the complex when needed"],
    donate: TREATMENT,
  },
];

const ServicePicker = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [active, setActive] = useState(SERVICES[0].id);
  const s = SERVICES.find((x) => x.id === active) ?? SERVICES[0];
  const Icon = s.icon;
  return (
    <div>
      <div role="tablist" aria-label={isAr ? "أنواع المساعدات الطبية" : "Types of medical aid"} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {SERVICES.map((x) => {
          const XIcon = x.icon;
          const on = x.id === active;
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="medical-service-panel"
              onClick={() => setActive(x.id)}
              className={`flex items-center gap-2.5 rounded-2xl border p-3 text-start transition ${on ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-card text-primary hover:border-secondary/60"}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${on ? "bg-secondary text-slate-950" : "bg-secondary/15"}`}><XIcon className="h-5 w-5" /></span>
              <span className="text-sm font-black leading-tight">{isAr ? x.ar : x.en}</span>
            </button>
          );
        })}
      </div>
      <div id="medical-service-panel" role="tabpanel" aria-live="polite" className="mt-5 grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h3 className="flex items-center gap-2 text-2xl font-black text-primary"><Icon className="h-7 w-7 text-secondary" />{isAr ? s.ar : s.en}</h3>
          <p className="mt-3 text-base leading-loose text-muted-foreground">{isAr ? s.bodyAr : s.bodyEn}</p>
          <Link to={s.donate} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-orange-grad px-6 py-3 text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95">
            <Heart className="h-4 w-4" /> {isAr ? `ساهم في ${s.ar}` : `Support ${s.en.toLowerCase()}`}
          </Link>
        </div>
        <div className="rounded-2xl bg-muted/40 p-5">
          <p className="text-sm font-black text-primary">{isAr ? "بيشمل:" : "Includes:"}</p>
          <ul className="mt-3 space-y-2.5">
            {(isAr ? s.coversAr : s.coversEn).map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm font-bold text-foreground/85"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const MedicalBody = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "اختار نوع المساعدة الطبية" : "Choose a type of medical aid"}</h2>
        <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-loose text-muted-foreground sm:text-base">
          {isAr
            ? "المرض بيكسر البيت مرتين: مرة بالألم ومرة بالتكلفة. علشان كده المساعدات الطبية في اليسر بتغطي رحلة المريض كلها: من الكشف والتحاليل والأشعة، للروشتة والعملية، لحد الطرف الصناعي وجلسات التأهيل."
            : "Illness breaks a home twice: once with pain and once with cost. Al-Yusr's medical aid covers the whole patient journey: check-ups, tests and scans, prescriptions and surgery, through to prosthetics and rehabilitation."}
        </p>
        <div className="mt-8"><ServicePicker /></div>
      </div>

      <ProjectKindNote
        kinds={["impact"]}
        noteAr="المساعدات الطبية من مشاريع الأثر المجتمعي: مساندة الناس وقت الاحتياج، علشان ما حدش يتأخر في علاجه بسبب الفلوس."
        noteEn="Medical aid is a community-impact project: standing with people in need so no one delays treatment because of money."
      />

      <div>
        <h2 className="mb-8 text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "من الميدان" : "From the field"}</h2>
        <BentoGallery
          isAr={isAr}
          items={[
            { src: heroHealth, altAr: "طبيب من فريق اليسر يطمئن على مريض أثناء صرف العلاج", altEn: "An Al-Yusr doctor checking on a patient while medicine is handed out" },
            { src: prostheticsImg, altAr: "شاب بطرف صناعي من مشروع تحدّي الإعاقة مع الطبيب المعالج", altEn: "A young man with a prosthetic limb from the Overcoming Disability programme" },
            { src: medicineImg, altAr: "تسليم كرتونة أدوية لمريضة كبيرة في السن", altEn: "Handing a box of medicines to an elderly patient" },
          ]}
        />
      </div>
    </div>
  );
};

const MedicalLanding = () => (
  <CampaignLandingShell
    slug="medical"
    path="/medical"
    crumbParent={{ ar: "برامجنا", en: "Programs", href: "/programs" }}
    badgeAr="مساعدات طبية · الدقهلية والمنصورة"
    badgeEn="Medical aid · Dakahlia & Mansoura"
    titleAr="المساعدات الطبية — علاج وعمليات وأشعة وتحاليل وأطراف صناعية"
    titleEn="Medical aid — treatment, surgery, scans, tests and prosthetics"
    taglineAr="مجمعات اليسر الطبية، وصرف الروشتات، والعمليات، والأشعة والتحاليل، والأطراف الصناعية، وتحدّي الإعاقة، في مكان واحد. علشان ما حدش يتأخر في علاجه بسبب الفلوس."
    taglineEn="Al-Yusr medical complexes, prescriptions, surgeries, scans and tests, prosthetics and overcoming disability, in one place, so no one delays treatment because of money."
    metaDescAr="المساعدات الطبية من مؤسسة اليسر في الدقهلية والمنصورة: مجمعات اليسر الطبية، صرف روشتات، عمليات جراحية، أشعة وتحاليل، أطراف صناعية وكراسي متحركة، وتحدّي الإعاقة."
    metaDescEn="Al-Yusr medical aid in Dakahlia and Mansoura: medical complexes, prescriptions, surgeries, scans and lab tests, prosthetic limbs, wheelchairs and disability support."
    seo={{ title: { ar: "المساعدات الطبية: روشتات وعمليات وأشعة وتحاليل وأطراف صناعية | مؤسسة اليسر", en: "Medical aid: prescriptions, surgery, scans, tests & prosthetics | Al-Yusr" } }}
    heroImage={heroHealth}
    heroAlt="طبيب من مؤسسة اليسر مع مريض أثناء قافلة طبية وصرف علاج"
    pillars={[
      { titleAr: "بحث طبي واجتماعي", titleEn: "Medical and social review", descAr: "كل حالة بتتراجع طبيًا واجتماعيًا قبل الصرف، علشان المساعدة توصل لمستحقها.", descEn: "Every case is reviewed medically and socially before support, so it reaches those who need it." },
      { titleAr: "رحلة علاج كاملة", titleEn: "The whole treatment journey", descAr: "من التشخيص بالأشعة والتحاليل، للعلاج والعملية، لحد التأهيل والمتابعة.", descEn: "From diagnosis by scans and tests, to treatment and surgery, through rehabilitation and follow-up." },
      { titleAr: "توثيق ومتابعة", titleEn: "Documented and followed up", descAr: "بنتابع الحالة بعد المساعدة، وبنوثّق الأثر للمتبرع.", descEn: "We follow the case after support and document the impact for the donor." },
    ]}
    body={<MedicalBody />}
    relatedLinks={[
      { href: "/programs", ar: "كل البرامج", en: "All programs" },
      { href: "/programs/treatment", ar: "برنامج سهم العلاج", en: "Treatment programme" },
      { href: "/programs/prosthetics", ar: "تحدّي الإعاقة", en: "Overcoming disability" },
      { href: "/takrim", ar: "تكريم الإنسان", en: "Takrim" },
      { href: "/trust", ar: "الشفافية والتقارير", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "إيه أنواع المساعدات الطبية اللي بتقدّمها اليسر؟", a: "مجمعات اليسر الطبية ومركز الغسيل الكلوي، وصرف الروشتات، والمساهمة في العمليات، والأشعة والتحاليل، والأطراف الصناعية، ودعم ذوي الهمم بالأجهزة والعلاج الطبيعي، والقوافل الطبية للقرى." },
        { q: "مين يستحق المساعدة الطبية؟", a: "المرضى غير القادرين بعد بحث طبي واجتماعي للحالة، والأولوية للحالات العاجلة والأمراض المزمنة." },
        { q: "إيه اللي بيشمله مشروع الأطراف الصناعية؟", a: "التقييم الطبي، وتصميم الطرف على المقاس، والتركيب، وجلسات إعادة التأهيل، والمتابعة لمدة سنة." },
        { q: "إيه هو تحدّي الإعاقة؟", a: "هو الاسم الجديد لمشروع «لن تمنعني»: كراسي متحركة وأجهزة تعويضية، وعلاج طبيعي وتخاطب للأطفال، ودمج اجتماعي وربط بفرص عمل لذوي الهمم." },
        { q: "إزاي أتبرع لنوع معيّن من المساعدات؟", a: "اختار نوع المساعدة من القسم التفاعلي في الصفحة، ودوس على زرار المساهمة، وهيفتح لك التبرع على البرنامج المناسب." },
      ],
      en: [
        { q: "What medical aid does Al-Yusr give?", a: "Medical complexes and a dialysis centre, prescriptions, surgery contributions, scans and lab tests, prosthetics, devices and therapy for people with disabilities, and village medical convoys." },
        { q: "Who qualifies?", a: "Patients who cannot pay, after a medical and social review, with priority for urgent and chronic cases." },
        { q: "What does the prosthetics programme cover?", a: "Medical assessment, custom design, fitting, rehabilitation sessions and one year of follow-up." },
        { q: "What is Overcoming Disability?", a: "The new name of the former programme: wheelchairs and assistive devices, physiotherapy and speech therapy for children, and social integration and job links." },
        { q: "How do I give to a specific type of aid?", a: "Pick the type in the interactive section and press its support button; the donation opens on the matching programme." },
      ],
    }}
    donateHref={TREATMENT}
    donateLabelAr="تبرع للمساعدات الطبية"
    donateLabelEn="Support medical aid"
    bottomCtaAr="كن سبب في شفاء مريض"
    bottomCtaEn="Be the reason a patient heals"
  />
);

export default MedicalLanding;
