import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * Lightweight scroll-reveal. Drives opacity / translateY / scale from the
 * element's own scroll progress so it eases in as it enters the viewport
 * and settles cleanly — without breaking sibling layout or overflow.
 *
 * Use for panels and cards where a full 3D ContainerScroll would be too heavy.
 */
export const ScrollReveal = ({
  children,
  className = "",
  intensity = "soft",
  as = "div",
  fade = true,
  rotate3d = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** soft = subtle (panels), medium = noticeable, strong = hero-ish */
  intensity?: "soft" | "medium" | "strong";
  as?: "div" | "section";
  /** when false, content stays fully opaque and only translates/scales */
  fade?: boolean;
  /** when true, adds a cinematic rotateX tilt (20° → 0°) anchored to scroll */
  rotate3d?: boolean;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "start 35%"],
  });

  const cfg = {
    soft:   { y: 28, s: [0.985, 1] as [number, number] },
    medium: { y: 48, s: [0.96, 1]  as [number, number] },
    strong: { y: 80, s: [0.92, 1]  as [number, number] },
  }[intensity];

  const opacityMV = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y       = useTransform(scrollYProgress, [0, 1], [cfg.y, 0]);
  const scale   = useTransform(scrollYProgress, [0, 1], cfg.s);
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);

  const MotionTag = as === "section" ? motion.section : motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag className={className} ref={ref as any}>{children}</Tag>;
  }
  const baseStyle = fade ? { opacity: opacityMV, y, scale } : { y, scale };
  const finalStyle = rotate3d ? { ...baseStyle, rotateX, transformPerspective: 1200 } : baseStyle;
  return (
    <MotionTag
      ref={ref as any}
      style={finalStyle as any}
      className={className}
    >
      {children}
    </MotionTag>
  );
};

export default ScrollReveal;
