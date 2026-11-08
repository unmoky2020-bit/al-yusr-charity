import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search, HelpCircle, ChevronDown, Sparkles, MessageCircle, Phone,
  X, ArrowLeft, ArrowRight
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, FAQSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useQuery } from "@tanstack/react-query";
import {
  fetchFaqs, fetchFaqCategories, FAQ_PAGE_CATEGORIES,
  type FaqItem, type FaqCategory
} from "@/data/faqsApi";


export const FaqCenter = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  // Fetch live FAQs
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["all-faqs"],
    queryFn: () => fetchFaqs(),
    staleTime: 60_000,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["faq-categories"],
    queryFn: () => fetchFaqCategories(),
    staleTime: 60_000,
  });

  // Filter FAQs based on selected category & search query
  const filteredFaqs = useMemo(() => {
    let list = faqs;

    if (selectedCategory !== "all") {
      list = list.filter((f) => {
        const catSlug = f.category?.slug?.toLowerCase() || f.pageCategory?.toLowerCase();
        const catName = f.category?.name_ar || "";
        return (
          catSlug === selectedCategory.toLowerCase() ||
          (selectedCategory === "home" && (catSlug === "home" || catName.includes("رئيس"))) ||
          (selectedCategory === "about" && (catSlug === "about" || catName.includes("نحن"))) ||
          (selectedCategory === "programs" && (catSlug === "programs" || catName.includes("برامج"))) ||
          (selectedCategory === "contact" && (catSlug === "contact" || catName.includes("تواصل"))) ||
          (selectedCategory === "campaigns" && (catSlug === "campaigns" || catName.includes("حملات"))) ||
          (selectedCategory === "markoun" && (catSlug === "markoun" || catName.includes("مركون"))) ||
          (selectedCategory === "qurbani" && (catSlug === "qurbani" || catName.includes("أضاحي") || catName.includes("صكوك"))) ||
          (selectedCategory === "zakat" && (catSlug === "zakat" || catName.includes("زكاة"))) ||
          (selectedCategory === "volunteer" && (catSlug === "volunteer" || catName.includes("تطوع"))) ||
          (selectedCategory === "trust" && (catSlug === "trust" || catName.includes("شفافية"))) ||
          (selectedCategory === "services" && (catSlug === "services" || catName.includes("خدمات"))) ||
          (selectedCategory === "general" && (catSlug === "general" || catSlug === "donations" || catName.includes("تبرع")))
        );
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.question_ar.toLowerCase().includes(q) ||
          f.answer_ar.toLowerCase().includes(q) ||
          (f.question_en && f.question_en.toLowerCase().includes(q)) ||
          (f.answer_en && f.answer_en.toLowerCase().includes(q))
      );
    }

    return list;
  }, [faqs, selectedCategory, searchQuery]);

  // Group filtered FAQs by Category if "all" is active
  const groupedFaqs = useMemo(() => {
    if (selectedCategory !== "all" || searchQuery.trim()) {
      return null;
    }

    const groups: { category: typeof FAQ_PAGE_CATEGORIES[0]; items: FaqItem[] }[] = [];

    FAQ_PAGE_CATEGORIES.forEach((cat) => {
      const items = filteredFaqs.filter((f) => {
        const cSlug = f.category?.slug?.toLowerCase() || f.pageCategory?.toLowerCase();
        const cName = f.category?.name_ar || "";
        return (
          cSlug === cat.slug.toLowerCase() ||
          (cat.slug === "home" && (cSlug === "home" || cName.includes("رئيس"))) ||
          (cat.slug === "about" && (cSlug === "about" || cName.includes("نحن"))) ||
          (cat.slug === "programs" && (cSlug === "programs" || cName.includes("برامج"))) ||
          (cat.slug === "contact" && (cSlug === "contact" || cName.includes("تواصل"))) ||
          (cat.slug === "campaigns" && (cSlug === "campaigns" || cName.includes("حملات"))) ||
          (cat.slug === "markoun" && (cSlug === "markoun" || cName.includes("مركون"))) ||
          (cat.slug === "qurbani" && (cSlug === "qurbani" || cName.includes("أضاحي"))) ||
          (cat.slug === "zakat" && (cSlug === "zakat" || cName.includes("زكاة"))) ||
          (cat.slug === "trust" && (cSlug === "trust" || cName.includes("شفافية"))) ||
          (cat.slug === "volunteer" && (cSlug === "volunteer" || cName.includes("تطوع"))) ||
          (cat.slug === "services" && (cSlug === "services" || cName.includes("خدمات"))) ||
          (cat.slug === "general" && (cSlug === "general" || cSlug === "donations"))
        );
      });

      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    });

    return groups;
  }, [filteredFaqs, selectedCategory, searchQuery]);

  const toggleAccordion = (key: string) => {
    setOpenIndex((prev) => (prev === key ? null : key));
  };

  return (
    <PageLayout>
      <SEOHelmet
        title={isAr ? "مركز الأسئلة الشائعة | مؤسسة اليسر الخيرية" : "FAQ Center | Al-Yusr Charity Foundation"}
        description={
          isAr
            ? "دليلك الشامل والموثق للإجابة عن جميع الأسئلة المتعلقة بالتبرعات، البرامج، كرتونة الغذاء، صكوك الأضاحي، الزكاة، وحملة مركون والتطوع في مصر."
            : "Comprehensive guide to all questions regarding donations, programs, Qurbani, Zakat, and volunteering with Al-Yusr Charity Foundation."
        }
        path="/faqs"
      />
      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: isAr ? "الرئيسية" : "Home", url: "/" },
          { name: isAr ? "مركز الأسئلة الشائعة" : "FAQ Center", url: "/faqs" },
        ]}
      />

      {/* FAQPage Rich Structured JSON-LD (shared FAQSchema component) */}
      {filteredFaqs.length > 0 && (
        <FAQSchema
          items={filteredFaqs.slice(0, 40).map((f) => ({
            q: isAr ? f.question_ar : (f.question_en || f.question_ar),
            a: isAr ? f.answer_ar : (f.answer_en || f.answer_ar),
          }))}
        />
      )}

      {/* ─── Hero Section — matches CampaignsPage ─── */}
      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-40" />

        <div className="container relative mx-auto max-w-5xl px-4 py-10 text-center md:py-16">
          <div className="flex justify-center text-primary-foreground/75">
            <Breadcrumbs
              items={[
                { name: isAr ? "الرئيسية" : "Home", href: "/" },
                { name: isAr ? "مركز الأسئلة الشائعة" : "FAQ Center" },
              ]}
            />
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/15 px-4 py-1.5 text-xs font-bold text-secondary backdrop-blur">
            <Sparkles className="h-4 w-4" />
            <span>{isAr ? "مركز المساعدة والأسئلة الشائعة" : "Help & FAQ Center"}</span>
          </div>

          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            {isAr ? (
              <>كل ما يدور في بالك عن التبرع <span className="text-gradient-lime">واليسر</span>... إجابته هنا</>
            ) : (
              <>Clear answers about <span className="text-gradient-lime">Al-Yusr</span> & your donations</>
            )}
          </h1>
          <p className="mx-auto mt-2.5 max-w-2xl text-xs leading-relaxed text-primary-foreground/85 sm:text-sm md:text-base">
            {isAr
              ? "إجابات دقيقة وشفافة وموثقة لكل ما يخص تبرعاتك، مصارف أموالك، وطرق الوصول للمستحقين في الدقهلية ومحافظات مصر."
              : "Verified and transparent answers regarding your donations, field assessment, and delivery to deserving families."}
          </p>

          {/* Search Box */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "ابحث عن أي سؤال، كلمة مفتاحية، أو موضوع..." : "Search for questions, keywords, or topics..."}
                className="w-full rounded-2xl border-2 border-white/20 bg-card py-4 text-sm md:text-base font-semibold text-foreground shadow-2xl transition placeholder:text-muted-foreground focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/20 ltr:pl-12 ltr:pr-12 rtl:pr-5 rtl:pl-20"
                dir={isAr ? "rtl" : "ltr"}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-11 grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                  title={isAr ? "مسح البحث" : "Clear search"}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-start text-xs text-primary-foreground/80">
                {isAr
                  ? `تم العثور على ${filteredFaqs.length} نتيجة بحث عن: "${searchQuery}"`
                  : `Found ${filteredFaqs.length} results for: "${searchQuery}"`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── Category Filter Navigation — no icons in pills ─── */}
      <section className="sticky top-16 z-30 border-b border-border/80 bg-background/95 backdrop-blur shadow-sm">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs md:text-sm font-bold transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-foreground hover:bg-muted hover:text-primary"
              }`}
            >
              <span>{isAr ? "جميع الأسئلة" : "All FAQs"}</span>
              <span className="ms-1 rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.5 text-[10px]">{faqs.length}</span>
            </button>

            {FAQ_PAGE_CATEGORIES.map((cat) => {
              const count = faqs.filter(
                (f) => (f.category?.slug || f.pageCategory) === cat.slug
              ).length;
              const isSelected = selectedCategory === cat.slug;

              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs md:text-sm font-bold transition cursor-pointer ${
                    isSelected
                      ? "bg-secondary text-black shadow-sm font-black"
                      : "bg-muted/60 text-foreground hover:bg-muted hover:text-primary"
                  }`}
                >
                  <span>{isAr ? cat.name_ar : cat.name_en}</span>
                  {count > 0 && (
                    <span className="ms-1 rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.5 text-[10px]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQs Content Section ─── */}
      <section className="py-12 md:py-20 bg-background" dir={isAr ? "rtl" : "ltr"}>
        <div className="container mx-auto max-w-4xl px-4">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 font-bold">{isAr ? "جارٍ تحميل الأسئلة الشائعة..." : "Loading FAQs..."}</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-black text-foreground">
                {isAr ? "لم نجد أي أسئلة تطابق بحثك" : "No questions matched your search"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAr ? "جرّب البحث بكلمات أخرى أو اختر تصنيفًا مختلفًا." : "Try searching with different keywords or clear the filter."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm"
              >
                {isAr ? "عرض كل الأسئلة" : "Show all FAQs"}
              </button>
            </div>
          ) : groupedFaqs ? (
            /* Grouped View when "all" is active without search query */
            <div className="space-y-12">
              {groupedFaqs.map(({ category, items }) => {
                return (
                  <div key={category.slug} className="scroll-mt-32" id={`cat-${category.slug}`}>
                    <div className="mb-4 flex items-center justify-between border-b border-border/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-secondary text-black text-xs font-black shadow-sm">
                          {items.length}
                        </span>
                        <div>
                          <h2 className="text-xl font-black text-primary md:text-2xl">
                            {isAr ? category.name_ar : category.name_en}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {isAr ? category.description_ar : category.description_en}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-secondary/25 px-2.5 py-0.5 text-xs font-black text-black">
                        {items.length} {isAr ? "أسئلة" : "questions"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {items.map((item, idx) => {
                        const itemKey = `${category.slug}-${idx}`;
                        const isOpen = openIndex === itemKey;
                        return (
                          <div
                            key={itemKey}
                            className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                              isOpen
                                ? "border-secondary bg-secondary/5 shadow-sm"
                                : "border-border bg-card hover:border-secondary/40"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleAccordion(itemKey)}
                              className="flex w-full items-center justify-between gap-3 p-4 md:p-5 text-start font-extrabold text-primary cursor-pointer"
                              aria-expanded={isOpen}
                            >
                              <span className="text-sm md:text-base leading-snug">
                                {isAr ? item.question_ar : (item.question_en || item.question_ar)}
                              </span>
                              <ChevronDown
                                className={`h-5 w-5 shrink-0 text-secondary transition-transform duration-200 ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground md:px-5 md:text-base border-t border-border/40 pt-3">
                                {isAr ? item.answer_ar : (item.answer_en || item.answer_ar)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat View when a specific category is selected or searching */
            <div className="space-y-3">
              {filteredFaqs.map((item, idx) => {
                const itemKey = `item-${item.id || idx}`;
                const isOpen = openIndex === itemKey;
                return (
                  <div
                    key={itemKey}
                    className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                      isOpen
                        ? "border-secondary bg-secondary/5 shadow-sm"
                        : "border-border bg-card hover:border-secondary/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(itemKey)}
                      className="flex w-full items-center justify-between gap-3 p-4 md:p-5 text-start font-extrabold text-primary cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <div className="flex flex-col gap-1">
                        {item.category?.name_ar && (
                          <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                            {isAr ? item.category.name_ar : (item.category.name_en || item.category.name_ar)}
                          </span>
                        )}
                        <span className="text-sm md:text-base leading-snug">
                          {isAr ? item.question_ar : (item.question_en || item.question_ar)}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-secondary transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground md:px-5 md:text-base border-t border-border/40 pt-3">
                        {isAr ? item.answer_ar : (item.answer_en || item.answer_ar)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Direct Contact & Support CTA ─── */}
      <section className="bg-muted/40 py-16 border-t border-border">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="rounded-3xl border border-primary/20 bg-card p-8 md:p-12 shadow-card relative overflow-hidden">
            <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-10" />
            <div className="relative">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary/20 text-secondary">
                <MessageCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-2xl font-black text-primary md:text-3xl">
                {isAr ? "هل ما زال لديك استفسار أو تحتاج إلى توضيح؟" : "Still have questions or need assistance?"}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {isAr
                  ? "فريق خدمة المتبرعين في مؤسسة اليسر جاهز للرد على كل تساؤلاتك ومساعدتك على مدار الساعة."
                  : "Our donor care team is available 24/7 to answer your inquiries and assist you."}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`https://wa.me/201097000137?text=${encodeURIComponent(
                    isAr ? "السلام عليكم، لديّ استفسار بخصوص مؤسسة اليسر." : "Hello, I have an inquiry about Al-Yusr."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-black text-white shadow-cta hover:bg-[#20ba59] transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{isAr ? "راسلنا عبر واتساب" : "Chat on WhatsApp"}</span>
                </a>

                <a
                  href="tel:01097000137"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:bg-muted transition"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  <span>01097000137</span>
                </a>

                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
                >
                  <span>{isAr ? "صفحة تواصل معنا" : "Contact Page"}</span>
                  {isAr ? <ArrowLeft className="h-4 w-4 text-secondary" /> : <ArrowRight className="h-4 w-4 text-secondary" />}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default FaqCenter;
