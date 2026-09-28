import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export type MascotState = "wave" | "think" | "celebrate" | "sad" | "sleep";

/**
 * Al-Yusr Mascot — 5-state SVG character driven by GSAP.
 * States: wave | think | celebrate | sad | sleep
 */
export const CharacterMascot = ({
  className = "",
  state = "wave",
}: {
  className?: string;
  state?: MascotState;
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const tlRef = useRef<ReturnType<typeof gsap.context> | null>(null);

  // baseline ambient anims (always on)
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const ctx = gsap.context(() => {
      gsap.to(".mascot-body", {
        y: -4, scale: 1.01, transformOrigin: "center bottom",
        duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
      gsap.utils.toArray<SVGElement>(".float-leaf").forEach((leaf, i) => {
        gsap.to(leaf, {
          y: -12, rotation: i % 2 ? 12 : -12,
          duration: 2 + i * 0.3, repeat: -1, yoyo: true, ease: "sine.inOut",
          delay: i * 0.2,
        });
      });
      gsap.to(".mascot-halo", {
        scale: 1.08, opacity: 0.55, transformOrigin: "center",
        duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
    }, svg);
    return () => ctx.revert();
  }, []);

  // per-state animations
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    tlRef.current?.revert();
    const ctx = gsap.context(() => {
      // Reset transforms for state-controlled elements
      gsap.set([".mascot-arm", ".mascot-arm-left", ".mascot-head", ".mascot-eye", ".mascot-mouth-smile", ".mascot-mouth-sad", ".mascot-mouth-o", ".mascot-zzz", ".mascot-confetti", ".mascot-thought"], {
        clearProps: "all",
      });
      gsap.set([".mascot-mouth-sad", ".mascot-mouth-o", ".mascot-zzz", ".mascot-confetti", ".mascot-thought"], { opacity: 0 });
      gsap.set(".mascot-mouth-smile", { opacity: 1 });

      // shared blink (skip in sleep)
      if (state !== "sleep") {
        const blink = gsap.timeline({ repeat: -1, repeatDelay: 2.6 });
        blink.to(".mascot-eye", { scaleY: 0.05, transformOrigin: "center", duration: 0.1 })
             .to(".mascot-eye", { scaleY: 1, duration: 0.12 });
      }

      switch (state) {
        case "wave":
          gsap.to(".mascot-head", { rotation: 3, transformOrigin: "50% 80%", duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(".mascot-arm", { rotation: 22, transformOrigin: "85% 18%", duration: 0.9, repeat: -1, yoyo: true, ease: "sine.inOut" });
          break;
        case "think":
          gsap.set(".mascot-thought", { opacity: 1 });
          gsap.to(".mascot-head", { rotation: -8, transformOrigin: "50% 80%", duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(".mascot-arm", { rotation: -55, transformOrigin: "85% 18%", duration: 1.5, ease: "power2.out" });
          gsap.to(".mascot-thought circle", { scale: 1.15, transformOrigin: "center", duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.2 });
          break;
        case "celebrate":
          gsap.set(".mascot-mouth-o", { opacity: 1 });
          gsap.set(".mascot-mouth-smile", { opacity: 0 });
          gsap.set(".mascot-confetti", { opacity: 1 });
          gsap.to(".mascot-body", { y: -14, duration: 0.45, repeat: -1, yoyo: true, ease: "power2.inOut" });
          gsap.to(".mascot-arm", { rotation: -45, transformOrigin: "85% 18%", duration: 0.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(".mascot-arm-left", { rotation: 45, transformOrigin: "15% 18%", duration: 0.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.utils.toArray<SVGElement>(".mascot-confetti > *").forEach((c, i) => {
            gsap.to(c, { y: -40 - i * 5, x: (i % 2 ? 10 : -10), rotation: 360, duration: 1.2 + i * 0.1, repeat: -1, ease: "power1.out", delay: i * 0.1 });
          });
          break;
        case "sad":
          gsap.set(".mascot-mouth-smile", { opacity: 0 });
          gsap.set(".mascot-mouth-sad", { opacity: 1 });
          gsap.to(".mascot-head", { rotation: -3, y: 6, transformOrigin: "50% 80%", duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(".mascot-eye", { scaleY: 0.55, transformOrigin: "center", duration: 1.2 });
          gsap.to(".mascot-arm, .mascot-arm-left", { rotation: 0, duration: 0.5 });
          break;
        case "sleep":
          gsap.set(".mascot-zzz", { opacity: 1 });
          gsap.set(".mascot-eye", { scaleY: 0.05, transformOrigin: "center" });
          gsap.to(".mascot-head", { rotation: -10, y: 4, transformOrigin: "50% 80%", duration: 1 });
          gsap.to(".mascot-body", { scale: 0.99, y: -2, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.utils.toArray<SVGElement>(".mascot-zzz text").forEach((z, i) => {
            gsap.fromTo(z, { y: 0, opacity: 0 }, { y: -30, opacity: 1, duration: 1.6, repeat: -1, delay: i * 0.5, ease: "power1.out", repeatDelay: 0.3 });
          });
          break;
      }
    }, svg);
    tlRef.current = ctx;
    return () => ctx.revert();
  }, [state]);

  return (
      <svg
      ref={ref}
      viewBox="0 0 400 460"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="شخصية اليسر — طفل مبتسم يلوّح"
    >
      <defs>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(75 85% 60%)" stopOpacity="0.55" />
          <stop offset="60%" stopColor="hsl(75 85% 60%)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(75 85% 60%)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hoodie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(150 55% 28%)" />
          <stop offset="100%" stopColor="hsl(152 65% 18%)" />
        </linearGradient>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3c9a3" />
          <stop offset="100%" stopColor="#e2a87a" />
        </linearGradient>
        <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(75 85% 65%)" />
          <stop offset="100%" stopColor="hsl(85 70% 45%)" />
        </linearGradient>
      </defs>

      {/* halo */}
      <circle className="mascot-halo" cx="200" cy="220" r="170" fill="url(#halo)" />

      {/* floating leaves */}
      <g className="float-leaf" transform="translate(60 90)">
        <path d="M0 0 C10 -18 30 -18 40 0 C30 12 10 12 0 0 Z" fill="url(#leafG)" />
      </g>
      <g className="float-leaf" transform="translate(320 110)">
        <path d="M0 0 C10 -18 30 -18 40 0 C30 12 10 12 0 0 Z" fill="url(#leafG)" />
      </g>
      <g className="float-leaf" transform="translate(330 280)">
        <path d="M0 0 C8 -14 24 -14 32 0 C24 10 8 10 0 0 Z" fill="url(#leafG)" />
      </g>
      <g className="float-leaf" transform="translate(50 300)">
        <path d="M0 0 C8 -14 24 -14 32 0 C24 10 8 10 0 0 Z" fill="url(#leafG)" />
      </g>

      {/* body / hoodie */}
      <g className="mascot-body">
        {/* hoodie body */}
        <path
          d="M120 320 Q120 240 200 240 Q280 240 280 320 L295 430 Q200 450 105 430 Z"
          fill="url(#hoodie)"
        />
        {/* hoodie pocket */}
        <path d="M150 360 Q200 345 250 360 L245 395 Q200 385 155 395 Z"
              fill="hsl(152 65% 14%)" opacity="0.6" />

        {/* arm waving */}
        <g className="mascot-arm">
          <path d="M270 270 Q310 250 320 200 Q325 175 305 165 Q285 175 280 220 Z"
                fill="url(#hoodie)" />
          <circle cx="306" cy="160" r="16" fill="url(#skin)" />
        </g>

        {/* other arm */}
        <g className="mascot-arm-left">
          <path d="M130 270 Q105 280 110 320 Q120 340 140 335 Q140 305 145 280 Z"
                fill="url(#hoodie)" />
          <circle cx="118" cy="318" r="14" fill="url(#skin)" />
        </g>

        {/* head */}
        <g className="mascot-head">
          {/* hood back */}
          <ellipse cx="200" cy="170" rx="92" ry="80" fill="hsl(150 55% 25%)" />
          {/* face */}
          <ellipse cx="200" cy="180" rx="68" ry="74" fill="url(#skin)" />
          {/* hair fringe */}
          <path d="M138 140 Q200 105 262 140 Q260 165 238 160 Q220 145 200 152 Q180 145 162 160 Q140 165 138 140 Z"
                fill="#3a2418" />

          {/* eyes */}
          <ellipse className="mascot-eye" cx="178" cy="190" rx="6" ry="9" fill="#1a1208" />
          <ellipse className="mascot-eye" cx="222" cy="190" rx="6" ry="9" fill="#1a1208" />
          <circle cx="180" cy="187" r="2" fill="#fff" />
          <circle cx="224" cy="187" r="2" fill="#fff" />

          {/* cheeks */}
          <circle cx="165" cy="215" r="9" fill="hsl(22 88% 70%)" opacity="0.55" />
          <circle cx="235" cy="215" r="9" fill="hsl(22 88% 70%)" opacity="0.55" />

          {/* mouths (toggleable) */}
          <path className="mascot-mouth-smile" d="M183 225 Q200 240 217 225"
                stroke="#1a1208" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path className="mascot-mouth-sad" d="M183 235 Q200 220 217 235"
                stroke="#1a1208" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0" />
          <ellipse className="mascot-mouth-o" cx="200" cy="230" rx="9" ry="11"
                   fill="#3a1d12" stroke="#1a1208" strokeWidth="2" opacity="0" />

          {/* hood top with leaf */}
          <path d="M195 92 Q205 72 220 80 Q218 95 208 100 Q198 100 195 92 Z" fill="url(#leafG)" />
        </g>
      </g>

      {/* Thought bubbles (think state) */}
      <g className="mascot-thought" opacity="0">
        <circle cx="310" cy="120" r="6" fill="#fff" stroke="hsl(150 55% 25%)" strokeWidth="2" />
        <circle cx="328" cy="100" r="9" fill="#fff" stroke="hsl(150 55% 25%)" strokeWidth="2" />
        <circle cx="350" cy="70" r="22" fill="#fff" stroke="hsl(150 55% 25%)" strokeWidth="2.5" />
        <text x="350" y="78" textAnchor="middle" fontSize="22" fill="hsl(150 55% 25%)" fontWeight="800">?</text>
      </g>

      {/* Confetti (celebrate state) */}
      <g className="mascot-confetti" opacity="0">
        <rect x="100" y="120" width="8" height="14" rx="2" fill="hsl(75 85% 55%)" />
        <rect x="290" y="130" width="8" height="14" rx="2" fill="hsl(22 88% 60%)" />
        <rect x="160" y="100" width="6" height="12" rx="2" fill="hsl(75 85% 55%)" />
        <rect x="240" y="110" width="6" height="12" rx="2" fill="hsl(22 88% 60%)" />
        <circle cx="80" cy="160" r="5" fill="hsl(75 85% 55%)" />
        <circle cx="320" cy="170" r="5" fill="hsl(22 88% 60%)" />
      </g>

      {/* Zzz (sleep state) */}
      <g className="mascot-zzz" opacity="0" fill="hsl(150 55% 25%)" fontWeight="800">
        <text x="290" y="120" fontSize="22">z</text>
        <text x="310" y="100" fontSize="28">Z</text>
        <text x="335" y="80" fontSize="34">Z</text>
      </g>
    </svg>
  );
};
