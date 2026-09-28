import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MarqueeTag = {
  label: string;
  href: string;
  /** Flagship programs get an accent dot to stand out without an emoji. */
  featured?: boolean;
};

/**
 * Seamless infinite marquee row. The track contains the items twice and
 * translates from 0 → -50%, which loops perfectly without a visible jump.
 * Direction is independent of document dir: `reverse` flips travel direction,
 * so a pair of rows always moves in opposite directions in both RTL and LTR.
 */
export const TagMarquee = ({
  tags,
  reverse = false,
  duration = 38,
  className,
}: {
  tags: MarqueeTag[];
  reverse?: boolean;
  /** seconds for one full loop */
  duration?: number;
  Arrow?: LucideIcon;
  className?: string;
}) => {
  if (!tags.length) return null;
  return (
    <div
      dir="ltr"
      className={cn(
        "group relative w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        className,
      )}
    >
      <div
        className="flex w-max items-center gap-2 will-change-transform sm:gap-2.5"
        style={{
          animation: `tag-marquee ${duration}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
          animationPlayState: "running",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
      >
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {tags.map((t) => (
              <Link
                key={`${copy}-${t.href}-${t.label}`}
                to={t.href}
                tabIndex={copy === 1 ? -1 : 0}
                className="group/tag inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/10 bg-gradient-to-b from-card to-card/85 px-3 py-1.5 text-[11.5px] font-extrabold text-primary shadow-[0_4px_14px_-6px_hsl(var(--primary)/0.25)] ring-1 ring-primary/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/40 hover:from-secondary/15 hover:to-secondary/5 hover:text-primary hover:shadow-[0_8px_20px_-8px_hsl(var(--secondary)/0.55)] hover:ring-secondary/40 sm:px-3.5 sm:py-2 sm:text-[12.5px]"
              >
                {t.featured && (
                  <span
                    aria-hidden
                    className="inline-block shrink-0 h-2 w-2 rounded-full bg-accent shadow-[0_0_0_3px_hsl(var(--accent)/0.18),0_0_12px_hsl(var(--accent)/0.85)] transition-transform duration-300 group-hover/tag:scale-150"
                  />
                )}
                <span>{t.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tag-marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-tag-marquee] > div { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TagMarquee;