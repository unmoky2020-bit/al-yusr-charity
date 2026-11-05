import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Heart, Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";

gsap.registerPlugin(ScrollTrigger);

/**
 * EidJourney — pure SVG animated story (RTL-first).
 * Chapters: lonely woman → surprise happiness → donations arrive → Yusr aid box delivered →
 * better life ("حل يُسر لتحسين ظروف المعيشة"). All decor is inline transparent SVG (no images).
 */

/* ---------- Reusable SVG scene primitives (all use semantic tokens via currentColor) ---------- */

const SceneFrame = ({ children, label, sceneKey }: { children: React.ReactNode; label: string; sceneKey: string }) => (
  <div
    data-eid="scene"
    data-eid-scene={sceneKey}
    className="group relative aspect-square w-full overflow-hidden rounded-[1.75rem] border border-secondary/30 bg-[hsl(152_55%_9%)]/80 ring-1 ring-secondary/10 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-secondary/60 hover:shadow-[0_20px_60px_-20px_hsl(75_85%_60%/0.45)]"
    aria-label={label}
  >
    {/* gold corner ornaments */}
    <span aria-hidden className="pointer-events-none absolute start-2 top-2 h-5 w-5 rounded-tl-xl border-s-2 border-t-2 border-secondary/60 transition-all duration-500 group-hover:h-7 group-hover:w-7 group-hover:border-secondary" />
    <span aria-hidden className="pointer-events-none absolute end-2 bottom-2 h-5 w-5 rounded-br-xl border-e-2 border-b-2 border-secondary/60 transition-all duration-500 group-hover:h-7 group-hover:w-7 group-hover:border-secondary" />
    {/* radial glow on hover */}
    <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(75_85%_60%/0.18),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    {children}
  </div>
);

/** Chapter 1: lonely woman sitting (silhouette) under dim moonlight */
const SceneLonely = () => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
    <defs>
      <radialGradient id="dimMoon" cx="80%" cy="20%" r="60%">
        <stop offset="0%" stopColor="hsl(75 85% 60% / 0.35)" />
        <stop offset="100%" stopColor="hsl(152 65% 9% / 0)" />
      </radialGradient>
      <linearGradient id="floor1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(152 50% 14%)" />
        <stop offset="100%" stopColor="hsl(152 65% 7%)" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#dimMoon)" />
    <rect y="140" width="200" height="60" fill="url(#floor1)" />
    {/* moon */}
    <circle data-eid-1="moon" cx="160" cy="40" r="14" fill="hsl(75 85% 70%)" opacity="0.8" />
    <circle cx="166" cy="36" r="12" fill="hsl(152 65% 9%)" />
    {/* window frame far back */}
    <rect x="20" y="40" width="40" height="60" fill="none" stroke="hsl(75 85% 60% / 0.25)" strokeWidth="1.5" />
    <line x1="40" y1="40" x2="40" y2="100" stroke="hsl(75 85% 60% / 0.25)" strokeWidth="1.5" />
    <line x1="20" y1="70" x2="60" y2="70" stroke="hsl(75 85% 60% / 0.25)" strokeWidth="1.5" />
    {/* lonely woman silhouette (hijab) */}
    <g data-eid-1="woman" transform="translate(100 145)">
      <path d="M -22 0 Q -22 -38 0 -42 Q 22 -38 22 0 Z" fill="hsl(152 60% 18%)" />
      <circle cx="0" cy="-44" r="12" fill="hsl(35 30% 70%)" />
      <path d="M -14 -50 Q 0 -62 14 -50 Q 16 -38 14 -34 L -14 -34 Q -16 -38 -14 -50 Z" fill="hsl(152 60% 18%)" />
      {/* sad tear */}
      <circle data-eid-1="tear" cx="-4" cy="-40" r="1.6" fill="hsl(200 80% 70%)" />
    </g>
    {/* falling small leaves (sadness) */}
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        data-eid-1={`leaf-${i}`}
        d="M 0 0 Q 4 -6 0 -12 Q -4 -6 0 0 Z"
        fill="hsl(75 60% 40% / 0.4)"
        transform={`translate(${40 + i * 60} ${30 + i * 10})`}
      />
    ))}
  </svg>
);

/** Chapter 2: a knock at the door, light pours in, happiness suddenly arrives */
const SceneSurprise = () => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="doorLight" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(75 85% 70%)" />
        <stop offset="100%" stopColor="hsl(35 90% 60%)" />
      </linearGradient>
      <radialGradient id="burst" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="hsl(75 85% 70% / 0.7)" />
        <stop offset="100%" stopColor="hsl(75 85% 70% / 0)" />
      </radialGradient>
    </defs>
    <rect width="200" height="200" fill="hsl(152 65% 11%)" />
    {/* door frame */}
    <rect x="60" y="40" width="80" height="140" rx="6" fill="hsl(152 55% 8%)" stroke="hsl(75 85% 60% / 0.5)" strokeWidth="1.5" />
    {/* opening door */}
    <g data-eid-2="door" style={{ transformOrigin: "60px 110px" }}>
      <rect x="60" y="40" width="80" height="140" rx="6" fill="url(#doorLight)" />
      <circle cx="128" cy="112" r="2" fill="hsl(35 40% 25%)" />
    </g>
    {/* light burst */}
    <circle data-eid-2="burst" cx="100" cy="110" r="60" fill="url(#burst)" />
    {/* sparkles */}
    {[...Array(6)].map((_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const r = 70;
      const x = 100 + Math.cos(angle) * r;
      const y = 110 + Math.sin(angle) * r;
      return (
        <g key={i} data-eid-2={`spark-${i}`} transform={`translate(${x} ${y})`}>
          <path d="M 0 -5 L 1 -1 L 5 0 L 1 1 L 0 5 L -1 1 L -5 0 L -1 -1 Z" fill="hsl(75 85% 70%)" />
        </g>
      );
    })}
    {/* hearts rising */}
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        data-eid-2={`heart-${i}`}
        d="M 0 0 C -4 -4 -8 -2 -8 2 C -8 6 0 12 0 12 C 0 12 8 6 8 2 C 8 -2 4 -4 0 0 Z"
        fill="hsl(20 95% 55%)"
        transform={`translate(${70 + i * 30} ${170})`}
      />
    ))}
  </svg>
);

/** Chapter 3: donations from many hands → flowing into one box */
const SceneDonations = () => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="heart3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(20 95% 60%)" />
        <stop offset="100%" stopColor="hsl(45 90% 60%)" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="hsl(152 65% 11%)" />
    {/* central glowing collection */}
    <circle data-eid-3="pulse" cx="100" cy="120" r="34" fill="hsl(75 85% 60% / 0.18)" />
    <circle cx="100" cy="120" r="22" fill="hsl(152 55% 8%)" stroke="hsl(75 85% 60%)" strokeWidth="1.5" />
    {/* big heart center */}
    <path
      data-eid-3="bigheart"
      d="M 100 110 C 92 100 80 104 80 116 C 80 128 100 142 100 142 C 100 142 120 128 120 116 C 120 104 108 100 100 110 Z"
      fill="url(#heart3)"
    />
    {/* incoming hearts from edges (donors) */}
    {[
      { x: 20, y: 30 },
      { x: 180, y: 30 },
      { x: 30, y: 90 },
      { x: 170, y: 90 },
      { x: 60, y: 180 },
      { x: 140, y: 180 },
    ].map((p, i) => (
      <g key={i} data-eid-3={`donor-${i}`} transform={`translate(${p.x} ${p.y})`}>
        <circle r="9" fill="hsl(75 85% 60% / 0.25)" />
        <path
          d="M 0 -2 C -3 -5 -7 -3 -7 1 C -7 5 0 10 0 10 C 0 10 7 5 7 1 C 7 -3 3 -5 0 -2 Z"
          fill="hsl(20 95% 60%)"
        />
      </g>
    ))}
    {/* dotted paths from donors to center */}
    {[
      "M 20 30 Q 60 70 100 120",
      "M 180 30 Q 140 70 100 120",
      "M 30 90 Q 60 100 100 120",
      "M 170 90 Q 140 100 100 120",
      "M 60 180 Q 80 150 100 120",
      "M 140 180 Q 120 150 100 120",
    ].map((d, i) => (
      <path
        key={i}
        data-eid-3={`path-${i}`}
        d={d}
        fill="none"
        stroke="hsl(75 85% 60%)"
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity="0.5"
      />
    ))}
  </svg>
);

/** Chapter 4: Al-Yusr truck delivers a kerton box (RTL: enters from right, exits left) */
const SceneTruck = () => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(35 90% 70%)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="hsl(152 65% 11%)" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#sky4)" />
    {/* ground line */}
    <line x1="0" y1="155" x2="200" y2="155" stroke="hsl(75 85% 60% / 0.4)" strokeWidth="1" strokeDasharray="2 3" />
    {/* destination home (left side) */}
    <g transform="translate(20 120)">
      <path d="M 0 35 L 0 15 L 18 0 L 36 15 L 36 35 Z" fill="hsl(152 50% 18%)" stroke="hsl(75 85% 60%)" strokeWidth="1.2" />
      <rect x="14" y="22" width="8" height="13" fill="hsl(75 85% 60%)" opacity="0.6" />
    </g>
    {/* truck enters from right */}
    <g data-eid-4="truck" transform="translate(220 110)">
      {/* cargo box */}
      <rect x="0" y="0" width="60" height="40" rx="3" fill="hsl(152 60% 22%)" stroke="hsl(75 85% 60%)" strokeWidth="1.5" />
      {/* yusr leaf logo */}
      <g transform="translate(30 20)">
        <path d="M -6 4 Q -6 -6 0 -8 Q 6 -6 6 4 Z" fill="hsl(75 85% 60%)" />
        <path d="M 0 -8 L 0 6" stroke="hsl(152 60% 22%)" strokeWidth="0.8" />
      </g>
      {/* cab */}
      <path d="M 60 10 L 78 10 L 86 22 L 86 40 L 60 40 Z" fill="hsl(152 55% 18%)" stroke="hsl(75 85% 60%)" strokeWidth="1.5" />
      <rect x="64" y="14" width="14" height="10" fill="hsl(35 90% 70%)" opacity="0.7" />
      {/* wheels */}
      <circle cx="14" cy="44" r="6" fill="hsl(152 65% 9%)" stroke="hsl(75 85% 60%)" strokeWidth="1.2" />
      <circle cx="74" cy="44" r="6" fill="hsl(152 65% 9%)" stroke="hsl(75 85% 60%)" strokeWidth="1.2" />
    </g>
    {/* small kerton box dropping out (animated) */}
    <g data-eid-4="box" transform="translate(110 130)">
      <rect x="-10" y="-10" width="20" height="16" fill="hsl(35 60% 40%)" stroke="hsl(75 85% 60%)" strokeWidth="1" />
      <line x1="0" y1="-10" x2="0" y2="6" stroke="hsl(75 85% 60% / 0.6)" strokeWidth="0.8" />
      <line x1="-10" y1="-2" x2="10" y2="-2" stroke="hsl(75 85% 60% / 0.6)" strokeWidth="0.8" />
    </g>
    {/* trail dust */}
    {[0, 1, 2].map((i) => (
      <circle key={i} data-eid-4={`dust-${i}`} cx={180 - i * 18} cy={158} r={2 + i} fill="hsl(75 85% 60% / 0.3)" />
    ))}
  </svg>
);

/** Chapter 5: Better life — bright home, family, plant growing */
const SceneBetterLife = () => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
    <defs>
      <radialGradient id="warm5" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="hsl(45 90% 70% / 0.5)" />
        <stop offset="100%" stopColor="hsl(152 65% 11%)" />
      </radialGradient>
    </defs>
    <rect width="200" height="200" fill="url(#warm5)" />
    {/* shelf line */}
    <line x1="20" y1="140" x2="180" y2="140" stroke="hsl(75 85% 60% / 0.5)" strokeWidth="1.2" />
    {/* family silhouettes */}
    <g data-eid-5="family" transform="translate(100 130)">
      {/* parent */}
      <circle cx="-18" cy="-32" r="8" fill="hsl(35 30% 70%)" />
      <path d="M -28 -22 Q -28 0 -18 8 Q -8 0 -8 -22 Z" fill="hsl(152 55% 22%)" />
      {/* child */}
      <circle cx="0" cy="-18" r="6" fill="hsl(35 35% 75%)" />
      <path d="M -7 -10 Q -7 6 0 10 Q 7 6 7 -10 Z" fill="hsl(20 60% 45%)" />
      {/* parent 2 */}
      <circle cx="18" cy="-32" r="8" fill="hsl(35 30% 70%)" />
      <path d="M 8 -22 Q 8 0 18 8 Q 28 0 28 -22 Z" fill="hsl(152 55% 22%)" />
      {/* heart above */}
      <path data-eid-5="heart" transform="translate(0 -55)" d="M 0 0 C -4 -4 -10 -2 -10 3 C -10 8 0 16 0 16 C 0 16 10 8 10 3 C 10 -2 4 -4 0 0 Z" fill="hsl(20 95% 60%)" />
    </g>
    {/* growing plant (right) */}
    <g data-eid-5="plant" transform="translate(165 140)" style={{ transformOrigin: "0 0" }}>
      <line x1="0" y1="0" x2="0" y2="-25" stroke="hsl(75 60% 45%)" strokeWidth="1.5" />
      <path d="M 0 -10 Q -8 -16 -10 -10 Q -4 -6 0 -10 Z" fill="hsl(75 70% 50%)" />
      <path d="M 0 -18 Q 8 -24 10 -18 Q 4 -14 0 -18 Z" fill="hsl(75 70% 55%)" />
      <path d="M 0 -25 Q -6 -32 0 -34 Q 6 -32 0 -25 Z" fill="hsl(75 80% 60%)" />
    </g>
    {/* sparkles */}
    {[...Array(5)].map((_, i) => (
      <g key={i} data-eid-5={`spark-${i}`} transform={`translate(${30 + i * 35} ${40 + (i % 2) * 20})`}>
        <path d="M 0 -3 L 1 -1 L 3 0 L 1 1 L 0 3 L -1 1 L -3 0 L -1 -1 Z" fill="hsl(75 85% 70%)" />
      </g>
    ))}
  </svg>
);

/* ---------- Main component ---------- */

export const EidJourney = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const root = useRef<HTMLElement | null>(null);

  const chapters = [
    {
      key: "lonely",
      tag: isAR ? "كانت وحيدة" : "She was alone",
      title: isAR ? "امرأة بسيطة وظروفها صعبة" : "A struggling woman, hard days",
      desc: isAR ? "أم وحيدة، والأبواب موصدة، والأمل بعيد." : "A mother on her own, doors closed, hope distant.",
      Scene: SceneLonely,
    },
    {
      key: "surprise",
      tag: isAR ? "فجأة" : "Suddenly",
      title: isAR ? "دخلت السعادة" : "Happiness knocked at her door",
      desc: isAR ? "طرقة باب… فدخل النور البيت من جديد." : "A knock at the door — and light filled the home.",
      Scene: SceneSurprise,
    },
    {
      key: "donate",
      tag: isAR ? "تبرعاتكم" : "Your donations",
      title: isAR ? "أسعدتموهم وأبدعتم" : "You gave joy and grace",
      desc: isAR ? "أيادي خيّرة من كل مكان اجتمعت في قلب واحد." : "Generous hands from everywhere united in one heart.",
      Scene: SceneDonations,
    },
    {
      key: "delivery",
      tag: isAR ? "وصلت كرتونة اليُسر" : "Yusr aid box arrived",
      title: isAR ? "كل صندوق مساعدات يحمل الأمل" : "Every aid box carries hope",
      desc: isAR ? "شاحنة اليُسر تتحرك بأمانة لتسلّم صدقتك يدًا بيد." : "Al-Yusr trucks deliver your charity hand to hand.",
      Scene: SceneTruck,
    },
    {
      key: "better",
      tag: isAR ? "وأصبحوا" : "And they became",
      title: isAR ? "حل اليُسر لتحسين ظروف المعيشة" : "Al-Yusr's solution: better living",
      desc: isAR ? "أسرة مستقرة، أطفال يبتسمون، ومستقبل ينمو." : "A stable family, smiling kids, a growing future.",
      Scene: SceneBetterLife,
    },
  ];

  useEffect(() => {
    if (typeof window === "undefined" || !root.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const dir = isAR ? -1 : 1;

      /**
       * Responsive ScrollTrigger config — narrower viewports get earlier triggers,
       * lighter scrubs, and reduced truck travel so the scene never dominates.
       */
      mm.add(
        {
          isMobile: "(max-width: 639px)",
          isTablet: "(min-width: 640px) and (max-width: 1023px)",
          isDesktop: "(min-width: 1024px)",
        },
        (ctxMM) => {
          const { isMobile, isTablet } = ctxMM.conditions as {
            isMobile: boolean;
            isTablet: boolean;
            isDesktop: boolean;
          };
          const cfg = isMobile
            ? { start: "top 92%", end: "bottom 10%", scrub: 0.35, truckX: -160, plantEnd: "center 70%" }
            : isTablet
              ? { start: "top 88%", end: "bottom 20%", scrub: 0.5, truckX: -210, plantEnd: "center 60%" }
              : { start: "top 80%", end: "bottom 30%", scrub: 0.7, truckX: -260, plantEnd: "center 55%" };

          const sceneTL = (key: string) =>
            gsap.timeline({
              defaults: { ease: "power2.out" },
              scrollTrigger: {
                trigger: `[data-eid-scene='${key}']`,
                start: cfg.start,
                end: cfg.end,
                toggleActions: "play pause resume reset",
              },
            });

      // Cards staggered entrance — replays on re-enter
      gsap.fromTo(
        "[data-eid='chapter']",
        { y: 50, x: 28 * dir, opacity: 0, scale: 0.94 },
        {
          y: 0, x: 0, opacity: 1, scale: 1, duration: 0.85, stagger: 0.14, ease: "power3.out",
          scrollTrigger: {
            trigger: "[data-eid='grid']",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );

      /* Chapter 1 — sway + tear + leaves */
      sceneTL("lonely")
        .from("[data-eid-1='woman']", { y: 24, opacity: 0, duration: 0.8 })
        .to("[data-eid-1='woman']", { y: -2, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut" }, "<")
        .fromTo("[data-eid-1='tear']",
          { y: 0, opacity: 0 },
          { y: 18, opacity: 1, duration: 1.6, repeat: -1, ease: "power1.in", repeatDelay: 1.4 }, 0.4)
        .to("[data-eid-1='moon']",
          { opacity: 0.55, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" }, 0);
      ["leaf-0", "leaf-1", "leaf-2"].forEach((k, i) => {
        gsap.fromTo(`[data-eid-1='${k}']`,
          { y: 0, x: 0, rotate: 0, opacity: 0 },
          {
            y: 140, x: i % 2 === 0 ? 12 : -12, rotate: 180, opacity: 1,
            duration: 6 + i, repeat: -1, ease: "none", delay: i * 1.2,
            scrollTrigger: { trigger: "[data-eid-scene='lonely']", start: "top 85%", toggleActions: "play pause resume reset" },
          });
      });

      /* Chapter 2 — door opens, burst, hearts rise */
      sceneTL("surprise")
        .fromTo("[data-eid-2='door']",
          { rotateY: 0, transformOrigin: "left center" },
          { rotateY: -75, duration: 1.4, ease: "power3.out" })
        .fromTo("[data-eid-2='burst']",
          { scale: 0.2, opacity: 0, transformOrigin: "100px 110px" },
          { scale: 1, opacity: 1, duration: 1, ease: "power2.out" }, "-=0.6")
        .to("[data-eid-2='burst']",
          { scale: 1.08, opacity: 0.85, duration: 1.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
      [...Array(6)].forEach((_, i) => {
        gsap.fromTo(`[data-eid-2='spark-${i}']`,
          { scale: 0, opacity: 0, transformOrigin: "center" },
          {
            scale: 1, opacity: 1, duration: 1, repeat: -1, yoyo: true, ease: "power2.out",
            delay: 0.5 + i * 0.15,
            scrollTrigger: { trigger: "[data-eid-scene='surprise']", start: "top 85%", toggleActions: "play pause resume reset" },
          });
      });
      [0, 1, 2].forEach((i) => {
        gsap.fromTo(`[data-eid-2='heart-${i}']`,
          { y: 0, opacity: 0 },
          {
            y: -150, opacity: 1, duration: 3 + i * 0.4, repeat: -1, ease: "power1.out",
            delay: 0.7 + i * 0.6,
            scrollTrigger: { trigger: "[data-eid-scene='surprise']", start: "top 85%", toggleActions: "play pause resume reset" },
          });
      });

      /* Chapter 3 — heart beat + donor pulses + dotted paths flow */
      sceneTL("donate")
        .from("[data-eid-3='bigheart']", { scale: 0, transformOrigin: "100px 122px", duration: 0.7, ease: "back.out(2)" })
        .to("[data-eid-3='bigheart']",
          { scale: 1.08, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut", transformOrigin: "100px 122px" })
        .to("[data-eid-3='pulse']",
          { scale: 1.25, opacity: 0.6, duration: 1.6, repeat: -1, yoyo: true, ease: "sine.inOut", transformOrigin: "100px 120px" }, 0);
      [0, 1, 2, 3, 4, 5].forEach((i) => {
        gsap.fromTo(`[data-eid-3='donor-${i}']`,
          { opacity: 0, scale: 0.4, transformOrigin: "center" },
          {
            opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)",
            delay: 0.3 + i * 0.12,
            scrollTrigger: { trigger: "[data-eid-scene='donate']", start: "top 85%", toggleActions: "play none none reverse" },
          });
        gsap.fromTo(`[data-eid-3='path-${i}']`,
          { strokeDashoffset: 100, opacity: 0.2 },
          {
            strokeDashoffset: 0, opacity: 0.8, duration: 2, repeat: -1, ease: "none", delay: i * 0.3,
            scrollTrigger: { trigger: "[data-eid-scene='donate']", start: "top 85%", toggleActions: "play pause resume reset" },
          });
      });

      /* Chapter 4 — TRUCK SCRUB: tied to scroll position so user "drives" the truck */
      gsap.fromTo("[data-eid-4='truck']",
        { x: 0 },
        {
          x: cfg.truckX, ease: "none",
          scrollTrigger: {
            trigger: "[data-eid-scene='delivery']",
            start: cfg.start,
            end: cfg.end,
            scrub: cfg.scrub,
          },
        });
      gsap.fromTo("[data-eid-4='box']",
        { y: -40, opacity: 0, rotate: -10, transformOrigin: "center" },
        {
          y: 0, opacity: 1, rotate: 0, ease: "bounce.out",
          scrollTrigger: {
            trigger: "[data-eid-scene='delivery']",
            start: "top 60%",
            end: "center 50%",
            scrub: cfg.scrub,
          },
        });
      [0, 1, 2].forEach((i) => {
        gsap.fromTo(`[data-eid-4='dust-${i}']`,
          { opacity: 0, scale: 0.6, transformOrigin: "center" },
          {
            opacity: 0.8, scale: 1.3, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.out", delay: i * 0.2,
            scrollTrigger: { trigger: "[data-eid-scene='delivery']", start: "top 85%", toggleActions: "play pause resume reset" },
          });
      });

      /* Chapter 5 — plant grows from scroll + heart beat + sparkles */
      gsap.fromTo("[data-eid-5='plant']",
        { scaleY: 0, transformOrigin: "0 0" },
        {
          scaleY: 1, ease: "power2.out",
          scrollTrigger: {
            trigger: "[data-eid-scene='better']",
            start: cfg.start,
            end: cfg.plantEnd,
            scrub: cfg.scrub,
          },
        });
      sceneTL("better")
        .from("[data-eid-5='family']", { y: 30, opacity: 0, duration: 0.7, ease: "power3.out" })
        .to("[data-eid-5='family']", { y: -2, duration: 2.6, repeat: -1, yoyo: true, ease: "sine.inOut" }, "<")
        .from("[data-eid-5='heart']", { scale: 0, transformOrigin: "center", duration: 0.5, ease: "back.out(2)" }, "-=0.3")
        .to("[data-eid-5='heart']",
          { scale: 1.15, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut", transformOrigin: "center" });
      [0, 1, 2, 3, 4].forEach((i) => {
        gsap.fromTo(`[data-eid-5='spark-${i}']`,
          { opacity: 0.2, scale: 0.6, transformOrigin: "center" },
          {
            opacity: 1, scale: 1.2, duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.3,
            scrollTrigger: { trigger: "[data-eid-scene='better']", start: "top 85%", toggleActions: "play pause resume reset" },
          });
      });

      /* Section header reveal */
      gsap.from("[data-eid='header'] > *", {
        y: 24, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power2.out",
        scrollTrigger: { trigger: "[data-eid='header']", start: "top 88%", toggleActions: "play none none reverse" },
      });

      /* Connecting arrows — pulse only when grid in view */
      gsap.fromTo("[data-eid='arrow']",
        { opacity: 0.3, x: -4 * dir },
        {
          opacity: 1, x: 4 * dir, duration: 1.2, repeat: -1, yoyo: true, stagger: 0.2, ease: "sine.inOut",
          scrollTrigger: { trigger: "[data-eid='grid']", start: "top 85%", toggleActions: "play pause resume reset" },
        });

      /* CTA banner reveal */
      gsap.from("[data-eid='cta']", {
        y: 30, opacity: 0, scale: 0.97, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: "[data-eid='cta']", start: "top 90%", toggleActions: "play none none reverse" },
      });

        },
      );

      ScrollTrigger.refresh();
    }, root);
    return () => {
      mm.revert();
      ctx.revert();
    };
  }, [isAR]);

  return (
    <section
      ref={root}
      className="relative overflow-hidden pattern-eid text-primary-foreground py-12 sm:py-14 md:py-20"
      aria-labelledby="eid-journey-title"
    >
      {/* subtle gradient overlay for text contrast */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[hsl(152_65%_10%)]/80 via-[hsl(152_65%_12%)]/60 to-[hsl(152_65%_10%)]/90" />
      <div aria-hidden className="pointer-events-none absolute -top-24 -start-24 hidden h-72 w-72 rounded-full border border-secondary/20 md:block" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -end-24 hidden h-72 w-72 rounded-full border border-secondary/20 md:block" />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: isAR ? "رحلة عيد الأضحى مع اليُسر" : "Eid Al-Adha journey with Al-Yusr",
          publisher: { "@type": "NGO", name: "Al-Yusr Charity Foundation" },
        })}</script>
      </Helmet>

      <div className="container relative mx-auto px-4">
        <div data-eid="header" className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-primary-foreground/5 px-3 py-1 text-[11px] font-extrabold text-secondary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {isAR ? "بدعمكم نصنع فرقًا حقيقيًا" : "With your support, real impact"}
          </span>
          <h2 id="eid-journey-title" className="mt-3 text-[1.6rem] font-black leading-[1.3] text-primary-foreground sm:text-3xl md:text-4xl">
            {isAR ? (
              <>من التبرع <span className="text-gradient-lime">إلى الأثر</span></>
            ) : (
              <>From your donation <span className="text-gradient-lime">to real impact</span></>
            )}
          </h2>
          <p className="mt-3 text-xs font-semibold text-primary-foreground/80 sm:text-sm md:text-base">
            {isAR
              ? "خمس لقطات تحكي القصة كاملة — كل صندوق مساعدات من اليُسر يحمل الأمل ويغيّر حياة أسرة."
              : "Five scenes telling the full story — every Al-Yusr aid box carries hope and changes a life."}
          </p>
        </div>

        {/* Journey grid */}
        <div data-eid="grid" className="relative mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 md:mt-14">
          {chapters.map((c, i) => (
            <div key={c.key} className="relative">
              <article data-eid="chapter" className="flex flex-col gap-3">
                {/* step badge */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-[hsl(152_55%_8%)]/80 px-2.5 py-1 text-[10px] font-extrabold text-secondary backdrop-blur">
                    <Sparkles className="h-3 w-3" />
                    {c.tag}
                  </span>
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-secondary/40 text-[10px] font-black text-secondary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <SceneFrame label={c.title} sceneKey={c.key}>
                  <c.Scene />
                </SceneFrame>
                <div className="px-1">
                  <h3 className="text-sm font-extrabold leading-snug text-primary-foreground sm:text-base">{c.title}</h3>
                  <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-primary-foreground/75 sm:text-xs">{c.desc}</p>
                </div>
              </article>
              {/* connecting arrow (RTL-aware) — between cards on lg screens */}
              {i < chapters.length - 1 && (
                <span
                  aria-hidden
                  data-eid="arrow"
                  className="pointer-events-none absolute hidden lg:flex top-[36%] -end-3 h-7 w-7 items-center justify-center rounded-full border border-secondary/40 bg-[hsl(152_55%_8%)]/90 text-secondary"
                >
                  {isAR ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5 rotate-180" />}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div data-eid="cta" className="relative mt-8 overflow-hidden rounded-3xl border border-secondary/30 bg-[hsl(152_65%_9%)]/90 p-5 text-center backdrop-blur sm:rounded-[2rem] sm:p-8 md:mt-12 md:p-10">
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(75_85%_60%/0.18),transparent_65%)]" />
          <span aria-hidden className="pointer-events-none absolute start-3 top-3 h-6 w-6 rounded-tl-2xl border-s-2 border-t-2 border-secondary/60 sm:h-8 sm:w-8" />
          <span aria-hidden className="pointer-events-none absolute end-3 top-3 h-6 w-6 rounded-tr-2xl border-e-2 border-t-2 border-secondary/60 sm:h-8 sm:w-8" />
          <span aria-hidden className="pointer-events-none absolute start-3 bottom-3 hidden h-8 w-8 rounded-bl-2xl border-s-2 border-b-2 border-secondary/60 sm:block" />
          <span aria-hidden className="pointer-events-none absolute end-3 bottom-3 hidden h-8 w-8 rounded-br-2xl border-e-2 border-b-2 border-secondary/60 sm:block" />

          <div className="relative">
            <h3 className="text-xl font-black leading-tight text-primary-foreground sm:text-3xl md:text-4xl">
              {isAR ? (<>كن جزءًا من <span className="text-gradient-lime">التغيير</span></>) : (<>Be part of <span className="text-gradient-lime">the change</span></>)}
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-xs font-semibold text-primary-foreground/85 sm:text-sm md:text-base">
              {isAR ? "تبرّع الآن، وكُن سببًا في صنع حياة أفضل." : "Donate now and be the reason for a better life."}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full bg-orange-grad px-6 text-sm font-extrabold text-accent-foreground shadow-cta animate-pulse-glow hover:opacity-95 sm:h-14 sm:w-auto sm:text-base">
                <a href="/donate" className="inline-flex items-center justify-center gap-2">
                  <Heart className="h-5 w-5" />
                  {isAR ? "تبرّع الآن" : "Donate now"}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 w-full border-secondary/40 bg-primary-foreground/5 px-6 text-sm font-extrabold text-primary-foreground backdrop-blur hover:bg-secondary/20 hover:text-primary-foreground sm:h-14 sm:w-auto sm:text-base">
                <a href="#programs" className="inline-flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {isAR ? "كل الحملات" : "View all causes"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EidJourney;
