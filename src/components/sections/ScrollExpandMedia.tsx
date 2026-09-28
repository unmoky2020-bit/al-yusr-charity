import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import {
  Volume2,
  VolumeX,
  ArrowDown,
  Award,
  ShieldCheck,
  Sparkles,
  Coins,
  CheckCircle2,
} from "lucide-react";

interface ScrollExpandMediaProps {
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc?: string;
  title?: string;
  badge?: string;
  isRTL?: boolean;
  children?: React.ReactNode;
}

export const ScrollExpandMedia = ({
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title = "اتصدق النهاردة.. وخليه عربون لبركة بكرة",
  badge = "عربون خير 🌿",
  isRTL = true,
  children,
}: ScrollExpandMediaProps) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sound enabled by default as explicitly requested by user
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll track dedicated purely to the video expansion
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  // Dedicated Desktop vs Mobile Transforms
  // Longer, cinematic scroll journey (380vh on mobile -> 540vh on desktop)
  // Starts compact and taller, expands smoothly as it sinks downward
  const desktopScale = useTransform(smoothProgress, [0, 0.45, 0.8, 1], [0.85, 0.95, 1.02, 1.04]);
  const mobileScale = useTransform(smoothProgress, [0, 0.45, 0.8, 1], [0.93, 0.98, 1.01, 1.02]);
  const scale = isMobile ? mobileScale : desktopScale;

  // Dynamic downward sinking motion as you scroll ("ينسحب وينزل لأسفل مع الاسكرول")
  const desktopTranslateY = useTransform(smoothProgress, [0, 0.35, 0.7, 1], [10, 24, 42, 58]);
  const mobileTranslateY = useTransform(smoothProgress, [0, 0.35, 0.7, 1], [0, 14, 28, 40]);
  const translateY = isMobile ? mobileTranslateY : desktopTranslateY;

  const borderGlow = useTransform(smoothProgress, [0, 0.7, 1], [0.4, 0.85, 1]);

  // Desktop flank decorative cards animation — visible at start, gently fade & yield focus as video expands
  const flankOpacity = useTransform(smoothProgress, [0, 0.25, 0.55, 0.75], [1, 1, 0.25, 0]);
  const flankRightX = useTransform(smoothProgress, [0, 0.65], [0, 40]);
  const flankLeftX = useTransform(smoothProgress, [0, 0.65], [0, -40]);
  const flankScale = useTransform(smoothProgress, [0, 0.65], [1, 0.92]);

  const mobileWidth = useTransform(
    smoothProgress,
    [0, 0.45, 0.85],
    ["92vw", "96vw", "100vw"]
  );

  const mobileRadius = useTransform(
    smoothProgress,
    [0, 0.45, 0.82],
    ["2rem", "1rem", "0rem"]
  );
  const desktopRadius = useTransform(smoothProgress, [0, 1], ["2.5rem", "2.5rem"]);
  const borderRadius = isMobile ? mobileRadius : desktopRadius;

  // Initial corner texts fade & drift away during early scroll (0 -> 0.3)
  const cornerTextOpacity = useTransform(smoothProgress, [0, 0.28], [1, 0]);
  const topLeftY = useTransform(smoothProgress, [0, 0.28], [0, -50]);
  const topLeftX = useTransform(smoothProgress, [0, 0.28], [0, -40]);
  const bottomRightY = useTransform(smoothProgress, [0, 0.28], [0, 50]);
  const bottomRightX = useTransform(smoothProgress, [0, 0.28], [0, 40]);

  // Intersection-driven play/pause — only plays when at least 50% visible in viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Try unmuted first, fallback to muted if browser blocks it
          video.muted = isMuted;
          video.play().catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }   // must be 50% in view before playing
    );

    observer.observe(video);

    // Unlock sound on first user gesture
    const handleFirstInteraction = () => {
      if (video && !video.paused) {
        video.muted = false;
        setIsMuted(false);
      }
    };
    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [mediaSrc]);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  // Title split: first part top-left, second part bottom-right
  const words = title ? title.split("..") : [];
  const firstPart = words[0]?.trim() || "اتصدق النهاردة";
  const secondPart = (words[1] ? words[1].trim() : "وخليه عربون لبركة بكرة!").replace(/^[،,\s]+/, "");

  return (
    <div
      ref={sectionRef}
      id="arboun-video-section"
      className="relative z-20 w-full bg-background -mt-2 sm:-mt-10 md:-mt-14"
    >
      {/* ── 1. The Scroll Sticky Video Expansion Track ────────── */}
      <div
        ref={trackRef}
        className="relative w-full h-[380vh] sm:h-[480vh] lg:h-[540vh]"
      >
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-start pt-20 sm:pt-14 md:justify-center md:pt-0 pb-16 sm:pb-10 md:pb-0 overflow-x-clip">
          {/* Subtle Ambient Background - Harmonized with Section's Background */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-background">
            {bgImageSrc ? (
              <img
                src={bgImageSrc}
                alt="Al-Yusr Charity"
                className="w-full h-full object-cover object-center opacity-15"
              />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,hsl(150_55%_12%/0.45),hsl(var(--background))_75%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background/90" />
          </div>


          {/* ── Main Layout: Flanks on Desktop + Center Video Frame ── */}
          <div className="relative z-10 flex items-center justify-center gap-6 lg:gap-8 xl:gap-12 w-full max-w-7xl px-0 sm:px-4" style={{ overflow: "visible" }}>

            {/* ── Right Decorative Flank (Large Screens Only: xl & up) ── */}
            <motion.div
              style={{ opacity: flankOpacity, x: flankRightX, scale: flankScale }}
              className="hidden xl:flex flex-col gap-4 w-72 shrink-0 z-20 pointer-events-none select-none"
            >
              {/* Widget 1: Digital Freelancer Badge */}
              <div className="rounded-2xl bg-black/80 dark:bg-card/90 backdrop-blur-xl p-4 border border-orange-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
                    <Award className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="inline-block text-[10px] font-black uppercase text-orange-400 tracking-wider">
                      {isRTL ? "شارة معتمدة" : "Verified Badge"}
                    </span>
                    <h4 className="text-sm font-black text-white leading-tight">
                      {isRTL ? "شارة «مستقل داعم»" : "Impact Freelancer"}
                    </h4>
                  </div>
                </div>
                <p className="text-[11.5px] leading-relaxed text-zinc-300 font-medium">
                  {isRTL
                    ? "أضفها لـ GitHub و Behance وبورتفوليو أعمالك كأصل أخلاقي يميّزك."
                    : "Display it on your GitHub & Behance as a verified impact badge."}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-orange-400/90">
                  <Sparkles className="h-3 w-3" />
                  <span>{isRTL ? "تميّز أمام عملائك بالخارج" : "Stand out to global clients"}</span>
                </div>
              </div>

              {/* Widget 2: Flexible Giving / Zero Minimum */}
              <div className="rounded-2xl bg-black/80 dark:bg-card/90 backdrop-blur-xl p-4 border border-lime-400/30 shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/15 border border-lime-400/30 text-lime-400">
                    <Coins className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="inline-block text-[10px] font-black uppercase text-lime-400 tracking-wider">
                      {isRTL ? "مرونة كاملة" : "No Minimum"}
                    </span>
                    <h4 className="text-sm font-black text-white leading-tight">
                      {isRTL ? "مفيش حد أدنى للتبرع" : "Flexible Giving"}
                    </h4>
                  </div>
                </div>
                <p className="text-[11.5px] leading-relaxed text-zinc-300 font-medium">
                  {isRTL
                    ? "استقطع أي نسبة تناسب مشروعك.. بالجنيه أو الدولار أو الريال."
                    : "Pledge any percentage from each payout via cards or InstaPay."}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-lime-400/90">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{isRTL ? "دفع مشفر وآمن 100%" : "100% Secure Checkout"}</span>
                </div>
              </div>
            </motion.div>

            {/* ── Center Wrapper: video + texts share the same relative context ── */}
            <div className="relative w-full sm:w-auto lg:max-w-[430px] xl:max-w-[470px] flex items-center justify-center" style={{ overflow: "visible" }}>

              {/* ── Top-Left Corner Text — hangs off the left edge of the video ── */}
              <motion.div
                style={{ opacity: cornerTextOpacity, y: topLeftY, x: topLeftX }}
                className="pointer-events-none absolute top-[6%] sm:top-[8%] left-2 sm:-left-10 lg:-left-20 z-30 max-w-[190px] sm:max-w-[260px] text-left select-none"
              >
                <div className="rounded-2xl bg-black/80 backdrop-blur-md px-3 py-2.5 sm:px-4 sm:py-3 border border-lime-400/30 shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/20 px-2 py-0.5 text-[10px] font-black text-lime-400 border border-lime-400/40 mb-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-ping" />
                    <span>{isRTL ? "مبادرة الفريلانسرز الأولى" : "Freelancers Initiative"}</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-tight">
                    {firstPart}..
                  </h2>
                </div>
              </motion.div>

              {/* ── Bottom-Right Corner Text — hangs off the right edge of the video ── */}
              <motion.div
                style={{ opacity: cornerTextOpacity, y: bottomRightY, x: bottomRightX }}
                className="pointer-events-none absolute bottom-[6%] sm:bottom-[8%] right-2 sm:-right-10 lg:-right-20 z-30 max-w-[210px] sm:max-w-[280px] text-right flex flex-col items-end select-none"
              >
                <div className="rounded-2xl bg-black/75 backdrop-blur-md px-3 py-2.5 sm:px-4 sm:py-3 border border-lime-400/30 shadow-[0_8px_32px_rgba(0,0,0,0.9)]">
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-lime-400 drop-shadow-[0_4px_24px_rgba(163,230,53,0.85)] leading-tight">
                    {secondPart}
                  </h2>
                  <div className="mt-1.5 flex items-center justify-end gap-2 text-white font-bold text-[11px] sm:text-xs">
                    <span>{isRTL ? "مرر لأسفل لاستكمال المشهد" : "Scroll to expand"}</span>
                    <ArrowDown size={13} className="animate-bounce text-lime-400" />
                  </div>
                </div>
              </motion.div>

              {/* ── Video frame ── */}
              <motion.div
                style={{
                  scale,
                  y: translateY,
                  borderRadius,
                  width: isMobile ? mobileWidth : undefined,
                  maxWidth: isMobile ? "100vw" : undefined,
                }}
                className="relative overflow-hidden border-2 border-lime-400 bg-black shadow-[0_0_80px_rgba(163,230,53,0.5)] h-[82vh] sm:h-[88vh] lg:h-[80vh] xl:h-[84vh] max-h-[88vh] sm:max-h-[90vh] sm:aspect-[9.8/16] sm:max-w-[85vw] lg:max-w-[420px] xl:max-w-[460px] transform-gpu"
              >
                <video
                  ref={videoRef}
                  src={mediaSrc}
                  poster={posterSrc}
                  muted={isMuted}
                  loop
                  playsInline
                  preload="none"
                  className="w-full h-full object-cover cursor-pointer transform-gpu"
                  onClick={toggleMute}
                />

                <motion.div
                  style={{ opacity: borderGlow, borderRadius }}
                  className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-lime-400 shadow-[inset_0_0_35px_rgba(163,230,53,0.4)]"
                />

                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 rounded-full bg-black/80 px-3.5 py-1.5 text-xs font-black text-lime-400 border border-lime-400/60 backdrop-blur-md shadow-md">
                  <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                  <span>{isRTL ? "عربون خير 🌿" : "Arboun Khair 🌿"}</span>
                </div>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="absolute bottom-3.5 sm:bottom-4 left-3.5 sm:left-4 z-40 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/80 text-white backdrop-blur-md border border-lime-400/70 hover:bg-lime-400 hover:text-black transition-all shadow-[0_4px_20px_rgba(0,0,0,0.7)] hover:scale-105 active:scale-95 group"
                  aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                  title={isMuted ? (isRTL ? "تشغيل الصوت" : "Unmute Sound") : (isRTL ? "كتم الصوت" : "Mute Sound")}
                >
                  {isMuted ? (
                    <VolumeX className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-rose-400 group-hover:text-black transition" />
                  ) : (
                    <Volume2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-lime-400 group-hover:text-black transition" />
                  )}
                </button>
              </motion.div>
            </div>

            {/* ── Left Decorative Flank (Large Screens Only: xl & up) ── */}
            <motion.div
              style={{ opacity: flankOpacity, x: flankLeftX, scale: flankScale }}
              className="hidden xl:flex flex-col gap-4 w-72 shrink-0 z-20 pointer-events-none select-none"
            >
              {/* Widget 3: Real-Time Field Documentation */}
              <div className="rounded-2xl bg-black/80 dark:bg-card/90 backdrop-blur-xl p-4 border border-lime-400/30 shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/15 border border-lime-400/30 text-lime-400">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="inline-block text-[10px] font-black uppercase text-lime-400 tracking-wider">
                      {isRTL ? "شفافية وتوثيق" : "Verified NGO"}
                    </span>
                    <h4 className="text-sm font-black text-white leading-tight">
                      {isRTL ? "توثيق ميداني فوري" : "Field Proof & Code"}
                    </h4>
                  </div>
                </div>
                <p className="text-[11.5px] leading-relaxed text-zinc-300 font-medium">
                  {isRTL
                    ? "توثيق بالصور والفيديو وكود تتبع مخصص لكل تبرع يوصلك تقريره."
                    : "Photo/video documentation and a unique tracking code per gift."}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-lime-400/90">
                  <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                  <span>{isRTL ? "إشراف وزارة التضامن 2665" : "Ministry Supervised #2665"}</span>
                </div>
              </div>

              {/* Widget 4: Real Impact Multiplier */}
              <div className="rounded-2xl bg-black/80 dark:bg-card/90 backdrop-blur-xl p-4 border border-orange-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="inline-block text-[10px] font-black uppercase text-orange-400 tracking-wider">
                      {isRTL ? "بركة الرزق" : "Barakah & Growth"}
                    </span>
                    <h4 className="text-sm font-black text-white leading-tight">
                      {isRTL ? "علاج قلق الشغل" : "Peace of Mind"}
                    </h4>
                  </div>
                </div>
                <p className="text-[11.5px] leading-relaxed text-zinc-300 font-medium">
                  {isRTL
                    ? "استنزل الرزق بالعطاء.. وخلّي عربون خيرك حصن وسند في مواسم الركود."
                    : "Attract divine provision through giving and safeguard dry seasons."}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-orange-400/90">
                  <Award className="h-3 w-3" />
                  <span>{isRTL ? "كفالة أيتام • تيسير زواج • مياه" : "Orphans • Brides • Water"}</span>
                </div>
              </div>
            </motion.div>
          </div>


        </div>
      </div>
    </div>
  );
};
