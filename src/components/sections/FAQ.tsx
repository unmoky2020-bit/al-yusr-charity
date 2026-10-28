import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { useQuery } from "@tanstack/react-query";
import { fetchFaqs, type FaqItem } from "@/data/faqsApi";

export const FAQ = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [open, setOpen] = useState<string | null>("0");
  const [showAll, setShowAll] = useState(false);

  const { data: rawFaqs } = useQuery({
    queryKey: ["faqs-home"],
    queryFn: () => fetchFaqs({ categorySlug: "home" }),
    staleTime: 60_000,
  });

  const allFaqs = (rawFaqs && rawFaqs.length > 0)
    ? rawFaqs.map((f: FaqItem) => ({
        ar: { q: f.question_ar, a: f.answer_ar },
        en: { q: f.question_en || f.question_ar, a: f.answer_en || f.answer_ar },
      }))
    : [];

  // Show 6 by default (fills 2-col grid evenly), then all
  const visibleFaqs = showAll ? allFaqs : allFaqs.slice(0, 6);

  return (
    <section id="faq" className="relative bg-background pt-16 md:pt-20 pb-20 sm:pb-24 md:pb-28" dir={isAr ? "rtl" : "ltr"}>
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
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-xl text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-secondary/20 shadow-sm">
            <HelpCircle className="h-5 w-5 text-secondary" />
          </div>
          <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
            {isAr ? "الأسئلة الشائعة" : "Frequently Asked"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAr ? "إجابات واضحة على أكثر الأسئلة شيوعاً." : "Clear answers to the most common questions."}
          </p>
        </div>

        {/* Questions: one per row */}
        <div className="space-y-3">
          {visibleFaqs.map((f, i) => {
            const key = String(i);
            const isOpen = open === key;
            return (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                  isOpen
                    ? "border-secondary bg-secondary/5 shadow-sm"
                    : "border-border bg-card hover:border-secondary/40"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : key)}
                  className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-start font-extrabold text-primary cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base leading-snug">{f[lang].q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-secondary transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-3">
                    {f[lang].a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions: 2 buttons side-by-side in one row on all screens */}
        <div className="mt-8 mx-auto max-w-md grid grid-cols-2 gap-2.5 sm:gap-3">
          {allFaqs.length > 5 ? (
            !showAll ? (
              <button
                onClick={() => setShowAll(true)}
                className="inline-flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-secondary px-3 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black text-emerald-950 shadow-cta transition hover:opacity-90 hover:-translate-y-0.5 cursor-pointer"
              >
                <ChevronDown className="h-4 w-4" />
                <span>{isAr ? "عرض المزيد" : "Show more"}</span>
              </button>
            ) : (
              <button
                onClick={() => { setShowAll(false); setOpen(null); }}
                className="inline-flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full border-2 border-secondary bg-transparent px-3 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black text-secondary transition hover:bg-secondary/5 cursor-pointer"
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
                <span>{isAr ? "عرض أقل" : "Show less"}</span>
              </button>
            )
          ) : <div />}

          <Link
            to="/faqs"
            className={`inline-flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-border bg-card px-3 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5 transition ${
              allFaqs.length <= 5 ? "col-span-2 max-w-xs mx-auto" : ""
            }`}
          >
            <span>{isAr ? "مركز الأسئلة" : "FAQ Center"}</span>
            {isAr ? <ArrowLeft className="h-4 w-4 text-secondary" /> : <ArrowRight className="h-4 w-4 text-secondary" />}
          </Link>
        </div>
      </div>
    </section>
  );
};
