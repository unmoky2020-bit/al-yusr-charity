/** Ramadan decorative elements: crescent, hanging lanterns (fawanees), 8-point star and a geometric band. All aria-hidden. */

export const Crescent = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <path d="M62 8a44 44 0 1 0 30 76A36 36 0 1 1 62 8Z" fill="currentColor" />
  </svg>
);

export const Star8 = ({ className = "", children }: { className?: string; children?: React.ReactNode }) => (
  <span className={`relative inline-grid place-items-center ${className}`}>
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect x="18" y="18" width="64" height="64" rx="4" fill="currentColor" />
      <rect x="18" y="18" width="64" height="64" rx="4" fill="currentColor" transform="rotate(45 50 50)" />
    </svg>
    {children !== undefined && <span className="relative">{children}</span>}
  </span>
);

/** A single fanoos on a string. `len` is the string length in px; the lantern sways from the top. */
export const Lantern = ({ len = 80, size = 56, delay = 0, live = false, className = "" }: { len?: number; size?: number; delay?: number; live?: boolean; className?: string }) => (
  <div className={`ramadan-lantern pointer-events-none ${live ? "is-live" : ""} ${className}`} style={{ animationDelay: `${delay}ms` }} aria-hidden>
    <div className="mx-auto w-px bg-[hsl(var(--gold)/0.6)]" style={{ height: len }} />
    <svg viewBox="0 0 60 100" style={{ width: size, height: size * (100 / 60) }} className="block">
      <path d="M30 2 L36 10 L24 10 Z" fill="hsl(var(--gold))" />
      <rect x="20" y="10" width="20" height="6" rx="2" fill="hsl(var(--gold))" />
      <path d="M14 16 H46 L52 30 H8 Z" fill="hsl(var(--gold))" />
      <path d="M10 30 H50 L46 72 H14 Z" fill="hsl(40 90% 70% / 0.28)" stroke="hsl(var(--gold))" strokeWidth="2.5" />
      <path d="M30 30 V72 M20 30 L22 72 M40 30 L38 72" stroke="hsl(var(--gold))" strokeWidth="1.5" />
      <ellipse cx="30" cy="52" rx="7" ry="11" fill="hsl(42 100% 75% / 0.85)" />
      <path d="M14 72 H46 L40 84 H20 Z" fill="hsl(var(--gold))" />
      <path d="M27 84 H33 L30 98 Z" fill="hsl(var(--gold))" />
    </svg>
  </div>
);

/** Repeating 8-point-star band used as a section divider. */
export const StarBand = ({ className = "" }: { className?: string }) => (
  <div className={`ramadan-band h-8 w-full ${className}`} aria-hidden />
);

/** Scattered tiny stars for night skies. */
export const NightSky = () => (
  <div className="ramadan-stars pointer-events-none absolute inset-0" aria-hidden />
);
