import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import khabiaCan from "@/assets/khabia-can.png";
import brandCan from "@/assets/brand-can.png";
import brandVan from "@/assets/brand-van.jpg";
import brandValues from "@/assets/brand-values-diagram.jpg";

const KhabiaLanding = () => (
  <CampaignLandingShell
    slug="khabia"
    path="/khabia"
    badgeAr="صدقة جارية بأبسط طريقة"
    badgeEn="Easiest ongoing sadaqah"
    titleAr="الخبيئة — صدقة لا يعلمها إلا الله"
    titleEn="Al-Khabiaa — Sadaqah only Allah knows"
    taglineAr="حصّالة صغيرة في بيتك بالمنصورة أو ميت غمر، تضع فيها كل يوم ما تيسّر: جنيهًا أو خمسة أو عشرة. يوصلها مندوب اليسر إليك مجانًا، ويمر لاستلامها كل فترة. أنت تنوي، ونحن نوصل."
    taglineEn="A small donation can that lives in your home in Mansoura or Mit Ghamr. Drop in whatever you can each day — 1, 5 or 10 EGP. Al-Yusr brings it free and collects it periodically. You intend, we deliver."
    metaDescAr="اطلب حصّالة الخبيئة من مؤسسة اليسر — صدقة جارية يومية في بيتك بالدقهلية والمنصورة وميت غمر وطلخا وكفر الشيخ. يوصلها مندوب اليسر ويستلمها مجانًا، مع توثيق كامل."
    metaDescEn="Request your Al-Khabiaa sadaqah can from Al-Yusr — daily ongoing charity at home across Dakahlia, Mansoura, Mit Ghamr, Talkha and Kafr El Sheikh. Free delivery and pickup."
    heroImage={khabiaCan}
    heroAlt="حصّالة الخبيئة من مؤسسة اليسر للصدقة الجارية"
    pillars={[
      { titleAr: "صدقة كل يوم", titleEn: "Daily sadaqah", descAr: "لا تحتاج إلى مبلغ كبير؛ فجنيه أو خمسة كل يوم تصنع صدقة كبيرة على مدار الشهر، تُكتب في صحيفتك وتصل إلى أهل الدقهلية.", descEn: "No big amount needed. 1 or 5 EGP a day becomes a large sadaqah over a month — in your record and Dakahlia families' lives." },
      { titleAr: "توصيل واستلام مجاني", titleEn: "Free delivery & pickup", descAr: "يوصلها مندوب اليسر حتى باب البيت في المنصورة وميت غمر وطلخا وبلقاس وقرى كفر الشيخ، ونمر لاستلامها مرة كل ٣ شهور.", descEn: "Our team delivers it to your door across Mansoura, Mit Ghamr, Talkha, Belqas and Kafr El Sheikh — and we collect every 3 months." },
      { titleAr: "تقرير شخصي", titleEn: "Personal report", descAr: "بعد كل استلام نرسل إليك إجمالي ما جمعته خبيئتك ومجال صرفه، مع رقم تتبّع لكل خبيئة على حدة.", descEn: "After every pickup, we send your can's total, where it was spent, and a tracking number for each can." },
    ]}
    steps={[
      { titleAr: "اطلب خبيئتك", titleEn: "Request your can", descAr: "املأ النموذج أو راسلنا عبر واتساب، وسنحدد معك موعد التسليم حسب منطقتك.", descEn: "Fill the form or message us on WhatsApp — we coordinate delivery timing for your area." },
      { titleAr: "نوصّلها مجانًا", titleEn: "We deliver free", descAr: "يوصل مندوب اليسر الخبيئة حتى باب البيت في الدقهلية أو كفر الشيخ خلال ٧٢ ساعة.", descEn: "Al-Yusr delivers the can to your door in Dakahlia or Kafr El Sheikh within 72 hours." },
      { titleAr: "تصدّق كل يوم", titleEn: "Drop in daily", descAr: "ضعها في مكان ظاهر، في غرفة الاستقبال أو بجوار باب البيت، وضع فيها ما تيسّر يوميًا بنيّة الصدقة.", descEn: "Place it visibly — by the entry or living area — and drop in whatever you can daily with sadaqah intention." },
      { titleAr: "نمرّ لاستلامها", titleEn: "We collect periodically", descAr: "كل ٣ شهور نمر لاستلامها، ونعدّها أمامك، ثم نرسل إليك تقرير الصرف.", descEn: "Every 3 months we collect, count it in front of you and send the spending report." },
    ]}
    gallery={[
      { src: khabiaCan, altAr: "حصّالة الخبيئة بشعار اليسر", altEn: "Al-Khabiaa can with Al-Yusr branding" },
      { src: brandCan, altAr: "حصّالة تبرعات في بيت بالمنصورة", altEn: "Donation can in a home in Mansoura" },
      { src: brandVan, altAr: "سيارة اليسر لتسليم الخبيئة بقرى الدقهلية", altEn: "Al-Yusr van for Khabiaa delivery in Dakahlia villages" },
      { src: brandValues, altAr: "قيم الشفافية والتوثيق في مؤسسة اليسر", altEn: "Transparency and documentation values at Al-Yusr" },
    ]}
    relatedLinks={[
      { href: "/programs/khabia", ar: "برنامج الخبيئة التفصيلي", en: "Khabiaa program" },
      { href: "/zakat", ar: "زكاة المال", en: "Zakat" },
      { href: "/markoun", ar: "حملة مَرْكون", en: "Markoun campaign" },
      { href: "/food-box", ar: "الغذاء الشهري (لحوم وكرتونة ووجبات)", en: "Monthly food (meat, carton & meals)" },
      { href: "/trust", ar: "الشفافية والتقارير", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "هل خدمة التوصيل والاستلام مجانية فعلًا؟", a: "نعم، التوصيل والاستلام مجانيان تمامًا داخل الدقهلية وكفر الشيخ، وتُحتسب تكلفتهما من بند المصاريف اللوجستية والنقل (٦٪ فقط من التبرعات)." },
        { q: "كم ثمن الخبيئة؟", a: "الحصّالة هدية من اليسر، ولا تدفع ثمنها. كل ما عليك أن تنوي وتضع فيها ما تيسّر يوميًا." },
        { q: "متى تستلمونها؟", a: "نمر لاستلامها كل ٣ شهور في موعد متّفق عليه، ونعدّها أمامك ونعيدها إليك فارغة." },
        { q: "أين يُصرف ما يُجمع؟", a: "يُصرف في برامج اليسر الجارية بالدقهلية: كرتونة الغذاء، وعلاج المسنّين، وتسقيف البيوت المتهالكة، والحصص الدراسية للأيتام." },
        { q: "هل يمكنني طلبها وأنا في كفر الشيخ؟", a: "نعم، نوصلها إلى قرى مختارة في كفر الشيخ بالاتفاق المسبق عبر واتساب." },
        { q: "هل يصلني تقرير عن خبيئتي؟", a: "نعم، بعد كل استلام تحصل على رقم تتبّع وتقرير قصير بمجال الصرف عبر واتساب أو البريد الإلكتروني." },
      ],
      en: [
        { q: "Are delivery and pickup really free?", a: "Yes — fully free inside Dakahlia and Kafr El Sheikh; the cost comes from our logistics and transport budget (only 6% of donations)." },
        { q: "How much does the can cost?", a: "It's a gift from Al-Yusr — no purchase price. Just intend and drop in what you can daily." },
        { q: "When do you collect it?", a: "Every 3 months at an agreed time. We count in front of you and return it empty." },
        { q: "Where do collected funds go?", a: "Active Al-Yusr Dakahlia programs: food cartons, elder medication, roof repairs, orphan tuition." },
        { q: "Can I request one in Kafr El Sheikh?", a: "Yes — we deliver to selected Kafr El Sheikh villages by prior WhatsApp arrangement." },
        { q: "Will I get a report?", a: "Yes — after each pickup you receive a tracking number and a short spending report via WhatsApp or email." },
      ],
    }}
    donateHref="/donate?program=khabia"
    donateLabelAr="اطلب خبيئتك مجانًا"
    donateLabelEn="Request your free can"
    bottomCtaAr="ابدأ صدقتك الجارية اليوم"
    bottomCtaEn="Start your ongoing sadaqah today"
  />
);

export default KhabiaLanding;