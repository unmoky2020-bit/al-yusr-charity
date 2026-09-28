import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { useQuery } from "@tanstack/react-query";
import { unifiedContentApi, type LaravelUnifiedContent } from "@/data/laravelApi";

const FAQS = [
  {
    ar: { q: "إزاي أتأكد إن تبرعي وصل فعليًا للمستحقين؟", a: "كل تبرع نوثقه بتقارير ميدانية وصور، ونرسل للمتبرعين متابعة دورية مع احترام خصوصية الأسر." },
    en: { q: "How do I know my donation reached the right people?", a: "We document every gift with field reports and photos, sending donors regular updates while preserving family privacy." },
  },
  {
    ar: { q: "هل مؤسسة اليسر مرخصة وشفافة؟", a: "نعم. اليسر مسجلة رسميًا برقم 2655/2019 وتصدر تقارير مالية وميدانية دورية لكل حملة." },
    en: { q: "Is Al-Yusr officially licensed and transparent?", a: "Yes — registered under No. 2655/2019, we publish regular financial and field reports for every campaign." },
  },
  {
    ar: { q: "إزاي بتختاروا الأسر والمشاريع؟", a: "نتبع زيارات ميدانية ومعايير استحقاق حقيقية لاختيار الأسر والمشاريع الأكثر حاجة والأثر المستدام." },
    en: { q: "How do you choose families and projects?", a: "We use field visits and real eligibility criteria to select the most deserving families and sustainable projects." },
  },
  {
    ar: { q: "إيه البرامج اللي بتدعمها المؤسسة الآن؟", a: "نركز على الغذاء، الصحة، التعليم، الماء، السكن، وكفالة الأيتام مع متابعة حتى تحسّن حالة الأسرة." },
    en: { q: "Which programs does the foundation support now?", a: "We focus on food, health, education, water, shelter, and orphan sponsorship with follow-up until families improve." },
  },
  {
    ar: { q: "إيه طرق الدفع المتاحة؟", a: "فيزا/ماستر عبر Paymob، فودافون كاش، InstaPay، وتحويل بنكي CIB. كل الطرق آمنة وشفافة." },
    en: { q: "What payment methods are available?", a: "Visa/Master via Paymob, Vodafone Cash, InstaPay, and CIB bank transfer — all secure and transparent." },
  },
  {
    ar: { q: "هل أقدر أتبرع بعملات مختلفة؟", a: "نستقبل تبرعات بالجنيه المصري، الدولار الأمريكي، والريال السعودي عبر التحويل البنكي." },
    en: { q: "Can I donate in different currencies?", a: "Yes — we accept EGP, USD, and SAR via bank transfer." },
  },
  {
    ar: { q: "هل يمكنني التطوع أو الشراكة معكم؟", a: "أكيد. سجّل كمتطوع أو تواصل معنا للشراكات المجتمعية، وفريقنا سيعود لك خلال 48 ساعة." },
    en: { q: "Can I volunteer or partner with you?", a: "Absolutely. Register as a volunteer or contact us for community partnerships, and our team will respond within 48 hours." },
  },
  {
    ar: { q: "هل دعمكم مرة واحدة ولا مستمر؟", a: "نؤمن بالأثر المستدام؛ برامجنا تشمل متابعة دورية، تعليم مستمر، وتأمين أسر المدى البعيد." },
    en: { q: "Is your support one-off or ongoing?", a: "We believe in sustainable impact; our programs include regular follow-up, ongoing education, and long-term family support." },
  },
  {
    ar: { q: "فين بننفّذ مشاريعنا حاليًا؟", a: "تركيزنا الأساسي في الدقهلية والمنصورة، مع مشاريع تمتد لأكثر من 34 محافظة في مصر." },
    en: { q: "Where do you operate currently?", a: "Our main focus is Dakahlia and Mansoura, with projects extending to more than 34 governorates across Egypt." },
  },
  {
    ar: { q: "هل بتحافظوا على كرامة الأسر؟", a: "طبعًا. كل توزيع يتم بكرامة، مع احترام الأسرة وتطبيق ضوابط إنسانية واضحة." },
    en: { q: "Do you protect beneficiary dignity?", a: "Absolutely. Every distribution is carried out with dignity, respecting families and following clear humanitarian standards." },
  },
];

export const FAQ = () => {
  const { lang } = useLang();
  const [open, setOpen] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);

  const { data: liveFaqs } = useQuery({
    queryKey: ["faqs-content"],
    queryFn: () => unifiedContentApi.listByType("faq", "published"),
    staleTime: 60_000,
  });

  const allFaqs = (liveFaqs && liveFaqs.length > 0)
    ? liveFaqs.map((f: LaravelUnifiedContent) => ({
        ar: { q: f.title_ar, a: f.content_ar || f.summary_ar || "" },
        en: { q: f.title_en || f.title_ar, a: f.content_en || f.summary_en || f.content_ar || "" },
      }))
    : FAQS;

  const visibleFaqs = showAll ? allFaqs : allFaqs.slice(0, 5);
  return (
    <section id="faq" className="relative bg-background pt-16 md:pt-20 pb-20 sm:pb-24 md:pb-28">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: allFaqs.map((f) => ({
            "@type": "Question",
            name: f[lang].q,
            acceptedAnswer: { "@type": "Answer", text: f[lang].a },
          })),
        })}</script>
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-primary shadow-sm">
            <HelpCircle className="h-6 w-6 text-secondary" />
          </div>
          <h2 className="mt-3 text-3xl font-black text-primary md:text-4xl">
            {lang === "ar" ? "الأسئلة الشائعة" : "Frequently asked"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            {lang === "ar" ? "إجابات على أكثر الأسئلة اللي بتوصلنا. لو محتاج توضيح إضافي، تواصل معانا." : "Answers to the most common questions. Need more? Contact us."}
          </p>
        </div>

        <div className="space-y-3">
          {visibleFaqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className={`overflow-hidden rounded-2xl border-2 transition-all duration-200 ${isOpen ? "border-secondary bg-secondary/5 shadow-sm" : "border-border bg-card hover:border-secondary/40"}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-start font-extrabold text-primary md:p-5"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm md:text-base leading-snug">{f[lang].q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground md:px-5 md:text-base">
                    {f[lang].a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!showAll && FAQS.length > 5 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2.5 text-sm font-black text-white shadow-cta transition hover:bg-secondary/90 hover:-translate-y-0.5"
            >
              <ChevronDown className="h-4 w-4" />
              {lang === "ar" ? "عرض المزيد من الأسئلة" : "Show more questions"}
            </button>
          </div>
        )}
        {showAll && FAQS.length > 5 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                setShowAll(false);
                setOpen(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-secondary bg-transparent px-6 py-2.5 text-sm font-black text-secondary transition hover:bg-secondary/5"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
              {lang === "ar" ? "عرض أسئلة أقل" : "Show less"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
