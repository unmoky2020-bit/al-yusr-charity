import { useEffect, useRef, useState } from "react";
import { formatNumberEN } from "@/lib/utils";

/**
 * Smoothly counts from 0 to `end` over `duration` ms once the element
 * enters the viewport. Plays only once. Respects prefers-reduced-motion.
 *
 * Locale-formats the number with thousands separators automatically.
 */
export const CountUp = ({
  end,
  duration = 450,
  className,
  prefix = "",
  suffix = "",
  locale,
}: {
  end: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  locale?: string;
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const playedRef = useRef(false);

  const effectiveDuration = duration || Math.min(1200, Math.max(450, String(Math.abs(end)).length * 140));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const run = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      if (reduce || end === 0) {
        setValue(end);
        return;
      }
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / effectiveDuration);
        // easeOutCubic for a confident settle
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(end * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.05, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumberEN(value)}
      {suffix}
    </span>
  );
};

export default CountUp;
