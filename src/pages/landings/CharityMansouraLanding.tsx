import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { useLang } from "@/i18n/LangContext";
import poster from "@/assets/markoun-poster-furniture.webp";

const CharityMansouraLanding = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";

  return (
    <CampaignLandingShell
      slug="charity-mansoura"
      path="/charity-mansoura"
      badgeAr="حملة محلية"
      badgeEn="Local campaign"
      titleAr="حملة اليسر في المنصورة — مساعدات إنسانية" 
      titleEn="Al-Yusr — Mansoura local relief campaign"
      taglineAr="دعم عاجل للأسر المتعففة في المنصورة والدقهلية مع توثيق وتسليم مجاني." 
      taglineEn="Emergency support for needy families in Mansoura & Dakahlia with proof and free delivery."
      metaDescAr="ادعم الأسر في المنصورة عبر تبرعات مالية أو عينية — توثيق وصور وفيديو وتوصيل لباب المنزل."
      metaDescEn="Support families in Mansoura via monetary or in-kind donations — documented with photos, video and doorstep delivery."
      heroImage={poster}
      heroAlt={isAr ? "حملة اليسر بالمنصورة" : "Al-Yusr Mansoura campaign"}
      pricing={[]}
      pillars={[
        { titleAr: "توصيل مجاني", titleEn: "Free delivery", descAr: "توصيل لباب البيت بدون رسوم", descEn: "Doorstep delivery at no cost" },
        { titleAr: "توثيق كامل", titleEn: "Full documentation", descAr: "صور وفيديو لكل عملية تسليم", descEn: "Photos and video for every delivery" },
        { titleAr: "حالات موثوقة", titleEn: "Verified cases", descAr: "فحص اجتماعي لكل حالة قبل التسليم", descEn: "Social screening before delivery" },
      ]}
      steps={[
        { titleAr: "اختر تبرعك", titleEn: "Choose donation", descAr: "مبلغ مالي أو تبرع عيني — أنت تختار", descEn: "Pick an amount or an item to donate" },
        { titleAr: "نطابق الحالة", titleEn: "We match a case", descAr: "نربط تبرعك بعائلة موثقة في المنصورة", descEn: "We match your donation to a documented Mansoura family" },
        { titleAr: "نوثق ونبلغك", titleEn: "We document & report", descAr: "صور وفيديو وتقرير يرسل لك بعد التسليم", descEn: "Photos, video and a report are sent after delivery" },
      ]}
      faq={{
        ar: [
          { q: "كيف أتبرع؟", a: "يمكنك التبرع عبر صفحة التبرع أو التواصل عبر واتساب." },
          { q: "هل التسليم مجاني؟", a: "نعم — التوصيل للمستفيدين في المنصورة مجانًا." },
        ],
        en: [
          { q: "How to donate?", a: "Donate via the donate page or contact us on WhatsApp." },
          { q: "Is delivery free?", a: "Yes — delivery to beneficiaries in Mansoura is free." },
        ],
      }}
      donateHref="/donate?program=charity-mansoura"
      donateLabelAr="ادعم الآن"
      donateLabelEn="Support now"
    />
  );
};

export default CharityMansouraLanding;
