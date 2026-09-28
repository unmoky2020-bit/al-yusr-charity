/** Decorative tileable leaf SVG pattern overlay (very subtle). */
export const LeafPattern = ({ className = "", opacity = 0.07 }: { className?: string; opacity?: number }) => (
  <svg
    aria-hidden
    className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    style={{ opacity }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="leafTile" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <path
          d="M40 18 C 50 8 64 12 60 28 C 70 32 70 50 56 50 C 56 64 38 66 36 52 C 22 56 16 38 30 34 C 26 18 36 12 40 18 Z"
          fill="currentColor"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#leafTile)" />
  </svg>
);
