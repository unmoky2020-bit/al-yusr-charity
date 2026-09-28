import { SVGProps } from "react";

/**
 * Twin-leaf mark extracted from the Al-Yusr logo.
 * Two stylized leaves growing from a single stem — symbol of growth & charity.
 * Solid color via `currentColor` so it inherits text color (use text-secondary for lime).
 */
export const BrandLeaf = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 64 64"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    {/* Left leaf */}
    <path d="M30 58 C 18 50, 10 38, 12 22 C 14 14, 20 10, 28 12 C 30 24, 32 40, 30 58 Z" />
    {/* Right leaf */}
    <path d="M34 58 C 46 50, 54 38, 52 22 C 50 14, 44 10, 36 12 C 34 24, 32 40, 34 58 Z" />
    {/* Stem highlight */}
    <path d="M31 58 L33 58 L33 30 L31 30 Z" opacity="0.0" />
  </svg>
);

export default BrandLeaf;