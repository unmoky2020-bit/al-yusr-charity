import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useLang } from "@/i18n/LangContext";

interface ScrollVideoExpansionProps {
  videoSrc: string;
  posterSrc?: string;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
}

export const ScrollVideoExpansion = ({
  videoSrc,
  posterSrc,
  titleAr = "شاهد أثر «عربون خير» في دقيقة واحدة",
  titleEn = "Watch the Impact of Arboun Khair in One Minute",
  subtitleAr = "كيف تتحول نسبة بسيطة من أرباح مشروعك إلى نور وحياة لأسر مستحقة؟",
  subtitleEn = "How a small fraction of your client earnings turns into verified hope for families?",
}: ScrollVideoExpansionProps) => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll expansion using motion/react
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 1], ["2.2rem", "1.5rem"]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [0.25, 0.7]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => setDuration(video.duration || 0);
    const onTime = () => setCurrentTime(video.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    // Auto-play muted video when in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(video);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      observer.disconnect();
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      if (v.requestFullscreen) {
        v.requestFullscreen().catch(() => {});
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const time = Number(e.target.value);
    v.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-12 md:py-20 bg-gradient-to-b from-background via-card/50 to-background"
      aria-label={isRTL ? titleAr : titleEn}
    >
      {/* Decorative background aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30 blur-3xl"
      >
        <div className="h-80 w-[42rem] rounded-full bg-primary/25" />
      </div>

      <div className="container relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header Badge & Title */}
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/15 px-4 py-1.5 text-xs font-black text-secondary shadow-sm backdrop-blur-xs mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isRTL ? "فيديو المبادرة الرسمي" : "Official Initiative Video"}</span>
          </div>

          <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl text-foreground">
            {isRTL ? titleAr : titleEn}
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isRTL ? subtitleAr : subtitleEn}
          </p>
        </div>

        {/* Expanding Video Box */}
        <motion.div
          style={{
            scale,
            borderRadius,
          }}
          className="relative mx-auto overflow-hidden border-2 border-primary/30 bg-black shadow-[0_25px_70px_-15px_rgba(14,59,46,0.5)] transition-all duration-300"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => {
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
            if (isPlaying) setShowControls(false);
          }}
        >
          {/* Ambient Glow */}
          <motion.div
            style={{ opacity: glowOpacity }}
            className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-secondary/40 to-primary blur-xl -z-10"
          />

          <div className="relative aspect-video w-full">
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterSrc}
              playsInline
              loop
              muted={isMuted}
              preload="metadata"
              className="h-full w-full object-cover cursor-pointer"
              onClick={togglePlay}
            />

            {/* Big Centered Play Button when paused */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer transition-opacity duration-200"
              >
                <div className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/95 text-white shadow-2xl transition hover:scale-110 ring-4 ring-white/20">
                  <Play className={`h-8 w-8 transition ${isRTL ? "me-1" : "ms-1"}`} />
                  <span className="absolute -inset-2 rounded-full border-2 border-white/40 animate-ping opacity-35" />
                </div>
              </div>
            )}

            {/* Live / Brand Badge Top Right */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur-md border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isRTL ? "مبادرة عربون خير" : "Arboun Khair"}</span>
            </div>

            {/* Bottom Controls Bar */}
            <div
              className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 transition-all duration-300 ${
                showControls || !isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Slider */}
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-[11px] font-mono text-white/80 shrink-0">
                  {formatTime(currentTime)}
                </span>
                <div className="relative flex-1 group/bar">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-primary z-10 pointer-events-none"
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      [isRTL ? "right" : "left"]: 0,
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleTimeChange}
                    className="w-full h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer focus:outline-none accent-primary"
                    style={{ direction: isRTL ? "rtl" : "ltr" }}
                  />
                </div>
                <span className="text-[11px] font-mono text-white/80 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/30"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleMute}
                    className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/30"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/30"
                  aria-label="Fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
