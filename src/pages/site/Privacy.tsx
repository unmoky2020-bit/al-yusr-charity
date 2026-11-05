import { Link } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { FOUNDATION_EMAIL } from "@/data/api/contactApi";

const BASE = "https://elyusr.org";
const EMAIL = FOUNDATION_EMAIL;
const PHONE = "+20 109 700 0137";
const UPDATED = { ar: "29 أكتوبر 2026", en: "29 October 2026" };

/** paras → list → note, in that order. */
type Block = { id: string; title: string; paras?: string[]; list?: string[]; note?: string };

const AR: Block[] = [
  {
    id: "who",
    title: "من نحن؟",
    paras: [
      "مؤسسة اليسر الخيرية مؤسسة أهلية مصرية مشهرة لدى وزارة التضامن الاجتماعي برقم 2665 لسنة 2019. ونحن المسؤولون عن البيانات التي تُدخلها في موقع elyusr.org وفي قنوات التواصل الرسمية الخاصة بنا.",
      "توضّح هذه السياسة البيانات التي نجمعها، ولماذا نجمعها، وكيف نحميها، وما حقوقك فيها، بما يتوافق مع قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020.",
    ],
  },
  {
    id: "collect",
    title: "البيانات التي نجمعها",
    list: [
      "بيانات المتبرع: الاسم (أو اختيار «فاعل خير»)، ورقم الهاتف المحمول، والبريد الإلكتروني اختياريًا، والمبلغ، والجهة التي تبرعت لها.",
      "بيانات الدفع: يتم الدفع بالبطاقة أو المحفظة بالكامل في صفحة بوابة الدفع المرخّصة (كاشير، وPaymob عند تفعيلها). ولا يصلنا إلا رقم العملية وحالتها، فلا نطّلع على رقم البطاقة أو رمز CVV ولا نخزّنهما.",
      "التحويلات اليدوية (إنستاباي، فودافون كاش، التحويل البنكي): صورة الإيصال التي ترسلها لنؤكد التبرع.",
      "الحساب: إذا أنشأت حساب متبرع، نحفظ بيانات الدخول وسجل تبرعاتك لتتمكن من متابعتها.",
      "التواصل: الرسائل التي ترسلها من نموذج «تواصل معنا»، وطلبات التطوع والخبيئة.",
      "بيانات المستفيدين: تُجمع بيانات الحالات بعد بحث ميداني وبموافقة أصحابها، ولا نعرض للعامة إلا ما يلزم للتبرع، دون أي بيانات تكشف هوية الأسرة.",
    ],
  },
  {
    id: "use",
    title: "كيف نستخدم بياناتك؟",
    list: [
      "تنفيذ تبرعك، وإصدار رقم التتبع والإيصال، وإرسال توثيق التسليم.",
      "التواصل معك بخصوص تبرعك أو استفسارك.",
      "إرسال أخبار المؤسسة وحملاتها، فقط إذا اشتركت في النشرة البريدية أو الإشعارات، ويمكنك إلغاء الاشتراك في أي وقت.",
      "حماية المنصة ومنع الاحتيال وإساءة الاستخدام.",
      "الالتزام بالقوانين والمتطلبات المحاسبية والرقابية لوزارة التضامن الاجتماعي.",
    ],
  },
  {
    id: "anonymous",
    title: "التبرع باسم «فاعل خير»",
    paras: [
      "يمكنك أن تختار ألّا يظهر اسمك في أي مكان عام. نطلب رقم هاتفك فقط لنرسل إليك رقم التتبع والتوثيق، ولا يظهر هذا الرقم لأحد، ولا نستخدمه في غير ما يخص تبرعك.",
    ],
  },
  {
    id: "cookies",
    title: "الكوكيز وأدوات القياس",
    list: [
      "كوكيز ضرورية لتشغيل الموقع (حفظ اللغة، تسجيل الدخول، سلة التبرع).",
      "Google Analytics لقياس زيارات الموقع وأداء الصفحات بشكل إجمالي.",
      "Meta Pixel لقياس أثر حملاتنا على فيسبوك وإنستجرام.",
      "يمكنك حذف الكوكيز أو منعها من إعدادات المتصفح، وسيعمل التبرع بشكل طبيعي.",
    ],
  },
  {
    id: "push",
    title: "الإشعارات (Web Push)",
    paras: [
      "إذا وافقت على الإشعارات من المتصفح، نحفظ معرّف اشتراك الجهاز لنرسل إليك تحديثات تبرعك أو الحالات العاجلة، ويمكنك إيقافها في أي وقت من إعدادات المتصفح.",
    ],
  },
  {
    id: "share",
    title: "مع من نشارك بياناتك؟",
    paras: ["لا نبيع بياناتك ولا نؤجّرها ولا نشاركها لأغراض إعلانية، ولا نشارك منها إلا ما يلزم مع:"],
    list: [
      "بوابات الدفع المرخّصة لتنفيذ عملية الدفع.",
      "مزوّدي خدمات الاستضافة والبريد والرسائل الذين يشغّلون الخدمة لحسابنا مع التزامهم بالسرية.",
      "الجهات الرسمية إذا طلب القانون ذلك.",
    ],
  },
  {
    id: "retention",
    title: "إلى متى نحتفظ بالبيانات؟",
    paras: [
      "نحتفظ بسجلات التبرع طوال المدة اللازمة لإيصالاتك وللالتزامات المحاسبية والقانونية، ثم تُحذف أو تتحول إلى بيانات إحصائية لا تكشف هويتك. أما بيانات التسويق فتُحذف فور إلغاء اشتراكك.",
    ],
  },
  {
    id: "security",
    title: "أمان البيانات",
    list: [
      "كل الاتصالات بالموقع مشفّرة (HTTPS/TLS).",
      "الوصول إلى لوحة التحكم مقيّد بصلاحيات محددة لكل موظف، ويُسجَّل كل دخول.",
      "بيانات البطاقات لا تمر على خوادمنا أصلًا.",
    ],
  },
  {
    id: "rights",
    title: "حقوقك",
    list: [
      "أن تعرف البيانات المحفوظة لدينا عنك وتحصل على نسخة منها.",
      "أن تصحّح أي بيانات غير صحيحة.",
      "أن تطلب حذف بياناتك، باستثناء ما يُلزمنا القانون بالاحتفاظ به.",
      "أن تسحب موافقتك على الرسائل والإشعارات في أي وقت.",
      "أن تقدّم شكوى إلى مركز حماية البيانات الشخصية في مصر.",
    ],
    note: `لتقديم أي من هذه الطلبات، راسلنا على ${EMAIL} أو عبر واتساب ${PHONE}، وسنرد في أقرب وقت.`,
  },
  {
    id: "children",
    title: "الأطفال",
    paras: [
      "الموقع غير موجّه للأطفال دون 18 عامًا، ولا نجمع بيانات منهم عمدًا. ولا تُنشر صور المستفيدين من الأطفال إلا بموافقة ولي الأمر، ودون أي بيانات تكشف هويتهم.",
    ],
  },
  {
    id: "changes",
    title: "التعديلات على السياسة",
    paras: ["قد نحدّث هذه السياسة من وقت لآخر، ويظهر تاريخ آخر تحديث أعلى الصفحة. وإذا كان التغيير جوهريًا فسنوضّحه على الموقع."],
  },
];

const EN: Block[] = [
  {
    id: "who",
    title: "Who we are",
    paras: [
      "Al-Yusr Charity Foundation is an Egyptian non-governmental foundation registered with the Ministry of Social Solidarity under No. 2665/2019. We are responsible for the data you enter on elyusr.org and through our official channels.",
      "This policy explains what we collect, why, how we protect it and your rights, in line with Egypt's Personal Data Protection Law No. 151 of 2020.",
    ],
  },
  {
    id: "collect",
    title: "What we collect",
    list: [
      "Donor details: name (or \"Anonymous\"), mobile number, optional email, amount and the cause you supported.",
      "Payment: card and wallet payments happen entirely on the licensed gateway's page (Kashier, and Paymob when enabled). We only receive the transaction reference and status — never your card number or CVV.",
      "Manual transfers (InstaPay, Vodafone Cash, bank transfer): the receipt you send so we can confirm the donation.",
      "Account: if you create a donor account, your login details and donation history.",
      "Contact: messages from the contact form, volunteer and Khabia requests.",
      "Beneficiaries: case details are collected after a field assessment with consent; publicly we show only what a donation needs, without identifying details.",
    ],
  },
  {
    id: "use",
    title: "How we use it",
    list: [
      "Processing your donation, issuing the tracking number and receipt, and sending delivery proof.",
      "Contacting you about your donation or enquiry.",
      "Sending news and campaigns — only if you subscribed to the newsletter or notifications; unsubscribe any time.",
      "Protecting the platform against fraud and abuse.",
      "Meeting legal, accounting and Ministry of Social Solidarity requirements.",
    ],
  },
  {
    id: "anonymous",
    title: "Giving anonymously",
    paras: [
      "You can choose to keep your name off every public page. We only ask for a mobile number to send your tracking reference and proof; it is never shown publicly or used for anything else.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies & measurement",
    list: [
      "Essential cookies to run the site (language, sign-in, donation basket).",
      "Google Analytics for aggregate visit and page-performance statistics.",
      "Meta Pixel to measure our Facebook and Instagram campaigns.",
      "You can clear or block cookies in your browser; donating still works.",
    ],
  },
  {
    id: "push",
    title: "Notifications (Web Push)",
    paras: [
      "If you allow browser notifications, we store your device's subscription ID to send donation updates or urgent cases. Turn them off any time in your browser settings.",
    ],
  },
  {
    id: "share",
    title: "Who we share data with",
    paras: ["We never sell, rent or share your data for advertising. We share only what is necessary with:"],
    list: [
      "Licensed payment gateways, to process the payment.",
      "Hosting, email and messaging providers that run the service on our behalf under confidentiality.",
      "Public authorities when the law requires it.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep data",
    paras: [
      "Donation records are kept as long as needed for your receipts and our accounting and legal obligations, then deleted or anonymised into statistics. Marketing data is deleted as soon as you unsubscribe.",
    ],
  },
  {
    id: "security",
    title: "Security",
    list: [
      "All connections to the site are encrypted (HTTPS/TLS).",
      "Dashboard access is limited by per-staff permissions and logged.",
      "Card data never touches our servers.",
    ],
  },
  {
    id: "rights",
    title: "Your rights",
    list: [
      "Know what data we hold about you and get a copy.",
      "Correct inaccurate data.",
      "Ask us to delete your data, except what the law requires us to keep.",
      "Withdraw consent to messages and notifications at any time.",
      "Complain to Egypt's Personal Data Protection Centre.",
    ],
    note: `For any of these, email ${EMAIL} or WhatsApp ${PHONE}; we reply as soon as possible.`,
  },
  {
    id: "children",
    title: "Children",
    paras: [
      "The site is not directed at children under 18 and we do not knowingly collect their data. Photos of child beneficiaries are published only with a guardian's consent and without identifying details.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paras: ["We may update this policy from time to time; the last-updated date is shown at the top. Material changes will be highlighted on the site."],
  },
];

const Privacy = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const blocks = isRTL ? AR : EN;

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "سياسة الخصوصية وحماية البيانات | مؤسسة اليسر الخيرية" : "Privacy Policy & Data Protection | Al-Yusr Charity"}
        description={isRTL
          ? "كيف تجمع مؤسسة اليسر الخيرية بيانات المتبرعين وتحميها: دفع آمن عبر بوابات مرخّصة دون تخزين بيانات البطاقات، والتبرع باسم فاعل خير، وحقوقك وفق القانون 151 لسنة 2020."
          : "How Al-Yusr Charity collects and protects donor data: secure payment via licensed gateways with no stored card data, anonymous giving, and your rights under Egypt's Law 151/2020."}
        path="/privacy"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${BASE}/` },
        { name: isRTL ? "سياسة الخصوصية" : "Privacy", url: `${BASE}/privacy` },
      ]} />

      <section className="relative overflow-hidden bg-primary">
        <div className="pointer-events-none absolute -top-24 -start-24 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />
        <div className="container relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 md:py-16 lg:px-10">
          <div className="text-primary-foreground/85">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "سياسة الخصوصية" : "Privacy" }]} />
          </div>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/20 px-4 py-1.5 text-xs font-black text-secondary">
            <ShieldCheck className="h-4 w-4" /> {isRTL ? "بياناتك أمانة" : "Your data is a trust"}
          </span>
          <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">{isRTL ? "سياسة الخصوصية وحماية البيانات" : "Privacy Policy & Data Protection"}</h1>
          <p className="mt-3 text-sm text-white/85">
            {isRTL ? `آخر تحديث: ${UPDATED.ar} — متوافقة مع قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020` : `Last updated: ${UPDATED.en} — aligned with Egypt's Personal Data Protection Law No. 151/2020`}
          </p>
        </div>
      </section>

      <section className="bg-background py-10 md:py-14">
        <div className="container mx-auto grid max-w-[1440px] gap-8 px-4 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-10">
          {/* Table of contents */}
          <nav aria-label={isRTL ? "محتويات السياسة" : "Policy contents"} className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-black text-primary">{isRTL ? "المحتويات" : "Contents"}</p>
              <ol className="mt-3 space-y-1.5 text-sm">
                {blocks.map((b, i) => (
                  <li key={b.id}><a href={`#${b.id}`} className="text-muted-foreground hover:text-secondary">{i + 1}. {b.title}</a></li>
                ))}
              </ol>
            </div>
            <div className="mt-4 rounded-3xl border border-secondary/30 bg-secondary/10 p-5 text-sm">
              <p className="flex items-center gap-2 font-black text-primary"><Lock className="h-4 w-4 text-secondary" />{isRTL ? "باختصار" : "In short"}</p>
              <p className="mt-2 leading-relaxed text-foreground/85">
                {isRTL
                  ? "لا نخزّن بيانات بطاقتك، ولا نبيع بياناتك، ويمكنك التبرع باسم «فاعل خير» وطلب حذف بياناتك في أي وقت."
                  : "We never store your card details or sell your data; you can give anonymously and ask us to delete your data at any time."}
              </p>
            </div>
          </nav>

          <article className="max-w-3xl space-y-8 text-foreground/85">
            {blocks.map((b, i) => (
              <section key={b.id} id={b.id} className="scroll-mt-24">
                <h2 className="text-xl font-extrabold text-primary md:text-2xl">{i + 1}. {b.title}</h2>
                {b.paras?.map((p) => <p key={p} className="mt-3 leading-relaxed">{p}</p>)}
                {b.list && (
                  <ul className="mt-3 list-disc space-y-2 ps-5 leading-relaxed">
                    {b.list.map((li) => <li key={li}>{li}</li>)}
                  </ul>
                )}
                {b.note && <p className="mt-3 font-semibold leading-relaxed text-primary">{b.note}</p>}
              </section>
            ))}
            <p className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
              {isRTL ? "اقرأ أيضًا: " : "See also: "}
              <Link to="/terms" className="font-extrabold text-accent hover:text-secondary">{isRTL ? "الشروط والأحكام" : "Terms & Conditions"}</Link>
              {" · "}
              <Link to="/trust" className="font-extrabold text-accent hover:text-secondary">{isRTL ? "الشفافية" : "Transparency"}</Link>
            </p>
          </article>
        </div>
      </section>
    </PageLayout>
  );
};
export default Privacy;
