import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-driven sticky stack (CSS-only, RTL safe).
 * Each <StickyStackItem> sticks at the top while the next one slides over it.
 * Reusable across sections (axes, seasons, etc.).
 */
export const StickyStack = ({
  children,
  className,
  gap = "mb-5 md:mb-6",
}: {
  children: ReactNode;
  className?: string;
  /** tailwind classes applied to each item wrapper for spacing between cards */
  gap?: string;
}) => (
  <div
    data-sticky-stack=""
    style={{ "--sticky-gap": gap } as CSSProperties}
    className={cn("relative", className)}
  >
    {children}
  </div>
);

export const StickyStackItem = ({
  index,
  top = "top-[84px] md:top-[96px]",
  sticky = true,
  className,
  style,
  children,
}: {
  index: number;
  /** tailwind sticky offset; defaults to header height */
  top?: string;
  /** Disable sticky per item when native scrolling should stay fully linear. */
  sticky?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    className={cn(sticky ? "sticky" : "relative", sticky && top, "mb-5 md:mb-6", className)}
    style={{ zIndex: 10 + index, ...style }}
  >
    {children}
  </div>
);

export default StickyStack;
