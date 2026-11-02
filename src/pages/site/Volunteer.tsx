import { useState, useRef, useMemo } from "react";
import { NiceSelect } from "@/components/common/NiceSelect";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchFaqs, type FaqItem } from "@/data/faqsApi";
import {
  HandHeart, Sparkles, Users, Truck, Stethoscope, Camera, Code2,
  Send, MapPin, BadgeCheck, ArrowLeft, ArrowRight, Clock, Heart,
  Lightbulb, Globe2, CalendarCheck, BookOpen, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/i18n/LangContext";
import { VolunteerJourney } from "@/components/sections/VolunteerJourney";
import { toast } from "@/hooks/use-toast";
import { track } from "@/lib/track";
import { volunteersApi } from "@/data/laravelApi";
import imgField1 from "@/assets/yusr-distribution-1.webp";

const TRACKS_AR = [
  { I: Truck, t: "قوافل التوزيع الميداني", d: "شارك بوقتك في الميدان وساعدنا في توصيل كراتين الغذاء والمساعدات إلى أبواب الأسر في قرى الدقهلية.", tag: "مناسب: لكل من يملك يومًا أو نصف يوم", area: "field" },
  { I: Users, t: "بحث وتوثيق الحالات", d: "استخدم مهارات التواصل والكتابة لزيارة الأسر المستحقة وتوثيق احتياجاتها بدقة وأمانة.", tag: "مناسب: للباحثين والطلاب وأصحاب الثقة", area: "cases" },
  { I: Stethoscope, t: "القوافل الطبية والصحية", d: "خبرتك تصنع فرقًا حقيقيًا: أطباء وصيادلة وتمريض وطلاب طب ضمن القوافل الشهرية.", tag: "مناسب: للأطباء والصيادلة والتمريض", area: "medical" },
  { I: Camera, t: "الإعلام والمحتوى", d: "حوّل أثر الخير إلى قصة تصل للناس عبر التصوير والفيديو والتصميم والكتابة وإدارة منصات التواصل.", tag: "مناسب: للمصورين والمصممين وكتّاب المحتوى", area: "media" },
  { I: Code2, t: "الدعم التقني والإداري", d: "مهاراتك خلف الكواليس تساعدنا على تشغيل كل شيء: برمجة ومحاسبة وتصميم وتنسيق.", tag: "مناسب: للمطورين والمحاسبين والإداريين", area: "tech" },
  { I: HandHeart, t: "متطوع عام", d: "لا تحتاج إلى تخصص. أي وقت أو جهد تقدمه يصنع فرقًا حقيقيًا في حياة أسرة محتاجة.", tag: "مناسب: للجميع", area: "general" },
];

const TRACKS_EN = [
  { I: Truck, t: "Field distribution convoys", d: "Your time in the field - help deliver food boxes & aid to families doorstep in Dakahlia villages.", tag: "Fits: anyone with a free day or half-day", area: "field" },
  { I: Users, t: "Case research & documentation", d: "Your communication & writing skills - visit deserving families and document their needs with accuracy.", tag: "Fits: social workers, students, trusted individuals", area: "cases" },
  { I: Stethoscope, t: "Medical & health convoys", d: "Your expertise transforms lives - doctors, pharmacists, nurses or medical students for monthly convoys.", tag: "Fits: doctors, pharmacists, nurses", area: "medical" },
  { I: Camera, t: "Media & social content", d: "Your talent tells impact stories - photography, video, design, writing, managing our social presence.", tag: "Fits: photographers, designers, content writers", area: "media" },
  { I: Code2, t: "Tech & admin support", d: "Your skills behind the scenes power everything - developers, accountants, designers, and coordinators.", tag: "Fits: developers, accountants, administrators", area: "tech" },
  { I: HandHeart, t: "General volunteer", d: "You don't need to be a specialist - any time and effort you give makes a real difference.", tag: "Fits: everyone", area: "general" },
];

const WHY_AR = [
  { I: Clock, t: "مرونة كاملة", d: "تطوع في الوقت الذي يناسبك: ساعة أو يوم أو موسم كامل، دون التزامات ثابتة." },
  { I: Heart, t: "أثر حقيقي تراه", d: "سترى بعينيك الأسرة التي وصل إليها جهدك، وليس مجرد أرقام وتقارير." },
  { I: Lightbulb, t: "طوّر نفسك", d: "اكتسب خبرة ميدانية وشهادة تطوع رسمية ووسّع دائرة علاقاتك." },
  { I: Globe2, t: "مجتمع من صُنّاع الأثر", d: "انضم إلى مئات المتطوعين من الأطباء والمهندسين والمدرسين والشباب." },
];

const WHY_EN = [
  { I: Clock, t: "Total flexibility", d: "Volunteer when you can - an hour, a day, or a full season. No fixed obligations." },
  { I: Heart, t: "Real impact you see", d: "You see with your own eyes the family your help reached - not just numbers." },
  { I: Lightbulb, t: "Grow yourself", d: "Field experience, an official volunteer certificate, and expand your network." },
  { I: Globe2, t: "Network of changemakers", d: "Join hundreds of volunteers: doctors, engineers, teachers, and youth." },
];

const FAQS_AR = [
  { q: "هل أحتاج إلى خبرة أو مؤهل؟", a: "لا. معظم مسارات التطوع لا تحتاج إلى خبرة، فقط وقتك ورغبتك الصادقة. أما المسارات المتخصصة مثل الطب والتقنية فتحتاج إلى خبرة في المجال." },
  { q: "هل التطوع مدفوع؟", a: "لا توجد مكافأة مالية، لكنك تكتسب خبرة ميدانية وشهادة رسمية وأثرًا حقيقيًا. كما نغطي الانتقالات في القوافل الميدانية." },
  { q: "كم عدد ساعات التطوع شهريًا؟", a: "لا يوجد حد أدنى. يمكنك المشاركة في نشاط واحد شهريًا أو أكثر، حسب وقتك وظروفك." },
  { q: "هل يمكنني التطوع عن بُعد؟", a: "نعم. يمكن تنفيذ مسارات التوثيق والإعلام والدعم التقني بالكامل عن بُعد." },
];

const FAQS_EN = [
  { q: "Do I need experience or a qualification?", a: "No. Most tracks require no experience - just your time and genuine willingness. Specialized tracks (medical, tech) require expertise in those areas." },
  { q: "Is volunteering paid?", a: "No financial compensation - but you gain field experience, an official certificate, and real impact. Transport for field convoys is covered." },
  { q: "How many hours per month?", a: "No minimum. You can join one activity a month or more - based on your availability." },
  { q: "Can I volunteer remotely?", a: "Yes. Documentation, media, and tech support tracks can be done fully remotely." },
];

const Volunteer = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const reduce = useReducedMotion();
  const base = "https://elyusr.org";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const tracks = isRTL ? TRACKS_AR : TRACKS_EN;
  const why = isRTL ? WHY_AR : WHY_EN;

  const { data: dynamicFaqs } = useQuery<FaqItem[]>({
    queryKey: ["faqs-volunteer"],
    queryFn: () => fetchFaqs({ categorySlug: "volunteer" }),
    staleTime: 60_000,
  });

  const faqs = useMemo(() => {
    if (dynamicFaqs && dynamicFaqs.length > 0) {
      return dynamicFaqs.map((f) => ({
        q: isRTL ? f.question_ar : (f.question_en || f.question_ar),
        a: isRTL ? f.answer_ar : (f.answer_en || f.answer_ar),
      }));
    }
    return isRTL ? FAQS_AR : FAQS_EN;
  }, [dynamicFaqs, isRTL]);

  const [form, setForm] = useState({ name: "", phone: "", city: "", area: "field", skills: "", availability: "" });
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const startedAt = useRef<number>(Date.now());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2 || form.phone.trim().length < 8) {
      toast({ title: isRTL ? "من فضلك راجع البيانات المطلوبة" : "Please review the form" });
      return;
    }
    setSending(true);
    track("volunteer_submit", { fbEvent: "Lead", payload: { source: "volunteer-page", area: form.area, city: form.city, time_to_submit_ms: Date.now() - startedAt.current } });

    try {
      await volunteersApi.create({
        name: form.name.trim(),
        email: `${form.phone.trim().replace(/\D/g, "")}@volunteer.elyusr.org`,
        phone: form.phone.trim(),
        city: form.city.trim() || (isRTL ? "المنصورة" : "Mansoura"),
        governorate: isRTL ? "الدقهلية" : "Dakahlia",
        skills: form.skills ? [form.skills, form.area] : [form.area],
        notes: `مسار التطوع: ${form.area} | أوقات التفرغ: ${form.availability}`,
        status: "pending",
      });
    } catch (err) {
      console.warn("Laravel volunteersApi submit note (continuing gracefully):", err);
    } finally {
      setSending(false);
      toast({ title: isRTL ? "تم تسجيل طلبك وسنتواصل معك خلال 48 ساعة" : "Registered - we will reach out within 48h", description: isRTL ? "شكرًا لوقتك وجهدك" : "Thank you for your time and effort", });
      setForm({ name: "", phone: "", city: "", area: "field", skills: "", availability: "" });
    }
  };

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "تطوع مع اليسر في الدقهلية والمنصورة | وقتك وخبرتك تصنع الأثر" : "Volunteer in Dakahlia & Mansoura - your time, effort & expertise is enough | Al-Yusr"}
        description={isRTL ? "تطوع مع مؤسسة اليسر في قوافل التوزيع وزيارات الحالات والقوافل الطبية والإعلام والدعم التقني. لا تحتاج إلى التبرع بالمال؛ وقتك وخبرتك يكفيان لصناعة أثر حقيقي." : "Volunteer with Al-Yusr in Dakahlia: distribution convoys, case visits, medical convoys, media, tech support. You do not need to donate - your time, effort and expertise are enough."}
        path="/volunteer"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[{ name: isRTL ? "الرئيسية" : "Home", url: `${base}/` }, { name: isRTL ? "تطوع معنا" : "Volunteer with us", url: `${base}/volunteer` }]} />

      {/* Hero */}
      <section className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="absolute inset-0 leaf-bg opacity-40" aria-hidden />
        <div className="container relative mx-auto px-4 py-14 md:py-20">
          <div className="flex justify-center text-primary-foreground/80 md:justify-start">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "تطوع معنا" : "Volunteer" }]} />
          </div>
          <div className="mt-6 grid items-center gap-10 md:grid-cols-2">
            <div className="text-center md:text-start">
              <motion.span
                initial={reduce ? false : { opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3.5 py-1 text-[11px] font-black text-secondary shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isRTL ? "أكثر من متبرع، كن شريكًا في إيصال الخير" : "More than a donor - be a partner in delivering good"}
              </motion.span>
              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="mx-auto mt-4 max-w-xl text-3xl font-black leading-tight sm:text-4xl md:mx-0 md:text-5xl"
              >
                {isRTL ? "تطوع مع اليسر في الدقهلية" : "Volunteer in Dakahlia - your time, effort & expertise is enough"}
              </motion.h1>
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.14 }}
                className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-relaxed text-primary-foreground/85 sm:text-base md:mx-0 md:text-lg"
              >
                {isRTL
                  ? "لا تحتاج إلى التبرع بالمال. يمكنك أن تمنح وقتك في الميدان، أو خبرتك الطبية والتقنية، أو موهبتك في التصوير، أو حتى نصف يوم في قافلة توزيع. كل جهد تقدمه يصل إلى أسرة محتاجة في الدقهلية."
                  : "You do not need to donate money - you can volunteer your time in the field, your medical or tech expertise, your photography talent, or even a half-day at a distribution convoy. Every effort you give reaches a needy family in Dakahlia."}
              </motion.p>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start"
              >
                <Button asChild size="lg" className="rounded-full bg-orange-grad px-7 py-3 text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95">
                  <a href="#join"><HandHeart className="h-4 w-4" /> {isRTL ? "انضم إلينا" : "Join us"}</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/30 bg-white/10 px-6 py-3 text-sm font-black text-primary-foreground backdrop-blur hover:bg-white/20">
                  <a href="#tracks">{isRTL ? "استكشف المسارات" : "Explore tracks"}</a>
                </Button>
              </motion.div>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 text-xs font-black md:justify-start">
                {[
                  { k: "200+", v: isRTL ? "متطوع نشط" : "active volunteers" },
                  { k: "6", v: isRTL ? "مسارات تطوع" : "volunteer tracks" },
                  { k: "48h", v: isRTL ? "زمن الاستجابة" : "response time" },
                ].map((s) => (
                  <div key={s.k} className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                    <span className="font-mono font-black text-secondary">{s.k}</span>
                    <span className="opacity-90">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md md:max-w-none">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-secondary/15 blur-2xl" aria-hidden />
              <img src={imgField1} alt={isRTL ? "متطوعو اليسر في قافلة توزيع بالدقهلية" : "Al-Yusr volunteers on a distribution convoy in Dakahlia"} className="relative aspect-[4/3] w-full rounded-[2rem] border-4 border-secondary/40 object-cover shadow-card" loading="eager" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Volunteer */}
      <section className="bg-card py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-400/10 px-3.5 py-1 text-xs font-extrabold text-primary">
              <Heart className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "لماذا تتطوع معنا؟" : "Why volunteer with us?"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">{isRTL ? "وقتك أثمن مما تتخيل" : "Your time is worth more than you imagine"}</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {why.map((w, i) => (
              <div key={i} className="rounded-3xl border border-border bg-background p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/15 text-primary"><w.I className="h-5 w-5" /></div>
                <h3 className="mt-3 font-black text-primary">{w.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks — Fixed opacity / flicker free */}
      <section id="tracks" className="scroll-mt-24 bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
              <CalendarCheck className="h-3.5 w-3.5" />
              {isRTL ? "مسارات التطوع" : "Volunteer tracks"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "اختر المسار الذي يناسبك" : "Pick a track that fits you"}
            </h2>
            <p className="mx-auto mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              {isRTL ? "ستة مسارات للتطوع، اختر واحدًا أو أكثر. لا يشترط أن تكون متخصصًا في جميعها." : "Six tracks — choose one or more. You do not need to be an expert in all of them."}
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t, i) => (
              <div
                key={i}
                className="group flex flex-col rounded-3xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-card"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-primary transition-transform duration-300 group-hover:scale-105">
                  <t.I className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-base font-black leading-snug text-primary">{t.t}</h3>
                <p className="mt-2 flex-1 text-sm leading-[1.65] text-muted-foreground">{t.d}</p>
                <span className="mt-3 inline-block self-start rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-[10.5px] font-extrabold text-primary">{t.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <VolunteerJourney />

      {/* Merged: Program benefits + Field story + Promise (replaces /programs/volunteer) */}
      <section className="bg-muted/30 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Section header */}
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
              <HandHeart className="h-3.5 w-3.5" />
              {isRTL ? "ماذا تكسب من التطوع؟" : "What you gain by volunteering"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "وعدنا لك كمتطوع" : "Our promise to you as a volunteer"}
            </h2>
            <p className="mx-auto mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              {isRTL
                ? "هتنزل مع فريقنا، هتسلم الخير بإيدك، وهتشوف فرحة الناس قدامك. ساعة من وقتك ممكن تفرّح بيت كامل."
                : "You'll go out with our team, hand-deliver aid yourself, and see the joy of people in front of you. One hour of your time can bring joy to a whole home."}
            </p>
          </div>

          {/* 4 benefit cards (from programs.ts volunteer entry) */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { I: HandHeart, ar: "تنزل مع فريقنا للميدان", en: "Field work with our team" },
              { I: Heart,     ar: "تسلم الخير بإيدك للأسر", en: "Hand-deliver aid to families" },
              { I: BadgeCheck, ar: "شهادة تطوع رسمية", en: "Official volunteer certificate" },
              { I: BookOpen, ar: "تدريب مجاني على العمل الخيري", en: "Free training in charitable work" },
            ].map((b, i) => (
              <motion.div
                key={i}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{ willChange: "opacity, transform" }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-soft"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary">
                  <b.I className="h-6 w-6" />
                </div>
                <span className="text-sm font-extrabold leading-snug text-primary">{isRTL ? b.ar : b.en}</span>
              </motion.div>
            ))}
          </div>

          {/* Field story quote (from programs.ts longContent) */}
          <div className="mt-8 rounded-3xl border border-secondary/20 bg-card p-6 shadow-soft md:p-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/15">
                <Sparkles className="h-5 w-5 text-secondary" />
              </span>
              <div className="space-y-3 text-sm leading-[1.7] text-muted-foreground md:text-base">
                <p className="font-extrabold text-primary">
                  {isRTL
                    ? "في بيوت كتير في المنصورة مستنية حد يوصلها الخير، وممكن تكون أنت السبب في الفرحة دي."
                    : "Many homes in Mansoura await someone to deliver kindness — and you could be the reason for that joy."}
                </p>
                <p>
                  {isRTL
                    ? "ابعتلنا رسالة على الخاص وفريقنا هيتواصل معاك ويقولك خطوات الانضمام لفريق المتطوعين."
                    : "Send us a message and our team will reach out to guide you through joining the volunteer team."}
                </p>
              </div>
            </div>
          </div>

          {/* 3 operational promise cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { I: BadgeCheck, ar: "توجيه وتدريب قبل كل نشاط", en: "Orientation & training before each activity" },
              { I: MapPin,    ar: "تغطية انتقالات القوافل الميدانية", en: "Transport for field convoys covered" },
              { I: BookOpen,  ar: "شهادة تطوع رسمية معتمدة", en: "Official accredited volunteer certificate" },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 shadow-soft">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary">
                  <p.I className="h-5 w-5" />
                </div>
                <span className="text-sm font-extrabold text-primary">{isRTL ? p.ar : p.en}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background py-12 md:py-16" dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center text-xl font-black text-primary md:text-2xl">
            {isRTL ? "أسئلة شائعة عن التطوع" : "Volunteer FAQs"}
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                <button type="button" className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-start font-extrabold text-primary cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="text-sm sm:text-base leading-snug">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-secondary transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                      <p className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-3">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Center link to FAQ Hub */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/faqs"
              className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-card px-5 py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-secondary/10 transition"
            >
              <span>{isRTL ? "مركز الأسئلة الشائعة" : "View all FAQs"}</span>
              <Arrow className="h-3.5 w-3.5 text-secondary" />
            </Link>
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="join" className="scroll-mt-24 bg-card py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
              <HandHeart className="h-3.5 w-3.5" />
              {isRTL ? "انضم إلى فريق التطوع" : "Join the volunteer team"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">{isRTL ? "سجّل الآن" : "Register now"}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{isRTL ? "سنتواصل معك خلال 48 ساعة لتنسيق النشاط المناسب لوقتك والمسار الذي اخترته." : "We will contact you within 48 hours to coordinate the next activity that fits your time and track."}</p>
          </div>
          <form onSubmit={submit} className="mt-8 grid gap-4 rounded-3xl border border-border bg-background p-6 shadow-card md:p-8">
            <Input required maxLength={100} placeholder={isRTL ? "الاسم بالكامل *" : "Full name *"} className="h-12" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input dir="ltr" required maxLength={20} placeholder="01XXXXXXXXX *" className="h-12" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input maxLength={60} placeholder={isRTL ? "المدينة / المحافظة" : "City / Governorate"} className="h-12" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-extrabold text-foreground">{isRTL ? "مسار التطوع المفضل" : "Your preferred volunteer track"}</label>
              <NiceSelect value={form.area} onChange={(v) => setForm({ ...form, area: v })} ariaLabel={isRTL ? "مسار التطوع" : "Volunteer track"} dir={isRTL ? "rtl" : "ltr"}
                options={[
                  { value: "field", label: isRTL ? "قوافل التوزيع الميداني" : "Field distribution convoys" },
                  { value: "cases", label: isRTL ? "بحث وتوثيق الحالات" : "Case research & documentation" },
                  { value: "medical", label: isRTL ? "القوافل الطبية والصحية" : "Medical & health convoys" },
                  { value: "media", label: isRTL ? "الإعلام والمحتوى" : "Media & social content" },
                  { value: "tech", label: isRTL ? "الدعم التقني والإداري" : "Tech & admin support" },
                  { value: "general", label: isRTL ? "متطوع عام" : "General volunteer" },
                ]} />
            </div>
            <Input maxLength={100} placeholder={isRTL ? "وقت التفرغ (مثال: كل جمعة أو الإجازات)" : "Your availability (e.g. every Friday, or holidays)"} className="h-12" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
            <Textarea maxLength={500} rows={4} placeholder={isRTL ? "مهارات أو خبرات يمكن أن تساعدنا (اختياري)" : "Skills or expertise that could help (optional)"} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
            <Button type="submit" disabled={sending} className="mt-2 h-12 bg-orange-grad text-base font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
              <Send className="h-4 w-4" />
              {sending ? (isRTL ? "جارٍ الإرسال..." : "Sending...") : (isRTL ? "سجّلني كمتطوع" : "Register me as a volunteer")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isRTL ? "هل لديك سؤال أولًا؟ " : "Have a question first? "}
            <Link to="/contact" className="font-extrabold text-secondary underline-offset-4 hover:underline">
              {isRTL ? "تواصل معنا" : "Contact us"}
              {isRTL ? <ArrowLeft className="inline h-4 w-4 ms-1" /> : <ArrowRight className="inline h-4 w-4 ms-1" />}
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Volunteer;
