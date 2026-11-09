/**
 * The foundation's mark with a thin moving line: the only "busy" picture of the site (boot splash,
 * route loading, payment confirmation). Purely visual; the caller provides the accessible text.
 */
export function LoadingMark({ className = "" }: { className?: string }) {
  return (
    <div className={`grid justify-items-center gap-4 ${className}`} aria-hidden="true">
      <img
        src="/icons/icon-144.png"
        alt=""
        width={64}
        height={64}
        className="h-16 w-16 rounded-full motion-safe:animate-[yusr-pulse_1.6s_ease-in-out_infinite]"
      />
      <span className="relative block h-[3px] w-28 overflow-hidden rounded-full bg-primary/10">
        <span className="absolute inset-y-0 w-2/5 rounded-full bg-primary motion-safe:animate-[yusr-slide_1.2s_ease-in-out_infinite]" />
      </span>
    </div>
  );
}
