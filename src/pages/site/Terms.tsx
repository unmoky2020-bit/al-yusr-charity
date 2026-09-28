import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";

const Terms = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const base = "https://elyusr.org";
  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "الشروط والأحكام — مؤسسة اليسر" : "Terms & Conditions — Al-Yusr"}
        description={isRTL ? "شروط استخدام موقع مؤسسة اليسر الخيرية وسياسة التبرعات والاسترداد." : "Terms of use, donations, and refund policy for Al-Yusr Charity website."}
        path="/terms"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "الشروط والأحكام" : "Terms", url: `${base}/terms` },
      ]} />

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
          <div className="text-primary-foreground/85"><Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "الشروط والأحكام" : "Terms" }]} /></div>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">{isRTL ? "الشروط والأحكام" : "Terms & Conditions"}</h1>
          <p className="mt-2 text-sm text-primary-foreground/85">{isRTL ? "آخر تحديث: مايو 2026 — مؤسسة اليسر مرخّصة رقم 2655/2019" : "Last updated: May 2026 — Al-Yusr is licensed NGO No. 2655/2019"}</p>
        </div>
      </section>
      <section className="bg-background py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="space-y-5 text-foreground/85">
            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "1. قبول الشروط" : "1. Acceptance"}</h2>
            <p>{isRTL ? "باستخدامك هذا الموقع توافق على هذه الشروط. إذا لم توافق فالرجاء عدم الاستخدام." : "By using this site you agree to these terms. If you do not agree, please do not use the site."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "2. التبرعات" : "2. Donations"}</h2>
            <p>{isRTL ? "كل التبرعات تُستخدم لأغراض اليسر الخيرية وفقاً للبرنامج المُختار. تُصرف رسوم بنكية بسيطة لتغطية تكاليف بوابات الدفع." : "All donations are used for Al-Yusr's charitable purposes per the selected program. Minimal bank fees may apply for payment gateways."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "3. الاسترداد" : "3. Refunds"}</h2>
            <p>{isRTL ? "نظراً لطبيعة التبرعات الخيرية، الاسترداد متاح فقط في حالة خطأ تقني خلال 7 أيام من العملية. للتواصل: info@elyosrcharity.com" : "Due to the charitable nature of donations, refunds are only available in case of a technical error within 7 days. Contact: info@elyosrcharity.com"}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "4. حقوق الملكية" : "4. Intellectual property"}</h2>
            <p>{isRTL ? "كل المحتوى (نصوص، صور، شعارات) مملوك لمؤسسة اليسر الخيرية ولا يجوز استخدامه دون إذن." : "All content (texts, images, logos) is owned by Al-Yusr Charity Foundation and may not be used without permission."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "5. حدود المسؤولية" : "5. Limitation of liability"}</h2>
            <p>{isRTL ? "نسعى لدقة المحتوى لكن لا نضمن خلوه من الأخطاء. نخلي مسؤوليتنا عن أي ضرر غير مباشر." : "We strive for accuracy but do not guarantee error-free content. We disclaim liability for any indirect damages."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "6. صك الأضحية 2026" : "6. Qurbani 2026"}</h2>
            <p>{isRTL ? "الحجز يتم بنظام أسبقية الدفع، وكل صك يوثَّق بصورة/فيديو قبل التوزيع. في حال نفاد العدد قبل العيد، يُحوَّل المبلغ لمشروع آخر بعد موافقتك أو يُرَدّ كاملاً." : "Reservations are first-paid first-served. Every share is documented with photo/video before distribution. If shares run out before Eid, the amount is reallocated with your consent or fully refunded."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "7. القانون الواجب التطبيق" : "7. Governing law"}</h2>
            <p>{isRTL ? "تخضع هذه الشروط للقوانين المصرية، ومحاكم المنصورة هي المختصة بأي نزاع." : "These terms are governed by Egyptian law; Mansoura courts have exclusive jurisdiction over any dispute."}</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
export default Terms;
