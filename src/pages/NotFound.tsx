import { useLocation, Link } from "react-router-dom";
import { Home, Heart, Compass, ArrowLeft, ArrowRight, Sparkles, HelpCircle, PhoneCall } from "lucide-react";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { BreadcrumbSchema } from "@/components/common/Schemas";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";

export default function NotFound() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const location = useLocation();
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const baseUrl = "https://elyusr.org";
  const breadcrumbs = [
    { name: isAr ? "الرئيسية" : "Home", url: `${baseUrl}/` },
    { name: "404", url: `${baseUrl}${location.pathname}` },
  ];

  const quickLinks = isAr
    ? [
        { label: "صكوك الأضحية", href: "/qurbani", desc: "تبرع أضحية مضمون وموزّع بدقة" },
        { label: "كفالة أيتام", href: "/programs/orphans", desc: "رعاية كاملة لليتيم شهريًا" },
        { label: "حساب الزكاة", href: "/zakat", desc: "احسب زكاتك وادفعها بسهولة" },
        { label: "كرتونة الخير", href: "/programs/food", desc: "إطعام أسر متعففة في القرى" },
      ]
    : [
        { label: "Qurbani Shares", href: "/qurbani", desc: "Guaranteed slaughter & distribution" },
        { label: "Orphan Sponsorship", href: "/programs/orphans", desc: "Full monthly care for orphans" },
        { label: "Zakat Calculator", href: "/zakat", desc: "Calculate and pay zakat easily" },
        { label: "Food Boxes", href: "/programs/food", desc: "Feeding families in rural villages" },
      ];

  return (
    <>
      <SEOHelmet
        title={isAr ? "404 — الصفحة غير موجودة | مؤسسة اليسر الخيرية" : "404 — Page Not Found | Al-Yusr Charity"}
        description={isAr ? "عذرًا، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. لكن أبواب الخير دائمًا مفتوحة." : "Sorry, the page you are looking for does not exist or was moved."}
        path={location.pathname}
      />
      <BreadcrumbSchema items={breadcrumbs} />

      <Navbar />

      <main dir={isAr ? "rtl" : "ltr"} className="relative overflow-hidden bg-background pt-28 sm:pt-32 md:pt-40 pb-16 md:pb-24">
        {/* Background ambient lighting */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-secondary/10 blur-3xl" />

        <div className="container mx-auto max-w-4xl px-4 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-4 py-1.5 text-xs font-black text-primary">
            <Sparkles className="h-4 w-4 text-secondary" />
            {isAr ? "404 · لكن أبواب الخير دائمًا مفتوحة" : "404 · But doors of goodness remain open"}
          </span>

          {/* Big 404 number */}
          <h1 className="mt-4 text-[9.5rem] font-black leading-none tracking-tight text-gradient-lime sm:text-[12rem] md:text-[15rem]">
            404
          </h1>

          {/* Heading & Subtitle */}
          <h2 className="mt-2 text-2xl font-black text-primary md:text-4xl">
            {isAr ? "عذرًا.. هذه الصفحة غير موجودة" : "Oops.. Page Not Found"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-extrabold leading-relaxed text-muted-foreground md:text-base">
            {isAr
              ? "ربما اتبعت رابطًا قديماً أو كتبت العنوان بشكل خاطئ. يمكنك العودة للرئيسية أو استكشاف برامجنا الخيرية."
              : "You may have followed an old link or typed the address wrong. You can return home or explore our charity programs."}
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-grad font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
              <Link to="/">
                <Home className="me-2 h-5 w-5" />
                {isAr ? "العودة للرئيسية" : "Return to Homepage"}
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-secondary font-extrabold text-secondary-foreground hover:bg-secondary/90">
              <Link to="/donate">
                <Heart className="me-2 h-5 w-5" />
                {isAr ? "تبرع الآن" : "Donate Now"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-extrabold">
              <Link to="/contact">
                <PhoneCall className="me-2 h-5 w-5" />
                {isAr ? "تواصل معنا" : "Contact Us"}
              </Link>
            </Button>
          </div>

          {/* Quick Programs Grid */}
          <div className="mt-14 rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8 text-start">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Compass className="h-5 w-5 text-secondary" />
              <h3 className="font-black text-primary text-base md:text-lg">
                {isAr ? "استكشف أهم أقسام ومشاريع اليسر" : "Explore popular Al-Yusr sections"}
              </h3>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.href}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-background p-4 transition hover:border-primary hover:bg-primary/5 shadow-sm"
                >
                  <div>
                    <p className="font-black text-primary group-hover:text-secondary transition-colors">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Arrow className="h-4 w-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
