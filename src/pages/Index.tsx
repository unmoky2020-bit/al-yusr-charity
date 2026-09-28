import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, DakahliaServiceSchema } from "@/components/common/Schemas";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { BrandPromise } from "@/components/sections/BrandPromise";
import { WorkAxes } from "@/components/sections/WorkAxes";
import { CampaignsScroll } from "@/components/sections/CampaignsScroll";
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
            ? "مؤسسة اليسر الخيرية | أمانة في العطاء وأثرٌ يدوم"
            : "Al-Yusr Charity Foundation | Compassionate Giving & Lasting Impact"
        }
        description={
          lang === "ar"
            ? "مؤسسة خيرية مصرية مشهرة برقم 2655. نصل بتبرعاتكم وزكاتكم إلى مستحقيها بأعلى معايير الأمانة والشفافية والتوثيق الميداني المعتمد في مصر."
            : "Licensed Egyptian NGO 2655. Delivering your zakat and charitable donations with integrity, verified transparency, and lasting community impact across Egypt."
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
          <div className="pattern-work-axes relative z-20 overflow-visible">
            <WorkAxes />
          </div>

          <CampaignsScroll />
          <BrandValues />
          <ProximityGrid />
          <EgyptImpactMap />
          <Testimonial />
          <Donate />
          <FAQ />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
