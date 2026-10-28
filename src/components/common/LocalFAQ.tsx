import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { fetchFaqs, type FaqItem } from "@/data/faqsApi";

export type FAQItem = { q: string; a: string };

/**
 * AEO/voice-search-optimized FAQ block. Renders an accessible accordion
 * matching the premium Programs FAQ design with circular badges & clean responsive layout.
 * Supports dynamic backend loading via categorySlug with seamless fallback.
 */
export const LocalFAQ = ({
  items = [],
  categorySlug,
  title,
  intro,
  donateHref = "/donate",
  waText,
  id = "local-faq",
}: {
  items?: FAQItem[];
  categorySlug?: string;
  title?: string;
  intro?: string;
  donateHref?: string;
  waText?: string;
  id?: string;
}) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const wa = `https://wa.me/201097000137?text=${encodeURIComponent(
    waText || (isAr ? "السلام عليكم، عندي سؤال عن التبرع للحملة." : "Hi, I have a question about donating to the campaign."),
  )}`;

  const { data: dynamicFaqs } = useQuery<FaqItem[]>({
    queryKey: ["faqs", categorySlug],
    queryFn: () => fetchFaqs({ categorySlug }),
    enabled: !!categorySlug,
    staleTime: 60_000,
  });

  const resolvedItems: FAQItem[] = useMemo(() => {
    if (dynamicFaqs && dynamicFaqs.length > 0) {
      return dynamicFaqs.map((f) => ({
        q: isAr ? f.question_ar : (f.question_en || f.question_ar),
        a: isAr ? f.answer_ar : (f.answer_en || f.answer_ar),
      }));
    }
    return items;
  }, [dynamicFaqs, items, isAr]);

  if (!resolvedItems.length) return null;

  return (
    <section id={id} className="bg-background pt-14 pb-20 sm:pb-28 md:pt-20 md:pb-36 scroll-mt-24" dir={isAr ? "rtl" : "ltr"}>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: resolvedItems.map((it) => ({
            "@type": "Question",
            name: it.q,
            acceptedAnswer: { "@type": "Answer", text: it.a },
          })),
        })}</script>
      </Helmet>
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mx-auto max-w-2xl text-center" dir={isAr ? "rtl" : "ltr"}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3.5 py-1 text-xs font-bold text-secondary">
            <Sparkles className="h-3.5 w-3.5" /> {isAr ? "أسئلة شائعة" : "FAQ"}
          </span>
          <h2 className="mt-3 text-2xl font-black text-primary sm:text-3xl md:text-4xl">
            {title || (isAr ? "أسئلة شائعة حول الحملة" : "Frequently Asked Questions")}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground md:text-base">
            {intro || (isAr ? "إجابات واضحة وشفافة عن كل ما يخص تبرعك، طرق التنفيذ، والتوثيق الميداني." : "Clear, transparent answers about your donation, delivery, and documentation.")}
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="mt-8 rounded-3xl border border-border bg-card p-2 shadow-soft md:p-4"
          dir={isAr ? "rtl" : "ltr"}
        >
          {resolvedItems.map((it, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-border/60 last:border-b-0"
            >
              <AccordionTrigger className="px-3 py-4 text-start text-sm font-extrabold text-primary hover:no-underline md:text-base group">
                <span className="flex items-start gap-2.5 min-w-0">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary/20 text-secondary transition group-data-[state=open]:bg-secondary group-data-[state=open]:text-emerald-950 group-data-[state=open]:font-black">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-start leading-snug">{it.q}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-sm leading-7 text-muted-foreground md:text-base">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Center link to FAQ Hub */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/faqs"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-secondary/40 bg-card px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-secondary/10 transition"
          >
            <span>{isAr ? "مركز الأسئلة الشائعة" : "FAQ Center"}</span>
            {isAr ? <ArrowLeft className="h-3.5 w-3.5 text-secondary" /> : <ArrowRight className="h-3.5 w-3.5 text-secondary" />}
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground md:text-sm">
          {isAr ? (
            <>
              لسه عندك استفسار عن الحملة؟{" "}
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-primary hover:text-secondary underline underline-offset-4"
              >
                راسلنا على واتساب
              </a>{" "}
              أو تعرّف على{" "}
              <Link
                to="/trust"
                className="font-extrabold text-primary hover:text-secondary underline underline-offset-4"
              >
                معايير الشفافية والتوثيق
              </Link>.
            </>
          ) : (
            <>
              Still have questions about this campaign?{" "}
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-primary hover:text-secondary underline underline-offset-4"
              >
                Message us on WhatsApp
              </a>{" "}
              or check our{" "}
              <Link
                to="/trust"
                className="font-extrabold text-primary hover:text-secondary underline underline-offset-4"
              >
                transparency reports
              </Link>.
            </>
          )}
        </p>
      </div>
    </section>
  );
};

export default LocalFAQ;
