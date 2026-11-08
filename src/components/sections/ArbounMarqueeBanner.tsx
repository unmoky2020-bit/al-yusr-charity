import { memo, useEffect, useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Heart,
  Laptop,
  CheckCircle2,
  Award,
  Zap,
  FileCheck2,
  Coins,
  BadgeCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useLang } from "@/i18n/LangContext";

interface PromotionItem {
  icon: React.ReactNode;
  textAr: string;
  textEn: string;
}

const MarqueeRow = ({
  items,
  isRTL,
  rowIndex,
  speed = 95,
  reverse = false,
  theme = "lime",
}: {
  items: PromotionItem[];
  isRTL: boolean;
  rowIndex: number;
  speed?: number;
  reverse?: boolean;
  theme?: "lime" | "orange";
}) => {
  const getAnimationValues = () => {
    if (rowIndex === 0) {
      if (reverse) {
        return isRTL ? ["0%", "100%"] : ["0%", "-100%"];
      } else {
        return isRTL ? ["0%", "-100%"] : ["0%", "100%"];
      }
    } else {
      if (reverse) {
        return isRTL ? ["0%", "-100%"] : ["0%", "100%"];
      } else {
        return isRTL ? ["0%", "100%"] : ["0%", "-100%"];
      }
    }
  };

  const xAnimation = getAnimationValues();

  // Duplicate items 6 times for seamless infinite loop
  const duplicatedItems = [...items, ...items, ...items, ...items, ...items, ...items];

  const isLime = theme === "lime";

  return (
    <motion.div
      className="flex gap-8 md:gap-12 whitespace-nowrap"
      initial={{ x: xAnimation[0] }}
      animate={{ x: xAnimation[1] }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: "linear",
        repeatType: "loop",
        repeatDelay: 0,
      }}
      aria-hidden="true"
      key={`row-${rowIndex}-${isRTL ? "rtl" : "ltr"}-${reverse ? "reverse" : "normal"}`}
    >
      {duplicatedItems.map((item, index) => (
        <div
          key={`row-${rowIndex}-${index}-${reverse ? "r" : "n"}`}
          className={`flex items-center gap-3 font-black text-xs sm:text-sm md:text-base flex-shrink-0 px-2 select-none ${
            isLime ? "text-[#0a2312]" : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          }`}
        >
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-full border shadow-sm ${
              isLime
                ? "bg-black/15 border-black/20 text-[#0a2312] [&_svg]:text-[#0a2312] [&_svg]:stroke-[2.5]"
                : "bg-black/25 border-white/30 text-white [&_svg]:text-white [&_svg]:stroke-[2.5]"
            }`}
          >
            {item.icon}
          </span>
          <span className="tracking-wide">{isRTL ? item.textAr : item.textEn}</span>
        </div>
      ))}
    </motion.div>
  );
};

export const ArbounMarqueeBanner = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [lang]);

  const topBannerPromotions: PromotionItem[] = [
    {
      icon: <Zap className="h-4 w-4" />,
      textAr: "اقتطع نسبة من كل مشروع، تُفتح لك أبواب الرزق والبركة",
      textEn: "Deduct a fraction per client project — invite barakah & flow",
    },
    {
      icon: <Laptop className="h-4 w-4" />,
      textAr: "مبادرة الفريلانسرز الأولى في مصر والوطن العربي 🚀",
      textEn: "The #1 Freelancers & Remote Professionals Initiative 🚀",
    },
    {
      icon: <BadgeCheck className="h-4 w-4" />,
      textAr: "شارة «مستقل داعم» الرقمية لمعرض أعمالك وحساباتك على GitHub وBehance",
      textEn: "Digital 'Impact Freelancer' Badge for your Portfolio",
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      textAr: "مشهرة برقم 2665 لسنة 2019 — إشراف وزارة التضامن الاجتماعي",
      textEn: "Officially Registered NGO #2665 (2019) — Ministry Supervised",
    },
    {
      icon: <FileCheck2 className="h-4 w-4" />,
      textAr: "توثيق ميداني فوري بالصور والفيديو وكود تتبع لكل تبرع",
      textEn: "Real-time field video/photo documentation & tracking code",
    },
    {
      icon: <Heart className="h-4 w-4" />,
      textAr: "توجيه التبرعات لكفالة الأيتام وتيسير الزواج وسقيا الماء",
      textEn: "Directly funds orphan education, brides, and clean water",
    },
  ];

  const bottomBannerPromotions: PromotionItem[] = [
    {
      icon: <Coins className="h-4 w-4" />,
      textAr: "لا يوجد حد أدنى، فحتى 1% تصنع فرقًا حقيقيًا في حياة أسرة",
      textEn: "No minimum — even 1% builds a roof or feeds a family",
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      textAr: "تبرع آمن بالبطاقة البنكية أو فودافون كاش أو InstaPay أو CIB",
      textEn: "Secure Payment via Visa, Mastercard, InstaPay & Cash",
    },
    {
      icon: <Award className="h-4 w-4" />,
      textAr: "نقبل التبرعات بالدولار والريال واليورو إن كان عملاؤك في الخارج",
      textEn: "Accepts USD, SAR & EUR from your international earnings",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      textAr: "علاج لضغط العمل وقلقه، ولبطء العملاء وتأخر الدفعات",
      textEn: "Relieves project fatigue, client delays, and market stress",
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      textAr: "صدقة جارية وأصل وقفي يبقى أثره وتتضاعف به حسناتك",
      textEn: "Ongoing charity & lasting endowment multiplying good deeds",
    },
  ];

  const topSpeed = 140;
  const bottomSpeed = 155;

  return (
    <div
      id="arboun-marquee-section"
      className="relative w-full mx-auto z-20 overflow-x-clip py-2 sm:py-3 pointer-events-none select-none"
      key={key}
    >
      <div className="flex flex-col items-center gap-1.5 sm:gap-2">
        {/* البنر العلوي: فسفوري نيون مائل مع حركة سلسة وبكامل الارتفاع */}
        <div
          className="relative h-14 sm:h-16 flex items-center overflow-hidden border-y-2 border-[#b8f72c] shadow-[0_0_25px_rgba(163,230,53,0.5)] backdrop-blur-sm"
          style={{
            transform: isRTL ? "rotate(-1.2deg)" : "rotate(1.2deg)",
            transformOrigin: "center center",
            width: "112vw",
            marginLeft: "-6vw",
            marginRight: "-6vw",
          }}
        >
          {/* خلفية فسفوري فاقعة ومشرقة */}
          <div className="absolute inset-0 bg-gradient-to-r from-lime-400 via-[#b6f528] to-lime-400 pointer-events-none z-0" />

          <div className="absolute inset-0 flex items-center">
            <MarqueeRow
              items={topBannerPromotions}
              isRTL={isRTL}
              rowIndex={0}
              speed={topSpeed}
              reverse={true}
              theme="lime"
            />
          </div>
        </div>

        {/* البنر السفلي: برتقالي مائل بالاتجاه المعاكس مع حركة مضادة وبكامل الارتفاع */}
        <div
          className="relative h-14 sm:h-16 flex items-center overflow-hidden border-y-2 border-[#ff7b2b] shadow-[0_0_25px_rgba(255,104,26,0.5)] backdrop-blur-sm"
          style={{
            transform: isRTL ? "rotate(1.3deg)" : "rotate(-1.3deg)",
            transformOrigin: "center center",
            width: "112vw",
            marginLeft: "-6vw",
            marginRight: "-6vw",
          }}
        >
          {/* خلفية برتقالية دافئة ومميزة */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff5500] via-[#ff7315] to-[#ff5500] pointer-events-none z-0" />

          <div className="absolute inset-0 flex items-center flex-row-reverse">
            <MarqueeRow
              items={bottomBannerPromotions}
              isRTL={isRTL}
              rowIndex={1}
              speed={bottomSpeed}
              reverse={true}
              theme="orange"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
