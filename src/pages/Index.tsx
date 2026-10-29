import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, DakahliaServiceSchema } from "@/components/common/Schemas";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { BrandPromise } from "@/components/sections/BrandPromise";
import { AboutTeaser } from "@/components/sections/AboutTeaser";
import { WorkAxes } from "@/components/sections/WorkAxes";
import { CampaignsScroll } from "@/components/sections/CampaignsScroll";
import { UrgentCasesCarousel } from "@/components/sections/UrgentCasesCarousel";
import { BrandValues } from "@/components/sections/BrandValues";
import { ProximityGrid } from "@/components/sections/ProximityGrid";
import { Donate } from "@/components/sections/Donate";
import { Testimonial } from "@/components/sections/Testimonial";
import { FAQ } from "@/components/sections/FAQ";
import { useLang } from "@/i18n/LangContext";
import { ImpactMap } from "@/components/sections/ImpactMap";
import EgyptImpactMap from "@/components/services/EgyptImpactMap";

const Index = () => {
  const { lang } = useLang();
  return (
    <>
      <SEOHelmet
        title={
          lang === "ar"
            ? "اليسر — مؤسسة اليسر الخيرية | أمانة في العطاء وأثرٌ يدوم"
            : "Al-Yusr Charity Foundation | Compassionate Giving & Lasting Impact"
        }
        description={
          lang === "ar"
            ? "مؤسسة اليسر الخيرية بالمنصورة — مشهرة برقم 2665. نصل بتبرعاتكم وزكاتكم إلى مستحقيها بأعلى معايير الأمانة والشفافية والتوثيق الميداني في مصر."
            : "Licensed Egyptian NGO 2665. Delivering your zakat and charitable donations with integrity, verified transparency, and lasting community impact across Egypt."
        }
        path="/"
        image={lang === "ar" ? "/og-ar.jpg" : "/og-en.jpg"}
      />
      <SiteSchemas />
      <DakahliaServiceSchema />
      <BreadcrumbSchema items={[{ name: lang === "ar" ? "الرئيسية" : "Home", url: "https://elyusr.org/" }]} />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <BrandPromise />
          <AboutTeaser />
          <div className="pattern-work-axes axes-fade-to-white relative z-20 overflow-visible">
            <WorkAxes />
          </div>

          <CampaignsScroll />
          <UrgentCasesCarousel />
          <BrandValues />
          <EgyptImpactMap />
          <ProximityGrid />
          <Testimonial />
          <Donate />
          <FAQ />
        </main>

        {/* Hidden SEO Semantic Layer — visible only to search engines, not users.
            Targets the keyword "اليسر" to rank above the electronics appliance brand.
            Uses sr-only for screen reader & crawler access without visual pollution. */}
        {lang === "ar" && (
          <div
            className="sr-only"
            aria-label="معلومات إضافية عن مؤسسة اليسر الخيرية"
          >
            <h2>اليسر — مؤسسة اليسر الخيرية في المنصورة</h2>
            <p>
              مؤسسة اليسر هي مؤسسة خيرية مصرية مشهرة برقم 2665 مقرها المنصورة، محافظة الدقهلية.
              تعمل اليسر الخيرية على توزيع الصدقات الجارية، زكاة المال، صكوك الأضحية، كفالة الأيتام، والمساعدات الشهرية.
              اليسر ليس محل أجهزة كهربائية، بل هي مؤسسة خيرية معتمدة تخدم المجتمع وتصل بتبرعاتكم إلى مستحقيها بصدق وأمانة.
            </p>
            <ul>
              <li>اليسر: تبرع وزكاة وصدقة جارية عبر الإنترنت</li>
              <li>مؤسسة اليسر: صكوك أضحية مضمونة بالدقهلية</li>
              <li>اليسر الخيرية: كفالة أيتام شهرية بتوثيق كامل</li>
              <li>جمعية اليسر: مساعدات شهرية للأسر المستحقة في المنصورة</li>
              <li>اليسر بالمنصورة: بجوار وكالة المنصورة، رقم 2665</li>
            </ul>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
};

export default Index;
