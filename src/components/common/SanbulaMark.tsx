import { SVGProps } from "react";

/**
 * Sanbula (wheat spike) — extracted from the Al-Yusr identity.
 * Symbol of growth, sustenance and barakah. Uses currentColor.
 */
export const SanbulaMark = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 80 120"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    {/* central stem */}
    <path d="M39 116 L41 116 L41 28 L39 28 Z" />
    {/* tip */}
    <path d="M40 8 C 36 16, 36 22, 40 28 C 44 22, 44 16, 40 8 Z" />
    {/* grain pairs — left/right alternating */}
    {Array.from({ length: 8 }).map((_, i) => {
      const y = 22 + i * 10;
      return (
        <g key={i}>
          <path
            d={`M40 ${y} C 30 ${y - 2}, 22 ${y + 2}, 18 ${y + 10} C 28 ${y + 8}, 36 ${y + 6}, 40 ${y + 4} Z`}
          />
          <path
            d={`M40 ${y} C 50 ${y - 2}, 58 ${y + 2}, 62 ${y + 10} C 52 ${y + 8}, 44 ${y + 6}, 40 ${y + 4} Z`}
          />
        </g>
      );
    })}
  </svg>
);

export default SanbulaMark;