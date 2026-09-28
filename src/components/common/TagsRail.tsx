import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type TagsRailItem = {
  /** Stable id — used for active state (e.g. slug or "all") */
  id: string;
  label: string;
  /** Internal route. If omitted, renders as a button via `onClick`. */
  to?: string;
  /** Plain anchor href (use for in-page #hash links or external URLs) */
  href?: string;
  /** Optional click handler (for filter chips that don't navigate). */
  onClick?: () => void;
  /** Optional leading icon */
  icon?: React.ReactNode;
};

export type TagsRailProps = {
  items: TagsRailItem[];
  /** Active item id (controlled). If omitted, active is inferred from current URL. */
  activeId?: string;
  /** Accessible label for the nav wrapper */
  ariaLabel?: string;
  className?: string;
  /** Optional analytics source label propagated as data-source */
  source?: string;
};

/**
 * Reusable horizontal tag/tab rail.
 * - One row with smooth, snap-aligned horizontal scroll on mobile.
 * - Active chip is highlighted and auto-scrolled into view.
 * - Hides scrollbar; supports keyboard navigation natively (Link/button).
 */
export function TagsRail({ items, activeId, ariaLabel, className, source }: TagsRailProps) {
  const { pathname, hash } = useLocation();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);

  const inferActive = (it: TagsRailItem) => {
    if (activeId != null) return it.id === activeId;
    if (it.href && it.href.startsWith("#")) {
      return hash === it.href;
    }
    if (!it.to) return false;
    // Match exact or trailing segment
    return pathname === it.to || pathname.endsWith(`/${it.id}`);
  };

  useEffect(() => {
    const el = activeRef.current;
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    const elBox = el.getBoundingClientRect();
    const offset = el.offsetLeft - (scroller.clientWidth - elBox.width) / 2;
    scroller.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  }, [activeId, pathname, hash]);

  return (
    <nav aria-label={ariaLabel} className={cn("w-full relative", className)}>
      <div
        ref={scrollerRef}
        className="no-scrollbar flex snap-x snap-mandatory items-center justify-start gap-2 overflow-x-auto scroll-smooth overscroll-x-contain px-2 py-1.5 md:flex-wrap md:justify-center md:overflow-visible"
        style={{ WebkitOverflowScrolling: "touch" as any }}
      >
        {items.map((it) => {
          const isActive = inferActive(it);
          const base =
            "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1 text-[11.5px] sm:text-xs font-extrabold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 h-8 sm:h-8.5";
          const idle =
            "border-lime-400/50 bg-white/90 text-foreground shadow-[0_0_8px_rgba(163,230,53,0.14)] hover:-translate-y-0.5 hover:border-lime-400 hover:bg-lime-400/15 hover:shadow-[0_0_12px_rgba(163,230,53,0.28)] dark:bg-card/90 dark:border-lime-500/40 dark:text-foreground";
          const active =
            "border-orange-400 bg-orange-grad text-accent-foreground font-black shadow-[0_4px_16px_rgba(249,115,22,0.4)] scale-[1.04]";
          const classNameStr = cn(base, isActive ? active : idle);
          const refCb = (node: HTMLAnchorElement | HTMLButtonElement | null) => {
            if (isActive) activeRef.current = node;
          };
          if (it.href) {
            return (
              <a
                key={it.id}
                href={it.href}
                ref={refCb as any}
                data-source={source}
                data-label={`tag-${it.id}`}
                className={classNameStr}
              >
                {it.icon}
                {it.label}
              </a>
            );
          }
          if (it.to) {
            return (
              <Link
                key={it.id}
                to={it.to}
                ref={refCb as any}
                aria-current={isActive ? "page" : undefined}
                data-source={source}
                data-label={`tag-${it.id}`}
                className={classNameStr}
              >
                {it.icon}
                {it.label}
              </Link>
            );
          }
          return (
            <button
              key={it.id}
              type="button"
              ref={refCb as any}
              onClick={it.onClick}
              aria-pressed={isActive}
              data-source={source}
              data-label={`tag-${it.id}`}
              className={classNameStr}
            >
              {it.icon}
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}