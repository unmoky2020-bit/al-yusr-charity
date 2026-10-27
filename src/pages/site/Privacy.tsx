import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";

const Privacy = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const base = "https://elyusr.org";

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "سياسة الخصوصية — مؤسسة اليسر الخيرية" : "Privacy Policy — Al-Yusr Charity"}
        description={isRTL ? "كيف نحمي بيانات المتبرعين والمتطوعين والمستفيدين في مؤسسة اليسر الخيرية." : "How we protect donor, volunteer, and beneficiary data at Al-Yusr Charity."}
        path="/privacy"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "سياسة الخصوصية" : "Privacy", url: `${base}/privacy` },
      ]} />

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
          <div className="text-primary-foreground/85"><Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "سياسة الخصوصية" : "Privacy" }]} /></div>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">{isRTL ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
          <p className="mt-2 text-sm text-primary-foreground/85">{isRTL ? "آخر تحديث: مايو 2026 — متوافق مع قانون حماية البيانات الشخصية المصري رقم 151/2020" : "Last updated: May 2026 — aligned with Egyptian Personal Data Protection Law 151/2020"}</p>
        </div>
      </section>
      <section className="bg-background py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="prose prose-slate max-w-none space-y-5 text-foreground/85">
            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "ما البيانات التي نجمعها؟" : "What data we collect"}</h2>
            <p>{isRTL ? "نجمع فقط البيانات الضرورية لإتمام التبرع أو التسجيل: الاسم، البريد، رقم الهاتف، وبيانات الدفع المعالَجة بأمان عبر شركاء معتمدين (Kashier)." : "We collect only data necessary to process donations or registrations: name, email, phone, and payment information processed securely via certified partners (Kashier)."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "كيف نستخدم البيانات؟" : "How we use data"}</h2>
            <ul className="list-inside list-disc space-y-2">
              <li>{isRTL ? "إصدار إيصالات التبرع وتوثيق الحالات." : "Issuing donation receipts and documenting cases."}</li>
              <li>{isRTL ? "إرسال تحديثات عن أثر تبرعك (إذا اشتركت في النشرة)." : "Sending impact updates if you opt in to the newsletter."}</li>
              <li>{isRTL ? "تحسين أداء الموقع عبر تحليلات مجهولة الهوية." : "Improving site performance via anonymized analytics."}</li>
            </ul>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "الكوكيز والتتبع" : "Cookies & tracking"}</h2>
            <p>{isRTL ? "نستخدم Google Analytics وMeta Pixel لقياس أثر الحملات، ولا نشارك بياناتك مع أي طرف ثالث للأغراض الإعلانية." : "We use Google Analytics and Meta Pixel to measure campaign impact. We do not share your data with third parties for advertising."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "حقوقك" : "Your rights"}</h2>
            <p>{isRTL ? "يحق لك طلب الاطلاع على بياناتك أو حذفها في أي وقت بمراسلتنا على info@elyosrcharity.com." : "You may request access or deletion of your data at any time by emailing info@elyosrcharity.com."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "تواصل" : "Contact"}</h2>
            <p>{isRTL ? "للاستفسارات حول الخصوصية: info@elyosrcharity.com — هاتف: 01097000137" : "For privacy enquiries: info@elyosrcharity.com — phone: +20 109 700 0137"}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "أمان البيانات" : "Data security"}</h2>
            <p>{isRTL ? "نستخدم تشفير TLS لكل عمليات الدفع، ولا تُخزَّن بيانات البطاقات على خوادمنا — تُعالَج مباشرة عبر بوابات معتمدة (Kashier)." : "We use TLS encryption for all payments. Card data is never stored on our servers — processed directly by certified gateways (Kashier)."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "الأطفال" : "Children"}</h2>
            <p>{isRTL ? "لا نجمع عمداً أي بيانات من أطفال دون 13 عاماً. صور المستفيدين الأطفال تُنشَر فقط بإذن وليّ الأمر." : "We do not knowingly collect data from children under 13. Beneficiary photos of minors are only published with parental consent."}</p>

            <h2 className="text-xl font-extrabold text-primary">{isRTL ? "تحديثات هذه السياسة" : "Policy updates"}</h2>
            <p>{isRTL ? "قد نحدّث هذه السياسة دورياً، وسيظهر تاريخ آخر تحديث أعلى الصفحة." : "We may update this policy periodically; the last-updated date appears at the top of the page."}</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
export default Privacy;
