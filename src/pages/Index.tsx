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
            ? "مؤسسة اليسر الخيرية بالمنصورة | أمانة في العطاء وأثرٌ يدوم"
            : "Al-Yusr Charity Foundation | Compassionate Giving & Lasting Impact"
        }
        description={
          lang === "ar"
            ? "مؤسسة اليسر الخيرية — مؤسسة خيرية مصرية مشهرة برقم 2665، تعمل في محافظات مصر ومقرها الرئيسي في المنصورة. نوصل تبرعاتكم وزكاتكم إلى مستحقيها بأمانة وتوثيق ميداني."
            : "Licensed Egyptian NGO 2665, working across Egypt and headquartered in Mansoura. Delivering your zakat and donations with integrity, verified transparency and lasting impact."
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


        <Footer />
      </div>
    </>
  );
};

export default Index;
