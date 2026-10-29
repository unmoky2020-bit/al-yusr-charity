import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Mail, Phone, Printer } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useLang } from "@/i18n/LangContext";
import { FOUNDATION_EMAIL } from "@/data/api/contactApi";

const UPDATED_AR = "28 أكتوبر 2026";
const UPDATED_EN = "28 October 2026";

type Block = { p?: string; list?: string[] };
type Section = { id: string; ar: { t: string; b: Block[] }; en: { t: string; b: Block[] } };

/** The 30-second version — plain-language promises shown above the legal text. */
const SUMMARY = {
  ar: [
    "يُصرف التبرع في الغرض الذي حدده المتبرع، وإذا اكتمل تمويل المشروع يُميَّز التبرع كمبلغ زائد ويُخطر المتبرع لاختيار طريقة التصرف فيه.",
    "تُصرف أموال الزكاة في مصارفها الشرعية حصراً، ولا تُخلط بأموال الصدقات العامة.",
    "يحق للمتبرع استرداد المبلغ في حالات أخطاء الدفع، كالخصم المكرر أو الخاطئ، متى أُبلغت المؤسسة خلال سبعة أيام من تاريخ العملية.",
    "يحق للمتبرع إيقاف التبرع الشهري أو تعديله في أي وقت.",
    "لا تحتفظ المؤسسة ببيانات البطاقات البنكية، وتتم عمليات الدفع عبر بوابة كاشير (Kashier) المعتمدة.",
  ],
  en: [
    "Donations are spent on the purpose designated by the donor; if a project is fully funded, the donation is flagged as a surplus and the donor is notified to choose how it is used.",
    "Zakat funds are spent exclusively on their legitimate categories and are never commingled with general charitable funds.",
    "Donors are entitled to a refund for payment errors, such as duplicate or incorrect charges, reported within seven days of the transaction.",
    "Donors may pause or amend a monthly donation at any time.",
    "The Foundation does not retain card details; payments are processed through the licensed Kashier gateway.",
  ],
};

const SECTIONS: Section[] = [
  {
    id: "acceptance",
    ar: { t: "التعريف وقبول الشروط", b: [
      { p: "مؤسسة اليسر الخيرية («المؤسسة» أو «نحن») مؤسسة أهلية مصرية مشهرة بوزارة التضامن الاجتماعي برقم 2665 لسنة 2019، ومقرها المنصورة، محافظة الدقهلية." },
      { p: "يُعد استخدام الموقع أو إتمام أي تبرع أو تسجيل من خلاله إقراراً من المستخدم بقبول هذه الشروط وسياسة الخصوصية. وفي حال عدم الموافقة عليها، يتعين الامتناع عن استخدام الموقع." },
    ] },
    en: { t: "Who we are and acceptance", b: [
      { p: "Al-Yusr Charity Foundation (\"the Foundation\", \"we\") is an Egyptian NGO registered with the Ministry of Social Solidarity under No. 2665/2019, headquartered in Mansoura, Dakahlia." },
      { p: "By using elyusr.org, or by donating or registering through it, you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use the site." },
    ] },
  },
  {
    id: "definitions",
    ar: { t: "التعريفات", b: [
      { p: "يُقصد بالكلمات والعبارات التالية، أينما وردت في هذه الشروط، المعاني المبينة قرين كل منها:" },
      { list: [
        "المؤسسة: مؤسسة اليسر الخيرية، المشهرة برقم 2665 لسنة 2019.",
        "الموقع: الموقع الإلكتروني elyusr.org وجميع صفحاته وخدماته.",
        "المستخدم: كل شخص يتصفح الموقع أو يستخدم أياً من خدماته.",
        "المتبرع: كل شخص طبيعي أو اعتباري يقدم تبرعاً للمؤسسة عبر الموقع أو أي من وسائل الدفع المعتمدة.",
        "المستفيد: الفرد أو الأسرة التي تُصرف لها التبرعات وفقاً لمعايير الاستحقاق المعتمدة لدى المؤسسة.",
        "بوابة الدفع: مزود خدمة الدفع الإلكتروني المعتمد لدى المؤسسة، وهو حالياً شركة كاشير (Kashier).",
        "الإيصال: المستند الإلكتروني أو الورقي الصادر من المؤسسة بالرقم المرجعي للتبرع.",
      ] },
    ] },
    en: { t: "Definitions", b: [
      { p: "Wherever they appear in these Terms, the following words and expressions have the meanings set against them:" },
      { list: [
        "Foundation: Al-Yusr Charity Foundation, registered under No. 2665/2019.",
        "Site: the website elyusr.org and all its pages and services.",
        "User: any person who browses the Site or uses any of its services.",
        "Donor: any natural or legal person who makes a donation to the Foundation through the Site or any approved payment method.",
        "Beneficiary: the individual or family to whom donations are disbursed under the Foundation's eligibility criteria.",
        "Payment Gateway: the Foundation's approved online payment provider, currently Kashier.",
        "Receipt: the electronic or paper document issued by the Foundation bearing the donation's reference number.",
      ] },
    ] },
  },
  {
    id: "use",
    ar: { t: "استخدام الموقع", b: [
      { list: [
        "يلتزم المستخدم بإدخال بيانات صحيحة ودقيقة عند التبرع أو التسجيل أو طلب مندوب التحصيل.",
        "يُمنع استخدام الموقع لأي غرض غير قانوني، أو محاولة اختراقه أو تعطيله، أو استخدام وسيلة دفع لا تملكها أو غير مصرّح لك باستخدامها.",
        "يُمنع جمع تبرعات باسم المؤسسة أو استخدام شعارها دون تفويض كتابي منها.",
        "يحق للمؤسسة تعليق أي حساب أو رفض أي عملية يُشتبه في مخالفتها لهذه الشروط أو للقانون.",
      ] },
    ] },
    en: { t: "Using the site", b: [
      { list: [
        "You agree to provide accurate information when donating, registering or requesting a pickup.",
        "You may not use the site unlawfully, attempt to breach or disrupt it, or use a payment method you do not own or are not authorized to use.",
        "You may not raise funds in the Foundation's name or use its logo without written authorization.",
        "We may suspend an account or decline a transaction suspected of breaching these Terms or the law.",
      ] },
    ] },
  },
  {
    id: "donations",
    ar: { t: "التبرعات وطرق الدفع", b: [
      { p: "تقبل المؤسسة التبرعات عبر بوابة الدفع الإلكتروني كاشير (Kashier) لبطاقات فيزا وماستركارد وميزة والمحافظ الإلكترونية، وعبر إنستاباي، ومحفظة فودافون كاش، والتحويل البنكي على حساب المؤسسة الرسمي لدى البنك التجاري الدولي (CIB)، وكذلك عبر مندوب التحصيل المنزلي المعتمد." },
      { list: [
        "لا تحتفظ المؤسسة بأي بيانات للبطاقات البنكية، وتتم معالجة عمليات الدفع بالكامل لدى بوابة الدفع وفقاً لمعايير أمان بيانات البطاقات المعتمدة.",
        "لا تفرض المؤسسة أي رسوم إضافية على مبلغ التبرع، مع مراعاة أن الجهة المُصدرة للبطاقة أو البنك قد يحتسب رسوماً وفق سياساته الخاصة.",
        "يحصل المتبرع على إيصال إلكتروني يحمل رقماً مرجعياً، يمكنه من خلاله متابعة حالة تبرعه عبر صفحة «تتبع تبرعك».",
        "في التحويلات اليدوية (إنستاباي، المحافظ، التحويل البنكي) يُعتمد التبرع بعد مطابقة إشعار التحويل، ويصدر الإيصال بعدها.",
        "يلتزم مندوب المؤسسة بتسليم المتبرع إيصال استلام رسمياً مختوماً، ويُنبَّه المتبرع إلى عدم تسليم أي مبلغ دون هذا الإيصال، وإلى التحقق من هوية المندوب عبر أرقام المؤسسة الرسمية حصراً.",
        "تتم التبرعات بالجنيه المصري، ويُطبق على أي تحويل من عملة أجنبية سعر الصرف المعتمد لدى البنك أو بوابة الدفع.",
      ] },
    ] },
    en: { t: "Donations and payment methods", b: [
      { p: "The Foundation accepts donations through the Kashier online payment gateway (Visa, Mastercard, Meeza and mobile wallets), InstaPay, Vodafone Cash, bank transfer to the Foundation's official account at Commercial International Bank (CIB), and home collection by an authorized representative." },
      { list: [
        "We never store your card details; payments are processed entirely by the payment gateway under its security standards.",
        "Gateways or banks may charge their own transaction fees; the Foundation adds no fee to your donation.",
        "You receive an electronic receipt with a reference number you can use on the \"Track your donation\" page.",
        "Manual transfers (InstaPay, wallets, bank transfer) are confirmed after the transfer notice is matched, and the receipt is issued then.",
        "Our official representative hands you a stamped, approved receipt. Never hand over money without one; to verify a representative, contact us on our official numbers only.",
        "Donations are in Egyptian pounds; any currency conversion uses the rate applied by your bank or the gateway.",
      ] },
    ] },
  },
  {
    id: "zakat",
    ar: { t: "الزكاة والصدقات", b: [
      { list: [
        "أموال الزكاة تُفصل محاسبياً عن الصدقات العامة، وتُصرف فقط في مصارف الزكاة الشرعية للمستحقين.",
        "يُعد اختيار المتبرع «زكاة المال» توكيلاً منه للمؤسسة في إخراجها وصرفها نيابةً عنه إلى مستحقيها.",
        "حاسبة الزكاة على الموقع أداة استرشادية؛ وللحالات الخاصة يُرجى الرجوع لجهة الفتوى المختصة.",
        "الصدقة الجارية والكفالات والصكوك تُصرف في الغرض المحدد لها.",
      ] },
    ] },
    en: { t: "Zakat and sadaqa", b: [
      { list: [
        "Zakat funds are accounted for separately from general charity and spent only on legitimate zakat recipients.",
        "By choosing \"Zakat al-mal\" you authorize the Foundation to distribute it on your behalf to eligible recipients.",
        "The zakat calculator on the site is a guide only; for specific cases please consult a qualified religious authority.",
        "Sadaqa jariya, sponsorships and vouchers are spent on their designated purpose.",
      ] },
    ] },
  },
  {
    id: "allocation",
    ar: { t: "توجيه التبرع والمبالغ الزائدة", b: [
      { p: "تلتزم المؤسسة بصرف التبرع في البرنامج أو الحالة أو المشروع الذي حدده المتبرع، مع الحفاظ على صفة المال زكاةً كان أو صدقة." },
      { p: "إذا اكتمل تمويل الحالة أو المشروع قبل وصول التبرع، أو تعذّر تنفيذه لأسباب خارجة عن إرادة المؤسسة، يُتبع الإجراء التالي:" },
      { list: [
        "يُميَّز التبرع في سجلات المؤسسة بوصفه «مبلغاً زائداً» عن احتياج المشروع، ولا يُصرف في أي غرض آخر قبل الرجوع إلى المتبرع.",
        "تُخطر المؤسسة المتبرع بذلك عبر وسيلة التواصل المسجلة لديها، وتطلب رأيه في التصرف في المبلغ.",
        "يحق للمتبرع أن يختار توجيه المبلغ إلى مشروع آخر يحدده، أو إلى أقرب مشروع مماثل من النوع ذاته، أو استرداده كاملاً.",
        "يُنفَّذ اختيار المتبرع فور وروده، ولا تتصرف المؤسسة في المبلغ إلا وفقاً لهذا الاختيار.",
      ] },
      { p: "أما التبرع العام الذي لم يُحدَّد له غرض، فيُصرف في أوجه الخير الأشد احتياجاً وفقاً لتقدير المؤسسة." },
    ] },
    en: { t: "Designation and surplus amounts", b: [
      { p: "The Foundation spends each donation on the program, case or project designated by the donor, preserving its nature as zakat or sadaqa." },
      { p: "If the case or project is fully funded before the donation arrives, or cannot be carried out for reasons beyond the Foundation's control, the following procedure applies:" },
      { list: [
        "The donation is flagged in the Foundation's records as a \"surplus amount\" for that project and is not spent on any other purpose before the donor is consulted.",
        "The Foundation notifies the donor through their registered contact details and asks how they wish the amount to be used.",
        "The donor may choose to direct the amount to another project of their choice, to the closest comparable project of the same type, or to receive a full refund.",
        "The donor's choice is carried out upon receipt, and the Foundation uses the amount only in accordance with it.",
      ] },
      { p: "General donations made without a designated purpose are spent where the need is greatest, at the Foundation's discretion." },
    ] },
  },
  {
    id: "refunds",
    ar: { t: "الاسترداد والإلغاء", b: [
      { p: "نظراً لطبيعة التبرع بوصفه عطاءً خيرياً يُصرف للمستحقين، فإنه غير قابل للاسترداد بعد إتمامه، باستثناء الحالات التالية متى أُبلغت المؤسسة بها خلال سبعة أيام من تاريخ العملية:" },
      { list: [
        "خصم مبلغ التبرع أكثر من مرة عن العملية ذاتها.",
        "خصم مبلغ يختلف عن المبلغ الذي أدخله المتبرع.",
        "إتمام العملية دون علم صاحب وسيلة الدفع أو باستخدام وسيلة دفع مسروقة، مع تقديم ما يثبت ذلك.",
        "المبالغ الزائدة المنصوص عليها في البند السابق إذا اختار المتبرع استردادها.",
      ] },
      { p: "يُرد المبلغ إلى وسيلة الدفع ذاتها بعد التحقق من العملية، وتخضع مدة إضافته إلى حساب المتبرع لإجراءات البنك أو بوابة الدفع. ويُقدَّم طلب الاسترداد مصحوباً بالرقم المرجعي للإيصال عبر قنوات التواصل الرسمية الموضحة أدناه." },
    ] },
    en: { t: "Refunds and cancellation", b: [
      { p: "Given that a donation is a charitable gift disbursed to beneficiaries, it is non-refundable once completed, except in the following cases reported to the Foundation within seven days of the transaction:" },
      { list: [
        "You were charged more than once for the same donation.",
        "You were charged an amount different from the one you entered.",
        "The transaction was made without your knowledge or with a stolen payment method (with supporting evidence).",
        "Surplus amounts under the previous section, if the donor chooses a refund.",
      ] },
      { p: "Refunds go back to the original payment method after verification; how long they take to appear depends on your bank or the gateway. To request one, send your receipt reference number to the email or WhatsApp listed below." },
    ] },
  },
  {
    id: "monthly",
    ar: { t: "التبرعات الشهرية والكفالات", b: [
      { list: [
        "عند الاشتراك في تبرع شهري أو كفالة، يُخصم المبلغ تلقائياً في الموعد ذاته من كل شهر إلى أن يقرر المتبرع إيقافه.",
        "يحق للمتبرع إيقاف الاشتراك أو تعديل مبلغه أو موعده في أي وقت من خلال حسابه أو بالتواصل مع المؤسسة، ويسري الإيقاف على الدفعات اللاحقة فقط.",
        "في حالات الكفالة، تُخطر المؤسسة الكافل بأي تغيّر في وضع الحالة المكفولة، وتعرض عليه كفالة حالة بديلة.",
      ] },
    ] },
    en: { t: "Monthly gifts and sponsorships", b: [
      { list: [
        "A monthly gift or sponsorship is charged automatically on the same date each month until you stop it.",
        "You can pause, change the amount or change the date at any time from your account or by contacting us; stopping applies to future payments only.",
        "For sponsorships, we tell you if the sponsored case's situation changes and offer you an alternative case.",
      ] },
    ] },
  },
  {
    id: "seasonal",
    ar: { t: "الأضاحي والحملات الموسمية", b: [
      { list: [
        "حجز صكوك الأضاحي يتم بنظام أسبقية الدفع حتى نفاد العدد المتاح.",
        "يتم الذبح في الأيام الشرعية للعيد، ويوثَّق كل صك بالصور أو الفيديو قبل التوزيع.",
        "إذا نفد العدد أو تعذّر التنفيذ، يُحوَّل المبلغ لمشروع آخر بعد موافقتك أو يُرد كاملاً.",
        "شروط أي حملة موسمية (رمضان، الشتاء، العيد) المعلنة على صفحتها تُعد جزءاً مكملاً لهذه الشروط.",
      ] },
    ] },
    en: { t: "Qurbani and seasonal campaigns", b: [
      { list: [
        "Qurbani shares are reserved first-paid, first-served until sold out.",
        "Slaughter takes place on the legitimate days of Eid, and each share is documented with photo or video before distribution.",
        "If shares run out or the sacrifice cannot be carried out, the amount is reallocated with your consent or fully refunded.",
        "Terms published on a seasonal campaign page (Ramadan, winter, Eid) form part of these Terms.",
      ] },
    ] },
  },
  {
    id: "documentation",
    ar: { t: "التوثيق وكرامة المستفيدين", b: [
      { list: [
        "توثق المؤسسة وصول التبرعات بالصور ومقاطع الفيديو، مع إخفاء وجوه المستفيدين وبياناتهم متى طلبوا ذلك أو كان في النشر ما يمس كرامتهم.",
        "لا يجوز إعادة نشر صور المستفيدين أو بياناتهم أو استخدامها خارج غرض التوثيق.",
        "إذا طلب المتبرع حضور تسليم تبرعه بنفسه، يرافقه ممثل عن المؤسسة، ويلتزم المتبرع بتعليمات الفريق الميداني، واحترام خصوصية الأسرة المستفيدة، وعدم التصوير دون إذنها.",
      ] },
    ] },
    en: { t: "Documentation and beneficiary dignity", b: [
      { list: [
        "We document delivery with photo and video, hiding beneficiaries' faces and details when they ask or when publishing would harm their dignity.",
        "Beneficiaries' photos or data may not be republished or used outside documentation.",
        "If you choose to deliver your gift in person, a Foundation representative accompanies you; you agree to follow the team's instructions, respect the family's privacy and not film without their consent.",
      ] },
    ] },
  },
  {
    id: "accounts",
    ar: { t: "الحسابات والتطوع", b: [
      { list: [
        "يتحمل المستخدم مسؤولية الحفاظ على سرية بيانات الدخول إلى حسابه، وعن كافة الأنشطة التي تتم من خلاله.",
        "يُشترط لإنشاء حساب متبرع ألا يقل عمر المستخدم عن 18 عاماً، ويُشترط في المتطوع ألا يقل عمره عن 16 عاماً، مع موافقة ولي الأمر الكتابية لمن لم يبلغ 18 عاماً.",
        "التطوع عمل تبرعي دون مقابل مادي، ويلتزم المتطوع بلائحة المؤسسة وتعليمات المشرفين الميدانيين.",
      ] },
    ] },
    en: { t: "Accounts and volunteering", b: [
      { list: [
        "You are responsible for keeping your login details confidential and for activity on your account.",
        "Donor accounts require users to be 18 or older; volunteers must be at least 16, with written guardian consent for those under 18.",
        "Volunteering is unpaid; volunteers follow the Foundation's rules and field supervisors' instructions.",
      ] },
    ] },
  },
  {
    id: "ip",
    ar: { t: "الملكية الفكرية", b: [
      { p: "جميع محتويات الموقع من نصوص وصور وفيديوهات وشعارات وتصميمات مملوكة لمؤسسة اليسر الخيرية. يُسمح بمشاركة روابط الصفحات ومنشوراتنا كما هي لأغراض الخير غير التجارية مع ذكر المصدر، ويُمنع تعديلها أو استخدامها تجارياً أو في جمع تبرعات دون إذن كتابي." },
    ] },
    en: { t: "Intellectual property", b: [
      { p: "All site content (text, photos, videos, logos, designs) belongs to Al-Yusr Charity Foundation. You may share page links and our posts unchanged for non-commercial charitable purposes with attribution; you may not modify them, use them commercially or use them to raise funds without written permission." },
    ] },
  },
  {
    id: "liability",
    ar: { t: "حدود المسؤولية", b: [
      { p: "تبذل المؤسسة أقصى جهدها لضمان دقة المعلومات واستمرارية إتاحة الموقع، دون أن تضمن خلوه التام من الأخطاء أو الانقطاع. ولا تتحمل المؤسسة المسؤولية عن الأضرار غير المباشرة الناشئة عن استخدام الموقع، أو عن أعطال بوابات الدفع أو البنوك أو شبكات الاتصال، أو عن محتوى الروابط الخارجية التي لا تخضع لإدارتها." },
    ] },
    en: { t: "Limitation of liability", b: [
      { p: "We work hard to keep information accurate and the site available, but we cannot guarantee it is error-free or uninterrupted. The Foundation is not liable for indirect damages from using the site, for failures of payment gateways, banks or networks, or for external links we do not control." },
    ] },
  },
  {
    id: "changes",
    ar: { t: "الخصوصية وتعديل الشروط والقانون الحاكم", b: [
      { p: "يخضع جمع بياناتك واستخدامها لسياسة الخصوصية المتوافقة مع قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020." },
      { p: "يجوز للمؤسسة تعديل هذه الشروط عند الحاجة، ويُشار إلى تاريخ آخر تحديث أعلى الصفحة، ولا تسري التعديلات بأثر رجعي على التبرعات السابقة لها." },
      { p: "تخضع هذه الشروط وتُفسَّر وفقاً لقوانين جمهورية مصر العربية، وتختص محاكم المنصورة بنظر أي نزاع ينشأ عنها، مع السعي إلى تسوية أي خلاف ودياً قبل اللجوء إلى القضاء." },
    ] },
    en: { t: "Privacy, changes and governing law", b: [
      { p: "How we collect and use your data is governed by our Privacy Policy, aligned with Egyptian Personal Data Protection Law No. 151 of 2020." },
      { p: "We may update these Terms when needed; the last-updated date appears at the top. Changes never apply retroactively to donations made before them." },
      { p: "These Terms are governed by Egyptian law, and the courts of Mansoura have jurisdiction over any dispute, though we always aim to resolve disagreements amicably first." },
    ] },
  },
];

const Terms = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const base = "https://elyusr.org";
  const [active, setActive] = useState(SECTIONS[0].id);
  // TOC starts open on desktop (sticky sidebar), collapsed on mobile
  const [tocOpen] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches);

  // Scroll-spy for the table of contents
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const fmt = (n: number) => n.toLocaleString(isRTL ? "ar-EG" : "en-US");
  const summary = isRTL ? SUMMARY.ar : SUMMARY.en;

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "الشروط والأحكام — مؤسسة اليسر الخيرية" : "Terms & Conditions — Al-Yusr Charity"}
        description={isRTL
          ? "شروط استخدام موقع مؤسسة اليسر الخيرية: التبرعات وطرق الدفع، الزكاة، إعادة تخصيص التبرعات، الاسترداد خلال 7 أيام، التبرع الشهري، والأضاحي."
          : "Al-Yusr Charity terms: donations and payments, zakat, reallocation, refunds within 7 days, monthly giving and Qurbani."}
        path="/terms"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "الشروط والأحكام" : "Terms", url: `${base}/terms` },
      ]} />

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground print:hidden">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="text-primary-foreground/85">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "الشروط والأحكام" : "Terms" }]} />
          </div>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">{isRTL ? "الشروط والأحكام" : "Terms & Conditions"}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-primary-foreground/85">
            {isRTL
              ? "تنظم هذه الشروط العلاقة بين مؤسسة اليسر الخيرية ومستخدمي موقعها الإلكتروني والمتبرعين من خلاله، وتبيّن حقوق كل طرف والتزاماته."
              : "These Terms govern the relationship between Al-Yusr Charity Foundation and the users of, and donors through, its website, setting out each party's rights and obligations."}
          </p>
          <p className="mt-4 text-sm font-bold text-secondary">
            {isRTL ? `آخر تحديث: ${UPDATED_AR} · إشهار رقم 2665 لسنة 2019` : `Last updated: ${UPDATED_EN} · Registration No. 2665/2019`}
          </p>
        </div>
      </section>

      <section className="bg-background py-10 md:py-16">
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
          {/* Table of contents */}
          <nav aria-label={isRTL ? "محتويات الصفحة" : "On this page"} className="print:hidden lg:sticky lg:top-28 lg:self-start">
            <details className="group rounded-xl border border-border bg-card lg:border-0 lg:bg-transparent" open={tocOpen}>
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-4 text-sm font-black text-primary lg:pointer-events-none lg:px-0">
                {isRTL ? "محتويات الصفحة" : "On this page"}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 lg:hidden" aria-hidden />
              </summary>
              <ol className="space-y-0.5 px-2 pb-3 lg:px-0">
                {SECTIONS.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-current={active === s.id ? "location" : undefined}
                      className="flex min-h-[36px] items-center gap-2.5 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=location]:bg-secondary/20 aria-[current=location]:font-bold aria-[current=location]:text-primary"
                    >
                      <span className="w-5 shrink-0 font-mono text-xs tabular-nums">{fmt(i + 1)}</span>
                      {isRTL ? s.ar.t : s.en.t}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
            <button
              type="button"
              onClick={() => window.print()}
              className="mt-3 hidden min-h-[40px] items-center gap-2 rounded-lg px-2 text-sm font-bold text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
            >
              <Printer className="h-4 w-4" />
              {isRTL ? "طباعة / حفظ PDF" : "Print / save PDF"}
            </button>
          </nav>

          <div className="min-w-0">
            {/* Plain-language summary */}
            <aside className="rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
              <h2 className="text-xl font-black text-secondary sm:text-2xl">{isRTL ? "ملخص الأحكام الرئيسية" : "Summary of key provisions"}</h2>
              <ul className="mt-4 space-y-3">
                {summary.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed sm:text-base">
                    <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-primary-foreground/70">
                {isRTL ? "هذا الملخص للتيسير فحسب، ويُعتد بالنص الكامل الوارد أدناه عند التعارض." : "This summary is provided for convenience only; the full text below prevails in case of conflict."}
              </p>
            </aside>

            {/* Full terms */}
            <div className="mt-12 space-y-12">
              {SECTIONS.map((s, i) => {
                const c = isRTL ? s.ar : s.en;
                return (
                  <section key={s.id} id={s.id} className="scroll-mt-28">
                    <h2 className="flex items-baseline gap-3 text-xl font-black text-primary sm:text-2xl">
                      <span className="font-mono text-base tabular-nums text-accent">{fmt(i + 1)}.</span>
                      {c.t}
                    </h2>
                    <div className="mt-4 max-w-[70ch] space-y-3 text-base leading-[1.85] text-foreground/85">
                      {c.b.map((b, bi) =>
                        b.list ? (
                          <ul key={bi} className="space-y-2.5">
                            {b.list.map((li, lii) => (
                              <li key={lii} className="flex gap-3">
                                <span aria-hidden className="mt-[0.8em] h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                                <span>{li}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p key={bi}>{b.p}</p>
                        ),
                      )}
                      {s.id === "changes" && (
                        <p>
                          <Link to="/privacy" className="font-bold text-primary underline decoration-secondary decoration-2 underline-offset-4 hover:text-accent">
                            {isRTL ? "اقرأ سياسة الخصوصية" : "Read the Privacy Policy"}
                          </Link>
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Contact */}
            <section id="contact" className="mt-14 scroll-mt-28 rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-black text-primary sm:text-2xl">{isRTL ? "التواصل بشأن هذه الشروط" : "Contact regarding these Terms"}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {isRTL ? "لأي استفسار أو طلب استرداد، يُرجى التواصل معنا عبر القنوات الرسمية التالية مع ذكر الرقم المرجعي للإيصال." : "For any enquiry or refund request, please contact us through the official channels below, quoting your receipt reference number."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="https://wa.me/201097000137" target="_blank" rel="noopener" data-source="terms" data-label="whatsapp"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <WhatsAppIcon className="h-4 w-4" /> {isRTL ? "واتساب" : "WhatsApp"}
                </a>
                <a href="tel:+201097000137" data-source="terms" data-label="phone"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border px-5 text-sm font-bold text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Phone className="h-4 w-4" /> <span dir="ltr">+20 109 700 0137</span>
                </a>
                <a href={`mailto:${FOUNDATION_EMAIL}`} data-source="terms" data-label="email"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border px-5 text-sm font-bold text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Mail className="h-4 w-4" /> {FOUNDATION_EMAIL}
                </a>
              </div>
            </section>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
export default Terms;
